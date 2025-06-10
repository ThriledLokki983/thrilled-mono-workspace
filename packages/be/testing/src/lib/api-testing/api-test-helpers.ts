/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Express } from 'express';
import { Response as SuperTestResponse } from 'supertest';
import { HttpTestClient } from './http-client.js';
import { CommonAssertions } from './response-assertions.js';
import { AuthMockUtils } from '../mock-factories.js';

/**
 * API Test Helpers
 * Provides high-level utilities for common API testing patterns
 */
export class ApiTestHelpers {
  private client: HttpTestClient;

  constructor(app: Express) {
    this.client = new HttpTestClient(app);
  }

  /**
   * Test endpoint authentication requirements
   */
  async testAuthenticationRequired(method: string, path: string): Promise<void> {
    let response: SuperTestResponse;
    if (method.toLowerCase() === 'get') {
      response = await this.client.get(path).execute();
    } else if (method.toLowerCase() === 'post') {
      response = await this.client.post(path).execute();
    } else if (method.toLowerCase() === 'put') {
      response = await this.client.put(path).execute();
    } else if (method.toLowerCase() === 'delete') {
      response = await this.client.delete(path).execute();
    } else {
      response = await this.client.get(path).execute();
    }
    CommonAssertions.unauthorized(response);
  }

  /**
   * Test endpoint with valid authentication
   */
  async testWithAuth(method: string, path: string, token?: string, expectedStatus = 200): Promise<SuperTestResponse> {
    const authToken = token || AuthMockUtils.createMockJwtToken();
    let response: SuperTestResponse;
    
    if (method.toLowerCase() === 'get') {
      response = await this.client.auth('bearer', authToken).get(path).execute();
    } else if (method.toLowerCase() === 'post') {
      response = await this.client.auth('bearer', authToken).post(path).execute();
    } else if (method.toLowerCase() === 'put') {
      response = await this.client.auth('bearer', authToken).put(path).execute();
    } else if (method.toLowerCase() === 'delete') {
      response = await this.client.auth('bearer', authToken).delete(path).execute();
    } else {
      response = await this.client.auth('bearer', authToken).get(path).execute();
    }
    
    expect(response.status).toBe(expectedStatus);
    return response;
  }

  /**
   * Test endpoint with different user roles
   */
  async testRoleBasedAccess(
    method: string, 
    path: string, 
    roleTests: { role: string; expectedStatus: number }[]
  ): Promise<void> {
    for (const test of roleTests) {
      const token = AuthMockUtils.createMockJwtToken({ roles: [test.role] });
      let response: SuperTestResponse;
      
      if (method.toLowerCase() === 'get') {
        response = await this.client.auth('bearer', token).get(path).execute();
      } else if (method.toLowerCase() === 'post') {
        response = await this.client.auth('bearer', token).post(path).execute();
      } else if (method.toLowerCase() === 'put') {
        response = await this.client.auth('bearer', token).put(path).execute();
      } else if (method.toLowerCase() === 'delete') {
        response = await this.client.auth('bearer', token).delete(path).execute();
      } else {
        response = await this.client.auth('bearer', token).get(path).execute();
      }
      
      expect(response.status).toBe(test.expectedStatus);
    }
  }

  /**
   * Test input validation
   */
  async testInputValidation(
    method: string,
    path: string,
    validInput: any,
    invalidInputs: { input: any; expectedErrors: string[] }[]
  ): Promise<void> {
    // Test with valid input
    let validResponse: SuperTestResponse;
    if (method.toLowerCase() === 'post') {
      validResponse = await this.client.post(path, validInput).execute();
    } else if (method.toLowerCase() === 'put') {
      validResponse = await this.client.put(path, validInput).execute();
    } else if (method.toLowerCase() === 'patch') {
      validResponse = await this.client.patch(path, validInput).execute();
    } else {
      validResponse = await this.client.get(path).execute();
    }
    expect(validResponse.status).toBeLessThan(400);

    // Test with invalid inputs
    for (const test of invalidInputs) {
      let invalidResponse: SuperTestResponse;
      if (method.toLowerCase() === 'post') {
        invalidResponse = await this.client.post(path, test.input).execute();
      } else if (method.toLowerCase() === 'put') {
        invalidResponse = await this.client.put(path, test.input).execute();
      } else if (method.toLowerCase() === 'patch') {
        invalidResponse = await this.client.patch(path, test.input).execute();
      } else {
        invalidResponse = await this.client.get(path).execute();
      }
      
      CommonAssertions.validationError(invalidResponse, test.expectedErrors);
    }
  }

