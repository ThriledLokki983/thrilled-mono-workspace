import { Express } from 'express';
import { DatabaseManager, CacheManager } from '@thrilled/databases';
import { Logger } from '@mono/be-core';
import { Pool } from 'pg';

/**
 * Configuration for test database setup
 */
export interface TestDatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  dropOnClose?: boolean;
  createDatabase?: boolean;
  resetBetweenTests?: boolean;
}

/**
 * Configuration for test Redis/cache setup
 */
export interface TestCacheConfig {
  host?: string;
  port?: number;
  db?: number;
  password?: string;
  keyPrefix?: string;
  flushOnClose?: boolean;
  resetBetweenTests?: boolean;
}

/**
 * Test application configuration
 */
export interface TestAppConfig {
  port?: number;
  enableLogging?: boolean;
  database?: TestDatabaseConfig;
  cache?: TestCacheConfig;
  plugins?: string[];
  middleware?: any[];
  routes?: any[];
}

/**
 * Test application instance with utilities
 */
export interface TestAppInstance {
  app: Express;
  server?: any;
  database?: DatabaseManager;
  cache?: CacheManager;
  logger: Logger;
  port: number;
  baseUrl: string;
  
  // Utility methods
  start(): Promise<void>;
  stop(): Promise<void>;
  resetDatabase(): Promise<void>;
  resetCache(): Promise<void>;
  getConnection(): Pool;
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  description?: string;
  database?: TestDatabaseConfig;
  cache?: TestCacheConfig;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}

/**
 * Database test helper options
 */
export interface DatabaseTestOptions {
  connection?: string;
  schema?: string;
  truncateOnly?: boolean;
  excludeTables?: string[];
  includeTables?: string[];
}

/**
 * Migration test options
 */
export interface MigrationTestOptions {
  directory?: string;
  targetVersion?: string;
  rollbackSteps?: number;
}
