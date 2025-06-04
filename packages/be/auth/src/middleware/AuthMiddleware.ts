import { Request, Response, NextFunction } from 'express';
import { JWTProvider } from '../jwt/JWTProvider.js';
import { SessionManager } from '../session/SessionManager.js';
import { 
  AuthConfig, 
  AuthContext,
  UserSession
} from '../types/index.js';
import { Logger } from '@mono/be-core';

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext;
  user?: {
    id: string;
    [key: string]: unknown;
  };
  session?: UserSession;
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipSessionValidation?: boolean;
  allowExpired?: boolean;
  rateLimitKey?: string;
}

export class AuthMiddleware {
  private jwtProvider: JWTProvider;
  private sessionManager: SessionManager;
  private logger: Logger;

  constructor(
    jwtProvider: JWTProvider,
    sessionManager: SessionManager,
    config: AuthConfig, // kept for compatibility but not used
    logger?: Logger
  ) {
    this.jwtProvider = jwtProvider;
    this.sessionManager = sessionManager;
    this.logger = logger || new Logger({ level: 'info', dir: './logs/auth' });
  }

  /**
   * Main authentication middleware
   */
  authenticate(options: AuthMiddlewareOptions = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          if (options.required !== false) {
            return this.handleAuthError(res, 'No token provided', 401);
          }
          return next();
        }

        // Verify JWT token
        const verificationResult = await this.jwtProvider.verifyAccessToken(token);
        if (!verificationResult.isValid || !verificationResult.payload) {
          if (options.required !== false) {
            return this.handleAuthError(res, 'Invalid token', 401);
          }
          return next();
        }

        const payload = verificationResult.payload;

        // Validate session if not skipped
        let session = null;
        if (!options.skipSessionValidation && payload.sessionId) {
          session = await this.sessionManager.getSession(payload.sessionId);
          if (!session) {
            if (options.required !== false) {
              return this.handleAuthError(res, 'Session not found', 401);
            }
            return next();
          }

          // Check if session is valid
          if (session.expiresAt < new Date()) {
            await this.sessionManager.destroySession(payload.sessionId);
            if (options.required !== false) {
              return this.handleAuthError(res, 'Session expired', 401);
            }
            return next();
          }

          // Update session activity
          await this.sessionManager.touchSession(payload.sessionId);
        }

        // Create auth context
        const authContext: AuthContext = {
          userId: payload.userId,
          sessionId: payload.sessionId,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          userData: payload.userData || {},
          deviceId: session?.deviceId,
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        };

        // Check role requirements
        if (options.roles && !this.hasRequiredRoles(authContext.roles, options.roles)) {
          return this.handleAuthError(res, 'Insufficient roles', 403);
        }

        // Check permission requirements
        if (options.permissions && !this.hasRequiredPermissions(authContext.permissions, options.permissions)) {
          return this.handleAuthError(res, 'Insufficient permissions', 403);
        }

        // Attach auth context to request
        req.auth = authContext;
        req.user = { id: payload.userId, ...payload.userData };
        if (session) {
          req.session = session;
        }

        // Log authentication success
        this.logger.info('Authentication successful', {
          userId: authContext.userId,
          sessionId: authContext.sessionId,
          roles: authContext.roles,
          permissions: authContext.permissions
        });

