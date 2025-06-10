import {
  SystemMetrics,
  PerformanceMetrics,
  PerformanceConfig,
  EventLoopMetrics,
  ProcessMetrics,
} from '../types/monitoring.types.js';
import pidusage from 'pidusage';
import cron from 'node-cron';

interface Metrics {
    system?: { cpu?: { usage: number } };
    process?: { memoryUsage?: { heapUsed: number } };
    eventLoop?: { lag: number };
}

export class PerformanceMonitoringService {
  private config: PerformanceConfig;
  private isMonitoring = false;
  private cronJob?: cron.ScheduledTask;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory: number;
  private eventLoopStartTime = process.hrtime.bigint();
  private eventLoopDelayCallback?: NodeJS.Timeout;

  constructor(config: PerformanceConfig) {
    this.config = config;
    this.maxMetricsHistory = config.maxHistorySize || 1000;
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Schedule periodic metrics collection
    const interval = this.config.interval || '*/30 * * * * *'; // Every 30 seconds by default
    this.cronJob = cron.schedule(interval, () => {
      this.collectMetrics();
    });

    // Start event loop monitoring if enabled
    if (this.config.enableEventLoopMonitoring) {
      this.startEventLoopMonitoring();
    }

    console.log('Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = undefined;
    }

    if (this.eventLoopDelayCallback) {
      clearTimeout(this.eventLoopDelayCallback);
      this.eventLoopDelayCallback = undefined;
    }

    console.log('Performance monitoring stopped');
  }

