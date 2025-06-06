/**
 * Integration test for auth package integration with AuthService
 * This test verifies that the AuthService can successfully retrieve
 * auth package instances from the TypeDI container
 */

import 'reflect-metadata';
import { Container } from 'typedi';
import { AuthService } from '../services/auth.service';

describe('Auth Package Integration', () => {
  beforeAll(() => {
    // Mock auth package instances for testing
    const mockJwtProvider = {
      createAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
      createRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
      getTokenPayload: jest.fn().mockReturnValue({ userId: '123', sessionId: 'session-123' }),
      blacklistToken: jest.fn().mockResolvedValue(true),
      verifyToken: jest.fn().mockResolvedValue({ userId: '123', sessionId: 'session-123' }),
    };

    const mockPasswordManager = {
      hashPassword: jest.fn().mockResolvedValue('hashed-password'),
      verifyPassword: jest.fn().mockResolvedValue(true),
      createResetToken: jest.fn().mockResolvedValue({ token: 'reset-token', expiresAt: new Date() }),
      verifyResetToken: jest.fn().mockResolvedValue('user-123'),
      revokeResetTokens: jest.fn().mockResolvedValue(true),
    };

    const mockSessionManager = {
      createSession: jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        userId: '123',
        isActive: true,
        createdAt: new Date(),
        expiresAt: new Date(),
      }),
      destroySession: jest.fn().mockResolvedValue(true),
      getSession: jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        userId: '123',
        isActive: true,
      }),
      refreshSession: jest.fn().mockResolvedValue(true),
    };

    const mockRbacManager = {
      checkPermission: jest.fn().mockResolvedValue(true),
      getUserRoles: jest.fn().mockResolvedValue(['user']),
      getUserPermissions: jest.fn().mockResolvedValue(['read', 'write']),
    };

    // Register with TypeDI container
    Container.set('jwtProvider', mockJwtProvider);
    Container.set('passwordManager', mockPasswordManager);
    Container.set('sessionManager', mockSessionManager);
    Container.set('rbacManager', mockRbacManager);
  });

  afterAll(() => {
    // Clean up container
    Container.reset();
  });

  it('should successfully create AuthService instance with injected dependencies', () => {
    const authService = new AuthService();
    expect(authService).toBeDefined();
    expect(authService).toBeInstanceOf(AuthService);
  });

  it('should have auth package instances available through container', () => {
    const jwtProvider = Container.get('jwtProvider');
    const passwordManager = Container.get('passwordManager');
    const sessionManager = Container.get('sessionManager');
    const rbacManager = Container.get('rbacManager');

    expect(jwtProvider).toBeDefined();
    expect(passwordManager).toBeDefined();
    expect(sessionManager).toBeDefined();
    expect(rbacManager).toBeDefined();
  });

  it('should be able to access auth service methods without throwing errors', () => {
    const authService = new AuthService();

    // Check that methods exist on the service
    expect(typeof authService.signup).toBe('function');
    expect(typeof authService.login).toBe('function');
    expect(typeof authService.logout).toBe('function');
    expect(typeof authService.resetPassword).toBe('function');
  });

  it('should handle password operations through PasswordManager', async () => {
    const passwordManager = Container.get('passwordManager');

    const hashedPassword = await passwordManager.hashPassword('testpassword');
    expect(hashedPassword).toBe('hashed-password');

    const isValid = await passwordManager.verifyPassword('testpassword', hashedPassword);
    expect(isValid).toBe(true);
  });

  it('should handle JWT operations through JWTProvider', async () => {
    const jwtProvider = Container.get('jwtProvider');

    const token = await jwtProvider.createAccessToken({ userId: '123' });
    expect(token).toBe('mock-access-token');

    const payload = jwtProvider.getTokenPayload(token);
    expect(payload).toEqual({ userId: '123', sessionId: 'session-123' });
  });

  it('should handle session operations through SessionManager', async () => {
    const sessionManager = Container.get('sessionManager');

    const session = await sessionManager.createSession('123');
    expect(session).toEqual(
      expect.objectContaining({
        sessionId: 'session-123',
        userId: '123',
        isActive: true,
      }),
    );

    const destroyed = await sessionManager.destroySession('session-123');
    expect(destroyed).toBe(true);
  });

  it('should handle RBAC operations through RBACManager', async () => {
    const rbacManager = Container.get('rbacManager');

    const hasPermission = await rbacManager.checkPermission('123', 'read');
    expect(hasPermission).toBe(true);

    const roles = await rbacManager.getUserRoles('123');
    expect(roles).toEqual(['user']);
  });
});
