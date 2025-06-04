import Redis from 'ioredis';
import { JWTConfig, PasswordConfig, SessionConfig } from '@thrilled/be-auth';
import { Logger } from '@mono/be-core';
import { 
  JWT_SECRET, 
  JWT_EXPIRES_IN, 
  REFRESH_TOKEN_EXPIRES_IN, 
  REDIS_HOST, 
  REDIS_PORT, 
  REDIS_PASSWORD 
} from './index';

// Create Redis client for auth services
export const createRedisClient = (): Redis => {
  return new Redis({
    host: REDIS_HOST || 'localhost',
    port: Number(REDIS_PORT) || 6379,
    password: REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
};

// JWT Configuration
export const createJWTConfig = (): JWTConfig => ({
  secret: JWT_SECRET || 'default-jwt-secret-change-in-production',
  expiresIn: JWT_EXPIRES_IN || '1h',
  refreshTokenExpiresIn: REFRESH_TOKEN_EXPIRES_IN || '7d',
  issuer: 'Base API',
  audience: 'Base API Users'
});

// Password Configuration
export const createPasswordConfig = (): PasswordConfig => ({
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxAge: 90, // days
  history: 5, // remember last 5 passwords
  bcryptRounds: 12
});

// Session Configuration  
export const createSessionConfig = (): SessionConfig => ({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  sliding: true,
  cookieName: 'base-session',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  deviceVerification: true,
  ipValidation: true,
  inactivityTimeout: 30 * 60 * 1000 // 30 minutes
});

// Create logging config for auth services
export const createAuthLoggingConfig = (): { level: string; format: string; dir: string } => ({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'json',
  dir: process.env.LOG_DIR || 'logs'
});
