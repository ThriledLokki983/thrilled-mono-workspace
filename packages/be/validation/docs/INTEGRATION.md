# Integration Guide - @thrilled/validation

This guide covers how to integrate the validation package with various frameworks and systems.

## Express.js Integration

### Basic Setup

```typescript
import express from 'express';
import {
  ValidationMiddleware,
  XSSProtection,
  SQLInjectionProtection,
  Sanitizer,
} from '@thrilled/validation';
import Joi from 'joi';

const app = express();
app.use(express.json());

// Global security middleware
app.use(
  XSSProtection.middleware({
    enableCSP: true,
    cspDirectives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
    },
  })
);

app.use(SQLInjectionProtection.middleware());

// Your routes here...
```

### Route-Level Validation

```typescript
// User registration
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .required(),
  age: Joi.number().min(18).max(120).optional(),
});

app.post(
  '/api/users/register',
  ValidationMiddleware.body(userSchema),
  async (req, res, next) => {
    try {
      // Sanitize the validated data
      const sanitizer = new Sanitizer({
        html: { enabled: true, stripTags: true },
        xss: { enabled: true },
        sql: { enabled: true },
      });

      const cleanData = sanitizer.sanitizeObject(req.body);

      // Process user registration
      const user = await UserService.create(cleanData);
      res
        .status(201)
        .json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
      next(error);
    }
  }
);

// Search with query validation
const searchSchema = Joi.object({
  q: Joi.string().max(100).required(),
  category: Joi.string().valid('users', 'products', 'orders').optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().valid('name', 'date', 'relevance').default('relevance'),
});

app.get(
  '/api/search',
  ValidationMiddleware.query(searchSchema),
  async (req, res) => {
    const { q, category, page, limit, sort } = req.query;
    const results = await SearchService.search(q, {
      category,
      page,
      limit,
      sort,
    });
    res.json(results);
  }
);
```

### Error Handling

```typescript
// Global error handler for validation errors
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid input data',
        details: err.details || err.errors,
      });
    }

    if (err.name === 'SanitizationError') {
      return res.status(400).json({
        error: 'Security Error',
        message: 'Potentially malicious content detected',
      });
    }

    // Handle other errors
    console.error(err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong',
    });
  }
);
```

## Be-Core Integration

### Plugin Setup

```typescript
import { Core } from '@thrilled/be-core';
import { ValidationPlugin } from '@thrilled/validation';

const core = new Core();

const validationPlugin = new ValidationPlugin({
  globalValidation: {
    enabled: true,
    soft: false,
    options: {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    },
  },
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
    },
    params: {
      html: { enabled: true, stripTags: true },
      xss: { enabled: true },
      sql: { enabled: false }, // Usually not needed for URL params
    },
  },
  customValidators: {
    // Custom business logic validators
    uniqueEmail: async (email: string) => {
      const exists = await UserService.emailExists(email);
      return {
        isValid: !exists,
        errors: exists
          ? [{ field: 'email', message: 'Email already exists' }]
          : [],
      };
    },
    strongPassword: async (password: string) => {
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasDigit = /\d/.test(password);
      const hasSpecial = /[@$!%*?&]/.test(password);
      const isLongEnough = password.length >= 8;

      const errors = [];
      if (!hasLower)
        errors.push({
          field: 'password',
          message: 'Password must contain lowercase letters',
        });
      if (!hasUpper)
        errors.push({
          field: 'password',
          message: 'Password must contain uppercase letters',
        });
      if (!hasDigit)
        errors.push({
          field: 'password',
          message: 'Password must contain digits',
        });
      if (!hasSpecial)
        errors.push({
          field: 'password',
          message: 'Password must contain special characters',
        });
      if (!isLongEnough)
        errors.push({
          field: 'password',
          message: 'Password must be at least 8 characters long',
        });

      return {
        isValid: errors.length === 0,
        errors,
      };
    },
  },
});

core.use(validationPlugin);

// Start the application
core.start();
```

### Using Plugin Features

