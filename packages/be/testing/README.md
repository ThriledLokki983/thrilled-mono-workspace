# @thrilled/testing

A comprehensive testing utilities package for the Thrilled Backend Framework. This package provides a collection of testing tools including mock data factories, Express testing helpers, database testing utilities, and test environment management.

## ✅ Current Status

**Working Features:**
- ✅ Basic mock data generation (`SimpleMockFactory`)
- ✅ Express request/response mocking (`SimpleTestHelpers`)
- ✅ Test environment variable management (`TestEnvironment`)
- ✅ Package builds and tests successfully
- ✅ TypeScript support with proper type definitions

**In Development:**
- 🚧 Advanced API testing utilities
- 🚧 Database testing helpers
- 🚧 Service mocking with TypeDI integration
- 🚧 Integration test runners

## Installation

```bash
yarn add @thrilled/testing
```

## Quick Start

### Basic Test Setup

```typescript
import { 
  TestSetupManager, 
  DatabaseTestHelper, 
  TestAppFactory 
} from '@thrilled/testing';

describe('User API Tests', () => {
  let testApp: TestAppInstance;
  
  beforeAll(async () => {
    // Create test application with database
    testApp = await TestAppFactory.create({
      database: {
        database: 'test_db',
        resetBetweenTests: true,
      },
      enableLogging: false,
    });
    
    await testApp.start();
  });
  
  afterAll(async () => {
    await testApp.stop();
  });
  
  beforeEach(async () => {
    await testApp.resetDatabase();
  });
  
  it('should create a user', async () => {
    // Your test code here
  });
});
```

### Working Simple Testing Utilities

The package provides basic testing utilities that work out of the box:

#### SimpleMockFactory

Generate mock data with sequences and random values:

```typescript
import { SimpleMockFactory } from '@thrilled/testing';

// Reset sequences for clean tests
SimpleMockFactory.reset();

// Generate mock users with auto-incrementing IDs
const user1 = SimpleMockFactory.createUser();
const user2 = SimpleMockFactory.createUser({ role: 'admin' });

// Generate random data
const randomString = SimpleMockFactory.randomString(12, 'test_');
const randomNumber = SimpleMockFactory.randomNumber(1, 100);
const randomDate = SimpleMockFactory.randomDate();

// Create API responses
const successResponse = SimpleMockFactory.createApiResponse({ users: [user1, user2] });
const errorResponse = SimpleMockFactory.createErrorResponse({
  code: 'VALIDATION_ERROR',
  message: 'Invalid input'
});
```

#### SimpleTestHelpers

Mock Express requests/responses and set up test lifecycle:

```typescript
import { SimpleTestHelpers } from '@thrilled/testing';

// Set up test lifecycle hooks (call at top level of test file)
SimpleTestHelpers.setupTest({
  beforeAll: async () => {
    console.log('Setting up tests...');
  },
  afterAll: async () => {
    console.log('Cleaning up tests...');
  },
  beforeEach: () => {
    console.log('Before each test...');
  },
  afterEach: () => {
    console.log('After each test...');
  }
});

// Mock Express request/response objects
const mockReq = SimpleTestHelpers.createMockRequest({
  params: { id: '123' },
  body: { name: 'John Doe' },
  headers: { authorization: 'Bearer token' }
});

const mockRes = SimpleTestHelpers.createMockResponse();

// Mock database connections
const mockDb = SimpleTestHelpers.createMockDb();

// Test utilities
await SimpleTestHelpers.wait(100); // Wait 100ms
SimpleTestHelpers.assertTruthy(value, 'Value should be truthy');
SimpleTestHelpers.assertEqual(actual, expected, 'Values should match');
```

#### TestEnvironment

Manage environment variables in tests:

```typescript
import { TestEnvironment } from '@thrilled/testing';

describe('Environment Tests', () => {
  it('should set and restore environment variables', () => {
    const originalValue = process.env.NODE_ENV;
    
    TestEnvironment.setEnv({
      NODE_ENV: 'test',
      API_KEY: 'test-key'
    });
    
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.API_KEY).toBe('test-key');
    
    TestEnvironment.restoreEnv();
    
    expect(process.env.NODE_ENV).toBe(originalValue);
    expect(process.env.API_KEY).toBeUndefined();
  });
  
  it('should run test in isolated environment', async () => {
    const isolatedTest = TestEnvironment.isolatedTest(
      async () => {
        expect(process.env.TEST_MODE).toBe('isolated');
        // Your test code here
      },
      { TEST_MODE: 'isolated' }
    );
    
    await isolatedTest();
  });
});
```

