import request, { Response } from 'supertest';
import { Express } from 'express';

export interface SimpleHttpTestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  expect?: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  };
}

export class SimpleHttpTestClient {
  private app: Express;
  private baseHeaders: Record<string, string>;

  constructor(app: Express, options: SimpleHttpTestOptions = {}) {
    this.app = app;
    this.baseHeaders = options.headers || {};
  }

  async get(path: string, options: SimpleHttpTestOptions = {}): Promise<Response> {
    const req = request(this.app)
      .get(path)
      .set({ ...this.baseHeaders, ...options.headers });
    
    if (options.timeout) {
      req.timeout(options.timeout);
    }

    return req;
  }

  async post(path: string, body?: any, options: SimpleHttpTestOptions = {}): Promise<Response> {
    const req = request(this.app)
      .post(path)
      .set({ ...this.baseHeaders, ...options.headers });
    
    if (body) {
      req.send(body);
    }
    
    if (options.timeout) {
      req.timeout(options.timeout);
    }

    return req;
  }

  async put(path: string, body?: any, options: SimpleHttpTestOptions = {}): Promise<Response> {
    const req = request(this.app)
      .put(path)
      .set({ ...this.baseHeaders, ...options.headers });
    
    if (body) {
      req.send(body);
    }
    
    if (options.timeout) {
      req.timeout(options.timeout);
    }

    return req;
  }

  async delete(path: string, options: SimpleHttpTestOptions = {}): Promise<Response> {
    const req = request(this.app)
      .delete(path)
      .set({ ...this.baseHeaders, ...options.headers });
    
    if (options.timeout) {
      req.timeout(options.timeout);
    }

    return req;
  }

  withAuth(token: string): SimpleHttpTestClient {
    return new SimpleHttpTestClient(this.app, {
      headers: {
        ...this.baseHeaders,
        'Authorization': `Bearer ${token}`
      }
    });
  }

  withHeaders(headers: Record<string, string>): SimpleHttpTestClient {
    return new SimpleHttpTestClient(this.app, {
      headers: {
        ...this.baseHeaders,
        ...headers
      }
    });
  }
}

export class SimpleResponseAssertions {
  constructor(private response: Response) {}

  static assert(response: Response): SimpleResponseAssertions {
    return new SimpleResponseAssertions(response);
  }

  hasStatus(status: number): this {
    if (this.response.status !== status) {
      throw new Error(`Expected status ${status}, got ${this.response.status}`);
    }
    return this;
  }

  hasSuccessStatus(): this {
    if (this.response.status < 200 || this.response.status >= 300) {
      throw new Error(`Expected success status (200-299), got ${this.response.status}`);
    }
    return this;
  }

  hasErrorStatus(): this {
    if (this.response.status < 400) {
      throw new Error(`Expected error status (400+), got ${this.response.status}`);
    }
    return this;
  }

  hasContentType(contentType: string): this {
    const actualContentType = this.response.headers['content-type'];
    if (!actualContentType || !actualContentType.includes(contentType)) {
      throw new Error(`Expected content-type to include ${contentType}, got ${actualContentType}`);
    }
    return this;
  }

  hasJsonBody(): this {
    return this.hasContentType('application/json');
  }

  hasBodyProperty(property: string, value?: any): this {
    const body = this.response.body;
    if (!body || typeof body !== 'object') {
      throw new Error('Response body is not an object');
    }
    
    if (!(property in body)) {
      throw new Error(`Expected body to have property '${property}'`);
    }
    
    if (value !== undefined && body[property] !== value) {
      throw new Error(`Expected body.${property} to be ${value}, got ${body[property]}`);
    }
    
    return this;
  }

  hasBodyMatching(expectedBody: any): this {
    const body = this.response.body;
    if (JSON.stringify(body) !== JSON.stringify(expectedBody)) {
      throw new Error(`Expected body to match ${JSON.stringify(expectedBody)}, got ${JSON.stringify(body)}`);
    }
    return this;
  }
}

export interface SimpleApiTestCase {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: any;
  headers?: Record<string, string>;
  expectedStatus: number;
  expectedBody?: any;
  auth?: string;
}

export class SimpleApiTestRunner {
  constructor(private client: SimpleHttpTestClient) {}

  async runTestCase(testCase: SimpleApiTestCase): Promise<void> {
    let client = this.client;
    
    if (testCase.auth) {
      client = client.withAuth(testCase.auth);
    }
    
    if (testCase.headers) {
      client = client.withHeaders(testCase.headers);
    }

    let response: Response;
    
    switch (testCase.method) {
      case 'GET':
        response = await client.get(testCase.path);
        break;
      case 'POST':
        response = await client.post(testCase.path, testCase.body);
        break;
      case 'PUT':
        response = await client.put(testCase.path, testCase.body);
        break;
      case 'DELETE':
        response = await client.delete(testCase.path);
        break;
      default:
        throw new Error(`Unsupported method: ${testCase.method}`);
    }

    const assertions = SimpleResponseAssertions.assert(response);
    assertions.hasStatus(testCase.expectedStatus);
    
    if (testCase.expectedBody) {
      assertions.hasBodyMatching(testCase.expectedBody);
    }
  }

  async runTestCases(testCases: SimpleApiTestCase[]): Promise<void> {
    for (const testCase of testCases) {
      await this.runTestCase(testCase);
    }
  }
}
