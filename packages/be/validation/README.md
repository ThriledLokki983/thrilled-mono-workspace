# @thrilled/validation

A comprehensive validation and sanitization package for Node.js applications, providing robust schema validation, input sanitization, and security protection features.

## Features

- 🔍 **Schema Validation**: Support for Joi and Zod validation libraries
- 🛡️ **Security Protection**: XSS and SQL injection prevention
- 🧹 **Input Sanitization**: Comprehensive data cleaning and normalization
- 🚀 **Express Integration**: Ready-to-use middleware for Express applications
- 🔧 **Custom Validators**: Extensible validation system with built-in validators
- 📦 **Plugin System**: Seamless integration with be-core framework

## Installation

```bash
yarn add @thrilled/validation
```

## Quick Start

### Basic Validation with Joi

```typescript
import { JoiValidator } from '@thrilled/validation';
import Joi from 'joi';

const validator = new JoiValidator();
const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().min(18).required()
});

const result = await validator.validate({ email: 'user@example.com', age: 25 }, schema);
if (result.isValid) {
  console.log('Validation passed!');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Basic Validation with Zod

```typescript
import { ZodValidator } from '@thrilled/validation';
import { z } from 'zod';

const validator = new ZodValidator();
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const result = await validator.validate({ email: 'user@example.com', age: 25 }, schema);
if (result.isValid) {
  console.log('Validation passed!');
} else {
  console.error('Validation errors:', result.errors);
}
```

### Express Middleware

```typescript
import express from 'express';
import { ValidationMiddleware } from '@thrilled/validation';
import Joi from 'joi';

const app = express();
app.use(express.json());

const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(18).required()
});

app.post('/users', 
  ValidationMiddleware.body(userSchema),
  (req, res) => {
    // Request body is now validated
    res.json({ message: 'User created successfully' });
  }
);
```

### Input Sanitization

```typescript
import { Sanitizer } from '@thrilled/validation';

const sanitizer = new Sanitizer({
  html: { enabled: true, allowedTags: ['p', 'br'] },
  xss: { enabled: true },
  sql: { enabled: true }
});

const userInput = '<script>alert("xss")</script><p>Hello World</p>';
const sanitized = sanitizer.sanitize(userInput);
console.log(sanitized); // Output: <p>Hello World</p>
```

## API Reference

### Validators

#### JoiValidator

A validator implementation using the Joi schema validation library.

```typescript
import { JoiValidator } from '@thrilled/validation';
import Joi from 'joi';

const validator = new JoiValidator();

// Single validation
const result = await validator.validate(data, schema);

// Batch validation
const results = await validator.validateBatch([
  { data: data1, schema: schema1 },
  { data: data2, schema: schema2 }
]);

// Conditional validation
const conditionalResult = await validator.conditionalValidate(
  data,
  schema,
  (data) => data.type === 'premium'
);
```

#### ZodValidator

A validator implementation using the Zod schema validation library.

```typescript
import { ZodValidator } from '@thrilled/validation';
import { z } from 'zod';

const validator = new ZodValidator();

// Basic validation
const schema = z.object({
  name: z.string(),
  age: z.number()
});

const result = await validator.validate(data, schema);

// With transforms
const transformSchema = z.object({
  name: z.string().transform(name => name.trim()),
  age: z.string().transform(age => parseInt(age))
});
```

#### CustomValidators

Built-in custom validators for common use cases.

```typescript
import { CustomValidators } from '@thrilled/validation';

// Email validation
const emailResult = await CustomValidators.email('user@example.com');

// Phone validation
const phoneResult = await CustomValidators.phone('+1234567890');

// Password strength validation
const passwordResult = await CustomValidators.password('SecurePass123!');

// URL validation
const urlResult = await CustomValidators.url('https://example.com');

// UUID validation
const uuidResult = await CustomValidators.uuid('123e4567-e89b-12d3-a456-426614174000');

// Credit card validation
const cardResult = await CustomValidators.creditCard('4111111111111111');

// Date validation
const dateResult = await CustomValidators.date('2023-12-25');

