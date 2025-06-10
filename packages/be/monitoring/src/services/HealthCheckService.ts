import {
  HealthCheckResult,
  HealthStatus,
  DatabaseHealthCheck,
  ExternalServiceHealthCheck,
  SystemHealthCheck,
  HealthCheckConfig,
  HealthCheckDependency,
} from '../types/monitoring.types.js';
import async from 'async';

export class HealthCheckService {
  private config: HealthCheckConfig;
  private dependencies: Map<string, HealthCheckDependency> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();

  constructor(config: HealthCheckConfig) {
    this.config = config;
  }

  /**
   * Register a dependency for health monitoring
   */
  registerDependency(name: string, dependency: HealthCheckDependency): void {
    this.dependencies.set(name, dependency);
  }

  /**
   * Perform readiness probe check
   * Checks if the service is ready to serve requests
   */
  async readinessProbe(): Promise<HealthCheckResult> {
    const startTime = process.hrtime.bigint();
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = 'healthy';

    try {
      // Check critical dependencies required for readiness
      const readinessDependencies = Array.from(this.dependencies.entries())
        .filter(([, dep]) => dep.critical);

      for (const [name, dependency] of readinessDependencies) {
        try {
          const result = await this.performCheck(dependency);
          checks[name] = result;

          if (result.status !== 'healthy') {
            overallStatus = 'unhealthy';
          }
        } catch (error) {
          checks[name] = {
            status: 'unhealthy' as HealthStatus,
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
            responseTime: 0,
          };
          overallStatus = 'unhealthy';
        }
      }

      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000); // Convert nanoseconds to milliseconds, minimum 1ms

      return {
        status: overallStatus,
        message: overallStatus === 'healthy' ? 'Service is ready' : 'Service is not ready',
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
        details: checks,
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000); // Convert nanoseconds to milliseconds, minimum 1ms

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Readiness check failed',
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
        details: checks,
      };
    }
  }

  /**
   * Perform liveness probe check
   * Checks if the service is alive and functioning
   */
  async livenessProbe(): Promise<HealthCheckResult> {
    const startTime = process.hrtime.bigint();
    
    try {
      // Basic liveness checks - memory, event loop, etc.
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Check if memory usage is within acceptable limits
      const memoryThreshold = this.config.memoryThreshold || 0.9; // 90% threshold
      const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (memoryUsageRatio > memoryThreshold) {
        const endTime = process.hrtime.bigint();
        const responseTime = Math.max(1, Number(endTime - startTime) / 1000000);

        return {
          status: 'unhealthy',
          message: 'High memory usage detected',
          timestamp: Date.now(),
          responseTime: Math.round(responseTime),
          details: {
            memoryUsage: memoryUsage,
            memoryUsageRatio: memoryUsageRatio,
            uptime: uptime,
          },
        };
      }

      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000);

      return {
        status: 'healthy',
        message: 'Service is alive',
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
        details: {
          memoryUsage: memoryUsage,
          memoryUsageRatio: memoryUsageRatio,
          uptime: uptime,
        },
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000);

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Liveness check failed',
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
      };
    }
  }

  /**
   * Check all dependencies health
   */
  async checkAllDependencies(): Promise<HealthCheckResult> {
    const startTime = process.hrtime.bigint();
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: HealthStatus = 'healthy';

    try {
      // Use async.mapLimit to control concurrency
      const dependencyArray = Array.from(this.dependencies.entries());
      
      const results = await async.mapLimit(
        dependencyArray,
        this.config.concurrency || 5,
        async ([name, dependency]: [string, HealthCheckDependency]): Promise<[string, HealthCheckResult]> => {
          try {
            const result = await this.performCheck(dependency);
            this.lastResults.set(name, result);
            return [name, result];
          } catch (error) {
            const errorResult: HealthCheckResult = {
              status: 'unhealthy' as HealthStatus,
              message: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now(),
              responseTime: 0,
            };
            this.lastResults.set(name, errorResult);
            return [name, errorResult];
          }
        }
      );

      for (const [name, result] of results) {
        checks[name] = result;
        if (result.status !== 'healthy') {
          if (this.dependencies.get(name)?.critical) {
            overallStatus = 'unhealthy';
          } else if (overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        }
      }

      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000);

      return {
        status: overallStatus,
        message: this.getOverallMessage(overallStatus),
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
        details: checks,
      };
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const responseTime = Math.max(1, Number(endTime - startTime) / 1000000);

      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Dependency check failed',
        timestamp: Date.now(),
        responseTime: Math.round(responseTime),
        details: checks,
      };
    }
  }

  /**
   * Perform individual health check based on type
   */
  private async performCheck(dependency: HealthCheckDependency): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeout = dependency.timeout || this.config.timeout || 5000;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Health check timeout after ${timeout}ms`));
      }, timeout);

      const executeCheck = async () => {
        try {
          let result: HealthCheckResult;

          switch (dependency.type) {
            case 'database':
              result = await this.checkDatabase(dependency as DatabaseHealthCheck);
              break;
            case 'external_service':
              result = await this.checkExternalService(dependency as ExternalServiceHealthCheck);
              break;
            case 'system':
              result = await this.checkSystem(dependency as SystemHealthCheck);
              break;
            case 'custom':
              if (dependency.checkFunction) {
                result = await dependency.checkFunction();
              } else {
                throw new Error('Custom check function not provided');
              }
              break;
            default:
              throw new Error(`Unknown dependency type: ${(dependency as HealthCheckDependency).type}`);
          }

          result.responseTime = Date.now() - startTime;
          clearTimeout(timer);
          resolve(result);
        } catch (error) {
          clearTimeout(timer);
          reject(error);
        }
      };

      executeCheck();
    });
  }

  /**
   * Check database health
   */
  private async checkDatabase(check: DatabaseHealthCheck): Promise<HealthCheckResult> {
    try {
      if (check.pool) {
        // Check connection pool status
        const totalConnections = check.pool.totalCount || 0;
        const idleConnections = check.pool.idleCount || 0;
        const activeConnections = totalConnections - idleConnections;

        // Execute a simple query to verify connectivity
        if (check.testQuery && check.connection) {
          await check.connection.query(check.testQuery);
        }

        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          timestamp: Date.now(),
          responseTime: 0, // Will be set by caller
          details: {
            totalConnections,
            idleConnections,
            activeConnections,
          },
        };
      } else if (check.connection) {
        // Simple connection check
        if (check.testQuery) {
          await check.connection.query(check.testQuery);
        }

        return {
          status: 'healthy',
          message: 'Database connection is healthy',
          timestamp: Date.now(),
          responseTime: 0,
        };
      } else {
        throw new Error('No database connection or pool provided');
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        timestamp: Date.now(),
        responseTime: 0,
      };
    }
  }

  /**
   * Check external service health
   */
  private async checkExternalService(check: ExternalServiceHealthCheck): Promise<HealthCheckResult> {
    try {
      const response = await fetch(check.url, {
        method: check.method || 'GET',
        headers: check.headers,
        signal: AbortSignal.timeout(check.timeout || 5000),
      });

      const isHealthy = check.expectedStatusCodes
        ? check.expectedStatusCodes.includes(response.status)
        : response.ok;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy
          ? `External service ${check.name} is responding`
          : `External service ${check.name} returned status ${response.status}`,
        timestamp: Date.now(),
        responseTime: 0,
        details: {
          status: response.status,
          statusText: response.statusText,
          url: check.url,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'External service check failed',
        timestamp: Date.now(),
        responseTime: 0,
      };
    }
  }

  /**
   * Check system health
   */
  private async checkSystem(check: SystemHealthCheck): Promise<HealthCheckResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const loadAverage = process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0];

      let status: HealthStatus = 'healthy';
      const issues: string[] = [];

      // Check memory usage
      if (check.memoryThreshold) {
        const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
        if (memoryUsageRatio > check.memoryThreshold) {
          status = 'unhealthy';
          issues.push(`High memory usage: ${(memoryUsageRatio * 100).toFixed(2)}%`);
        }
      }

      // Check CPU load (if available)
      if (check.cpuThreshold && process.platform !== 'win32') {
        const cpuLoad = loadAverage[0]; // 1-minute load average
        if (cpuLoad > check.cpuThreshold) {
          status = status === 'healthy' ? 'degraded' : 'unhealthy';
          issues.push(`High CPU load: ${cpuLoad.toFixed(2)}`);
        }
      }

      return {
        status,
        message: status === 'healthy' ? 'System is healthy' : `System issues: ${issues.join(', ')}`,
        timestamp: Date.now(),
        responseTime: 0,
        details: {
          memoryUsage,
          uptime,
          loadAverage,
          issues,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'System check failed',
        timestamp: Date.now(),
        responseTime: 0,
      };
    }
  }

  /**
   * Get last check result for a dependency
   */
  getLastResult(dependencyName: string): HealthCheckResult | undefined {
    return this.lastResults.get(dependencyName);
  }

  /**
   * Get all last results
   */
  getAllLastResults(): Map<string, HealthCheckResult> {
    return new Map(this.lastResults);
  }

  /**
   * Get overall message based on status
   */
  private getOverallMessage(status: HealthStatus): string {
    switch (status) {
      case 'healthy':
        return 'All dependencies are healthy';
      case 'degraded':
        return 'Some non-critical dependencies are unhealthy';
      case 'unhealthy':
        return 'Critical dependencies are unhealthy';
      default:
        return 'Unknown health status';
    }
  }
}
