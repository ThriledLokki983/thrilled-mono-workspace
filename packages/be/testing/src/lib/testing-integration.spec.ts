/**
 * Integration test for @thrilled/testing package
 * This test verifies that all working features function correctly
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { 
  SimpleMockFactory, 
  SimpleTestHelpers,
  TestEnvironment 
} from '../index';

describe('@thrilled/testing Package Integration', () => {
  beforeEach(() => {
    SimpleMockFactory.reset();
  });

  afterEach(() => {
    TestEnvironment.restoreEnv();
  });

  describe('SimpleMockFactory', () => {
    it('should create mock users with default values', () => {
      const user = SimpleMockFactory.createUser();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      
      expect(typeof user.id).toBe('number');
      expect(typeof user.name).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(user.email).toContain('@example.com');
    });

    it('should create mock users with overrides', () => {
      const user = SimpleMockFactory.createUser({
        name: 'John Doe',
        email: 'john@custom.com',
        role: 'admin'
      });
      
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@custom.com');
      expect(user.role).toBe('admin');
    });

    it('should create unique sequential IDs', () => {
      const user1 = SimpleMockFactory.createUser();
      const user2 = SimpleMockFactory.createUser();
      const user3 = SimpleMockFactory.createUser();
      
      expect(user1.id).toBe(1);
      expect(user2.id).toBe(2);
      expect(user3.id).toBe(3);
    });

    it('should reset sequences', () => {
      SimpleMockFactory.createUser();
      SimpleMockFactory.createUser();
      
      SimpleMockFactory.reset();
      
      const user = SimpleMockFactory.createUser();
      expect(user.id).toBe(1);
    });

    it('should create API success responses', () => {
      const response = SimpleMockFactory.createApiResponse({ message: 'Success' });
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'Success' });
      expect(response).toHaveProperty('timestamp');
    });

    it('should create API error responses', () => {
      const response = SimpleMockFactory.createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid input'
      });
      
      expect(response.success).toBe(false);
      expect((response as any).error.code).toBe('VALIDATION_ERROR');
      expect((response as any).error.message).toBe('Invalid input');
      expect(response).toHaveProperty('timestamp');
    });

    it('should generate random strings', () => {
      const str1 = SimpleMockFactory.randomString();
      const str2 = SimpleMockFactory.randomString(10);
      const str3 = SimpleMockFactory.randomString(5, 'test_');
      
      expect(typeof str1).toBe('string');
      expect(str1.length).toBe(8); // default length
      
      expect(str2.length).toBe(10);
      
      expect(str3.length).toBe(10); // 5 + 'test_'.length
      expect(str3.startsWith('test_')).toBe(true);
    });

    it('should generate random numbers', () => {
      const num1 = SimpleMockFactory.randomNumber();
      const num2 = SimpleMockFactory.randomNumber(10, 20);
      
      expect(typeof num1).toBe('number');
      expect(num1).toBeGreaterThanOrEqual(1);
      expect(num1).toBeLessThanOrEqual(100);
      
      expect(num2).toBeGreaterThanOrEqual(10);
      expect(num2).toBeLessThanOrEqual(20);
    });

    it('should generate random dates', () => {
      const date = SimpleMockFactory.randomDate();
      
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('SimpleTestHelpers', () => {
    it('should create mock request objects', () => {
      const mockReq = SimpleTestHelpers.createMockRequest({
        params: { id: '123' },
        body: { name: 'Test User' },
        query: { filter: 'active' },
        headers: { authorization: 'Bearer token' }
      });
      
      expect(mockReq.params).toEqual({ id: '123' });
      expect(mockReq.body).toEqual({ name: 'Test User' });
      expect(mockReq.query).toEqual({ filter: 'active' });
      expect(mockReq.headers).toEqual({ authorization: 'Bearer token' });
      
      // Test methods
      expect(typeof mockReq.get).toBe('function');
      expect(typeof mockReq.header).toBe('function');
    });

    it('should create mock response objects', () => {
      const mockRes = SimpleTestHelpers.createMockResponse();
      
      expect(typeof mockRes.status).toBe('function');
      expect(typeof mockRes.json).toBe('function');
      expect(typeof mockRes.send).toBe('function');
      expect(typeof mockRes.set).toBe('function');
      
      // Test chaining
      const result = (mockRes as any).status(200);
      expect(result).toBe(mockRes);
    });

    it('should create mock database objects', () => {
      const mockDb = SimpleTestHelpers.createMockDb();
      
      expect(mockDb).toHaveProperty('query');
      expect(typeof (mockDb as any).query).toBe('function');
      expect((mockDb as any).query.mockResolvedValue).toBeDefined();
      expect((mockDb as any).query.mockRejectedValue).toBeDefined();
    });

    it('should setup test lifecycle hooks', () => {
      const hooks = {
        beforeAll: jest.fn(),
        afterAll: jest.fn(),
        beforeEach: jest.fn(),
        afterEach: jest.fn()
      };
      
      // Test the test setup configuration creation (doesn't register hooks)
      const setupConfig = SimpleTestHelpers.createTestSetup(hooks);
      
      // Verify the configuration is properly created
      expect(setupConfig.beforeAll).toBe(hooks.beforeAll);
      expect(setupConfig.afterAll).toBe(hooks.afterAll);
      expect(setupConfig.beforeEach).toBe(hooks.beforeEach);
      expect(setupConfig.afterEach).toBe(hooks.afterEach);
    });
  });

  describe('TestEnvironment', () => {
    it('should set environment variables', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      TestEnvironment.setEnv({
        NODE_ENV: 'test',
        TEST_VAR: 'test-value',
        CUSTOM_VAR: 'custom-value'
      });
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.TEST_VAR).toBe('test-value');
      expect(process.env.CUSTOM_VAR).toBe('custom-value');
      
      TestEnvironment.restoreEnv();
      
      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
      expect(process.env.TEST_VAR).toBeUndefined();
      expect(process.env.CUSTOM_VAR).toBeUndefined();
    });

    it('should handle isolated test execution', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      
      await TestEnvironment.isolatedTest(async () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.ISOLATED_VAR).toBe('isolated-value');
        
        // Change something inside the test
        process.env.TEMP_VAR = 'temp';
      }, {
        NODE_ENV: 'test',
        ISOLATED_VAR: 'isolated-value'
      });
      
      // Verify environment is restored
      expect(process.env.NODE_ENV).toBe(originalNodeEnv);
      expect(process.env.ISOLATED_VAR).toBeUndefined();
      expect(process.env.TEMP_VAR).toBeUndefined();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work together in a complete test scenario', async () => {
      // Setup test environment
      TestEnvironment.setEnv({
        NODE_ENV: 'test',
        DB_NAME: 'test_db'
      });
      
      // Create test data
      const user = SimpleMockFactory.createUser({
        name: 'Integration User',
        email: 'integration@test.com'
      });
      
      // Setup mocks
      const mockReq = SimpleTestHelpers.createMockRequest({
        body: user,
        headers: { 'content-type': 'application/json' }
      });
      
      const mockRes = SimpleTestHelpers.createMockResponse();
      const mockDb = SimpleTestHelpers.createMockDb();
      
      // Mock database response
      (mockDb as any).query.mockResolvedValue({
        rows: [user],
        rowCount: 1
      });
      
      // Simulate middleware/handler logic
      const createUserHandler = async (req: any, res: any) => {
        const userData = req.body;
        const result = await (mockDb as any).query('INSERT INTO users...', [userData]);
        
        if (result.rowCount > 0) {
          const response = SimpleMockFactory.createApiResponse(result.rows[0]);
          res.status(201).json(response);
        } else {
          const errorResponse = SimpleMockFactory.createErrorResponse({
            code: 'CREATE_FAILED',
            message: 'Failed to create user'
          });
          res.status(500).json(errorResponse);
        }
      };
      
      // Execute the handler
      await createUserHandler(mockReq, mockRes);
      
      // Verify results
      expect((mockDb as any).query).toHaveBeenCalledWith('INSERT INTO users...', [user]);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: user
        })
      );
      
      // Cleanup
      TestEnvironment.restoreEnv();
    });

    it('should handle error scenarios', () => {
      const mockDb = SimpleTestHelpers.createMockDb();
      
      // Mock database error
      (mockDb as any).query.mockRejectedValue(new Error('Connection failed'));
      
      const errorResponse = SimpleMockFactory.createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Connection failed'
      });
      
      expect(errorResponse.success).toBe(false);
      expect((errorResponse as any).error.code).toBe('DATABASE_ERROR');
      expect((errorResponse as any).error.message).toBe('Connection failed');
    });
  });
});
