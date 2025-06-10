import { DatabaseManager, CacheManager } from '@thrilled/databases';
import { Logger } from '@mono/be-core';
import { Container } from 'typedi';
import { TestSuiteConfig, TestDatabaseConfig, TestCacheConfig } from './types/test-types.js';
import { DatabaseTestHelper } from './database-test-helpers.js';
import { serviceMockManager } from './mocks/service-mocks.js';
import { MockRedis, createMockRedis } from './mocks/redis-mocks.js';

/**
 * Test Setup Manager
 * Provides utilities for setting up and tearing down test environments
 */
export class TestSetupManager {
  private static instance: TestSetupManager;
  private databaseManager?: DatabaseManager;
  private cacheManager?: CacheManager;
  private mockRedis?: MockRedis;
  private logger: Logger;
  private isSetup = false;

  private constructor() {
    this.logger = new Logger({ 
      dir: './logs/testing',
      level: 'debug'
    });
  }

  static getInstance(): TestSetupManager {
    if (!TestSetupManager.instance) {
      TestSetupManager.instance = new TestSetupManager();
    }
    return TestSetupManager.instance;
  }

  /**
   * Setup test environment
   */
  async setup(config: TestSuiteConfig): Promise<void> {
    if (this.isSetup) {
      this.logger.warn('Test environment already setup, skipping...');
      return;
    }

    this.logger.info(`Setting up test environment: ${config.name}`);

    try {
      // Setup database if configured
      if (config.database) {
        await this.setupDatabase(config.database);
      }

      // Setup cache if configured
      if (config.cache) {
        await this.setupCache(config.cache);
      }

      // Run custom setup
      if (config.setup) {
        await config.setup();
      }

      this.isSetup = true;
      this.logger.info('Test environment setup completed');
    } catch (error) {
      this.logger.error('Failed to setup test environment', { error });
      throw error;
    }
  }

  /**
   * Teardown test environment
   */
  async teardown(config?: TestSuiteConfig): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    this.logger.info('Tearing down test environment');

    try {
      // Run custom teardown
      if (config?.teardown) {
        await config.teardown();
      }

      // Close connections
      if (this.databaseManager) {
        await this.databaseManager.close();
        this.databaseManager = undefined;
      }

      if (this.cacheManager) {
        await this.cacheManager.close();
        this.cacheManager = undefined;
      }

      // Restore mocked services
      serviceMockManager.restoreAll();

      // Clear TypeDI container
      Container.reset();

      this.isSetup = false;
      this.logger.info('Test environment teardown completed');
    } catch (error) {
      this.logger.error('Failed to teardown test environment', { error });
      throw error;
    }
  }

  /**
   * Reset test environment between tests
   */
  async reset(config?: TestSuiteConfig): Promise<void> {
    this.logger.debug('Resetting test environment');

    try {
      // Reset database
      if (this.databaseManager && config?.database?.resetBetweenTests) {
        await DatabaseTestHelper.resetDatabase(this.databaseManager);
      }

      // Reset cache
      if (this.cacheManager && config?.cache?.resetBetweenTests) {
        await this.cacheManager.flushAll();
      }

      // Reset mock Redis
      if (this.mockRedis) {
        this.mockRedis.clearData();
      }

      // Reset mocks
      serviceMockManager.resetAllMocks();

      // Run custom reset
      if (config?.beforeEach) {
        await config.beforeEach();
      }

      this.logger.debug('Test environment reset completed');
    } catch (error) {
      this.logger.error('Failed to reset test environment', { error });
      throw error;
    }
  }

  /**
   * Cleanup after tests
   */
  async cleanup(config?: TestSuiteConfig): Promise<void> {
    this.logger.debug('Cleaning up test environment');

    try {
      // Run custom cleanup
      if (config?.afterEach) {
        await config.afterEach();
      }

      // Clear mock calls
      serviceMockManager.clearAllMocks();

      this.logger.debug('Test environment cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup test environment', { error });
      throw error;
    }
  }

  /**
   * Get database manager
   */
  getDatabaseManager(): DatabaseManager | undefined {
    return this.databaseManager;
  }

  /**
   * Get cache manager
   */
  getCacheManager(): CacheManager | undefined {
    return this.cacheManager;
  }

  /**
   * Get mock Redis instance
   */
  getMockRedis(): MockRedis | undefined {
    return this.mockRedis;
  }

  /**
   * Setup test database
   */
  async setupDatabase(config: TestDatabaseConfig): Promise<void> {
    this.logger.info('Setting up test database');
    
    this.databaseManager = await DatabaseTestHelper.setupTestDatabase(config);
    
    // Register in container
    Container.set('databaseManager', this.databaseManager);
    
    this.logger.info('Test database setup completed');
  }

  /**
   * Setup test cache
   */
  private async setupCache(config: TestCacheConfig): Promise<void> {
    this.logger.info('Setting up test cache');

    if (process.env.NODE_ENV === 'test' || config.host === 'mock') {
      // Use mock Redis for testing
      this.mockRedis = createMockRedis();
      
      // Mock the Redis constructor
      jest.doMock('ioredis', () => ({
        Redis: jest.fn().mockImplementation(() => this.mockRedis),
        default: jest.fn().mockImplementation(() => this.mockRedis),
      }));

      // Create a mock cache manager
      this.cacheManager = {
        get: async (key: string) => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          return await this.mockRedis.get(key);
        },
        set: async (key: string, value: unknown, ttl?: number) => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          const serialized = JSON.stringify(value);
          return ttl 
            ? await this.mockRedis.setex(key, ttl, serialized)
            : await this.mockRedis.set(key, serialized);
        },
        del: async (key: string) => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          return await this.mockRedis.del(key);
        },
        exists: async (key: string) => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          return await this.mockRedis.exists(key);
        },
        flushAll: async () => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          return await this.mockRedis.flushall();
        },
        keys: async (pattern: string) => {
          if (!this.mockRedis) throw new Error('Mock Redis not initialized');
          return await this.mockRedis.keys(pattern);
        },
        initialize: async () => Promise.resolve(),
        close: async () => Promise.resolve(),
      } as CacheManager;
    } else {
      // Use real Redis connection for integration tests
      const cacheConfig = {
        host: config.host || 'localhost',
        port: config.port || 6379,
        db: config.db || 0,
        password: config.password,
        keyPrefix: config.keyPrefix || 'test:',
        ttl: 300,
      };

      this.cacheManager = new CacheManager(cacheConfig, this.logger);
      await this.cacheManager.initialize();
    }

    // Register in container
    Container.set('cacheManager', this.cacheManager);

    this.logger.info('Test cache setup completed');
  }
}

