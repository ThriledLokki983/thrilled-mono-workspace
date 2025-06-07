// Database connection configuration
export interface DatabaseConfig {
  connections: Record<string, DatabaseConnectionConfig>;
  default?: string;
  migrations?: MigrationConfig;
}

// Individual database connection configuration
export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | Record<string, unknown>;
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}

// Migration configuration
export interface MigrationConfig {
  tableName?: string;
  directory?: string;
  schemaTable?: string;
}

// Query result interface
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  command: string;
}

// Transaction callback
export type TransactionCallback<T> = (client: DatabaseClient) => Promise<T>;

// Database client interface
export interface DatabaseClient {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
  release?(): void;
}

// Cache configuration
export interface CacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// Cache operations
export interface CacheOperations {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  flushAll(): Promise<void>;
  getRedisClient?(): unknown; // Optional for advanced operations
}

// Extended database configuration with auto-creation support
export interface DatabaseManagerConfig {
  connections: Record<string, DatabaseConnectionConfig>;
  default?: string;
  migrations?: MigrationConfig;
  autoCreateDatabase?: boolean;
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
    timeout?: number;
  };
  cache?: CacheConfig;
}

// Database connection status
export interface ConnectionStatus {
  name: string;
  connected: boolean;
  lastChecked: Date;
  error?: string;
  poolStats?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}

// Health check result
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connections: ConnectionStatus[];
  cache?: {
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  };
  uptime: number;
  lastCheck: Date;
}

// Migration status
export interface MigrationStatus {
  name: string;
  appliedAt: Date;
  version: string;
}

// Query builder interfaces
export interface SelectQuery {
  select(columns?: string | string[]): SelectQuery;
  from(table: string): SelectQuery;
  where(condition: string, ...params: unknown[]): SelectQuery;
  join(table: string, condition: string): SelectQuery;
  leftJoin(table: string, condition: string): SelectQuery;
  rightJoin(table: string, condition: string): SelectQuery;
  orderBy(column: string, direction?: 'ASC' | 'DESC'): SelectQuery;
  groupBy(columns: string | string[]): SelectQuery;
  having(condition: string, ...params: unknown[]): SelectQuery;
  limit(count: number): SelectQuery;
  offset(count: number): SelectQuery;
  execute<T = unknown>(): Promise<QueryResult<T>>;
  toSQL(): { text: string; values: unknown[] };
}

export interface InsertQuery {
  into(table: string): InsertQuery;
  values(
    data: Record<string, unknown> | Record<string, unknown>[]
  ): InsertQuery;
  returning(columns?: string | string[]): InsertQuery;
  onConflict(column: string, action?: 'DO NOTHING' | 'DO UPDATE'): InsertQuery;
  execute<T = unknown>(): Promise<QueryResult<T>>;
  toSQL(): { text: string; values: unknown[] };
}

export interface UpdateQuery {
  table(name: string): UpdateQuery;
  set(data: Record<string, unknown>): UpdateQuery;
  where(condition: string, ...params: unknown[]): UpdateQuery;
  returning(columns?: string | string[]): UpdateQuery;
  execute<T = unknown>(): Promise<QueryResult<T>>;
  toSQL(): { text: string; values: unknown[] };
}

export interface DeleteQuery {
  from(table: string): DeleteQuery;
  where(condition: string, ...params: unknown[]): DeleteQuery;
  returning(columns?: string | string[]): DeleteQuery;
  execute<T = unknown>(): Promise<QueryResult<T>>;
  toSQL(): { text: string; values: unknown[] };
}

// Database creation options
export interface DatabaseCreationOptions {
  encoding?: string;
  template?: string;
  owner?: string;
  locale?: string;
  allowConnections?: boolean;
}
