// Main exports for the database package
export { DatabaseManager } from './managers/DatabaseManager';
export { QueryBuilder } from './builders/QueryBuilder';
export { MigrationRunner } from './migrations/MigrationRunner';
export { CacheManager } from './cache/CacheManager';
export { DatabaseUtils } from './utils/DatabaseUtils';
export { DbHelper } from './utils/DbHelper';

// Re-export types from be-types for convenience
export type {
  DatabaseManagerConfig,
  DatabaseConnectionConfig,
  QueryResult,
  TransactionCallback,
  ConnectionStatus,
  HealthCheckResult,
  MigrationConfig,
  MigrationStatus,
  CacheConfig,
  CacheOperations,
  SelectQuery,
  InsertQuery,
  UpdateQuery,
  DeleteQuery,
  DatabaseCreationOptions,
} from '@thrilled/be-types';

// Export Migration interface
export type { Migration } from './migrations/MigrationRunner';
