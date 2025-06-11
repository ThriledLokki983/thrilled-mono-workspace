import { CacheManager } from '../cache/CacheManager';
import type { CacheConfig } from '@thrilled/be-types';
import type { Logger } from '@mono/be-core';

// Mock ioredis
jest.mock('ioredis', () => {
  const mockRedis = jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    flushall: jest.fn(),
  }));

  return {
    default: mockRedis,
    Redis: mockRedis,
  };
});

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let mockLogger: Logger;
  let config: CacheConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    config = {
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test',
      ttl: 3600,
    };

    cacheManager = new CacheManager(config, mockLogger);
  });

  afterEach(async () => {
    await cacheManager.close();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      expect(cacheManager).toBeDefined();
    });

    it('should connect to Redis on initialize', async () => {
      await cacheManager.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing Redis connection...'
      );
    });
  });

  describe('cache operations', () => {
    beforeEach(async () => {
      await cacheManager.initialize();
    });

    it('should set and get cache values', async () => {
      // Access private client for testing
      const mockClient = (
        cacheManager as unknown as {
          client: {
            get: jest.Mock;
            setex: jest.Mock;
          };
        }
      ).client;
      mockClient.get.mockResolvedValue(JSON.stringify({ test: 'value' }));

      await cacheManager.set('test-key', { test: 'value' });
      const result = await cacheManager.get('test-key');

      expect(mockClient.setex).toHaveBeenCalled();
      expect(result).toEqual({ test: 'value' });
    });

    it('should handle cache misses gracefully', async () => {
      const mockClient = (
        cacheManager as unknown as {
          client: {
            get: jest.Mock;
          };
        }
      ).client;
      mockClient.get.mockResolvedValue(null);

      const result = await cacheManager.get('nonexistent-key');
      expect(result).toBeNull();
    });

    it('should delete cache values', async () => {
      await cacheManager.del('test-key');
      const mockClient = (
        cacheManager as unknown as {
          client: {
            del: jest.Mock;
          };
        }
      ).client;
      expect(mockClient.del).toHaveBeenCalledWith('test:test-key');
    });

    it('should check if key exists', async () => {
      const mockClient = (
        cacheManager as unknown as {
          client: {
            exists: jest.Mock;
          };
        }
      ).client;
      mockClient.exists.mockResolvedValue(1);

      const exists = await cacheManager.exists('test-key');
      expect(exists).toBe(true);
    });

    it('should get keys matching pattern', async () => {
      const mockClient = (
        cacheManager as unknown as {
          client: {
            keys: jest.Mock;
          };
        }
      ).client;
      mockClient.keys.mockResolvedValue(['test:user:1', 'test:user:2']);

      const keys = await cacheManager.keys('user:*');
      expect(keys).toEqual(['user:1', 'user:2']);
    });

    it('should flush all keys', async () => {
      const mockClient = (
        cacheManager as unknown as {
          client: {
            flushall: jest.Mock;
          };
        }
      ).client;

      await cacheManager.flushAll();
      expect(mockClient.flushall).toHaveBeenCalled();
    });
  });
});