### API Testing

```typescript
import { 
  createHttpTestClient, 
  CommonAssertions,
  ApiTestHelpers 
} from '@thrilled/testing';

describe('User API', () => {
  let client: HttpTestClient;
  let apiHelpers: ApiTestHelpers;
  
  beforeAll(async () => {
    const app = await createTestApp();
    client = createHttpTestClient(app);
    apiHelpers = new ApiTestHelpers(app);
  });
  
  it('should handle CRUD operations', async () => {
    await apiHelpers.testCrudOperations(
      '/users',
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Doe' }
    );
  });
  
  it('should require authentication', async () => {
    const response = await client.get('/users/profile').execute();
    CommonAssertions.unauthorized(response);
  });
  
  it('should validate input', async () => {
    await apiHelpers.testInputValidation(
      'POST',
      '/users',
      { name: 'John', email: 'john@example.com' },
      [
        {
          input: { email: 'invalid-email' },
          expectedErrors: ['email']
        }
      ]
    );
  });
});
```

### Mock Factories

```typescript
import { 
  createMockUser, 
  MockFactory, 
  AuthMockUtils 
} from '@thrilled/testing';

describe('User Service', () => {
  it('should create user with mock data', () => {
    const user = createMockUser({
      email: 'test@example.com',
      role: 'admin'
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('admin');
  });
  
  it('should generate multiple users', () => {
    const users = MockFactory.generateMultiple(createMockUser, 5, {
      sequence: true
    });
    
    expect(users).toHaveLength(5);
    expect(users[0].id).toBe(1);
    expect(users[4].id).toBe(5);
  });
  
  it('should create auth token', () => {
    const token = AuthMockUtils.createMockJwtToken({
      userId: 'user-123',
      roles: ['admin']
    });
    
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});
```

### Database Testing

```typescript
import { 
  DatabaseTestHelper, 
  TestDatabaseConfig 
} from '@thrilled/testing';

describe('Database Operations', () => {
  let database: DatabaseManager;
  
  beforeAll(async () => {
    const config: TestDatabaseConfig = {
      database: 'test_db',
      resetBetweenTests: true,
    };
    
    database = await DatabaseTestHelper.setupTestDatabase(config);
  });
  
  beforeEach(async () => {
    await DatabaseTestHelper.clearAllTables(database);
  });
  
  it('should seed test data', async () => {
    await DatabaseTestHelper.seedTestData(database, {
      users: [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ]
    });
    
    const count = await DatabaseTestHelper.getTableRowCount(database, 'users');
    expect(count).toBe(2);
  });
  
  it('should execute in transaction', async () => {
    await DatabaseTestHelper.withTestTransaction(database, async (client) => {
      await client.query('INSERT INTO users (name) VALUES ($1)', ['Test']);
      const result = await client.query('SELECT COUNT(*) FROM users');
      expect(result.rows[0].count).toBe('1');
      // Transaction will be rolled back automatically
    });
    
    // Verify rollback
    const count = await DatabaseTestHelper.getTableRowCount(database, 'users');
    expect(count).toBe(0);
  });
});
```

### Service Mocking

```typescript
import { 
  serviceMockManager, 
  CommonServiceMocks 
} from '@thrilled/testing';

describe('User Service with Mocks', () => {
  beforeEach(() => {
    serviceMockManager.restoreAll();
  });
  
  it('should mock database service', () => {
    const mockDb = CommonServiceMocks.createMockDatabase();
    mockDb.query.mockResolvedValue({ 
      rows: [{ id: 1, name: 'John' }], 
      rowCount: 1 
    });
    
    serviceMockManager.mockService('databaseManager', mockDb);
    
    // Test your service that uses the database
  });
  
  it('should mock multiple services', () => {
    const mockCache = CommonServiceMocks.createMockCache();
    const mockEmail = CommonServiceMocks.createMockEmailService();
    
    serviceMockManager.mockService('cacheManager', mockCache);
    serviceMockManager.mockService('emailService', mockEmail);
    
    // Test your service with mocked dependencies
  });
});
```

### Integration Testing

