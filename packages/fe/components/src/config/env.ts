/**
 * Environment configuration
 * This file centralizes access to all environment variables in one place
 */

interface Environment {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  API_URL: string;
  // Add more environment variables as needed
}

// Use import.meta.env to access Vite's environment variables instead of process.env
const env: Environment = {
  NODE_ENV: (import.meta.env.VITE_NODE_ENV as Environment['NODE_ENV']) || 'development',
  PORT: Number(import.meta.env.VITE_PORT || 3000),
  API_URL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080/api',
};

/**
 * Determine if the application is running in production mode
 */
export const isProd = env.NODE_ENV === 'production';

/**
 * Determine if the application is running in development mode
 */
export const isDev = env.NODE_ENV === 'development';

/**
 * Determine if the application is running in staging mode
 */
export const isStaging = env.NODE_ENV === 'staging';

export default env;
