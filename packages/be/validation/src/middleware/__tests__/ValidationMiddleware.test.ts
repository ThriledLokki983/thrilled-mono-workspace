import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { z } from 'zod';
import { ValidationMiddleware } from '../ValidationMiddleware';

// Mock Express objects
const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  ...overrides
} as Request);

const createMockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {}
  } as unknown as Response;
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('ValidationMiddleware', () => {
  describe('validate', () => {
    it('should validate body with Joi schema', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0)
      });

      const middleware = ValidationMiddleware.validate({ body: schema });
      const req = createMockRequest({
        body: { name: 'John', age: 30 }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'John', age: 30 });
    });

    it('should validate body with Zod schema', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().min(0)
      });

      const middleware = ValidationMiddleware.validate({ body: schema });
      const req = createMockRequest({
        body: { name: 'John', age: 30 }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).toEqual({ name: 'John', age: 30 });
    });

    it('should return validation errors for invalid body', async () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(0).required()
      });

      const middleware = ValidationMiddleware.validate({ body: schema });
      const req = createMockRequest({
        body: { name: '', age: -5 }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: expect.stringMatching(/body\./) })
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should validate query parameters', async () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10)
      });

      const middleware = ValidationMiddleware.validate({ query: schema });
      const req = createMockRequest({
        query: { page: '2', limit: '20' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query).toEqual({ page: 2, limit: 20 });
    });

    it('should validate URL parameters', async () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required()
      });

      const middleware = ValidationMiddleware.validate({ params: schema });
      const req = createMockRequest({
        params: { id: '123e4567-e89b-12d3-a456-426614174000' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.params.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should validate headers', async () => {
      const schema = Joi.object({
        authorization: Joi.string().required(),
        'content-type': Joi.string().valid('application/json').required()
      }).unknown(true);

      const middleware = ValidationMiddleware.validate({ headers: schema });
      const req = createMockRequest({
        headers: {
          authorization: 'Bearer token123',
          'content-type': 'application/json',
          'user-agent': 'test'
        }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple validation errors', async () => {
      const bodySchema = Joi.object({
        name: Joi.string().required()
      });
      const querySchema = Joi.object({
        page: Joi.number().min(1).required()
      });

      const middleware = ValidationMiddleware.validate({
        body: bodySchema,
        query: querySchema
      });
      const req = createMockRequest({
        body: {},
        query: { page: '0' }
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({ field: expect.stringMatching(/body\./) }),
            expect.objectContaining({ field: expect.stringMatching(/query\./) })
          ])
        })
      );
    });

    it('should handle validation errors gracefully', async () => {
      const schema = { invalid: 'schema' }; // Invalid schema

      const middleware = ValidationMiddleware.validate({ body: schema as any });
      const req = createMockRequest({ body: { test: 'data' } });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal validation error'
        })
      );
    });
  });

  describe('body', () => {
    it('should create body validation middleware', async () => {
      const schema = Joi.object({ name: Joi.string().required() });
      const middleware = ValidationMiddleware.body(schema);
      
      const req = createMockRequest({ body: { name: 'John' } });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should create query validation middleware', async () => {
      const schema = Joi.object({ page: Joi.number().min(1) });
      const middleware = ValidationMiddleware.query(schema);
      
      const req = createMockRequest({ query: { page: '1' } });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('params', () => {
    it('should create params validation middleware', async () => {
      const schema = Joi.object({ id: Joi.string().required() });
      const middleware = ValidationMiddleware.params(schema);
      
      const req = createMockRequest({ params: { id: '123' } });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('headers', () => {
    it('should create headers validation middleware', async () => {
      const schema = Joi.object({ authorization: Joi.string().required() }).unknown(true);
      const middleware = ValidationMiddleware.headers(schema);
      
      const req = createMockRequest({ 
        headers: { authorization: 'Bearer token' } 
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateSoft', () => {
    it('should store validation errors in res.locals without stopping execution', async () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      const middleware = ValidationMiddleware.validateSoft({ body: schema });
      const req = createMockRequest({ body: {} });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.locals.validationErrors).toBeDefined();
      expect(res.locals.validationErrors).toHaveLength(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue execution when validation passes', async () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      const middleware = ValidationMiddleware.validateSoft({ body: schema });
      const req = createMockRequest({ body: { name: 'John' } });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.locals.validationErrors).toBeUndefined();
    });
  });

  describe('errorHandler', () => {
    it('should handle validation errors from res.locals', () => {
      const middleware = ValidationMiddleware.errorHandler();
      const req = createMockRequest();
      const res = createMockResponse();
      res.locals.validationErrors = [
        { field: 'name', message: 'Required field' }
      ];
      const next = createMockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: [{ field: 'name', message: 'Required field' }]
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should use custom error handler when provided', () => {
      const customHandler = jest.fn();
      const middleware = ValidationMiddleware.errorHandler(customHandler);
      const req = createMockRequest();
      const res = createMockResponse();
      res.locals.validationErrors = [
        { field: 'name', message: 'Required field' }
      ];
      const next = createMockNext();

      middleware(req, res, next);

      expect(customHandler).toHaveBeenCalledWith(
        [{ field: 'name', message: 'Required field' }],
        req,
        res,
        next
      );
    });

    it('should call next when no validation errors exist', () => {
      const middleware = ValidationMiddleware.errorHandler();
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
