import { ValidationResult, ValidationOptions, ValidatorType } from '../types/index.js';

/**
 * Abstract base class for all validators
 */
export abstract class BaseValidator<TSchema = any> {
  protected _schema: TSchema | null;
  protected options: ValidationOptions;
  
  abstract readonly type: ValidatorType;

  constructor(schema?: TSchema, options?: ValidationOptions) {
    this._schema = schema || null;
    this.options = {
      strict: false,
      collectAllErrors: false,
      allowUnknown: false,
      stripUnknown: false,
      coerceTypes: true,
      abortEarly: false, // Default to collecting all errors for better UX
      ...options
    };
  }

  /**
   * Validate data against the schema
   */
  abstract validate(data: any): Promise<ValidationResult>;

  /**
   * Validate data synchronously (if supported)
   */
  abstract validateSync?(data: any): ValidationResult;

  /**
   * Get schema description or metadata
   */
  abstract getSchemaDescription(): any;

  /**
   * Get the current validation options
   */
  getOptions(): ValidationOptions {
    return { ...this.options };
  }

  /**
   * Update validation options  
   */
  setOptions(options: Partial<ValidationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get the raw schema
   */
  getSchema(): TSchema | null {
    return this._schema;
  }

  /**
   * Get the schema (property getter)
   */
  get schema(): TSchema | null {
    return this._schema;
  }

  /**
   * Validate multiple items in batch
   */
  async validateBatch(items: any[]): Promise<ValidationResult[]> {
    const results = await Promise.all(
      items.map(item => this.validate(item))
    );
    return results;
  }

  /**
   * Validate multiple items in batch synchronously
   */
  validateBatchSync(items: any[]): ValidationResult[] {
    if (!this.validateSync) {
      throw new Error('Synchronous validation not supported by this validator');
    }
    return items.map(item => this.validateSync!(item));
  }

  /**
   * Conditional validation - only validate if condition is true
   */
  async validateIf(data: any, condition: () => boolean): Promise<ValidationResult> {
    if (!condition()) {
      return {
        isValid: true,
        data,
        errors: []
      };
    }
    return this.validate(data);
  }

  /**
   * Validate partial object (allowing missing fields)
   */
  async validatePartial(data: any): Promise<ValidationResult> {
    // Default implementation - can be overridden in subclasses
    const originalOptions = { ...this.options };
    this.options.allowUnknown = true;
    const result = await this.validate(data);
    this.options = originalOptions;
    return result;
  }

  /**
   * Validate with additional context
   */
  async validateWithContext(data: any, context: any): Promise<ValidationResult> {
    // Default implementation - can be overridden in subclasses
    return this.validate(data);
  }
}
