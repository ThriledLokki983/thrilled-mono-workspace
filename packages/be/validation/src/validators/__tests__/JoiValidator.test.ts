import Joi from 'joi';
import { JoiValidator } from '../JoiValidator';

describe('JoiValidator', () => {
  describe('basic validation', () => {
    it('should validate simple string schema', async () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const result = await validator.validate('hello');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('hello');
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid data', async () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const result = await validator.validate(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('root');
      expect(result.errors[0].message).toContain('string');
    });

    it('should handle required validation', async () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const result = await validator.validate(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('required');
    });
  });

  describe('object validation', () => {
    it('should validate object schema', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0).max(120),
        email: Joi.string().email(),
      });
      const validator = new JoiValidator(schema);

      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const result = await validator.validate(validData);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should handle nested validation errors', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0).max(120).required(),
        email: Joi.string().email().required(),
      });
      const validator = new JoiValidator(schema);

      const invalidData = {
        name: '',
        age: -5,
        email: 'invalid-email',
      };

      const result = await validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      const fields = result.errors.map((err) => err.field);
      expect(fields).toContain('name');
      expect(fields).toContain('age');
      expect(fields).toContain('email');
    });
  });

  describe('array validation', () => {
    it('should validate array schema', async () => {
      const schema = Joi.array().items(Joi.string()).min(1).max(3);
      const validator = new JoiValidator(schema);

      const result = await validator.validate(['a', 'b', 'c']);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(['a', 'b', 'c']);
    });

    it('should reject invalid array items', async () => {
      const schema = Joi.array().items(Joi.string()).min(1);
      const validator = new JoiValidator(schema);

      const result = await validator.validate(['a', 123, 'c']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('synchronous validation', () => {
    it('should validate synchronously', () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const result = validator.validateSync('hello');
      expect(result.isValid).toBe(true);
      expect(result.data).toBe('hello');
    });

    it('should handle sync validation errors', () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const result = validator.validateSync(123);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validation options', () => {
    it('should respect allowUnknown option', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      const validator = new JoiValidator(schema, { allowUnknown: true });

      const data = { name: 'John', extra: 'field' };
      const result = await validator.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should strip unknown fields when stripUnknown is true', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      const validator = new JoiValidator(schema, { stripUnknown: true });

      const data = { name: 'John', extra: 'field' };
      const result = await validator.validate(data);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'John' });
    });

    it('should collect all errors when abortEarly is false', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
        email: Joi.string().email().required(),
      });
      const validator = new JoiValidator(schema, { abortEarly: false });

      const result = await validator.validate({});

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('custom validation', () => {
    it('should handle custom validation rules', async () => {
      const schema = Joi.string().custom((value, helpers) => {
        if (value !== 'special') {
          return helpers.error('custom.notSpecial');
        }
        return value;
      });
      const validator = new JoiValidator(schema);

      const validResult = await validator.validate('special');
      expect(validResult.isValid).toBe(true);

      const invalidResult = await validator.validate('normal');
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('schema access', () => {
    it('should provide access to the schema', () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      expect(validator.schema).toBe(schema);
    });
  });

  describe('batch validation', () => {
    it('should validate multiple items', async () => {
      const schema = Joi.string().required();
      const validator = new JoiValidator(schema);

      const results = await validator.validateBatch(['hello', 'world', 123]);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });
  });
});