        return next();
      } catch (error) {
        this.logger.error('Authentication middleware error:', { error: error instanceof Error ? error.message : String(error) });
        
        if (options.required !== false) {
          return this.handleAuthError(res, 'Authentication failed', 500);
        }
        
        return next();
      }
    };
  }

  /**
   * Require authentication middleware
   */
  requireAuth(options: Omit<AuthMiddlewareOptions, 'required'> = {}) {
    return this.authenticate({ ...options, required: true });
  }

  /**
   * Optional authentication middleware
   */
  optionalAuth(options: Omit<AuthMiddlewareOptions, 'required'> = {}) {
    return this.authenticate({ ...options, required: false });
  }

  /**
   * Role-based access control middleware
   */
  requireRoles(roles: string[], options: Omit<AuthMiddlewareOptions, 'roles'> = {}) {
    return this.authenticate({ ...options, roles, required: true });
  }

  /**
   * Permission-based access control middleware
   */
  requirePermissions(permissions: string[], options: Omit<AuthMiddlewareOptions, 'permissions'> = {}) {
    return this.authenticate({ ...options, permissions, required: true });
  }

  /**
   * Admin-only access middleware
   */
  requireAdmin(options: Omit<AuthMiddlewareOptions, 'roles'> = {}) {
    return this.requireRoles(['admin'], options);
  }

  /**
   * Moderator or admin access middleware
   */
  requireModerator(options: Omit<AuthMiddlewareOptions, 'roles'> = {}) {
    return this.authenticate({ 
      ...options, 
      roles: ['admin', 'moderator'], 
      required: true 
    });
  }

  /**
   * Custom authorization middleware
   */
  authorize(authorizationFn: (authContext: AuthContext, req: AuthenticatedRequest) => boolean | Promise<boolean>) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.auth) {
          return this.handleAuthError(res, 'Authentication required', 401);
        }

        const authorized = await authorizationFn(req.auth, req);
        if (!authorized) {
          return this.handleAuthError(res, 'Access denied', 403);
        }

        return next();
      } catch (error) {
        this.logger.error('Authorization error:', { error: error instanceof Error ? error.message : String(error) });
        return this.handleAuthError(res, 'Authorization failed', 500);
      }
    };
  }

  /**
   * Rate limiting middleware (simplified version)
   */
  rateLimit(maxAttempts: number, windowMs: number) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // For now, just log rate limiting attempts
        this.logger.debug('Rate limiting check', {
          maxAttempts,
          windowMs,
          userId: req.auth?.userId,
          ip: req.ip
        });
        
        return next();
      } catch (error) {
        this.logger.error('Rate limiting error:', { error: error instanceof Error ? error.message : String(error) });
        return next(); // Don't block on rate limiting errors
      }
    };
  }

  /**
   * Device verification middleware
   */
  requireVerifiedDevice(options: { allowNewDevice?: boolean } = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.auth?.sessionId) {
          return this.handleAuthError(res, 'Session required', 401);
        }

        const session = await this.sessionManager.getSession(req.auth.sessionId);
        if (!session) {
          return this.handleAuthError(res, 'Session not found', 401);
        }

        if (!session.deviceVerified) {
          if (!options.allowNewDevice) {
            return this.handleAuthError(res, 'Device verification required', 403);
          }
        }

        return next();
      } catch (error) {
        this.logger.error('Device verification error:', { error: error instanceof Error ? error.message : String(error) });
        return this.handleAuthError(res, 'Device verification failed', 500);
      }
    };
  }

  /**
   * IP whitelist middleware
   */
  requireWhitelistedIP(allowedIPs: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!clientIP || !allowedIPs.includes(clientIP)) {
        return this.handleAuthError(res, 'IP not whitelisted', 403);
      }
      
      return next();
    };
  }

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    if (req.query.token && typeof req.query.token === 'string') {
      return req.query.token;
    }

    // Check cookie
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }

    return null;
  }

  /**
   * Check if user has required roles
   */
  private hasRequiredRoles(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user has required permissions
   */
  private hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(res: Response, message: string, statusCode: number) {
    return res.status(statusCode).json({
      error: 'Authentication Error',
      message,
      statusCode,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Middleware factory for combining multiple auth requirements
   */
  static combine(...middlewares: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void)[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      let currentIndex = 0;

      const runNext = (error?: unknown) => {
        if (error) return next(error);
        
        if (currentIndex >= middlewares.length) {
          return next();
        }

        const middleware = middlewares[currentIndex++];
        middleware(req, res, runNext);
      };

      runNext();
    };
  }
}
