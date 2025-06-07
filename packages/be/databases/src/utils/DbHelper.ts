import { PoolClient } from 'pg';
import { DatabaseManager } from '../managers/DatabaseManager.js';
import { Logger } from '@mono/be-core';

/**
 * Static database helper utility that provides a simplified interface
 * for common database operations. This utility uses the DatabaseManager
 * internally but provides a static API similar to the legacy DbHelper.
 */
export class DbHelper {
  private static instance: DatabaseManager | null = null;
  private static logger: Logger | null = null;

  /**
   * Initialize the DbHelper with a DatabaseManager instance
   * This should be called during application startup
   */
  public static initialize(databaseManager: DatabaseManager, logger: Logger): void {
    this.instance = databaseManager;
    this.logger = logger;
  }

  /**
   * Get the DatabaseManager instance
   * @throws Error if not initialized
   */
  private static getInstance(): DatabaseManager {
    if (!this.instance) {
      throw new Error('DbHelper not initialized. Call DbHelper.initialize() first.');
    }
    return this.instance;
  }

  /**
   * Get the logger instance
   * @throws Error if not initialized
   */
  private static getLogger(): Logger {
    if (!this.logger) {
      throw new Error('DbHelper not initialized. Call DbHelper.initialize() first.');
    }
    return this.logger;
  }

  /**
   * Execute database operations within a transaction
   * @param callback Function containing database operations to execute within transaction
   * @param connectionName Optional connection name to use
   * @returns Result of the callback function
   */
  public static async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    connectionName?: string
  ): Promise<T> {
    const dbManager = this.getInstance();
    
    // Create an adapter to convert DatabaseClient back to PoolClient
    return await dbManager.withTransaction(async (databaseClient) => {
      // The DatabaseClient is actually a PoolClient from pg, so we can safely cast it
      const poolClient = databaseClient as unknown as PoolClient;
      return await callback(poolClient);
    }, connectionName);
  }

  /**
   * Execute a parameterized SQL query safely
   * @param text SQL query text with parameterized placeholders
   * @param params Array of parameter values
   * @param client Optional database client (for use within transactions)
   * @param connectionName Optional connection name to use (ignored if client is provided)
   * @returns Query result
   */
  public static async query<T = unknown>(
    text: string,
    params: unknown[] = [],
    client?: PoolClient,
    connectionName?: string
  ): Promise<{ rows: T[]; rowCount: number; command: string }> {
    // If a client is provided (transaction context), use it directly
    if (client) {
      const logger = this.getLogger();
      try {
        const result = await client.query(text, params);
        return {
          rows: result.rows,
          rowCount: result.rowCount || 0,
          command: result.command,
        };
      } catch (error) {
        logger.error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
        logger.error(`Query text: ${text}`);
        logger.error(`Query params: ${JSON.stringify(params)}`);
        throw error;
      }
    }

    // Otherwise use the DatabaseManager's query method
    const dbManager = this.getInstance();
    return await dbManager.query<T>(text, params, connectionName);
  }
}
