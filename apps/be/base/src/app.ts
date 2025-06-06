import 'reflect-metadata';
import { BaseApp, ErrorMiddleware } from '@mono/be-core';
import { createAppConfig } from './config/app.config';
import { Routes } from '@interfaces/routes.interface';
import { DatabasePlugin } from '@/plugins/database.plugin';
import { AuthPlugin } from '@/plugins/auth.plugin';
import { RoutesPlugin } from '@/plugins/routes.plugin';
import { SwaggerPlugin } from '@/plugins/swagger.plugin';
import { RateLimitPlugin } from '@/plugins/rateLimit.plugin';
// ValidationPlugin is now automatically included in BaseApp

export class App extends BaseApp {
  private authPlugin?: AuthPlugin;

  constructor(routes: Routes[], authPlugin?: AuthPlugin) {
    const config = createAppConfig();
    super(config);

    this.authPlugin = authPlugin;
    this.setupPlugins(routes);
    this.setupCustomHealthChecks();
    this.setupErrorHandling();
  }

  private setupPlugins(routes: Routes[]) {
    // Database plugin
    this.use(new DatabasePlugin(this.getLogger()));

    // Validation plugin is now automatically included in BaseApp
    // No need to manually register it here

    // Authentication plugin - use shared instance if provided, otherwise create new one
    if (this.authPlugin) {
      this.use(this.authPlugin);
    } else {
      this.use(new AuthPlugin(this.getLogger()));
    }

    // Rate limiting plugin with environment-aware configuration
    this.use(new RateLimitPlugin(this.getLogger()), {
      environment: process.env.NODE_ENV,
    });

    // Routes plugin
    this.use(new RoutesPlugin(this.getLogger()), {
      routes,
      apiPrefix: '/api/v1',
    });

    // Swagger documentation plugin
    this.use(new SwaggerPlugin(this.getLogger()), {
      title: 'Base API',
      version: '1.0.0',
      description: 'Base management API documentation',
      apiPath: '/api/v1',
      docsPath: '/api-docs',
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
            status: 'healthy' as const,
            details: {
              connected: true,
              responseTime: Date.now(),
            },
          };
        } catch (error) {
          return {
            status: 'unhealthy' as const,
            details: {
              connected: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
    });

    // Add validation health check
    this.addHealthCheck({
      name: 'validation',
      check: async () => {
        try {
          const validationPlugin = this.getValidationPlugin();
          if (!validationPlugin) {
            return {
              status: 'unhealthy' as const,
              details: {
                error: 'Validation plugin not found',
              },
            };
          }
          const result = await validationPlugin.healthCheck();
          return {
            status: result.status as 'healthy' | 'unhealthy',
            details: result.details,
          };
        } catch (error) {
          return {
            status: 'unhealthy' as const,
            details: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      },
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
