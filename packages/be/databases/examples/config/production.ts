import { DatabaseManagerConfig } from '@thrilled/be-types';

// Production configuration
export const productionConfig: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: process.env.POSTGRES_HOST!,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB!,
      username: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
      ssl: {
        rejectUnauthorized: false,
        ca: process.env.POSTGRES_SSL_CA,
        cert: process.env.POSTGRES_SSL_CERT,
        key: process.env.POSTGRES_SSL_KEY,
      },
      pool: {
        min: 5,
        max: 30,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 3000,
      },
    },
    readonly: {
      host: process.env.POSTGRES_READ_HOST!,
      port: parseInt(process.env.POSTGRES_READ_PORT || '5432'),
      database: process.env.POSTGRES_READ_DB!,
      username: process.env.POSTGRES_READ_USER!,
      password: process.env.POSTGRES_READ_PASSWORD!,
      ssl: {
        rejectUnauthorized: false,
        ca: process.env.POSTGRES_READ_SSL_CA,
        cert: process.env.POSTGRES_READ_SSL_CERT,
        key: process.env.POSTGRES_READ_SSL_KEY,
      },
      pool: {
        min: 3,
        max: 15,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 3000,
      },
    },
  },
  default: 'primary',
  migrations: {
    directory: './migrations',
    tableName: 'migrations',
  },
  autoCreateDatabase: false, // Don't auto-create in production
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
    timeout: 10000, // 10 seconds
  },
  cache: {
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD!,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'thrilled:prod:',
    ttl: 7200, // 2 hours default
    maxRetries: 5,
    retryDelay: 2000,
  },
};
