import { DatabaseManagerConfig } from '@thrilled/be-types';

// Development configuration
export const developmentConfig: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'thrilled_dev',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      ssl: false,
      pool: {
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    },
    // Example read replica
    readonly: {
      host: process.env.POSTGRES_READ_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_READ_PORT || '5432'),
      database: process.env.POSTGRES_READ_DB || 'thrilled_dev',
      username: process.env.POSTGRES_READ_USER || 'postgres',
      password: process.env.POSTGRES_READ_PASSWORD || 'postgres',
      ssl: false,
      pool: {
        min: 1,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    }
  },
  default: 'primary',
  migrations: {
    directory: './migrations',
    tableName: 'migrations',
  },
  autoCreateDatabase: true,
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
  },
  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'thrilled:dev:',
    ttl: 3600, // 1 hour default
    maxRetries: 3,
    retryDelay: 1000,
  }
};