/**
 * Jest Setup Utilities
 */
export class JestSetupUtils {
  /**
   * Setup Jest globals for testing
   */
  static setupGlobals(config: TestSuiteConfig): void {
    const setupManager = TestSetupManager.getInstance();

    // Setup before all tests
    beforeAll(async () => {
      await setupManager.setup(config);
    });

    // Teardown after all tests
    afterAll(async () => {
      await setupManager.teardown(config);
    });

    // Reset before each test
    beforeEach(async () => {
      await setupManager.reset(config);
    });

    // Cleanup after each test
    afterEach(async () => {
      await setupManager.cleanup(config);
    });
  }

  /**
   * Setup database testing globals
   */
  static setupDatabaseTesting(config: TestDatabaseConfig): void {
    this.setupGlobals({
      name: 'Database Tests',
      database: config,
    });
  }

  /**
   * Setup cache testing globals
   */
  static setupCacheTesting(config: TestCacheConfig): void {
    this.setupGlobals({
      name: 'Cache Tests',
      cache: config,
    });
  }

  /**
   * Setup full integration testing
   */
  static setupIntegrationTesting(
    database: TestDatabaseConfig,
    cache: TestCacheConfig
  ): void {
    this.setupGlobals({
      name: 'Integration Tests',
      database,
      cache,
    });
  }
}

/**
 * Test Environment Helper
 */
export class TestEnvironmentHelper {
  /**
   * Check if running in test environment
   */
  static isTestEnvironment(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  }

  /**
   * Get test database configuration from environment
   */
  static getTestDatabaseConfig(): TestDatabaseConfig {
    return DatabaseTestHelper.createTestConfig();
  }

  /**
   * Get test cache configuration from environment
   */
  static getTestCacheConfig(): TestCacheConfig {
    return {
      host: process.env.TEST_REDIS_HOST || 'mock',
      port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
      db: parseInt(process.env.TEST_REDIS_DB || '1'),
      password: process.env.TEST_REDIS_PASSWORD,
      keyPrefix: 'test:',
      flushOnClose: true,
      resetBetweenTests: true,
    };
  }

  /**
   * Wait for async operations to complete
   */
  static async waitForAsync(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 100
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.waitForAsync(backoffMs * Math.pow(2, i));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Create isolated test scope
   */
  static async withIsolatedScope<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const originalContainer = Container.of();
    const isolatedContainer = Container.of('test-scope');

    try {
      Container.set = isolatedContainer.set.bind(isolatedContainer);
      Container.get = isolatedContainer.get.bind(isolatedContainer);
      Container.remove = isolatedContainer.remove.bind(isolatedContainer);

      return await operation();
    } finally {
      // Restore original container
      Container.set = originalContainer.set.bind(originalContainer);
      Container.get = originalContainer.get.bind(originalContainer);
      Container.remove = originalContainer.remove.bind(originalContainer);

      // Reset isolated container
      isolatedContainer.reset();
    }
  }
}

/**
 * Global test setup function
 */
export async function setupTestEnvironment(config: TestSuiteConfig): Promise<void> {
  const setupManager = TestSetupManager.getInstance();
  await setupManager.setup(config);
}

/**
 * Global test teardown function
 */
export async function teardownTestEnvironment(config?: TestSuiteConfig): Promise<void> {
  const setupManager = TestSetupManager.getInstance();
  await setupManager.teardown(config);
}

/**
 * Test suite decorator
 */
export function TestSuite(config: TestSuiteConfig) {
  return function (target: unknown) {
    // Setup Jest globals for the test suite
    JestSetupUtils.setupGlobals(config);
    return target;
  };
}

/**
 * Database test decorator
 */
export function DatabaseTest(config?: TestDatabaseConfig) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const setupManager = TestSetupManager.getInstance();
      const databaseConfig = config || TestEnvironmentHelper.getTestDatabaseConfig();

      await setupManager.setupDatabase(databaseConfig);

      try {
        // Inject database manager into test context
        (this as Record<string, unknown>).database = setupManager.getDatabaseManager();
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        if (databaseConfig.resetBetweenTests) {
          await setupManager.reset({ name: 'test', database: databaseConfig });
        }
      }
    };

    return descriptor;
  };
}
