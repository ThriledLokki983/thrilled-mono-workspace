import { BasePlugin } from '../';
import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Example: Authentication Plugin
 *
 * This example shows how to create a sophisticated plugin with:
 * - Custom configuration
 * - Middleware registration
 * - Route protection
 * - Error handling
 */

interface AuthConfig {
  jwtSecret: string;
  tokenExpiry: string;
  publicRoutes: string[];
}

class AuthenticationPlugin extends BasePlugin {
  readonly name = 'authentication';
  readonly version = '2.0.0';

  private config!: AuthConfig;

  protected async setup(config: AuthConfig): Promise<void> {
    this.config = {
      ...config,
      jwtSecret: config.jwtSecret || 'default-secret',
      tokenExpiry: config.tokenExpiry || '1h',
      publicRoutes: config.publicRoutes || ['/login', '/register', '/health'],
    };

    this.logger.info('Authentication plugin configured', {
      tokenExpiry: this.config.tokenExpiry,
      publicRoutes: this.config.publicRoutes.length,
    });
  }

  protected override registerMiddleware(app: Express): void {
    // JWT validation middleware
    app.use('/api', (req, res, next) => {
      const path = req.path;

      // Skip auth for public routes
      if (this.config.publicRoutes.includes(path)) {
        return next();
      }

      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Unauthorized access attempt', {
          path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(401).json({
          success: false,
          message: 'No token provided',
          statusCode: 401,
        });
        return;
      }

      // In a real implementation, you would verify the JWT token here
      this.logger.debug('Token validated for protected route', { path });

      // Add user info to request
      (req as Request & { user: { id: number; username: string } }).user = {
        id: 1,
        username: 'john_doe',
      };
      next();
    });
  }

  protected override registerRoutes(app: Express): void {
    // Login endpoint
    app.post('/api/login', (req, res) => {
      const { username, password } = req.body;

      this.logger.info('Login attempt', { username });

      // In a real implementation, verify credentials
      if (username && password) {
        const token = `fake-jwt-token-${Date.now()}`;

        this.logger.info('Login successful', { username });

        res.json({
          success: true,
          data: {
            token,
            user: { username },
            expiresIn: this.config.tokenExpiry,
          },
        });
      } else {
        this.logger.warn('Login failed - invalid credentials', { username });

        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
          statusCode: 401,
        });
      }
    });

    // User profile endpoint (protected)
    app.get('/api/profile', (req, res) => {
      const user = (req as Request & { user: { id: number; username: string } })
        .user;

      this.logger.debug('Profile accessed', { userId: user.id });

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          profile: {
            email: `${user.username}@example.com`,
            role: 'user',
          },
        },
      });
    });
  }

  protected override registerErrorHandlers(app: Express): void {
    // Auth-specific error handler
    app.use(
      '/api',
      (err: Error, req: Request, res: Response, next: NextFunction): void => {
        if (err.name === 'JsonWebTokenError') {
          this.logger.warn('JWT validation error', {
            error: err.message,
            path: req.path,
          });

          res.status(401).json({
            success: false,
            message: 'Invalid token',
            statusCode: 401,
          });
          return;
        }

        next(err);
      }
    );
  }
}

/**
 * Example: Metrics Collection Plugin
 *
 * This example shows how to:
 * - Collect application metrics
 * - Provide metrics endpoints
 * - Use timers and counters
 */

interface MetricsConfig {
  enabled: boolean;
  endpoint: string;
  collectSystemMetrics: boolean;
}

class MetricsPlugin extends BasePlugin {
  readonly name = 'metrics';
  readonly version = '1.5.0';

  private config!: MetricsConfig;
  private metrics = {
    requests: 0,
    errors: 0,
    responseTime: [] as number[],
  };

  protected setup(config: MetricsConfig): void {
    this.config = {
      ...config,
      enabled: config.enabled !== undefined ? config.enabled : true,
      endpoint: config.endpoint || '/metrics',
      collectSystemMetrics:
        config.collectSystemMetrics !== undefined
          ? config.collectSystemMetrics
          : true,
    };

    if (!this.config.enabled) {
      this.logger.info('Metrics collection disabled');
      return;
    }

    this.logger.info('Metrics plugin initialized', {
      endpoint: this.config.endpoint,
      systemMetrics: this.config.collectSystemMetrics,
    });

    // Start system metrics collection
    if (this.config.collectSystemMetrics) {
      this.startSystemMetricsCollection();
    }
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      const memUsage = process.memoryUsage();

      this.logger.debug('System metrics collected', {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()),
      });
    }, 30000); // Collect every 30 seconds
  }

  protected override registerMiddleware(app: Express): void {
    if (!this.config.enabled) return;

    // Request counting and timing middleware
    app.use((req, res, next) => {
      const startTime = Date.now();

      // Count request
      this.metrics.requests++;

      // Capture response time
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.metrics.responseTime.push(responseTime);

        // Keep only last 1000 response times
        if (this.metrics.responseTime.length > 1000) {
          this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
        }

        // Count errors
        if (res.statusCode >= 400) {
          this.metrics.errors++;
        }

        this.logger.debug('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
        });
      });

      next();
    });
  }

  protected override registerRoutes(app: Express): void {
    if (!this.config.enabled) return;

    app.get(this.config.endpoint, (req, res) => {
      const avgResponseTime =
        this.metrics.responseTime.length > 0
          ? this.metrics.responseTime.reduce((a, b) => a + b, 0) /
            this.metrics.responseTime.length
          : 0;

      const memUsage = process.memoryUsage();

      const metricsData = {
        application: {
          requests: this.metrics.requests,
          errors: this.metrics.errors,
          errorRate:
            this.metrics.requests > 0
              ? (this.metrics.errors / this.metrics.requests) * 100
              : 0,
          avgResponseTime: Math.round(avgResponseTime),
          uptime: Math.round(process.uptime()),
        },
        system: {
          memory: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
          },
          cpu: {
            usage: process.cpuUsage(),
          },
        },
        timestamp: new Date().toISOString(),
      };

      this.logger.debug('Metrics requested', { requestedBy: req.ip });

      res.json({
        success: true,
        data: metricsData,
      });
    });
  }
}

/**
 * Example: How to use these plugins in an application
 */
export function createExampleApplication() {
  const { BaseApp } = require('../');

  const app = new BaseApp({
    name: 'Plugin Example API',
    port: 3002,
    environment: 'development',
    logging: {
      level: 'debug',
      dir: './logs/plugin-example',
    },
  });

  // Register authentication plugin with custom config
  app.use(new AuthenticationPlugin(), {
    jwtSecret: 'super-secret-key',
    tokenExpiry: '24h',
    publicRoutes: ['/health', '/metrics', '/api/login'],
  });

  // Register metrics plugin
  app.use(new MetricsPlugin(), {
    enabled: true,
    endpoint: '/metrics',
    collectSystemMetrics: true,
  });

  // Add some test routes
  app.getApp().get('/api/test', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'This is a protected route',
      user: (req as Request & { user: { id: number; username: string } }).user,
    });
  });

  return app;
}

console.log(
  'Plugin development examples created. Use createExampleApplication() to test.'
);

export { AuthenticationPlugin, MetricsPlugin };
