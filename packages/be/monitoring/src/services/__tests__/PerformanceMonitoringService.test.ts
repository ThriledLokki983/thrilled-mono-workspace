import { PerformanceMonitoringService } from '../PerformanceMonitoringService';
import { PerformanceConfig } from '../../types/monitoring.types';

// Mock pidusage
jest.mock('pidusage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

import * as pidusage from 'pidusage';
import * as cron from 'node-cron';

describe('PerformanceMonitoringService', () => {
  let performanceService: PerformanceMonitoringService;
  let config: PerformanceConfig;
  let mockScheduledTask: any;

  beforeEach(() => {
    config = {
      enabled: true,
      interval: '*/30 * * * * *',
      maxHistorySize: 100,
      enableEventLoopMonitoring: true,
    };

    mockScheduledTask = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    (cron.schedule as jest.Mock).mockReturnValue(mockScheduledTask);
    (pidusage.default as jest.Mock).mockResolvedValue({
      cpu: 25.5,
      memory: 104857600, // 100MB
    });

    performanceService = new PerformanceMonitoringService(config);
    jest.clearAllMocks();
  });

  afterEach(() => {
    performanceService.stop();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      expect(performanceService).toBeDefined();
      expect(performanceService.getConfig()).toEqual(config);
    });

    it('should use default maxHistorySize if not provided', () => {
      const configWithoutHistory = { ...config };
      delete configWithoutHistory.maxHistorySize;
      
      const service = new PerformanceMonitoringService(configWithoutHistory);
      expect(service['maxMetricsHistory']).toBe(1000);
    });
  });

  describe('start', () => {
    it('should start monitoring and schedule cron job', () => {
      performanceService.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        config.interval,
        expect.any(Function)
      );
      expect(performanceService.isRunning()).toBe(true);
    });

    it('should not start if already monitoring', () => {
      performanceService.start();
      performanceService.start(); // Second call

      expect(cron.schedule).toHaveBeenCalledTimes(1);
    });

    it('should use default interval if not provided', () => {
      const configWithoutInterval = { ...config };
      delete configWithoutInterval.interval;
      
      const service = new PerformanceMonitoringService(configWithoutInterval);
      service.start();

      expect(cron.schedule).toHaveBeenCalledWith(
        '*/30 * * * * *',
        expect.any(Function)
      );
    });
  });

  describe('stop', () => {
    it('should stop monitoring and cancel cron job', () => {
      performanceService.start();
      performanceService.stop();

      expect(mockScheduledTask.stop).toHaveBeenCalled();
      expect(performanceService.isRunning()).toBe(false);
    });

    it('should not error if stopping when not started', () => {
      expect(() => performanceService.stop()).not.toThrow();
    });
  });

  describe('collectMetrics', () => {
    beforeEach(() => {
      // Mock process methods
      Object.defineProperty(process, 'memoryUsage', {
        value: jest.fn().mockReturnValue({
          rss: 50000000,
          heapTotal: 25000000,
          heapUsed: 20000000,
          external: 2000000,
          arrayBuffers: 1000000,
        }),
        writable: true,
      });

      Object.defineProperty(process, 'cpuUsage', {
        value: jest.fn().mockReturnValue({
          user: 1000000,
          system: 500000,
        }),
        writable: true,
      });

      Object.defineProperty(process, 'uptime', {
        value: jest.fn().mockReturnValue(3600),
        writable: true,
      });
    });

    it('should collect performance metrics successfully', async () => {
      const metrics = await performanceService.collectMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeGreaterThan(0);
      expect(metrics.system).toBeDefined();
      expect(metrics.process).toBeDefined();
      expect(metrics.eventLoop).toBeDefined();
    });

    it('should collect system metrics using pidusage', async () => {
      const metrics = await performanceService.collectMetrics();

      expect(pidusage.default).toHaveBeenCalledWith(process.pid);
      expect(metrics.system.cpu.usage).toBe(25.5);
      expect(metrics.system.memory.total).toBe(104857600);
    });

    it('should collect process metrics', async () => {
      const metrics = await performanceService.collectMetrics();

      expect(metrics.process.pid).toBe(process.pid);
      expect(metrics.process.uptime).toBe(3600);
      expect(metrics.process.memoryUsage.rss).toBe(50000000);
      expect(metrics.process.memoryUsage.heapUsed).toBe(20000000);
    });

    it('should handle errors gracefully', async () => {
      (pidusage.default as jest.Mock).mockRejectedValue(new Error('pidusage failed'));

      await expect(performanceService.collectMetrics()).rejects.toThrow('pidusage failed');
    });

    it('should add metrics to history', async () => {
      await performanceService.collectMetrics();
      
      const history = performanceService.getMetricsHistory();
      expect(history).toHaveLength(1);
    });

    it('should maintain maximum history size', async () => {
      const smallConfig = { ...config, maxHistorySize: 2 };
      const service = new PerformanceMonitoringService(smallConfig);

      // Collect more metrics than max history size
      await service.collectMetrics();
      await service.collectMetrics();
      await service.collectMetrics();

      const history = service.getMetricsHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('getCurrentMetrics', () => {
    it('should return undefined when no metrics collected', () => {
      const current = performanceService.getCurrentMetrics();
      expect(current).toBeUndefined();
    });

    it('should return latest metrics after collection', async () => {
      await performanceService.collectMetrics();
      
      const current = performanceService.getCurrentMetrics();
      expect(current).toBeDefined();
      expect(current?.timestamp).toBeGreaterThan(0);
    });
  });

  describe('getMetricsHistory', () => {
    beforeEach(async () => {
      // Collect some test metrics
      await performanceService.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await performanceService.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await performanceService.collectMetrics();
    });

    it('should return all metrics when no limit specified', () => {
      const history = performanceService.getMetricsHistory();
      expect(history).toHaveLength(3);
    });

    it('should return limited metrics when limit specified', () => {
      const history = performanceService.getMetricsHistory(2);
      expect(history).toHaveLength(2);
      
      // Should return the most recent metrics
      const allHistory = performanceService.getMetricsHistory();
      expect(history[0]).toEqual(allHistory[1]);
      expect(history[1]).toEqual(allHistory[2]);
    });
  });

  describe('getMetricsByTimeRange', () => {
    it('should return metrics within specified time range', async () => {
      const startTime = Date.now();
      
      await performanceService.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const midTime = Date.now();
      
      await performanceService.collectMetrics();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const endTime = Date.now();
      
      const metricsInRange = performanceService.getMetricsByTimeRange(midTime - 10, endTime + 10);
      expect(metricsInRange).toHaveLength(1);
      expect(metricsInRange[0].timestamp).toBeGreaterThanOrEqual(midTime - 10);
      expect(metricsInRange[0].timestamp).toBeLessThanOrEqual(endTime + 10);
    });

    it('should return empty array when no metrics in range', () => {
      const futureTime = Date.now() + 10000;
      const metrics = performanceService.getMetricsByTimeRange(futureTime, futureTime + 1000);
      expect(metrics).toHaveLength(0);
    });
  });

  describe('getAggregatedMetrics', () => {
    beforeEach(async () => {
      // Mock different CPU and memory values for aggregation testing
      let callCount = 0;
      (pidusage.default as jest.Mock).mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          cpu: 20 + callCount * 5, // 25, 30, 35
          memory: 100000000 + callCount * 10000000, // 110MB, 120MB, 130MB
        });
      });

      // Collect multiple metrics for aggregation
      await performanceService.collectMetrics();
      await performanceService.collectMetrics();
      await performanceService.collectMetrics();
    });

    it('should calculate aggregated metrics correctly', () => {
      const aggregated = performanceService.getAggregatedMetrics(60); // Large period to include all metrics
      
      expect(aggregated.count).toBe(3);
      expect(aggregated.avg.system?.cpu?.usage).toBeCloseTo(30); // (25+30+35)/3
      expect(aggregated.min.system?.cpu?.usage).toBe(25);
      expect(aggregated.max.system?.cpu?.usage).toBe(35);
    });

    it('should return empty aggregation when no metrics', () => {
      const service = new PerformanceMonitoringService(config);
      const aggregated = service.getAggregatedMetrics();
      
      expect(aggregated.count).toBe(0);
      expect(aggregated.avg).toEqual({});
      expect(aggregated.min).toEqual({});
      expect(aggregated.max).toEqual({});
    });

    it('should use default period of 5 minutes', () => {
      // This test verifies the default parameter works
      const aggregated = performanceService.getAggregatedMetrics();
      expect(aggregated).toBeDefined();
    });
  });

  describe('clearHistory', () => {
    it('should clear all metrics history', async () => {
      await performanceService.collectMetrics();
      await performanceService.collectMetrics();
      
      expect(performanceService.getMetricsHistory()).toHaveLength(2);
      
      performanceService.clearHistory();
      
      expect(performanceService.getMetricsHistory()).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = { interval: '*/60 * * * * *' };
      
      performanceService.updateConfig(newConfig);
      
      const updatedConfig = performanceService.getConfig();
      expect(updatedConfig.interval).toBe('*/60 * * * * *');
      expect(updatedConfig.enabled).toBe(true); // Should preserve existing config
    });

    it('should restart monitoring if currently running', () => {
      performanceService.start();
      
      const stopSpy = jest.spyOn(performanceService, 'stop');
      const startSpy = jest.spyOn(performanceService, 'start');
      
      performanceService.updateConfig({ interval: '*/60 * * * * *' });
      
      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
    });

    it('should not restart if not currently running', () => {
      // Ensure service is not running
      performanceService.stop();
      
      const stopSpy = jest.spyOn(performanceService, 'stop');
      const startSpy = jest.spyOn(performanceService, 'start');
      
      performanceService.updateConfig({ interval: '*/60 * * * * *' });
      
      expect(stopSpy).not.toHaveBeenCalled();
      expect(startSpy).not.toHaveBeenCalled();
    });
  });
});
