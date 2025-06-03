
import { BaseApp, BasePlugin } from '../';
import type { Express, Request } from 'express';

// Example 1: Basic BaseApp usage
console.log('=== Example 1: Basic BaseApp Usage ===');

new BaseApp({
  name: 'My API Server',
  port: 3000,
  environment: 'development',
  logging: {
    level: 'debug',
    dir: './logs/example',
    format: 'simple'
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
});

// Example 2: Creating a custom plugin
console.log('\n=== Example 2: Custom Plugin ===');

class HealthCheckPlugin extends BasePlugin {
  readonly name = 'health-check';
  readonly version = '1.0.0';

  protected setup(): void {
    this.logger.info('Setting up health check plugin');
  }

  protected override registerRoutes(app: Express): void {
    app.get('/health', (req, res) => {
      this.logger.debug('Health check requested');
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    app.get('/ready', (req, res) => {
      this.logger.debug('Readiness check requested');
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    });
  }
}

// Example 3: Plugin with dependencies
console.log('\n=== Example 3: Plugin with Dependencies ===');

class DatabasePlugin extends BasePlugin {
  readonly name = 'database';
  readonly version = '1.0.0';

  protected async setup(): Promise<void> {
    this.logger.info('Connecting to database...');
    // Simulate database connection
    await new Promise(resolve => setTimeout(resolve, 100));
    this.logger.info('Database connected successfully');
  }

  protected override registerMiddleware(app: Express): void {
    app.use((req, res, next) => {
      // Add database connection to request
      (req as Request & { db: { connected: boolean } }).db = { connected: true };
      next();
    });
  }
}

class UserServicePlugin extends BasePlugin {
  readonly name = 'user-service';
  readonly version = '1.0.0';
  override dependencies = ['database']; // Depends on database plugin

  protected setup(): void {
    this.logger.info('Setting up user service');
  }

  protected override registerRoutes(app: Express): void {
    app.get('/users', (req, res) => {
      this.logger.debug('Users endpoint called');
      res.json({
        users: [
          { id: 1, name: 'John Doe' },
          { id: 2, name: 'Jane Smith' }
        ]
      });
    });
  }
}

// Example 4: Using the application with plugins
console.log('\n=== Example 4: Complete Application Setup ===');

async function createApplication() {
  const app = new BaseApp({
    name: 'Example API',
    port: 3001,
    environment: 'development',
    logging: {
      level: 'info',
      dir: './logs/api',
      format: 'json'
    }
  });

  // Register plugins
  app.use(new HealthCheckPlugin());
  app.use(new DatabasePlugin());
  app.use(new UserServicePlugin());

  // Add a route directly to the Express app
  app.getApp().get('/', (req, res) => {
    res.json({
      message: 'Welcome to the Example API',
      plugins: app.listPlugins()
    });
  });

  console.log('Registered plugins:', app.listPlugins());
  console.log('Plugin load order:', app.getPluginManager().getLoadOrder());

  // In a real application, you would call app.start() here
  // await app.start();
  
  return app;
}

// Example 5: Plugin management
console.log('\n=== Example 5: Plugin Management ===');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function pluginManagement() {
  const app = await createApplication();
  
  console.log('All plugins:', app.listPlugins());
  
  // Disable a plugin
  app.disablePlugin('health-check');
  console.log('After disabling health-check:', app.listPlugins());
  
  // Re-enable the plugin
  app.enablePlugin('health-check');
  console.log('After re-enabling health-check:', app.listPlugins());
}

// Run examples (commented out to avoid execution during import)
// createApplication().then(() => console.log('Application created successfully'));
// pluginManagement().then(() => console.log('Plugin management completed'));

console.log('\nBaseApp examples completed. Uncomment the last lines to run the examples.');
pluginManagement().then(() => console.log('Plugin management completed'));
