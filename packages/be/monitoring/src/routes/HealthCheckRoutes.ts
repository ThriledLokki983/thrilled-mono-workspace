import { Request, Response } from 'express';
import { HealthCheckService } from '../services/HealthCheckService.js';
import { PerformanceMonitoringService } from '../services/PerformanceMonitoringService.js';
import { PrometheusService } from '../services/PrometheusService.js';

export class HealthCheckRoutes {
  constructor(
    private healthCheckService: HealthCheckService,
    private performanceService?: PerformanceMonitoringService,
    private prometheusService?: PrometheusService
  ) {}

  /**
   * Readiness probe endpoint
   * GET /health/readiness
   */
  readiness = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.healthCheckService.readinessProbe();
      
      // Record metrics if Prometheus service is available
      if (this.prometheusService) {
        this.prometheusService.recordMetric('health_check_duration', result.responseTime, {
          type: 'readiness',
          status: result.status,
        });
      }

      const statusCode = result.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        timestamp: result.timestamp,
        responseTime: result.responseTime,
        checks: result.details,
      });
    } catch (error) {
      console.error('Readiness probe error:', error);
      res.status(503).json({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Readiness probe failed',
        timestamp: Date.now(),
      });
    }
  };

  /**
   * Liveness probe endpoint
   * GET /health/liveness
   */
  liveness = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.healthCheckService.livenessProbe();
      
      // Record metrics if Prometheus service is available
      if (this.prometheusService) {
        this.prometheusService.recordMetric('health_check_duration', result.responseTime, {
          type: 'liveness',
          status: result.status,
        });
      }

      const statusCode = result.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        timestamp: result.timestamp,
        responseTime: result.responseTime,
        details: result.details,
      });
    } catch (error) {
      console.error('Liveness probe error:', error);
      res.status(503).json({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Liveness probe failed',
        timestamp: Date.now(),
      });
    }
  };

  /**
   * Dependencies health check endpoint
   * GET /health/dependencies
   */
  dependencies = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.healthCheckService.checkAllDependencies();
      
      // Record metrics if Prometheus service is available
      if (this.prometheusService) {
        this.prometheusService.recordMetric('health_check_duration', result.responseTime, {
          type: 'dependencies',
          status: result.status,
        });
      }

      let statusCode: number;
      switch (result.status) {
        case 'healthy':
          statusCode = 200;
          break;
        case 'degraded':
          statusCode = 200; // Still serving requests but with warnings
          break;
        case 'unhealthy':
          statusCode = 503;
          break;
        default:
          statusCode = 503;
      }

      res.status(statusCode).json({
        status: result.status,
        message: result.message,
        timestamp: result.timestamp,
        responseTime: result.responseTime,
        dependencies: result.details,
      });
    } catch (error) {
      console.error('Dependencies health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Dependencies check failed',
        timestamp: Date.now(),
      });
    }
  };

  /**
   * Combined health check endpoint
   * GET /health
   */
  health = async (req: Request, res: Response): Promise<void> => {
    try {
      const [readinessResult, livenessResult, dependenciesResult] = await Promise.all([
        this.healthCheckService.readinessProbe(),
        this.healthCheckService.livenessProbe(),
        this.healthCheckService.checkAllDependencies(),
      ]);

      // Determine overall status
      let overallStatus = 'healthy';
      if (
        readinessResult.status === 'unhealthy' ||
        livenessResult.status === 'unhealthy' ||
        dependenciesResult.status === 'unhealthy'
      ) {
        overallStatus = 'unhealthy';
      } else if (dependenciesResult.status === 'degraded') {
        overallStatus = 'degraded';
      }

      // Get performance metrics if available
      let performanceMetrics;
      if (this.performanceService) {
        performanceMetrics = this.performanceService.getCurrentMetrics();
      }

      const responseTime = Math.max(
        readinessResult.responseTime,
        livenessResult.responseTime,
        dependenciesResult.responseTime
      );

      // Record metrics if Prometheus service is available
      if (this.prometheusService) {
        this.prometheusService.recordMetric('health_check_duration', responseTime, {
          type: 'combined',
          status: overallStatus,
        });
      }

      const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
      
      res.status(statusCode).json({
        status: overallStatus,
        message: `Overall health: ${overallStatus}`,
        timestamp: Date.now(),
        responseTime,
        checks: {
          readiness: readinessResult,
          liveness: livenessResult,
          dependencies: dependenciesResult,
        },
        performance: performanceMetrics,
        uptime: process.uptime(),
        version: process.env.npm_package_version || 'unknown',
      });
    } catch (error) {
      console.error('Combined health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: Date.now(),
      });
    }
  };

  /**
   * Performance metrics endpoint
   * GET /health/metrics/performance
   */
  performanceMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.performanceService) {
        res.status(404).json({
          status: 'error',
          message: 'Performance monitoring not enabled',
        });
        return;
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const aggregated = req.query.aggregated === 'true';

      if (aggregated) {
        const period = req.query.period ? parseInt(req.query.period as string) : 5;
        const metrics = this.performanceService.getAggregatedMetrics(period);
        res.json({
          status: 'success',
          data: metrics,
          period: `${period} minutes`,
        });
      } else {
        const metrics = limit 
          ? this.performanceService.getMetricsHistory(limit)
          : this.performanceService.getCurrentMetrics();
        
        res.json({
          status: 'success',
          data: metrics,
        });
      }
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get performance metrics',
      });
    }
  };

  /**
   * Prometheus metrics endpoint
   * GET /health/metrics/prometheus
   */
  prometheusMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.prometheusService) {
        res.status(404).json({
          status: 'error',
          message: 'Prometheus monitoring not enabled',
        });
        return;
      }

      const metrics = await this.prometheusService.getMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metrics);
    } catch (error) {
      console.error('Prometheus metrics error:', error);
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to get Prometheus metrics',
      });
    }
  };
}

/**
 * Factory function to create health check routes
 */
export function createHealthCheckRoutes(
  healthCheckService: HealthCheckService,
  performanceService?: PerformanceMonitoringService,
  prometheusService?: PrometheusService
): HealthCheckRoutes {
  return new HealthCheckRoutes(healthCheckService, performanceService, prometheusService);
}
