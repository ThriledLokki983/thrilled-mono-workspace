import { 
  MockFactory, 
  MockFactoryOptions, 
  DatabaseMockOptions, 
  AuthMockOptions,
  MockUser,
  MockSession,
  MockJwtPayload,
  MockDatabaseRecord,
  MockApiResponse,
  MockErrorResponse,
  MockPagination,
  MockPaginatedResponse,
  MockQueryResult,
  MockConnection
} from './types/mock-types.js';

/**
 * Mock Data Factory
 * Generates consistent test data using configurable factories
 */
export class MockDataFactory {
  private static sequence: Map<string, number> = new Map();

  /**
   * Set global seed for consistent test data (resets sequences)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static setSeed(_seed: number): void {
    // Reset sequences for consistent test data
    this.sequence.clear();
  }

  /**
   * Get next sequence number for a given key
   */
  private static getSequence(key: string): number {
    const current = this.sequence.get(key) || 0;
    const next = current + 1;
    this.sequence.set(key, next);
    return next;
  }

  /**
   * Generate random string
   */
  static randomString(length = 10, prefix = ''): string {
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
  static randomNumber(min = 1, max = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generate random email
   */
  static randomEmail(domain = 'example.com'): string {
    const username = this.randomString(8, 'user');
    return `${username}@${domain}`;
  }

  /**
   * Generate random phone number
   */
  static randomPhone(countryCode = '+1'): string {
    const areaCode = this.randomNumber(200, 999);
    const exchange = this.randomNumber(200, 999);
    const number = this.randomNumber(1000, 9999);
    return `${countryCode}${areaCode}${exchange}${number}`;
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
   * Pick random item from array
   */
  static randomChoice<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)];
  }

  /**
   * Generate multiple items using a factory
   */
  static generateMultiple<T>(
    factory: MockFactory<T>,
    count: number,
    options: MockFactoryOptions = {}
  ): T[] {
    const items: T[] = [];
    for (let i = 0; i < count; i++) {
      const overrides = options.sequence ? { id: i + 1 } : {};
      items.push(factory(overrides as Partial<T>));
    }
    return items;
  }
}

/**
 * User Mock Factory
 */
export const createMockUser: MockFactory<MockUser> = (overrides = {}) => {
  const sequence = MockDataFactory['getSequence']('user');
  
  return {
    id: sequence,
    email: `user${sequence}@example.com`,
    name: `Test User ${sequence}`,
    first_name: `First${sequence}`,
    last_name: `Last${sequence}`,
    phone: MockDataFactory.randomPhone(),
    address: `${MockDataFactory.randomNumber(100, 999)} Test St`,
    role: MockDataFactory.randomChoice(['user', 'admin', 'moderator']),
    language_preference: 'en',
    is_active: true,
    created_at: MockDataFactory.randomDate(),
    updated_at: new Date(),
    ...overrides,
  };
};

/**
 * Session Mock Factory
 */
export const createMockSession: MockFactory<MockSession> = (overrides = {}) => {
  const sequence = MockDataFactory['getSequence']('session');
  
  return {
    id: `session-${sequence}`,
    user_id: sequence,
    device_info: {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ip: '192.168.1.100',
      platform: 'Test Platform',
    },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    created_at: new Date(),
    last_accessed: new Date(),
    is_active: true,
    ...overrides,
  };
};

/**
 * JWT Token Mock Factory
 */
export const createMockJwtPayload: MockFactory<MockJwtPayload> = (overrides = {}) => {
  const sequence = MockDataFactory['getSequence']('jwt');
  
  return {
    userId: `user-${sequence}`,
    sessionId: `session-${sequence}`,
    roles: ['user'],
    permissions: ['read', 'write'],
    userData: {
      email: `user${sequence}@example.com`,
      name: `Test User ${sequence}`,
    },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    ...overrides,
  };
};

/**
 * Database Record Mock Factory
 */
export const createMockDatabaseRecord: MockFactory<MockDatabaseRecord> = (overrides = {}) => {
  const sequence = MockDataFactory['getSequence']('record');
  
  return {
    id: sequence,
    created_at: new Date(),
    updated_at: new Date(),
    version: 1,
    ...overrides,
  };
};

/**
 * API Response Mock Factory
 */
