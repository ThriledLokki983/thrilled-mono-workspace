# @mono/be-core

A shared backend core library providing common utilities for backend applications in the monorepo.

## Features

- **Logger**: A comprehensive logging utility built on Winston with daily file rotation
- **Validation**: Integrated validation and sanitization middleware powered by @thrilled/be-validation
- **Security**: Automatic XSS protection, SQL injection prevention, and request sanitization
- **Configurable**: Flexible configuration options for different environments
- **TypeScript**: Full TypeScript support with proper type definitions

## Installation

This package is part of the monorepo and should be used as an internal dependency:

```json
{
  "dependencies": {
    "@mono/be-core": "workspace:*"
  }
}
```

## Logger Usage

### Basic Usage

```typescript
import { defaultLogger, createLogger } from '@mono/be-core';

// Use the default logger
defaultLogger.info('Application started');
defaultLogger.error('Something went wrong', { error: 'details' });

// Create a custom logger
const logger = createLogger({
  level: 'debug',
  dir: './logs',
  format: 'json',
});

logger.info('Custom logger message');
```

### Configuration Options

```typescript
interface LoggingConfig {
  level?: string; // Log level (default: 'info')
  dir?: string; // Directory for log files (default: './logs')
  format?: 'json' | 'simple'; // Log format (default: 'simple')
  httpLogging?: boolean; // Enable HTTP logging (default: true)
  maxFiles?: number; // Max files to keep (default: 30)
  correlationId?: boolean; // Add correlation IDs (default: true)
}
```

### Logging Methods

```typescript
// Available logging methods
logger.info('Information message', { userId: 123 });
logger.warn('Warning message', { deprecated: true });
logger.error('Error message', { error: 'details' });
logger.debug('Debug message', { step: 'validation' });

// Error objects are handled specially
try {
  throw new Error('Something failed');
} catch (error) {
  logger.error(error, { context: 'user-registration' });
}
```

### Static Create Method

```typescript
import { Logger } from '@mono/be-core';

const logger = Logger.create({
  level: 'debug',
  dir: './custom-logs',
  format: 'json',
});
```

### Environment-Specific Configuration

```typescript
import { createLogger } from '@mono/be-core';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  dir: process.env.LOG_DIR || './logs',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
});
```

### Log Files

The logger creates the following log files with daily rotation:

- `combined/YYYY-MM-DD.log` - All log levels
- `error/YYYY-MM-DD.log` - Error logs only

Files are automatically rotated daily and compressed (zipped) for storage efficiency.

### Available Log Levels

- `error` - Error messages
- `warn` - Warning messages
- `info` - Informational messages
- `debug` - Debug messages
- `verbose` - Verbose messages

### Integration with Express

```typescript
import express from 'express';
import { createLogger } from '@mono/be-core';

const app = express();
const logger = createLogger({ serviceName: 'api-server' });

app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.listen(3000, () => {
  logger.info('Server started on port 3000');
});
```

## Validation Integration

The `@mono/be-core` package includes integrated validation and security middleware powered by `@thrilled/be-validation`. This provides automatic protection against common security threats and comprehensive input validation for all applications using BaseApp.

### Automatic Security Features

When you extend `BaseApp`, the following security features are automatically enabled:

- **XSS Protection**: Prevents cross-site scripting attacks
- **SQL Injection Protection**: Blocks SQL injection attempts
- **Request Sanitization**: Cleanses all incoming data (body, query, params)
- **Security Headers**: Sets appropriate security headers (CSP, X-Frame-Options, etc.)
- **Content Security Policy**: Configurable CSP directives

### Basic Usage

```typescript
import { BaseApp } from '@mono/be-core';

// Validation is automatically enabled when extending BaseApp
export class App extends BaseApp {
  constructor() {
    super({
      // Validation configuration is optional - uses secure defaults
      validation: {
        enabled: true, // Default: true
        enableXSSProtection: true,
        enableSQLInjectionProtection: true,
        // ... other options
      }
    });
  }
}

// That's it! Your app now has comprehensive validation and security
const app = new App();
app.start();
```

### Validation Configuration

