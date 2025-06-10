import { Express } from 'express';
import { Response as SuperTestResponse } from 'supertest';
import { 
  IntegrationTestScenario, 
  IntegrationTestStep, 
  ApiTestContext,
  EndpointTestConfig,
  EndpointTestCase 
} from '../types/api-test-types.js';
import { HttpTestClient } from './http-client.js';
import { assertResponseOptions } from './response-assertions.js';

/**
 * Integration Test Runner
 * Executes complex integration test scenarios with multiple steps
 */
export class IntegrationTestRunner {
  private app: Express;
  private client: HttpTestClient;
  private context: ApiTestContext;
  private responseStore: Map<string, SuperTestResponse> = new Map();

  constructor(app: Express) {
    this.app = app;
    this.client = new HttpTestClient(app);
    this.context = {
      baseURL: '',
      headers: {},
      cookies: [],
    };
  }

  /**
   * Run a complete integration test scenario
   */
  async runScenario(scenario: IntegrationTestScenario): Promise<void> {
    console.log(`Running integration test scenario: ${scenario.name}`);
    
    try {
      // Setup
      if (scenario.setup) {
        await scenario.setup();
      }

      // Execute steps
      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        console.log(`  Step ${i + 1}: ${step.name}`);
        await this.executeStep(step);
      }

      console.log(`✓ Scenario completed: ${scenario.name}`);
    } catch (error) {
      console.error(`✗ Scenario failed: ${scenario.name}`, error);
      throw error;
    } finally {
      // Teardown
      if (scenario.teardown) {
        await scenario.teardown();
      }
    }
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: IntegrationTestStep): Promise<void> {
    // Before request hook
    if (step.beforeRequest) {
      await step.beforeRequest(this.context);
    }

    // Execute request
    const response = await this.client.execute(step.request);

    // Save response if requested
    if (step.saveResponse) {
      this.responseStore.set(step.saveResponse, response);
    }

    // Apply assertions
    if (step.assertions) {
      assertResponseOptions(response, step.assertions);
    }

    // After response hook
    if (step.afterResponse) {
      await step.afterResponse(response, this.context);
    }
  }

  /**
   * Get saved response
   */
  getResponse(name: string): SuperTestResponse | undefined {
    return this.responseStore.get(name);
  }

  /**
   * Update test context
   */
  updateContext(updates: Partial<ApiTestContext>): void {
    Object.assign(this.context, updates);
    
    // Update client with new context
    if (updates.headers) {
      this.client.headers(updates.headers);
    }
  }

  /**
   * Clear stored responses
   */
  clearResponses(): void {
    this.responseStore.clear();
  }
}

/**
 * Endpoint Test Runner
 * Tests individual API endpoints with multiple test cases
 */
export class EndpointTestRunner {
  private app: Express;
  private client: HttpTestClient;

  constructor(app: Express) {
    this.app = app;
    this.client = new HttpTestClient(app);
  }

  /**
   * Run all test cases for an endpoint
   */
  async runEndpointTests(config: EndpointTestConfig): Promise<void> {
    describe(`${config.method} ${config.endpoint}`, () => {
      config.testCases.forEach(testCase => {
        it(testCase.name, async () => {
          await this.runTestCase(config, testCase);
        });
      });
    });
  }

  /**
   * Run a single test case
   */
  private async runTestCase(config: EndpointTestConfig, testCase: EndpointTestCase): Promise<void> {
    try {
      // Setup
      if (testCase.setup) {
        await testCase.setup();
      }

      // Prepare request
      const request = {
        method: config.method as any,
        path: config.endpoint,
        body: testCase.request?.body,
        query: testCase.request?.query,
        headers: testCase.request?.headers,
        expect: {
          status: testCase.expected.status,
          body: testCase.expected.body,
          headers: testCase.expected.headers,
        },
      };

      // Execute request
      const response = await this.client.execute(request);

      // Additional assertions can be added here
      
    } finally {
      // Teardown
      if (testCase.teardown) {
        await testCase.teardown();
      }
    }
  }
}

/**
 * Workflow Test Runner
 * Tests complete user workflows across multiple endpoints
 */
export class WorkflowTestRunner {
  private app: Express;
  private runner: IntegrationTestRunner;

  constructor(app: Express) {
    this.app = app;
    this.runner = new IntegrationTestRunner(app);
  }

  /**
   * Test user registration and login workflow
   */
  async testAuthWorkflow(): Promise<void> {
    const scenario: IntegrationTestScenario = {
      name: 'User Authentication Workflow',
      description: 'Test complete user registration, login, and protected endpoint access',
      steps: [
        {
          name: 'Register new user',
          request: {
            method: 'POST',
            path: '/auth/register',
            body: {
              email: 'test@example.com',
              password: 'Password1!',
              name: 'Test User',
            },
          },
          assertions: {
            status: 201,
            body: {
              success: true,
              data: {
                user: {
                  email: 'test@example.com',
                  name: 'Test User',
                },
              },
            },
          },
          saveResponse: 'registration',
        },
        {
          name: 'Login with credentials',
          request: {
            method: 'POST',
            path: '/auth/login',
            body: {
              email: 'test@example.com',
              password: 'Password1!',
            },
          },
          assertions: {
            status: 200,
            body: {
              success: true,
            },
          },
          saveResponse: 'login',
          afterResponse: async (response, context) => {
            // Extract token and add to context
            const token = response.body.data.token;
            context.headers['Authorization'] = `Bearer ${token}`;
          },
        },
        {
          name: 'Access protected endpoint',
          request: {
            method: 'GET',
            path: '/auth/profile',
          },
          assertions: {
            status: 200,
            body: {
              success: true,
              data: {
                user: {
                  email: 'test@example.com',
                  name: 'Test User',
                },
              },
            },
          },
        },
        {
          name: 'Logout',
          request: {
            method: 'POST',
            path: '/auth/logout',
          },
          assertions: {
            status: 200,
            body: {
              success: true,
            },
          },
        },
        {
          name: 'Try accessing protected endpoint after logout',
          request: {
            method: 'GET',
            path: '/auth/profile',
          },
          assertions: {
            status: 401,
          },
        },
      ],
    };

    await this.runner.runScenario(scenario);
  }

