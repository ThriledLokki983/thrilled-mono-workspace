/**
 * Simple Testing Utilities
 * Basic testing utilities that work without complex dependencies
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Simple Mock Data Factory
 */
export class SimpleMockFactory {
  private static sequence: Map<string, number> = new Map();

  /**
   * Get next sequence number for a given key
   */
  static getSequence(key: string): number {
    const current = this.sequence.get(key) || 0;
    const next = current + 1;
    this.sequence.set(key, next);
    return next;
  }

  /**
   * Reset sequences
   */
  static reset(): void {
    this.sequence.clear();
  }

  /**
   * Generate random string
   */
  static randomString(length = 8, prefix = ''): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random number within range
   */
  static randomNumber(min = 1, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random date within range
   */
  static randomDate(startDate?: Date, endDate?: Date): Date {
    const start = startDate || new Date(2020, 0, 1);
    const end = endDate || new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  /**
   * Create mock user
   */
  static createUser(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const sequence = this.getSequence('user');
    return {
      id: sequence,
      email: `user${sequence}@example.com`,
      name: `Test User ${sequence}`,
      role: 'user',
      createdAt: this.randomDate(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Create mock API response
   */
  static createApiResponse(data: unknown = null, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      success: true,
      data,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      request_id: this.randomString(16),
      ...overrides,
    };
  }

  /**
   * Create mock error response
   */
  static createErrorResponse(error: Record<string, unknown> = {}, overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      success: false,
      error: {
        code: 'GENERIC_ERROR',
        message: 'An error occurred',
        details: {},
        ...error,
      },
      timestamp: new Date().toISOString(),
      request_id: this.randomString(16),
      ...overrides,
    };
  }
}

/**
 * Simple Test Helpers
 */
export class SimpleTestHelpers {
  /**
   * Create a basic Jest setup
   * Note: This should be called at the top level of a test file, not inside a test case
   */
  static setupTest(options: { 
    beforeAll?: () => Promise<void> | void;
    afterAll?: () => Promise<void> | void;
    beforeEach?: () => Promise<void> | void;
    afterEach?: () => Promise<void> | void;
  } = {}): void {
    // Check if we're in a test environment and not inside a test case
    if (typeof jest !== 'undefined' && typeof beforeAll !== 'undefined') {
      if (options.beforeAll) {
        beforeAll(options.beforeAll);
      }
      if (options.afterAll) {
        afterAll(options.afterAll);
      }
      if (options.beforeEach) {
        beforeEach(options.beforeEach);
      }
      if (options.afterEach) {
        afterEach(options.afterEach);
      }
    }
  }

  /**
   * Create test setup configuration (for testing the setupTest method)
   */
  static createTestSetup(options: { 
    beforeAll?: () => Promise<void> | void;
    afterAll?: () => Promise<void> | void;
    beforeEach?: () => Promise<void> | void;
    afterEach?: () => Promise<void> | void;
  } = {}): { 
    beforeAll?: () => Promise<void> | void;
    afterAll?: () => Promise<void> | void;
    beforeEach?: () => Promise<void> | void;
    afterEach?: () => Promise<void> | void;
  } {
    return {
      beforeAll: options.beforeAll,
      afterAll: options.afterAll,
      beforeEach: options.beforeEach,
      afterEach: options.afterEach,
    };
  }

  /**
   * Create mock database connection
   */
  static createMockDb(): Record<string, unknown> {
    if (typeof jest !== 'undefined') {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) as jest.MockedFunction<(...args: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }>>;
      const mockRelease = jest.fn() as jest.MockedFunction<() => void>;
      const mockConnect = jest.fn().mockResolvedValue({
        query: mockQuery,
        release: mockRelease,
      }) as jest.MockedFunction<() => Promise<{ query: typeof mockQuery; release: typeof mockRelease }>>;
      const mockEnd = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<() => Promise<void>>;
      const mockOn = jest.fn() as jest.MockedFunction<(event: string, callback: (...args: unknown[]) => void) => void>;

      return {
        query: mockQuery,
        connect: mockConnect,
        end: mockEnd,
        on: mockOn,
      };
    } else {
      // Fallback for non-test environments
      return {
        query: async () => ({ rows: [], rowCount: 0 }),
        connect: async () => ({
          query: async () => ({ rows: [], rowCount: 0 }),
          release: () => {
            // Mock release function
          },
        }),
        end: async () => {
          // Mock end function
        },
        on: () => {
          // Mock event listener
        },
      };
    }
  }

  /**
   * Create mock Express request
   */
  static createMockRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    const mockReq: Record<string, unknown> = {
      params: {},
      query: {},
      body: {},
      headers: {},
      path: '/',
      method: 'GET',
      url: '/',
      ...overrides,
    };
    
    // Add methods after initial creation to avoid circular reference
    // Check if jest is available (test environment)
    if (typeof jest !== 'undefined') {
      mockReq.get = jest.fn((name: string) => (mockReq.headers as Record<string, string>)[name]);
      mockReq.header = jest.fn((name: string) => (mockReq.headers as Record<string, string>)[name]);
    } else {
      // Fallback for non-test environments
      mockReq.get = (name: string) => (mockReq.headers as Record<string, string>)[name];
      mockReq.header = (name: string) => (mockReq.headers as Record<string, string>)[name];
    }
    
    return mockReq;
  }

  /**
   * Create mock Express response
   */
  static createMockResponse(): Record<string, unknown> {
    if (typeof jest !== 'undefined') {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        get: jest.fn(),
        statusCode: 200,
        headersSent: false,
      };
      return res;
    } else {
      // Fallback for non-test environments
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const res = {
        status: function(code: number) { this.statusCode = code; return this; },
        json: function(_data: unknown) { return this; },
        send: function(_data: unknown) { return this; },
        set: function(_field: string, _value: string) { return this; },
        get: function(_field: string) { return undefined; },
        statusCode: 200,
        headersSent: false,
      };
      return res;
    }
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Assert that a value is truthy
   */
  static assertTruthy(value: unknown, message?: string): void {
    if (!value) {
      throw new Error(message || `Expected value to be truthy, but got: ${value}`);
    }
  }

  /**
   * Assert that values are equal
   */
  static assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, but got ${actual}`);
    }
  }
}

/**
 * Test utilities for environment setup
 */
export class TestEnvironment {
  private static envBackup: Record<string, string | undefined> = {};

  /**
   * Set environment variables for testing
   */
  static setEnv(env: Record<string, string>): void {
    for (const [key, value] of Object.entries(env)) {
      this.envBackup[key] = process.env[key];
      process.env[key] = value;
    }
  }

  /**
   * Restore original environment variables
   */
  static restoreEnv(): void {
    for (const [key, value] of Object.entries(this.envBackup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    this.envBackup = {};
  }

  /**
   * Create isolated test environment
   */
  static isolatedTest(
    testFn: () => Promise<void> | void,
    env: Record<string, string> = {}
  ): () => Promise<void> {
    return async () => {
      this.setEnv(env);
      try {
        await testFn();
      } finally {
        this.restoreEnv();
      }
    };
  }
}