```typescript
interface ValidationConfig {
  enabled?: boolean; // Enable/disable validation plugin (default: true)
  enableXSSProtection?: boolean; // XSS protection (default: true)
  enableSQLInjectionProtection?: boolean; // SQL injection protection (default: true)
  globalValidation?: {
    enabled: boolean;
    soft: boolean; // Soft validation vs strict validation
    options: object; // Joi/Zod validation options
  };
  globalSanitization?: {
    body?: SanitizationOptions;
    query?: SanitizationOptions;
    params?: SanitizationOptions;
  };
  csp?: {
    enabled: boolean;
    directives: Record<string, string[]>; // CSP directives
  };
  customValidators?: Record<string, ValidatorFunction>;
  errorHandler?: ValidationErrorHandler;
}
```

### Advanced Configuration

```typescript
import { BaseApp } from '@mono/be-core';

export class App extends BaseApp {
  constructor() {
    super({
      validation: {
        // Custom CSP configuration
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
          }
        },
        // Custom sanitization options
        globalSanitization: {
          body: {
            html: { enabled: true, stripTags: true },
            xss: { enabled: true },
            sql: { enabled: true },
          },
          query: {
            html: { enabled: true, stripTags: true },
            xss: { enabled: true },
            sql: { enabled: true },
          }
        },
        // Custom error handling
        errorHandler: (err, req, res, next) => {
          // Custom validation error response
          res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid input detected',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }
}
```

### Accessing Validation Plugin

You can access the validation plugin for advanced usage:

```typescript
import { BaseApp } from '@mono/be-core';

export class App extends BaseApp {
  setupCustomValidation() {
    // Get the validation plugin instance
    const validationPlugin = this.getValidationPlugin();
    
    if (validationPlugin) {
      // Access validation utilities
      const sanitizer = validationPlugin.getSanitizer();
      const xssProtection = validationPlugin.getXSSProtection();
      const validationMiddleware = validationPlugin.getValidationMiddleware();
      
      // Use them in custom middleware or routes
      this.app.use('/api/custom', (req, res, next) => {
        // Custom validation logic
        const cleanData = sanitizer.sanitizeObject(req.body);
        req.body = cleanData;
        next();
      });
    }
  }
}
```

### Route-Level Validation

For endpoint-specific validation beyond the global middleware:

```typescript
// In your controllers or route handlers
app.post('/api/users', (req, res, next) => {
  // Request is already sanitized by global middleware
  // Add additional route-specific validation if needed
  
  const userData = req.body; // Already sanitized and safe
  // Process user creation...
});
```

### Health Checks

The validation system includes health checks that are automatically integrated:

```typescript
// GET /health will include validation system status
// GET /health/detailed provides comprehensive validation health info

// Health check response includes:
{
  "validation": {
    "status": "healthy",
    "checks": {
      "xssProtection": true,
      "sqlProtection": true,
      "globalValidation": true,
      "globalSanitization": true,
      "modulesLoaded": true
    },
    "message": "Validation system is fully operational"
  }
}
```

### Disabling Validation

If you need to disable validation for testing or specific environments:

```typescript
export class App extends BaseApp {
  constructor() {
    super({
      validation: {
        enabled: false // Disables all validation middleware
      }
    });
  }
}
```

### Security Benefits

The integrated validation provides:

1. **Automatic Protection**: Zero-configuration security for common threats
2. **Performance Optimized**: Runs at middleware level with minimal overhead  
3. **Comprehensive Coverage**: Protects all endpoints consistently
4. **Graceful Degradation**: Falls back to basic security headers if validation modules unavailable
5. **Customizable**: Configurable to meet specific application needs

### Migration from Manual Validation

If migrating from manual validation:

```typescript
// Before: Manual validation in each controller
app.post('/api/users', (req, res) => {
  // Manual sanitization
  const cleanEmail = sanitizeEmail(req.body.email);
  const cleanName = sanitizeName(req.body.name);
  // ... validation logic
});

// After: Automatic validation with BaseApp
export class App extends BaseApp {
  // Validation happens automatically at middleware level
  // Controllers receive clean, validated data
}

app.post('/api/users', (req, res) => {
  // req.body is already sanitized and validated
  const { email, name } = req.body;
  // ... business logic only
});

## Development

### Building

```bash
nx build core
```

### Testing

```bash
nx test core
```

### Linting

```bash
nx lint core
```
