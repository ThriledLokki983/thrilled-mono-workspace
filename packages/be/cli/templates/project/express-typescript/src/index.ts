import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
{{#if_includes features 'auth'}}
import { authRouter } from './routes/auth.{{ext language}}';
{{/if_includes}}
{{#if_includes features 'monitoring'}}
import { MonitoringService } from '@thrilled/monitoring';
{{/if_includes}}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

{{#if_includes features 'monitoring'}}
// Initialize monitoring
const monitoring = new MonitoringService({
  enabled: true,
  prometheus: {
    enabled: true,
    port: 9090
  }
});

monitoring.initialize().then(() => {
  console.log('✓ Monitoring initialized');
}).catch(console.error);

// Add monitoring middleware
app.use(monitoring.middleware());
{{/if_includes}}

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to {{pascalCase name}} API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

{{#if_includes features 'auth'}}
// Authentication routes
app.use('/api/auth', authRouter);
{{/if_includes}}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal. Shutting down gracefully...');
  {{#if_includes features 'monitoring'}}
  await monitoring.shutdown();
  {{/if_includes}}
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal. Shutting down gracefully...');
  {{#if_includes features 'monitoring'}}
  await monitoring.shutdown();
  {{/if_includes}}
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  {{#if_includes features 'monitoring'}}
  console.log(`📊 Metrics: http://localhost:9090/metrics`);
  {{/if_includes}}
});
