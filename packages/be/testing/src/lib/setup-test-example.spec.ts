/**
 * Example of how to properly use SimpleTestHelpers.setupTest
 * This demonstrates the correct usage at the top level of a test file
 */

import { SimpleTestHelpers } from './simple-testing';

// This is the CORRECT way to use setupTest - at the top level of the file
const testState: { setupCalled: boolean; cleanupCalled: boolean } = {
  setupCalled: false,
  cleanupCalled: false,
};

SimpleTestHelpers.setupTest({
  beforeAll: async () => {
    testState.setupCalled = true;
    console.log('Setup called in beforeAll');
  },
  afterAll: async () => {
    testState.cleanupCalled = true;
    console.log('Cleanup called in afterAll');
  },
  beforeEach: () => {
    console.log('Test setup called before each test');
  },
  afterEach: () => {
    console.log('Test cleanup called after each test');
  },
});

describe('SetupTest Example', () => {
  it('should have run setup hooks', () => {
    // The beforeAll hook should have been called by now
    expect(testState.setupCalled).toBe(true);
  });

  it('should demonstrate proper setup usage', () => {
    // This test shows that the setup works correctly
    expect(typeof SimpleTestHelpers.setupTest).toBe('function');
  });
});
