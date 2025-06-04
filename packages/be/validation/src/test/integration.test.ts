import {
  JoiValidator,
  ZodValidator,
  CustomValidators,
  ValidationMiddleware,
  Sanitizer,
  XSSProtection,
  SQLInjectionProtection,
  ValidationUtils,
  ValidationPlugin
} from '../index';

import Joi from 'joi';
import { z } from 'zod';

/**
 * Integration test to verify all exports work correctly
 * This test ensures the package can be imported and used as documented
 */

describe('Integration Tests', () => {
  describe('Package Exports', () => {
    test('should export all main classes and functions', () => {
      expect(JoiValidator).toBeDefined();
      expect(ZodValidator).toBeDefined();
      expect(CustomValidators).toBeDefined();
      expect(ValidationMiddleware).toBeDefined();
      expect(Sanitizer).toBeDefined();
      expect(XSSProtection).toBeDefined();
      expect(SQLInjectionProtection).toBeDefined();
      expect(ValidationUtils).toBeDefined();
      expect(ValidationPlugin).toBeDefined();
    });

    test('should create JoiValidator instance and validate data', async () => {
      const joiValidator = new JoiValidator(Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0)
      }));
      
      const result = await joiValidator.validate({ name: 'Test', age: 25 });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: 'Test', age: 25 });
    });

    test('should create ZodValidator instance and validate data', async () => {
      const zodValidator = new ZodValidator(z.object({
        email: z.string().email(),
        count: z.number()
      }));
      
      const result = await zodValidator.validate({ email: 'test@example.com', count: 10 });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ email: 'test@example.com', count: 10 });
    });

    test('should validate with CustomValidators', async () => {
      const emailResult = await CustomValidators.email('test@example.com');
      const phoneResult = await CustomValidators.phone('+1234567890');
      const urlResult = await CustomValidators.url('https://example.com');
      
      expect(emailResult.isValid).toBe(true);
      expect(phoneResult.isValid).toBe(true);
      expect(urlResult.isValid).toBe(true);
    });

    test('should sanitize content with Sanitizer', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = Sanitizer.sanitizeHTML(maliciousInput, { stripTags: true });
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello World');
    });

    test('should detect XSS with XSSProtection', () => {
      const hasXSS = XSSProtection.detectXSS('<script>alert("hack")</script>');
      const cleanContent = XSSProtection.cleanContent('<script>bad</script>Good content');
      
      expect(hasXSS).toBe(true);
      expect(cleanContent).not.toContain('<script>');
      expect(cleanContent).toContain('Good content');
    });

    test('should detect SQL injection with SQLInjectionProtection', () => {
      const hasSQLInjection = SQLInjectionProtection.detectSQLInjection("'; DROP TABLE users; --");
      const safeQuery = SQLInjectionProtection.createSafeQuery('SELECT * FROM users WHERE id = ?', [123]);
      
      expect(hasSQLInjection).toBe(true);
      expect(safeQuery.query).toBeDefined();
      expect(safeQuery.params).toEqual([123]);
    });

    test('should create validation middleware', () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const middleware = ValidationMiddleware.body(schema);
      
      expect(typeof middleware).toBe('function');
    });

    test('should create ValidationPlugin instance', () => {
      const plugin = new ValidationPlugin({
        globalValidation: { enabled: true },
        globalSanitization: {
          body: { html: { enabled: true } }
        }
      });
      
      expect(plugin.getName()).toBe('validation');
    });

    test('should create and format validation errors', () => {
      const error = ValidationUtils.createCustomError('test', 'Test error', 'value', 'custom');
      const formatted = ValidationUtils.formatError(error);
      
      expect(error.field).toBe('test');
      expect(error.message).toBe('Test error');
      expect(formatted.field).toBe('test');
      expect(formatted.message).toBe('Test error');
      expect(formatted.code).toBe('custom');
    });
  });
});
