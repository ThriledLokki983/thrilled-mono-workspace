/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import request, { Test, Response as SuperTestResponse } from 'supertest';
import { Express } from 'express';
import { ApiTestConfig, ApiTestContext, HttpTestOptions } from '../types/api-test-types.js';

/**
 * HTTP Test Client
 * Provides a fluent interface for making HTTP requests in tests
 */
export class HttpTestClient {
  private app: Express;
  private context: ApiTestContext;
  private config: ApiTestConfig;

  constructor(app: Express, config: ApiTestConfig = {}) {
    this.app = app;
    this.config = config;
    this.context = {
      baseURL: config.baseURL || '',
      headers: config.headers ? { ...config.headers } : {},
      cookies: [],
      auth: config.auth,
    };
  }

  /**
   * Set authentication for subsequent requests
   */
  auth(type: 'bearer' | 'basic' | 'cookie', tokenOrCredentials: string | { username: string; password: string }): this {
    if (type === 'bearer') {
      this.context.headers['Authorization'] = `Bearer ${tokenOrCredentials}`;
    } else if (type === 'basic' && typeof tokenOrCredentials === 'object') {
      const credentials = Buffer.from(`${tokenOrCredentials.username}:${tokenOrCredentials.password}`).toString('base64');
      this.context.headers['Authorization'] = `Basic ${credentials}`;
    }
    return this;
  }

  /**
   * Set headers for subsequent requests
   */
  headers(headers: Record<string, string>): this {
    Object.assign(this.context.headers, headers);
    return this;
  }

  /**
   * Add a cookie
   */
  cookie(name: string, value: string): this {
    this.context.cookies.push(`${name}=${value}`);
    return this;
  }

  /**
   * Make a GET request
   */
  get(path: string, query?: Record<string, any>): TestRequestBuilder {
    return new TestRequestBuilder(this.app, 'GET', path, this.context)
      .query(query || {});
  }

  /**
   * Make a POST request
   */
  post(path: string, body?: any): TestRequestBuilder {
    return new TestRequestBuilder(this.app, 'POST', path, this.context)
      .send(body);
  }

  /**
   * Make a PUT request
   */
  put(path: string, body?: any): TestRequestBuilder {
    return new TestRequestBuilder(this.app, 'PUT', path, this.context)
      .send(body);
  }

  /**
   * Make a PATCH request
   */
  patch(path: string, body?: any): TestRequestBuilder {
    return new TestRequestBuilder(this.app, 'PATCH', path, this.context)
      .send(body);
  }

  /**
   * Make a DELETE request
   */
  delete(path: string): TestRequestBuilder {
    return new TestRequestBuilder(this.app, 'DELETE', path, this.context);
  }

  /**
   * Execute HTTP test options
   */
  async execute(options: HttpTestOptions): Promise<SuperTestResponse> {
    const builder = new TestRequestBuilder(this.app, options.method, options.path, this.context);

    if (options.body) {
      builder.send(options.body);
    }

    if (options.query) {
      builder.query(options.query);
    }

    if (options.headers) {
      builder.set(options.headers);
    }

    if (options.timeout) {
      builder.timeout(options.timeout);
    }

    const response = await builder.execute();

    // Apply expectations if provided
    if (options.expect) {
      if (options.expect.status) {
        expect(response.status).toBe(options.expect.status);
      }
      if (options.expect.body) {
        expect(response.body).toEqual(options.expect.body);
      }
      if (options.expect.headers) {
        Object.entries(options.expect.headers).forEach(([key, value]) => {
          expect(response.headers[key.toLowerCase()]).toBe(value);
        });
      }
    }

    return response;
  }
}

/**
 * Test Request Builder
 * Fluent interface for building and executing test requests
 */
export class TestRequestBuilder {
  private request: Test;
  private context: ApiTestContext;

  constructor(app: Express, method: string, path: string, context: ApiTestContext) {
    this.context = context;
    this.request = request(app)[method.toLowerCase() as keyof typeof request](path);

    // Apply context headers
    Object.entries(context.headers).forEach(([key, value]) => {
      this.request.set(key, value);
    });

    // Apply context cookies
    if (context.cookies.length > 0) {
      this.request.set('Cookie', context.cookies.join('; '));
    }
  }

