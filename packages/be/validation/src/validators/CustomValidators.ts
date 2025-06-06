import { ValidationResult, ValidatorType } from '../types/index.js';
import validator from 'validator';

/**
 * Collection of custom validation functions
 */
export class CustomValidators {
  private static readonly type: ValidatorType = 'custom';

  /**
   * Validate email format
   */
  static email(value: string): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'email',
        'Email is required and must be a string',
        value
      );
    }

    if (!validator.isEmail(value)) {
      return this.createErrorResult('email', 'Invalid email format', value);
    }

    return this.createSuccessResult(value.toLowerCase().trim());
  }

  /**
   * Validate phone number
   */
  static phone(
    value: string,
    locale?: validator.MobilePhoneLocale
  ): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'phone',
        'Phone number is required and must be a string',
        value
      );
    }

    const cleanPhone = value.replace(/\D/g, '');

    if (!validator.isMobilePhone(cleanPhone, locale || 'any')) {
      return this.createErrorResult(
        'phone',
        'Invalid phone number format',
        value
      );
    }

    return this.createSuccessResult(cleanPhone);
  }

  /**
   * Validate URL format
   */
  static url(
    value: string,
    options?: validator.IsURLOptions
  ): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'url',
        'URL is required and must be a string',
        value
      );
    }

    if (!validator.isURL(value, options)) {
      return this.createErrorResult('url', 'Invalid URL format', value);
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate password strength
   */
  static password(
    value: string,
    options?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
    }
  ): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'password',
        'Password is required and must be a string',
        value
      );
    }

    const opts = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      ...options,
    };

    const errors: string[] = [];

    if (value.length < opts.minLength) {
      errors.push(
        `Password must be at least ${opts.minLength} characters long`
      );
    }

    if (opts.requireUppercase && !/[A-Z]/.test(value)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (opts.requireLowercase && !/[a-z]/.test(value)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (opts.requireNumbers && !/\d/.test(value)) {
      errors.push('Password must contain at least one number');
    }

    if (opts.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      return this.createErrorResult(
        'password',
        `Password does not meet requirements: ${errors.join('; ')}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate credit card number
   */
  static creditCard(value: string): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'creditCard',
        'Credit card number is required and must be a string',
        value
      );
    }

    const cleaned = value.replace(/\D/g, '');

    if (!validator.isCreditCard(cleaned)) {
      return this.createErrorResult(
        'creditCard',
        'Invalid credit card number',
        value
      );
    }

    return this.createSuccessResult(cleaned);
  }

  /**
   * Validate UUID format
   */
  static uuid(
    value: string,
    version?: validator.UUIDVersion
  ): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'uuid',
        'UUID is required and must be a string',
        value
      );
    }

    if (!validator.isUUID(value, version)) {
      return this.createErrorResult(
        'uuid',
        `Invalid UUID${version ? ` v${version}` : ''} format`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate date format
   */
  static date(value: string | Date, format?: string): ValidationResult<Date> {
    if (!value) {
      return this.createErrorResult('date', 'Date is required', value);
    }

    let dateValue: Date;

    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === 'string') {
      if (format && !validator.isDate(value, { format })) {
        return this.createErrorResult(
          'date',
          `Invalid date format. Expected: ${format}`,
          value
        );
      }
      dateValue = new Date(value);
    } else {
      return this.createErrorResult(
        'date',
        'Date must be a string or Date object',
        value
      );
    }

    if (isNaN(dateValue.getTime())) {
      return this.createErrorResult('date', 'Invalid date', value);
    }

    return this.createSuccessResult(dateValue);
  }

  /**
   * Validate age range
   */
  static age(
    value: number,
    options?: { min?: number; max?: number }
  ): ValidationResult<number> {
    if (typeof value !== 'number' || isNaN(value)) {
      return this.createErrorResult('age', 'Age must be a valid number', value);
    }

    const opts = { min: 0, max: 150, ...options };

    if (value < opts.min) {
      return this.createErrorResult(
        'age',
        `Age must be at least ${opts.min}`,
        value
      );
    }

    if (value > opts.max) {
      return this.createErrorResult(
        'age',
        `Age must be at most ${opts.max}`,
        value
      );
    }

    return this.createSuccessResult(Math.floor(value));
  }

  /**
   * Validate postal code
   */
  static postalCode(
    value: string,
    locale?: validator.PostalCodeLocale
  ): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'postalCode',
        'Postal code is required and must be a string',
        value
      );
    }

    if (!validator.isPostalCode(value, locale || 'any')) {
      return this.createErrorResult(
        'postalCode',
        'Invalid postal code format',
        value
      );
    }

    return this.createSuccessResult(value.toUpperCase());
  }

  /**
   * Validate IP address
   */
  static ipAddress(value: string, version?: 4 | 6): ValidationResult<string> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'ipAddress',
        'IP address is required and must be a string',
        value
      );
    }

    const isValid =
      version === 4
        ? validator.isIP(value, 4)
        : version === 6
        ? validator.isIP(value, 6)
        : validator.isIP(value);

    if (!isValid) {
      return this.createErrorResult(
        'ipAddress',
        `Invalid IPv${version || '4/6'} address`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate JSON string
   */
  static async json(value: string): Promise<ValidationResult<any>> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult('json', 'JSON string is required', value);
    }

    try {
      const parsed = JSON.parse(value);
      return this.createSuccessResult(parsed);
    } catch (error) {
      return this.createErrorResult('json', 'Invalid JSON string', value);
    }
  }

  /**
   * Validate slug format
   */
  static async slug(value: string): Promise<ValidationResult<string>> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'slug',
        'Slug is required and must be a string',
        value
      );
    }

    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(value)) {
      return this.createErrorResult(
        'slug',
        'Invalid slug format. Must be lowercase with hyphens only',
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate hex color
   */
  static async hexColor(value: string): Promise<ValidationResult<string>> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'hexColor',
        'Hex color is required and must be a string',
        value
      );
    }

    const hexPattern = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (!hexPattern.test(value)) {
      return this.createErrorResult(
        'hexColor',
        'Invalid hex color format',
        value
      );
    }

    return this.createSuccessResult(
      value.startsWith('#') ? value : `#${value}`
    );
  }

  /**
   * Validate domain name
   */
  static async domain(value: string): Promise<ValidationResult<string>> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult(
        'domain',
        'Domain is required and must be a string',
        value
      );
    }

    if (!validator.isFQDN(value)) {
      return this.createErrorResult('domain', 'Invalid domain name', value);
    }

    return this.createSuccessResult(value.toLowerCase());
  }

  /**
   * Validate file upload
   */
  static async file(
    file: { name: string; size: number; mimetype?: string },
    options?: {
      allowedExtensions?: string[];
      maxSize?: number;
      allowedMimeTypes?: string[];
    }
  ): Promise<ValidationResult<any>> {
    if (!file || !file.name) {
      return this.createErrorResult('file', 'File is required', file);
    }

    const { allowedExtensions, maxSize, allowedMimeTypes } = options || {};

    // Check file extension
    if (allowedExtensions) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedExtensions.some((allowed) => allowed.toLowerCase() === ext)) {
        return this.createErrorResult(
          'file',
          `File extension not allowed. Allowed: ${allowedExtensions.join(
            ', '
          )}`,
          file
        );
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      return this.createErrorResult(
        'file',
        `File size exceeds maximum of ${maxSize} bytes`,
        file
      );
    }

    // Check MIME type
    if (
      allowedMimeTypes &&
      file.mimetype &&
      !allowedMimeTypes.includes(file.mimetype)
    ) {
      return this.createErrorResult(
        'file',
        `MIME type not allowed. Allowed: ${allowedMimeTypes.join(', ')}`,
        file
      );
    }

    return this.createSuccessResult(file);
  }

  /**
   * Validate numeric range
   */
  static async range(
    value: number,
    options: { min?: number; max?: number }
  ): Promise<ValidationResult<number>> {
    if (typeof value !== 'number' || isNaN(value)) {
      return this.createErrorResult(
        'range',
        'Value must be a valid number',
        value
      );
    }

    const { min, max } = options;

    if (min !== undefined && value < min) {
      return this.createErrorResult(
        'range',
        `Value must be at least ${min}`,
        value
      );
    }

    if (max !== undefined && value > max) {
      return this.createErrorResult(
        'range',
        `Value must be at most ${max}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate string/array length
   */
  static async length(
    value: string | any[],
    options: { min?: number; max?: number }
  ): Promise<ValidationResult<string | any[]>> {
    if (!value || (typeof value !== 'string' && !Array.isArray(value))) {
      return this.createErrorResult(
        'length',
        'Value must be a string or array',
        value
      );
    }

    const { min, max } = options;
    const len = value.length;

    if (min !== undefined && len < min) {
      return this.createErrorResult(
        'length',
        `Length must be at least ${min}`,
        value
      );
    }

    if (max !== undefined && len > max) {
      return this.createErrorResult(
        'length',
        `Length must be at most ${max}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate pattern match
   */
  static async pattern(
    value: string,
    regex: RegExp
  ): Promise<ValidationResult<string>> {
    if (!value || typeof value !== 'string') {
      return this.createErrorResult('pattern', 'Value must be a string', value);
    }

    if (!regex.test(value)) {
      return this.createErrorResult(
        'pattern',
        `Value does not match required pattern: ${regex.source}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Validate enum value
   */
  static async enum(
    value: any,
    allowedValues: any[]
  ): Promise<ValidationResult<any>> {
    if (!allowedValues.includes(value)) {
      return this.createErrorResult(
        'enum',
        `Value must be one of: ${allowedValues.join(', ')}`,
        value
      );
    }

    return this.createSuccessResult(value);
  }

  /**
   * Create success result
   */
  private static createSuccessResult<T>(data: T): ValidationResult<T> {
    return {
      isValid: true,
      data,
      errors: [],
      metadata: {
        validator: this.type,
        schema: 'custom',
        options: {},
      },
    };
  }

  /**
   * Create error result
   */
  private static createErrorResult(
    field: string,
    message: string,
    value: any
  ): ValidationResult {
    return {
      isValid: false,
      data: null,
      errors: [
        {
          field,
          message,
          code: 'CUSTOM_VALIDATION_ERROR',
          value,
        },
      ],
      metadata: {
        validator: this.type,
        schema: 'custom',
        options: {},
      },
    };
  }
}
