"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const be_core_1 = require("@mono/be-core");
class AuthMiddleware {
    constructor(jwtProvider, sessionManager, config, // kept for compatibility but not used
    logger) {
        this.jwtProvider = jwtProvider;
        this.sessionManager = sessionManager;
        this.logger = logger || new be_core_1.Logger({ level: 'info', dir: './logs/auth' });
    }
    /**
     * Main authentication middleware
     */
    authenticate(options = {}) {
        return async (req, res, next) => {
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
                const authContext = {
                    userId: payload.userId,
                    sessionId: payload.sessionId,
                    roles: payload.roles || [],
                    permissions: payload.permissions || [],
                    userData: payload.userData || {},
                    deviceId: session?.deviceId,
                    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                    userAgent: req.get('user-agent') || 'unknown',
                };
                // Check role requirements
                if (options.roles &&
                    !this.hasRequiredRoles(authContext.roles, options.roles)) {
                    return this.handleAuthError(res, 'Insufficient roles', 403);
                }
                // Check permission requirements
                if (options.permissions &&
                    !this.hasRequiredPermissions(authContext.permissions, options.permissions)) {
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
                    permissions: authContext.permissions,
                });
                return next();
            }
            catch (error) {
                this.logger.error('Authentication middleware error:', {
                    error: error instanceof Error ? error.message : String(error),
                });
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
    requireAuth(options = {}) {
        return this.authenticate({ ...options, required: true });
    }
    /**
     * Optional authentication middleware
     */
    optionalAuth(options = {}) {
        return this.authenticate({ ...options, required: false });
    }
    /**
     * Role-based access control middleware
     */
    requireRoles(roles, options = {}) {
        return this.authenticate({ ...options, roles, required: true });
    }
    /**
     * Permission-based access control middleware
     */
    requirePermissions(permissions, options = {}) {
        return this.authenticate({ ...options, permissions, required: true });
    }
    /**
     * Admin-only access middleware
     */
    requireAdmin(options = {}) {
        return this.requireRoles(['admin'], options);
    }
    /**
     * Moderator or admin access middleware
     */
    requireModerator(options = {}) {
        return this.authenticate({
            ...options,
            roles: ['admin', 'moderator'],
            required: true,
        });
    }
    /**
     * Custom authorization middleware
     */
    authorize(authorizationFn) {
        return async (req, res, next) => {
            try {
                if (!req.auth) {
                    return this.handleAuthError(res, 'Authentication required', 401);
                }
                const authorized = await authorizationFn(req.auth, req);
                if (!authorized) {
                    return this.handleAuthError(res, 'Access denied', 403);
                }
                return next();
            }
            catch (error) {
                this.logger.error('Authorization error:', {
                    error: error instanceof Error ? error.message : String(error),
                });
                return this.handleAuthError(res, 'Authorization failed', 500);
            }
        };
    }
    /**
     * Rate limiting middleware (simplified version)
     */
    rateLimit(maxAttempts, windowMs) {
        return async (req, res, next) => {
            try {
                // For now, just log rate limiting attempts
                this.logger.debug('Rate limiting check', {
                    maxAttempts,
                    windowMs,
                    userId: req.auth?.userId,
                    ip: req.ip,
                });
                return next();
            }
            catch (error) {
                this.logger.error('Rate limiting error:', {
                    error: error instanceof Error ? error.message : String(error),
                });
                return next(); // Don't block on rate limiting errors
            }
        };
    }
    /**
     * Device verification middleware
     */
    requireVerifiedDevice(options = {}) {
        return async (req, res, next) => {
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
            }
            catch (error) {
                this.logger.error('Device verification error:', {
                    error: error instanceof Error ? error.message : String(error),
                });
                return this.handleAuthError(res, 'Device verification failed', 500);
            }
        };
    }
    /**
     * IP whitelist middleware
     */
    requireWhitelistedIP(allowedIPs) {
        return (req, res, next) => {
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
    extractToken(req) {
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
    hasRequiredRoles(userRoles, requiredRoles) {
        return requiredRoles.some((role) => userRoles.includes(role));
    }
    /**
     * Check if user has required permissions
     */
    hasRequiredPermissions(userPermissions, requiredPermissions) {
        return requiredPermissions.every((permission) => userPermissions.includes(permission));
    }
    /**
     * Handle authentication errors
     */
    handleAuthError(res, message, statusCode) {
        return res.status(statusCode).json({
            error: 'Authentication Error',
            message,
            statusCode,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Middleware factory for combining multiple auth requirements
     */
    static combine(...middlewares) {
        return (req, res, next) => {
            let currentIndex = 0;
            const runNext = (error) => {
                if (error)
                    return next(error);
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
exports.AuthMiddleware = AuthMiddleware;
