import { Response as SupertestResponse } from 'supertest';

// Type alias for cleaner usage
export type TestResponse = SupertestResponse;

/**
 * API test configuration
 */
export interface ApiTestConfig {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'cookie';
    token?: string;
    username?: string;
    password?: string;
  };
  headers?: Record<string, string>;
}

/**
 * API test context
 */
export interface ApiTestContext {
  baseURL: string;
  headers: Record<string, string>;
  cookies: string[];
  auth?: any;
}

/**
 * HTTP test request options
 */
export interface HttpTestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: any;
  query?: Record<string, any>;
  headers?: Record<string, string>;
  auth?: any;
  timeout?: number;
  expect?: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
    schema?: any;
  };
}

/**
 * Response assertion options
 */
export interface ResponseAssertionOptions {
  status?: number | number[];
  contentType?: string;
  headers?: Record<string, string | RegExp>;
  body?: any;
  bodyContains?: string | string[];
  schema?: any;
  custom?: (response: TestResponse) => void;
}

/**
 * JSON schema validation options
 */
export interface SchemaValidationOptions {
  strict?: boolean;
  allowAdditionalProperties?: boolean;
  coerceTypes?: boolean;
}

/**
 * Integration test scenario
 */
export interface IntegrationTestScenario {
  name: string;
  description?: string;
  steps: IntegrationTestStep[];
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}

/**
 * Integration test step
 */
export interface IntegrationTestStep {
  name: string;
  request: HttpTestOptions;
  assertions?: ResponseAssertionOptions;
  saveResponse?: string; // Variable name to save response
  beforeRequest?: (context: ApiTestContext) => Promise<void>;
  afterResponse?: (response: TestResponse, context: ApiTestContext) => Promise<void>;
}

/**
 * API endpoint test configuration
 */
export interface EndpointTestConfig {
  endpoint: string;
  method: string;
  auth?: boolean;
  validation?: {
    request?: any;
    response?: any;
  };
  testCases: EndpointTestCase[];
}

/**
 * API endpoint test case
 */
export interface EndpointTestCase {
  name: string;
  description?: string;
  request?: {
    body?: any;
    query?: any;
    params?: any;
    headers?: Record<string, string>;
  };
  expected: {
    status: number;
    body?: any;
    headers?: Record<string, string>;
  };
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
}
