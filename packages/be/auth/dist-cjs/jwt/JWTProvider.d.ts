import type { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { Logger } from '@mono/be-core';
import { JWTConfig, TokenValidationResult, AccessTokenPayload } from '../types/index.js';
export declare class JWTProvider {
    private redis;
    private config;
    private logger;
    private blacklistKeyPrefix;
    private refreshTokenPrefix;
    constructor(redis: Redis, config: JWTConfig, logger: Logger);
    /**
     * Create an access token
     */
    createAccessToken(payload: AccessTokenPayload): Promise<string>;
    /**
     * Create a refresh token
     */
    createRefreshToken(userId: string, sessionId: string): Promise<string>;
    /**
     * Verify an access token
     */
    verifyAccessToken(token: string): Promise<TokenValidationResult>;
    /**
     * Verify a refresh token
     */
    verifyRefreshToken(token: string): Promise<TokenValidationResult>;
    /**
     * Refresh tokens (generate new access token and optionally new refresh token)
     */
    refreshTokens(refreshToken: string, options?: {
        userData?: Record<string, any>;
        roles?: string[];
        permissions?: string[];
    }, config?: {
        rotateRefreshToken?: boolean;
    }): Promise<{
        accessToken: string;
        refreshToken?: string;
    } | null>;
    /**
     * Blacklist a token
     */
    blacklistToken(token: string): Promise<void>;
    /**
     * Check if a token is blacklisted
     */
    isTokenBlacklisted(token: string): Promise<boolean>;
    /**
     * Blacklist all tokens for a user
     */
    blacklistUserTokens(userId: string): Promise<void>;
    /**
     * Clean up expired blacklisted tokens
     */
    cleanupExpiredBlacklistedTokens(userId: string): Promise<number>;
    /**
     * Get token payload without verification (for debugging/logging)
     */
    getTokenPayload(token: string): jwt.JwtPayload | null;
    /**
     * Revoke a specific refresh token
     */
    revokeRefreshToken(token: string): Promise<void>;
    /**
     * Revoke all refresh tokens for a user
     */
    revokeAllRefreshTokens(userId: string): Promise<void>;
    /**
     * Parse expiration string to seconds
     */
    private parseExpirationToSeconds;
}
