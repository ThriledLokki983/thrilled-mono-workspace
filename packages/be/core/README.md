# @mono/be-core

A shared backend core library providing common utilities for backend applications in the monorepo.

## Features

- **Logger**: A comprehensive logging utility built on Winston with daily file rotation
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
