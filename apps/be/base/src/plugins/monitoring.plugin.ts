/* eslint-disable @typescript-eslint/no-explicit-any */
import { Container } from 'typedi';
import { Express } from 'express';
import { BasePlugin } from '@mono/be-core';
import {
  MonitoringService,
  createMonitoringService,
  defaultMonitoringConfig,
  MonitoringConfig,
  HealthCheckDependency,
  MetricDefinition
} from '@thrilled/monitoring';

export interface MonitoringPluginOptions {
  config?: Partial<MonitoringConfig>;
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
  enablePerformanceMonitoring?: boolean;
  metricsEndpoint?: string;
  healthPath?: string;
  routePrefix?: string;
}

/**
 * Plugin for managing monitoring and health checks in the application.
 * This plugin provides a comprehensive monitoring solution
 * including Prometheus metrics, health checks, and performance monitoring.
 * It integrates with the MonitoringService to provide a unified interface
 * for monitoring various aspects of the application.
 * It also supports custom metrics and health checks for dependencies.
 */
export class MonitoringPlugin extends BasePlugin {
  readonly name = 'monitoring';
  readonly version = '1.0.0';

  private monitoringService?: MonitoringService;

  protected async setup(options: MonitoringPluginOptions = {}): Promise<void> {
    try {
      this.logger.info('Setting up monitoring plugin...');

      // Clear any existing metrics to prevent conflicts during hot reloading
      const { register } = await import('prom-client');
      register.clear();

      // Create monitoring configuration with unique prefix to avoid conflicts
      const uniquePrefix = `base_app_${Date.now()}_`;
      const enableMetrics = process.env.ENABLE_METRICS === 'true' && options.enableMetrics !== false;

      const monitoringConfig: MonitoringConfig = {
        ...defaultMonitoringConfig,
        ...options.config,
        metrics: {
          enabled: enableMetrics,
          port: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 9090,
          endpoint: options.metricsEndpoint ?? '/metrics',
          collectDefaultMetrics: enableMetrics,
          prefix: process.env.NODE_ENV === 'development' ? uniquePrefix : 'base_app_',
          ...options.config?.metrics,
        },
        healthChecks: {
          enabled: options.enableHealthChecks ?? true,
          timeout: 5000,
          concurrency: 5,
          memoryThreshold: 0.9,
          ...options.config?.healthChecks,
        },
        performance: {
          enabled: options.enablePerformanceMonitoring ?? true,
          interval: '*/30 * * * * *', // Every 30 seconds
          maxHistorySize: 1000,
          enableEventLoopMonitoring: true,
          ...options.config?.performance,
        },
      };

      // Create monitoring service
      this.monitoringService = createMonitoringService(monitoringConfig);

      // Initialize monitoring service
      await this.monitoringService.initialize();

      // Register monitoring service with TypeDI container
      Container.set('monitoring.service', this.monitoringService);

      // Add default health checks
      this.addDefaultHealthChecks();

      this.logger.info('✓ Monitoring plugin setup completed');
    } catch (error) {
      this.logger.error('Failed to setup monitoring plugin:', error);
      // Don't throw the error - let the app continue without monitoring
      this.logger.warn('Continuing without monitoring functionality');
    }
  }

  protected async onApplicationReady(app: Express): Promise<void> {
    try {
      if (this.monitoringService) {
        await this.monitoringService.setupExpress(app, {
          routePrefix: '/health'
        });
        this.logger.info('✓ Monitoring routes registered with Express app');
      }
    } catch (error) {
      this.logger.error('Failed to setup monitoring routes:', error);
    }
  }

  protected async teardown(): Promise<void> {
    try {
      this.logger.info('Tearing down monitoring plugin...');

      if (this.monitoringService) {
        await this.monitoringService.shutdown();
        this.logger.info('✓ Monitoring service shutdown completed');
      }
    } catch (error) {
      this.logger.error('Error during monitoring plugin teardown:', error);
    }
  }

  /**
   * Add default health checks for common dependencies
   */
  private addDefaultHealthChecks(): void {
    if (!this.monitoringService) return;

    // Database health check
    const databaseCheck: HealthCheckDependency = {
      type: 'database',
      name: 'postgresql',
      critical: true,
      timeout: 5000,
      testQuery: 'SELECT 1',
    };

    this.monitoringService.registerDependency('database', databaseCheck);

    // System health check
    const systemCheck: HealthCheckDependency = {
      type: 'system',
      name: 'system_resources',
      critical: false,
      timeout: 3000,
      memoryThreshold: 0.9,
      cpuThreshold: 0.9,
    };

    this.monitoringService.registerDependency('system', systemCheck);
  }

  /**
   * Get the monitoring service instance
   */
  getMonitoringService(): MonitoringService | undefined {
    return this.monitoringService;
  }

  /**
   * Register a dependency for health monitoring
   */
  registerDependency(name: string, dependency: HealthCheckDependency): void {
    if (this.monitoringService) {
      this.monitoringService.registerDependency(name, dependency);
    }
  }

  /**
   * Create a custom metric
   */
  createCustomMetric(definition: MetricDefinition): void {
    if (this.monitoringService) {
      this.monitoringService.createCustomMetric(definition);
    }
  }

  /**
   * Record a custom metric value
   */
  recordCustomMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (this.monitoringService) {
      this.monitoringService.recordCustomMetric(name, value, labels);
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    initialized: boolean;
    prometheus: boolean;
    healthChecks: boolean;
    performance: boolean;
  } | undefined {
    return this.monitoringService?.getStatus();
  }
}

