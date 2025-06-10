import { MonitoringService, createMonitoringService, defaultMonitoringConfig } from '../MonitoringService';
import { MonitoringConfig } from '../../types/monitoring.types';
import { Express } from 'express';

// Mock the services
jest.mock('../PrometheusService');
jest.mock('../HealthCheckService');
jest.mock('../PerformanceMonitoringService');

import { PrometheusService } from '../PrometheusService';
import { HealthCheckService } from '../HealthCheckService';
import { PerformanceMonitoringService } from '../PerformanceMonitoringService';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;
  let config: MonitoringConfig;
  let mockApp: Partial<Express>;

  beforeEach(() => {
    config = {
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
        interval: '*/30 * * * * *',
        maxHistorySize: 1000,
        enableEventLoopMonitoring: true,
      },
      alerting: {
        enabled: false,
        rules: [],
      },
    };

    mockApp = {
      use: jest.fn(),
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock implementations
    (PrometheusService as jest.Mock).mockImplementation(() => ({
      getExpressMiddleware: jest.fn().mockReturnValue(jest.fn()),
      createMetric: jest.fn(),
      recordMetric: jest.fn(),
    }));

    (HealthCheckService as jest.Mock).mockImplementation(() => ({
      registerDependency: jest.fn(),
    }));

    (PerformanceMonitoringService as jest.Mock).mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
    }));

    monitoringService = new MonitoringService(config);
  });

  afterEach(async () => {
    // Ensure proper cleanup to prevent worker process hanging
    if (monitoringService && monitoringService.isReady()) {
      await monitoringService.shutdown();
    }
  });

  describe('constructor', () => {
    it('should create monitoring service with config', () => {
      expect(monitoringService).toBeDefined();
      expect(monitoringService.getConfig()).toEqual(config);
    });
  });

  describe('initialize', () => {
    it('should initialize all enabled services', async () => {
      await monitoringService.initialize();

      expect(PrometheusService).toHaveBeenCalledWith(config.metrics);
      expect(HealthCheckService).toHaveBeenCalledWith(config.healthChecks);
      expect(PerformanceMonitoringService).toHaveBeenCalledWith(config.performance);
      expect(monitoringService.isReady()).toBe(true);
    });

    it('should not initialize disabled services', async () => {
      const configWithDisabledServices = {
        ...config,
        metrics: { ...config.metrics!, enabled: false },
        healthChecks: { ...config.healthChecks!, enabled: false },
        performance: { ...config.performance!, enabled: false },
      };

      const service = new MonitoringService(configWithDisabledServices);
      await service.initialize();

      expect(service.getPrometheusService()).toBeUndefined();
      expect(service.getHealthCheckService()).toBeUndefined();
      expect(service.getPerformanceService()).toBeUndefined();
    });

    it('should not initialize twice', async () => {
      await monitoringService.initialize();
      await monitoringService.initialize(); // Second call

      expect(PrometheusService).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization errors', async () => {
      // Mock PrometheusService constructor to throw an error
      (PrometheusService as jest.Mock).mockImplementation(() => {
        throw new Error('Init failed');
      });

      await expect(monitoringService.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('shutdown', () => {
    it('should shutdown all services', async () => {
      await monitoringService.initialize();
      
      const mockPerformanceService = monitoringService.getPerformanceService();
      
      await monitoringService.shutdown();

      expect(mockPerformanceService?.stop).toHaveBeenCalled();
      expect(monitoringService.isReady()).toBe(false);
    });

    it('should not error when shutting down uninitialized service', async () => {
      await expect(monitoringService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('setupExpress', () => {
    beforeEach(async () => {
      await monitoringService.initialize();
    });

    it('should setup Express with middleware and routes', () => {
      monitoringService.setupExpress(mockApp as Express);

      expect(mockApp.use).toHaveBeenCalled();
    });

    it('should use custom route prefix', () => {
      monitoringService.setupExpress(mockApp as Express, { routePrefix: '/monitoring' });

      // Should be called twice: once for middleware, once for routes with prefix
      expect(mockApp.use).toHaveBeenCalledTimes(2);
      expect(mockApp.use).toHaveBeenNthCalledWith(1, expect.any(Function)); // Prometheus middleware
      expect(mockApp.use).toHaveBeenNthCalledWith(2, '/monitoring', expect.any(Function)); // Routes with prefix (router is a function)
    });

    it('should throw error if not initialized', () => {
      const uninitializedService = new MonitoringService(config);
      
      expect(() => {
        uninitializedService.setupExpress(mockApp as Express);
      }).toThrow('Monitoring service must be initialized');
    });
  });

  describe('registerDependency', () => {
    it('should register dependency with health check service', async () => {
      await monitoringService.initialize();
      
      const dependency = {
        type: 'system' as const,
        name: 'test-system',
        critical: true,
      };

      monitoringService.registerDependency('test-dep', dependency);

      const healthCheckService = monitoringService.getHealthCheckService();
      expect(healthCheckService?.registerDependency).toHaveBeenCalledWith('test-dep', dependency);
    });

    it('should throw error if health check service not initialized', () => {
      const dependency = {
        type: 'system' as const,
        name: 'test-system',
        critical: true,
      };

      expect(() => {
        monitoringService.registerDependency('test-dep', dependency);
      }).toThrow('Health check service is not initialized');
    });
  });

  describe('createCustomMetric', () => {
    it('should create custom metric with Prometheus service', async () => {
      await monitoringService.initialize();
      
      const metricDefinition = {
        name: 'test_metric',
        help: 'Test metric',
        type: 'counter' as const,
        labelNames: ['label1'],
      };

      monitoringService.createCustomMetric(metricDefinition);

      const prometheusService = monitoringService.getPrometheusService();
      expect(prometheusService?.createMetric).toHaveBeenCalledWith(metricDefinition);
    });

    it('should throw error if Prometheus service not initialized', () => {
      const metricDefinition = {
        name: 'test_metric',
        help: 'Test metric',
        type: 'counter' as const,
      };

      expect(() => {
        monitoringService.createCustomMetric(metricDefinition);
      }).toThrow('Prometheus service is not initialized');
    });
  });

  describe('recordCustomMetric', () => {
    it('should record custom metric value', async () => {
      await monitoringService.initialize();
      
      monitoringService.recordCustomMetric('test_metric', 42, { label1: 'value1' });

      const prometheusService = monitoringService.getPrometheusService();
      expect(prometheusService?.recordMetric).toHaveBeenCalledWith(
        'test_metric',
        42,
        { label1: 'value1' }
      );
    });

    it('should throw error if Prometheus service not initialized', () => {
      expect(() => {
        monitoringService.recordCustomMetric('test_metric', 42);
      }).toThrow('Prometheus service is not initialized');
    });
  });

  describe('getStatus', () => {
    it('should return status of all services', async () => {
      await monitoringService.initialize();
      
      const status = monitoringService.getStatus();

      expect(status).toEqual({
        initialized: true,
        prometheus: true,
        healthChecks: true,
        performance: true,
      });
    });

    it('should return correct status for uninitialized service', () => {
      const status = monitoringService.getStatus();

      expect(status).toEqual({
        initialized: false,
        prometheus: false,
        healthChecks: false,
        performance: false,
      });
    });
  });

  describe('service getters', () => {
    it('should return service instances after initialization', async () => {
      await monitoringService.initialize();

      expect(monitoringService.getPrometheusService()).toBeDefined();
      expect(monitoringService.getHealthCheckService()).toBeDefined();
      expect(monitoringService.getPerformanceService()).toBeDefined();
    });

    it('should return undefined for uninitialized services', () => {
      expect(monitoringService.getPrometheusService()).toBeUndefined();
      expect(monitoringService.getHealthCheckService()).toBeUndefined();
      expect(monitoringService.getPerformanceService()).toBeUndefined();
    });
  });
});

describe('createMonitoringService', () => {
  it('should create monitoring service instance', () => {
    const config: MonitoringConfig = defaultMonitoringConfig;
    const service = createMonitoringService(config);
    
    expect(service).toBeInstanceOf(MonitoringService);
    expect(service.getConfig()).toEqual(config);
  });
});

describe('defaultMonitoringConfig', () => {
  it('should have expected default values', () => {
    expect(defaultMonitoringConfig).toEqual({
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
        interval: '*/30 * * * * *',
        maxHistorySize: 1000,
        enableEventLoopMonitoring: true,
      },
      alerting: {
        enabled: false,
        rules: [],
      },
    });
  });
});
