/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { RequestMockOptions, ResponseMockOptions } from '../types/mock-types.js';

/**
 * Express Request Mock
 */
export class MockRequest implements Partial<Request> {
  public body: any = {};
  public query: any = {};
  public params: any = {};
  public headers: any = {};
  public cookies: any = {};
  public user?: any;
  public session?: any;
  public ip = '127.0.0.1';
  public method = 'GET';
  public path = '/';
  public url = '/';
  public protocol = 'http';
  public secure = false;
  public originalUrl = '/';

  constructor(options: RequestMockOptions = {}) {
    Object.assign(this, {
      body: options.body || {},
      query: options.query || {},
      params: options.params || {},
      headers: options.headers || {},
      user: options.user,
      session: options.session,
      ip: options.ip || '127.0.0.1',
      method: options.method || 'GET',
      path: options.path || '/',
      url: options.path || '/',
      originalUrl: options.path || '/',
    });
  }

  // Mock methods - overload to match Express signature
  get(header: 'set-cookie'): string[] | undefined;
  get(header: string): string | undefined;
  get(header: string): string | string[] | undefined {
    const value = this.headers[header.toLowerCase()];
    if (header.toLowerCase() === 'set-cookie' && Array.isArray(value)) {
      return value;
    }
    return typeof value === 'string' ? value : undefined;
  }

  header(header: 'set-cookie'): string[] | undefined;
  header(header: string): string | undefined;
  header(header: string): string | string[] | undefined {
    return this.get(header);
  }

  accepts(): string[];
  accepts(type: string): string | false;
  accepts(type: string[]): string | false;
  accepts(...type: string[]): string | false;
  accepts(type?: string | string[]): string | string[] | false {
    if (!type) return [];
    if (Array.isArray(type)) return type[0] || false;
    return type;
  }

  is(type: string): string | false {
    return type;
  }
}

/**
 * Express Response Mock
 */
export class MockResponse implements Partial<Response> {
  public statusCode = 200;
  public locals: any = {};
  public headersSent = false;
  private _headers: Record<string, string> = {};
  private _cookies: any[] = [];

  // Mock method implementations
  public status = jest.fn().mockImplementation((code: number) => {
    this.statusCode = code;
    return this;
  });

  public json = jest.fn().mockImplementation((body: any) => {
    this.statusCode = this.statusCode || 200;
    return this;
  });

  public send = jest.fn().mockImplementation((body: any) => {
    this.statusCode = this.statusCode || 200;
    return this;
  });

  public redirect = jest.fn().mockImplementation((url: string) => {
    this.statusCode = 302;
    return this;
  });

  public end = jest.fn().mockImplementation(() => {
    this.headersSent = true;
    return this;
  });

  public setHeader = jest.fn().mockImplementation((name: string, value: string) => {
    this._headers[name.toLowerCase()] = value;
    return this;
  });

  public getHeader = jest.fn().mockImplementation((name: string) => {
    return this._headers[name.toLowerCase()];
  });

  public removeHeader = jest.fn().mockImplementation((name: string) => {
    delete this._headers[name.toLowerCase()];
    return this;
  });

  public cookie = jest.fn().mockImplementation((name: string, value: any, options?: any) => {
    this._cookies.push({ name, value, options });
    return this;
  });

  public clearCookie = jest.fn().mockImplementation((name: string, options?: any) => {
    this._cookies = this._cookies.filter(c => c.name !== name);
    return this;
  });

  public type = jest.fn().mockImplementation((type: string) => {
    this.setHeader('content-type', type);
    return this;
  });

  public set = jest.fn().mockImplementation((field: string | Record<string, string>, value?: string) => {
    if (typeof field === 'string') {
      if (value !== undefined) {
        this.setHeader(field, value);
      }
    } else {
      Object.entries(field).forEach(([k, v]) => {
        this.setHeader(k, v);
      });
    }
    return this;
  });

  constructor(options: ResponseMockOptions = {}) {
    if (options.status) {
      this.statusCode = options.status;
    }
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        this._headers[key.toLowerCase()] = value;
      });
    }
    if (options.locals) {
      this.locals = options.locals;
    }
  }

  // Getters for testing
  get headers(): Record<string, string> {
    return this._headers;
  }

  get cookies(): any[] {
    return this._cookies;
  }
}

/**
 * Next Function Mock
 */
