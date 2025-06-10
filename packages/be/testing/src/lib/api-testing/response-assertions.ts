/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Response as SuperTestResponse } from 'supertest';
import { ResponseAssertionOptions, SchemaValidationOptions } from '../types/api-test-types.js';

/**
 * Response Assertions
 * Provides comprehensive response validation utilities for API testing
 */
export class ResponseAssertions {
  private response: SuperTestResponse;

  constructor(response: SuperTestResponse) {
    this.response = response;
  }

  /**
   * Assert status code
   */
  hasStatus(status: number | number[]): this {
    if (Array.isArray(status)) {
      expect(status).toContain(this.response.status);
    } else {
      expect(this.response.status).toBe(status);
    }
    return this;
  }

  /**
   * Assert content type
   */
  hasContentType(contentType: string | RegExp): this {
    if (typeof contentType === 'string') {
      expect(this.response.headers['content-type']).toContain(contentType);
    } else {
      expect(this.response.headers['content-type']).toMatch(contentType);
    }
    return this;
  }

  /**
   * Assert header exists and optionally matches value
   */
  hasHeader(name: string, value?: string | RegExp): this {
    const headerValue = this.response.headers[name.toLowerCase()];
    expect(headerValue).toBeDefined();
    
    if (value !== undefined) {
      if (typeof value === 'string') {
        expect(headerValue).toBe(value);
      } else {
        expect(headerValue).toMatch(value);
      }
    }
    return this;
  }

  /**
   * Assert multiple headers
   */
  hasHeaders(headers: Record<string, string | RegExp>): this {
    Object.entries(headers).forEach(([name, value]) => {
      this.hasHeader(name, value);
    });
    return this;
  }

  /**
   * Assert response body equals expected value
   */
  hasBody(expectedBody: any): this {
    expect(this.response.body).toEqual(expectedBody);
    return this;
  }

  /**
   * Assert response body contains specific properties
   */
  hasBodyContaining(expectedProperties: any): this {
    expect(this.response.body).toMatchObject(expectedProperties);
    return this;
  }

  /**
   * Assert response body contains text
   */
  hasBodyText(text: string | string[]): this {
    const bodyText = typeof this.response.body === 'string' 
      ? this.response.body 
      : JSON.stringify(this.response.body);
    
    if (Array.isArray(text)) {
      text.forEach(t => {
        expect(bodyText).toContain(t);
      });
    } else {
      expect(bodyText).toContain(text);
    }
    return this;
  }

  /**
   * Assert response body matches schema
   */
  hasValidSchema(schema: any, options: SchemaValidationOptions = {}): this {
    // This would integrate with a JSON schema validator like Ajv
    // For now, we'll do basic object structure validation
    this.validateObjectStructure(this.response.body, schema);
    return this;
  }

  /**
   * Assert response is successful (2xx status)
   */
  isSuccessful(): this {
    expect(this.response.status).toBeGreaterThanOrEqual(200);
    expect(this.response.status).toBeLessThan(300);
    return this;
  }

  /**
   * Assert response is an error (4xx or 5xx status)
   */
  isError(): this {
    expect(this.response.status).toBeGreaterThanOrEqual(400);
    return this;
  }

  /**
   * Assert response is client error (4xx status)
   */
  isClientError(): this {
    expect(this.response.status).toBeGreaterThanOrEqual(400);
    expect(this.response.status).toBeLessThan(500);
    return this;
  }

  /**
   * Assert response is server error (5xx status)
   */
  isServerError(): this {
    expect(this.response.status).toBeGreaterThanOrEqual(500);
    return this;
  }

  /**
   * Assert response time is within acceptable range
   */
  respondsWithin(maxTime: number): this {
    const responseTime = this.response.get('X-Response-Time') || '0ms';
    const time = parseInt(responseTime.replace('ms', ''));
    expect(time).toBeLessThanOrEqual(maxTime);
    return this;
  }

  /**
   * Assert response has pagination metadata
   */
  hasPagination(expectedPagination?: any): this {
    expect(this.response.body).toHaveProperty('pagination');
    
    if (expectedPagination) {
      expect(this.response.body.pagination).toMatchObject(expectedPagination);
    }
    
    // Common pagination properties
    const pagination = this.response.body.pagination;
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    
    return this;
  }

  /**
   * Assert response has error structure
   */
  hasErrorStructure(expectedError?: any): this {
    expect(this.response.body).toHaveProperty('success', false);
    expect(this.response.body).toHaveProperty('error');
    
    const error = this.response.body.error;
    expect(error).toHaveProperty('code');
    expect(error).toHaveProperty('message');
    
    if (expectedError) {
      expect(error).toMatchObject(expectedError);
    }
    
    return this;
  }

