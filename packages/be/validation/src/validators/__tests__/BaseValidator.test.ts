import { BaseValidator } from '../BaseValidator.js';
import { ValidationResult } from '../../types/index.js';

// Mock implementation for testing
class MockValidator extends BaseValidator {
  readonly type = 'custom' as const;

  async validate(data: any): Promise<ValidationResult> {
    if (data === 'valid') {
      return {
        isValid: true,
        data: data,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this._schema,
          options: this.options
        }
      };
    } else {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'root', message: 'Invalid data', value: data }],
        metadata: {
          validator: this.type,
          schema: this._schema,
          options: this.options
        }
      };
    }
  }

  validateSync(data: any): ValidationResult {
    if (data === 'valid') {
      return {
        isValid: true,
        data: data,
        errors: [],
        metadata: {
          validator: this.type,
          schema: this._schema,
          options: this.options
        }
      };
    } else {
      return {
        isValid: false,
        data: null,
        errors: [{ field: 'root', message: 'Invalid data', value: data }],
        metadata: {
          validator: this.type,
          schema: this._schema,
          options: this.options
        }
      };
    }
  }

  getSchemaDescription(): any {
    return this._schema || 'Mock schema';
  }
}

describe('BaseValidator', () => {
  let validator: MockValidator;

  beforeEach(() => {
    validator = new MockValidator();
  });

  describe('validate (async)', () => {
    it('should return valid result for valid data', async () => {
      const result = await validator.validate('valid');

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('valid');
      expect(result.errors).toHaveLength(0);
      expect(result.metadata.validator).toBe('custom');
    });

    it('should return invalid result for invalid data', async () => {
      const result = await validator.validate('invalid');

      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'root',
        message: 'Invalid data',
        value: 'invalid'
      });
    });

    it('should handle batch validation', async () => {
      const results = await validator.validateBatch(['valid', 'invalid', 'valid']);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('validateSync', () => {
    it('should return valid result for valid data', () => {
      const result = validator.validateSync('valid');

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('valid');
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result for invalid data', () => {
      const result = validator.validateSync('invalid');

      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
    });

    it('should handle batch validation sync', () => {
      const results = validator.validateBatchSync(['valid', 'invalid', 'valid']);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
      expect(results[2].isValid).toBe(true);
    });
  });

  describe('conditional validation', () => {
    it('should validate when condition is true', async () => {
      const result = await validator.validateIf('valid', () => true);

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('valid');
    });

    it('should skip validation when condition is false', async () => {
      const result = await validator.validateIf('invalid', () => false);

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('invalid');
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('partial validation', () => {
    it('should validate partial object', async () => {
      const result = await validator.validatePartial({ field: 'valid' });

      expect(result.isValid).toBe(false); // Mock implementation always fails for objects
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validation with context', () => {
    it('should validate with context', async () => {
      const context = { userId: '123' };
      const result = await validator.validateWithContext('valid', context);

      expect(result.isValid).toBe(true);
      expect(result.data).toBe('valid');
    });
  });

  describe('schema getter', () => {
    it('should return null for base validator', () => {
      expect(validator.schema).toBeNull();
    });
  });
});
