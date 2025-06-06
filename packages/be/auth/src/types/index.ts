// Re-export base auth types from be-types
export type {
  User,
  SafeUser,
  CreateUserData,
  UpdateUserData,
  AuthResult,
  TokenPair,
  LoginCredentials,
  RegistrationData,
  PasswordResetRequest,
  PasswordResetData,
} from '@thrilled/be-types';

// Enhanced authentication types for this package
export interface JWTConfig {
  accessToken: {
    secret: string;
    expiresIn: string;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    issuer?: string;
    audience?: string;
  };
  refreshToken: {
    secret: string;
    expiresIn: string;
    algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
    issuer?: string;
    audience?: string;
  };
}

// JWT Token payload structures
export interface TokenPayload {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  userData: Record<string, unknown>;
  type: 'access' | 'refresh';
  iat: number;
}

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  userData: Record<string, unknown>;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
  iat: number;
  nonce?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export interface PasswordConfig {
  saltRounds: number;
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  requireSpecialChars: boolean;
  maxAttempts: number;
  lockoutDuration: string;
  ttl?: number; // Time to live for reset tokens in seconds
  blacklistedPasswords?: string[];
}

export interface SessionConfig {
  defaultTTL: string;
  prefix: string;
  ttl: number; // TTL in seconds
  maxSessionsPerUser: number;
  maxSessions?: number; // Alias for maxSessionsPerUser
  enableRollingSession: boolean;
  rolling: boolean; // Alias for enableRollingSession
  trackDevices: boolean;
  enableEventLogging: boolean;
}

export interface RBACConfig {
  enableRoleHierarchy: boolean;
  defaultRole: string;
  maxRolesPerUser: number;
}

export interface AuthConfig {
  jwt: JWTConfig;
  password: PasswordConfig;
  session: SessionConfig;
  rbac: RBACConfig;
}

// JWT Token payload structure
export interface JWTPayload {
  sub: string; // subject (user ID)
  iat: number; // issued at
  exp: number; // expiration
  nbf?: number; // not before
  iss?: string; // issuer
  aud?: string | string[]; // audience
  jti?: string; // JWT ID
  type: 'access' | 'refresh';
  role?: string;
  permissions?: string[];
  sessionId?: string;
  deviceId?: string;
}

// Token blacklist entry
export interface BlacklistedToken {
  jti: string;
  exp: number;
  reason?: string;
  blacklistedAt: Date;
}

// User session information
export interface UserSession {
  id?: string; // Optional ID for compatibility
  sessionId: string;
  userId: string;
  deviceId?: string;
  deviceVerified?: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    platform?: string;
  };
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Password reset token
export interface PasswordResetToken {
  token: string;
  hashedToken: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// Role-based access control types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
}

// Middleware context
export interface AuthContext {
  userId: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
  userData: Record<string, unknown>;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Authentication events
export interface AuthEvent {
  userId: string;
  sessionId?: string;
  eventType: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Rate limiting for auth endpoints
export interface AuthRateLimit {
  windowMs: number;
  maxAttempts: number;
  blockDuration: number;
  skipSuccessfulRequests: boolean;
}

// Cache manager interface for Redis-like operations
export interface CacheManager {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  exists(key: string): Promise<boolean>;

  // Helper methods for JSON serialization
  getObject<T>(key: string): Promise<T | null>;
  setObject<T>(key: string, value: T, ttl?: number): Promise<void>;
}

// Redis adapter for CacheManager
export class RedisCacheAdapter implements CacheManager {
  constructor(private redis: import('ioredis').Redis) {}

  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.setex(key, ttl, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async getObject<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setObject<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }
}
