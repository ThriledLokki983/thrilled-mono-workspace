import { Logger } from '@mono/be-core';

/**
 * Simple logger helper for examples
 */
export function createLogger(context?: string): Logger {
  return Logger.create({
    level: 'info',
    dir: './logs',
    format: 'simple',
  });
}
