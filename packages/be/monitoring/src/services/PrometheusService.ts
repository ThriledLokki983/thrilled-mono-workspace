/**
 * Prometheus Metrics Service
 * Handles metric collection, custom metrics, and Prometheus integration
 */
import { 
  collectDefaultMetrics, 
  Counter, 
  Gauge, 
  Histogram, 
  Summary,
  Registry
} from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { MetricDefinition, MonitoringConfig, PrometheusMetrics } from '../types/monitoring.types.js';

export class PrometheusService {
  private registry: Registry;
  private config: NonNullable<MonitoringConfig['metrics']>;
  private metrics!: PrometheusMetrics;
  private customMetrics: Map<string, Counter | Gauge | Histogram | Summary>;

  constructor(config: MonitoringConfig['metrics'] = { enabled: true }) {
    this.config = {
      prefix: 'app_',
      collectDefaultMetrics: true,
      collectInterval: 5000,
      ...config,
      enabled: config?.enabled ?? true
    };

    this.registry = new Registry();
    this.customMetrics = new Map();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (!this.config.enabled) return;

    // Collect default Node.js metrics
    if (this.config.collectDefaultMetrics) {
      collectDefaultMetrics({
        register: this.registry,
        prefix: this.config.prefix,
      });
    }

    // HTTP metrics
    this.metrics = {
      httpRequestDuration: new Histogram({
        name: `${this.config.prefix}http_request_duration_seconds`,
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        registers: [this.registry]
      }),

      httpRequestTotal: new Counter({
        name: `${this.config.prefix}http_requests_total`,
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [this.registry]
      }),

      httpRequestSize: new Histogram({
        name: `${this.config.prefix}http_request_size_bytes`,
        help: 'Size of HTTP requests in bytes',
        labelNames: ['method', 'route'],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        registers: [this.registry]
      }),

      httpResponseSize: new Histogram({
        name: `${this.config.prefix}http_response_size_bytes`,
        help: 'Size of HTTP responses in bytes',
        labelNames: ['method', 'route'],
        buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
        registers: [this.registry]
      }),

      // System metrics
      systemCpuUsage: new Gauge({
        name: `${this.config.prefix}system_cpu_usage_percent`,
        help: 'System CPU usage percentage',
        registers: [this.registry]
      }),

      systemMemoryUsage: new Gauge({
        name: `${this.config.prefix}system_memory_usage_bytes`,
        help: 'System memory usage in bytes',
        labelNames: ['type'],
        registers: [this.registry]
      }),

      processUptime: new Gauge({
        name: `${this.config.prefix}process_uptime_seconds`,
        help: 'Process uptime in seconds',
        registers: [this.registry]
      }),

      processMemoryUsage: new Gauge({
        name: `${this.config.prefix}process_memory_usage_bytes`,
        help: 'Process memory usage in bytes',
        labelNames: ['type'],
        registers: [this.registry]
      }),

      eventLoopLag: new Gauge({
        name: `${this.config.prefix}nodejs_eventloop_lag_seconds`,
        help: 'Event loop lag in seconds',
        registers: [this.registry]
      }),

      databaseConnections: new Gauge({
        name: `${this.config.prefix}database_connections_total`,
        help: 'Total number of database connections',
        labelNames: ['database', 'state'],
        registers: [this.registry]
      }),

      customMetrics: this.customMetrics
    };
  }

  /**
   * Create a custom metric
   */
  createMetric(definition: MetricDefinition): Counter | Gauge | Histogram | Summary | null {
    if (!this.config.enabled) return null;

    const name = `${this.config.prefix}${definition.name}`;
    let metric: Counter | Gauge | Histogram | Summary;

    switch (definition.type) {
      case 'counter':
        metric = new Counter({
          name,
          help: definition.help,
          labelNames: definition.labelNames || [],
          registers: [this.registry]
        });
        break;
      case 'gauge':
        metric = new Gauge({
          name,
          help: definition.help,
          labelNames: definition.labelNames || [],
          registers: [this.registry]
        });
        break;
      case 'histogram':
        metric = new Histogram({
          name,
          help: definition.help,
          labelNames: definition.labelNames || [],
          buckets: definition.buckets,
          registers: [this.registry]
        });
        break;
      case 'summary':
        metric = new Summary({
          name,
          help: definition.help,
          labelNames: definition.labelNames || [],
          percentiles: definition.percentiles,
          registers: [this.registry]
        });
        break;
      default:
        throw new Error(`Unsupported metric type: ${definition.type}`);
    }

    this.customMetrics.set(definition.name, metric);
    return metric;
  }

