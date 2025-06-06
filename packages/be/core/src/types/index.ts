import type { CorsOptions } from 'cors';

// Import shared types from be-types for use internally (not re-exported to avoid conflicts)
import type {
  Environment as BeTypesEnvironment,
  SecurityConfig,
  JWTConfig,
  BcryptConfig,
  SessionConfig,
} from '@thrilled/be-types';

// Re-export some utility types that don't conflict
export type { Environment } from '@thrilled/be-types';

export interface AppLoggingConfig {
  level?: string;
  dir?: string;
  format?: 'json' | 'simple';
  httpLogging?: boolean;
  maxFiles?: number;
  correlationId?: boolean;
}

export interface RateLimitConfig {
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skip?: (req: unknown) => boolean;
  keyGenerator?: (req: unknown) => string;
  onLimitReached?: (
    req: unknown,
    res: unknown,
    options: RateLimitConfig
  ) => void;
}

export interface CorsConfig extends CorsOptions {
  [key: string]: unknown;
}

export interface HelmetConfig {
  // Basic helmet configuration without extending HelmetOptions to avoid type issues
  contentSecurityPolicy?: boolean | Record<string, unknown>;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean | Record<string, unknown>;
  dnsPrefetchControl?: boolean;
  frameguard?: boolean | Record<string, unknown>;
  hidePoweredBy?: boolean;
  hsts?: boolean | Record<string, unknown>;
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: boolean | Record<string, unknown>;
  referrerPolicy?: boolean | Record<string, unknown>;
  xssFilter?: boolean;
}

export interface AppConfig {
  name?: string;
  port?: number;
  host?: string;
  env?: string;
  environment?: BeTypesEnvironment;
  logging?: AppLoggingConfig;
  cors?: CorsConfig;
  rateLimit?: RateLimitConfig;
  helmet?: HelmetConfig;
  security?: SecurityConfig; // Use SecurityConfig from be-types
  timeout?: number;
  gracefulShutdown?: {
    enabled?: boolean;
    timeout?: number;
    signals?: string[];
  };
  metrics?: {
    enabled?: boolean;
    endpoint?: string;
  };
  health?: {
    enabled?: boolean;
    endpoint?: string;
  };
}

export interface PluginConfig {
  [key: string]: unknown;
}

export interface PluginDependency {
  name: string;
  version?: string;
  optional?: boolean;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: PluginDependency[];
  tags?: string[];
}

export interface HealthCheckOptions {
  enabled?: boolean;
  endpoint?: string;
  checks?: Record<string, () => Promise<HealthCheckResult>>;
  timeout?: number;
  interval?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  message?: string;
  data?: Record<string, unknown>;
}

export interface HealthCheckStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: Record<string, HealthCheckResult>;
  uptime: number;
}

export interface GracefulShutdownOptions {
  enabled?: boolean;
  timeout?: number;
  signals?: string[];
  cleanup?: (() => Promise<void>)[];
}

export enum HttpStatusCodes {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    count?: number;
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
  errors?: ApiError[];
  statusCode: HttpStatusCodes;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  total?: number;
}

// Re-export security config types from be-types for convenience
export type { SecurityConfig, JWTConfig, BcryptConfig, SessionConfig };
