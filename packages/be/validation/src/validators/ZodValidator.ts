import { z } from 'zod';
import { BaseValidator } from './BaseValidator.js';
import {
  ValidationResult,
  ValidationError,
  ValidationOptions,
  ValidatorType,
} from '../types/index.js';

/**
 * Zod-based validator implementation
 */
export class ZodValidator extends BaseValidator<z.ZodSchema> {
  readonly type: ValidatorType = 'zod';

  constructor(schema: z.ZodSchema, options?: ValidationOptions) {
    super(schema, options);
  }

  /**
   * Validate data against Zod schema
   */
  async validate(data: any): Promise<ValidationResult> {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    try {
      const result = this._schema.safeParse(data);

      if (!result.success) {
        const validationErrors = this.mapZodErrors(result.error, data);
        return {
          isValid: false,
          data: null,
          errors: validationErrors,
          metadata: {
            validator: this.type,
            schema: this.getSchemaDescription(),
            options: this.options,
          },
        };
      }

      return {
        isValid: true,
        data: result.data,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this.getSchemaDescription(),
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
          schema: this.getSchemaDescription(),
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
      const result = this._schema.safeParse(data);

      if (!result.success) {
        const validationErrors = this.mapZodErrors(result.error, data);
        return {
          isValid: false,
          data: null,
          errors: validationErrors,
          metadata: {
            validator: this.type,
            schema: this.getSchemaDescription(),
            options: this.options,
          },
        };
      }

      return {
        isValid: true,
        data: result.data,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this.getSchemaDescription(),
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
          schema: this.getSchemaDescription(),
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

    return {
      type: (this._schema._def as any).typeName || 'unknown',
      description: (this._schema as any).description || 'Zod schema',
      optional: (this._schema as any).isOptional?.() || false,
    };
  }

  /**
   * Map Zod validation errors to our ValidationError format
   */
  private mapZodErrors(
    zodError: z.ZodError,
    originalData: any
  ): ValidationError[] {
    return zodError.errors.map((error) => ({
      field: error.path.length > 0 ? error.path.join('.') : 'root',
      message: error.message,
      value: this.getValueAtPath(originalData, error.path),
    }));
  }

  /**
   * Get value at specific path in object
   */
  private getValueAtPath(obj: any, path: (string | number)[]): any {
    if (path.length === 0) return obj;

    let current = obj;
    for (const key of path) {
      if (current == null) return undefined;
      current = current[key];
    }
    return current;
  }

  /**
   * Create a copy of the validator with additional schema rules
   */
  extend(additionalSchema: z.ZodSchema): ZodValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    let extendedSchema: z.ZodSchema;

    // If both schemas are ZodObject, merge them
    if (
      this._schema instanceof z.ZodObject &&
      additionalSchema instanceof z.ZodObject
    ) {
      extendedSchema = this._schema.merge(additionalSchema);
    } else {
      // Otherwise, create intersection
      extendedSchema = z.intersection(this._schema, additionalSchema);
    }

    return new ZodValidator(extendedSchema, this.options);
  }

  /**
   * Create optional version of the schema
   */
  optional(): ZodValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const optionalSchema = this._schema.optional();
    return new ZodValidator(optionalSchema, this.options);
  }

  /**
   * Create nullable version of the schema
   */
  nullable(): ZodValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const nullableSchema = this._schema.nullable();
    return new ZodValidator(nullableSchema, this.options);
  }

  /**
   * Add transformation to the schema
   */
  transform<T>(transformFn: (value: any) => T): ZodValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const transformedSchema = this._schema.transform(transformFn);
    return new ZodValidator(transformedSchema, this.options);
  }

  /**
   * Add refinement to the schema
   */
  refine(refinement: (value: any) => boolean, message?: string): ZodValidator {
    if (!this._schema) {
      throw new Error('Schema is not defined');
    }

    const refinedSchema = this._schema.refine(refinement, message);
    return new ZodValidator(refinedSchema, this.options);
  }
}
