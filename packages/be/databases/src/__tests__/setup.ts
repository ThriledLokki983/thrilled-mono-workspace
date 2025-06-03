// Jest setup file for database package tests

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up any lingering connections after each test
afterEach(async () => {
  // Clean up mocks
  jest.clearAllMocks();
});

// Global test teardown
afterAll(async () => {
  // Clean up any remaining resources
  await new Promise((resolve) => setTimeout(resolve, 100));
});
