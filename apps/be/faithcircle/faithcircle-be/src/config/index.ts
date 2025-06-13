import { config } from 'dotenv';
import { envValidators } from '@thrilled/be-types';

config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

// Validate and get typed environment variables
const env = envValidators.validateFullAppEnv();

// Export the full validated environment object
export { env };

// Export validated environment variables with proper types
export const CREDENTIALS = env.CREDENTIALS;
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const SECRET_KEY = env.SECRET_KEY;
export const LOG_FORMAT = env.LOG_FORMAT;
export const LOG_DIR = env.LOG_DIR;
export const ORIGIN = env.ORIGIN;
export const JWT_SECRET = env.JWT_SECRET;
export const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;
export const REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_EXPIRES_IN;
export const POSTGRES_USER = env.POSTGRES_USER;
export const POSTGRES_PASSWORD = env.POSTGRES_PASSWORD;
export const POSTGRES_HOST = env.POSTGRES_HOST;
export const POSTGRES_PORT = env.POSTGRES_PORT;
export const POSTGRES_DB = env.POSTGRES_DB;
export const REDIS_HOST = env.REDIS_HOST;
export const REDIS_PORT = env.REDIS_PORT;
export const REDIS_PASSWORD = env.REDIS_PASSWORD;
export const DB_CONFIG = {
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_DB,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
};
