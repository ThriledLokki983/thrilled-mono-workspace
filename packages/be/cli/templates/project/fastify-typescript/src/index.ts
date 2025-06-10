import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import 'dotenv/config';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty'
    } : undefined
  }
});

// Register plugins
await fastify.register(helmet);
await fastify.register(cors);
await fastify.register(formbody);
await fastify.register(multipart);

{{#if features.database}}
// Database connection
{{#if (eq database 'postgresql')}}
await fastify.register(import('@fastify/postgres'), {
  connectionString: process.env.DATABASE_URL
});
{{else if (eq database 'mysql')}}
await fastify.register(import('@fastify/mysql'), {
  connectionString: process.env.DATABASE_URL ||
    `mysql://${process.env.DB_USER || 'root'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:3306/${process.env.DB_NAME || '{{kebabCase name}}'}`
});
{{else if (eq database 'mongodb')}}
await fastify.register(import('@fastify/mongodb'), {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/{{kebabCase name}}'
});
{{/if}}
{{/if}}

{{#if features.authentication}}
// JWT Plugin
await fastify.register(import('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'supersecret'
});

// Authentication decorator
fastify.decorate('authenticate', async function(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
{{/if}}

// Routes
fastify.get('/', async (request, reply) => {
  return {
    message: 'Welcome to {{name}}',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  };
});

fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  
  request.log.error(error);
  
  reply.status(statusCode).send({
    error: error.message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    {{#if features.database}}
    console.log(`💾 Database: {{database}}`);
    {{/if}}
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
