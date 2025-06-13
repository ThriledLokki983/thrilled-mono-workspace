import { Router, Request, Response, RequestHandler } from 'express';
import { Container } from 'typedi';
import { MonitoringService } from '@thrilled/monitoring';

export const createMonitoringRoutes = (): Router => {
  const router = Router();

  // Type guard to check if the service is a MonitoringService
  const isMonitoringService = (service: unknown): service is MonitoringService => {
    return service !== null &&
           typeof service === 'object' &&
           'getStatus' in service &&
           typeof (service as Record<string, unknown>).getStatus === 'function';
  };

  // Basic health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    try {
      const monitoringService = Container.get('monitoring.service') as unknown;
      let status = undefined;

      if (isMonitoringService(monitoringService)) {
        status = monitoringService.getStatus();
      }

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        monitoring: status || { initialized: false },
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Monitoring status endpoint
  router.get('/monitoring/status', ((req: Request, res: Response) => {
    try {
      const monitoringService = Container.get('monitoring.service') as unknown;

      if (!isMonitoringService(monitoringService)) {
        return res.status(503).json({
          status: 'unavailable',
          message: 'Monitoring service not initialized',
        });
      }

      const status = monitoringService.getStatus();

      res.json({
        status: 'ok',
        monitoring: status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }) as unknown as RequestHandler);

  // Simple metrics endpoint (if Prometheus is disabled)
  router.get('/metrics/simple', (req: Request, res: Response) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        environment: process.env.NODE_ENV,
        pid: process.pid,
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
};
