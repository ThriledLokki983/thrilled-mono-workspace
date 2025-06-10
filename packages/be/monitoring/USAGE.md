# Monitoring Package

A comprehensive monitoring solution for Node.js applications with Prometheus integration, health checks, and performance monitoring.

## Features

- **Prometheus Integration**: Collect and expose metrics in Prometheus format
- **Health Checks**: Readiness and liveness probes with dependency monitoring
- **Performance Monitoring**: System and process metrics collection
- **Express Integration**: Easy setup with Express applications
- **Custom Metrics**: Define and track application-specific metrics
- **Dependency Health**: Monitor databases, external services, and custom checks

## Installation

```bash
yarn add @your-org/monitoring
```

## Quick Start

### Basic Setup

```typescript
import express from 'express';
import { createMonitoringService, defaultMonitoringConfig } from '@your-org/monitoring';

const app = express();

// Create monitoring service with default configuration
const monitoring = createMonitoringService(defaultMonitoringConfig);

// Initialize monitoring services
await monitoring.initialize();

// Setup Express routes and middleware
monitoring.setupExpress(app);

// Start your server
app.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('Health checks available at:');
  console.log('- http://localhost:3000/health');
  console.log('- http://localhost:3000/health/readiness');
  console.log('- http://localhost:3000/health/liveness');
  console.log('- http://localhost:3000/health/dependencies');
  console.log('- http://localhost:3000/health/metrics/prometheus');
});
```

### Custom Configuration

```typescript
import { MonitoringConfig, createMonitoringService } from '@your-org/monitoring';

const config: MonitoringConfig = {
  metrics: {
    enabled: true,
    port: 9090,
    endpoint: '/metrics',
    collectDefaultMetrics: true,
    customMetrics: [
      {
        name: 'api_requests_total',
        help: 'Total number of API requests',
        type: 'counter',
        labelNames: ['method', 'route', 'status'],
      },
      {
        name: 'api_request_duration_seconds',
        help: 'API request duration in seconds',
        type: 'histogram',
        labelNames: ['method', 'route'],
        buckets: [0.1, 0.5, 1, 2, 5],
      },
    ],
  },
  healthChecks: {
    enabled: true,
    timeout: 10000,
    concurrency: 3,
    memoryThreshold: 0.85,
  },
  performance: {
    enabled: true,
    interval: '*/15 * * * * *', // Every 15 seconds
    maxHistorySize: 2000,
    enableEventLoopMonitoring: true,
  },
  alerting: {
    enabled: false,
    rules: [],
  },
};

const monitoring = createMonitoringService(config);
```

## Health Check Dependencies

