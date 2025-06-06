import { ValidationResult, ValidationError } from '../types/index.js';
import { JoiValidator } from '../validators/JoiValidator.js';
import { ZodValidator } from '../validators/ZodValidator.js';
import { CustomValidators } from '../validators/CustomValidators.js';
import Joi from 'joi';
import { z } from 'zod';

/**
 * Utility functions for validation operations
 */
export class ValidationUtils {
  /**
   * Combine multiple validation results
   */
  static combineResults(results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    const combinedData: any = {};

    for (const result of results) {
      if (result.isValid) {
        if (result.data && typeof result.data === 'object') {
          Object.assign(combinedData, result.data);
        }
      } else {
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid: allErrors.length === 0,
      data: allErrors.length === 0 ? combinedData : null,
      errors: allErrors,
      metadata: {
        validator: 'combined',
        schema: 'multiple',
        options: {},
      },
    };
  }

  /**
   * Create validation chain for multiple validators
   */
  static createChain(
    validators: Array<{
      validator: JoiValidator | ZodValidator;
      stopOnError?: boolean;
    }>
  ): {
    validate: (data: any) => Promise<ValidationResult>;
  } {
    return {
      validate: async (data: any) => {
        const results: ValidationResult[] = [];
        let currentData = data;

        for (const { validator, stopOnError = true } of validators) {
          const result = await validator.validate(currentData);
          results.push(result);

          if (result.isValid) {
            currentData = result.data;
          } else if (stopOnError) {
            break;
          }
        }

        return this.combineResults(results);
      },
    };
  }

  /**
   * Create conditional validation
   */
  static conditional<T>(
    condition: (data: any) => boolean,
    validator: JoiValidator | ZodValidator,
    defaultValue?: T
  ): {
    validate: (data: any) => Promise<ValidationResult<T>>;
  } {
    return {
      validate: async (data: any) => {
        if (condition(data)) {
          return await validator.validate(data);
        }

        return {
          isValid: true,
          data: defaultValue ?? data,
          errors: [],
          metadata: {
            validator: 'conditional',
            schema: 'skipped',
            options: {},
          },
        };
      },
    };
  }

  /**
   * Transform validation errors to a more user-friendly format
   */
  static formatErrors(
    errors: ValidationError[],
    options?: {
      includeFieldPath?: boolean;
      groupByField?: boolean;
      customMessages?: Record<string, string>;
    }
  ): any {
    const opts = {
      includeFieldPath: true,
      groupByField: false,
      ...options,
    };

    if (opts.groupByField) {
      const grouped: Record<string, string[]> = {};

      for (const error of errors) {
        const field = opts.includeFieldPath
          ? error.field
          : error.field.split('.').pop() || error.field;
        const message =
          opts.customMessages?.[error.code || ''] || error.message;

        if (!grouped[field]) {
          grouped[field] = [];
        }
        grouped[field].push(message);
      }

      return grouped;
    }

    return errors.map((error) => ({
      field: opts.includeFieldPath
        ? error.field
        : error.field.split('.').pop() || error.field,
      message: opts.customMessages?.[error.code || ''] || error.message,
      code: error.code,
    }));
  }

  /**
   * Create validation summary
   */
  static createSummary(result: ValidationResult): {
    isValid: boolean;
    errorCount: number;
    fieldErrors: Record<string, number>;
    severity: 'none' | 'low' | 'medium' | 'high';
  } {
    const fieldErrors: Record<string, number> = {};

    for (const error of result.errors) {
      const field = error.field.split('.')[0];
      fieldErrors[field] = (fieldErrors[field] || 0) + 1;
    }

    let severity: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (result.errors.length > 0) {
      if (result.errors.length > 10) {
        severity = 'high';
      } else if (result.errors.length > 5) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
    }

    return {
      isValid: result.isValid,
      errorCount: result.errors.length,
      fieldErrors,
      severity,
    };
  }

  /**
   * Quick validation helpers for common patterns
   */
  static quick = {
    /**
     * Validate email
     */
    email: (value: string) => CustomValidators.email(value),

    /**
     * Validate password
     */
    password: (
      value: string,
      options?: Parameters<typeof CustomValidators.password>[1]
    ) => CustomValidators.password(value, options),

    /**
     * Validate phone
     */
    phone: (
      value: string,
      locale?: Parameters<typeof CustomValidators.phone>[1]
    ) => CustomValidators.phone(value, locale),

    /**
     * Validate URL
     */
    url: (
      value: string,
      options?: Parameters<typeof CustomValidators.url>[1]
    ) => CustomValidators.url(value, options),

    /**
     * Validate UUID
     */
    uuid: (
      value: string,
      version?: Parameters<typeof CustomValidators.uuid>[1]
    ) => CustomValidators.uuid(value, version),

    /**
     * Validate required field
     */
    required: (value: any, fieldName = 'field'): ValidationResult => {
      if (value === null || value === undefined || value === '') {
        return {
          isValid: false,
          data: null,
          errors: [
            {
              field: fieldName,
              message: `${fieldName} is required`,
              code: 'REQUIRED',
              value,
            },
          ],
          metadata: {
            validator: 'custom',
            schema: 'required',
            options: {},
          },
        };
      }

      return {
        isValid: true,
        data: value,
        errors: [],
        metadata: {
          validator: 'custom',
          schema: 'required',
          options: {},
        },
      };
    },
  };

  /**
   * Schema builder helpers
   */
  static schema = {
    /**
     * Create Joi schema for common object patterns
     */
    joi: {
      user: () =>
        Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(8).required(),
          firstName: Joi.string().min(2).max(50).required(),
          lastName: Joi.string().min(2).max(50).required(),
          age: Joi.number().integer().min(13).max(120).optional(),
          phone: Joi.string()
            .pattern(/^\+?[\d\s\-()]+$/)
            .optional(),
        }),

      pagination: () =>
        Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          sortBy: Joi.string().optional(),
          sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
        }),

      id: () =>
        Joi.object({
          id: Joi.string().guid({ version: 'uuidv4' }).required(),
        }),
    },

    /**
     * Create Zod schema for common object patterns
     */
    zod: {
      user: () =>
        z.object({
          email: z.string().email(),
          password: z.string().min(8),
          firstName: z.string().min(2).max(50),
          lastName: z.string().min(2).max(50),
          age: z.number().int().min(13).max(120).optional(),
          phone: z
            .string()
            .regex(/^\+?[\d\s\-()]+$/)
            .optional(),
        }),

      pagination: () =>
        z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(10),
          sortBy: z.string().optional(),
          sortOrder: z.enum(['asc', 'desc']).default('asc'),
        }),

      id: () =>
        z.object({
          id: z.string().uuid(),
        }),
    },
  };

  /**
   * Validate nested objects
   */
  static async validateNested(
    data: Record<string, any>,
    schemas: Record<string, JoiValidator | ZodValidator>
  ): Promise<ValidationResult> {
    const results: ValidationResult[] = [];

    for (const [key, schema] of Object.entries(schemas)) {
      if (data[key] !== undefined) {
        const result = await schema.validate(data[key]);

        // Prefix field names with the key
        if (!result.isValid) {
          result.errors = result.errors.map((error) => ({
            ...error,
            field: `${key}.${error.field}`,
          }));
        }

        results.push(result);
      }
    }

    return this.combineResults(results);
  }

  /**
   * Create middleware-friendly validation function
   */
  static createMiddlewareValidator(
    validator: JoiValidator | ZodValidator,
    target: 'body' | 'query' | 'params' = 'body'
  ) {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await validator.validate(req[target]);

        if (!result.isValid) {
          return res.status(400).json({
            error: 'Validation failed',
            details: this.formatErrors(result.errors),
            timestamp: new Date().toISOString(),
          });
        }

        req[target] = result.data;
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Debounced validation for real-time validation
   */
  static createDebouncedValidator(
    validator: JoiValidator | ZodValidator,
    delay = 300
  ): {
    validate: (data: any, callback: (result: ValidationResult) => void) => void;
    cancel: () => void;
  } {
    let timeoutId: NodeJS.Timeout | null = null;

    return {
      validate: (data: any, callback: (result: ValidationResult) => void) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
          try {
            const result = await validator.validate(data);
            callback(result);
          } catch (error) {
            callback({
              isValid: false,
              data: null,
              errors: [
                {
                  field: 'unknown',
                  message:
                    error instanceof Error ? error.message : 'Validation error',
                  code: 'VALIDATION_ERROR',
                },
              ],
              metadata: {
                validator: 'debounced',
                schema: 'unknown',
                options: {},
              },
            });
          }
        }, delay);
      },

      cancel: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      },
    };
  }

  /**
   * Create a custom validation error
   */
  static createCustomError(
    field: string,
    message: string,
    value?: any,
    code?: string
  ): ValidationError {
    return {
      field,
      message,
      value,
      code: code || 'CUSTOM_ERROR',
    };
  }

  /**
   * Format a single validation error for display
   */
  static formatError(error: ValidationError): {
    field: string;
    message: string;
    code?: string;
    value?: any;
  } {
    return {
      field: error.field,
      message: error.message,
      code: error.code,
      value: error.value,
    };
  }
}