  /**
   * Collect current system and process metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      const timestamp = Date.now();
      
      // Get system metrics
      const systemMetrics = await this.getSystemMetrics();
      
      // Get process metrics
      const processMetrics = this.getProcessMetrics();
      
      // Get event loop metrics
      const eventLoopMetrics = this.getEventLoopMetrics();

      const metrics: PerformanceMetrics = {
        timestamp,
        system: systemMetrics,
        process: processMetrics,
        eventLoop: eventLoopMetrics,
      };

      // Store metrics in history
      this.addToHistory(metrics);

      return metrics;
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get system-level metrics using pidusage
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const stats = await pidusage(process.pid);
      
      return {
        cpu: {
          usage: stats.cpu,
          user: 0, // pidusage doesn't provide user/system breakdown
          system: 0,
          idle: 100 - stats.cpu,
        },
        memory: {
          total: stats.memory,
          used: stats.memory,
          free: 0, // Not provided by pidusage
          available: 0, // Not provided by pidusage
          cached: 0,
          buffers: 0,
        },
        disk: {
          used: 0, // Would need additional library for disk metrics
          available: 0,
          total: 0,
          usage: 0,
        },
        network: {
          bytesIn: 0, // Would need additional monitoring for network
          bytesOut: 0,
          packetsIn: 0,
          packetsOut: 0,
        },
        loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
        uptime: require('os').uptime(),
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }

  /**
   * Get Node.js process metrics
   */
  private getProcessMetrics(): ProcessMetrics {
    const memoryUsage = process.memoryUsage();
    const resourceUsage = process.resourceUsage ? process.resourceUsage() : undefined;
    
    return {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
      },
      cpuUsage: process.cpuUsage(),
      resourceUsage: resourceUsage ? {
        userCPUTime: resourceUsage.userCPUTime,
        systemCPUTime: resourceUsage.systemCPUTime,
        maxRSS: resourceUsage.maxRSS,
        sharedMemorySize: resourceUsage.sharedMemorySize,
        unsharedDataSize: resourceUsage.unsharedDataSize,
        unsharedStackSize: resourceUsage.unsharedStackSize,
        minorPageFault: resourceUsage.minorPageFault,
        majorPageFault: resourceUsage.majorPageFault,
        swappedOut: resourceUsage.swappedOut,
        fsRead: resourceUsage.fsRead,
        fsWrite: resourceUsage.fsWrite,
        ipcSent: resourceUsage.ipcSent,
        ipcReceived: resourceUsage.ipcReceived,
        signalsCount: resourceUsage.signalsCount,
        voluntaryContextSwitches: resourceUsage.voluntaryContextSwitches,
        involuntaryContextSwitches: resourceUsage.involuntaryContextSwitches,
      } : undefined,
      handles: process.getActiveResourcesInfo ? process.getActiveResourcesInfo() : [],
    };
  }

  /**
   * Get event loop metrics
   */
  private getEventLoopMetrics(): EventLoopMetrics {
    const now = process.hrtime.bigint();
    const delay = Number(now - this.eventLoopStartTime) / 1e6; // Convert to milliseconds
    
    return {
      lag: delay,
      utilization: this.calculateEventLoopUtilization(),
    };
  }

  /**
   * Calculate event loop utilization
   */
  private calculateEventLoopUtilization(): number {
    try {
      if (process.features && process.features.inspector) {
        // Use performance hooks if available
        const { performance } = require('perf_hooks');
        if (performance.eventLoopUtilization) {
          const utilization = performance.eventLoopUtilization();
          return utilization.utilization;
        }
      }
      
      // Fallback calculation
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Start event loop delay monitoring
   */
  private startEventLoopMonitoring(): void {
    const measureDelay = () => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        this.eventLoopStartTime = start;
        if (this.isMonitoring) {
          this.eventLoopDelayCallback = setTimeout(measureDelay, 1000);
        }
      });
    };

    measureDelay();
  }

  /**
   * Add metrics to history
   */
  private addToHistory(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Maintain maximum history size
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    if (limit) {
      return this.metrics.slice(-limit);
    }
    return [...this.metrics];
  }

  /**
   * Get metrics within time range
   */
  getMetricsByTimeRange(startTime: number, endTime: number): PerformanceMetrics[] {
    return this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Get aggregated metrics over a period
   */
  getAggregatedMetrics(periodMinutes = 5): {
    avg: Metrics;
    min: Metrics;
    max: Metrics;
    count: number;
  } {
    const periodMs = periodMinutes * 60 * 1000;
    const cutoffTime = Date.now() - periodMs;
    
    const recentMetrics = this.metrics.filter(metric => metric.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) {
      return {
        avg: {},
        min: {},
        max: {},
        count: 0,
      };
    }

    // Calculate averages, mins, and maxs
    const aggregated = recentMetrics.reduce((acc, metric) => {
      // CPU averages
      acc.avgCpuUsage += metric.system.cpu.usage;
      acc.minCpuUsage = Math.min(acc.minCpuUsage, metric.system.cpu.usage);
      acc.maxCpuUsage = Math.max(acc.maxCpuUsage, metric.system.cpu.usage);

      // Memory averages
      acc.avgMemoryUsed += metric.process.memoryUsage.heapUsed;
      acc.minMemoryUsed = Math.min(acc.minMemoryUsed, metric.process.memoryUsage.heapUsed);
      acc.maxMemoryUsed = Math.max(acc.maxMemoryUsed, metric.process.memoryUsage.heapUsed);

      // Event loop lag
      acc.avgEventLoopLag += metric.eventLoop.lag;
      acc.minEventLoopLag = Math.min(acc.minEventLoopLag, metric.eventLoop.lag);
      acc.maxEventLoopLag = Math.max(acc.maxEventLoopLag, metric.eventLoop.lag);

      return acc;
    }, {
      avgCpuUsage: 0,
      minCpuUsage: Infinity,
      maxCpuUsage: -Infinity,
      avgMemoryUsed: 0,
      minMemoryUsed: Infinity,
      maxMemoryUsed: -Infinity,
      avgEventLoopLag: 0,
      minEventLoopLag: Infinity,
      maxEventLoopLag: -Infinity,
    });

    const count = recentMetrics.length;

    return {
      avg: {
        system: {
          cpu: { usage: aggregated.avgCpuUsage / count }
        },
        process: {
          memoryUsage: { heapUsed: aggregated.avgMemoryUsed / count }
        },
        eventLoop: {
          lag: aggregated.avgEventLoopLag / count
        },
      },
      min: {
        system: {
          cpu: { usage: aggregated.minCpuUsage }
        },
        process: {
          memoryUsage: { heapUsed: aggregated.minMemoryUsed }
        },
        eventLoop: {
          lag: aggregated.minEventLoopLag
        },
      },
      max: {
        system: {
          cpu: { usage: aggregated.maxCpuUsage }
        },
        process: {
          memoryUsage: { heapUsed: aggregated.maxMemoryUsed }
        },
        eventLoop: {
          lag: aggregated.maxEventLoopLag
        },
      },
      count,
    };
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metrics = [];
  }

  /**
   * Get monitoring status
   */
  isRunning(): boolean {
    return this.isMonitoring;
  }

  /**
   * Get configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if configuration changed and monitoring is active
    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }
}
