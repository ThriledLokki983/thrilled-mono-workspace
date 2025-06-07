import { Request, Response, NextFunction } from 'express';
import { JWTProvider } from '../jwt/JWTProvider.js';
import { SessionManager } from '../session/SessionManager.js';
import { AuthConfig, AuthContext, UserSession } from '../types/index.js';
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
export declare class AuthMiddleware {
    private jwtProvider;
    private sessionManager;
    private logger;
    constructor(jwtProvider: JWTProvider, sessionManager: SessionManager, config: AuthConfig, // kept for compatibility but not used
    logger?: Logger);
    /**
     * Main authentication middleware
     */
    authenticate(options?: AuthMiddlewareOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Require authentication middleware
     */
    requireAuth(options?: Omit<AuthMiddlewareOptions, 'required'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Optional authentication middleware
     */
    optionalAuth(options?: Omit<AuthMiddlewareOptions, 'required'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Role-based access control middleware
     */
    requireRoles(roles: string[], options?: Omit<AuthMiddlewareOptions, 'roles'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Permission-based access control middleware
     */
    requirePermissions(permissions: string[], options?: Omit<AuthMiddlewareOptions, 'permissions'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Admin-only access middleware
     */
    requireAdmin(options?: Omit<AuthMiddlewareOptions, 'roles'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Moderator or admin access middleware
     */
    requireModerator(options?: Omit<AuthMiddlewareOptions, 'roles'>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Custom authorization middleware
     */
    authorize(authorizationFn: (authContext: AuthContext, req: AuthenticatedRequest) => boolean | Promise<boolean>): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * Rate limiting middleware (simplified version)
     */
    rateLimit(maxAttempts: number, windowMs: number): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Device verification middleware
     */
    requireVerifiedDevice(options?: {
        allowNewDevice?: boolean;
    }): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
    /**
     * IP whitelist middleware
     */
    requireWhitelistedIP(allowedIPs: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    /**
     * Extract token from request
     */
    private extractToken;
    /**
     * Check if user has required roles
     */
    private hasRequiredRoles;
    /**
     * Check if user has required permissions
     */
    private hasRequiredPermissions;
    /**
     * Handle authentication errors
     */
    private handleAuthError;
    /**
     * Middleware factory for combining multiple auth requirements
     */
    static combine(...middlewares: ((req: AuthenticatedRequest, res: Response, next: NextFunction) => void)[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
