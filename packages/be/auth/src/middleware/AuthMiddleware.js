"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
var be_core_1 = require("@mono/be-core");
var AuthMiddleware = /** @class */ (function () {
    function AuthMiddleware(jwtProvider, sessionManager, config, // kept for compatibility but not used
    logger) {
        this.jwtProvider = jwtProvider;
        this.sessionManager = sessionManager;
        this.logger = logger || new be_core_1.Logger({ level: 'info', dir: './logs/auth' });
    }
    /**
     * Main authentication middleware
     */
    AuthMiddleware.prototype.authenticate = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var token, verificationResult, payload, session, authContext, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        token = this.extractToken(req);
                        if (!token) {
                            if (options.required !== false) {
                                return [2 /*return*/, this.handleAuthError(res, 'No token provided', 401)];
                            }
                            return [2 /*return*/, next()];
                        }
                        return [4 /*yield*/, this.jwtProvider.verifyAccessToken(token)];
                    case 1:
                        verificationResult = _a.sent();
                        if (!verificationResult.isValid || !verificationResult.payload) {
                            if (options.required !== false) {
                                return [2 /*return*/, this.handleAuthError(res, 'Invalid token', 401)];
                            }
                            return [2 /*return*/, next()];
                        }
                        payload = verificationResult.payload;
                        session = null;
                        if (!(!options.skipSessionValidation && payload.sessionId)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.sessionManager.getSession(payload.sessionId)];
                    case 2:
                        session = _a.sent();
                        if (!session) {
                            if (options.required !== false) {
                                return [2 /*return*/, this.handleAuthError(res, 'Session not found', 401)];
                            }
                            return [2 /*return*/, next()];
                        }
                        if (!(session.expiresAt < new Date())) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.sessionManager.destroySession(payload.sessionId)];
                    case 3:
                        _a.sent();
                        if (options.required !== false) {
                            return [2 /*return*/, this.handleAuthError(res, 'Session expired', 401)];
                        }
                        return [2 /*return*/, next()];
                    case 4: 
                    // Update session activity
                    return [4 /*yield*/, this.sessionManager.touchSession(payload.sessionId)];
                    case 5:
                        // Update session activity
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        authContext = {
                            userId: payload.userId,
                            sessionId: payload.sessionId,
                            roles: payload.roles || [],
                            permissions: payload.permissions || [],
                            userData: payload.userData || {},
                            deviceId: session === null || session === void 0 ? void 0 : session.deviceId,
                            ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
                            userAgent: req.get('user-agent') || 'unknown',
                        };
                        // Check role requirements
                        if (options.roles &&
                            !this.hasRequiredRoles(authContext.roles, options.roles)) {
                            return [2 /*return*/, this.handleAuthError(res, 'Insufficient roles', 403)];
                        }
                        // Check permission requirements
                        if (options.permissions &&
                            !this.hasRequiredPermissions(authContext.permissions, options.permissions)) {
                            return [2 /*return*/, this.handleAuthError(res, 'Insufficient permissions', 403)];
                        }
                        // Attach auth context to request
                        req.auth = authContext;
                        req.user = __assign({ id: payload.userId }, payload.userData);
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
                        return [2 /*return*/, next()];
                    case 7:
                        error_1 = _a.sent();
                        this.logger.error('Authentication middleware error:', {
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                        });
                        if (options.required !== false) {
                            return [2 /*return*/, this.handleAuthError(res, 'Authentication failed', 500)];
                        }
                        return [2 /*return*/, next()];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Require authentication middleware
     */
    AuthMiddleware.prototype.requireAuth = function (options) {
        if (options === void 0) { options = {}; }
        return this.authenticate(__assign(__assign({}, options), { required: true }));
    };
    /**
     * Optional authentication middleware
     */
    AuthMiddleware.prototype.optionalAuth = function (options) {
        if (options === void 0) { options = {}; }
        return this.authenticate(__assign(__assign({}, options), { required: false }));
    };
    /**
     * Role-based access control middleware
     */
    AuthMiddleware.prototype.requireRoles = function (roles, options) {
        if (options === void 0) { options = {}; }
        return this.authenticate(__assign(__assign({}, options), { roles: roles, required: true }));
    };
    /**
     * Permission-based access control middleware
     */
    AuthMiddleware.prototype.requirePermissions = function (permissions, options) {
        if (options === void 0) { options = {}; }
        return this.authenticate(__assign(__assign({}, options), { permissions: permissions, required: true }));
    };
    /**
     * Admin-only access middleware
     */
    AuthMiddleware.prototype.requireAdmin = function (options) {
        if (options === void 0) { options = {}; }
        return this.requireRoles(['admin'], options);
    };
    /**
     * Moderator or admin access middleware
     */
    AuthMiddleware.prototype.requireModerator = function (options) {
        if (options === void 0) { options = {}; }
        return this.authenticate(__assign(__assign({}, options), { roles: ['admin', 'moderator'], required: true }));
    };
    /**
     * Custom authorization middleware
     */
    AuthMiddleware.prototype.authorize = function (authorizationFn) {
        var _this = this;
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var authorized, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!req.auth) {
                            return [2 /*return*/, this.handleAuthError(res, 'Authentication required', 401)];
                        }
                        return [4 /*yield*/, authorizationFn(req.auth, req)];
                    case 1:
                        authorized = _a.sent();
                        if (!authorized) {
                            return [2 /*return*/, this.handleAuthError(res, 'Access denied', 403)];
                        }
                        return [2 /*return*/, next()];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('Authorization error:', {
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                        });
                        return [2 /*return*/, this.handleAuthError(res, 'Authorization failed', 500)];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * Rate limiting middleware (simplified version)
     */
    AuthMiddleware.prototype.rateLimit = function (maxAttempts, windowMs) {
        var _this = this;
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                try {
                    // For now, just log rate limiting attempts
                    this.logger.debug('Rate limiting check', {
                        maxAttempts: maxAttempts,
                        windowMs: windowMs,
                        userId: (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId,
                        ip: req.ip,
                    });
                    return [2 /*return*/, next()];
                }
                catch (error) {
                    this.logger.error('Rate limiting error:', {
                        error: error instanceof Error ? error.message : String(error),
                    });
                    return [2 /*return*/, next()]; // Don't block on rate limiting errors
                }
                return [2 /*return*/];
            });
        }); };
    };
    /**
     * Device verification middleware
     */
    AuthMiddleware.prototype.requireVerifiedDevice = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var session, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.sessionId)) {
                            return [2 /*return*/, this.handleAuthError(res, 'Session required', 401)];
                        }
                        return [4 /*yield*/, this.sessionManager.getSession(req.auth.sessionId)];
                    case 1:
                        session = _b.sent();
                        if (!session) {
                            return [2 /*return*/, this.handleAuthError(res, 'Session not found', 401)];
                        }
                        if (!session.deviceVerified) {
                            if (!options.allowNewDevice) {
                                return [2 /*return*/, this.handleAuthError(res, 'Device verification required', 403)];
                            }
                        }
                        return [2 /*return*/, next()];
                    case 2:
                        error_3 = _b.sent();
                        this.logger.error('Device verification error:', {
                            error: error_3 instanceof Error ? error_3.message : String(error_3),
                        });
                        return [2 /*return*/, this.handleAuthError(res, 'Device verification failed', 500)];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * IP whitelist middleware
     */
    AuthMiddleware.prototype.requireWhitelistedIP = function (allowedIPs) {
        var _this = this;
        return function (req, res, next) {
            var clientIP = req.ip || req.connection.remoteAddress;
            if (!clientIP || !allowedIPs.includes(clientIP)) {
                return _this.handleAuthError(res, 'IP not whitelisted', 403);
            }
            return next();
        };
    };
    /**
     * Extract token from request
     */
    AuthMiddleware.prototype.extractToken = function (req) {
        // Check Authorization header
        var authHeader = req.headers.authorization;
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
    };
    /**
     * Check if user has required roles
     */
    AuthMiddleware.prototype.hasRequiredRoles = function (userRoles, requiredRoles) {
        return requiredRoles.some(function (role) { return userRoles.includes(role); });
    };
    /**
     * Check if user has required permissions
     */
    AuthMiddleware.prototype.hasRequiredPermissions = function (userPermissions, requiredPermissions) {
        return requiredPermissions.every(function (permission) {
            return userPermissions.includes(permission);
        });
    };
    /**
     * Handle authentication errors
     */
    AuthMiddleware.prototype.handleAuthError = function (res, message, statusCode) {
        return res.status(statusCode).json({
            error: 'Authentication Error',
            message: message,
            statusCode: statusCode,
            timestamp: new Date().toISOString(),
        });
    };
    /**
     * Middleware factory for combining multiple auth requirements
     */
    AuthMiddleware.combine = function () {
        var middlewares = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            middlewares[_i] = arguments[_i];
        }
        return function (req, res, next) {
            var currentIndex = 0;
            var runNext = function (error) {
                if (error)
                    return next(error);
                if (currentIndex >= middlewares.length) {
                    return next();
                }
                var middleware = middlewares[currentIndex++];
                middleware(req, res, runNext);
            };
            runNext();
        };
    };
    return AuthMiddleware;
}());
exports.AuthMiddleware = AuthMiddleware;