  /**
   * Test CRUD operations for a resource
   */
  async testCrudOperations(
    resourcePath: string,
    createData: any,
    updateData: any,
    authToken?: string
  ): Promise<{
    created: SuperTestResponse;
    retrieved: SuperTestResponse;
    updated: SuperTestResponse;
    deleted: SuperTestResponse;
  }> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    // Create
    const created = await this.client.post(resourcePath, createData).execute();
    CommonAssertions.apiCreated(created);
    const resourceId = created.body.data.id;

    // Read
    const retrieved = await this.client.get(`${resourcePath}/${resourceId}`).execute();
    CommonAssertions.apiSuccess(retrieved);

    // Update
    const updated = await this.client.put(`${resourcePath}/${resourceId}`, updateData).execute();
    CommonAssertions.apiSuccess(updated);

    // Delete
    const deleted = await this.client.delete(`${resourcePath}/${resourceId}`).execute();
    CommonAssertions.apiSuccess(deleted);

    // Verify deletion
    const notFound = await this.client.get(`${resourcePath}/${resourceId}`).execute();
    CommonAssertions.notFound(notFound);

    return { created, retrieved, updated, deleted };
  }

  /**
   * Test pagination
   */
  async testPagination(
    path: string,
    authToken?: string
  ): Promise<{
    firstPage: SuperTestResponse;
    secondPage: SuperTestResponse;
    lastPage: SuperTestResponse;
  }> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    // Get first page
    const firstPage = await this.client.get(path, { page: 1, limit: 10 }).execute();
    CommonAssertions.paginatedResponse(firstPage);

    // Get second page
    const secondPage = await this.client.get(path, { page: 2, limit: 10 }).execute();
    CommonAssertions.paginatedResponse(secondPage);

    // Get last page (if total is known)
    const totalPages = firstPage.body.pagination.totalPages;
    const lastPage = await this.client.get(path, { page: totalPages, limit: 10 }).execute();
    CommonAssertions.paginatedResponse(lastPage);

    return { firstPage, secondPage, lastPage };
  }

  /**
   * Test search functionality
   */
  async testSearch(
    path: string,
    searchTerms: { term: string; expectedCount?: number }[],
    authToken?: string
  ): Promise<SuperTestResponse[]> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    const results: SuperTestResponse[] = [];

    for (const { term, expectedCount } of searchTerms) {
      const response = await this.client.get(path, { search: term }).execute();
      CommonAssertions.apiSuccess(response);
      
      if (expectedCount !== undefined) {
        expect(response.body.data.length).toBe(expectedCount);
      }
      
      results.push(response);
    }

    return results;
  }

  /**
   * Test sorting functionality
   */
  async testSorting(
    path: string,
    sortFields: { field: string; order: 'asc' | 'desc' }[],
    authToken?: string
  ): Promise<SuperTestResponse[]> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    const results: SuperTestResponse[] = [];

    for (const { field, order } of sortFields) {
      const response = await this.client.get(path, { 
        sort: field, 
        order 
      }).execute();
      
      CommonAssertions.apiSuccess(response);
      
      // Verify sorting (basic check)
      if (response.body.data.length > 1) {
        const items = response.body.data;
        for (let i = 1; i < items.length; i++) {
          const prev = items[i - 1][field];
          const curr = items[i][field];
          
          if (order === 'asc') {
            expect(prev <= curr).toBe(true);
          } else {
            expect(prev >= curr).toBe(true);
          }
        }
      }
      
      results.push(response);
    }

    return results;
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(
    path: string,
    maxRequests: number,
    timeWindow: number,
    authToken?: string
  ): Promise<{
    successfulRequests: SuperTestResponse[];
    rateLimitedRequest: SuperTestResponse;
  }> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    const successfulRequests: SuperTestResponse[] = [];

    // Make requests up to the limit
    for (let i = 0; i < maxRequests; i++) {
      const response = await this.client.get(path).execute();
      expect(response.status).toBeLessThan(400);
      successfulRequests.push(response);
    }

    // Next request should be rate limited
    const rateLimitedRequest = await this.client.get(path).execute();
    expect(rateLimitedRequest.status).toBe(429); // Too Many Requests

    return { successfulRequests, rateLimitedRequest };
  }

  /**
   * Test error handling
   */
  async testErrorHandling(
    scenarios: {
      name: string;
      method: string;
      path: string;
      body?: any;
      expectedStatus: number;
      expectedError?: any;
    }[]
  ): Promise<SuperTestResponse[]> {
    const results: SuperTestResponse[] = [];

    for (const scenario of scenarios) {
      let response: SuperTestResponse;
      
      if (scenario.method.toLowerCase() === 'get') {
        response = await this.client.get(scenario.path).execute();
      } else if (scenario.method.toLowerCase() === 'post') {
        response = await this.client.post(scenario.path, scenario.body).execute();
      } else if (scenario.method.toLowerCase() === 'put') {
        response = await this.client.put(scenario.path, scenario.body).execute();
      } else if (scenario.method.toLowerCase() === 'patch') {
        response = await this.client.patch(scenario.path, scenario.body).execute();
      } else if (scenario.method.toLowerCase() === 'delete') {
        response = await this.client.delete(scenario.path).execute();
      } else {
        response = await this.client.get(scenario.path).execute();
      }

      expect(response.status).toBe(scenario.expectedStatus);
      
      if (scenario.expectedError) {
        expect(response.body.error).toMatchObject(scenario.expectedError);
      }

      results.push(response);
    }

    return results;
  }

  /**
   * Test file upload functionality
   */
  async testFileUpload(
    path: string,
    fileName: string,
    fileContent: Buffer,
    authToken?: string
  ): Promise<SuperTestResponse> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    // Note: This would need to be implemented with multipart/form-data support
    // For now, this is a placeholder for the interface
    throw new Error('File upload testing not yet implemented');
  }

  /**
   * Test concurrent requests
   */
  async testConcurrency(
    path: string,
    concurrentRequests: number,
    authToken?: string
  ): Promise<{
    responses: SuperTestResponse[];
    averageResponseTime: number;
    allSuccessful: boolean;
  }> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    const startTime = Date.now();
    const promises = Array.from({ length: concurrentRequests }, () =>
      this.client.get(path).execute()
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    const averageResponseTime = (endTime - startTime) / concurrentRequests;
    const allSuccessful = responses.every(r => r.status < 400);

    return { responses, averageResponseTime, allSuccessful };
  }

  /**
   * Test endpoint performance
   */
  async testPerformance(
    path: string,
    maxResponseTime: number,
    iterations = 10,
    authToken?: string
  ): Promise<{
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    allWithinLimit: boolean;
  }> {
    if (authToken) {
      this.client.auth('bearer', authToken);
    }

    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await this.client.get(path).execute();
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    }

    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTimeActual = Math.max(...responseTimes);
    const allWithinLimit = responseTimes.every(time => time <= maxResponseTime);

    return {
      averageResponseTime,
      minResponseTime,
      maxResponseTime: maxResponseTimeActual,
      allWithinLimit,
    };
  }
}