```typescript
// In your route handlers, the plugin automatically:
// 1. Validates request data according to global settings
// 2. Sanitizes input to prevent XSS and SQL injection
// 3. Provides access to custom validators

// Access custom validators from the plugin
app.post('/api/users', async (req, res) => {
  const { customValidators } = core.getPlugin('validation');

  // Use custom validators
  const emailValidation = await customValidators.uniqueEmail(req.body.email);
  const passwordValidation = await customValidators.strongPassword(
    req.body.password
  );

  if (!emailValidation.isValid || !passwordValidation.isValid) {
    return res.status(400).json({
      errors: [...emailValidation.errors, ...passwordValidation.errors],
    });
  }

  // Continue with user creation...
});
```

## NestJS Integration

### Module Setup

```typescript
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './validation.pipe';
import { SanitizationInterceptor } from './sanitization.interceptor';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizationInterceptor,
    },
  ],
})
export class ValidationModule {}
```

### Custom NestJS Pipe

```typescript
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { JoiValidator } from '@thrilled/validation';
import { Schema } from 'joi';

@Injectable()
export class ValidationPipe implements PipeTransform {
  private validator = new JoiValidator();

  constructor(private schema: Schema) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    const result = await this.validator.validate(value, this.schema);

    if (!result.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.errors,
      });
    }

    return result.data || value;
  }
}
```

### Custom NestJS Interceptor

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Sanitizer } from '@thrilled/validation';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  private sanitizer = new Sanitizer({
    html: { enabled: true, stripTags: true },
    xss: { enabled: true },
    sql: { enabled: true },
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Sanitize request body
    if (request.body) {
      request.body = this.sanitizer.sanitizeObject(request.body);
    }

    // Sanitize query parameters
    if (request.query) {
      request.query = this.sanitizer.sanitizeObject(request.query);
    }

    return next.handle().pipe(
      map((data) => {
        // Optionally sanitize response data
        return data;
      })
    );
  }
}
```

### Controller Usage

```typescript
import { Controller, Post, Body, Get, Query, UsePipes } from '@nestjs/common';
import { ValidationPipe } from './validation.pipe';
import Joi from 'joi';

const createUserSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(18).required(),
});

const searchSchema = Joi.object({
  q: Joi.string().required(),
  page: Joi.number().min(1).default(1),
});

@Controller('users')
export class UsersController {
  @Post()
  @UsePipes(new ValidationPipe(createUserSchema))
  async createUser(@Body() userData: any) {
    // userData is now validated and sanitized
    return await this.userService.create(userData);
  }

  @Get('search')
  @UsePipes(new ValidationPipe(searchSchema))
  async searchUsers(@Query() searchParams: any) {
    return await this.userService.search(searchParams);
  }
}
```

## Database Integration

### Mongoose/MongoDB

```typescript
import mongoose from 'mongoose';
import { CustomValidators } from '@thrilled/validation';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: async function (email: string) {
        const result = await CustomValidators.email(email);
        return result.isValid;
      },
      message: 'Invalid email format',
    },
  },
  phone: {
    type: String,
    validate: {
      validator: async function (phone: string) {
        const result = await CustomValidators.phone(phone);
        return result.isValid;
      },
      message: 'Invalid phone number format',
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: async function (password: string) {
        const result = await CustomValidators.password(password);
        return result.isValid;
      },
      message: 'Password does not meet security requirements',
    },
  },
});

// Pre-save sanitization
userSchema.pre('save', function (next) {
  const sanitizer = new Sanitizer({
    html: { enabled: true, stripTags: true },
    xss: { enabled: true },
  });

  if (this.name) {
    this.name = sanitizer.sanitize(this.name);
  }

  next();
});
```

### TypeORM/PostgreSQL

```typescript
import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { CustomValidators, Sanitizer } from '@thrilled/validation';

@Entity()
export class User {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  private sanitizer = new Sanitizer({
    html: { enabled: true, stripTags: true },
    xss: { enabled: true },
  });

