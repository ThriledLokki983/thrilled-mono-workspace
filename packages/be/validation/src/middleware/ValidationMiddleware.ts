import { Request, Response, NextFunction } from 'express';
import { JoiValidator } from '../validators/JoiValidator.js';
import { ZodValidator } from '../validators/ZodValidator.js';
import { BaseValidator } from '../validators/BaseValidator.js';
import { 
  ValidationError, 
  SchemaValidationConfig,
  ValidationMiddlewareFunction 
} from '../types/index.js';
import Joi from 'joi';
import { z } from 'zod';

/**
 * Express middleware for request validation
 */
export class ValidationMiddleware {
  /**
   * Create validation middleware from schema configuration
   */
  static validate(config: SchemaValidationConfig): ValidationMiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const errors: ValidationError[] = [];

        // Validate body
        if (config.body) {
          const validator = ValidationMiddleware.createValidator(config.body, config.options);
          const result = await validator.validate(req.body);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `body.${err.field}` })));
          } else {
            req.body = result.data;
          }
        }

        // Validate query parameters
        if (config.query) {
          const validator = ValidationMiddleware.createValidator(config.query, config.options);
          const result = await validator.validate(req.query);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `query.${err.field}` })));
          } else {
            req.query = result.data;
          }
        }

        // Validate URL parameters
        if (config.params) {
          const validator = ValidationMiddleware.createValidator(config.params, config.options);
          const result = await validator.validate(req.params);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `params.${err.field}` })));
          } else {
            req.params = result.data;
          }
        }

        // Validate headers
        if (config.headers) {
          const validator = ValidationMiddleware.createValidator(config.headers, config.options);
          const result = await validator.validate(req.headers);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `headers.${err.field}` })));
          }
        }

        // If there are validation errors, return them
        if (errors.length > 0) {
          res.status(400).json({
            error: 'Validation failed',
            details: errors,
            timestamp: new Date().toISOString()
          });
          return;
        }

        next();
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.status(500).json({
          error: 'Internal validation error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Create validator instance from schema
   */
  private static createValidator(schema: Joi.Schema | z.ZodSchema, options?: any): BaseValidator {
    if (ValidationMiddleware.isJoiSchema(schema)) {
      return new JoiValidator(schema, options);
    } else if (ValidationMiddleware.isZodSchema(schema)) {
      return new ZodValidator(schema, options);
    } else {
      throw new Error('Unsupported schema type');
    }
  }

  /**
   * Type guard for Joi schemas
   */
  private static isJoiSchema(schema: any): schema is Joi.Schema {
    return schema && 
           typeof schema.validate === 'function' && 
           (schema.$_root !== undefined || schema.type !== undefined || schema.constructor?.name === 'Schema');
  }

  /**
   * Type guard for Zod schemas
   */
  private static isZodSchema(schema: any): schema is z.ZodSchema {
    return schema && 
           typeof schema.parse === 'function' && 
           (schema._def !== undefined || schema.constructor?.name?.includes('Zod'));
  }

  /**
   * Validate body only
   */
  static body(schema: Joi.Schema | z.ZodSchema, options?: any): ValidationMiddlewareFunction {
    return ValidationMiddleware.validate({ body: schema, options });
  }

  /**
   * Validate query parameters only
   */
  static query(schema: Joi.Schema | z.ZodSchema, options?: any): ValidationMiddlewareFunction {
    return ValidationMiddleware.validate({ query: schema, options });
  }

  /**
   * Validate URL parameters only
   */
  static params(schema: Joi.Schema | z.ZodSchema, options?: any): ValidationMiddlewareFunction {
    return ValidationMiddleware.validate({ params: schema, options });
  }

  /**
   * Validate headers only
   */
  static headers(schema: Joi.Schema | z.ZodSchema, options?: any): ValidationMiddlewareFunction {
    return ValidationMiddleware.validate({ headers: schema, options });
  }

  /**
   * Create custom error handler middleware
   */
  static errorHandler(
    customHandler?: (errors: ValidationError[], req: Request, res: Response, next: NextFunction) => void
  ): ValidationMiddlewareFunction {
    return (req: Request, res: Response, next: NextFunction): void => {
      // This middleware should be placed after validation middleware
      // to catch and handle validation errors
      if (res.locals.validationErrors) {
        const errors: ValidationError[] = res.locals.validationErrors;
        
        if (customHandler) {
          customHandler(errors, req, res, next);
          return;
        }

        res.status(400).json({
          error: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      next();
    };
  }

  /**
   * Create validation middleware that doesn't stop execution on error
   * Instead, stores errors in res.locals for later handling
   */
  static validateSoft(config: SchemaValidationConfig): ValidationMiddlewareFunction {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors: ValidationError[] = [];

        // Similar validation logic but store errors instead of returning them
        if (config.body) {
          const validator = ValidationMiddleware.createValidator(config.body, config.options);
          const result = await validator.validate(req.body);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `body.${err.field}` })));
          } else {
            req.body = result.data;
          }
        }

        if (config.query) {
          const validator = ValidationMiddleware.createValidator(config.query, config.options);
          const result = await validator.validate(req.query);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `query.${err.field}` })));
          } else {
            req.query = result.data;
          }
        }

        if (config.params) {
          const validator = ValidationMiddleware.createValidator(config.params, config.options);
          const result = await validator.validate(req.params);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `params.${err.field}` })));
          } else {
            req.params = result.data;
          }
        }

        if (config.headers) {
          const validator = ValidationMiddleware.createValidator(config.headers, config.options);
          const result = await validator.validate(req.headers);
          if (!result.isValid) {
            errors.push(...result.errors.map(err => ({ ...err, field: `headers.${err.field}` })));
          }
        }

        // Store errors for later handling
        if (errors.length > 0) {
          res.locals.validationErrors = errors;
        }

        next();
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.locals.validationErrors = [{
          field: 'middleware',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          code: 'MIDDLEWARE_ERROR'
        }];
        next();
      }
    };
  }
}
