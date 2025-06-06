import { Pool, Client } from 'pg';
import {
  DatabaseManagerConfig,
  DatabaseConnectionConfig,
  QueryResult,
  TransactionCallback,
  ConnectionStatus,
  HealthCheckResult,
} from '@thrilled/be-types';
import { Logger } from '@mono/be-core';
import { QueryBuilder } from '../builders/QueryBuilder.js';
import { MigrationRunner } from '../migrations/MigrationRunner.js';
import { CacheManager } from '../cache/CacheManager.js';

export class DatabaseManager {
  private connections: Map<string, Pool> = new Map();
  private cacheManager?: CacheManager;
  private migrationRunner?: MigrationRunner;
  private healthCheckInterval?: NodeJS.Timeout;
  private isInitialized = false;
  private startTime = Date.now();

  constructor(private config: DatabaseManagerConfig, private logger: Logger) {
    // Logger from be-core doesn't have child method, will use prefix instead
  }

  /**
   * Initialize the database manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('DatabaseManager already initialized');
      return;
    }

    try {
      this.logger.info('Initializing DatabaseManager...');

      // Initialize connections
      await this.initializeConnections();

      // Initialize cache if configured
      if (this.config.cache) {
        this.cacheManager = new CacheManager(this.config.cache, this.logger);
        await this.cacheManager.initialize();
      }

      // Initialize migration runner
      this.migrationRunner = new MigrationRunner(
        this.getConnection(),
        this.config.migrations,
        this.logger
      );

      // Start health checks if enabled
      if (this.config.healthCheck?.enabled) {
        this.startHealthChecks();
      }

      this.isInitialized = true;
      this.logger.info('DatabaseManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize DatabaseManager:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Initialize all configured database connections
   */
  private async initializeConnections(): Promise<void> {
    const connectionPromises = Object.entries(this.config.connections).map(
      async ([name, config]) => {
        try {
          await this.createConnectionIfNeeded(name, config);
          await this.connect(name);
          this.logger.info(
            `Database connection '${name}' established successfully`
          );
          return { name, success: true };
        } catch (error) {
          this.logger.error(`Failed to connect to database '${name}':`, {
            error: error instanceof Error ? error.message : String(error),
          });
          return { name, success: false, error };
        }
      }
    );

    const results = await Promise.allSettled(connectionPromises);
    const failures = results
      .filter(
        (result) =>
          result.status === 'rejected' ||
          (result.status === 'fulfilled' && !result.value.success)
      )
      .map((_, index) => Object.keys(this.config.connections)[index]);

    if (failures.length > 0) {
      this.logger.warn(
        `Failed to connect to databases: ${failures.join(', ')}`
      );
    }
  }

  /**
   * Create database if it doesn't exist
   */
  private async createConnectionIfNeeded(
    _name: string,
    config: DatabaseConnectionConfig
  ): Promise<void> {
    if (!this.config.autoCreateDatabase) {
      return;
    }

    try {
      // Create a temporary connection to the 'postgres' system database
      const systemConfig = {
        ...config,
        database: 'postgres', // Connect to system database first
      };

      const systemClient = new Client({
        host: systemConfig.host,
        port: systemConfig.port,
        user: systemConfig.username,
        password: systemConfig.password,
        ssl: systemConfig.ssl,
      });

      await systemClient.connect();

      try {
        // Check if database exists
        const result = await systemClient.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [config.database]
        );

        if (result.rows.length === 0) {
          this.logger.info(`Creating database '${config.database}'...`);

          // Create the database
          await systemClient.query(`CREATE DATABASE "${config.database}"`);

          this.logger.info(
            `Database '${config.database}' created successfully`
          );
        } else {
          this.logger.debug(`Database '${config.database}' already exists`);
        }
      } finally {
        await systemClient.end();
      }
    } catch (error) {
      this.logger.error(`Failed to create database '${config.database}':`, {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw here - let the connection attempt proceed
      // The database might exist but we couldn't check, or creation failed
      // but the database might be accessible
    }
  }

  /**
   * Connect to a specific database
   */
  async connect(
    name: string = this.config.default || 'default'
  ): Promise<Pool> {
    if (!this.config.connections[name]) {
      throw new Error(`Database connection '${name}' not configured`);
    }

    if (!this.connections.has(name)) {
      const config = this.config.connections[name];
      const pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: config.ssl,
        max: config.pool?.max || 20,
        min: config.pool?.min || 2,
        idleTimeoutMillis: config.pool?.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: config.pool?.connectionTimeoutMillis || 5000,
        allowExitOnIdle: false,
      });

      // Add event listeners for monitoring
      pool.on('connect', (_client) => {
        this.logger.debug(`New client connected to database '${name}'`);
      });

      pool.on('error', (err) => {
        this.logger.error(`Database pool error for '${name}':`, {
          error: err.message,
        });
      });

      pool.on('remove', (_client) => {
        this.logger.debug(`Client removed from database pool '${name}'`);
      });

      // Test the connection
      await this.testConnection(pool, name);

      this.connections.set(name, pool);
    }

