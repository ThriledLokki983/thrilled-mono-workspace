import 'reflect-metadata';
import { BaseApp, ErrorMiddleware } from '@mono/be-core';
import { createAppConfig } from './config/app.config';
import { Routes } from '@interfaces/routes.interface';
import { DatabasePlugin } from '@/plugins/database.plugin';
import { RoutesPlugin } from '@/plugins/routes.plugin';
import { SwaggerPlugin } from '@/plugins/swagger.plugin';
import { RateLimitPlugin } from '@/plugins/rateLimit.plugin';

export class App extends BaseApp {
  constructor(routes: Routes[]) {
    const config = createAppConfig();
    super(config);

    this.setupPlugins(routes);
    this.setupCustomHealthChecks();
    this.setupErrorHandling();
  }

  private setupPlugins(routes: Routes[]) {
    // Database plugin
    this.use(new DatabasePlugin(this.getLogger()));

    // Rate limiting plugin with environment-aware configuration
    this.use(new RateLimitPlugin(this.getLogger()), {
      environment: process.env.NODE_ENV
    });

    // Routes plugin
    this.use(new RoutesPlugin(this.getLogger()), {
      routes,
      apiPrefix: '/api/v1'
    });

    // Swagger documentation plugin
    this.use(new SwaggerPlugin(this.getLogger()), {
      title: 'Base API',
      version: '1.0.0',
      description: 'Base management API documentation',
      apiPath: '/api/v1',
      docsPath: '/api-docs'
    });
  }

  private setupCustomHealthChecks() {
    // Add database health check
    this.addHealthCheck({
      name: 'database',
      check: async () => {
        try {
          // Add actual database health check here
          // For now, just return healthy
          return {
            status: 'healthy',
            details: {
              connected: true,
              responseTime: Date.now()
            }
          };
        } catch (error) {
          return {
            status: 'unhealthy',
            details: {
              connected: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      }
    });
  }

  private setupErrorHandling() {
    // Add error handling middleware
    const errorMiddleware = new ErrorMiddleware(this.getLogger());
    this.getApp().use(errorMiddleware.handle());
  }

  public getServer() {
    return this.getApp();
  }
}
