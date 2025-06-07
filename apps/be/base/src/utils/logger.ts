import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Logger as CoreLogger } from '@mono/be-core';
import { LOG_DIR } from '../config';

// logs dir - provide fallback if LOG_DIR is undefined
const logDir: string = join(__dirname, LOG_DIR || 'logs');

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

// Create logger instance with custom configuration
const logger = new CoreLogger({
  dir: logDir,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'simple', // Use simple format to match existing behavior
  maxFiles: 30,
  correlationId: false, // Disable correlation ID for now to match existing behavior
});

/**
 * Safely redacts sensitive fields from objects for logging purposes
 * @param data The object that may contain sensitive information
 * @param sensitiveFields Array of sensitive field names to redact
 * @returns A copy of the object with sensitive fields redacted
 */
export const redactSensitiveData = (data: any, sensitiveFields: string[] = ['password', 'token', 'secret', 'credit_card', 'ssn']): any => {
  if (!data) return data;

  // Handle primitive values
  if (typeof data !== 'object') return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, sensitiveFields));
  }

  // Handle objects
  const redactedData = { ...data };

  for (const key in redactedData) {
    if (Object.prototype.hasOwnProperty.call(redactedData, key)) {
      // Check if this key should be redacted
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redactedData[key] = '[REDACTED]';
      } else if (typeof redactedData[key] === 'object' && redactedData[key] !== null) {
        // Recursively redact nested objects
        redactedData[key] = redactSensitiveData(redactedData[key], sensitiveFields);
      }
    }
  }

  return redactedData;
};

/**
 * Safely logs information about a user, redacting sensitive data
 * @param level The log level to use
 * @param message The message to log
 * @param userData User data to be logged (will be redacted)
 */
export const logUserData = (level: 'debug' | 'info' | 'warn' | 'error', message: string, userData: any): void => {
  const redactedData = redactSensitiveData(userData);
  logger[level](`${message}: ${JSON.stringify(redactedData)}`);
};

// Create a stream for Morgan HTTP logging middleware
const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { logger, stream };
