import { DatabaseManagerConfig } from '@thrilled/be-types';

// Test configuration with in-memory/test database
export const testConfig: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: process.env.TEST_POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.TEST_POSTGRES_PORT || '5433'),
      database: process.env.TEST_POSTGRES_DB || 'thrilled_test',
      username: process.env.TEST_POSTGRES_USER || 'postgres',
      password: process.env.TEST_POSTGRES_PASSWORD || 'postgres',
      ssl: false,
      pool: {
        min: 1,
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 1000,
      }
    }
  },
  default: 'primary',
  migrations: {
    directory: './test/migrations',
    tableName: 'test_migrations',
  },
  autoCreateDatabase: true,
  healthCheck: {
    enabled: false, // Disable in tests
  },
  cache: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6380'),
    password: process.env.TEST_REDIS_PASSWORD,
    db: parseInt(process.env.TEST_REDIS_DB || '1'),
    keyPrefix: 'thrilled:test:',
    ttl: 300, // 5 minutes
    maxRetries: 1,
    retryDelay: 500,
  }
};