/**
 * Quick API test utilities
 */
export class QuickApiTests {
  private helpers: ApiTestHelpers;

  constructor(app: Express) {
    this.helpers = new ApiTestHelpers(app);
  }

  /**
   * Test complete REST endpoint
   */
  async testRestEndpoint(
    resourceName: string,
    basePath: string,
    sampleData: any,
    authToken?: string
  ): Promise<void> {
    describe(`${resourceName} REST API`, () => {
      it('should handle CRUD operations', async () => {
        await this.helpers.testCrudOperations(
          basePath,
          sampleData,
          { ...sampleData, name: `Updated ${sampleData.name}` },
          authToken
        );
      });

      it('should handle pagination', async () => {
        await this.helpers.testPagination(basePath, authToken);
      });

      it('should require authentication', async () => {
        await this.helpers.testAuthenticationRequired('GET', basePath);
        await this.helpers.testAuthenticationRequired('POST', basePath);
      });
    });
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints(): Promise<void> {
    describe('Authentication API', () => {
      it('should handle registration', async () => {
        await this.helpers.testInputValidation(
          'POST',
          '/auth/register',
          {
            email: 'test@example.com',
            password: 'Password1!',
            name: 'Test User',
          },
          [
            {
              input: { email: 'invalid-email' },
              expectedErrors: ['email'],
            },
            {
              input: { password: '123' },
              expectedErrors: ['password'],
            },
          ]
        );
      });

      it('should handle login', async () => {
        await this.helpers.testInputValidation(
          'POST',
          '/auth/login',
          {
            email: 'test@example.com',
            password: 'Password1!',
          },
          [
            {
              input: { email: '', password: '' },
              expectedErrors: ['email', 'password'],
            },
          ]
        );
      });
    });
  }
}
