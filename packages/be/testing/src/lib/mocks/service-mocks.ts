/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Container } from 'typedi';
import { ServiceMockConfig } from '../types/mock-types.js';

// Type aliases for better readability
type ServiceIdentifier = string | (new (...args: any[]) => any);
type MockedService = jest.Mocked<any>;

/**
 * Service Mock Manager
 * Manages mocking of services in the TypeDI container
 */
export class ServiceMockManager {
  private originalServices: Map<string, any> = new Map();
  private mockServices: Map<string, any> = new Map();

  /**
   * Mock a service in the TypeDI container
   */
  mockService<T>(
    serviceId: ServiceIdentifier,
    mockImplementation: Partial<T> | jest.Mocked<T>,
    config: ServiceMockConfig = {}
  ): jest.Mocked<T> {
    const serviceKey = typeof serviceId === 'string' ? serviceId : serviceId.name;

    // Store original service if it exists
    try {
      const original = (Container as any).get(serviceId);
      this.originalServices.set(serviceKey, original);
    } catch {
      // Service doesn't exist yet, that's okay
    }

    // Create mock service
    let mockService: jest.Mocked<T>;

    if (config.autoMock) {
      // Auto-generate mock methods
      mockService = this.createAutoMock<T>(mockImplementation, config);
    } else {
      mockService = mockImplementation as jest.Mocked<T>;
    }

    // Store mock service
    this.mockServices.set(serviceKey, mockService);

    // Register in container
    (Container as any).set(serviceId, mockService);

    return mockService;
  }

  /**
   * Restore a mocked service
   */
  restoreService(serviceId: ServiceIdentifier): void {
    const serviceKey = typeof serviceId === 'string' ? serviceId : serviceId.name;

    if (this.originalServices.has(serviceKey)) {
      const original = this.originalServices.get(serviceKey);
      (Container as any).set(serviceId, original);
      this.originalServices.delete(serviceKey);
    } else {
      // Remove from container if no original existed
      (Container as any).remove(serviceId);
    }

    this.mockServices.delete(serviceKey);
  }

  /**
   * Restore all mocked services
   */
  restoreAll(): void {
    for (const [serviceKey] of this.mockServices.entries()) {
      // Try to find the service ID to restore
      // This is a limitation of the current approach
      console.warn(`Restoring mock service: ${serviceKey}`);
    }

    this.originalServices.clear();
    this.mockServices.clear();
  }

  /**
   * Get a mocked service
   */
  getMockService<T>(serviceId: ServiceIdentifier): jest.Mocked<T> | undefined {
    const serviceKey = typeof serviceId === 'string' ? serviceId : serviceId.name;
    return this.mockServices.get(serviceKey);
  }

  /**
   * Reset all mock calls
   */
  resetAllMocks(): void {
    for (const mockService of this.mockServices.values()) {
      if (typeof mockService === 'object' && mockService !== null) {
        Object.values(mockService).forEach(method => {
          if (jest.isMockFunction(method)) {
            method.mockReset();
          }
        });
      }
    }
  }

  /**
   * Clear all mock calls
   */
  clearAllMocks(): void {
    for (const mockService of this.mockServices.values()) {
      if (typeof mockService === 'object' && mockService !== null) {
        Object.values(mockService).forEach(method => {
          if (jest.isMockFunction(method)) {
            method.mockClear();
          }
        });
      }
    }
  }

  /**
   * Create auto-mock for a service
   */
  private createAutoMock<T>(
    implementation: Partial<T>,
    config: ServiceMockConfig
  ): jest.Mocked<T> {
    const mock = { ...implementation } as any;

    // Auto-mock methods if implementation is provided
    if (config.implementation) {
      Object.entries(config.implementation).forEach(([method, impl]) => {
        if (typeof impl === 'function') {
          mock[method] = jest.fn(impl as (...args: any[]) => any);
        } else {
          mock[method] = jest.fn().mockResolvedValue(impl);
        }
      });
    }

    // Create spy methods for specified methods
    if (config.spyOn) {
      config.spyOn.forEach(methodName => {
        if (!mock[methodName]) {
          mock[methodName] = jest.fn();
        }
      });
    }

    return mock;
  }
}

/**
 * Global service mock manager instance
 */
export const serviceMockManager = new ServiceMockManager();

/**
 * Mock service decorator
 */
export function MockService<T>(
  serviceId: ServiceIdentifier,
  mockImplementation: Partial<T> | jest.Mocked<T>,
  config: ServiceMockConfig = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const mockService = serviceMockManager.mockService(serviceId, mockImplementation, config);

      try {
        // Inject mock service into test context
        (this as any)[`mock${serviceId.toString()}`] = mockService;
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        serviceMockManager.restoreService(serviceId);
      }
    };

    return descriptor;
  };
}

/**
 * Common service mocks
 */
