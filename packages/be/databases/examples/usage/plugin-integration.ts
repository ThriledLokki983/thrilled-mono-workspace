import { BasePlugin } from '@mono/be-core';
import { Express } from 'express';
import { DatabaseManager, CacheManager, MigrationRunner } from '../../src';
import { DatabaseManagerConfig } from '@thrilled/be-types';

/**
 * Example plugin for integrating the database package with be-core applications
 */
export class DatabasePlugin extends BasePlugin {
  readonly name = 'database';
  readonly version = '1.0.0';

  private dbManager?: DatabaseManager;
  private cacheManager?: CacheManager;
  private migrationRunner?: MigrationRunner;

  constructor(private config: DatabaseManagerConfig) {
    super();
  }

  protected async setup(): Promise<void> {
    this.logger.info('Initializing database plugin...');

    try {
      // Initialize database manager
      this.dbManager = new DatabaseManager(this.config, this.logger);
      await this.dbManager.initialize();
      this.logger.info('Database manager initialized');

      // Initialize cache manager if configured
      if (this.config.cache) {
        this.cacheManager = new CacheManager(this.config.cache, this.logger);
        await this.cacheManager.initialize();
        this.logger.info('Cache manager initialized');
      }

      // Run migrations if configured
      if (this.config.migrations) {
        this.migrationRunner = new MigrationRunner(
          this.dbManager.getConnection(),
          this.config.migrations,
          this.logger
        );

        await this.migrationRunner.runMigrations();
        this.logger.info('Migrations completed successfully');
      }

      this.logger.info('Database plugin initialized successfully');
    } catch (error) {
      this.logger.error('Database plugin initialization failed', { error });
      throw error;
    }
  }

  protected registerMiddleware(app: any): void {
    // Add database and cache to request context
    app.use((req, res, next) => {
      // Extend request with database and cache instances
      (req as any).db = this.dbManager;
      (req as any).cache = this.cacheManager;
      next();
    });

    // Health check endpoint
    app.get('/health/database', async (req, res) => {
      try {
        const health = await this.dbManager?.getHealthCheck();
        res.json({
          status: health?.status || 'unknown',
          database: health,
          cache: this.cacheManager
            ? {
                status: 'connected', // Could add actual health check
              }
            : null,
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  protected async teardown(): Promise<void> {
    this.logger.info('Shutting down database plugin...');

    try {
      if (this.cacheManager) {
        await this.cacheManager.disconnect();
        this.logger.info('Cache manager disconnected');
      }

      if (this.dbManager) {
        await this.dbManager.close();
        this.logger.info('Database manager disconnected');
      }
    } catch (error) {
      this.logger.error('Error during database plugin teardown', { error });
    }
  }

  // Getter methods for accessing database components
  getDatabaseManager(): DatabaseManager | undefined {
    return this.dbManager;
  }

  getCacheManager(): CacheManager | undefined {
    return this.cacheManager;
  }

  getMigrationRunner(): MigrationRunner | undefined {
    return this.migrationRunner;
  }
}

// Example usage in an application
export function createDatabasePlugin(
  config: DatabaseManagerConfig
): DatabasePlugin {
  return new DatabasePlugin(config);
}
