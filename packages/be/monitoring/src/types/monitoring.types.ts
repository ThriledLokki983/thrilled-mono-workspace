/**
 * TypeScript type definitions for monitoring system
 */

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
}

export interface CustomMetric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: Record<string, string>;
  value?: number;
  buckets?: number[];
  percentiles?: number[];
}

export interface HealthCheckResult {
  status: HealthStatus;
  details?: Record<string, any>;
  message: string;
  timestamp: number;
  responseTime: number;
}

export interface HealthCheckDefinition {
  name: string;
  description: string;
  timeout?: number;
  interval?: number;
  retries?: number;
  critical?: boolean;
  check: () => Promise<HealthCheckResult>;
}

// Health Check Dependencies
export interface DatabaseHealthCheck {
  type: 'database';
  name: string;
  critical: boolean;
  timeout?: number;
  connection?: any;
  pool?: any;
  testQuery?: string;
}

export interface ExternalServiceHealthCheck {
  type: 'external_service';
  name: string;
  critical: boolean;
  timeout?: number;
  url: string;
  method?: string;
  expectedStatusCodes?: number[];
  headers?: Record<string, string>;
}

export interface SystemHealthCheck {
  type: 'system';
  name: string;
  critical: boolean;
  timeout?: number;
  memoryThreshold?: number;
  cpuThreshold?: number;
}

export interface CustomHealthCheck {
  type: 'custom';
  name: string;
  critical: boolean;
  timeout?: number;
  checkFunction?: () => Promise<HealthCheckResult>;
}

export type HealthCheckDependency = DatabaseHealthCheck | ExternalServiceHealthCheck | SystemHealthCheck | CustomHealthCheck;

export interface HealthCheckConfig {
  enabled: boolean;
  timeout?: number;
  concurrency?: number;
  memoryThreshold?: number;
}

// Performance Monitoring Types
export interface SystemMetrics {
  cpu: {
    usage: number;
    user: number;
    system: number;
    idle: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    cached: number;
    buffers: number;
  };
  disk: {
    used: number;
    available: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  loadAverage: number[];
  uptime: number;
}

export interface ProcessMetrics {
  pid: number;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: NodeJS.CpuUsage;
  resourceUsage?: {
    userCPUTime: number;
    systemCPUTime: number;
    maxRSS: number;
    sharedMemorySize: number;
    unsharedDataSize: number;
    unsharedStackSize: number;
    minorPageFault: number;
    majorPageFault: number;
    swappedOut: number;
    fsRead: number;
    fsWrite: number;
    ipcSent: number;
    ipcReceived: number;
    signalsCount: number;
    voluntaryContextSwitches: number;
    involuntaryContextSwitches: number;
  };
  handles: string[];
}

export interface EventLoopMetrics {
  lag: number;
  utilization: number;
}

export interface PerformanceMetrics {
  timestamp: number;
  system: SystemMetrics;
  process: ProcessMetrics;
  eventLoop: EventLoopMetrics;
}

export interface PerformanceConfig {
  enabled: boolean;
  interval?: string;
  maxHistorySize?: number;
  enableEventLoopMonitoring?: boolean;
}

export interface ExternalServiceCheck {
  name: string;
  url: string;
  timeout?: number;
  expectedStatus?: number;
  headers?: Record<string, string>;
}

export interface MetricsConfig {
  enabled: boolean;
  prefix?: string;
  port?: number;
  endpoint?: string;
  collectDefaultMetrics?: boolean;
  collectInterval?: number;
  customMetrics?: MetricDefinition[];
}

export interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  webhooks?: string[];
  email?: {
    to: string[];
    from: string;
    smtp: any;
  };
}

export interface MonitoringConfig {
  metrics?: MetricsConfig;
  healthChecks?: HealthCheckConfig;
  performance?: PerformanceConfig;
  alerting?: AlertingConfig;
}

export interface PrometheusMetrics {
  httpRequestDuration: any;
  httpRequestTotal: any;
  httpRequestSize: any;
  httpResponseSize: any;
  systemCpuUsage: any;
  systemMemoryUsage: any;
  processUptime: any;
  processMemoryUsage: any;
  eventLoopLag: any;
  databaseConnections: any;
  customMetrics: Map<string, any>;
}

export interface PerformanceData {
  timestamp: number;
  metrics: SystemMetrics;
  custom?: Record<string, number>;
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}