export class CommonServiceMocks {
  /**
   * Mock logger service
   */
  static createMockLogger(): jest.Mocked<any> {
    return {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
  }

  /**
   * Mock database service
   */
  static createMockDatabase(): jest.Mocked<any> {
    return {
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      getConnection: jest.fn().mockReturnValue({
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
          release: jest.fn(),
        }),
        end: jest.fn().mockResolvedValue(undefined),
      }),
      withTransaction: jest.fn().mockImplementation(async (callback) => {
        return await callback({
          query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
        });
      }),
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
  }

  /**
   * Mock cache service
   */
  static createMockCache(): jest.Mocked<any> {
    const mockData = new Map<string, any>();

    return {
      get: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockData.get(key) || null);
      }),
      set: jest.fn().mockImplementation((key: string, value: any, ttl?: number) => {
        mockData.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn().mockImplementation((key: string) => {
        const existed = mockData.has(key);
        mockData.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      exists: jest.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockData.has(key) ? 1 : 0);
      }),
      flushAll: jest.fn().mockImplementation(() => {
        mockData.clear();
        return Promise.resolve('OK');
      }),
      keys: jest.fn().mockImplementation((pattern: string) => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        const matchingKeys = Array.from(mockData.keys()).filter(key => regex.test(key));
        return Promise.resolve(matchingKeys);
      }),
      initialize: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
  }

  /**
   * Mock email service
   */
  static createMockEmailService(): jest.Mocked<any> {
    return {
      sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
      sendVerificationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' }),
    };
  }

  /**
   * Mock file storage service
   */
  static createMockFileStorage(): jest.Mocked<any> {
    return {
      upload: jest.fn().mockResolvedValue({ url: 'https://example.com/file.jpg', key: 'file-key' }),
      download: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
      delete: jest.fn().mockResolvedValue(true),
      exists: jest.fn().mockResolvedValue(true),
      getUrl: jest.fn().mockReturnValue('https://example.com/file.jpg'),
    };
  }

  /**
   * Mock notification service
   */
  static createMockNotificationService(): jest.Mocked<any> {
    return {
      sendNotification: jest.fn().mockResolvedValue({ id: 'notification-id' }),
      sendPushNotification: jest.fn().mockResolvedValue({ id: 'push-notification-id' }),
      sendSMSNotification: jest.fn().mockResolvedValue({ id: 'sms-notification-id' }),
      markAsRead: jest.fn().mockResolvedValue(true),
      getNotifications: jest.fn().mockResolvedValue([]),
    };
  }

  /**
   * Mock payment service
   */
  static createMockPaymentService(): jest.Mocked<any> {
    return {
      createPayment: jest.fn().mockResolvedValue({ 
        id: 'payment-id', 
        status: 'pending',
        amount: 1000,
        currency: 'USD'
      }),
      capturePayment: jest.fn().mockResolvedValue({ 
        id: 'payment-id', 
        status: 'completed'
      }),
      refundPayment: jest.fn().mockResolvedValue({ 
        id: 'refund-id', 
        status: 'completed',
        amount: 1000
      }),
      getPayment: jest.fn().mockResolvedValue({ 
        id: 'payment-id', 
        status: 'completed'
      }),
    };
  }
}

/**
 * Helper functions for service testing
 */
export class ServiceTestHelpers {
  /**
   * Test service with mocked dependencies
   */
  static async testServiceWithMocks<T>(
    ServiceClass: new (...args: any[]) => T,
    mocks: Record<string, any>,
    testCallback: (service: T, mocks: Record<string, jest.Mocked<any>>) => Promise<void>
  ): Promise<void> {
    const mockManager = new ServiceMockManager();

    try {
      // Setup mocks
      const mockServices: Record<string, jest.Mocked<any>> = {};
      for (const [serviceId, mockImplementation] of Object.entries(mocks)) {
        mockServices[serviceId] = mockManager.mockService(serviceId, mockImplementation);
      }

      // Create service instance
      const serviceInstance = Container.get(ServiceClass);

      // Run test
      await testCallback(serviceInstance, mockServices);
    } finally {
      // Cleanup
      mockManager.restoreAll();
    }
  }

  /**
   * Test service method with specific mocks
   */
  static async testServiceMethod<T>(
    serviceInstance: T,
    methodName: keyof T,
    args: any[],
    expectedResult: any,
    mocks?: Record<string, jest.MockedFunction<any>>
  ): Promise<void> {
    // Setup method mocks if provided
    if (mocks) {
      Object.entries(mocks).forEach(([mockName, mockFn]) => {
        mockFn.mockClear();
      });
    }

    // Call method
    const result = await (serviceInstance[methodName] as any)(...args);

    // Assert result
    expect(result).toEqual(expectedResult);

    // Assert mocks were called as expected
    if (mocks) {
      Object.entries(mocks).forEach(([mockName, mockFn]) => {
        expect(mockFn).toHaveBeenCalled();
      });
    }
  }
}
