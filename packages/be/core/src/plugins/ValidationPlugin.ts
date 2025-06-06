import { Express, Request, Response, NextFunction } from 'express';
import { BasePlugin } from './Plugin.js';
import { Logger } from '../logging/Logger.js';

// Define proper error interface
interface ValidationError extends Error {
  name: 'ValidationError' | 'SanitizationError';
  details?: unknown;
  errors?: unknown;
}

export interface CoreValidationConfig {
  /** Enable XSS protection middleware */
  enableXSSProtection?: boolean;
  
  /** Enable SQL injection protection middleware */
  enableSQLInjectionProtection?: boolean;
  
  /** Global validation configuration */
  globalValidation?: {
    enabled: boolean;
    soft?: boolean;
    options?: Record<string, unknown>;
  };
  
  /** Global sanitization configuration */
  globalSanitization?: {
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
  
  /** Custom validators */
  customValidators?: Record<string, (value: unknown) => Promise<{ isValid: boolean; errors: unknown[] }>>;
  
  /** Custom error handler */
  errorHandler?: (error: unknown, req: unknown, res: unknown, next: unknown) => void;
  
  /** Content Security Policy configuration */
  csp?: {
    enabled: boolean;
    directives?: Record<string, string[]>;
  };
}

/**
 * Core Validation Plugin - integrates @thrilled/be-validation into be-core
 * 
 * This plugin provides comprehensive validation and sanitization capabilities
 * that are automatically available when using be-core.
 */
export class CoreValidationPlugin extends BasePlugin {
  readonly name = 'validation';
  readonly version = '1.0.0';
  
  private config: CoreValidationConfig = {
    enableXSSProtection: true,
    enableSQLInjectionProtection: true,
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
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    },
  };

  // Dynamic imports for validation modules
  private validationModules: Record<string, unknown> = {};

  constructor(logger?: Logger, config?: Partial<CoreValidationConfig>) {
    super(logger);
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  protected async setup(config: unknown): Promise<void> {
    if (config && typeof config === 'object') {
      this.config = { ...this.config, ...(config as Partial<CoreValidationConfig>) };
    }
    
    // Load validation modules dynamically
    try {
      // Try dynamic import first (for ES modules)
      this.validationModules = await import('@thrilled/be-validation');
      this.logger.info('Validation modules loaded successfully via dynamic import', { context: this.name });
    } catch (importError) {
      try {
        // Fallback to require (for CommonJS)
        this.validationModules = require('@thrilled/be-validation');
        this.logger.info('Validation modules loaded successfully via require', { context: this.name });
      } catch (requireError) {
        this.logger.warn('Validation modules are not available, continuing with basic security headers only', { 
          context: this.name, 
          importError: importError instanceof Error ? importError.message : String(importError),
          requireError: requireError instanceof Error ? requireError.message : String(requireError)
        });
        // Continue without validation modules - we can still provide basic security headers
      }
    }
    
    this.logger.info('Setting up validation plugin with configuration', {
      context: this.name,
      config: this.getPublicConfig(),
      modulesAvailable: Object.keys(this.validationModules).length > 0,
    });
  }

  protected override registerMiddleware(app: Express): void {
    this.logger.debug('Registering validation middleware', { context: this.name });

    // Add security headers
    app.use((req, res, next) => {
      // XSS Protection header
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Content Type Options
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Frame Options
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Content Security Policy
      if (this.config.csp?.enabled && this.config.csp.directives) {
        const cspString = Object.entries(this.config.csp.directives)
          .map(([directive, sources]: [string, string[]]) => `${directive} ${sources.join(' ')}`)
          .join('; ');
        res.setHeader('Content-Security-Policy', cspString);
      }

      next();
    });

    // Global sanitization middleware
    if (this.config.globalSanitization && this.validationModules.Sanitizer) {
      app.use((req, res, next) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SanitizerClass = this.validationModules.Sanitizer as any;
          const sanitizer = new SanitizerClass();
          
          // Sanitize request body
          if (req.body && typeof req.body === 'object' && this.config.globalSanitization?.body) {
            req.body = sanitizer.sanitizeObject(req.body, this.config.globalSanitization.body);
          }

          // Sanitize query parameters
          if (req.query && typeof req.query === 'object' && this.config.globalSanitization?.query) {
            const sanitized = sanitizer.sanitizeObject(req.query, this.config.globalSanitization.query);
            req.query = sanitized as typeof req.query;
          }

          // Sanitize URL parameters
          if (req.params && typeof req.params === 'object' && this.config.globalSanitization?.params) {
            const sanitized = sanitizer.sanitizeObject(req.params, this.config.globalSanitization.params);
            req.params = sanitized as typeof req.params;
          }

          next();
        } catch (error) {
          this.logger.error('Global sanitization error', { 
            context: this.name, 
            error: error instanceof Error ? error.message : String(error) 
          });
          next(error);
        }
      });
    }

    // XSS Protection middleware
    if (this.config.enableXSSProtection && this.validationModules.XSSProtection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const XSSProtectionClass = this.validationModules.XSSProtection as any;
      app.use(XSSProtectionClass.middleware({
        enableCSP: this.config.csp?.enabled,
        cspDirectives: this.config.csp?.directives,
      }));
    }

