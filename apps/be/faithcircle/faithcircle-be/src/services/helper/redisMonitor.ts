import { Container } from 'typedi';
import { CacheManager } from '@thrilled/databases';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';

export interface CacheMetrics {
  uptime: number;
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastError?: string;
  lastErrorTime?: Date;
  reconnectAttempts: number;
  latency?: number;
  keyCount?: number;
  lastCheck?: Date;
}

/**
 * Cache Monitor Service for collecting metrics and health data from CacheManager
 */
export class RedisMonitor extends EventEmitter {
  private metrics: CacheMetrics = {
    uptime: 0,
    status: 'disconnected',
    reconnectAttempts: 0,
  };
  private monitorInterval: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Get CacheManager instance from TypeDI container
   */
  private getCacheManager(): CacheManager | null {
    try {
      return Container.get('cacheManager');
    } catch (error) {
      // Don't log error on every attempt - cache manager might not be ready yet
      return null;
    }
  }

  /**
   * Set up event handlers for monitoring
   */
  private setupEventHandlers(): void {
    // Since we don't have direct access to Redis events through CacheManager,
    // we'll use periodic health checks to determine status
    this.startPeriodicHealthCheck();
  }

  /**
   * Start periodic health checks to monitor cache status
   */
  private startPeriodicHealthCheck(): void {
    // Don't run initial health check immediately - wait for cache manager to be available
    // Set up periodic health check every 30 seconds
    const healthCheckInterval = setInterval(() => {
      this.checkCacheHealth();
    }, 30000);

    // Store reference for cleanup
    this.pingInterval = healthCheckInterval;
  }

  /**
   * Perform a health check on the cache manager
   */
  private async checkCacheHealth(): Promise<void> {
    try {
      const cacheManager = this.getCacheManager();

      // If cache manager is not available yet, just return silently
      if (!cacheManager) {
        this.metrics.status = 'disconnected';
        this.metrics.lastCheck = new Date();
        return;
      }

      const isConnected = cacheManager.getConnectionStatus();

      if (isConnected) {
        // Try to ping to confirm actual connectivity
        await cacheManager.ping();

        if (this.metrics.status !== 'connected') {
          logger.info('Cache connection established');
          this.metrics.reconnectAttempts = 0;
        }

        this.metrics.status = 'connected';
        this.metrics.lastError = undefined;
        this.metrics.lastErrorTime = undefined;
      } else {
        this.handleConnectionError('Cache manager reports disconnected status');
      }
    } catch (error) {
      this.handleConnectionError((error as Error).message);
    }

    this.metrics.lastCheck = new Date();
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(errorMessage: string): void {
    this.metrics.status = 'error';
    this.metrics.lastError = errorMessage;
    this.metrics.lastErrorTime = new Date();
    this.metrics.reconnectAttempts++;

    if (this.metrics.reconnectAttempts === 1) {
      // Only log on first error to avoid spam
      logger.error(`Cache health check failed: ${errorMessage}`);
    }

    this.emit('error', { error: errorMessage, attempts: this.metrics.reconnectAttempts });
  }

  /**
   * Start monitoring Redis metrics
   * @param interval Collection interval in milliseconds (default 60000 - 1 minute)
   */
  public startMonitoring(interval = 60000): void {
    // Clear any existing intervals
    this.stopMonitoring();

    // Start periodic collection
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, interval);

    // Also start ping interval (more frequent)
    if (!this.pingInterval) {
      // Only create ping interval if we don't already have a health check
      this.pingInterval = setInterval(() => {
        this.measureLatency();
      }, Math.min(interval / 4, 15000)); // At least every 15 seconds
    }

    // Try to collect initial metrics, but don't fail if cache manager isn't ready
    this.collectMetrics().catch(() => {
      // Ignore errors during initial collection - cache manager might not be ready
    });

    logger.info(`Redis monitoring started with ${interval}ms interval`);
  }

  /**
   * Stop monitoring Redis metrics
   */
  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    logger.info('Redis monitoring stopped');
  }

  /**
   * Measure Redis response latency
   */
  private async measureLatency(): Promise<void> {
    if (this.metrics.status !== 'connected') {
      return;
    }

    try {
      const cacheManager = this.getCacheManager();

      // If cache manager is not available, skip latency measurement
      if (!cacheManager) {
        return;
      }

      const start = Date.now();
      await cacheManager.ping();
      const end = Date.now();
      this.metrics.latency = end - start;

      // Emit event if latency is too high (> 100ms)
      if (this.metrics.latency > 100) {
        this.emit('high-latency', { latency: this.metrics.latency });
        logger.warn(`Cache high latency: ${this.metrics.latency}ms`);
      }
    } catch (error) {
      logger.error(`Cache latency check failed: ${(error as Error).message}`);
      this.handleConnectionError((error as Error).message);
    }
  }

  /**
   * Collect cache metrics using CacheManager
   */
  private async collectMetrics(): Promise<void> {
    if (this.metrics.status !== 'connected') {
      return;
    }

    try {
      const cacheManager = this.getCacheManager();

      // If cache manager is not available, skip metrics collection
      if (!cacheManager) {
        return;
      }

      // Update uptime
      this.metrics.uptime = Math.floor((Date.now() - this.startTime) / 1000);

      // Get basic cache statistics
      const stats = await cacheManager.getStats();
      this.metrics.keyCount = stats.keyCount;

      // Emit metrics event
      this.emit('metrics', this.metrics);

      // Log important metrics changes
      logger.debug(`Cache metrics collected: ${this.metrics.keyCount} keys, status: ${this.metrics.status}`);
    } catch (error) {
      logger.error(`Cache metrics collection failed: ${(error as Error).message}`);
      this.handleConnectionError((error as Error).message);
    }
  }

  /**
   * Get the current metrics snapshot
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if Redis is healthy based on current metrics
   */
  public isHealthy(): boolean {
    return this.metrics.status === 'connected' && (this.metrics.latency === undefined || this.metrics.latency < 500);
  }

  /**
   * Get a detailed health report for Redis
   */
  public getHealthReport(): {
    healthy: boolean;
    status: string;
    latency?: number;
    uptime: number;
    keyCount?: number;
    lastError?: string;
    lastErrorTime?: Date;
    lastCheck?: Date;
  } {
    const healthy = this.isHealthy();

    return {
      healthy,
      status: this.metrics.status,
      latency: this.metrics.latency,
      uptime: this.metrics.uptime,
      keyCount: this.metrics.keyCount,
      lastError: this.metrics.lastError,
      lastErrorTime: this.metrics.lastErrorTime,
      lastCheck: this.metrics.lastCheck,
    };
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}