  /**
   * Test CRUD operations workflow
   */
  async testCrudWorkflow(entityName: string, entityData: any): Promise<void> {
    const scenario: IntegrationTestScenario = {
      name: `${entityName} CRUD Workflow`,
      description: `Test complete CRUD operations for ${entityName}`,
      steps: [
        {
          name: `Create ${entityName}`,
          request: {
            method: 'POST',
            path: `/${entityName.toLowerCase()}`,
            body: entityData,
          },
          assertions: {
            status: 201,
          },
          saveResponse: 'created',
          afterResponse: async (response, context) => {
            // Save entity ID for subsequent operations
            (context as any).entityId = response.body.data.id;
          },
        },
        {
          name: `Get ${entityName} by ID`,
          request: {
            method: 'GET',
            path: `/${entityName.toLowerCase()}/{{entityId}}`,
          },
          beforeRequest: async (context) => {
            // Replace placeholder with actual ID
            const entityId = (context as any).entityId;
            context.headers['X-Entity-Id'] = entityId;
          },
          assertions: {
            status: 200,
          },
        },
        {
          name: `Update ${entityName}`,
          request: {
            method: 'PUT',
            path: `/${entityName.toLowerCase()}/{{entityId}}`,
            body: { ...entityData, name: `Updated ${entityName}` },
          },
          assertions: {
            status: 200,
          },
        },
        {
          name: `Delete ${entityName}`,
          request: {
            method: 'DELETE',
            path: `/${entityName.toLowerCase()}/{{entityId}}`,
          },
          assertions: {
            status: 200,
          },
        },
        {
          name: `Verify ${entityName} is deleted`,
          request: {
            method: 'GET',
            path: `/${entityName.toLowerCase()}/{{entityId}}`,
          },
          assertions: {
            status: 404,
          },
        },
      ],
    };

    await this.runner.runScenario(scenario);
  }

  /**
   * Test pagination workflow
   */
  async testPaginationWorkflow(endpoint: string): Promise<void> {
    const scenario: IntegrationTestScenario = {
      name: 'Pagination Workflow',
      description: 'Test pagination functionality',
      steps: [
        {
          name: 'Get first page',
          request: {
            method: 'GET',
            path: endpoint,
            query: { page: 1, limit: 10 },
          },
          assertions: {
            status: 200,
          },
          saveResponse: 'firstPage',
        },
        {
          name: 'Get second page',
          request: {
            method: 'GET',
            path: endpoint,
            query: { page: 2, limit: 10 },
          },
          assertions: {
            status: 200,
          },
          saveResponse: 'secondPage',
        },
        {
          name: 'Verify pagination metadata',
          request: {
            method: 'GET',
            path: endpoint,
            query: { page: 1, limit: 5 },
          },
          assertions: {
            status: 200,
          },
          afterResponse: async (response) => {
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(5);
          },
        },
      ],
    };

    await this.runner.runScenario(scenario);
  }
}

/**
 * Load Test Runner
 * Performs basic load testing on endpoints
 */
export class LoadTestRunner {
  private app: Express;
  private client: HttpTestClient;

  constructor(app: Express) {
    this.app = app;
    this.client = new HttpTestClient(app);
  }

  /**
   * Run concurrent requests to test load handling
   */
  async runLoadTest(endpoint: string, concurrency = 10, requests = 100): Promise<LoadTestResult> {
    const startTime = Date.now();
    const results: number[] = [];
    const errors: Error[] = [];

    const runBatch = async (batchSize: number) => {
      const promises = Array.from({ length: batchSize }, async () => {
        const requestStart = Date.now();
        try {
          await this.client.get(endpoint).execute();
          return Date.now() - requestStart;
        } catch (error) {
          errors.push(error as Error);
          return -1;
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults.filter(r => r > 0));
    };

    // Run requests in batches
    const batches = Math.ceil(requests / concurrency);
    for (let i = 0; i < batches; i++) {
      const batchSize = Math.min(concurrency, requests - i * concurrency);
      await runBatch(batchSize);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    return {
      totalRequests: requests,
      successfulRequests: results.length,
      failedRequests: errors.length,
      totalTime,
      averageResponseTime: results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0,
      minResponseTime: results.length > 0 ? Math.min(...results) : 0,
      maxResponseTime: results.length > 0 ? Math.max(...results) : 0,
      requestsPerSecond: results.length / (totalTime / 1000),
      errors,
    };
  }
}

/**
 * Load test result interface
 */
export interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTime: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errors: Error[];
}
