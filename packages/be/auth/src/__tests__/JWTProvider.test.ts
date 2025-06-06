import { JWTProvider } from '../jwt/JWTProvider.js';
import { JWTConfig } from '../types/index.js';
import type { Redis } from 'ioredis';
import { Logger } from '@mono/be-core';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn(),
  };
});

// Mock Logger
jest.mock('@mono/be-core', () => {
  return {
    Logger: jest.fn(),
  };
});

describe('JWTProvider', () => {
  let jwtProvider: JWTProvider;
  let mockRedis: jest.Mocked<Redis>;
  let mockLogger: jest.Mocked<Logger>;

  const testConfig: JWTConfig = {
    accessToken: {
      secret: 'test-access-secret',
      expiresIn: '15m',
      algorithm: 'HS256',
    },
    refreshToken: {
      secret: 'test-refresh-secret',
      expiresIn: '7d',
      algorithm: 'HS256',
    },
  };

  beforeEach(() => {
    // Setup mocks
    mockRedis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([]),
      sadd: jest.fn().mockResolvedValue(1),
      smembers: jest.fn().mockResolvedValue([]),
      srem: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(3600),
      exists: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<Redis>;

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    jwtProvider = new JWTProvider(mockRedis, testConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAccessToken', () => {
    it('should create a valid access token', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: { email: 'test@example.com' },
      };

      const token = await jwtProvider.createAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format
    });

    it('should create token with custom options', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: { email: 'test@example.com' },
      };

      const token = await jwtProvider.createAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should handle errors gracefully', async () => {
      const invalidPayload = null as unknown as Parameters<
        typeof jwtProvider.createAccessToken
      >[0];

      await expect(
        jwtProvider.createAccessToken(invalidPayload)
      ).rejects.toThrow();
    });
  });

  describe('createRefreshToken', () => {
    it('should create and store a refresh token', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      const token = await jwtProvider.createRefreshToken(userId, sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle custom expiration', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      const token = await jwtProvider.createRefreshToken(userId, sessionId);

      expect(token).toBeDefined();
      expect(mockRedis.setex).toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      // Mock Redis to return that token is not blacklisted
      mockRedis.exists.mockResolvedValue(0);

      const verified = await jwtProvider.verifyAccessToken(token);

      expect(verified).toBeDefined();
      expect(verified.isValid).toBe(true);
      expect(verified.payload?.userId).toBe('user123');
      expect(verified.payload?.sessionId).toBe('session123');
    });

    it('should reject blacklisted tokens', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      // Mock Redis to return that token is blacklisted
      mockRedis.exists.mockResolvedValue(1);

      const verified = await jwtProvider.verifyAccessToken(token);

      expect(verified.isValid).toBe(false);
      expect(verified.error).toBe('Token is blacklisted');
    });

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here';

      const verified = await jwtProvider.verifyAccessToken(invalidToken);

      expect(verified.isValid).toBe(false);
      expect(verified.error).toContain('invalid token');
    });

    it('should reject expired tokens', async () => {
      // Create token with very short expiration
      const config = {
        ...testConfig,
        accessToken: { ...testConfig.accessToken, expiresIn: '1ms' },
      };
      const shortJwtProvider = new JWTProvider(mockRedis, config, mockLogger);

      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await shortJwtProvider.createAccessToken(payload);

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 10));

      const verified = await shortJwtProvider.verifyAccessToken(token);

      expect(verified.isValid).toBe(false);
      expect(verified.error).toContain('expired');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const token = await jwtProvider.createRefreshToken(userId, sessionId);

      // Mock Redis to return the same token
      mockRedis.get.mockResolvedValue(token);

      const verified = await jwtProvider.verifyRefreshToken(token);

      expect(verified.isValid).toBe(true);
      expect(verified.payload?.userId).toBe(userId);
      expect(verified.payload?.sessionId).toBe(sessionId);
    });

    it('should reject tokens not in Redis', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const token = await jwtProvider.createRefreshToken(userId, sessionId);

      // Mock Redis to return null (token not found)
      mockRedis.get.mockResolvedValue(null);

      const verified = await jwtProvider.verifyRefreshToken(token);

      expect(verified.isValid).toBe(false);
      expect(verified.error).toBe('Token not found in store');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const userData = { email: 'test@example.com' };
      const roles = ['user'];
      const permissions = ['read'];

      const oldRefreshToken = await jwtProvider.createRefreshToken(
        userId,
        sessionId
      );

      // Mock Redis to return the same token for verification
      mockRedis.get.mockResolvedValue(oldRefreshToken);

      const result = await jwtProvider.refreshTokens(oldRefreshToken, {
        userData,
        roles,
        permissions,
      });

      expect(result).toBeDefined();
      if (result) {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.refreshToken).not.toBe(oldRefreshToken); // Should be rotated
      }
    });

    it('should not rotate refresh token when disabled', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const oldRefreshToken = await jwtProvider.createRefreshToken(
        userId,
        sessionId
      );

      // Mock Redis to return the same token for verification
      mockRedis.get.mockResolvedValue(oldRefreshToken);

      const result = await jwtProvider.refreshTokens(
        oldRefreshToken,
        { userData: {}, roles: [], permissions: [] },
        { rotateRefreshToken: false }
      );

      expect(result).toBeDefined();
      if (result) {
        expect(result.refreshToken).toBe(oldRefreshToken);
      }
    });

    it('should fail with invalid refresh token', async () => {
      const invalidToken = 'invalid.token.here';

      const result = await jwtProvider.refreshTokens(invalidToken, {
        userData: {},
        roles: [],
        permissions: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('blacklistToken', () => {
    it('should blacklist a token', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      await jwtProvider.blacklistToken(token);

      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should handle invalid tokens gracefully', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(jwtProvider.blacklistToken(invalidToken)).rejects.toThrow();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should check if token is blacklisted', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      // Mock Redis to return that token exists in blacklist
      mockRedis.exists.mockResolvedValue(1);

      const isBlacklisted = await jwtProvider.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalled();
    });

    it('should return false for non-blacklisted tokens', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      // Mock Redis to return that token doesn't exist in blacklist
      mockRedis.exists.mockResolvedValue(0);

      const isBlacklisted = await jwtProvider.isTokenBlacklisted(token);

      expect(isBlacklisted).toBe(false);
    });
  });

  describe('blacklistUserTokens', () => {
    it('should blacklist all tokens for a user', async () => {
      const userId = 'user123';

      // Mock Redis to return some blacklisted tokens
      mockRedis.smembers.mockResolvedValue(['token1', 'token2']);

      await jwtProvider.blacklistUserTokens(userId);

      expect(mockRedis.smembers).toHaveBeenCalledWith(
        `blacklisted_tokens:${userId}`
      );
    });
  });

  describe('cleanupExpiredBlacklistedTokens', () => {
    it('should cleanup expired blacklisted tokens', async () => {
      const userId = 'user123';

      // Mock Redis to return some tokens with TTL
      mockRedis.smembers.mockResolvedValue(['token1', 'token2']);
      mockRedis.ttl.mockResolvedValueOnce(-1).mockResolvedValueOnce(3600);

      const cleaned = await jwtProvider.cleanupExpiredBlacklistedTokens(userId);

      expect(cleaned).toBe(1); // One token should be cleaned
      expect(mockRedis.srem).toHaveBeenCalledWith(
        `blacklisted_tokens:${userId}`,
        'token1'
      );
    });
  });

  describe('getTokenPayload', () => {
    it('should decode token payload without verification', async () => {
      const payload = {
        userId: 'user123',
        sessionId: 'session123',
        roles: ['user'],
        permissions: ['read'],
        userData: {},
      };
      const token = await jwtProvider.createAccessToken(payload);

      const decoded = jwtProvider.getTokenPayload(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('user123');
      expect(decoded?.sessionId).toBe('session123');
    });

    it('should return null for invalid tokens', () => {
      const invalidToken = 'invalid.token.here';

      const decoded = jwtProvider.getTokenPayload(invalidToken);

      expect(decoded).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke a refresh token', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const token = await jwtProvider.createRefreshToken(userId, sessionId);

      await jwtProvider.revokeRefreshToken(token);

      expect(mockRedis.del).toHaveBeenCalled();
    });
  });

  describe('revokeAllRefreshTokens', () => {
    it('should revoke all refresh tokens for a user', async () => {
      const userId = 'user123';

      await jwtProvider.revokeAllRefreshTokens(userId);

      expect(mockRedis.del).toHaveBeenCalledWith(`refresh_tokens:${userId}:*`);
    });
  });
});
