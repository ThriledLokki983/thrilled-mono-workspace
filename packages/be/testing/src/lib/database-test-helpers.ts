import { DatabaseManager } from '@thrilled/databases';
import { Logger } from '@mono/be-core';
import { PoolClient } from 'pg';
import { TestDatabaseConfig, DatabaseTestOptions, MigrationTestOptions } from './types/test-types.js';

/**
 * Database Test Helper
 * Provides utilities for database testing including setup, teardown, and data management
 */
export class DatabaseTestHelper {
  private static logger = new Logger({ 
    dir: './logs/database-test',
    level: 'debug'
  });

  /**
   * Create a test database configuration
   */
  static createTestConfig(overrides: Partial<TestDatabaseConfig> = {}): TestDatabaseConfig {
    return {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'thrilled_test',
      username: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      ssl: false,
      dropOnClose: true,
      createDatabase: true,
      resetBetweenTests: true,
      ...overrides,
    };
  }

  /**
   * Setup a test database
   */
  static async setupTestDatabase(config: TestDatabaseConfig): Promise<DatabaseManager> {
    const dbConfig = {
      connections: {
        test: {
          host: config.host || 'localhost',
          port: config.port || 5432,
          database: config.database || 'test_db',
          username: config.username || 'postgres',
          password: config.password || '',
          ssl: config.ssl || false,
          pool: {
            min: 1,
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 2000,
          },
        },
      },
      default: 'test',
      autoCreateDatabase: config.createDatabase !== false,
    };

    const databaseManager = new DatabaseManager(dbConfig, this.logger);
    await databaseManager.initialize();
    
    return databaseManager;
  }