export const createMockApiResponse: MockFactory<MockApiResponse> = (overrides = {}) => {
  return {
    success: true,
    data: null,
    message: 'Operation completed successfully',
    timestamp: new Date().toISOString(),
    request_id: MockDataFactory.randomString(16),
    ...overrides,
  };
};

/**
 * Error Response Mock Factory
 */
export const createMockErrorResponse: MockFactory<MockErrorResponse> = (overrides = {}) => {
  return {
    success: false,
    error: {
      code: 'GENERIC_ERROR',
      message: 'An error occurred',
      details: {},
    },
    timestamp: new Date().toISOString(),
    request_id: MockDataFactory.randomString(16),
    ...overrides,
  };
};

/**
 * Validation Error Mock Factory
 */
export const createMockValidationError: MockFactory<MockErrorResponse> = (overrides = {}) => {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [
        {
          field: 'email',
          message: 'Invalid email format',
          value: 'invalid-email',
        },
      ],
    },
    timestamp: new Date().toISOString(),
    request_id: MockDataFactory.randomString(16),
    ...overrides,
  };
};

/**
 * Pagination Mock Factory
 */
export const createMockPagination: MockFactory<MockPagination> = (overrides = {}) => {
  return {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false,
    ...overrides,
  };
};

/**
 * Paginated Response Mock Factory
 */
export const createMockPaginatedResponse: MockFactory<MockPaginatedResponse> = (overrides = {}) => {
  const pagination = createMockPagination(overrides.pagination);
  
  return {
    success: true,
    data: [],
    pagination,
    timestamp: new Date().toISOString(),
    request_id: MockDataFactory.randomString(16),
    ...overrides,
  };
};

/**
 * Auth Mock Utilities
 */
export class AuthMockUtils {
  /**
   * Create mock JWT token
   */
  static createMockJwtToken(options: AuthMockOptions = {}): string {
    const payload = createMockJwtPayload({
      userId: options.userId,
      sessionId: options.sessionId,
      roles: options.roles,
      permissions: options.permissions,
    });
    
    // In a real implementation, this would use the actual JWT library
    // For testing, we create a fake token that can be decoded
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = MockDataFactory.randomString(32);
    
    return `${header}.${payloadEncoded}.${signature}`;
  }

  /**
   * Create mock authentication headers
   */
  static createAuthHeaders(token?: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${token || this.createMockJwtToken()}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create mock user session
   */
  static createMockUserSession(options: AuthMockOptions = {}): MockSession {
    return createMockSession({
      user_id: options.userId ? parseInt(options.userId, 10) : undefined,
      ...options,
    });
  }
}

/**
 * Database Mock Utilities
 */
export class DatabaseMockUtils {
  /**
   * Create mock database connection
   */
  static createMockConnection(): MockConnection {
    return {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      connect: jest.fn().mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      }),
      end: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };
  }

  /**
   * Create mock query result
   */
  static createMockQueryResult(rows: unknown[] = [], rowCount?: number): MockQueryResult {
    return {
      rows,
      rowCount: rowCount ?? rows.length,
      command: 'SELECT',
      oid: 0,
      fields: [],
    };
  }

  /**
   * Setup database mocks for testing
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static setupDatabaseMocks(_options: DatabaseMockOptions = {}): MockConnection {
    const mockConnection = this.createMockConnection();
    
    // Mock common queries
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mockConnection.query.mockImplementation((query: string, _params?: unknown[]) => {
      if (query.includes('SELECT 1')) {
        return Promise.resolve(this.createMockQueryResult([{ '?column?': 1 }]));
      }
      
      if (query.includes('COUNT(*)')) {
        return Promise.resolve(this.createMockQueryResult([{ count: '0' }]));
      }
      
      return Promise.resolve(this.createMockQueryResult());
    });

    return mockConnection;
  }
}

/**
 * Export all mock factories
 */
export const MockFactories = {
  User: createMockUser,
  Session: createMockSession,
  JwtPayload: createMockJwtPayload,
  DatabaseRecord: createMockDatabaseRecord,
  ApiResponse: createMockApiResponse,
  ErrorResponse: createMockErrorResponse,
  ValidationError: createMockValidationError,
  Pagination: createMockPagination,
  PaginatedResponse: createMockPaginatedResponse,
};
