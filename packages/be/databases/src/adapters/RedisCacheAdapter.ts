import type { Redis } from 'ioredis';
import type { CacheManager } from '../cache/CacheManager.js';
import type { Logger } from '@mono/be-core';

/**
 * Redis adapter that uses the centralized CacheManager but provides
 * Redis client interface for compatibility with components that need
 * direct Redis operations not covered by the basic cache interface.
 */
export class RedisCacheAdapter {
  private cacheManager: CacheManager;
  private logger: Logger;

  constructor(cacheManager: CacheManager, logger: Logger) {
    this.cacheManager = cacheManager;
    this.logger = logger;
  }

  /**
   * Get the underlying Redis client for direct operations
   * This allows JWTProvider and other components to use Redis-specific operations
   * like setex, smembers, srem, ttl that aren't exposed by the basic cache interface
   */
  getRedisClient(): Redis | null {
    const client = this.cacheManager.getRedisClient();
    if (!client) {
      this.logger.warn('Redis client not available from CacheManager');
    }
    return client;
  }

  /**
   * Basic cache operations delegated to CacheManager
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    return this.cacheManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cacheManager.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.cacheManager.keys(pattern);
  }

  /**
   * Check if cache manager is connected
   */
  isConnected(): boolean {
    return this.cacheManager.getConnectionStatus();
  }

  /**
   * Ping the cache to check connectivity
   */
  async ping(): Promise<string> {
    return this.cacheManager.ping();
  }
}
