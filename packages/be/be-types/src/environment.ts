import { cleanEnv, str, port, num, bool } from 'envalid';

/**
 * Common environment variable validation schemas
 */

// Base environment variables required by most applications
export const baseEnvSchema = {
  NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
  PORT: port({ default: 3000 }),
};

// Database environment variables
export const databaseEnvSchema = {
  POSTGRES_HOST: str(),
  POSTGRES_PORT: port({ default: 5432 }),
  POSTGRES_USER: str(),
  POSTGRES_PASSWORD: str(),
  POSTGRES_DB: str(),
};

// Redis environment variables
export const redisEnvSchema = {
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),
  REDIS_PASSWORD: str({ default: '' }),
  REDIS_DB: num({ default: 0 }),
};

// Authentication & Security environment variables
export const authEnvSchema = {
  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str({ default: '1h' }),
  REFRESH_TOKEN_EXPIRES_IN: str({ default: '7d' }),
  SECRET_KEY: str(),
};

// Security environment variables
export const securityEnvSchema = {
  CREDENTIALS: bool({ default: false }),
  ORIGIN: str({ default: '*' }),
};

// Logging environment variables
export const loggingEnvSchema = {
  LOG_FORMAT: str({ choices: ['combined', 'common', 'dev', 'short', 'tiny'], default: 'combined' }),
  LOG_DIR: str({ default: './logs' }),
};

// Monitoring environment variables
export const monitoringEnvSchema = {
  ENABLE_METRICS: bool({ default: false }),
  METRICS_PORT: port({ default: 9090 }),
};

/**
 * Comprehensive environment validation for typical Express/Node.js applications
 */
export const fullAppEnvSchema = {
  ...baseEnvSchema,
  ...databaseEnvSchema,
  ...redisEnvSchema,
  ...authEnvSchema,
  ...securityEnvSchema,
  ...loggingEnvSchema,
  ...monitoringEnvSchema,
};

/**
 * Validate environment variables using envalid
 * @param schema - The validation schema to use
 * @param options - Additional options for cleanEnv
 * @returns Validated and typed environment variables
 */
export function validateEnv<T extends Record<string, any>>(
  schema: T,
  options?: {
    reporter?: (errors: any) => void;
    transformer?: (env: any) => any;
    strict?: boolean;
  }
) {
  return cleanEnv(process.env, schema, {
    strict: true,
    ...options,
  });
}

/**
 * Pre-configured environment validators for common use cases
 */
export const envValidators = {
  /**
   * Validate basic application environment variables
   */
  validateBaseEnv: () => validateEnv(baseEnvSchema),

  /**
   * Validate database environment variables
   */
  validateDatabaseEnv: () => validateEnv(databaseEnvSchema),

  /**
   * Validate Redis environment variables
   */
  validateRedisEnv: () => validateEnv(redisEnvSchema),

  /**
   * Validate authentication environment variables
   */
  validateAuthEnv: () => validateEnv(authEnvSchema),

  /**
   * Validate security environment variables
   */
  validateSecurityEnv: () => validateEnv(securityEnvSchema),

  /**
   * Validate logging environment variables
   */
  validateLoggingEnv: () => validateEnv(loggingEnvSchema),

  /**
   * Validate monitoring environment variables
   */
  validateMonitoringEnv: () => validateEnv(monitoringEnvSchema),

  /**
   * Validate all common application environment variables
   */
  validateFullAppEnv: () => validateEnv(fullAppEnvSchema),

  /**
   * Create a custom validator with selected schemas
   */
  createCustomValidator: (schemas: Record<string, any>[]) => {
    const combinedSchema = schemas.reduce((acc, schema) => ({ ...acc, ...schema }), {});
    return () => validateEnv(combinedSchema);
  },
};

/**
 * Type definitions for validated environment variables
 */
export type BaseEnv = ReturnType<typeof envValidators.validateBaseEnv>;
export type DatabaseEnv = ReturnType<typeof envValidators.validateDatabaseEnv>;
export type RedisEnv = ReturnType<typeof envValidators.validateRedisEnv>;
export type AuthEnv = ReturnType<typeof envValidators.validateAuthEnv>;
export type SecurityEnv = ReturnType<typeof envValidators.validateSecurityEnv>;
export type LoggingEnv = ReturnType<typeof envValidators.validateLoggingEnv>;
export type MonitoringEnv = ReturnType<typeof envValidators.validateMonitoringEnv>;
export type FullAppEnv = ReturnType<typeof envValidators.validateFullAppEnv>;
