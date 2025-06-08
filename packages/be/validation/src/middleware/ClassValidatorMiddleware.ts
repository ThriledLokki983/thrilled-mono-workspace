import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';

/**
 * Class-validator based validation middleware for DTO validation.
 * 
 * This middleware is designed for validating DTOs using class-validator decorators.
 * It complements the existing Joi/Zod validation middleware in this package.
 */

type RequestPart = 'body' | 'query' | 'params';

// Define enhanced request types to properly type validated properties
interface EnhancedRequest extends Request {
  validatedQuery?: unknown;
  validatedParams?: unknown;
}

/**
 * Middleware to validate request data using class-validator and class-transformer.
 * @param type - The DTO class to validate against.
 * @param value - The part of the request to validate (body, query, params).
 * @param options - Options for validation.
 * @param options.skipMissingProperties - Skip validation for missing properties.
 * @param options.whitelist - Strip properties that do not have decorators.
 * @param options.forbidNonWhitelisted - Throw an error if non-whitelisted properties are found.
 * @returns Middleware function.
 */
export function ClassValidatorMiddleware<T extends object>(
  type: new () => T,
  value: RequestPart = 'body',
  options: {
    skipMissingProperties?: boolean;
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
  } = {},
) {
  return async (req: EnhancedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = plainToInstance(type, req[value]);

      await validateOrReject(dto, {
        skipMissingProperties: options.skipMissingProperties ?? false,
        whitelist: options.whitelist ?? false,
        forbidNonWhitelisted: options.forbidNonWhitelisted ?? false,
      });

      // Safely attach validated data with proper typing
      switch (value) {
        case 'query':
          req.validatedQuery = dto as T;
          break;
        case 'params':
          req.validatedParams = dto as T;
          break;
        default:
          // For body, we can assign directly
          req.body = dto;
      }

      next();
    } catch (errors) {
      const message = formatValidationErrors(errors);
      
      // Return standardized error response
      res.status(400).json({
        error: 'Validation failed',
        message,
        details: Array.isArray(errors) ? errors.map(formatSingleError) : [formatSingleError(errors)],
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Formats validation errors into a readable string message
 * @param errors - The validation errors from class-validator
 * @returns A formatted error message string
 */
function formatValidationErrors(errors: unknown): string {
  const errorArray = Array.isArray(errors) ? errors : [errors];

  try {
    const messages = errorArray
      .flatMap((error: ValidationError) => {
        if (error.constraints) {
          return Object.values(error.constraints);
        }
        if (error.children && error.children.length > 0) {
          return error.children.flatMap(child => (child.constraints ? Object.values(child.constraints) : []));
        }
        return [];
      })
      .filter(Boolean);

    return messages.length ? messages.join(', ') : 'Validation failed';
  } catch (e) {
    console.error('Validation error formatting failed:', e);
    return 'Validation error occurred';
  }
}

/**
 * Formats a single validation error for API response
 * @param error - A validation error
 * @returns Formatted error object
 */
function formatSingleError(error: unknown) {
  if (error && typeof error === 'object' && 'property' in error && 'constraints' in error) {
    const validationError = error as ValidationError;
    return {
      field: validationError.property,
      value: validationError.value,
      constraints: validationError.constraints,
      messages: validationError.constraints ? Object.values(validationError.constraints) : [],
    };
  }
  
  return {
    field: 'unknown',
    message: error instanceof Error ? error.message : String(error),
  };
}
