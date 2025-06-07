export type { User, SafeUser, CreateUserData, UpdateUserData, AuthResult, TokenPair, LoginCredentials, RegistrationData, PasswordResetRequest, PasswordResetData, } from '@thrilled/be-types';
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
    ttl?: number;
    blacklistedPasswords?: string[];
}
export interface SessionConfig {
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
export interface JWTPayload {
    sub: string;
    iat: number;
    exp: number;
    nbf?: number;
    iss?: string;
    aud?: string | string[];
    jti?: string;
    type: 'access' | 'refresh';
    role?: string;
    permissions?: string[];
    sessionId?: string;
    deviceId?: string;
}
export interface BlacklistedToken {
    jti: string;
    exp: number;
    reason?: string;
    blacklistedAt: Date;
}
export interface UserSession {
    id?: string;
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
export interface PasswordResetToken {
    token: string;
    hashedToken: string;
    userId: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
}
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
export interface AuthRateLimit {
    windowMs: number;
    maxAttempts: number;
    blockDuration: number;
    skipSuccessfulRequests: boolean;
}
export interface CacheManager {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    exists(key: string): Promise<boolean>;
    getObject<T>(key: string): Promise<T | null>;
    setObject<T>(key: string, value: T, ttl?: number): Promise<void>;
}
export declare class RedisCacheAdapter implements CacheManager {
    private redis;
    constructor(redis: import('ioredis').Redis);
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    exists(key: string): Promise<boolean>;
    getObject<T>(key: string): Promise<T | null>;
    setObject<T>(key: string, value: T, ttl?: number): Promise<void>;
}
