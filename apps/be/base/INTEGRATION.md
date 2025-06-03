# be/core Integration Guide for base-be Application

## ✅ Completed Integration

### **Phase 1: Type System & Response Formatting**
- **Migrated Error Middleware** - Updated to use `apiResponse`, `HttpStatusCodes`, and `ApiError` from `@mono/be-core`
- **Updated Controllers** - All controllers now import standardized types from be/core:
  - `health.controller.ts` ✅
  - `auth.controller.ts` ✅  
  - `users.controller.ts` ✅
- **Updated Services** - User service now uses `HttpStatusCodes` from be/core
- **Removed Local Dependencies** - No longer importing from local utils for response formatting

### **Phase 2: Security Middleware Integration**
- **Rate Limiting** - App.ts now uses `SecurityMiddleware.rateLimit()` from be/core instead of manual configuration
- **Enhanced Configuration** - Leveraging the enhanced rate limiting configuration from be/core
- **Consistent Error Handling** - All error responses now use the standardized `ApiResponse<T>` format

### **Phase 3: Demo Implementation**
- **Created CoreDemoController** - Demonstrates all be/core response formatting features
- **Added Demo Routes** - New `/api/v1/core-demo/*` endpoints showcasing:
  - Standard success responses
  - Pagination with meta information  
  - Various HTTP status codes
  - Error handling scenarios
- **Swagger Documentation** - All demo endpoints are documented

## 🔧 Available be/core Features

### **Response Formatting**
```typescript
import { apiResponse, HttpStatusCodes, createPaginationMeta } from '@mono/be-core';

// Success responses
apiResponse.success(res, 'Data retrieved', data, meta);
apiResponse.created(res, 'Resource created', newResource);
apiResponse.noContent(res, 'Operation completed');

// Error responses  
apiResponse.badRequest(res, 'Invalid input', errors);
apiResponse.unauthorized(res, 'Authentication required');
apiResponse.forbidden(res, 'Access denied');
apiResponse.notFound(res, 'Resource not found');
apiResponse.conflict(res, 'Resource already exists');
apiResponse.unprocessableEntity(res, 'Validation failed', errors);
apiResponse.serverError(res, 'Internal server error');

// Custom responses
apiResponse.custom(res, HttpStatusCodes.OK, 'Custom message', data, meta, errors);
```

### **Security Middleware**
```typescript
import { SecurityMiddleware } from '@mono/be-core';

// Rate limiting
const limiter = SecurityMiddleware.rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests'
});

// CORS configuration
const corsMiddleware = SecurityMiddleware.cors({
  origin: ['http://localhost:3000'],
  credentials: true
});

// Helmet security headers
const helmetMiddleware = SecurityMiddleware.helmet({
  contentSecurityPolicy: false
});
```

### **Enhanced Logger**
```typescript
import { Logger } from '@mono/be-core';

const logger = new Logger({
  level: 'info',
  format: 'json',
  dir: './logs'
});
```

## 🚀 Testing the Integration

### **Demo Endpoints**
Test the integration using these new endpoints:

```bash
# Standard response formatting
GET /api/v1/core-demo/response

# Pagination with meta information
GET /api/v1/core-demo/pagination?page=2&limit=5

# Different status codes
GET /api/v1/core-demo/status/created
GET /api/v1/core-demo/status/nocontent
GET /api/v1/core-demo/status/badrequest
GET /api/v1/core-demo/status/notfound
GET /api/v1/core-demo/status/conflict

# Error handling scenarios
GET /api/v1/core-demo/error/validation
GET /api/v1/core-demo/error/unauthorized
GET /api/v1/core-demo/error/forbidden
GET /api/v1/core-demo/error/server
```

### **Build & Run**
```bash
# Build both packages
npx nx build core
npx nx build base-be

# Run in development
npx nx serve base-be

# Run tests
npx nx test base-be
```

## 📋 Next Integration Opportunities

### **1. BaseApp Class Migration**
Consider migrating from the current `App` class to the enhanced `BaseApp` class from be/core:

```typescript
import { BaseApp } from '@mono/be-core';

const app = new BaseApp({
  name: 'Base API',
  port: 5555,
  cors: { origin: ['http://localhost:3000'] },
  rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  helmet: { contentSecurityPolicy: false }
});
```

### **2. Plugin System Integration**
Leverage the plugin system for modular functionality:

```typescript
import { Plugin, PluginManager } from '@mono/be-core';

class DatabasePlugin extends Plugin {
  async initialize() {
    // Database connection logic
  }
}

const pluginManager = new PluginManager();
pluginManager.loadPlugin(new DatabasePlugin());
```

### **3. Health Check System**
Implement comprehensive health checks:

```typescript
import { HealthCheck } from '@mono/be-core';

const healthCheck = new HealthCheck({
  checks: {
    database: async () => ({ status: 'healthy', message: 'DB connected' }),
    redis: async () => ({ status: 'healthy', message: 'Redis connected' })
  }
});
```

### **4. Graceful Shutdown**
Add graceful shutdown handling:

```typescript
import { GracefulShutdown } from '@mono/be-core';

const shutdown = new GracefulShutdown({
  timeout: 10000,
  cleanup: [
    async () => { /* close database */ },
    async () => { /* close redis */ }
  ]
});
```

## 🔄 Migration Benefits

### **Achieved**
- ✅ **Consistent API Responses** - All endpoints now return standardized format
- ✅ **Better Type Safety** - Using shared TypeScript interfaces
- ✅ **Enhanced Security** - Improved rate limiting configuration
- ✅ **Reduced Code Duplication** - Shared utilities across applications
- ✅ **Better Error Handling** - Standardized error response format

### **Potential Future Benefits**
- 🎯 **Plugin Architecture** - Modular, extensible application structure
- 🎯 **Health Monitoring** - Built-in health check endpoints
- 🎯 **Graceful Shutdown** - Proper cleanup on application termination
- 🎯 **Advanced Middleware** - Enhanced security and logging middleware
- 🎯 **Configuration Management** - Centralized configuration handling

## 📚 Documentation

- **API Documentation**: Visit `/api-docs` for Swagger documentation
- **Core Demo**: Use `/api/v1/core-demo/*` endpoints to explore features
- **Package Documentation**: See `packages/be/core/README.md` for detailed usage

---

**Integration Status**: ✅ Phase 1 Complete, 🔄 Ready for Phase 2 enhancements
