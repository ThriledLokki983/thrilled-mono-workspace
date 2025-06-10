// Core services
export { PrometheusService } from './services/PrometheusService.js';
export { HealthCheckService } from './services/HealthCheckService.js';
export { PerformanceMonitoringService } from './services/PerformanceMonitoringService.js';
export { MonitoringService, createMonitoringService, defaultMonitoringConfig } from './services/MonitoringService.js';

// Routes
export { HealthCheckRoutes, createHealthCheckRoutes } from './routes/HealthCheckRoutes.js';

// Types
export * from './types/monitoring.types.js';

// Legacy export for compatibility
export * from './lib/monitoring.js';
