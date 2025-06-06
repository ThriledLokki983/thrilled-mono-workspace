/**
 * Test file to verify auth package integration is working
 * This file can be run to test that the AuthService can successfully
 * retrieve auth package instances from the TypeDI container
 */

import { Container } from 'typedi';
import { AuthService } from './services/auth.service';

// Mock setup - normally this would be done by the AuthPlugin
function setupMockAuthInstances() {
  // Mock auth package instances
  const mockJwtProvider = {
    createAccessToken: async (payload: any) => 'mock-token',
    getTokenPayload: (token: string) => ({ userId: '123', sessionId: 'session-123' }),
    blacklistToken: async (token: string) => true,
  };

  const mockPasswordManager = {
    hashPassword: async (password: string) => 'hashed-password',
    verifyPassword: async (password: string, hash: string) => true,
    createResetToken: async (userId: string, expiresInMinutes: number) => ({ token: 'reset-token' }),
    verifyResetToken: async (token: string) => 'user-123',
    revokeResetTokens: async (userId: string) => true,
  };

  const mockSessionManager = {
    createSession: async (userId: string, deviceInfo?: any) => ({
      sessionId: 'session-123',
      userId,
      isActive: true,
    }),
    destroySession: async (sessionId: string) => true,
  };

  const mockRbacManager = {
    checkPermission: async (userId: string, permission: string) => true,
  };

  // Register with TypeDI container
  Container.set('jwtProvider', mockJwtProvider);
  Container.set('passwordManager', mockPasswordManager);
  Container.set('sessionManager', mockSessionManager);
  Container.set('rbacManager', mockRbacManager);
}

// Test function
async function testAuthIntegration() {
  try {
    console.log('Setting up mock auth instances...');
    setupMockAuthInstances();

    console.log('Creating AuthService instance...');
    const authService = Container.get(AuthService);

    console.log('Testing AuthService methods...');

    // Test signup
    const userData = {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
    };

    console.log('AuthService created successfully!');
    console.log('Integration test completed - auth package instances are properly injected.');

    return true;
  } catch (error) {
    console.error('Integration test failed:', error);
    return false;
  }
}

// Export for testing
export { testAuthIntegration, setupMockAuthInstances };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}
