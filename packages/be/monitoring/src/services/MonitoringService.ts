import { Express, Router } from 'express';
import { PrometheusService } from './PrometheusService.js';
import { HealthCheckService } from './HealthCheckService.js';
import { PerformanceMonitoringService } from './PerformanceMonitoringService.js';
import { HealthCheckRoutes, createHealthCheckRoutes } from '../routes/HealthCheckRoutes.js';
import {
  MonitoringConfig,
  HealthCheckDependency,
  MetricDefinition,
} from '../types/monitoring.types.js';

export class MonitoringService {
  private prometheusService?: PrometheusService;
  private healthCheckService?: HealthCheckService;
  private performanceService?: PerformanceMonitoringService;
  private healthCheckRoutes?: HealthCheckRoutes;
  private isInitialized = false;

  constructor(private config: MonitoringConfig) {}

  /**
   * Initialize all monitoring services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing monitoring services...');

      // Initialize Prometheus service if metrics are enabled
      if (this.config.metrics?.enabled) {
        this.prometheusService = new PrometheusService(this.config.metrics);
        console.log('✓ Prometheus service initialized');
      }

      // Initialize health check service if health checks are enabled
      if (this.config.healthChecks?.enabled) {
        this.healthCheckService = new HealthCheckService(this.config.healthChecks);
        console.log('✓ Health check service initialized');
      }

      // Initialize performance monitoring service if enabled
      if (this.config.performance?.enabled) {
        this.performanceService = new PerformanceMonitoringService(this.config.performance);
        this.performanceService.start();
        console.log('✓ Performance monitoring service initialized');
      }

      // Create health check routes if health checks are enabled
      if (this.healthCheckService) {
        this.healthCheckRoutes = createHealthCheckRoutes(
          this.healthCheckService,
          this.performanceService,
          this.prometheusService
        );
        console.log('✓ Health check routes created');
      }

      this.isInitialized = true;
      console.log('✓ All monitoring services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize monitoring services:', error);
      throw error;
    }
  }

  /**
   * Shutdown all monitoring services
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('Shutting down monitoring services...');

      // Stop performance monitoring
      if (this.performanceService) {
        this.performanceService.stop();
        console.log('✓ Performance monitoring stopped');
      }

      // Prometheus service doesn't need explicit shutdown
      
      this.isInitialized = false;
      console.log('✓ All monitoring services shut down successfully');
    } catch (error) {
      console.error('Error during monitoring services shutdown:', error);
      throw error;
    }
  }

  /**
   * Setup Express app with monitoring middleware and routes
   */
  setupExpress(app: Express, options: { routePrefix?: string } = {}): void {
    if (!this.isInitialized) {
      throw new Error('Monitoring service must be initialized before setting up Express');
    }

    const routePrefix = options.routePrefix || '/health';

    // Add Prometheus middleware if available
    if (this.prometheusService) {
      app.use(this.prometheusService.getExpressMiddleware());
      console.log('✓ Prometheus middleware added to Express app');
    }

    // Add health check routes if available
    if (this.healthCheckRoutes) {
      const router = Router();
      
      // Health check endpoints
      router.get('/', this.healthCheckRoutes.health);
      router.get('/readiness', this.healthCheckRoutes.readiness);
      router.get('/liveness', this.healthCheckRoutes.liveness);
      router.get('/dependencies', this.healthCheckRoutes.dependencies);
      
      // Metrics endpoints
      router.get('/metrics/performance', this.healthCheckRoutes.performanceMetrics);
      router.get('/metrics/prometheus', this.healthCheckRoutes.prometheusMetrics);
      
      app.use(routePrefix, router);
      console.log(`✓ Health check routes added at ${routePrefix}`);
    }
  }

  /**
   * Register a dependency for health monitoring
   */
  registerDependency(name: string, dependency: HealthCheckDependency): void {
    if (!this.healthCheckService) {
      throw new Error('Health check service is not initialized');
    }
    
    this.healthCheckService.registerDependency(name, dependency);
    console.log(`✓ Dependency '${name}' registered for health monitoring`);
  }

  /**
   * Create a custom metric
   */
  createCustomMetric(definition: MetricDefinition): void {
    if (!this.prometheusService) {
      throw new Error('Prometheus service is not initialized');
    }
    
    this.prometheusService.createMetric(definition);
    console.log(`✓ Custom metric '${definition.name}' created`);
  }

  /**
   * Record a custom metric value
   */
  recordCustomMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.prometheusService) {
      throw new Error('Prometheus service is not initialized');
    }
    
    this.prometheusService.recordMetric(name, value, labels);
  }

  /**
   * Get Prometheus service instance
   */
  getPrometheusService(): PrometheusService | undefined {
    return this.prometheusService;
  }

  /**
   * Get health check service instance
   */
  getHealthCheckService(): HealthCheckService | undefined {
    return this.healthCheckService;
  }

  /**
   * Get performance monitoring service instance
   */
  getPerformanceService(): PerformanceMonitoringService | undefined {
    return this.performanceService;
  }

  /**
   * Get monitoring configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  /**
   * Check if monitoring is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    initialized: boolean;
    prometheus: boolean;
    healthChecks: boolean;
    performance: boolean;
  } {
    return {
      initialized: this.isInitialized,
      prometheus: !!this.prometheusService,
      healthChecks: !!this.healthCheckService,
      performance: !!this.performanceService && this.performanceService.isRunning(),
    };
  }
}

/**
 * Factory function to create monitoring service
 */
export function createMonitoringService(config: MonitoringConfig): MonitoringService {
  return new MonitoringService(config);
}

/**
 * Default monitoring configuration
 */
export const defaultMonitoringConfig: MonitoringConfig = {
  metrics: {
    enabled: true,
    port: 9090,
    endpoint: '/metrics',
    collectDefaultMetrics: true,
    customMetrics: [],
  },
  healthChecks: {
    enabled: true,
    timeout: 5000,
    concurrency: 5,
    memoryThreshold: 0.9,
  },
  performance: {
    enabled: true,
    interval: '*/30 * * * * *', // Every 30 seconds
    maxHistorySize: 1000,
    enableEventLoopMonitoring: true,
  },
  alerting: {
    enabled: false,
    rules: [],
  },
};
