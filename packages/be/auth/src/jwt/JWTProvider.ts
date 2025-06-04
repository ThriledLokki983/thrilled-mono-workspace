import type { Redis } from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { Logger } from '@mono/be-core';
import { 
  JWTConfig, 
  TokenPayload, 
  RefreshTokenPayload, 
  TokenValidationResult,
  AccessTokenPayload 
} from '../types/index.js';

export class JWTProvider {
  private blacklistKeyPrefix = 'jwt:blacklist:';
  private refreshTokenPrefix = 'jwt:refresh:';

  constructor(
    private redis: Redis,
    private config: JWTConfig,
    private logger: Logger
  ) {}

  /**
   * Create an access token
   */
  async createAccessToken(payload: AccessTokenPayload): Promise<string> {
    try {
      const tokenPayload: TokenPayload = {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      };

      const options: jwt.SignOptions = {
        expiresIn: this.config.accessToken.expiresIn,
        algorithm: this.config.accessToken.algorithm
      };

      // Only add issuer and audience if they are defined
      if (this.config.accessToken.issuer) {
        options.issuer = this.config.accessToken.issuer;
      }
      if (this.config.accessToken.audience) {
        options.audience = this.config.accessToken.audience;
      }

      const token = jwt.sign(tokenPayload, this.config.accessToken.secret, options);

      this.logger.debug('Access token created', { userId: payload.userId });
      return token;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create access token:', { error: errorMessage });
      throw new Error('Token creation failed');
    }
  }

  /**
   * Create a refresh token
   */
  async createRefreshToken(userId: string, sessionId: string): Promise<string> {
    try {
      const tokenPayload: RefreshTokenPayload = {
        userId,
        sessionId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        // Add a random nonce to ensure uniqueness
        nonce: Math.random().toString(36).substring(2, 15)
      };

      const options: jwt.SignOptions = {
        expiresIn: this.config.refreshToken.expiresIn,
        algorithm: this.config.refreshToken.algorithm
      };

      // Only add issuer and audience if they are defined
      if (this.config.refreshToken.issuer) {
        options.issuer = this.config.refreshToken.issuer;
      }
      if (this.config.refreshToken.audience) {
        options.audience = this.config.refreshToken.audience;
      }

      const token = jwt.sign(tokenPayload, this.config.refreshToken.secret, options);

      // Store refresh token in Redis
      const key = `${this.refreshTokenPrefix}${userId}:${sessionId}`;
      const ttl = this.parseExpirationToSeconds(this.config.refreshToken.expiresIn);
      await this.redis.setex(key, ttl, token);

      this.logger.debug('Refresh token created', { userId, sessionId });
      return token;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to create refresh token:', { error: errorMessage });
      throw new Error('Refresh token creation failed');
    }
  }

