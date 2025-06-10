/**
 * Example Usage of @thrilled/testing Package
 * 
 * This file demonstrates how to use the testing utilities provided by the package.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { 
  SimpleMockFactory, 
  SimpleTestHelpers,
  TestEnvironment 
} from '../src/index.js';

/**
 * Example: Basic Mock Data Generation
 */
function exampleMockData() {
  // Create mock users
  const user1 = SimpleMockFactory.createUser();
  const user2 = SimpleMockFactory.createUser({ name: 'Custom Name', role: 'admin' });
  
  console.log('Mock Users:', { user1, user2 });

  // Create API responses
  const successResponse = SimpleMockFactory.createApiResponse({ id: 1, name: 'Test' });
  const errorResponse = SimpleMockFactory.createErrorResponse({ 
    code: 'VALIDATION_ERROR', 
    message: 'Invalid input' 
  });
  
  console.log('API Responses:', { successResponse, errorResponse });

  // Generate random data
  const randomString = SimpleMockFactory.randomString(8, 'test_');
  const randomNumber = SimpleMockFactory.randomNumber(1, 100);
  const randomDate = SimpleMockFactory.randomDate();
  
  console.log('Random Data:', { randomString, randomNumber, randomDate });
}

/**
 * Example: Express Mocking
 */
function exampleExpressMocking() {
  // Create mock request and response objects
  const mockReq = SimpleTestHelpers.createMockRequest({
    params: { id: '1' },
    body: { name: 'Test User' },
    headers: { authorization: 'Bearer token123' }
  });
  
  const mockRes = SimpleTestHelpers.createMockResponse();
  
  console.log('Express Mocks:', { mockReq, mockRes });
  
  // Example middleware test
  const middleware = (req: any, res: any, next: any) => {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
  
  // Test the middleware
  const mockNext = jest.fn();
  middleware(mockReq, mockRes, mockNext);
  
  console.log('Middleware test completed');
}

/**
 * Example: Database Mocking
 */
function exampleDatabaseMocking() {
  const mockDb = SimpleTestHelpers.createMockDb();
  
  // Mock a database query
  (mockDb.query as jest.Mock).mockResolvedValue({
    rows: [
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' }
    ],
    rowCount: 2
  });
  
  console.log('Mock Database:', mockDb);
}

/**
 * Example: Test Environment Setup
 */
function exampleTestEnvironment() {
  // Set test environment variables
  TestEnvironment.setEnv({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    JWT_SECRET: 'test-secret'
  });
  
  console.log('Test environment set:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET
  });
  
  // Restore environment
  TestEnvironment.restoreEnv();
  
  console.log('Environment restored');
}

/**
 * Example: Jest Test Setup
 */
function exampleJestSetup() {
  // Setup test hooks
  SimpleTestHelpers.setupTest({
    beforeAll: async () => {
      console.log('Setting up test environment...');
      SimpleMockFactory.reset();
    },
    afterAll: async () => {
      console.log('Cleaning up test environment...');
    },
    beforeEach: async () => {
      console.log('Before each test...');
    },
    afterEach: async () => {
      console.log('After each test...');
    }
  });
}

/**
 * Example: Complete Test Suite
 */
export function createExampleTestSuite() {
  describe('User API Tests', () => {
    let mockDb: { query: jest.Mock };
    
    beforeAll(async () => {
      // Setup
      mockDb = SimpleTestHelpers.createMockDb() as { query: jest.Mock };
      TestEnvironment.setEnv({ NODE_ENV: 'test' });
    });
    
    afterAll(async () => {
      // Cleanup
      TestEnvironment.restoreEnv();
    });
    
    beforeEach(() => {
      // Reset mocks before each test
      SimpleMockFactory.reset();
      jest.clearAllMocks();
    });
    
    it('should create a user', async () => {
      // Arrange
      const userData = SimpleMockFactory.createUser({ 
        name: 'John Doe', 
        email: 'john@example.com' 
      });
      
      mockDb.query.mockResolvedValue({
        rows: [userData],
        rowCount: 1
      });
      
      // Act
      const result = await mockDb.query('INSERT INTO users...');
      
      // Assert
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
    
    it('should handle API errors', async () => {
      // Arrange
      const errorResponse = SimpleMockFactory.createErrorResponse({
        code: 'USER_NOT_FOUND',
        message: 'User does not exist'
      });
      
      // Test error handling
      expect(errorResponse.success).toBe(false);
      expect((errorResponse.error as { code: string }).code).toBe('USER_NOT_FOUND');
    });
    
    it('should test with isolated environment', 
      TestEnvironment.isolatedTest(async () => {
        // This test runs with isolated environment variables
        expect(process.env.NODE_ENV).toBe('test');
        
        const user = SimpleMockFactory.createUser();
        expect(user.id).toBeDefined();
        expect(user.email).toContain('@example.com');
      }, { 
        NODE_ENV: 'test',
        DEBUG: 'true'
      })
    );
  });
}

/**
 * Run examples (for demonstration)
 */
if (require.main === module) {
  console.log('=== @thrilled/testing Package Examples ===\n');
  
  console.log('1. Mock Data Generation:');
  exampleMockData();
  
  console.log('\n2. Express Mocking:');
  exampleExpressMocking();
  
  console.log('\n3. Database Mocking:');
  exampleDatabaseMocking();
  
  console.log('\n4. Test Environment:');
  exampleTestEnvironment();
  
  console.log('\n5. Jest Setup:');
  exampleJestSetup();
  
  console.log('\nFor complete test suite examples, see the createExampleTestSuite function.');
}
