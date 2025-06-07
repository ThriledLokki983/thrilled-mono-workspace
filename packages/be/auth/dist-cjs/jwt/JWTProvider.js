"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTProvider = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTProvider {
    constructor(redis, config, logger) {
        this.redis = redis;
        this.config = config;
        this.logger = logger;
        this.blacklistKeyPrefix = 'jwt:blacklist:';
        this.refreshTokenPrefix = 'jwt:refresh:';
    }
    /**
     * Create an access token
     */
    async createAccessToken(payload) {
        try {
            const tokenPayload = {
                ...payload,
                type: 'access',
                iat: Math.floor(Date.now() / 1000),
            };
            const options = {
                expiresIn: this.config.accessToken.expiresIn,
                algorithm: this.config.accessToken.algorithm,
            };
            // Only add issuer and audience if they are defined
            if (this.config.accessToken.issuer) {
                options.issuer = this.config.accessToken.issuer;
            }
            if (this.config.accessToken.audience) {
                options.audience = this.config.accessToken.audience;
            }
            const token = jsonwebtoken_1.default.sign(tokenPayload, this.config.accessToken.secret, options);
            this.logger.debug('Access token created', { userId: payload.userId });
            return token;
        }
        catch (error) {
            // More detailed error logging
            console.error('JWT Provider createAccessToken error details:', {
                errorType: typeof error,
                errorConstructor: error?.constructor?.name,
                errorMessage: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
                payloadType: typeof payload,
                configType: typeof this.config,
                secretLength: this.config?.accessToken?.secret?.length,
                algorithm: this.config?.accessToken?.algorithm,
                expiresIn: this.config?.accessToken?.expiresIn
            });
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to create access token:', {
                error: errorMessage,
            });
            throw new Error('Token creation failed');
        }
    }
    /**
     * Create a refresh token
     */
    async createRefreshToken(userId, sessionId) {
        try {
            const tokenPayload = {
                userId,
                sessionId,
                type: 'refresh',
                iat: Math.floor(Date.now() / 1000),
                // Add a random nonce to ensure uniqueness
                nonce: Math.random().toString(36).substring(2, 15),
            };
            const options = {
                expiresIn: this.config.refreshToken.expiresIn,
                algorithm: this.config.refreshToken.algorithm,
            };
            // Only add issuer and audience if they are defined
            if (this.config.refreshToken.issuer) {
                options.issuer = this.config.refreshToken.issuer;
            }
            if (this.config.refreshToken.audience) {
                options.audience = this.config.refreshToken.audience;
            }
            const token = jsonwebtoken_1.default.sign(tokenPayload, this.config.refreshToken.secret, options);
            // Store refresh token in Redis
            const key = `${this.refreshTokenPrefix}${userId}:${sessionId}`;
            const ttl = this.parseExpirationToSeconds(this.config.refreshToken.expiresIn);
            await this.redis.setex(key, ttl, token);
            this.logger.debug('Refresh token created', { userId, sessionId });
            return token;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to create refresh token:', {
                error: errorMessage,
            });
            throw new Error('Refresh token creation failed');
        }
    }
    /**
     * Verify an access token
     */
    async verifyAccessToken(token) {
        try {
            // Check if token is blacklisted
            const isBlacklisted = await this.isTokenBlacklisted(token);
            if (isBlacklisted) {
                return { isValid: false, error: 'Token is blacklisted' };
            }
            const options = {
                algorithms: [this.config.accessToken.algorithm],
            };
            if (this.config.accessToken.issuer) {
                options.issuer = this.config.accessToken.issuer;
            }
            if (this.config.accessToken.audience) {
                options.audience = this.config.accessToken.audience;
            }
            const payload = jsonwebtoken_1.default.verify(token, this.config.accessToken.secret, options);
            if (payload.type !== 'access') {
                return { isValid: false, error: 'Invalid token type' };
            }
            return { isValid: true, payload };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
            this.logger.debug('Access token verification failed:', {
                error: errorMessage,
            });
            return { isValid: false, error: errorMessage };
        }
    }
    /**
     * Verify a refresh token
     */
    async verifyRefreshToken(token) {
        try {
            const options = {
                algorithms: [this.config.refreshToken.algorithm],
            };
            if (this.config.refreshToken.issuer) {
                options.issuer = this.config.refreshToken.issuer;
            }
            if (this.config.refreshToken.audience) {
                options.audience = this.config.refreshToken.audience;
            }
            const payload = jsonwebtoken_1.default.verify(token, this.config.refreshToken.secret, options);
            if (payload.type !== 'refresh') {
                return { isValid: false, error: 'Invalid token type' };
            }
            // Check if token exists in Redis
            const key = `${this.refreshTokenPrefix}${payload.userId}:${payload.sessionId}`;
            const storedToken = await this.redis.get(key);
            if (!storedToken || storedToken !== token) {
                return { isValid: false, error: 'Token not found in store' };
            }
            return {
                isValid: true,
                payload: {
                    userId: payload.userId,
                    sessionId: payload.sessionId,
                    roles: [],
                    permissions: [],
                    userData: {},
                    type: 'refresh',
                    iat: payload.iat,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
            this.logger.debug('Refresh token verification failed:', {
                error: errorMessage,
            });
            return { isValid: false, error: errorMessage };
        }
    }
    /**
     * Refresh tokens (generate new access token and optionally new refresh token)
     */
    async refreshTokens(refreshToken, options, config) {
        try {
            const verification = await this.verifyRefreshToken(refreshToken);
            if (!verification.isValid || !verification.payload) {
                return null;
            }
            const payload = verification.payload;
            // Create new access token
            const accessTokenPayload = {
                userId: payload.userId,
                sessionId: payload.sessionId,
                roles: options?.roles || [],
                permissions: options?.permissions || [],
                userData: options?.userData || {},
            };
            const newAccessToken = await this.createAccessToken(accessTokenPayload);
            let newRefreshToken;
            const shouldRotate = config?.rotateRefreshToken !== false; // Default to true
            if (shouldRotate) {
                // Revoke old refresh token
                await this.revokeRefreshToken(refreshToken);
                // Create new refresh token
                newRefreshToken = await this.createRefreshToken(payload.userId, payload.sessionId);
            }
            else {
                // Don't rotate, return the same token
                newRefreshToken = refreshToken;
            }
            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Token refresh failed:', { error: errorMessage });
            return null;
        }
    }
    /**
     * Blacklist a token
     */
    async blacklistToken(token) {
        try {
            const decoded = this.getTokenPayload(token);
            if (!decoded || typeof decoded.exp !== 'number') {
                throw new Error('Invalid token format');
            }
            const tokenKey = `${this.blacklistKeyPrefix}${token}`;
            const ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
            await this.redis.setex(tokenKey, ttl, '1');
            this.logger.debug('Token blacklisted', {
                tokenPreview: token.substring(0, 20) + '...',
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to blacklist token:', { error: errorMessage });
            throw new Error('Token blacklisting failed');
        }
    }
    /**
     * Check if a token is blacklisted
     */
    async isTokenBlacklisted(token) {
        try {
            const tokenKey = `${this.blacklistKeyPrefix}${token}`;
            const exists = await this.redis.exists(tokenKey);
            return exists === 1;
        }
        catch (error) {
            this.logger.error('Failed to check token blacklist status:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Blacklist all tokens for a user
     */
    async blacklistUserTokens(userId) {
        try {
            const pattern = `blacklisted_tokens:${userId}`;
            const tokens = await this.redis.smembers(pattern);
            // Blacklist each token individually, skip invalid ones
            for (const token of tokens) {
                try {
                    await this.blacklistToken(token);
                }
                catch (error) {
                    // Log but don't fail for individual token errors
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.logger.warn('Failed to blacklist individual token', {
                        token: token.substring(0, 20) + '...',
                        error: errorMessage,
                    });
                }
            }
            this.logger.debug('All tokens blacklisted for user', { userId });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to blacklist user tokens:', {
                error: errorMessage,
            });
            throw new Error('User token blacklisting failed');
        }
    }
    /**
     * Clean up expired blacklisted tokens
     */
    async cleanupExpiredBlacklistedTokens(userId) {
        try {
            const pattern = `blacklisted_tokens:${userId}`;
            const tokens = await this.redis.smembers(pattern);
            let cleanedCount = 0;
            for (const token of tokens) {
                // Check if the token key exists and has expired
                const tokenKey = `${this.blacklistKeyPrefix}${token}`;
                const ttl = await this.redis.ttl(tokenKey);
                // If TTL is -1, the key doesn't exist or has no expiry (expired)
                // If TTL is -2, the key doesn't exist
                if (ttl === -1 || ttl === -2) {
                    await this.redis.srem(pattern, token);
                    cleanedCount++;
                }
            }
            return cleanedCount;
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired tokens:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return 0;
        }
    }
    /**
     * Get token payload without verification (for debugging/logging)
     */
    getTokenPayload(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            this.logger.debug('Failed to decode token:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    /**
     * Revoke a specific refresh token
     */
    async revokeRefreshToken(token) {
        try {
            const decoded = this.getTokenPayload(token);
            if (!decoded || decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }
            const key = `${this.refreshTokenPrefix}${decoded.userId}:${decoded.sessionId}`;
            await this.redis.del(key);
            this.logger.debug('Refresh token revoked', {
                userId: decoded.userId,
                sessionId: decoded.sessionId,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to revoke refresh token:', {
                error: errorMessage,
            });
            throw new Error('Refresh token revocation failed');
        }
    }
    /**
     * Revoke all refresh tokens for a user
     */
    async revokeAllRefreshTokens(userId) {
        try {
            const pattern = `refresh_tokens:${userId}:*`;
            await this.redis.del(pattern);
            this.logger.debug('All refresh tokens revoked for user', { userId });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to revoke all refresh tokens:', {
                error: errorMessage,
            });
            throw new Error('Refresh token revocation failed');
        }
    }
    /**
     * Parse expiration string to seconds
     */
    parseExpirationToSeconds(expiration) {
        const timeUnits = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
            w: 604800,
        };
        const match = expiration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            throw new Error(`Invalid expiration format: ${expiration}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        return value * (timeUnits[unit] || 1);
    }
}
exports.JWTProvider = JWTProvider;