// IP address validation
const ipResult = await CustomValidators.ip('192.168.1.1');

// JSON validation
const jsonResult = await CustomValidators.json('{"key": "value"}');

// Slug validation
const slugResult = await CustomValidators.slug('my-blog-post');

// Hex color validation
const colorResult = await CustomValidators.hexColor('#FF5733');

// Domain validation
const domainResult = await CustomValidators.domain('example.com');

// File validation
const fileResult = await CustomValidators.file(buffer, {
  allowedTypes: ['image/jpeg', 'image/png'],
  maxSize: 1024 * 1024 // 1MB
});

// Range validation
const rangeResult = await CustomValidators.range(25, { min: 18, max: 65 });

// Length validation
const lengthResult = await CustomValidators.length('hello', { min: 3, max: 10 });

// Pattern validation
const patternResult = await CustomValidators.pattern('ABC123', /^[A-Z]{3}\d{3}$/);

// Enum validation
const enumResult = await CustomValidators.enum('active', ['active', 'inactive', 'pending']);
```

### Middleware

#### ValidationMiddleware

Express middleware for request validation.

```typescript
import { ValidationMiddleware } from '@thrilled/validation';
import Joi from 'joi';

const schema = Joi.object({
  name: Joi.string().required()
});

// Validate request body
app.post('/api/users', ValidationMiddleware.body(schema), handler);

// Validate query parameters
app.get('/api/users', ValidationMiddleware.query(schema), handler);

// Validate URL parameters
app.get('/api/users/:id', ValidationMiddleware.params(schema), handler);

// Validate headers
app.post('/api/data', ValidationMiddleware.headers(schema), handler);

// Soft validation (warnings instead of errors)
app.post('/api/users', ValidationMiddleware.body(schema, { soft: true }), handler);
```

### Sanitization

#### Sanitizer

Comprehensive input sanitization with configurable options.

```typescript
import { Sanitizer } from '@thrilled/validation';

const sanitizer = new Sanitizer({
  html: {
    enabled: true,
    allowedTags: ['p', 'br', 'strong', 'em'],
    allowedAttributes: { a: ['href'] }
  },
  xss: {
    enabled: true,
    stripTags: true
  },
  sql: {
    enabled: true,
    escapeQuotes: true
  }
});

// Sanitize single value
const clean = sanitizer.sanitize(userInput);

// Sanitize object
const cleanObject = sanitizer.sanitizeObject({
  title: '<script>alert("xss")</script>Safe Title',
  content: 'SELECT * FROM users; DROP TABLE users;'
});

// Sanitize array
const cleanArray = sanitizer.sanitizeArray([
  '<p>Good content</p>',
  '<script>Bad content</script>'
]);
```

#### XSSProtection

Specialized XSS protection utilities.

```typescript
import { XSSProtection } from '@thrilled/validation';

// Detect XSS patterns
const hasXSS = XSSProtection.detectXSS('<script>alert("xss")</script>');

// Clean content
const clean = XSSProtection.cleanContent('<script>alert("xss")</script>Hello');

// Generate CSP headers
const cspHeaders = XSSProtection.generateCSPHeaders({
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"]
});

// Express middleware
app.use(XSSProtection.middleware({
  enableCSP: true,
  cspDirectives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"]
  }
}));
```

#### SQLInjectionProtection

SQL injection detection and prevention.

```typescript
import { SQLInjectionProtection } from '@thrilled/validation';

// Detect SQL injection patterns
const hasSQLInjection = SQLInjectionProtection.detectSQLInjection(
  "'; DROP TABLE users; --"
);

// Sanitize query
const clean = SQLInjectionProtection.sanitizeQuery(
  "SELECT * FROM users WHERE name = 'John'; DROP TABLE users;"
);