  /**
   * Verify an access token
   */
  async verifyAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return { isValid: false, error: 'Token is blacklisted' };
      }

      const options: jwt.VerifyOptions = {
        algorithms: [this.config.accessToken.algorithm]
      };

      if (this.config.accessToken.issuer) {
        options.issuer = this.config.accessToken.issuer;
      }
      if (this.config.accessToken.audience) {
        options.audience = this.config.accessToken.audience;
      }

      const payload = jwt.verify(
        token,
        this.config.accessToken.secret,
        options
      ) as TokenPayload;

      if (payload.type !== 'access') {
        return { isValid: false, error: 'Invalid token type' };
      }

      return { isValid: true, payload };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      this.logger.debug('Access token verification failed:', { error: errorMessage });
      return { isValid: false, error: errorMessage };
    }
  }

  /**
   * Verify a refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenValidationResult> {
    try {
      const options: jwt.VerifyOptions = {
        algorithms: [this.config.refreshToken.algorithm]
      };

      if (this.config.refreshToken.issuer) {
        options.issuer = this.config.refreshToken.issuer;
      }
      if (this.config.refreshToken.audience) {
        options.audience = this.config.refreshToken.audience;
      }

      const payload = jwt.verify(
        token,
        this.config.refreshToken.secret,
        options
      ) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        return { isValid: false, error: 'Invalid token type' };
      }

      // Check if token exists in Redis
      const key = `${this.refreshTokenPrefix}${payload.userId}:${payload.sessionId}`;
      const storedToken = await this.redis.get(key);
      
      if (!storedToken || storedToken !== token) {
        return { isValid: false, error: 'Token not found in store' };
      }

      return { isValid: true, payload: {
        userId: payload.userId,
        sessionId: payload.sessionId,
        roles: [],
        permissions: [],
        userData: {},
        type: 'refresh',
        iat: payload.iat
      } };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      this.logger.debug('Refresh token verification failed:', { error: errorMessage });
      return { isValid: false, error: errorMessage };
    }
  }

  /**
   * Refresh tokens (generate new access token and optionally new refresh token)
   */
  async refreshTokens(
    refreshToken: string, 
    options?: {
      userData?: Record<string, any>;
      roles?: string[];
      permissions?: string[];
    },
    config?: {
      rotateRefreshToken?: boolean;
    }
  ): Promise<{ accessToken: string; refreshToken?: string } | null> {
    try {
      const verification = await this.verifyRefreshToken(refreshToken);
      if (!verification.isValid || !verification.payload) {
        return null;
      }

      const payload = verification.payload as RefreshTokenPayload;
      
      // Create new access token
      const accessTokenPayload: AccessTokenPayload = {
        userId: payload.userId,
        sessionId: payload.sessionId,
        roles: options?.roles || [],
        permissions: options?.permissions || [],
        userData: options?.userData || {}
      };
      
      const newAccessToken = await this.createAccessToken(accessTokenPayload);
      
      let newRefreshToken: string | undefined;
      const shouldRotate = config?.rotateRefreshToken !== false; // Default to true
      
      if (shouldRotate) {
        // Revoke old refresh token
        await this.revokeRefreshToken(refreshToken);
        
        // Create new refresh token
        newRefreshToken = await this.createRefreshToken(payload.userId, payload.sessionId);
      } else {
        // Don't rotate, return the same token
        newRefreshToken = refreshToken;
      }

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Token refresh failed:', { error: errorMessage });
      return null;
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      const decoded = this.getTokenPayload(token);
      if (!decoded || typeof decoded.exp !== 'number') {
        throw new Error('Invalid token format');
      }

      const tokenKey = `${this.blacklistKeyPrefix}${token}`;
      const ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
      
      await this.redis.setex(tokenKey, ttl, '1');
      this.logger.debug('Token blacklisted', { tokenPreview: token.substring(0, 20) + '...' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to blacklist token:', { error: errorMessage });
      throw new Error('Token blacklisting failed');
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenKey = `${this.blacklistKeyPrefix}${token}`;
      const exists = await this.redis.exists(tokenKey);
      return exists === 1;
    } catch (error: unknown) {
      this.logger.error('Failed to check token blacklist status:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Blacklist all tokens for a user
   */
  async blacklistUserTokens(userId: string): Promise<void> {
    try {
      const pattern = `blacklisted_tokens:${userId}`;
      const tokens = await this.redis.smembers(pattern);
      
      // Blacklist each token individually, skip invalid ones
      for (const token of tokens) {
        try {
          await this.blacklistToken(token);
        } catch (error) {
          // Log but don't fail for individual token errors
          this.logger.warn('Failed to blacklist individual token', { token: token.substring(0, 20) + '...' });
        }
      }
      
      this.logger.debug('All tokens blacklisted for user', { userId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to blacklist user tokens:', { error: errorMessage });
      throw new Error('User token blacklisting failed');
    }
  }

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupExpiredBlacklistedTokens(userId: string): Promise<number> {
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
    } catch (error: unknown) {
      this.logger.error('Failed to cleanup expired tokens:', { error: error instanceof Error ? error.message : String(error) });
      return 0;
    }
  }

  /**
   * Get token payload without verification (for debugging/logging)
   */
  getTokenPayload(token: string): jwt.JwtPayload | null {
    try {
      return jwt.decode(token) as jwt.JwtPayload;
    } catch (error: unknown) {
      this.logger.debug('Failed to decode token:', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    try {
      const decoded = this.getTokenPayload(token) as RefreshTokenPayload;
      if (!decoded || decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      const key = `${this.refreshTokenPrefix}${decoded.userId}:${decoded.sessionId}`;
      await this.redis.del(key);
      
      this.logger.debug('Refresh token revoked', { 
        userId: decoded.userId, 
        sessionId: decoded.sessionId 
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to revoke refresh token:', { error: errorMessage });
      throw new Error('Refresh token revocation failed');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    try {
      const pattern = `refresh_tokens:${userId}:*`;
      await this.redis.del(pattern);
      
      this.logger.debug('All refresh tokens revoked for user', { userId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to revoke all refresh tokens:', { error: errorMessage });
      throw new Error('Refresh token revocation failed');
    }
  }

  /**
   * Parse expiration string to seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const timeUnits: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400,
      'w': 604800
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
