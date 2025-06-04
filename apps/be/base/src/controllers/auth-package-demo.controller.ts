import { Request, Response, NextFunction } from 'express';
import { JWTProvider, PasswordManager, SessionManager, RBACManager } from '@thrilled/be-auth';
import { Logger, apiResponse } from '@mono/be-core';

/**
 * Demo controller to showcase the @thrilled/be-auth package capabilities
 * This runs alongside the existing auth system for demonstration purposes
 */
export class AuthPackageDemoController {
  private logger: Logger;

  constructor(
    private jwtProvider: JWTProvider,
    private passwordManager: PasswordManager,
    private sessionManager: SessionManager,
    private rbacManager: RBACManager
  ) {
    this.logger = Logger.create({
      level: 'info',
      format: 'json',
      dir: 'logs'
    });
  }

  /**
   * Demo: Password strength validation
   */
  public validatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password } = req.body;

      if (!password) {
        apiResponse.badRequest(res, 'Password is required');
        return;
      }

      const validation = await this.passwordManager.validatePassword(password);
      
      apiResponse.success(res, 'Password validation completed', {
        isValid: validation.isValid,
        score: validation.score,
        feedback: validation.feedback
      });

    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPackageDemoController.validatePassword' });
      next(error);
    }
  };

  /**
   * Demo: JWT token generation and verification
   */
  public generateDemoToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId = 'demo-user-123' } = req.body;

      // Generate demo access token
      const accessToken = await this.jwtProvider.generateAccessToken({
        userId,
        sessionId: 'demo-session-123',
        roles: ['user', 'demo'],
        permissions: ['read:profile', 'read:demo'],
        userData: { 
          name: 'Demo User',
          email: 'demo@example.com',
          demoMode: true 
        }
      });

      // Generate demo refresh token
      const refreshToken = await this.jwtProvider.generateRefreshToken({
        userId,
        sessionId: 'demo-session-123',
        nonce: 'demo-nonce-' + Date.now()
      });

      // Verify the token immediately for demo
      const verification = await this.jwtProvider.verifyAccessToken(accessToken);

      apiResponse.success(res, 'Demo tokens generated and verified', {
        tokens: {
          accessToken,
          refreshToken
        },
        verification: {
          valid: verification.valid,
          payload: verification.payload
        }
      });

    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPackageDemoController.generateDemoToken' });
      next(error);
    }
  };

  /**
   * Demo: Session management
   */
  public createDemoSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId = 'demo-user-123' } = req.body;

      // Create demo session
      const session = await this.sessionManager.createSession({
        userId,
        deviceId: req.headers['x-device-id'] as string || 'demo-device',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Demo Browser',
        deviceVerified: true
      });

      // Get session details
      const sessionDetails = await this.sessionManager.getSession(session.id);

      apiResponse.success(res, 'Demo session created', {
        session: sessionDetails,
        management: {
          canTouch: true,
          canDestroy: true,
          canValidate: true
        }
      });

    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPackageDemoController.createDemoSession' });
      next(error);
    }
  };

  /**
   * Demo: RBAC functionality
   */
  public demonstrateRBAC = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Create demo roles and permissions
      const adminRole = await this.rbacManager.createRole({
        name: 'demo-admin',
        description: 'Demo administrator role',
        isSystem: false,
        isActive: true
      });

      const userRole = await this.rbacManager.createRole({
        name: 'demo-user', 
        description: 'Demo regular user role',
        isSystem: false,
        isActive: true
      });

      const readPermission = await this.rbacManager.createPermission({
        name: 'demo:read',
        description: 'Demo read permission',
        resource: 'demo',
        action: 'read',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const writePermission = await this.rbacManager.createPermission({
        name: 'demo:write',
        description: 'Demo write permission', 
        resource: 'demo',
        action: 'write',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Assign permissions to roles
      await this.rbacManager.assignPermissionToRole(adminRole.id, writePermission.id);
      await this.rbacManager.assignPermissionToRole(adminRole.id, readPermission.id);
      await this.rbacManager.assignPermissionToRole(userRole.id, readPermission.id);

      // Check permissions
      const adminPermissions = await this.rbacManager.getRolePermissions(adminRole.id);
      const userPermissions = await this.rbacManager.getRolePermissions(userRole.id);

      apiResponse.success(res, 'RBAC demonstration completed', {
        roles: {
          admin: adminRole,
          user: userRole
        },
        permissions: {
          read: readPermission,
          write: writePermission
        },
        assignments: {
          adminPermissions: adminPermissions.map(p => p.name),
          userPermissions: userPermissions.map(p => p.name)
        }
      });

    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPackageDemoController.demonstrateRBAC' });
      next(error);
    }
  };

  /**
   * Demo: Complete authentication flow
   */
  public completeAuthFlow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        email = 'demo@example.com', 
        password = 'DemoPassword123!',
        userId = 'demo-user-' + Date.now()
      } = req.body;

      // 1. Validate password strength
      const passwordValidation = await this.passwordManager.validatePassword(password);
      
      // 2. Hash password (for storage simulation)
      const hashedPassword = await this.passwordManager.hashPassword(password);
      
      // 3. Verify password (simulate login)
      const passwordMatch = await this.passwordManager.verifyPassword(password, hashedPassword);
      
      // 4. Create session
      const session = await this.sessionManager.createSession({
        userId,
        deviceId: 'demo-device-' + Date.now(),
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Demo Browser',
        deviceVerified: true
      });

      // 5. Generate tokens
      const accessToken = await this.jwtProvider.generateAccessToken({
        userId,
        sessionId: session.id,
        roles: ['demo-user'],
        permissions: ['demo:read'],
        userData: { 
          email,
          name: 'Demo User',
          demoMode: true 
        }
      });

      const refreshToken = await this.jwtProvider.generateRefreshToken({
        userId,
        sessionId: session.id
      });

      apiResponse.success(res, 'Complete authentication flow demonstration', {
        steps: {
          '1_password_validation': {
            isValid: passwordValidation.isValid,
            score: passwordValidation.score
          },
          '2_password_hashing': {
            original: password,
            hashed: hashedPassword.substring(0, 20) + '...' // Show only part for security
          },
          '3_password_verification': {
            matches: passwordMatch
          },
          '4_session_creation': {
            sessionId: session.id,
            expiresAt: session.expiresAt
          },
          '5_token_generation': {
            accessToken: accessToken.substring(0, 50) + '...',
            refreshToken: refreshToken.substring(0, 50) + '...'
          }
        },
        summary: {
          userId,
          email,
          sessionId: session.id,
          tokenGenerated: true,
          authFlowComplete: true
        }
      });

    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPackageDemoController.completeAuthFlow' });
      next(error);
    }
  };
}