// Create safe query with parameters
const safeQuery = SQLInjectionProtection.createSafeQuery(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// Express middleware
app.use(SQLInjectionProtection.middleware());
```

### Plugin Integration

#### ValidationPlugin

Integration with the be-core plugin system.

```typescript
import { ValidationPlugin } from '@thrilled/validation';
import { Core } from '@thrilled/be-core';

const core = new Core();

const validationPlugin = new ValidationPlugin({
  globalValidation: {
    enabled: true,
    soft: false
  },
  globalSanitization: {
    body: { enabled: true },
    query: { enabled: true },
    params: { enabled: false }
  },
  customValidators: {
    strongPassword: async (value: string) => {
      // Custom validation logic
      return { isValid: true, errors: [] };
    }
  }
});

core.use(validationPlugin);
```

## Configuration

### Validation Options

```typescript
interface ValidationOptions {
  abortEarly?: boolean;        // Stop on first error
  allowUnknown?: boolean;      // Allow unknown properties
  stripUnknown?: boolean;      // Remove unknown properties
  convert?: boolean;           // Attempt type conversion
  dateFormat?: string;         // Date format for parsing
  presence?: 'optional' | 'required';
  context?: Record<string, any>;
}
```

### Sanitization Configuration

```typescript
interface SanitizationConfig {
  html?: {
    enabled: boolean;
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    stripTags?: boolean;
  };
  xss?: {
    enabled: boolean;
    stripTags?: boolean;
    encodeEntities?: boolean;
  };
  sql?: {
    enabled: boolean;
    escapeQuotes?: boolean;
    removeComments?: boolean;
  };
}
```

### Plugin Configuration

```typescript
interface ValidationPluginConfig {
  globalValidation?: {
    enabled: boolean;
    soft?: boolean;
    options?: ValidationOptions;
  };
  globalSanitization?: {
    body?: SanitizationConfig;
    query?: SanitizationConfig;
    params?: SanitizationConfig;
  };
  customValidators?: Record<string, ValidatorFunction>;
}
```

## Error Handling

### ValidationError

```typescript
interface ValidationError {
  field: string;
  message: string;
  value?: any;
  type?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  data?: any;
}
```

### Custom Error Messages

```typescript
// Joi custom messages
const schema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Zod custom messages
const schema = z.object({
  email: z.string().email('Please provide a valid email address')
});
```

## Best Practices

1. **Always validate user input** at the application boundary
2. **Sanitize data** before processing or storing
3. **Use appropriate schemas** for different validation scenarios
4. **Handle validation errors** gracefully with meaningful messages
5. **Apply the principle of least privilege** when configuring sanitization
6. **Combine validation and sanitization** for comprehensive security
7. **Test edge cases** including malicious input patterns
8. **Use soft validation** for non-critical validations to improve UX

## Examples

### Complete Express Application

```typescript
import express from 'express';
import { 
  ValidationMiddleware, 
  Sanitizer, 
  XSSProtection, 
  SQLInjectionProtection 
} from '@thrilled/validation';
import Joi from 'joi';

const app = express();
app.use(express.json());

// Global security middleware
app.use(XSSProtection.middleware({ enableCSP: true }));
app.use(SQLInjectionProtection.middleware());

// User registration endpoint
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  age: Joi.number().min(18).max(120)
});

app.post('/register', 
  ValidationMiddleware.body(registerSchema),
  async (req, res) => {
    const sanitizer = new Sanitizer({
      html: { enabled: true, stripTags: true },
      xss: { enabled: true },
      sql: { enabled: true }
    });

    const cleanData = sanitizer.sanitizeObject(req.body);
    
    // Process registration...
    res.json({ message: 'User registered successfully' });
  }
);

// Search endpoint with query validation
const searchSchema = Joi.object({
  q: Joi.string().max(100).required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
});

app.get('/search',
  ValidationMiddleware.query(searchSchema),
  (req, res) => {
    // Search logic...
    res.json({ results: [] });
  }
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Building

Run `nx build validation` to build the library.

## Running unit tests

Run `nx test validation` to execute the unit tests via [Jest](https://jestjs.io).

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test --coverage

# Run specific test file
yarn test BaseValidator.test.ts
```

## Contributing

Please read our contributing guidelines and ensure all tests pass before submitting a pull request.

## License

MIT License - see LICENSE file for details.
