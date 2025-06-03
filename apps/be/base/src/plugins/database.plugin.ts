import { Express } from 'express';
import { BasePlugin } from '@mono/be-core';
import { initializeDatabase } from '@/database';

export class DatabasePlugin extends BasePlugin {
  readonly name = 'database';
  readonly version = '1.0.0';

  protected async setup(config: unknown): Promise<void> {
    this.logger.info('Initializing database plugin...');

    try {
      await initializeDatabase();
      this.logger.info('Database initialized successfully');
    } catch (error) {
      this.logger.error('Database initialization failed', { error });
      // Don't throw error - allow app to start even if DB is down
      // This enables API endpoints that don't need DB to still work
    }
  }

  protected registerMiddleware(app: Express): void {
    // Database middleware can be added here if needed
    // For example: connection pooling, transaction middleware, etc.
  }
}
