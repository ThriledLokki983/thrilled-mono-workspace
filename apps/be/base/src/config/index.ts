import { config } from 'dotenv';
config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const { NODE_ENV, PORT, SECRET_KEY, LOG_FORMAT, LOG_DIR, ORIGIN } = process.env;
export const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = process.env;
export const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB } = process.env;
export const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;
export const DB_CONFIG = {
  POSTGRES_USER: POSTGRES_USER,
  POSTGRES_PASSWORD: POSTGRES_PASSWORD,
  POSTGRES_HOST: POSTGRES_HOST,
  POSTGRES_PORT: POSTGRES_PORT,
  POSTGRES_DB: POSTGRES_DB,
  REDIS_HOST: REDIS_HOST,
  REDIS_PORT: REDIS_PORT,
  REDIS_PASSWORD: REDIS_PASSWORD,
};