  /**
   * Clear all tables in the database
   */
  static async clearAllTables(
    databaseManager: DatabaseManager,
    options: DatabaseTestOptions = {}
  ): Promise<void> {
    const connection = databaseManager.getConnection(options.connection);
    const schema = options.schema || 'public';

    try {
      // Get all table names
      const result = await connection.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = $1
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
      `, [schema]);

      const tableNames = result.rows.map((row: { tablename: string }) => row.tablename);
      
      // Filter tables based on options
      let tablesToClear = tableNames;
      if (options.includeTables?.length) {
        tablesToClear = tablesToClear.filter((name: string) => options.includeTables?.includes(name) || false);
      }
      if (options.excludeTables?.length) {
        tablesToClear = tablesToClear.filter((name: string) => !options.excludeTables?.includes(name));
      }

      if (tablesToClear.length === 0) {
        return;
      }

      // Disable foreign key checks temporarily
      await connection.query('SET session_replication_role = replica;');

      try {
        if (options.truncateOnly) {
          // Truncate tables (faster but keeps structure)
          for (const tableName of tablesToClear) {
            await connection.query(`TRUNCATE TABLE "${schema}"."${tableName}" RESTART IDENTITY CASCADE;`);
          }
        } else {
          // Drop and recreate tables (complete reset)
          for (const tableName of tablesToClear) {
            await connection.query(`DROP TABLE IF EXISTS "${schema}"."${tableName}" CASCADE;`);
          }
        }
      } finally {
        // Re-enable foreign key checks
        await connection.query('SET session_replication_role = DEFAULT;');
      }

      this.logger.info(`Cleared ${tablesToClear.length} tables from test database`);
    } catch (error) {
      this.logger.error('Failed to clear database tables', { error });
      throw error;
    }
  }

  /**
   * Reset database to clean state
   */
  static async resetDatabase(
    databaseManager: DatabaseManager,
    options: DatabaseTestOptions = {}
  ): Promise<void> {
    await this.clearAllTables(databaseManager, { ...options, truncateOnly: true });
  }

  /**
   * Execute SQL file
   */
  static async executeSqlFile(
    databaseManager: DatabaseManager,
    filePath: string,
    connection?: string
  ): Promise<void> {
    const fs = await import('fs/promises');
    const sql = await fs.readFile(filePath, 'utf-8');
    await this.executeSql(databaseManager, sql, connection);
  }

  /**
   * Execute SQL statements
   */
  static async executeSql(
    databaseManager: DatabaseManager,
    sql: string,
    connection?: string
  ): Promise<unknown> {
    const conn = databaseManager.getConnection(connection);
    return await conn.query(sql);
  }

  /**
   * Create test data transaction
   */
  static async withTestTransaction<T>(
    databaseManager: DatabaseManager,
    callback: (client: PoolClient) => Promise<T>,
    connection?: string
  ): Promise<T> {
    const pool = databaseManager.getConnection(connection);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('ROLLBACK'); // Always rollback test transactions
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Seed test data
   */
  static async seedTestData(
    databaseManager: DatabaseManager,
    seedData: Record<string, Record<string, unknown>[]>,
    connection?: string
  ): Promise<void> {
    const conn = databaseManager.getConnection(connection);

    for (const [tableName, records] of Object.entries(seedData)) {
      if (records.length === 0) continue;

      // Build insert query
      const columns = Object.keys(records[0]);
      const placeholders = records.map((_, index) => 
        `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(', ')})`
      ).join(', ');

      const values = records.flatMap(record => columns.map(col => record[col]));
      
      const query = `
        INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')})
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING
      `;

      await conn.query(query, values);
    }

    this.logger.info(`Seeded test data for ${Object.keys(seedData).length} tables`);
  }

  /**
   * Assert table exists
   */
  static async assertTableExists(
    databaseManager: DatabaseManager,
    tableName: string,
    schema = 'public',
    connection?: string
  ): Promise<void> {
    const conn = databaseManager.getConnection(connection);
    const result = await conn.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1 AND table_name = $2
      );
    `, [schema, tableName]);

    if (!result.rows[0].exists) {
      throw new Error(`Table '${schema}.${tableName}' does not exist`);
    }
  }

  /**
   * Assert table is empty
   */
  static async assertTableEmpty(
    databaseManager: DatabaseManager,
    tableName: string,
    schema = 'public',
    connection?: string
  ): Promise<void> {
    const conn = databaseManager.getConnection(connection);
    const result = await conn.query(`SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`);
    
    if (parseInt(result.rows[0].count) > 0) {
      throw new Error(`Table '${schema}.${tableName}' is not empty`);
    }
  }

  /**
   * Assert table has specific row count
   */
  static async assertTableRowCount(
    databaseManager: DatabaseManager,
    tableName: string,
    expectedCount: number,
    schema = 'public',
    connection?: string
  ): Promise<void> {
    const conn = databaseManager.getConnection(connection);
    const result = await conn.query(`SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`);
    const actualCount = parseInt(result.rows[0].count);
    
    if (actualCount !== expectedCount) {
      throw new Error(
        `Table '${schema}.${tableName}' has ${actualCount} rows, expected ${expectedCount}`
      );
    }
  }

  /**
   * Get table row count
   */
  static async getTableRowCount(
    databaseManager: DatabaseManager,
    tableName: string,
    schema = 'public',
    connection?: string
  ): Promise<number> {
    const conn = databaseManager.getConnection(connection);
    const result = await conn.query(`SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`);
    return parseInt(result.rows[0].count);
  }

  /**
   * Test database migrations
   */
  static async testMigrations(
    databaseManager: DatabaseManager,
    options: MigrationTestOptions = {}
  ): Promise<void> {
    // This would integrate with the migration system
    // Implementation depends on the specific migration framework used
    this.logger.info('Testing database migrations', options);
    
    // TODO: Implement migration testing logic
    // This could include:
    // - Running migrations up to a specific version
    // - Testing rollbacks
    // - Verifying schema changes
    // - Testing data migrations
  }

  /**
   * Create database snapshot for testing
   */
  static async createSnapshot(
    databaseManager: DatabaseManager,
    snapshotName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _connection?: string
  ): Promise<void> {
    // This would create a database snapshot that can be restored later
    // Implementation depends on PostgreSQL version and setup
    this.logger.info(`Creating database snapshot: ${snapshotName}`);
    
    // TODO: Implement snapshot creation
    // This could use pg_dump or database-specific snapshot features
  }

  /**
   * Restore database snapshot
   */
  static async restoreSnapshot(
    databaseManager: DatabaseManager,
    snapshotName: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _connection?: string
  ): Promise<void> {
    // This would restore a previously created database snapshot
    this.logger.info(`Restoring database snapshot: ${snapshotName}`);
    
    // TODO: Implement snapshot restoration
    // This could use pg_restore or database-specific restore features
  }
}
