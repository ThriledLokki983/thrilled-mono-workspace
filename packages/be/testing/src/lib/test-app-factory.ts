import express from 'express';
import { Container } from 'typedi';
import { DatabaseManager, CacheManager } from '@thrilled/databases';
import { Logger } from '@mono/be-core';
import { TestAppConfig, TestAppInstance, TestDatabaseConfig, TestCacheConfig } from './types/test-types.js';
import { DatabaseTestHelper } from './database-test-helpers.js';

/**
 * Test Application Factory
 * Creates Express applications configured for testing with optional database and cache
 */
export class TestAppFactory {
  private static instances: Map<string, TestAppInstance> = new Map();

  /**
   * Create a test application instance
   */
  static async create(config: TestAppConfig = {}): Promise<TestAppInstance> {
    const app = express();
    const logger = new Logger({ 
      dir: './logs/test-app',
      level: 'debug'
    });
    const port = config.port || 0; // Use 0 for random available port

    // Configure basic middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    if (config.enableLogging) {
      app.use((req, res, next) => {
        logger.info(`${req.method} ${req.path}`, {
          body: req.body,
          query: req.query,
          params: req.params,
        });
        next();
      });
    }

    // Initialize database if configured
    let database: DatabaseManager | undefined;
    if (config.database) {
      database = await TestAppFactory.setupDatabase(config.database, logger);
      Container.set('databaseManager', database);
    }

    // Initialize cache if configured
    let cache: CacheManager | undefined;
    if (config.cache) {
      cache = await TestAppFactory.setupCache(config.cache, logger);
      Container.set('cacheManager', cache);
    }

    // Add custom middleware
    if (config.middleware) {
      config.middleware.forEach(middleware => {
        app.use(middleware);
      });
    }

    // Add routes
    if (config.routes) {
      config.routes.forEach(route => {
        app.use(route);
      });
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: database ? 'connected' : 'not configured',
        cache: cache ? 'connected' : 'not configured'
      });
    });

    const instance: TestAppInstance = {
      app,
      database,
      cache,
      logger,
      port,
      baseUrl: '',
      
      async start() {
        return new Promise((resolve, reject) => {
          try {
            this.server = app.listen(this.port, () => {
              const address = this.server?.address();
              const actualPort = typeof address === 'object' && address?.port || this.port;
              this.port = actualPort;
              this.baseUrl = `http://localhost:${actualPort}`;
              logger.info(`Test app started on port ${actualPort}`);
              resolve();
            });
          } catch (error) {
            reject(error);
          }
        });
      },

      async stop() {
        if (this.server) {
          return new Promise((resolve) => {
            this.server?.close(() => {
              logger.info('Test app stopped');
              resolve();
            });
          });
        }
      },

      async resetDatabase() {
        if (this.database) {
          await DatabaseTestHelper.clearAllTables(this.database);
        }
      },

      async resetCache() {
        if (this.cache) {
          await this.cache.flushAll();
        }
      },

      getConnection() {
        if (!this.database) {
          throw new Error('Database not configured for this test app');
        }
        return this.database.getConnection();
      }
    };

    return instance;
  }

  /**
   * Create a named test application instance that can be reused
   */
  static async createNamed(name: string, config: TestAppConfig = {}): Promise<TestAppInstance> {
    if (TestAppFactory.instances.has(name)) {
      const existingInstance = TestAppFactory.instances.get(name);
      if (!existingInstance) {
        throw new Error(`Instance ${name} exists but is undefined`);
      }
      return existingInstance;
    }

    const instance = await TestAppFactory.create(config);
    TestAppFactory.instances.set(name, instance);
    return instance;
  }

  /**
   * Get a named test application instance
   */
  static getInstance(name: string): TestAppInstance | undefined {
    return TestAppFactory.instances.get(name);
  }

  /**
   * Stop and cleanup a named instance
   */
  static async destroyInstance(name: string): Promise<void> {
    const instance = TestAppFactory.instances.get(name);
    if (instance) {
      await instance.stop();
      if (instance.database) {
        await instance.database.close();
      }
      if (instance.cache) {
        await instance.cache.close();
      }
      TestAppFactory.instances.delete(name);
    }
  }

  /**
   * Stop and cleanup all instances
   */
  static async destroyAll(): Promise<void> {
    const promises = Array.from(TestAppFactory.instances.keys()).map(name =>
      TestAppFactory.destroyInstance(name)
    );
    await Promise.all(promises);
  }

  /**
   * Setup test database
   */
  private static async setupDatabase(config: TestDatabaseConfig, logger: Logger): Promise<DatabaseManager> {
    const dbConfig = {
      connections: {
        test: {
          host: config.host || 'localhost',
          port: config.port || 5432,
          database: config.database || 'test_db',
          username: config.username || 'postgres',
          password: config.password || 'postgres',
          ssl: config.ssl || false,
          pool: {
            min: 1,
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 2000,
          },
        },
      },
      default: 'test',
      autoCreateDatabase: config.createDatabase !== false,
    };

    const databaseManager = new DatabaseManager(dbConfig, logger);
    await databaseManager.initialize();
    
    return databaseManager;
  }

  /**
   * Setup test cache
   */
  private static async setupCache(config: TestCacheConfig, logger: Logger): Promise<CacheManager> {
    const cacheConfig = {
      host: config.host || 'localhost',
      port: config.port || 6379,
      db: config.db || 0,
      password: config.password,
      keyPrefix: config.keyPrefix || 'test:',
      ttl: 300,
    };

    const cacheManager = new CacheManager(cacheConfig, logger);
    await cacheManager.initialize();
    
    return cacheManager;
  }
}

/**
 * Decorator for automatic test app setup and teardown
 */
export function withTestApp(config: TestAppConfig = {}) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const app = await TestAppFactory.create(config);
      await app.start();

      try {
        // Inject app into test context
        (this as Record<string, unknown>).testApp = app;
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        await app.stop();
        if (app.database) {
          await app.database.close();
        }
        if (app.cache) {
          await app.cache.close();
        }
      }
    };

    return descriptor;
  };
}
