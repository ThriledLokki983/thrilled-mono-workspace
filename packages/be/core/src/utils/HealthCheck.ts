import { Express, Request, Response } from 'express';
import { Logger } from '../logging/Logger';
import type {
  HealthCheckOptions,
  HealthCheckResult,
  HealthCheckStatus,
} from '../types';

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
}

export class HealthCheckManager {
  private checks: Map<string, HealthCheck> = new Map();
  private logger: Logger;
  private config: Required<HealthCheckOptions>;

  constructor(config: HealthCheckOptions = {}, logger?: Logger) {
    this.config = {
      enabled: true,
      endpoint: '/health',
      timeout: 5000,
      checks: {},
      interval: 0,
      ...config,
    };
    this.logger = logger || Logger.create({ level: 'info' });
  }

  /**
   * Register a health check
   */
  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.logger.debug(`Health check registered: ${check.name}`);
  }

  /**
   * Remove a health check
   */
  unregister(name: string): void {
    if (this.checks.delete(name)) {
      this.logger.debug(`Health check unregistered: ${name}`);
    }
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthCheckStatus> {
    const results: Record<string, HealthCheckResult> = {};
    let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

    const checkPromises = Array.from(this.checks.entries()).map(
      async ([name, check]) => {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Health check timeout')),
              this.config.timeout
            )
          );

          const result = await Promise.race([check.check(), timeoutPromise]);
          results[name] = result;

          if (result.status === 'unhealthy') {
            overallStatus = 'unhealthy';
          }
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            message: (error as Error).message,
          };
          overallStatus = 'unhealthy';
        }
      }
    );

    await Promise.all(checkPromises);

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Setup health check endpoint
   */
  setupEndpoint(app: Express): void {
    if (!this.config.enabled) {
      this.logger.debug('Health check endpoint disabled');
      return;
    }

    app.get(this.config.endpoint, async (req: Request, res: Response) => {
      try {
        const healthResult = await this.runChecks();
        const statusCode = healthResult.status === 'healthy' ? 200 : 503;

        this.logger.debug('Health check requested', {
          status: healthResult.status,
          checkCount: Object.keys(healthResult.checks).length,
        });

        res.status(statusCode).json({
          success: healthResult.status === 'healthy',
          ...healthResult,
        });
      } catch (error) {
        this.logger.error(error as Error, {
          context: 'HealthCheckManager.endpoint',
        });
        res.status(500).json({
          success: false,
          status: 'unhealthy',
          error: 'Health check failed',
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.logger.info(
      `Health check endpoint available at ${this.config.endpoint}`
    );
  }
}