    // SQL Injection Protection middleware
    if (this.config.enableSQLInjectionProtection && this.validationModules.SQLInjectionProtection) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SQLInjectionProtectionClass = this.validationModules.SQLInjectionProtection as any;
      app.use(SQLInjectionProtectionClass.middleware());
    }
  }

  protected override registerErrorHandlers(app: Express): void {
    this.logger.debug('Registering validation error handlers', { context: this.name });
    
    // Custom error handler for validation errors
    app.use((err: ValidationError, req: Request, res: Response, next: NextFunction) => {
      if (this.config.errorHandler) {
        return this.config.errorHandler(err, req, res, next);
      }

      // Default validation error handling
      if (err.name === 'ValidationError') {
        this.logger.warn('Validation error occurred', {
          context: this.name,
          error: err.message,
          details: err.details || err.errors,
          path: req.path,
          method: req.method,
        });
        
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: err.details || err.errors,
        });
      }

      if (err.name === 'SanitizationError') {
        this.logger.warn('Sanitization error occurred', {
          context: this.name,
          error: err.message,
          path: req.path,
          method: req.method,
        });
        
        return res.status(400).json({
          error: 'Security Error',
          message: 'Potentially malicious content detected',
        });
      }

      // Pass other errors to the next error handler
      next(err);
    });
  }

  /**
   * Get validation middleware for specific routes
   */
  getValidationMiddleware(): unknown {
    return this.validationModules.ValidationMiddleware;
  }

  /**
   * Get sanitization utilities
   */
  getSanitizer(): unknown {
    return this.validationModules.Sanitizer;
  }

  /**
   * Get XSS protection utilities
   */
  getXSSProtection(): unknown {
    return this.validationModules.XSSProtection;
  }

  /**
   * Get SQL injection protection utilities
   */
  getSQLProtection(): unknown {
    return this.validationModules.SQLInjectionProtection;
  }

  /**
   * Get custom validators
   */
  getCustomValidators(): unknown {
    return this.validationModules.CustomValidators;
  }

  /**
   * Get validation utilities
   */
  getValidationUtils(): unknown {
    return this.validationModules.ValidationUtils;
  }

  /**
   * Get Joi validator instance
   */
  getJoiValidator(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const JoiValidatorClass = this.validationModules.JoiValidator as any;
    return new JoiValidatorClass();
  }

  /**
   * Get Zod validator instance
   */
  getZodValidator(): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ZodValidatorClass = this.validationModules.ZodValidator as any;
    return new ZodValidatorClass();
  }

  /**
   * Add custom validator
   */
  addCustomValidator(name: string, validator: (value: unknown) => Promise<{ isValid: boolean; errors: unknown[] }>): void {
    if (!this.config.customValidators) {
      this.config.customValidators = {};
    }
    this.config.customValidators[name] = validator;
    this.logger.debug(`Added custom validator: ${name}`, { context: this.name });
  }

  /**
   * Get custom validator
   */
  getCustomValidator(name: string): ((value: unknown) => Promise<{ isValid: boolean; errors: unknown[] }>) | undefined {
    return this.config.customValidators?.[name];
  }

  /**
   * Update plugin configuration
   */
  updateConfig(newConfig: Partial<CoreValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Updated validation plugin configuration', {
      context: this.name,
      config: this.getPublicConfig(),
    });
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getPublicConfig(): Partial<CoreValidationConfig> {
    const { customValidators, errorHandler, ...publicConfig } = this.config;
    return {
      ...publicConfig,
      customValidators: customValidators ? Object.keys(customValidators) : undefined,
      errorHandler: errorHandler ? 'custom' : undefined,
    } as Partial<CoreValidationConfig>;
  }

  /**
   * Health check for validation system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: Record<string, boolean>;
    message: string;
    details: unknown;
  }> {
    const checks = {
      xssProtection: this.config.enableXSSProtection ?? false,
      sqlProtection: this.config.enableSQLInjectionProtection ?? false,
      globalValidation: !!this.config.globalValidation?.enabled,
      globalSanitization: !!this.config.globalSanitization,
      customValidators: Object.keys(this.config.customValidators || {}).length > 0,
      cspEnabled: this.config.csp?.enabled ?? false,
      modulesLoaded: Object.keys(this.validationModules).length > 0,
    };

    const enabledChecks = Object.values(checks).filter(Boolean).length;
    const hasModules = checks.modulesLoaded;

    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    let message = 'Validation system is fully operational';

    if (!hasModules) {
      status = 'warning';
      message = 'Validation modules not available - basic security headers only';
    } else if (enabledChecks === 0) {
      status = 'error';
      message = 'No validation or sanitization features are enabled';
    } else if (enabledChecks < 3) {
      status = 'warning';
      message = 'Limited validation features are enabled';
    }

    return {
      status,
      checks,
      message,
      details: {
        enabledFeatures: enabledChecks,
        totalFeatures: Object.keys(checks).length,
        customValidatorCount: Object.keys(this.config.customValidators || {}).length,
        availableModules: Object.keys(this.validationModules),
        modulesAvailable: hasModules,
      },
    };
  }
}

// Re-export for convenience - these will be available after dynamic import
export const ValidationExports = {
  async getValidationMiddleware() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.ValidationMiddleware;
  },
  async getXSSProtection() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.XSSProtection;
  },
  async getSQLInjectionProtection() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.SQLInjectionProtection;
  },
  async getSanitizer() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.Sanitizer;
  },
  async getCustomValidators() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.CustomValidators;
  },
  async getValidationUtils() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.ValidationUtils;
  },
  async getJoiValidator() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.JoiValidator;
  },
  async getZodValidator() {
    const pkg = await import('@thrilled/be-validation');
    return pkg.ZodValidator;
  },
};
