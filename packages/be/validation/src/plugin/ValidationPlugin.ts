import { Application } from 'express';
import { ValidationMiddleware } from '../middleware/ValidationMiddleware.js';
import { XSSProtection } from '../sanitization/XSSProtection.js';
import { SQLInjectionProtection } from '../sanitization/SQLInjectionProtection.js';
import { Sanitizer } from '../sanitization/Sanitizer.js';
import { ValidationPluginConfig } from '../types/index.js';

/**
 * Validation plugin for be-core integration
 */
export class ValidationPlugin {
  private config: ValidationPluginConfig;
  private app?: Application;

  constructor(config: ValidationPluginConfig = {}) {
    this.config = {
      enableXSSProtection: true,
      enableSQLInjectionProtection: true,
      ...config
    };
  }

  /**
   * Initialize the validation plugin with Express app
   */
  init(app: Application): void {
    this.app = app;
    this.setupMiddleware();
  }

  /**
   * Setup validation and sanitization middleware
   */
  private setupMiddleware(): void {
    if (!this.app) {
      throw new Error('App not initialized. Call init() first.');
    }

    // Add security headers
    this.app.use((req, res, next) => {
      // XSS Protection header
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Content Type Options
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Frame Options
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Content Security Policy
      if (this.config.enableXSSProtection) {
        const csp = XSSProtection.createCSPHeader();
        res.setHeader('Content-Security-Policy', csp);
      }

      next();
    });

    // Global sanitization middleware
    if (this.config.globalSanitization) {
      this.app.use((req, res, next) => {
        try {
          // Sanitize request body
          if (req.body && typeof req.body === 'object') {
            if (this.config.globalSanitization?.body) {
              req.body = Sanitizer.sanitizeObject(req.body, this.config.globalSanitization.body);
            }
          }

          // Sanitize query parameters
          if (req.query && typeof req.query === 'object') {
            if (this.config.globalSanitization?.query) {
              req.query = Sanitizer.sanitizeObject(req.query, this.config.globalSanitization.query);
            }
          }

          // Sanitize URL parameters
          if (req.params && typeof req.params === 'object') {
            if (this.config.globalSanitization?.params) {
              req.params = Sanitizer.sanitizeObject(req.params, this.config.globalSanitization.params);
            }
          }

          next();
        } catch (error) {
          console.error('Global sanitization error:', error);
          next(error);
        }
      });
    }

    // XSS Protection middleware
    if (this.config.enableXSSProtection) {
      this.app.use(XSSProtection.middleware());
    }

    // SQL Injection Protection middleware
    if (this.config.enableSQLInjectionProtection) {
      this.app.use(SQLInjectionProtection.middleware());
    }

    // Global validation middleware
    if (this.config.globalValidation) {
      this.app.use(ValidationMiddleware.validate(this.config.globalValidation));
    }

    // Custom error handler
    if (this.config.errorHandler) {
      this.app.use(this.config.errorHandler);
    }
  }

  /**
   * Get validation middleware for specific routes
   */
  getValidationMiddleware() {
    return ValidationMiddleware;
  }

  /**
   * Get sanitization utilities
   */
  getSanitizer() {
    return Sanitizer;
  }

  /**
   * Get XSS protection utilities
   */
  getXSSProtection() {
    return XSSProtection;
  }

  /**
   * Get SQL injection protection utilities
   */
  getSQLProtection() {
    return SQLInjectionProtection;
  }

  /**
   * Create route-specific validation
   */
  createRouteValidation(path: string, schemas: any) {
    return {
      path,
      middleware: ValidationMiddleware.validate(schemas)
    };
  }

  /**
   * Add custom validator
   */
  addCustomValidator(name: string, validator: any): void {
    if (!this.config.customValidators) {
      this.config.customValidators = {};
    }
    this.config.customValidators[name] = validator;
  }

  /**
   * Get custom validator
   */
  getCustomValidator(name: string): any {
    return this.config.customValidators?.[name];
  }

  /**
   * Update plugin configuration
   */
  updateConfig(newConfig: Partial<ValidationPluginConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Re-setup middleware if app is initialized
    if (this.app) {
      this.setupMiddleware();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ValidationPluginConfig {
    return { ...this.config };
  }

  /**
   * Health check for validation system
   */
  healthCheck(): {
    status: 'healthy' | 'warning' | 'error';
    checks: Record<string, boolean>;
    message: string;
  } {
    const checks = {
      xssProtection: this.config.enableXSSProtection ?? false,
      sqlProtection: this.config.enableSQLInjectionProtection ?? false,
      globalValidation: !!this.config.globalValidation,
      globalSanitization: !!this.config.globalSanitization,
      customValidators: Object.keys(this.config.customValidators || {}).length > 0
    };

    const enabledChecks = Object.values(checks).filter(Boolean).length;
    
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'Validation system is fully operational';

    if (enabledChecks === 0) {
      status = 'error';
      message = 'No validation or sanitization features are enabled';
    } else if (enabledChecks < 2) {
      status = 'warning';
      message = 'Limited validation features are enabled';
    }

    return { status, checks, message };
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    enabledFeatures: string[];
    middlewareCount: number;
    customValidatorCount: number;
  } {
    const enabledFeatures: string[] = [];
    
    if (this.config.enableXSSProtection) enabledFeatures.push('XSS Protection');
    if (this.config.enableSQLInjectionProtection) enabledFeatures.push('SQL Injection Protection');
    if (this.config.globalValidation) enabledFeatures.push('Global Validation');
    if (this.config.globalSanitization) enabledFeatures.push('Global Sanitization');

    return {
      enabledFeatures,
      middlewareCount: enabledFeatures.length,
      customValidatorCount: Object.keys(this.config.customValidators || {}).length
    };
  }

  /**
   * Create validation report for debugging
   */
  createReport(): {
    config: ValidationPluginConfig;
    stats: ReturnType<ValidationPlugin['getStats']>;
    health: ReturnType<ValidationPlugin['healthCheck']>;
    timestamp: string;
  } {
    return {
      config: this.getConfig(),
      stats: this.getStats(),
      health: this.healthCheck(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Dispose of the plugin and clean up resources
   */
  dispose(): void {
    // Clean up any resources, timers, etc.
    this.app = undefined;
  }

  /**
   * Get plugin name
   */
  getName(): string {
    return 'validation';
  }
}