export function createMockNext(): jest.Mock<void, any[]> {
  return jest.fn();
}

/**
 * Create Express mocks
 */
export function createExpressMocks(
  reqOptions: RequestMockOptions = {},
  resOptions: ResponseMockOptions = {}
): {
  req: MockRequest;
  res: MockResponse;
  next: jest.Mock<void, any[]>;
} {
  const req = new MockRequest(reqOptions);
  const res = new MockResponse(resOptions);
  const next = jest.fn();

  return { req, res, next };
}

/**
 * Create authenticated request mock
 */
export function createAuthenticatedRequest(
  user: any,
  options: RequestMockOptions = {}
): MockRequest {
  return new MockRequest({
    ...options,
    user,
    headers: {
      authorization: `Bearer mock-token`,
      ...options.headers,
    },
  });
}

/**
 * Create request with session
 */
export function createRequestWithSession(
  session: any,
  options: RequestMockOptions = {}
): MockRequest {
  return new MockRequest({
    ...options,
    session,
  });
}

/**
 * Middleware test helper
 */
export async function testMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void | Promise<void>,
  reqOptions: RequestMockOptions = {},
  resOptions: ResponseMockOptions = {}
): Promise<{
  req: MockRequest;
  res: MockResponse;
  next: jest.Mock;
  result: any;
}> {
  const { req, res, next } = createExpressMocks(reqOptions, resOptions);

  let result: any;
  try {
    result = await middleware(req as unknown as Request, res as unknown as Response, next);
  } catch (error) {
    result = { error };
  }

  return { req, res, next, result };
}

/**
 * Route handler test helper
 */
export async function testRouteHandler(
  handler: (req: Request, res: Response, next?: NextFunction) => void | Promise<void>,
  reqOptions: RequestMockOptions = {},
  resOptions: ResponseMockOptions = {}
): Promise<{
  req: MockRequest;
  res: MockResponse;
  next: jest.Mock;
  result: any;
}> {
  const { req, res, next } = createExpressMocks(reqOptions, resOptions);

  let result: any;
  try {
    result = await handler(req as unknown as Request, res as unknown as Response, next);
  } catch (error) {
    result = { error };
  }

  return { req, res, next, result };
}

/**
 * Error middleware test helper
 */
export async function testErrorMiddleware(
  middleware: (error: Error, req: Request, res: Response, next: NextFunction) => void | Promise<void>,
  error: Error,
  reqOptions: RequestMockOptions = {},
  resOptions: ResponseMockOptions = {}
): Promise<{
  req: MockRequest;
  res: MockResponse;
  next: jest.Mock;
  result: any;
}> {
  const { req, res, next } = createExpressMocks(reqOptions, resOptions);

  let result: any;
  try {
    result = await middleware(error, req as unknown as Request, res as unknown as Response, next);
  } catch (err) {
    result = { error: err };
  }

  return { req, res, next, result };
}

/**
 * Express app test utilities
 */
export class ExpressTestUtils {
  /**
   * Test middleware execution order
   */
  static async testMiddlewareOrder(
    middlewares: Array<(req: Request, res: Response, next: NextFunction) => void | Promise<void>>,
    reqOptions: RequestMockOptions = {}
  ): Promise<jest.Mock[]> {
    const { req, res } = createExpressMocks(reqOptions);
    const nexts: jest.Mock[] = [];

    for (let i = 0; i < middlewares.length; i++) {
      const next = jest.fn();
      nexts.push(next);
      
      await middlewares[i](req as unknown as Request, res as unknown as Response, next);
      
      if (i < middlewares.length - 1) {
        expect(next).toHaveBeenCalled();
      }
    }

    return nexts;
  }

  /**
   * Test middleware error handling
   */
  static async testMiddlewareErrorHandling(
    middleware: (req: Request, res: Response, next: NextFunction) => void | Promise<void>,
    shouldThrow = true,
    reqOptions: RequestMockOptions = {}
  ): Promise<{ error?: Error; next: jest.Mock }> {
    const { req, res, next } = createExpressMocks(reqOptions);

    let error: Error | undefined;
    try {
      await middleware(req as unknown as Request, res as unknown as Response, next);
    } catch (err) {
      error = err as Error;
    }

    if (shouldThrow) {
      expect(error).toBeDefined();
    } else {
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    }

    return { error, next };
  }
}