  /**
   * Record a custom metric value
   */
  recordMetric(metricName: string, value: number, labels?: Record<string, string>): void {
    if (!this.config.enabled) return;

    const metric = this.customMetrics.get(metricName);
    if (!metric) {
      throw new Error(`Metric ${metricName} not found`);
    }

    if (labels) {
      if (metric instanceof Counter) {
        metric.inc(labels, value);
      } else if (metric instanceof Gauge) {
        metric.set(labels, value);
      } else if (metric instanceof Histogram || metric instanceof Summary) {
        metric.observe(labels, value);
      }
    } else {
      if (metric instanceof Counter) {
        metric.inc(value);
      } else if (metric instanceof Gauge) {
        metric.set(value);
      } else if (metric instanceof Histogram || metric instanceof Summary) {
        metric.observe(value);
      }
    }
  }

  /**
   * Express middleware for HTTP metrics
   */
  getExpressMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled) {
        return next();
      }

      const startTime = Date.now();
      const originalSend = res.send.bind(res);

      // Track request size
      const requestSize = parseInt(req.get('Content-Length') || '0', 10);
      if (requestSize > 0) {
        this.metrics.httpRequestSize
          .labels(req.method, req.route?.path || req.path)
          .observe(requestSize);
      }

      // Override res.send to capture response metrics
      res.send = (body: unknown) => {
        const duration = (Date.now() - startTime) / 1000;
        const route = req.route?.path || req.path;
        const statusCode = res.statusCode.toString();

        // Record metrics
        this.metrics.httpRequestTotal
          .labels(req.method, route, statusCode)
          .inc();

        this.metrics.httpRequestDuration
          .labels(req.method, route, statusCode)
          .observe(duration);

        // Track response size
        const responseSize = Buffer.byteLength(body as string || '', 'utf8');
        this.metrics.httpResponseSize
          .labels(req.method, route)
          .observe(responseSize);

        return originalSend(body);
      };

      next();
    };
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(
    cpuUsage: number, 
    memoryUsage: { used: number; free: number; total: number }, 
    eventLoopLag: number
  ): void {
    if (!this.config.enabled) return;

    this.metrics.systemCpuUsage.set(cpuUsage);
    
    this.metrics.systemMemoryUsage.set({ type: 'used' }, memoryUsage.used);
    this.metrics.systemMemoryUsage.set({ type: 'free' }, memoryUsage.free);
    this.metrics.systemMemoryUsage.set({ type: 'total' }, memoryUsage.total);

    this.metrics.processUptime.set(process.uptime());
    
    const processMemory = process.memoryUsage();
    this.metrics.processMemoryUsage.set({ type: 'rss' }, processMemory.rss);
    this.metrics.processMemoryUsage.set({ type: 'heapUsed' }, processMemory.heapUsed);
    this.metrics.processMemoryUsage.set({ type: 'heapTotal' }, processMemory.heapTotal);
    this.metrics.processMemoryUsage.set({ type: 'external' }, processMemory.external);

    this.metrics.eventLoopLag.set(eventLoopLag);
  }

  /**
   * Update database connection metrics
   */
  updateDatabaseMetrics(database: string, activeConnections: number, idleConnections: number): void {
    if (!this.config.enabled) return;

    this.metrics.databaseConnections.set({ database, state: 'active' }, activeConnections);
    this.metrics.databaseConnections.set({ database, state: 'idle' }, idleConnections);
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    if (!this.config.enabled) return '';
    return this.registry.metrics();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.registry.clear();
    this.customMetrics.clear();
  }

  /**
   * Get registry for custom use
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): Counter | Gauge | Histogram | Summary | undefined {
    return this.customMetrics.get(name);
  }

  /**
   * List all custom metrics
   */
  listMetrics(): string[] {
    return Array.from(this.customMetrics.keys());
  }
}