  /**
   * Assert response has success structure
   */
  hasSuccessStructure(expectedData?: any): this {
    expect(this.response.body).toHaveProperty('success', true);
    expect(this.response.body).toHaveProperty('data');
    
    if (expectedData) {
      expect(this.response.body.data).toMatchObject(expectedData);
    }
    
    return this;
  }

  /**
   * Assert response has validation error structure
   */
  hasValidationError(expectedFields?: string[]): this {
    this.hasErrorStructure();
    
    const error = this.response.body.error;
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error).toHaveProperty('details');
    expect(Array.isArray(error.details)).toBe(true);
    
    if (expectedFields) {
      const errorFields = error.details.map((detail: any) => detail.field);
      expectedFields.forEach(field => {
        expect(errorFields).toContain(field);
      });
    }
    
    return this;
  }

  /**
   * Assert response contains specific data array
   */
  hasDataArray(minLength?: number, maxLength?: number): this {
    expect(this.response.body).toHaveProperty('data');
    expect(Array.isArray(this.response.body.data)).toBe(true);
    
    if (minLength !== undefined) {
      expect(this.response.body.data.length).toBeGreaterThanOrEqual(minLength);
    }
    
    if (maxLength !== undefined) {
      expect(this.response.body.data.length).toBeLessThanOrEqual(maxLength);
    }
    
    return this;
  }

  /**
   * Apply custom assertion
   */
  satisfies(assertion: (response: SuperTestResponse) => void): this {
    assertion(this.response);
    return this;
  }

  /**
   * Basic object structure validation
   */
  private validateObjectStructure(obj: any, schema: any): void {
    if (typeof schema !== 'object' || schema === null) return;
    
    Object.keys(schema).forEach(key => {
      if (schema[key].required !== false) {
        expect(obj).toHaveProperty(key);
      }
      
      if (obj[key] !== undefined && schema[key].type) {
        expect(typeof obj[key]).toBe(schema[key].type);
      }
      
      if (obj[key] !== undefined && typeof schema[key] === 'object' && !schema[key].type) {
        this.validateObjectStructure(obj[key], schema[key]);
      }
    });
  }
}

/**
 * Create response assertions
 */
export function assertResponse(response: SuperTestResponse): ResponseAssertions {
  return new ResponseAssertions(response);
}

/**
 * Common response assertion patterns
 */
export class CommonAssertions {
  /**
   * Assert standard API success response
   */
  static apiSuccess(response: SuperTestResponse, expectedData?: any): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(200)
      .hasContentType(/json/)
      .hasSuccessStructure(expectedData);
  }

  /**
   * Assert standard API created response
   */
  static apiCreated(response: SuperTestResponse, expectedData?: any): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(201)
      .hasContentType(/json/)
      .hasSuccessStructure(expectedData);
  }

  /**
   * Assert standard API error response
   */
  static apiError(response: SuperTestResponse, expectedStatus = 400, expectedError?: any): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(expectedStatus)
      .hasContentType(/json/)
      .hasErrorStructure(expectedError);
  }

  /**
   * Assert standard validation error response
   */
  static validationError(response: SuperTestResponse, expectedFields?: string[]): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(400)
      .hasContentType(/json/)
      .hasValidationError(expectedFields);
  }

  /**
   * Assert unauthorized response
   */
  static unauthorized(response: SuperTestResponse): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(401)
      .hasContentType(/json/)
      .hasErrorStructure({ code: 'UNAUTHORIZED' });
  }

  /**
   * Assert forbidden response
   */
  static forbidden(response: SuperTestResponse): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(403)
      .hasContentType(/json/)
      .hasErrorStructure({ code: 'FORBIDDEN' });
  }

  /**
   * Assert not found response
   */
  static notFound(response: SuperTestResponse): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(404)
      .hasContentType(/json/)
      .hasErrorStructure({ code: 'NOT_FOUND' });
  }

  /**
   * Assert paginated response
   */
  static paginatedResponse(response: SuperTestResponse, expectedPagination?: any): ResponseAssertions {
    return assertResponse(response)
      .hasStatus(200)
      .hasContentType(/json/)
      .hasSuccessStructure()
      .hasDataArray()
      .hasPagination(expectedPagination);
  }
}

/**
 * Apply multiple assertions from options
 */
export function assertResponseOptions(response: SuperTestResponse, options: ResponseAssertionOptions): void {
  const assertions = assertResponse(response);

  if (options.status !== undefined) {
    assertions.hasStatus(options.status);
  }

  if (options.contentType) {
    assertions.hasContentType(options.contentType);
  }

  if (options.headers) {
    assertions.hasHeaders(options.headers);
  }

  if (options.body !== undefined) {
    assertions.hasBody(options.body);
  }

  if (options.bodyContains) {
    assertions.hasBodyText(options.bodyContains);
  }

  if (options.schema) {
    assertions.hasValidSchema(options.schema);
  }

  if (options.custom) {
    options.custom(response);
  }
}
