import { Application } from 'express';
import { BasePlugin, Logger } from '@mono/be-core';

// Function to import ES module from CommonJS context
const importESModule = async (specifier: string) => {
  return new Function('specifier', 'return import(specifier)')(specifier);
};

/**
 * Validation Plugin for Base BE App
 * Integrates the validation package with be-core using dynamic imports
 */
export class ValidationPlugin extends BasePlugin {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validationModule: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ValidationMiddleware: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private Sanitizer: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private XSSProtection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private SQLInjectionProtection: any;

  // BasePlugin required properties
  public readonly name = 'validation';
  public readonly version = '1.0.0';

  constructor(logger: Logger) {
    super(logger);
  }

  protected async setup(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: unknown
  ): Promise<void> {
    this.logger.info('Setting up Validation Plugin');

    try {
      // Dynamically import the validation module to handle ES module compatibility
      this.validationModule = await importESModule('@thrilled/be-validation');

      // Extract components from the imported module
      this.ValidationMiddleware = this.validationModule.ValidationMiddleware;
      this.Sanitizer = this.validationModule.Sanitizer;
      this.XSSProtection = this.validationModule.XSSProtection;
      this.SQLInjectionProtection = this.validationModule.SQLInjectionProtection;

      this.logger.info('Validation Plugin setup completed successfully');
    } catch (error) {
      this.logger.error('Failed to setup Validation Plugin:', error);
      throw error;
    }
  }

  protected override registerMiddleware(app: Application): void {
    this.logger.info('Registering validation middleware');

    try {
      // Add global protection middleware for all API routes
      app.use('/api', this.SQLInjectionProtection.middleware());
      app.use('/api', this.XSSProtection.middleware());

      // Add comprehensive sanitization for JSON bodies
      app.use('/api', (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
          try {
            // Sanitize the entire request body
            req.body = this.Sanitizer.sanitizeObject(req.body, {
              html: { stripTags: true },
              sql: { escapeQuotes: true },
              xss: { removeScriptTags: true },
            });
          } catch (error) {
            this.logger.warn('Error sanitizing request body:', error);
          }
        }
        next();
      });

      this.logger.info('Validation middleware registered successfully');
    } catch (error) {
      this.logger.error('Failed to register validation middleware:', error);
      throw error;
    }
  }

  /**
   * Get validation middleware for specific routes
   */
  getValidationMiddleware() {
    return this.ValidationMiddleware;
  }

  /**
   * Get SQL injection protection middleware
   */
  getSQLProtectionMiddleware() {
    return this.SQLInjectionProtection?.middleware();
  }

  /**
   * Get XSS protection middleware
   */
  getXSSProtectionMiddleware() {
    return this.XSSProtection?.middleware();
  }

  /**
   * Get sanitizer utility
   */
  getSanitizer() {
    return this.Sanitizer;
  }

  /**
   * Health check for validation plugin
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: Record<string, unknown> }> {
    try {
      // Ensure modules are loaded
      if (!this.Sanitizer || !this.XSSProtection || !this.SQLInjectionProtection) {
        throw new Error('Validation modules not properly initialized');
      }

      // Test sanitization functionality
      const testInput = '<script>alert("test")</script>SELECT * FROM users;';
      const sanitized = this.Sanitizer.sanitizeHTML(testInput, { stripTags: true });

      // Test XSS detection
      const xssDetected = this.XSSProtection.detectXSS(testInput);

      // Test SQL injection detection
      const sqlDetected = this.SQLInjectionProtection.detectSQLInjection(testInput);

      return {
        status: 'healthy',
        details: {
          sanitizationWorking: sanitized !== testInput,
          xssDetectionWorking: xssDetected,
          sqlDetectionWorking: sqlDetected,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      };
    }
  }
}
