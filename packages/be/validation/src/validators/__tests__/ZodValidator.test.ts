import { z } from 'zod';
import { ZodValidator } from '../ZodValidator';

describe('ZodValidator', () => {
  describe('basic validation', () => {
    it('should validate simple string schema', async () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const result = await validator.validate('hello');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('hello');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid data', async () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const result = await validator.validate(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].message).toContain('string');
    });

    it('should handle required validation', async () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const result = await validator.validate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('object validation', () => {
    it('should validate object schema', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0).max(120),
        email: z.string().email()
      });
      const validator = new ZodValidator(schema);

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const result = await validator.validate(validData);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should handle nested validation errors', async () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0).max(120),
        email: z.string().email()
      });
      const validator = new ZodValidator(schema);

      const invalidData = {
        name: '',
        age: -5,
        email: 'invalid-email'
      };

      const result = await validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      const fields = result.errors.map(err => err.field);
      expect(fields).toContain('name');
      expect(fields).toContain('age');
      expect(fields).toContain('email');
    });
  });

  describe('array validation', () => {
    it('should validate array schema', async () => {
      const schema = z.array(z.string()).min(1).max(3);
      const validator = new ZodValidator(schema);

      const result = await validator.validate(['a', 'b', 'c']);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(['a', 'b', 'c']);
    });

    it('should reject invalid array items', async () => {
      const schema = z.array(z.string()).min(1);
      const validator = new ZodValidator(schema);

      const result = await validator.validate(['a', 123, 'c']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('synchronous validation', () => {
    it('should validate synchronously', () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const result = validator.validateSync('hello');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should handle sync validation errors', () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const result = validator.validateSync(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('optional and nullable', () => {
    it('should handle optional fields', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().optional()
      });
      const validator = new ZodValidator(schema);

      const result = await validator.validate({ name: 'John' });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John' });
    });

    it('should handle nullable fields', async () => {
      const schema = z.object({
        name: z.string(),
        middleName: z.string().nullable()
      });
      const validator = new ZodValidator(schema);

      const result = await validator.validate({ name: 'John', middleName: null });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John', middleName: null });
    });
  });

  describe('custom validation', () => {
    it('should handle refine validation', async () => {
      const schema = z.string().refine((val) => val.includes('special'), {
        message: 'Must contain "special"'
      });
      const validator = new ZodValidator(schema);

      const validResult = await validator.validate('special value');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await validator.validate('normal value');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain('special');
    });

    it('should handle transform validation', async () => {
      const schema = z.string().transform((val) => val.toUpperCase());
      const validator = new ZodValidator(schema);

      const result = await validator.validate('hello');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('HELLO');
    });
  });

  describe('union and discriminated union', () => {
    it('should validate union types', async () => {
      const schema = z.union([z.string(), z.number()]);
      const validator = new ZodValidator(schema);

      const stringResult = await validator.validate('hello');
      expect(stringResult.isValid).toBe(true);

      const numberResult = await validator.validate(123);
      expect(numberResult.isValid).toBe(true);

      const invalidResult = await validator.validate(true);
      expect(invalidResult.isValid).toBe(false);
    });

    it('should validate discriminated unions', async () => {
      const schema = z.discriminatedUnion('type', [
        z.object({ type: z.literal('user'), name: z.string() }),
        z.object({ type: z.literal('admin'), permissions: z.array(z.string()) })
      ]);
      const validator = new ZodValidator(schema);

      const userResult = await validator.validate({ type: 'user', name: 'John' });
      expect(userResult.isValid).toBe(true);

      const adminResult = await validator.validate({ type: 'admin', permissions: ['read', 'write'] });
      expect(adminResult.isValid).toBe(true);
    });
  });

  describe('schema access', () => {
    it('should provide access to the schema', () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      expect(validator.schema).toBe(schema);
    });
  });

  describe('batch validation', () => {
    it('should validate multiple items', async () => {
      const schema = z.string();
      const validator = new ZodValidator(schema);

      const results = await validator.validateBatch(['hello', 'world', 123]);
      
      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle complex nested errors', async () => {
      const schema = z.object({
        users: z.array(z.object({
          name: z.string().min(1),
          email: z.string().email()
        }))
      });
      const validator = new ZodValidator(schema);

      const invalidData = {
        users: [
          { name: '', email: 'invalid' },
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'invalid-email' }
        ]
      };

      const result = await validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
