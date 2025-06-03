import { Logger, createLogger, defaultLogger } from '../logging/Logger';

// Example 1: Using the default logger
console.log('=== Example 1: Default Logger ===');
defaultLogger.info('Application starting up');
defaultLogger.warn('This is a warning message');
defaultLogger.error('This is an error message');

// Example 2: Creating a custom logger for a service
console.log('\n=== Example 2: Custom Service Logger ===');
const apiLogger = createLogger({
  level: 'debug',
  dir: './logs/api',
  format: 'json',
  maxFiles: 7
});

apiLogger.info('API server starting', { port: 3000, env: 'development' });
apiLogger.debug('Database connection established', { host: 'localhost', db: 'myapp' });

// Example 3: Error logging with Error objects
console.log('\n=== Example 3: Error Handling ===');
const authLogger = createLogger({
  level: 'info',
  dir: './logs/auth',
  format: 'simple'
});

try {
  // Simulate an error
  throw new Error('Invalid credentials');
} catch (error) {
  authLogger.error(error as Error, { 
    userId: 123, 
    action: 'login_attempt',
    ip: '192.168.1.1' 
  });
}

// Example 4: Different log levels
console.log('\n=== Example 4: Log Levels ===');
const appLogger = Logger.create({
  level: 'debug',
  dir: './logs/app',
  correlationId: true
});

appLogger.error('Critical error occurred');
appLogger.warn('Memory usage is high', { memoryUsage: '85%' });
appLogger.info('User registered successfully', { userId: 456, email: 'user@example.com' });
appLogger.debug('Processing request', { requestId: 'req-789', step: 'validation' });

// Example 5: Disabling correlation IDs
console.log('\n=== Example 5: Without Correlation IDs ===');
const simpleLogger = createLogger({
  level: 'info',
  dir: './logs/simple',
  correlationId: false
});

simpleLogger.info('Simple log message without correlation ID');

console.log('\nLogger examples completed. Check the ./logs directories for generated log files.');
