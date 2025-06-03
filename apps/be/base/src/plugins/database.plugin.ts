import { Express } from 'express';
import { BasePlugin } from '@mono/be-core';
import { DatabaseManager } from '@thrilled/databases';
import { DatabaseManagerConfig } from '@thrilled/be-types';
import {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD
} from '@config';

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
            host: POSTGRES_HOST || 'localhost',
            port: parseInt(POSTGRES_PORT || '5432'),
            database: POSTGRES_DB || 'thrilled_dev',
            username: POSTGRES_USER || 'postgres',
            password: POSTGRES_PASSWORD || 'postgres',
            ssl: process.env.NODE_ENV === 'production',
            pool: {
              min: 2,
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 5000,
            }
          }
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
          timeout: 5000,   // 5 seconds
        },
        cache: {
          host: REDIS_HOST || 'localhost',
          port: parseInt(REDIS_PORT || '6379'),
          password: REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0'),
          keyPrefix: `thrilled:${process.env.NODE_ENV || 'dev'}:`,
          ttl: 3600, // 1 hour default
          maxRetries: 3,
          retryDelay: 1000,
        }
      };

      // Initialize the DatabaseManager
      this.databaseManager = new DatabaseManager(dbConfig, this.logger);
      await this.databaseManager.initialize();

      this.logger.info('DatabaseManager initialized successfully');
    } catch (error) {
      this.logger.error('Database initialization failed', { error });
      // Don't throw error - allow app to start even if DB is down
      // This enables API endpoints that don't need DB to still work
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
