import { AppConfig } from '@mono/be-core';
import { NODE_ENV, PORT, LOG_FORMAT, LOG_DIR, ORIGIN } from './index';

export const createAppConfig = (): AppConfig => {
  const isDev = NODE_ENV === 'development';

  return {
    name: 'Base API',
    port: Number(PORT) || 5555,
    environment: NODE_ENV || 'development',

    logging: {
      level: NODE_ENV === 'production' ? 'info' : 'debug',
      dir: LOG_DIR || 'logs',
      format: LOG_FORMAT as 'json' | 'simple' || 'simple',
      httpLogging: true,
      maxFiles: 30,
      correlationId: false
    },

    cors: {
      origin: ORIGIN === '*'
        ? ['http://localhost:3000']
        : ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
      endpoint: '/health'
    },

    gracefulShutdown: {
      enabled: true,
      timeout: 10000,
      signals: ['SIGINT', 'SIGTERM']
    }
  };
};
