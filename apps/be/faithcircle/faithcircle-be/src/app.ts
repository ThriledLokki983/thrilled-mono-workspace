import 'reflect-metadata';
import { BaseApp, ErrorMiddleware } from '@mono/be-core';
import { createAppConfig } from './config/app.config';
import { Routes } from './interfaces/routes.interface';
import {
  DatabasePlugin,
  AuthPlugin,
  RoutesPlugin,
  SwaggerPlugin,
  RateLimitPlugin,
  MonitoringPlugin,
} from './plugins';

export class App extends BaseApp {
  private authPlugin?: AuthPlugin;
  private monitoringPlugin?: MonitoringPlugin;

  constructor(routes: Routes[], authPlugin?: AuthPlugin) {
    const config = createAppConfig();
    super(config);

    this.authPlugin = authPlugin;
    this.setupPlugins(routes);
    this.setupCustomHealthChecks();
    this.setupErrorHandling();
  }

  private setupPlugins(routes: Routes[]) {
    // Monitoring plugin - should be set up early to capture metrics from other plugins
    this.monitoringPlugin = new MonitoringPlugin();
    this.use(this.monitoringPlugin, {
      enableMetrics: process.env.ENABLE_METRICS !== 'false',
      enableHealthChecks: true,
      enablePerformanceMonitoring: process.env.NODE_ENV !== 'test',
      metricsEndpoint: '/metrics',
      routePrefix: '/health',
    });

    // Database plugin
    this.use(new DatabasePlugin());

    //! Validation plugin is now automatically included in BaseApp
    //! No need to manually register it here

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
      title: 'FaithCircle API',
      version: '1.0.0',
      description: 'FaithCircle API documentation',
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

  /**
   * Get the monitoring plugin instance
   */
  getMonitoringPlugin(): MonitoringPlugin | undefined {
    return this.monitoringPlugin;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    this.monitoringPlugin?.recordCustomMetric(name, value, labels);
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus() {
    return this.monitoringPlugin?.getStatus();
  }

  /**
   * Initialize plugins for testing without starting the server
   */
  async initializeForTesting(): Promise<void> {
    // Use the plugin manager directly to initialize plugins
    await this.getPluginManager().initializeAll(this.getApp());
  }
}
