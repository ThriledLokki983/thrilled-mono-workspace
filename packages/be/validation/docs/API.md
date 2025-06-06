# API Reference - @thrilled/validation

Complete API documentation for all classes, interfaces, and utilities in the validation package.

## Table of Contents

- [Types](#types)
- [Validators](#validators)
- [Middleware](#middleware)
- [Sanitization](#sanitization)
- [Utilities](#utilities)
- [Plugin](#plugin)

## Types

### ValidationError

```typescript
interface ValidationError {
  field: string; // The field that failed validation
  message: string; // Human-readable error message
  value?: any; // The value that failed validation
  type?: string; // The type of validation error
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean; // Whether validation passed
  errors: ValidationError[]; // Array of validation errors
  warnings?: ValidationError[]; // Optional warnings (for soft validation)
  data?: any; // Validated/transformed data
}
```

### ValidationOptions

```typescript
interface ValidationOptions {
  abortEarly?: boolean; // Stop validation on first error (default: false)
  allowUnknown?: boolean; // Allow unknown properties (default: false)
  stripUnknown?: boolean; // Remove unknown properties (default: false)
  convert?: boolean; // Attempt type conversion (default: true)
  dateFormat?: string; // Date format for parsing
  presence?: 'optional' | 'required'; // Default presence requirement
  context?: Record<string, any>; // Additional context for validation
}
```

### SanitizationConfig

```typescript
interface SanitizationConfig {
  html?: {
    enabled: boolean; // Enable HTML sanitization
    allowedTags?: string[]; // Allowed HTML tags
    allowedAttributes?: Record<string, string[]>; // Allowed attributes per tag
    stripTags?: boolean; // Strip all HTML tags
  };
  xss?: {
    enabled: boolean; // Enable XSS protection
    stripTags?: boolean; // Strip potentially dangerous tags
    encodeEntities?: boolean; // Encode HTML entities
  };
  sql?: {
    enabled: boolean; // Enable SQL injection protection
    escapeQuotes?: boolean; // Escape SQL quotes
    removeComments?: boolean; // Remove SQL comments
  };
}
```

### ValidatorFunction

```typescript
type ValidatorFunction = (
  value: any,
  options?: any
) => Promise<ValidationResult>;
```

## Validators

### BaseValidator

Abstract base class for all validators.

#### Constructor

```typescript
constructor();
```

#### Methods

##### validate

```typescript
abstract validate(data: any, schema: any, options?: ValidationOptions): Promise<ValidationResult>
```

Validates data against a schema.

**Parameters:**

- `data: any` - The data to validate
- `schema: any` - The validation schema
- `options?: ValidationOptions` - Validation options

**Returns:** `Promise<ValidationResult>`

##### validateBatch

```typescript
async validateBatch(
  items: Array<{ data: any; schema: any; options?: ValidationOptions }>
): Promise<ValidationResult[]>
```

Validates multiple items in batch.

**Parameters:**

- `items: Array<{data, schema, options}>` - Array of validation items

**Returns:** `Promise<ValidationResult[]>`

##### conditionalValidate

```typescript
async conditionalValidate(
  data: any,
  schema: any,
  condition: (data: any) => boolean,
  options?: ValidationOptions
): Promise<ValidationResult>
```

Conditionally validates data based on a predicate.

**Parameters:**

- `data: any` - The data to validate
- `schema: any` - The validation schema
- `condition: (data: any) => boolean` - Condition function
- `options?: ValidationOptions` - Validation options

**Returns:** `Promise<ValidationResult>`

### JoiValidator

Joi-based validator implementation.

#### Constructor

```typescript
constructor();
```

#### Methods

##### validate

```typescript
async validate(data: any, schema: Joi.Schema, options?: ValidationOptions): Promise<ValidationResult>
```

Validates data using Joi schema.

**Parameters:**

- `data: any` - Data to validate
- `schema: Joi.Schema` - Joi validation schema
- `options?: ValidationOptions` - Validation options

**Returns:** `Promise<ValidationResult>`

**Example:**

```typescript
import { JoiValidator } from '@thrilled/validation';
import Joi from 'joi';

const validator = new JoiValidator();
const schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(0),
});

const result = await validator.validate({ name: 'John', age: 25 }, schema);
```

### ZodValidator

Zod-based validator implementation.

#### Constructor

```typescript
constructor();
```

#### Methods

##### validate

```typescript
async validate(data: any, schema: z.ZodSchema, options?: ValidationOptions): Promise<ValidationResult>
```

Validates data using Zod schema.

**Parameters:**

- `data: any` - Data to validate
- `schema: z.ZodSchema` - Zod validation schema
- `options?: ValidationOptions` - Validation options

**Returns:** `Promise<ValidationResult>`

**Example:**

```typescript
import { ZodValidator } from '@thrilled/validation';
import { z } from 'zod';

const validator = new ZodValidator();
const schema = z.object({
  name: z.string(),
  age: z.number().nonnegative(),
});

const result = await validator.validate({ name: 'John', age: 25 }, schema);
```

### CustomValidators

Static utility class with built-in validators.

#### Methods

##### email

```typescript
static async email(value: string): Promise<ValidationResult>
```

Validates email addresses using RFC 5322 specification.

**Parameters:**

- `value: string` - Email address to validate

**Returns:** `Promise<ValidationResult>`

##### phone

```typescript
static async phone(value: string, format?: 'international' | 'national'): Promise<ValidationResult>
```

Validates phone numbers.

**Parameters:**

- `value: string` - Phone number to validate
- `format?: 'international' | 'national'` - Expected phone format

**Returns:** `Promise<ValidationResult>`

##### password

```typescript
static async password(value: string, options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}): Promise<ValidationResult>
```

Validates password strength.

**Parameters:**

- `value: string` - Password to validate
- `options?` - Password requirements

**Returns:** `Promise<ValidationResult>`

##### url

```typescript
static async url(value: string, options?: {
  requireProtocol?: boolean;
  allowedProtocols?: string[];
}): Promise<ValidationResult>
```

Validates URLs.

**Parameters:**

- `value: string` - URL to validate
- `options?` - URL validation options

**Returns:** `Promise<ValidationResult>`

##### uuid

```typescript
static async uuid(value: string, version?: number): Promise<ValidationResult>
```

Validates UUID format.

**Parameters:**

- `value: string` - UUID to validate
- `version?: number` - UUID version (1-5)

**Returns:** `Promise<ValidationResult>`

##### creditCard

```typescript
static async creditCard(value: string): Promise<ValidationResult>
```

Validates credit card numbers using Luhn algorithm.

**Parameters:**

- `value: string` - Credit card number to validate

**Returns:** `Promise<ValidationResult>`

##### date

```typescript
static async date(value: string, format?: string): Promise<ValidationResult>
```

Validates date strings.

**Parameters:**

- `value: string` - Date string to validate
- `format?: string` - Expected date format

**Returns:** `Promise<ValidationResult>`

##### ip

```typescript
static async ip(value: string, version?: 4 | 6): Promise<ValidationResult>
```

Validates IP addresses.

**Parameters:**

- `value: string` - IP address to validate
- `version?: 4 | 6` - IP version

**Returns:** `Promise<ValidationResult>`

##### json

```typescript
static async json(value: string): Promise<ValidationResult>
```

Validates JSON strings.

**Parameters:**

- `value: string` - JSON string to validate

**Returns:** `Promise<ValidationResult>`

##### slug

```typescript
static async slug(value: string): Promise<ValidationResult>
```

Validates URL slugs.

**Parameters:**

- `value: string` - Slug to validate

**Returns:** `Promise<ValidationResult>`

##### hexColor

```typescript
static async hexColor(value: string): Promise<ValidationResult>
```

Validates hexadecimal color codes.

**Parameters:**

- `value: string` - Color code to validate

**Returns:** `Promise<ValidationResult>`

##### domain

```typescript
static async domain(value: string): Promise<ValidationResult>
```

Validates domain names.

**Parameters:**

- `value: string` - Domain name to validate

**Returns:** `Promise<ValidationResult>`

##### file

```typescript
static async file(buffer: Buffer, options: {
  allowedTypes?: string[];
  maxSize?: number;
  minSize?: number;
}): Promise<ValidationResult>
```

Validates file buffers.

**Parameters:**

- `buffer: Buffer` - File buffer to validate
- `options` - File validation options

**Returns:** `Promise<ValidationResult>`

##### range

```typescript
static async range(value: number, options: {
  min?: number;
  max?: number;
}): Promise<ValidationResult>
```

Validates numeric ranges.

**Parameters:**

- `value: number` - Number to validate
- `options` - Range constraints

**Returns:** `Promise<ValidationResult>`

##### length

```typescript
static async length(value: string | any[], options: {
  min?: number;
  max?: number;
  exact?: number;
}): Promise<ValidationResult>
```

Validates string/array length.

**Parameters:**

- `value: string | any[]` - Value to validate
- `options` - Length constraints

**Returns:** `Promise<ValidationResult>`

##### pattern

```typescript
static async pattern(value: string, regex: RegExp): Promise<ValidationResult>
```

Validates against regular expression patterns.

**Parameters:**

- `value: string` - String to validate
- `regex: RegExp` - Regular expression pattern

**Returns:** `Promise<ValidationResult>`

##### enum

```typescript
static async enum(value: any, allowedValues: any[]): Promise<ValidationResult>
```

Validates enumerated values.

**Parameters:**

- `value: any` - Value to validate
- `allowedValues: any[]` - Array of allowed values

**Returns:** `Promise<ValidationResult>`

## Middleware

### ValidationMiddleware

Express middleware for request validation.

#### Static Methods

##### body

```typescript
static body(schema: any, options?: ValidationOptions & { soft?: boolean }): RequestHandler
```

Creates middleware to validate request body.

**Parameters:**

- `schema: any` - Validation schema
- `options?` - Validation options with optional soft validation

**Returns:** `RequestHandler`

**Example:**

```typescript
import { ValidationMiddleware } from '@thrilled/validation';
import Joi from 'joi';

const schema = Joi.object({
  name: Joi.string().required(),
});

app.post('/users', ValidationMiddleware.body(schema), (req, res) => {
  // req.body is validated
});
```

##### query

```typescript
static query(schema: any, options?: ValidationOptions & { soft?: boolean }): RequestHandler
```

Creates middleware to validate query parameters.

##### params

```typescript
static params(schema: any, options?: ValidationOptions & { soft?: boolean }): RequestHandler
```

Creates middleware to validate URL parameters.

##### headers

```typescript
static headers(schema: any, options?: ValidationOptions & { soft?: boolean }): RequestHandler
```

Creates middleware to validate request headers.

## Sanitization

### Sanitizer

Main sanitization utility class.

#### Constructor

```typescript
constructor(config: SanitizationConfig)
```

**Parameters:**

- `config: SanitizationConfig` - Sanitization configuration

#### Methods

##### sanitize

```typescript
sanitize(input: string): string
```

Sanitizes a single string value.

**Parameters:**

- `input: string` - String to sanitize

**Returns:** `string` - Sanitized string

##### sanitizeObject

```typescript
sanitizeObject(obj: Record<string, any>): Record<string, any>
```

Recursively sanitizes object properties.

**Parameters:**

- `obj: Record<string, any>` - Object to sanitize

**Returns:** `Record<string, any>` - Sanitized object

##### sanitizeArray

```typescript
sanitizeArray(arr: any[]): any[]
```

Sanitizes array elements.

**Parameters:**

- `arr: any[]` - Array to sanitize

**Returns:** `any[]` - Sanitized array

**Example:**

```typescript
import { Sanitizer } from '@thrilled/validation';

const sanitizer = new Sanitizer({
  html: { enabled: true, stripTags: true },
  xss: { enabled: true },
  sql: { enabled: true },
});

const clean = sanitizer.sanitize('<script>alert("xss")</script>Hello');
// Result: "Hello"
```

### XSSProtection

XSS protection utilities.

#### Static Methods

##### detectXSS

```typescript
static detectXSS(input: string): boolean
```

Detects potential XSS patterns in input.

**Parameters:**

- `input: string` - String to check

**Returns:** `boolean` - True if XSS patterns detected

##### cleanContent

```typescript
static cleanContent(input: string, options?: {
  stripTags?: boolean;
  encodeEntities?: boolean;
}): string
```

Cleans potentially malicious content.

**Parameters:**

- `input: string` - Content to clean
- `options?` - Cleaning options

**Returns:** `string` - Cleaned content

##### generateCSPHeaders

```typescript
static generateCSPHeaders(directives: Record<string, string[]>): Record<string, string>
```

Generates Content Security Policy headers.

**Parameters:**

- `directives: Record<string, string[]>` - CSP directives

**Returns:** `Record<string, string>` - HTTP headers

##### middleware

```typescript
static middleware(options?: {
  enableCSP?: boolean;
  cspDirectives?: Record<string, string[]>;
}): RequestHandler
```

Creates Express middleware for XSS protection.

**Parameters:**

- `options?` - Middleware options

**Returns:** `RequestHandler`

**Example:**

```typescript
import { XSSProtection } from '@thrilled/validation';

app.use(
  XSSProtection.middleware({
    enableCSP: true,
    cspDirectives: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
    },
  })
);
```

### SQLInjectionProtection

SQL injection protection utilities.

#### Static Methods

##### detectSQLInjection

```typescript
static detectSQLInjection(input: string): boolean
```

Detects potential SQL injection patterns.

**Parameters:**

- `input: string` - String to check

**Returns:** `boolean` - True if SQL injection patterns detected

##### sanitizeQuery

```typescript
static sanitizeQuery(input: string): string
```

Sanitizes potentially malicious SQL content.

**Parameters:**

- `input: string` - Query string to sanitize

**Returns:** `string` - Sanitized query

##### createSafeQuery

```typescript
static createSafeQuery(template: string, parameters: any[]): { query: string; params: any[] }
```

Creates parameterized queries safely.

**Parameters:**

- `template: string` - Query template with placeholders
- `parameters: any[]` - Query parameters

**Returns:** `{ query: string; params: any[] }` - Safe query object

##### middleware

```typescript
static middleware(): RequestHandler
```

Creates Express middleware for SQL injection protection.

**Returns:** `RequestHandler`

**Example:**

```typescript
import { SQLInjectionProtection } from '@thrilled/validation';

app.use(SQLInjectionProtection.middleware());

const safeQuery = SQLInjectionProtection.createSafeQuery(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

## Utilities

### ValidationUtils

Utility functions for validation operations.

#### Static Methods

##### combineResults

```typescript
static combineResults(results: ValidationResult[]): ValidationResult
```

Combines multiple validation results into one.

**Parameters:**

- `results: ValidationResult[]` - Array of validation results

**Returns:** `ValidationResult` - Combined result

##### formatError

```typescript
static formatError(error: ValidationError): string
```

Formats a validation error into a human-readable string.

**Parameters:**

- `error: ValidationError` - Error to format

**Returns:** `string` - Formatted error message

##### createCustomError

```typescript
static createCustomError(field: string, message: string, value?: any, type?: string): ValidationError
```

Creates a custom validation error.

**Parameters:**

- `field: string` - Field name
- `message: string` - Error message
- `value?: any` - Invalid value
- `type?: string` - Error type

**Returns:** `ValidationError`

**Example:**

```typescript
import { ValidationUtils } from '@thrilled/validation';

const results = [result1, result2, result3];
const combined = ValidationUtils.combineResults(results);

const customError = ValidationUtils.createCustomError(
  'email',
  'Email already exists',
  'user@example.com',
  'uniqueness'
);
```

## Plugin

### ValidationPlugin

Plugin for be-core integration.

#### Constructor

```typescript
constructor(config: ValidationPluginConfig)
```

**Parameters:**

- `config: ValidationPluginConfig` - Plugin configuration

#### Interface

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

#### Methods

##### getName

```typescript
getName(): string
```

Returns the plugin name.

**Returns:** `string` - Plugin name ("validation")

##### initialize

```typescript
async initialize(core: any): Promise<void>
```

Initializes the plugin with the core instance.

**Parameters:**

- `core: any` - Core framework instance

##### getMiddleware

```typescript
getMiddleware(): RequestHandler[]
```

Returns array of middleware functions to be applied globally.

**Returns:** `RequestHandler[]`

**Example:**

```typescript
import { ValidationPlugin } from '@thrilled/validation';
import { Core } from '@thrilled/be-core';

const plugin = new ValidationPlugin({
  globalValidation: {
    enabled: true,
    soft: false,
  },
  globalSanitization: {
    body: { html: { enabled: true }, xss: { enabled: true } },
  },
  customValidators: {
    customEmail: async (email) => {
      // Custom validation logic
      return { isValid: true, errors: [] };
    },
  },
});

const core = new Core();
core.use(plugin);
```

## Error Types

### ValidationError

Thrown when validation fails in strict mode.

```typescript
class ValidationError extends Error {
  constructor(public errors: ValidationError[], message?: string);
}
```

### SanitizationError

Thrown when dangerous content is detected.

```typescript
class SanitizationError extends Error {
  constructor(public input: string, message?: string);
}
```

## Constants

### Default Configurations

```typescript
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: false,
  convert: true,
};

export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  html: { enabled: true, stripTags: false },
  xss: { enabled: true, stripTags: true },
  sql: { enabled: true, escapeQuotes: true },
};
```

### Regular Expressions

```typescript
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  IP_V4:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IP_V6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
};
```

This API reference provides complete documentation for all public interfaces, classes, and methods in the validation package.
