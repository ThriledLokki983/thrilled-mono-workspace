import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { z } from 'zod';

/**
 * Validation result interface
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T | null;
  errors: ValidationError[];
  metadata?: {
    validator: ValidatorType;
    schema: any;
    options: ValidationOptions;
  };
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

/**
 * Validator types
 */
export type ValidatorType = 'joi' | 'zod' | 'custom' | 'combined' | 'conditional' | 'debounced';

/**
 * Validation options for middleware
 */
export interface ValidationOptions {
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  abortEarly?: boolean;
  collectAllErrors?: boolean;
  strict?: boolean;
  coerceTypes?: boolean;
  presence?: 'optional' | 'required' | 'forbidden';
  skipFunctions?: boolean;
  convert?: boolean;
}

/**
 * Sanitization options
 */
export interface SanitizationOptions {
  html?: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
    stripTags?: boolean;
  };
  sql?: {
    escapeQuotes?: boolean;
    removeSqlKeywords?: boolean;
  };
  xss?: {
    removeScriptTags?: boolean;
    encodeHtml?: boolean;
    allowSafeAttributes?: string[];
  };
  general?: {
    trim?: boolean;
    toLowerCase?: boolean;
    removeNullChars?: boolean;
  };
}

/**
 * Custom validator function type
 */
export type ValidatorFunction<T = any> = (value: T, context?: any) => ValidationResult<T>;

/**
 * Schema validation configuration
 */
export interface SchemaValidationConfig {
  body?: Joi.Schema | z.ZodSchema;
  query?: Joi.Schema | z.ZodSchema;
  params?: Joi.Schema | z.ZodSchema;
  headers?: Joi.Schema | z.ZodSchema;
  options?: ValidationOptions;
}

/**
 * Express middleware types
 */
export type ValidationMiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Sanitization middleware configuration
 */
export interface SanitizationConfig {
  body?: SanitizationOptions;
  query?: SanitizationOptions;
  params?: SanitizationOptions;
  headers?: SanitizationOptions;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  required?: boolean;
}

/**
 * Rate limiting validation
 */
export interface RateLimitValidation {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  skipIf?: (req: Request) => boolean;
}

/**
 * Validation plugin configuration
 */
export interface ValidationPluginConfig {
  globalValidation?: SchemaValidationConfig;
  globalSanitization?: SanitizationConfig;
  enableXSSProtection?: boolean;
  enableSQLInjectionProtection?: boolean;
  customValidators?: Record<string, ValidatorFunction>;
  errorHandler?: (errors: ValidationError[], req: Request, res: Response, next: NextFunction) => void;
}