    return this.connections.get(name)!;
  }

  /**
   * Test database connection
   */
  private async testConnection(pool: Pool, name: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      this.logger.debug(`Connection test successful for database '${name}'`);
    } finally {
      client.release();
    }
  }

  /**
   * Get a database connection
   */
  getConnection(name?: string): Pool {
    const connectionName = name || this.config.default || 'default';
    const connection = this.connections.get(connectionName);

    if (!connection) {
      throw new Error(`Database connection '${connectionName}' not found`);
    }

    return connection;
  }

  /**
   * Execute a query with optional connection name
   */
  async query<T = any>(
    text: string,
    params: any[] = [],
    connectionName?: string
  ): Promise<QueryResult<T>> {
    const pool = this.getConnection(connectionName);

    try {
      this.logger.debug(`Executing query: ${text}`, { params });
      const result = await pool.query(text, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command,
      };
    } catch (error) {
      this.logger.error(`Query failed: ${text}`, { params, error });
      throw error;
    }
  }

  /**
   * Execute operations within a transaction
   */
  async withTransaction<T>(
    callback: TransactionCallback<T>,
    connectionName?: string
  ): Promise<T> {
    const pool = this.getConnection(connectionName);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      this.logger.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      this.logger.debug('Transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get query builder for a connection
   */
  query_builder(connectionName?: string): QueryBuilder {
    return new QueryBuilder(this.getConnection(connectionName), this.logger);
  }

  /**
   * Get cache manager
   */
  getCache(): CacheManager {
    if (!this.cacheManager) {
      throw new Error('Cache not configured');
    }
    return this.cacheManager;
  }

  /**
   * Run database migrations
   */
  async runMigrations(connectionName?: string): Promise<void> {
    if (!this.migrationRunner) {
      throw new Error('Migration runner not initialized');
    }

    await this.migrationRunner.runMigrations(connectionName);
  }

  /**
   * Get connection health status
   */
  async getConnectionStatus(name: string): Promise<ConnectionStatus> {
    const pool = this.connections.get(name);

    if (!pool) {
      return {
        name,
        connected: false,
        lastChecked: new Date(),
        error: 'Connection not found',
      };
    }

    try {
      const client = await pool.connect();
      client.release();

      return {
        name,
        connected: true,
        lastChecked: new Date(),
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        name,
        connected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get overall health check result
   */
  async getHealthCheck(): Promise<HealthCheckResult> {
    const connectionPromises = Array.from(this.connections.keys()).map((name) =>
      this.getConnectionStatus(name)
    );

    const connections = await Promise.all(connectionPromises);
    const healthyConnections = connections.filter((conn) => conn.connected);

    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    if (healthyConnections.length === 0) {
      status = 'unhealthy';
    } else if (healthyConnections.length < connections.length) {
      status = 'degraded';
    }

    const result: HealthCheckResult = {
      status,
      connections,
      uptime: Date.now() - this.startTime,
      lastCheck: new Date(),
    };

    // Add cache status if available
    if (this.cacheManager) {
      try {
        await this.cacheManager.ping();
        result.cache = { status: 'connected' };
      } catch (error) {
        result.cache = {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return result;
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    const interval = this.config.healthCheck?.interval || 30000; // 30 seconds default

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthCheck();

        if (health.status === 'unhealthy') {
          this.logger.error('Database health check failed:', health);
        } else if (health.status === 'degraded') {
          this.logger.warn('Database health check degraded:', health);
        } else {
          this.logger.debug('Database health check passed');
        }
      } catch (error) {
        this.logger.error('Health check error:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, interval);

    this.logger.info(`Health checks started with ${interval}ms interval`);
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      this.logger.info('Health checks stopped');
    }
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    this.logger.info('Closing DatabaseManager...');

    // Stop health checks
    this.stopHealthChecks();

    // Close cache manager
    if (this.cacheManager) {
      await this.cacheManager.close();
    }

    // Close all database connections
    const closePromises = Array.from(this.connections.entries()).map(
      async ([name, pool]) => {
        try {
          await pool.end();
          this.logger.info(`Database connection '${name}' closed`);
        } catch (error) {
          this.logger.error(`Error closing database connection '${name}':`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    await Promise.all(closePromises);
    this.connections.clear();
    this.isInitialized = false;

    this.logger.info('DatabaseManager closed successfully');
  }
}