### Database Health Check

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Register database dependency
monitoring.registerDependency('database', {
  type: 'database',
  name: 'PostgreSQL',
  critical: true,
  connection: pool,
  pool: pool,
  testQuery: 'SELECT 1',
  timeout: 5000,
});
```

### External Service Health Check

```typescript
// Register external API dependency
monitoring.registerDependency('user-service', {
  type: 'external_service',
  name: 'User Service API',
  critical: false,
  url: 'https://api.example.com/health',
  method: 'GET',
  expectedStatusCodes: [200, 204],
  headers: {
    'Authorization': 'Bearer your-token',
  },
  timeout: 3000,
});
```

### Custom Health Check

```typescript
// Register custom health check
monitoring.registerDependency('redis-cache', {
  type: 'custom',
  name: 'Redis Cache',
  critical: false,
  timeout: 2000,
  checkFunction: async () => {
    try {
      await redisClient.ping();
      return {
        status: 'healthy',
        message: 'Redis is responding',
        timestamp: Date.now(),
        responseTime: 0,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis error: ${error.message}`,
        timestamp: Date.now(),
        responseTime: 0,
      };
    }
  },
});
```

### System Health Check

```typescript
monitoring.registerDependency('system-resources', {
  type: 'system',
  name: 'System Resources',
  critical: true,
  memoryThreshold: 0.9,
  cpuThreshold: 0.8,
});
```

## Custom Metrics

### Counter Metrics

```typescript
import { Request, Response, NextFunction } from 'express';

// Create custom metrics (done during initialization)
monitoring.createCustomMetric({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  type: 'counter',
  labelNames: ['method', 'route', 'status_code'],
});

// Use in middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.on('finish', () => {
    monitoring.recordCustomMetric('http_requests_total', 1, {
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString(),
    });
  });
  next();
});
```

### Histogram Metrics

```typescript
monitoring.createCustomMetric({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  type: 'histogram',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2],
});

// Record query duration
async function executeQuery(sql: string, params: any[]) {
  const startTime = Date.now();
  
  try {
    const result = await pool.query(sql, params);
    
    const duration = (Date.now() - startTime) / 1000;
    monitoring.recordCustomMetric('db_query_duration_seconds', duration, {
      query_type: 'SELECT',
      table: 'users',
    });
    
    return result;
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    monitoring.recordCustomMetric('db_query_duration_seconds', duration, {
      query_type: 'SELECT',
      table: 'users',
    });
    throw error;
  }
}
```

### Gauge Metrics

```typescript
monitoring.createCustomMetric({
  name: 'active_connections',
  help: 'Number of active database connections',
  type: 'gauge',
  labelNames: ['pool_name'],
});

// Update gauge periodically
setInterval(() => {
  const activeConnections = pool.totalCount - pool.idleCount;
  monitoring.recordCustomMetric('active_connections', activeConnections, {
    pool_name: 'main',
  });
}, 10000);
```

## Express Integration

### Full Express Setup

```typescript
import express from 'express';
import { createMonitoringService } from '@your-org/monitoring';

const app = express();
const monitoring = createMonitoringService({
  // ... your config
});

// Initialize monitoring
await monitoring.initialize();

// Register dependencies
monitoring.registerDependency('database', {
  // ... database config
});

// Setup Express middleware and routes
monitoring.setupExpress(app, {
  routePrefix: '/monitoring', // Custom route prefix
});

// Your application routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await monitoring.shutdown();
  process.exit(0);
});

app.listen(3000);
```

## Health Check Endpoints

After setup, the following endpoints are available:

- `GET /health` - Combined health status
- `GET /health/readiness` - Readiness probe (critical dependencies)
- `GET /health/liveness` - Liveness probe (service alive)
- `GET /health/dependencies` - All dependencies status
- `GET /health/metrics/performance` - Performance metrics
- `GET /health/metrics/prometheus` - Prometheus metrics

### Health Check Response Format

```json
{
  "status": "healthy",
  "message": "Overall health: healthy",
  "timestamp": 1640995200000,
  "responseTime": 45,
  "checks": {
    "readiness": {
      "status": "healthy",
      "message": "Service is ready",
      "timestamp": 1640995200000,
      "responseTime": 12,
      "details": {
        "database": {
          "status": "healthy",
          "message": "Database connection is healthy",
          "responseTime": 8
        }
      }
    },
    "liveness": {
      "status": "healthy",
      "message": "Service is alive",
      "timestamp": 1640995200000,
      "responseTime": 5
    },
    "dependencies": {
      "status": "healthy",
      "message": "All dependencies are healthy",
      "timestamp": 1640995200000,
      "responseTime": 28
    }
  },
  "performance": {
    "timestamp": 1640995200000,
    "system": {
      "cpu": { "usage": 25.5 },
      "memory": { "used": 104857600 }
    },
    "process": {
      "uptime": 3600,
      "memoryUsage": {
        "heapUsed": 50000000
      }
    }
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

## Performance Monitoring

### Getting Performance Data

```typescript
const performanceService = monitoring.getPerformanceService();

// Get current metrics
const current = performanceService?.getCurrentMetrics();

// Get historical data
const history = performanceService?.getMetricsHistory(10); // Last 10 readings

// Get metrics by time range
const timeRangeMetrics = performanceService?.getMetricsByTimeRange(
  Date.now() - 300000, // 5 minutes ago
  Date.now()
);

// Get aggregated metrics
const aggregated = performanceService?.getAggregatedMetrics(15); // Last 15 minutes
console.log('Average CPU usage:', aggregated?.avg.system?.cpu?.usage);
console.log('Peak memory usage:', aggregated?.max.process?.memoryUsage?.heapUsed);
```

## Prometheus Integration

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/health/metrics/prometheus'
    scrape_interval: 15s
```

### Available Metrics

#### Default HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `http_request_size_bytes` - Request size histogram
- `http_response_size_bytes` - Response size histogram

#### Default System Metrics
- `process_cpu_user_seconds_total` - User CPU time
- `process_cpu_system_seconds_total` - System CPU time  
- `process_resident_memory_bytes` - Resident memory
- `process_heap_bytes` - Heap size
- `nodejs_eventloop_lag_seconds` - Event loop lag

#### Custom Metrics
All custom metrics defined in your configuration are automatically collected.

## Docker Integration

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health/liveness || exit 1

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health/liveness"]
      interval: 30s
      timeout: 3s
      retries: 3
    environment:
      - NODE_ENV=production
      
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

## Kubernetes Integration

### Deployment with Health Checks

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:latest
        ports:
        - containerPort: 3000
        readinessProbe:
          httpGet:
            path: /health/readiness
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/liveness
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
```

### ServiceMonitor for Prometheus Operator

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: http
    path: /health/metrics/prometheus
    interval: 15s
```

## Best Practices

### 1. Health Check Design
- Mark only essential services as `critical: true`
- Set appropriate timeouts for each dependency
- Use different check intervals for different dependency types

### 2. Metric Collection
- Use meaningful metric names with consistent naming conventions
- Include relevant labels but avoid high cardinality
- Set appropriate histogram buckets based on your use case

### 3. Performance Monitoring
- Adjust collection intervals based on your needs
- Monitor memory usage and set appropriate thresholds
- Use aggregated metrics for dashboards

### 4. Production Deployment
- Enable all monitoring features in production
- Set up alerting rules based on health check failures
- Monitor key business metrics alongside technical metrics

### 5. Troubleshooting
- Check logs for initialization errors
- Verify dependency configurations
- Test health endpoints manually during development

## API Reference

### MonitoringService

#### Methods
- `initialize()` - Initialize all monitoring services
- `shutdown()` - Shutdown all services gracefully
- `setupExpress(app, options?)` - Setup Express middleware and routes
- `registerDependency(name, dependency)` - Register health check dependency
- `createCustomMetric(definition)` - Create custom Prometheus metric
- `recordCustomMetric(name, value, labels?)` - Record metric value

#### Properties
- `getPrometheusService()` - Get Prometheus service instance
- `getHealthCheckService()` - Get health check service instance
- `getPerformanceService()` - Get performance monitoring service instance
- `getConfig()` - Get current configuration
- `isReady()` - Check if monitoring is initialized
- `getStatus()` - Get status of all services