```typescript
import { 
  IntegrationTestRunner, 
  WorkflowTestRunner 
} from '@thrilled/testing';

describe('User Workflow Integration', () => {
  let workflowRunner: WorkflowTestRunner;
  
  beforeAll(async () => {
    const app = await createTestApp();
    workflowRunner = new WorkflowTestRunner(app);
  });
  
  it('should complete authentication workflow', async () => {
    await workflowRunner.testAuthWorkflow();
  });
  
  it('should complete CRUD workflow', async () => {
    await workflowRunner.testCrudWorkflow('User', {
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
  
  it('should test pagination', async () => {
    await workflowRunner.testPaginationWorkflow('/users');
  });
});
```

## API Reference

### Test App Factory

#### `TestAppFactory`

Factory for creating Express applications configured for testing.

```typescript
class TestAppFactory {
  static async create(config?: TestAppConfig): Promise<TestAppInstance>
  static async createNamed(name: string, config?: TestAppConfig): Promise<TestAppInstance>
  static getInstance(name: string): TestAppInstance | undefined
  static async destroyInstance(name: string): Promise<void>
  static async destroyAll(): Promise<void>
}
```

#### `TestAppInstance`

```typescript
interface TestAppInstance {
  app: Express
  database?: DatabaseManager
  cache?: CacheManager
  logger: Logger
  port: number
  baseUrl: string
  
  start(): Promise<void>
  stop(): Promise<void>
  resetDatabase(): Promise<void>
  resetCache(): Promise<void>
  getConnection(): Pool
}
```

### Database Test Helpers

#### `DatabaseTestHelper`

Utilities for database testing including setup, teardown, and data management.

```typescript
class DatabaseTestHelper {
  static createTestConfig(overrides?: Partial<TestDatabaseConfig>): TestDatabaseConfig
  static async setupTestDatabase(config: TestDatabaseConfig): Promise<DatabaseManager>
  static async clearAllTables(databaseManager: DatabaseManager, options?: DatabaseTestOptions): Promise<void>
  static async resetDatabase(databaseManager: DatabaseManager, options?: DatabaseTestOptions): Promise<void>
  static async seedTestData(databaseManager: DatabaseManager, seedData: Record<string, any[]>, connection?: string): Promise<void>
  static async withTestTransaction<T>(databaseManager: DatabaseManager, callback: (client: PoolClient) => Promise<T>, connection?: string): Promise<T>
  static async assertTableExists(databaseManager: DatabaseManager, tableName: string, schema?: string, connection?: string): Promise<void>
  static async assertTableEmpty(databaseManager: DatabaseManager, tableName: string, schema?: string, connection?: string): Promise<void>
  static async getTableRowCount(databaseManager: DatabaseManager, tableName: string, schema?: string, connection?: string): Promise<number>
}
```

### Mock Factories

#### Built-in Factories

```typescript
const createMockUser: MockFactory<any>
const createMockSession: MockFactory<any>
const createMockJwtPayload: MockFactory<any>
const createMockDatabaseRecord: MockFactory<any>
const createMockApiResponse: MockFactory<any>
const createMockErrorResponse: MockFactory<any>
const createMockValidationError: MockFactory<any>
const createMockPagination: MockFactory<any>
const createMockPaginatedResponse: MockFactory<any>
```

#### `MockFactory`

Utility class for generating test data.

```typescript
class MockFactory {
  static setSeed(seed: number): void
  static randomString(length?: number, prefix?: string): string
  static randomNumber(min?: number, max?: number): number
  static randomEmail(domain?: string): string
  static randomPhone(countryCode?: string): string
  static randomDate(startDate?: Date, endDate?: Date): Date
  static randomChoice<T>(items: T[]): T
  static generateMultiple<T>(factory: MockFactory<T>, count: number, options?: MockFactoryOptions): T[]
}
```

### API Testing

#### `HttpTestClient`

Fluent interface for making HTTP requests in tests.

```typescript
class HttpTestClient {
  constructor(app: Express, config?: ApiTestConfig)
  auth(type: 'bearer' | 'basic' | 'cookie', tokenOrCredentials: string | { username: string; password: string }): this
  headers(headers: Record<string, string>): this
  cookie(name: string, value: string): this
  get(path: string, query?: Record<string, any>): TestRequestBuilder
  post(path: string, body?: any): TestRequestBuilder
  put(path: string, body?: any): TestRequestBuilder
  patch(path: string, body?: any): TestRequestBuilder
  delete(path: string): TestRequestBuilder
  async execute(options: HttpTestOptions): Promise<SuperTestResponse>
}
```

#### `ResponseAssertions`

Comprehensive response validation utilities.

