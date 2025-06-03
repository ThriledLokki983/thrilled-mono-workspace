// Main exports for the database package
export { DatabaseManager } from "./managers/DatabaseManager.js";
export { QueryBuilder } from "./builders/QueryBuilder.js";
export { MigrationRunner } from "./migrations/MigrationRunner.js";
export { CacheManager } from "./cache/CacheManager.js";
export { DatabaseUtils } from "./utils/DatabaseUtils.js";

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
} from "@thrilled/be-types";

// Export Migration interface
export type { Migration } from "./migrations/MigrationRunner.js";
