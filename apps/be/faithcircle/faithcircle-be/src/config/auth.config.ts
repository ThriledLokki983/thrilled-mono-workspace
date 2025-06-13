import Redis from 'ioredis';
import { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from './index';

// Local type definitions to avoid static imports
interface JWTTokenConfig {
  secret: string;
  expiresIn: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  issuer?: string;
  audience?: string;
}

interface JWTConfig {
  accessToken: JWTTokenConfig;
  refreshToken: JWTTokenConfig;
}

interface PasswordConfig {
  saltRounds?: number;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  requireSpecialChars?: boolean;
  maxAttempts?: number;
  lockoutDuration?: string;
  ttl?: number;
  blacklistedPasswords?: string[];
}

interface SessionConfig {
  defaultTTL: string;
  prefix: string;
  ttl: number;
  maxSessionsPerUser: number;
  maxSessions?: number;
  enableRollingSession: boolean;
  rolling: boolean;
  trackDevices: boolean;
  enableEventLogging: boolean;
}

// Create Redis client for auth services
export const createRedisClient = (): Redis => {
  return new Redis({
    host: REDIS_HOST || 'localhost',
    port: Number(REDIS_PORT) || 6379,
    password: REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

// JWT Configuration
export const createJWTConfig = (appName = 'Base'): JWTConfig => ({
  accessToken: {
    secret: JWT_SECRET || 'default-jwt-secret-change-in-production',
    expiresIn: JWT_EXPIRES_IN || '15m',
    algorithm: 'HS256',
    issuer: `${appName} API`,
    audience: `${appName} API Users`,
  },
  refreshToken: {
    secret: JWT_SECRET || 'default-jwt-secret-change-in-production',
    expiresIn: REFRESH_TOKEN_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: `${appName} API`,
    audience: `${appName} API Users`,
  },
});

// Password Configuration
export const createPasswordConfig = (): PasswordConfig => ({
  saltRounds: 12,
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  requireSpecialChars: false,
  maxAttempts: 5,
  lockoutDuration: '15m',
  ttl: 3600, // 1 hour for reset tokens
});

// Session Configuration
export const createSessionConfig = (): SessionConfig => ({
  defaultTTL: '24h',
  prefix: 'session:',
  ttl: 24 * 60 * 60, // 24 hours in seconds
  maxSessionsPerUser: 5,
  maxSessions: 5,
  enableRollingSession: true,
  rolling: true,
  trackDevices: true,
  enableEventLogging: true,
});

// Create logging config for auth services
export const createAuthLoggingConfig = (environment: string = process.env.NODE_ENV): { level: string; format: string; dir: string } => ({
  level: environment === 'production' ? 'info' : 'debug',
  format: 'json',
  dir: process.env.LOG_DIR || 'logs',
});
