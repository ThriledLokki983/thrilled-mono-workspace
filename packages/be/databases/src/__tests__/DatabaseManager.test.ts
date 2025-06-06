import { DatabaseManager } from '../managers/DatabaseManager.js';
import { DatabaseManagerConfig } from '@thrilled/be-types';
import { Logger } from '@mono/be-core';

// Mock dependencies
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      release: jest.fn(),
    }),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    on: jest.fn(),
    totalCount: 10,
    idleCount: 5,
    waitingCount: 0,
  })),
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  })),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue('OK'),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn(),
    on: jest.fn(),
    status: 'ready',
  }));
});

describe('DatabaseManager', () => {
  let databaseManager: DatabaseManager;
  let mockLogger: jest.Mocked<Logger>;
  let config: DatabaseManagerConfig;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    config = {
      connections: {
        primary: {
          host: 'localhost',
          port: 5432,
          database: 'test_db',
          username: 'test_user',
          password: 'test_password',
        },
      },
      default: 'primary',
      autoCreateDatabase: false,
    };

    databaseManager = new DatabaseManager(config, mockLogger);
  });

  afterEach(async () => {
    await databaseManager.close();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      expect(databaseManager).toBeDefined();
    });

    it('should connect to databases on initialize', async () => {
      await databaseManager.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initializing DatabaseManager...'
      );
    });
  });

  describe('connection management', () => {
    beforeEach(async () => {
      await databaseManager.initialize();
    });

    it('should get default connection', () => {
      const connection = databaseManager.getConnection();
      expect(connection).toBeDefined();
    });

    it('should get named connection', () => {
      const connection = databaseManager.getConnection('primary');
      expect(connection).toBeDefined();
    });

    it('should throw error for non-existent connection', () => {
      expect(() => databaseManager.getConnection('nonexistent')).toThrow();
    });
  });

  describe('health checks', () => {
    beforeEach(async () => {
      await databaseManager.initialize();
    });

    it('should perform health check', async () => {
      const health = await databaseManager.getHealthCheck();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connections');
      expect(health).toHaveProperty('uptime');
    });
  });

  describe('transactions', () => {
    beforeEach(async () => {
      await databaseManager.initialize();
    });

    it('should execute transaction successfully', async () => {
      const result = await databaseManager.withTransaction(async () => {
        return 'success';
      });
      expect(result).toBe('success');
    });
  });
});
