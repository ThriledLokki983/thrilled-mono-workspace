import { AppConfig, Environment } from '@mono/be-core';
import { NODE_ENV, PORT, LOG_FORMAT, LOG_DIR, ORIGIN } from './index';

const ALLOWED_HOST: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
];

/**
 * Application configuration for the Base API.
 * This configuration is used to set up various aspects of the application,
 * including logging, CORS, rate limiting, health checks, and graceful shutdown.
 */
export const createAppConfig = (): AppConfig => {
  const isDev = NODE_ENV === 'development';

  // Ensure NODE_ENV matches the Environment type
  const environment: Environment = NODE_ENV === 'production' || NODE_ENV === 'test' ? (NODE_ENV as Environment) : 'development';

  return {
    name: 'Base API',
    port: Number(PORT) || 5555,
    environment,

    logging: {
      level: NODE_ENV === 'production' ? 'info' : 'debug',
      dir: LOG_DIR || 'logs',
      format: (LOG_FORMAT as 'json' | 'simple') || 'simple',
      httpLogging: true,
      maxFiles: 30,
      correlationId: false,
    },

    cors: {
      origin: ORIGIN === '*' ? ALLOWED_HOST : ORIGIN?.split(',') || ALLOWED_HOST,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },

    rateLimit: {
      windowMs: isDev ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000, // 24h in dev, 15min in prod
      max: isDev ? 5000 : 100,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    },

    health: {
      enabled: true,
      endpoint: '/health',
    },

    gracefulShutdown: {
      enabled: true,
      timeout: 10000,
      signals: ['SIGINT', 'SIGTERM'],
    },
  };
};