```typescript
class ResponseAssertions {
  hasStatus(status: number | number[]): this
  hasContentType(contentType: string): this
  hasHeader(name: string, value?: string | RegExp): this
  hasBody(expectedBody: any): this
  hasBodyContaining(expectedProperties: any): this
  isSuccessful(): this
  isError(): this
  hasValidSchema(schema: any, options?: SchemaValidationOptions): this
  satisfies(assertion: (response: SuperTestResponse) => void): this
}
```

#### `CommonAssertions`

Pre-built assertion patterns for common scenarios.

```typescript
class CommonAssertions {
  static apiSuccess(response: SuperTestResponse, expectedData?: any): ResponseAssertions
  static apiCreated(response: SuperTestResponse, expectedData?: any): ResponseAssertions
  static apiError(response: SuperTestResponse, expectedStatus?: number, expectedError?: any): ResponseAssertions
  static validationError(response: SuperTestResponse, expectedFields?: string[]): ResponseAssertions
  static unauthorized(response: SuperTestResponse): ResponseAssertions
  static forbidden(response: SuperTestResponse): ResponseAssertions
  static notFound(response: SuperTestResponse): ResponseAssertions
  static paginatedResponse(response: SuperTestResponse, expectedPagination?: any): ResponseAssertions
}
```

### Test Setup

#### `TestSetupManager`

Manages test environment setup and teardown.

```typescript
class TestSetupManager {
  static getInstance(): TestSetupManager
  async setup(config: TestSuiteConfig): Promise<void>
  async teardown(config?: TestSuiteConfig): Promise<void>
  async reset(config?: TestSuiteConfig): Promise<void>
  async cleanup(config?: TestSuiteConfig): Promise<void>
  getDatabaseManager(): DatabaseManager | undefined
  getCacheManager(): CacheManager | undefined
}
```

#### `JestSetupUtils`

Utilities for Jest test setup.

```typescript
class JestSetupUtils {
  static setupGlobals(config: TestSuiteConfig): void
  static setupDatabaseTesting(config: TestDatabaseConfig): void
  static setupCacheTesting(config: TestCacheConfig): void
  static setupIntegrationTesting(database: TestDatabaseConfig, cache: TestCacheConfig): void
}
```

## Configuration

### Environment Variables

```bash
# Test Database
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=thrilled_test
TEST_DB_USER=postgres
TEST_DB_PASSWORD=postgres

# Test Redis
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379
TEST_REDIS_DB=1
TEST_REDIS_PASSWORD=

# Test Configuration
NODE_ENV=test
```

### Test Configuration Types

```typescript
interface TestDatabaseConfig {
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
  dropOnClose?: boolean
  createDatabase?: boolean
  resetBetweenTests?: boolean
}

interface TestCacheConfig {
  host?: string
  port?: number
  db?: number
  password?: string
  keyPrefix?: string
  flushOnClose?: boolean
  resetBetweenTests?: boolean
}

interface TestAppConfig {
  port?: number
  enableLogging?: boolean
  database?: TestDatabaseConfig
  cache?: TestCacheConfig
  plugins?: string[]
  middleware?: any[]
  routes?: any[]
}
```

## Best Practices

### Test Organization

```typescript
describe('User Service', () => {
  describe('Unit Tests', () => {
    // Test individual methods with mocks
  });
  
  describe('Integration Tests', () => {
    // Test with real database/cache
  });
  
  describe('API Tests', () => {
    // Test HTTP endpoints
  });
});
```

### Test Data Management

```typescript
// Use factories for consistent test data
const user = createMockUser({ role: 'admin' });

// Use transactions for database tests
await DatabaseTestHelper.withTestTransaction(db, async (client) => {
  // Test operations here - will rollback automatically
});

// Reset between tests
beforeEach(async () => {
  await testApp.resetDatabase();
  await testApp.resetCache();
});
```

### Mock Management

```typescript
// Mock at the beginning of each test
beforeEach(() => {
  serviceMockManager.restoreAll();
  serviceMockManager.resetAllMocks();
});

// Use specific mocks for each test
it('should handle error', () => {
  const mockDb = CommonServiceMocks.createMockDatabase();
  mockDb.query.mockRejectedValue(new Error('Connection failed'));
  
  serviceMockManager.mockService('databaseManager', mockDb);
  
  // Test error handling
});
```

## Examples

See the `examples/` directory for complete examples of:

- Unit testing with mocks
- Integration testing with database
- API endpoint testing
- Workflow testing
- Performance testing
- Load testing

## Contributing

Please read the [Contributing Guide](../../CONTRIBUTING.md) for development setup and guidelines.

## License

MIT
