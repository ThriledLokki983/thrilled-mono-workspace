import { Request, Response, NextFunction } from 'express';
import { IsString, IsNumber, IsEmail, Min } from 'class-validator';
import { ClassValidatorMiddleware } from '../ClassValidatorMiddleware';

// Test DTO classes
class TestUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNumber()
  @Min(0)
  age!: number;
}

class TestQueryDto {
  @IsString()
  search?: string;

  @IsNumber()
  @Min(1)
  page?: number;
}

// Mock Express objects
const createMockRequest = (overrides: Partial<Request> = {}): Request =>
  ({
    body: {},
    query: {},
    params: {},
    headers: {},
    ...overrides,
  } as Request);

const createMockResponse = (): Response => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    locals: {},
  } as unknown as Response;
  return res;
};

const createMockNext = (): NextFunction => jest.fn();

describe('ClassValidatorMiddleware', () => {
  describe('body validation', () => {
    it('should validate valid body data', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body');
      const req = createMockRequest({
        body: { name: 'John Doe', email: 'john@example.com', age: 30 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should reject invalid body data', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body');
      const req = createMockRequest({
        body: { name: '', email: 'invalid-email', age: -5 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: expect.any(String),
          details: expect.any(Array),
          timestamp: expect.any(String),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body');
      const req = createMockRequest({
        body: { name: 'John' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    it('should validate valid query parameters', async () => {
      const middleware = ClassValidatorMiddleware(TestQueryDto, 'query');
      const req = createMockRequest({
        query: { search: 'test', page: '1' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect((req as any).validatedQuery).toMatchObject({
        search: 'test',
        page: '1', // Note: class-transformer would need explicit transformation for number conversion
      });
    });

    it('should handle empty query parameters', async () => {
      const middleware = ClassValidatorMiddleware(TestQueryDto, 'query');
      const req = createMockRequest({
        query: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validation options', () => {
    it('should respect skipMissingProperties option', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body', {
        skipMissingProperties: true,
      });
      const req = createMockRequest({
        body: { name: 'John' }, // Missing email and age
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should respect whitelist option', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body', {
        whitelist: true,
        skipMissingProperties: true,
      });
      const req = createMockRequest({
        body: { 
          name: 'John',
          email: 'john@example.com',
          age: 30,
          extraField: 'should be removed',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body).not.toHaveProperty('extraField');
    });

    it('should respect forbidNonWhitelisted option', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body', {
        forbidNonWhitelisted: true,
        skipMissingProperties: true,
      });
      const req = createMockRequest({
        body: { 
          name: 'John',
          email: 'john@example.com',
          age: 30,
          extraField: 'should cause error',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('error formatting', () => {
    it('should format validation errors properly', async () => {
      const middleware = ClassValidatorMiddleware(TestUserDto, 'body');
      const req = createMockRequest({
        body: { name: '', email: 'invalid', age: -1 },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await middleware(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: expect.stringContaining('should not be empty'),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              constraints: expect.any(Object),
            }),
          ]),
        })
      );
    });
  });
});
