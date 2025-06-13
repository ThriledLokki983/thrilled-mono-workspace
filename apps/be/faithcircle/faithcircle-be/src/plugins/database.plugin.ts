import { Express } from 'express';
import { Container } from 'typedi';
import { BasePlugin } from '@mono/be-core';
import { DatabaseManager, DbHelper } from '@thrilled/databases';
import { DatabaseManagerConfig } from '@thrilled/be-types';
import { DB_CONFIG, env } from '../config';

/**
 * Plugin for managing database connections and operations.
 * This plugin initializes a DatabaseManager instance, sets up DbHelper,
 * and registers a CacheManager with TypeDI for caching operations.
 */
export class DatabasePlugin extends BasePlugin {
  readonly name = 'database';
  readonly version = '2.0.0';

  private databaseManager?: DatabaseManager;

  protected async setup(config: unknown): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _configUnused = config;
    this.logger.info('Initializing database plugin with new DatabaseManager...');

    try {
      // Create configuration for the new DatabaseManager
      const dbConfig: DatabaseManagerConfig = {
        connections: {
          primary: {
            host: DB_CONFIG.POSTGRES_HOST,
            port: DB_CONFIG.POSTGRES_PORT,
            database: DB_CONFIG.POSTGRES_DB,
            username: DB_CONFIG.POSTGRES_USER,
            password: DB_CONFIG.POSTGRES_PASSWORD,
            ssl: process.env.NODE_ENV === 'production',
            pool: {
              min: 2,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
            },
          },
        },
        default: 'primary',
        migrations: {
          directory: './migrations',
          tableName: 'pgmigrations',
        },
        autoCreateDatabase: true,
        healthCheck: {
          enabled: true,
          interval: 30000, // 30 seconds
          timeout: 5000, // 5 seconds
        },
        cache: {
          host: DB_CONFIG.REDIS_HOST,
          port: DB_CONFIG.REDIS_PORT,
          password: DB_CONFIG.REDIS_PASSWORD,
          db: env.REDIS_DB,
          keyPrefix: `thrilled:${env.NODE_ENV}:`,
          ttl: 3600, // 1 hour default
          maxRetries: 3,
          retryDelay: 1000,
        },
      };

      // Initialize the DatabaseManager
      this.databaseManager = new DatabaseManager(dbConfig, this.logger);
      await this.databaseManager.initialize();
      this.logger.info('DatabaseManager initialized successfully');

      // Initialize the static DbHelper with the DatabaseManager instance
      DbHelper.initialize(this.databaseManager, this.logger);
      this.logger.info('DbHelper initialized with DatabaseManager');

      // Register CacheManager with TypeDI if cache is available
      if (this.databaseManager && dbConfig.cache) {
        try {
          const cacheManager = this.databaseManager.getCache();
          Container.set('cacheManager', cacheManager);
          this.logger.info('CacheManager registered with TypeDI container');
        } catch (error) {
          this.logger.warn('Failed to register CacheManager with TypeDI', { error });
        }
      }
    } catch (error) {
      // Don't throw error - allow app to start even if DB is down
      // This enables API endpoints that don't need DB to still work
      this.logger.error('Database initialization failed', { error });

      // Try to register a dummy cache manager to prevent container lookup failures
      try {
        if (!Container.has('cacheManager')) {
          this.logger.info('Registering fallback cache manager to prevent container errors');
          // Create a minimal cache manager that doesn't require Redis
          const dummyCacheManager = {
            get: async <T>(): Promise<T | null> => null,
            set: async (): Promise<void> => { /* no-op */ },
            del: async (): Promise<void> => { /* no-op */ },
            exists: async (): Promise<boolean> => false,
            keys: async (): Promise<string[]> => [],
            flushAll: async (): Promise<void> => { /* no-op */ },
            getRedisClient: (): null => null,
            getConnectionStatus: (): boolean => false,
            ping: async (): Promise<string> => 'PONG'
          };
          Container.set('cacheManager', dummyCacheManager);
          this.logger.info('Fallback cache manager registered with TypeDI container');
        }
      } catch (fallbackError) {
        this.logger.error('Failed to register fallback cache manager', { fallbackError });
      }
    }
  }

  protected registerMiddleware(app: Express): void {
    // Add database manager to app locals for access in routes
    if (this.databaseManager) {
      app.locals.databaseManager = this.databaseManager;
      this.logger.debug('DatabaseManager registered in app.locals');
    }
  }

  /**
   * Get the database manager instance
   */
  getDatabaseManager(): DatabaseManager | undefined {
    return this.databaseManager;
  }

  /**
   * Cleanup when plugin is destroyed
   */
  async destroy(): Promise<void> {
    if (this.databaseManager) {
      await this.databaseManager.close();
      this.logger.info('DatabaseManager closed');
    }
  }
}
