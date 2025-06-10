import { HealthCheckService } from '../HealthCheckService';
import {
  HealthCheckConfig,
  DatabaseHealthCheck,
  ExternalServiceHealthCheck,
  SystemHealthCheck,
  HealthCheckDependency,
} from '../../types/monitoring.types';

// Mock fetch for testing
global.fetch = jest.fn();

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;
  let config: HealthCheckConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      timeout: 5000,
      concurrency: 5,
      memoryThreshold: 0.9,
    };
    healthCheckService = new HealthCheckService(config);
    jest.clearAllMocks();
  });

  describe('registerDependency', () => {
    it('should register a dependency', () => {
      const dependency: HealthCheckDependency = {
        type: 'system',
        name: 'test-system',
        critical: true,
        timeout: 1000,
      };

      healthCheckService.registerDependency('test-system', dependency);
      
      // Verify dependency is registered by checking if it's included in health checks
      expect(healthCheckService['dependencies'].has('test-system')).toBe(true);
      expect(healthCheckService['dependencies'].get('test-system')).toEqual(dependency);
    });
  });

  describe('readinessProbe', () => {
    it('should return healthy when no critical dependencies are registered', async () => {
      const result = await healthCheckService.readinessProbe();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Service is ready');
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should return unhealthy when critical dependency fails', async () => {
      const failingDependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'failing-service',
        critical: true,
        url: 'http://localhost:9999/health',
        timeout: 1000,
      };

      (fetch as jest.Mock).mockRejectedValue(new Error('Connection failed'));
      
      healthCheckService.registerDependency('failing-service', failingDependency);
      
      const result = await healthCheckService.readinessProbe();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Service is not ready');
      expect(result.details).toHaveProperty('failing-service');
    });

    it('should return healthy when critical dependency succeeds', async () => {
      const workingDependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'working-service',
        critical: true,
        url: 'http://localhost:3000/health',
        timeout: 1000,
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
      
      healthCheckService.registerDependency('working-service', workingDependency);
      
      const result = await healthCheckService.readinessProbe();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Service is ready');
      expect(result.details).toHaveProperty('working-service');
    });
  });

  describe('livenessProbe', () => {
    it('should return healthy under normal conditions', async () => {
      // Mock normal memory usage
      const originalMemoryUsage = process.memoryUsage;
      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          rss: 50000000,
          heapTotal: 100000000,
          heapUsed: 50000000, // 50% usage - below threshold
          external: 1000000,
          arrayBuffers: 1000000,
        }),
        writable: true,
      });

      const result = await healthCheckService.livenessProbe();

      expect(result.status).toBe('healthy');
      expect(result.message).toBe('Service is alive');
      expect(result.details).toHaveProperty('memoryUsage');
      expect(result.details).toHaveProperty('uptime');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should return unhealthy when memory usage is too high', async () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      Object.defineProperty(process, 'memoryUsage', {
        value: () => ({
          rss: 100000000,
          heapTotal: 100000000,
          heapUsed: 95000000, // 95% usage
          external: 1000000,
          arrayBuffers: 1000000,
        }),
        writable: true,
      });

      // Set low memory threshold for testing
      const lowThresholdConfig = { ...config, memoryThreshold: 0.9 };
      const service = new HealthCheckService(lowThresholdConfig);
      
      const result = await service.livenessProbe();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('High memory usage detected');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('checkAllDependencies', () => {
    it('should return healthy when all dependencies are healthy', async () => {
      const dependency1: SystemHealthCheck = {
        type: 'system',
        name: 'system-check',
        critical: false,
        memoryThreshold: 0.9,
      };

      const dependency2: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'external-service',
        critical: false,
        url: 'http://localhost:3000/health',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      healthCheckService.registerDependency('system', dependency1);
      healthCheckService.registerDependency('external', dependency2);

      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('healthy');
      expect(result.details).toHaveProperty('system');
      expect(result.details).toHaveProperty('external');
    });

    it('should return degraded when non-critical dependency fails', async () => {
      const criticalDependency: SystemHealthCheck = {
        type: 'system',
        name: 'critical-system',
        critical: true,
        memoryThreshold: 0.9,
      };

      const nonCriticalDependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'non-critical-service',
        critical: false,
        url: 'http://localhost:9999/health',
      };

      (fetch as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      healthCheckService.registerDependency('critical', criticalDependency);
      healthCheckService.registerDependency('non-critical', nonCriticalDependency);

      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('degraded');
      expect(result.message).toBe('Some non-critical dependencies are unhealthy');
    });

    it('should return unhealthy when critical dependency fails', async () => {
      const criticalDependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'critical-service',
        critical: true,
        url: 'http://localhost:9999/health',
      };

      (fetch as jest.Mock).mockRejectedValue(new Error('Critical service down'));

      healthCheckService.registerDependency('critical', criticalDependency);

      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toBe('Critical dependencies are unhealthy');
    });
  });

  describe('external service checks', () => {
    it('should handle successful external service check', async () => {
      const dependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'test-service',
        critical: false,
        url: 'http://api.example.com/health',
        method: 'GET',
        expectedStatusCodes: [200, 204],
        headers: { 'Authorization': 'Bearer token' },
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      healthCheckService.registerDependency('test-service', dependency);
      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('healthy');
      expect(fetch).toHaveBeenCalledWith(
        'http://api.example.com/health',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Authorization': 'Bearer token' },
        })
      );
    });

    it('should handle failed external service check', async () => {
      const dependency: ExternalServiceHealthCheck = {
        type: 'external_service',
        name: 'failing-service',
        critical: false,
        url: 'http://api.example.com/health',
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      healthCheckService.registerDependency('failing-service', dependency);
      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('degraded');
      expect(result.details?.['failing-service']?.status).toBe('unhealthy');
    });
  });

  describe('custom checks', () => {
    it('should handle successful custom check', async () => {
      const customCheck: HealthCheckDependency = {
        type: 'custom',
        name: 'custom-check',
        critical: false,
        checkFunction: async () => ({
          status: 'healthy',
          message: 'Custom check passed',
          timestamp: Date.now(),
          responseTime: 50,
        }),
      };

      healthCheckService.registerDependency('custom', customCheck);
      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('healthy');
      expect(result.details?.['custom']?.message).toBe('Custom check passed');
    });

    it('should handle failed custom check', async () => {
      const customCheck: HealthCheckDependency = {
        type: 'custom',
        name: 'failing-custom-check',
        critical: true,
        checkFunction: async () => ({
          status: 'unhealthy',
          message: 'Custom check failed',
          timestamp: Date.now(),
          responseTime: 25,
        }),
      };

      healthCheckService.registerDependency('failing-custom', customCheck);
      const result = await healthCheckService.checkAllDependencies();

      expect(result.status).toBe('unhealthy');
      expect(result.details?.['failing-custom']?.message).toBe('Custom check failed');
    });
  });

  describe('getLastResult', () => {
    it('should return undefined for unregistered dependency', () => {
      const result = healthCheckService.getLastResult('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return last result after check', async () => {
      const dependency: SystemHealthCheck = {
        type: 'system',
        name: 'test-system',
        critical: false,
      };

      healthCheckService.registerDependency('test-system', dependency);
      await healthCheckService.checkAllDependencies();

      const lastResult = healthCheckService.getLastResult('test-system');
      expect(lastResult).toBeDefined();
      expect(lastResult?.status).toBe('healthy');
    });
  });

  describe('timeout handling', () => {
    it('should timeout long-running checks', async () => {
      const slowDependency: HealthCheckDependency = {
        type: 'custom',
        name: 'slow-check',
        critical: false,
        timeout: 100, // Very short timeout
        checkFunction: async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 200));
          return {
            status: 'healthy',
            message: 'Should not reach here',
            timestamp: Date.now(),
            responseTime: 200,
          };
        },
      };

      healthCheckService.registerDependency('slow', slowDependency);
      const result = await healthCheckService.checkAllDependencies();

      expect(result.details?.['slow']?.status).toBe('unhealthy');
      expect(result.details?.['slow']?.message).toContain('timeout');
    });
  });
});
