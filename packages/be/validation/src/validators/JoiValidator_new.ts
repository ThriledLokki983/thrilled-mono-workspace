import Joi from 'joi';
import { BaseValidator } from './BaseValidator.js';
import {
  ValidationResult,
  ValidationError,
  ValidationOptions,
  ValidatorType,
} from '../types/index.js';

/**
 * Joi-based validator implementation
 */
export class JoiValidator extends BaseValidator<Joi.Schema> {
  readonly type: ValidatorType = 'joi';

  constructor(schema: Joi.Schema, options?: ValidationOptions) {
    super(schema, options);
  }

  /**
   * Validate data against Joi schema
   */
  async validate(data: any): Promise<ValidationResult> {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    try {
      const joiOptions = this.buildJoiOptions();
      const { error, value } = this._schema.validate(data, joiOptions);

      if (error) {
        const validationErrors = this.mapJoiErrors(error);
        return {
          isValid: false,
          data: null,
          errors: validationErrors,
          metadata: {
            validator: this.type,
            schema: this._schema.describe(),
            options: this.options,
          },
        };
      }

      return {
        isValid: true,
        data: value,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this._schema.describe(),
          options: this.options,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        errors: [
          {
            field: 'unknown',
            message:
              error instanceof Error ? error.message : 'Validation failed',
            value: data,
          },
        ],
        metadata: {
          validator: this.type,
          schema: this._schema.describe(),
          options: this.options,
        },
      };
    }
  }

  /**
   * Validate data synchronously
   */
  validateSync(data: any): ValidationResult {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    try {
      const joiOptions = this.buildJoiOptions();
      const { error, value } = this._schema.validate(data, joiOptions);

      if (error) {
        const validationErrors = this.mapJoiErrors(error);
        return {
          isValid: false,
          data: null,
          errors: validationErrors,
          metadata: {
            validator: this.type,
            schema: this._schema.describe(),
            options: this.options,
          },
        };
      }

      return {
        isValid: true,
        data: value,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this._schema.describe(),
          options: this.options,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        errors: [
          {
            field: 'unknown',
            message:
              error instanceof Error ? error.message : 'Validation failed',
            value: data,
          },
        ],
        metadata: {
          validator: this.type,
          schema: this._schema.describe(),
          options: this.options,
        },
      };
    }
  }

  /**
   * Get schema description
   */
  getSchemaDescription(): any {
    if (!this._schema) {
      return null;
    }
    return this._schema.describe();
  }

  /**
   * Build Joi validation options from generic options
   */
  private buildJoiOptions(): Joi.ValidationOptions {
    return {
      abortEarly: !this.options.collectAllErrors,
      allowUnknown: this.options.allowUnknown,
      stripUnknown: this.options.stripUnknown,
      convert: this.options.coerceTypes,
    };
  }

  /**
   * Map Joi validation errors to our ValidationError format
   */
  private mapJoiErrors(joiError: Joi.ValidationError): ValidationError[] {
    return joiError.details.map((detail) => ({
      field: detail.path.length > 0 ? detail.path.join('.') : 'root',
      message: detail.message,
      value: detail.context?.value,
    }));
  }

  /**
   * Create a copy of the validator with additional schema rules
   */
  extend(additionalSchema: Joi.Schema): JoiValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const extendedSchema = (this._schema as any).keys
      ? (this._schema as Joi.ObjectSchema).keys(
          (additionalSchema as Joi.ObjectSchema).describe()
        )
      : this._schema;

    return new JoiValidator(extendedSchema, this.options);
  }

  /**
   * Create conditional validation
   */
  when(condition: string, options: any): JoiValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const conditionalSchema = (this._schema as any).when(condition, options);
    return new JoiValidator(conditionalSchema, this.options);
  }
}