  @BeforeInsert()
  @BeforeUpdate()
  async validateAndSanitize() {
    // Validate email
    const emailResult = await CustomValidators.email(this.email);
    if (!emailResult.isValid) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordResult = await CustomValidators.password(this.password);
    if (!passwordResult.isValid) {
      throw new Error('Password does not meet security requirements');
    }

    // Sanitize name
    this.name = this.sanitizer.sanitize(this.name);
  }
}
```

## Testing Integration

### Jest Setup

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/test/**/*'],
};

// src/test/setup.ts
import { JoiValidator, ZodValidator, Sanitizer } from '@thrilled/validation';

// Global test utilities
global.createJoiValidator = () => new JoiValidator();
global.createZodValidator = () => new ZodValidator();
global.createSanitizer = (config?: any) => new Sanitizer(config);
```

### Integration Test Examples

```typescript
import request from 'supertest';
import { app } from '../app';

describe('API Integration Tests', () => {
  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.message).toBe('User created successfully');
    });

    it('should reject invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 25,
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('email'),
        })
      );
    });

    it('should sanitize malicious input', async () => {
      const userData = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        age: 25,
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      // Verify XSS was stripped
      const user = await UserService.findById(response.body.userId);
      expect(user.name).toBe('John Doe');
      expect(user.name).not.toContain('<script>');
    });

    it('should detect SQL injection attempts', async () => {
      const userData = {
        name: "'; DROP TABLE users; --",
        email: 'john@example.com',
        age: 25,
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Security Error');
    });
  });

  describe('GET /api/search', () => {
    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ q: 'test', page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('results');
    });

    it('should reject invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/search')
        .query({ page: -1, limit: 1000 })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
```

## Performance Considerations

### Caching Validators

```typescript
import { LRUCache } from 'lru-cache';
import { JoiValidator } from '@thrilled/validation';

class CachedValidator {
  private validator = new JoiValidator();
  private cache = new LRUCache<string, any>({ max: 1000, ttl: 1000 * 60 * 5 }); // 5 minutes

  async validate(data: any, schema: any, cacheKey?: string) {
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const result = await this.validator.validate(data, schema);

    if (cacheKey && result.isValid) {
      this.cache.set(cacheKey, result);
    }

    return result;
  }
}
```

### Batch Processing

```typescript
import { JoiValidator } from '@thrilled/validation';

class BatchValidator {
  private validator = new JoiValidator();

  async validateBatch(items: Array<{ data: any; schema: any; id: string }>) {
    const results = await this.validator.validateBatch(
      items.map((item) => ({ data: item.data, schema: item.schema }))
    );

    return items.map((item, index) => ({
      id: item.id,
      ...results[index],
    }));
  }

  async processLargeDataset(dataset: any[], schema: any, batchSize = 100) {
    const results = [];

    for (let i = 0; i < dataset.length; i += batchSize) {
      const batch = dataset.slice(i, i + batchSize);
      const batchItems = batch.map((data, index) => ({
        data,
        schema,
        id: `${i + index}`,
      }));

      const batchResults = await this.validateBatch(batchItems);
      results.push(...batchResults);
    }

    return results;
  }
}
```

## Security Best Practices

### Content Security Policy

```typescript
import { XSSProtection } from '@thrilled/validation';

// Strict CSP for production
const productionCSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

app.use(
  XSSProtection.middleware({
    enableCSP: true,
    cspDirectives:
      process.env.NODE_ENV === 'production'
        ? productionCSP
        : {
            'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          },
  })
);
```

### Rate Limiting with Validation

```typescript
import rateLimit from 'express-rate-limit';
import { ValidationMiddleware } from '@thrilled/validation';

const createAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many accounts created from this IP, please try again later.',
});

app.post(
  '/api/users/register',
  createAccountLimiter,
  ValidationMiddleware.body(userRegistrationSchema),
  async (req, res) => {
    // Handle registration
  }
);
```

This integration guide provides comprehensive examples for integrating the validation package with various frameworks and systems while maintaining security and performance best practices.