  /**
   * Set request body
   */
  send(body: any): this {
    if (body !== undefined) {
      this.request.send(body);
    }
    return this;
  }

  /**
   * Set query parameters
   */
  query(query: Record<string, any>): this {
    this.request.query(query);
    return this;
  }

  /**
   * Set headers
   */
  set(headers: Record<string, string>): this;
  set(key: string, value: string): this;
  set(keyOrHeaders: string | Record<string, string>, value?: string): this {
    if (typeof keyOrHeaders === 'string' && value !== undefined) {
      this.request.set(keyOrHeaders, value);
    } else if (typeof keyOrHeaders === 'object') {
      Object.entries(keyOrHeaders).forEach(([k, v]) => {
        this.request.set(k, v);
      });
    }
    return this;
  }

  /**
   * Set request timeout
   */
  timeout(ms: number): this {
    this.request.timeout(ms);
    return this;
  }

  /**
   * Expect status code
   */
  expectStatus(status: number): this {
    this.request.expect(status);
    return this;
  }

  /**
   * Expect header
   */
  expectHeader(key: string, value: string | RegExp): this {
    this.request.expect(key, value as any);
    return this;
  }

  /**
   * Expect response body
   */
  expectBody(body: any): this {
    this.request.expect((res) => {
      expect(res.body).toEqual(body);
    });
    return this;
  }

  /**
   * Expect response body to match
   */
  expectBodyContains(value: any): this {
    this.request.expect((res) => {
      expect(res.body).toMatchObject(value);
    });
    return this;
  }

  /**
   * Add custom expectation
   */
  expect(assertion: (res: SuperTestResponse) => void): this {
    this.request.expect(assertion);
    return this;
  }

  /**
   * Execute the request
   */
  async execute(): Promise<SuperTestResponse> {
    return new Promise((resolve, reject) => {
      this.request.end((err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  }
}

/**
 * Create HTTP test client
 */
export function createHttpTestClient(app: Express, config: ApiTestConfig = {}): HttpTestClient {
  return new HttpTestClient(app, config);
}

/**
 * Quick test request helpers
 */
export class QuickTestRequests {
  private client: HttpTestClient;

  constructor(app: Express, config: ApiTestConfig = {}) {
    this.client = new HttpTestClient(app, config);
  }

  /**
   * Quick GET request test
   */
  async testGet(path: string, expectedStatus = 200, expectedBody?: any): Promise<SuperTestResponse> {
    const response = await this.client.get(path).execute();
    expect(response.status).toBe(expectedStatus);
    if (expectedBody) {
      expect(response.body).toEqual(expectedBody);
    }
    return response;
  }

  /**
   * Quick POST request test
   */
  async testPost(path: string, body: any, expectedStatus = 201, expectedBody?: any): Promise<SuperTestResponse> {
    const response = await this.client.post(path, body).execute();
    expect(response.status).toBe(expectedStatus);
    if (expectedBody) {
      expect(response.body).toEqual(expectedBody);
    }
    return response;
  }

  /**
   * Quick authenticated request test
   */
  async testAuthenticatedGet(path: string, token: string, expectedStatus = 200): Promise<SuperTestResponse> {
    const response = await this.client.auth('bearer', token).get(path).execute();
    expect(response.status).toBe(expectedStatus);
    return response;
  }

  /**
   * Test API endpoint with various status codes
   */
  async testEndpointStatusCodes(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): Promise<void> {
    // Test without auth (should be 401 if protected)
    try {
      if (method === 'GET') {
        await this.client.get(path).execute();
      } else if (method === 'POST') {
        await this.client.post(path).execute();
      } else if (method === 'PUT') {
        await this.client.put(path).execute();
      } else if (method === 'DELETE') {
        await this.client.delete(path).execute();
      }
    } catch {
      // Expected for protected endpoints
    }

    // Add more comprehensive endpoint testing logic here
  }
}
