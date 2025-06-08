import { Pool } from 'pg';
import { Logger } from '@mono/be-core';
import { DatabaseConnectionConfig } from '@thrilled/be-types';

/**
 * Database connection utilities
 */
export class DatabaseUtils {
  /**
   * Check if database exists
   */
  static async databaseExists(
    pool: Pool,
    databaseName: string,
    logger: Logger
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [databaseName]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error checking if database exists: ${databaseName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Create database if it doesn't exist
   */
  static async createDatabaseIfNotExists(
    pool: Pool,
    databaseName: string,
    logger: Logger,
    options: {
      encoding?: string;
      template?: string;
      owner?: string;
    } = {}
  ): Promise<boolean> {
    try {
      const exists = await this.databaseExists(pool, databaseName, logger);

      if (exists) {
        logger.debug(`Database '${databaseName}' already exists`);
        return false;
      }

      let query = `CREATE DATABASE "${databaseName}"`;
      const queryParts: string[] = [];

      if (options.encoding) {
        queryParts.push(`ENCODING '${options.encoding}'`);
      }
      if (options.template) {
        queryParts.push(`TEMPLATE ${options.template}`);
      }
      if (options.owner) {
        queryParts.push(`OWNER ${options.owner}`);
      }

      if (queryParts.length > 0) {
        query += ` WITH ${queryParts.join(' ')}`;
      }

      await pool.query(query);
      logger.info(`Database '${databaseName}' created successfully`);
      return true;
    } catch (error) {
      logger.error(`Database '${databaseName}' already exist:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Drop database
   */
  static async dropDatabase(
    pool: Pool,
    databaseName: string,
    logger: Logger
  ): Promise<boolean> {
    try {
      const exists = await this.databaseExists(pool, databaseName, logger);

      if (!exists) {
        logger.debug(`Database '${databaseName}' does not exist`);
        return false;
      }

      await pool.query(`DROP DATABASE "${databaseName}"`);
      logger.info(`Database '${databaseName}' dropped successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to drop database '${databaseName}':`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if table exists
   */
  static async tableExists(
    pool: Pool,
    tableName: string,
    schema = 'public',
    logger: Logger
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT 1 FROM information_schema.tables 
         WHERE table_schema = $1 AND table_name = $2`,
        [schema, tableName]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error(`Error checking if table exists: ${tableName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get table columns
   */
  static async getTableColumns(
    pool: Pool,
    tableName: string,
    schema = 'public',
    logger: Logger
  ): Promise<
    Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
    }>
  > {
    try {
      const result = await pool.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns 
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [schema, tableName]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error getting table columns for: ${tableName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get database size
   */
  static async getDatabaseSize(
    pool: Pool,
    databaseName: string,
    logger: Logger
  ): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT pg_size_pretty(pg_database_size($1)) as size`,
        [databaseName]
      );
      return result.rows[0]?.size || '0 bytes';
    } catch (error) {
      logger.error(`Error getting database size for: ${databaseName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get table size
   */
  static async getTableSize(
    pool: Pool,
    tableName: string,
    schema = 'public',
    logger: Logger
  ): Promise<string> {
    try {
      const fullTableName = `${schema}.${tableName}`;
      const result = await pool.query(
        `SELECT pg_size_pretty(pg_total_relation_size($1)) as size`,
        [fullTableName]
      );
      return result.rows[0]?.size || '0 bytes';
    } catch (error) {
      logger.error(`Error getting table size for: ${tableName}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(
    pool: Pool,
    logger: Logger
  ): Promise<{
    connections: number;
    maxConnections: number;
    databases: number;
    version: string;
  }> {
    try {
      const [
        connectionsResult,
        maxConnectionsResult,
        databasesResult,
        versionResult,
      ] = await Promise.all([
        pool.query('SELECT count(*) as count FROM pg_stat_activity'),
        pool.query('SHOW max_connections'),
        pool.query('SELECT count(*) as count FROM pg_database'),
        pool.query('SELECT version()'),
      ]);

      return {
        connections: parseInt(connectionsResult.rows[0].count),
        maxConnections: parseInt(maxConnectionsResult.rows[0].max_connections),
        databases: parseInt(databasesResult.rows[0].count),
        version: versionResult.rows[0].version,
      };
    } catch (error) {
      logger.error('Error getting database statistics:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Kill active connections to a database
   */
  static async killDatabaseConnections(
    pool: Pool,
    databaseName: string,
    logger: Logger
  ): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity 
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [databaseName]
      );

      const killedCount = result.rows.filter(
        (row) => row.pg_terminate_backend
      ).length;
      logger.info(
        `Killed ${killedCount} connections to database '${databaseName}'`
      );
      return killedCount;
    } catch (error) {
      logger.error(`Error killing connections to database '${databaseName}':`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute SQL file
   */
  static async executeSQLFile(
    pool: Pool,
    filePath: string,
    logger: Logger
  ): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const sql = await fs.readFile(filePath, 'utf-8');

      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await pool.query(statement);
      }

      logger.info(`Successfully executed SQL file: ${filePath}`);
    } catch (error) {
      logger.error(`Error executing SQL file ${filePath}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Backup database schema
   */
  static async backupSchema(
    pool: Pool,
    databaseName: string,
    outputPath: string,
    logger: Logger
  ): Promise<void> {
    try {
      // This would typically use pg_dump, but for now we'll create a basic schema backup
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      let schema = `-- Schema backup for database: ${databaseName}\n`;
      schema += `-- Generated at: ${new Date().toISOString()}\n\n`;

      for (const table of tables.rows) {
        const columns = await this.getTableColumns(
          pool,
          table.table_name,
          'public',
          logger
        );
        schema += `-- Table: ${table.table_name}\n`;
        schema += `CREATE TABLE ${table.table_name} (\n`;

        const columnDefs = columns.map(
          (col) =>
            `  ${col.column_name} ${col.data_type}${
              col.is_nullable === 'NO' ? ' NOT NULL' : ''
            }${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`
        );

        schema += columnDefs.join(',\n');
        schema += '\n);\n\n';
      }

      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, schema, 'utf-8');

      logger.info(`Schema backup saved to: ${outputPath}`);
    } catch (error) {
      logger.error(`Error creating schema backup:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate connection configuration
   */
  static validateConnectionConfig(config: DatabaseConnectionConfig): string[] {
    const errors: string[] = [];

    if (!config.host) errors.push('Host is required');
    if (!config.port) errors.push('Port is required');
    if (!config.database) errors.push('Database name is required');
    if (!config.username) errors.push('Username is required');
    if (!config.password) errors.push('Password is required');

    if (
      config.port &&
      (isNaN(config.port) || config.port < 1 || config.port > 65535)
    ) {
      errors.push('Port must be a valid number between 1 and 65535');
    }

    if (config.pool) {
      if (config.pool.min && (isNaN(config.pool.min) || config.pool.min < 0)) {
        errors.push('Pool min must be a non-negative number');
      }
      if (config.pool.max && (isNaN(config.pool.max) || config.pool.max < 1)) {
        errors.push('Pool max must be a positive number');
      }
      if (
        config.pool.min &&
        config.pool.max &&
        config.pool.min > config.pool.max
      ) {
        errors.push('Pool min cannot be greater than pool max');
      }
    }

    return errors;
  }
}
