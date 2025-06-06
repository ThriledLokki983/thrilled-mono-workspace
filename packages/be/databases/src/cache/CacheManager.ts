import { Redis } from 'ioredis';
import type { CacheConfig, CacheOperations } from '@thrilled/be-types';
import type { Logger } from '@mono/be-core';

export class CacheManager implements CacheOperations {
  private client: Redis | null = null;
  private isConnected = false;
  private keyPrefix: string;
  private defaultTTL: number;

  constructor(private config: CacheConfig, private logger: Logger) {
    this.keyPrefix = config.keyPrefix || '';
    this.defaultTTL = config.ttl || 3600; // 1 hour default
  }

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Redis connection...');

      this.client = new Redis({
        host: this.config.host || 'localhost',
        port: this.config.port || 6379,
        password: this.config.password,
        db: this.config.db || 0,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          this.logger.debug(`Redis retry attempt ${times}, delay: ${delay}ms`);
          return delay;
        },
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Connect to Redis
      if (this.client) {
        await this.client.connect();
        await this.ping();
        this.isConnected = true;
        this.logger.info('Redis connection established successfully');
      }
    } catch (error: unknown) {
      this.logger.error('Failed to initialize Redis connection:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set up Redis event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      this.logger.info('Redis client ready');
      this.isConnected = true;
    });

    this.client.on('error', (error: Error) => {
      this.logger.error('Redis client error:', { error: error.message });
      this.isConnected = false;
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis client reconnecting...');
    });
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<string> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return await this.client.ping();
  }

  /**
   * Get a value from cache
   */
  async get<T = string>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Cache not connected, returning null for key:', { key });
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      const value = await this.client.get(fullKey);

      if (value === null) {
        return null;
      }

      // Try to parse as JSON, fall back to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error: unknown) {
      this.logger.error('Cache get error:', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Cache not connected, skipping set for key:', { key });
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      const cacheTTL = ttl || this.defaultTTL;

      await this.client.setex(fullKey, cacheTTL, serializedValue);
    } catch (error: unknown) {
      this.logger.error('Cache set error:', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Cache not connected, skipping delete for key:', {
        key,
      });
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      await this.client.del(fullKey);
    } catch (error: unknown) {
      this.logger.error('Cache delete error:', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key);
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error: unknown) {
      this.logger.error('Cache exists error:', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected || !this.client) {
      this.logger.warn(
        'Cache not connected, returning empty array for pattern:',
        { pattern }
      );
      return [];
    }

    try {
      const fullPattern = this.keyPrefix
        ? `${this.keyPrefix}:${pattern}`
        : pattern;
      const keys = await this.client.keys(fullPattern);

      // Remove prefix from returned keys if present
      if (this.keyPrefix) {
        const prefixLength = this.keyPrefix.length + 1; // +1 for the colon
        return keys.map((key: string) => key.substring(prefixLength));
      }

      return keys;
    } catch (error: unknown) {
      this.logger.error('Cache keys error:', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Flush all keys from the cache
   */
  async flushAll(): Promise<void> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Cache not connected, skipping flushAll');
      return;
    }

    try {
      await this.client.flushall();
      this.logger.info('Flushed all keys from cache');
    } catch (error: unknown) {
      this.logger.error('Cache flushAll error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Clear all keys with the configured prefix
   */
  async clear(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      this.logger.warn('Cache not connected, skipping clear');
      return false;
    }

    try {
      const pattern = this.keyPrefix ? `${this.keyPrefix}*` : '*';
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.info(`Cleared ${keys.length} keys from cache`);
      }

      return true;
    } catch (error: unknown) {
      this.logger.error('Cache clear error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ connected: boolean; keyCount: number }> {
    if (!this.isConnected || !this.client) {
      return { connected: false, keyCount: 0 };
    }

    try {
      const pattern = this.keyPrefix ? `${this.keyPrefix}*` : '*';
      const keys = await this.client.keys(pattern);

      return {
        connected: this.isConnected,
        keyCount: keys.length,
      };
    } catch (error: unknown) {
      this.logger.error('Cache stats error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { connected: false, keyCount: 0 };
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      this.logger.info('Disconnecting from Redis...');
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Alias for disconnect for compatibility
   */
  async close(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Generate full key with prefix
   */
  private getFullKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
