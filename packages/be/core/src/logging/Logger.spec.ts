import { Logger, LoggingConfig, createLogger, defaultLogger } from './Logger';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

describe('Logger', () => {
  const testLogDir = './test-logs';
  
  afterEach(() => {
    // Clean up test logs
    if (existsSync(testLogDir)) {
      rmSync(testLogDir, { recursive: true, force: true });
    }
  });

  describe('Logger class', () => {
    it('should create a logger with default config', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
      };
      const logger = new Logger(config);
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create a logger using static create method', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
        level: 'debug',
        format: 'json',
      };
      const logger = Logger.create(config);
      
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should log info messages', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
      };
      const logger = new Logger(config);
      
      // This should not throw
      expect(() => {
        logger.info('Test info message');
        logger.info('Test info with meta', { userId: 123 });
      }).not.toThrow();
    });

    it('should log error messages', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
      };
      const logger = new Logger(config);
      
      const error = new Error('Test error');
      
      // This should not throw
      expect(() => {
        logger.error('Test error message');
        logger.error(error);
        logger.error(error, { context: 'test' });
      }).not.toThrow();
    });

    it('should log warn messages', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
      };
      const logger = new Logger(config);
      
      // This should not throw
      expect(() => {
        logger.warn('Test warning message');
        logger.warn('Test warning with meta', { type: 'deprecation' });
      }).not.toThrow();
    });

    it('should log debug messages', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
        level: 'debug',
      };
      const logger = new Logger(config);
      
      // This should not throw
      expect(() => {
        logger.debug('Test debug message');
        logger.debug('Test debug with meta', { step: 1 });
      }).not.toThrow();
    });

    it('should create log directory if it does not exist', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
      };
      
      // Ensure directory doesn't exist
      if (existsSync(testLogDir)) {
        rmSync(testLogDir, { recursive: true, force: true });
      }
      
      new Logger(config);
      
      // Directory should be created
      expect(existsSync(testLogDir)).toBe(true);
      expect(existsSync(join(testLogDir, 'combined'))).toBe(true);
      expect(existsSync(join(testLogDir, 'error'))).toBe(true);
    });

    it('should use json format when specified', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
        format: 'json',
      };
      const logger = new Logger(config);
      
      // This should not throw
      expect(() => {
        logger.info('Test json format message');
      }).not.toThrow();
    });

    it('should disable correlation ID when configured', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
        correlationId: false,
      };
      const logger = new Logger(config);
      
      // This should not throw
      expect(() => {
        logger.info('Test without correlation ID');
      }).not.toThrow();
    });
  });

  describe('createLogger function', () => {
    it('should create a logger with custom config', () => {
      const config: LoggingConfig = {
        dir: testLogDir,
        level: 'warn',
        format: 'json',
        maxFiles: 10,
      };
      
      const logger = createLogger(config);
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('defaultLogger', () => {
    it('should be a Logger instance', () => {
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should be usable for logging', () => {
      // This should not throw
      expect(() => {
        defaultLogger.info('Test default logger');
      }).not.toThrow();
    });
  });

  describe('LoggingConfig interface', () => {
    it('should accept all optional properties', () => {
      const configs: LoggingConfig[] = [
        {},
        { level: 'info' },
        { dir: './custom-logs' },
        { format: 'json' },
        { httpLogging: false },
        { maxFiles: 7 },
        { correlationId: false },
        {
          level: 'debug',
          dir: './full-config-logs',
          format: 'simple',
          httpLogging: true,
          maxFiles: 14,
          correlationId: true,
        },
      ];

      configs.forEach((config, index) => {
        expect(() => {
          const logger = new Logger({ ...config, dir: `${testLogDir}-${index}` });
          logger.info(`Test config ${index}`);
        }).not.toThrow();
      });
    });
  });
});
