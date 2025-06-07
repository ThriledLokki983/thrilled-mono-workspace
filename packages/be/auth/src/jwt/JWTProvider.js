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
exports.JWTProvider = void 0;
var jwt = require("jsonwebtoken");
var JWTProvider = /** @class */ (function () {
    function JWTProvider(redis, config, logger) {
        this.redis = redis;
        this.config = config;
        this.logger = logger;
        this.blacklistKeyPrefix = 'jwt:blacklist:';
        this.refreshTokenPrefix = 'jwt:refresh:';
    }
    /**
     * Create an access token
     */
    JWTProvider.prototype.createAccessToken = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenPayload, options, jwtModule, token, errorMessage;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                try {
                    tokenPayload = __assign(__assign({}, payload), { type: 'access', iat: Math.floor(Date.now() / 1000) });
                    options = {
                        expiresIn: this.config.accessToken.expiresIn,
                        algorithm: this.config.accessToken.algorithm,
                    };
                    // Only add issuer and audience if they are defined
                    if (this.config.accessToken.issuer) {
                        options.issuer = this.config.accessToken.issuer;
                    }
                    if (this.config.accessToken.audience) {
                        options.audience = this.config.accessToken.audience;
                    }
                    jwtModule = jwt.default || jwt;
                    token = jwtModule.sign(tokenPayload, this.config.accessToken.secret, options);
                    this.logger.debug('Access token created', { userId: payload.userId });
                    return [2 /*return*/, token];
                }
                catch (error) {
                    // More detailed error logging
                    console.error('JWT Provider createAccessToken error details:', {
                        errorType: typeof error,
                        errorConstructor: (_a = error === null || error === void 0 ? void 0 : error.constructor) === null || _a === void 0 ? void 0 : _a.name,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                        payloadType: typeof payload,
                        configType: typeof this.config,
                        secretLength: (_d = (_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.accessToken) === null || _c === void 0 ? void 0 : _c.secret) === null || _d === void 0 ? void 0 : _d.length,
                        algorithm: (_f = (_e = this.config) === null || _e === void 0 ? void 0 : _e.accessToken) === null || _f === void 0 ? void 0 : _f.algorithm,
                        expiresIn: (_h = (_g = this.config) === null || _g === void 0 ? void 0 : _g.accessToken) === null || _h === void 0 ? void 0 : _h.expiresIn
                    });
                    errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    this.logger.error('Failed to create access token:', {
                        error: errorMessage,
                    });
                    throw new Error('Token creation failed');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Create a refresh token
     */
    JWTProvider.prototype.createRefreshToken = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenPayload, options, jwtModule, token, key, ttl, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        tokenPayload = {
                            userId: userId,
                            sessionId: sessionId,
                            type: 'refresh',
                            iat: Math.floor(Date.now() / 1000),
                            // Add a random nonce to ensure uniqueness
                            nonce: Math.random().toString(36).substring(2, 15),
                        };
                        options = {
                            expiresIn: this.config.refreshToken.expiresIn,
                            algorithm: this.config.refreshToken.algorithm,
                        };
                        // Only add issuer and audience if they are defined
                        if (this.config.refreshToken.issuer) {
                            options.issuer = this.config.refreshToken.issuer;
                        }
                        if (this.config.refreshToken.audience) {
                            options.audience = this.config.refreshToken.audience;
                        }
                        jwtModule = jwt.default || jwt;
                        token = jwtModule.sign(tokenPayload, this.config.refreshToken.secret, options);
                        key = "".concat(this.refreshTokenPrefix).concat(userId, ":").concat(sessionId);
                        ttl = this.parseExpirationToSeconds(this.config.refreshToken.expiresIn);
                        return [4 /*yield*/, this.redis.setex(key, ttl, token)];
                    case 1:
                        _a.sent();
                        this.logger.debug('Refresh token created', { userId: userId, sessionId: sessionId });
                        return [2 /*return*/, token];
                    case 2:
                        error_1 = _a.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : 'Unknown error';
                        this.logger.error('Failed to create refresh token:', {
                            error: errorMessage,
                        });
                        throw new Error('Refresh token creation failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify an access token
     */
    JWTProvider.prototype.verifyAccessToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var isBlacklisted, options, jwtModule, payload, error_2, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.isTokenBlacklisted(token)];
                    case 1:
                        isBlacklisted = _a.sent();
                        if (isBlacklisted) {
                            return [2 /*return*/, { isValid: false, error: 'Token is blacklisted' }];
                        }
                        options = {
                            algorithms: [this.config.accessToken.algorithm],
                        };
                        if (this.config.accessToken.issuer) {
                            options.issuer = this.config.accessToken.issuer;
                        }
                        if (this.config.accessToken.audience) {
                            options.audience = this.config.accessToken.audience;
                        }
                        jwtModule = jwt.default || jwt;
                        payload = jwtModule.verify(token, this.config.accessToken.secret, options);
                        if (payload.type !== 'access') {
                            return [2 /*return*/, { isValid: false, error: 'Invalid token type' }];
                        }
                        return [2 /*return*/, { isValid: true, payload: payload }];
                    case 2:
                        error_2 = _a.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : 'Token verification failed';
                        this.logger.debug('Access token verification failed:', {
                            error: errorMessage,
                        });
                        return [2 /*return*/, { isValid: false, error: errorMessage }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify a refresh token
     */
    JWTProvider.prototype.verifyRefreshToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var options, jwtModule, payload, key, storedToken, error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        options = {
                            algorithms: [this.config.refreshToken.algorithm],
                        };
                        if (this.config.refreshToken.issuer) {
                            options.issuer = this.config.refreshToken.issuer;
                        }
                        if (this.config.refreshToken.audience) {
                            options.audience = this.config.refreshToken.audience;
                        }
                        jwtModule = jwt.default || jwt;
                        payload = jwtModule.verify(token, this.config.refreshToken.secret, options);
                        if (payload.type !== 'refresh') {
                            return [2 /*return*/, { isValid: false, error: 'Invalid token type' }];
                        }
                        key = "".concat(this.refreshTokenPrefix).concat(payload.userId, ":").concat(payload.sessionId);
                        return [4 /*yield*/, this.redis.get(key)];
                    case 1:
                        storedToken = _a.sent();
                        if (!storedToken || storedToken !== token) {
                            return [2 /*return*/, { isValid: false, error: 'Token not found in store' }];
                        }
                        return [2 /*return*/, {
                                isValid: true,
                                payload: {
                                    userId: payload.userId,
                                    sessionId: payload.sessionId,
                                    roles: [],
                                    permissions: [],
                                    userData: {},
                                    type: 'refresh',
                                    iat: payload.iat,
                                },
                            }];
                    case 2:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : 'Token verification failed';
                        this.logger.debug('Refresh token verification failed:', {
                            error: errorMessage,
                        });
                        return [2 /*return*/, { isValid: false, error: errorMessage }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Refresh tokens (generate new access token and optionally new refresh token)
     */
    JWTProvider.prototype.refreshTokens = function (refreshToken, options, config) {
        return __awaiter(this, void 0, void 0, function () {
            var verification, payload, accessTokenPayload, newAccessToken, newRefreshToken, shouldRotate, error_4, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.verifyRefreshToken(refreshToken)];
                    case 1:
                        verification = _a.sent();
                        if (!verification.isValid || !verification.payload) {
                            return [2 /*return*/, null];
                        }
                        payload = verification.payload;
                        accessTokenPayload = {
                            userId: payload.userId,
                            sessionId: payload.sessionId,
                            roles: (options === null || options === void 0 ? void 0 : options.roles) || [],
                            permissions: (options === null || options === void 0 ? void 0 : options.permissions) || [],
                            userData: (options === null || options === void 0 ? void 0 : options.userData) || {},
                        };
                        return [4 /*yield*/, this.createAccessToken(accessTokenPayload)];
                    case 2:
                        newAccessToken = _a.sent();
                        newRefreshToken = void 0;
                        shouldRotate = (config === null || config === void 0 ? void 0 : config.rotateRefreshToken) !== false;
                        if (!shouldRotate) return [3 /*break*/, 5];
                        // Revoke old refresh token
                        return [4 /*yield*/, this.revokeRefreshToken(refreshToken)];
                    case 3:
                        // Revoke old refresh token
                        _a.sent();
                        return [4 /*yield*/, this.createRefreshToken(payload.userId, payload.sessionId)];
                    case 4:
                        // Create new refresh token
                        newRefreshToken = _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        // Don't rotate, return the same token
                        newRefreshToken = refreshToken;
                        _a.label = 6;
                    case 6: return [2 /*return*/, {
                            accessToken: newAccessToken,
                            refreshToken: newRefreshToken,
                        }];
                    case 7:
                        error_4 = _a.sent();
                        errorMessage = error_4 instanceof Error ? error_4.message : 'Unknown error';
                        this.logger.error('Token refresh failed:', { error: errorMessage });
                        return [2 /*return*/, null];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Blacklist a token
     */
    JWTProvider.prototype.blacklistToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var decoded, tokenKey, ttl, error_5, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        decoded = this.getTokenPayload(token);
                        if (!decoded || typeof decoded.exp !== 'number') {
                            throw new Error('Invalid token format');
                        }
                        tokenKey = "".concat(this.blacklistKeyPrefix).concat(token);
                        ttl = Math.max(decoded.exp - Math.floor(Date.now() / 1000), 1);
                        return [4 /*yield*/, this.redis.setex(tokenKey, ttl, '1')];
                    case 1:
                        _a.sent();
                        this.logger.debug('Token blacklisted', {
                            tokenPreview: token.substring(0, 20) + '...',
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        errorMessage = error_5 instanceof Error ? error_5.message : 'Unknown error';
                        this.logger.error('Failed to blacklist token:', { error: errorMessage });
                        throw new Error('Token blacklisting failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a token is blacklisted
     */
    JWTProvider.prototype.isTokenBlacklisted = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenKey, exists, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        tokenKey = "".concat(this.blacklistKeyPrefix).concat(token);
                        return [4 /*yield*/, this.redis.exists(tokenKey)];
                    case 1:
                        exists = _a.sent();
                        return [2 /*return*/, exists === 1];
                    case 2:
                        error_6 = _a.sent();
                        this.logger.error('Failed to check token blacklist status:', {
                            error: error_6 instanceof Error ? error_6.message : String(error_6),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Blacklist all tokens for a user
     */
    JWTProvider.prototype.blacklistUserTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var pattern, tokens, _i, tokens_1, token, error_7, errorMessage, error_8, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        pattern = "blacklisted_tokens:".concat(userId);
                        return [4 /*yield*/, this.redis.smembers(pattern)];
                    case 1:
                        tokens = _a.sent();
                        _i = 0, tokens_1 = tokens;
                        _a.label = 2;
                    case 2:
                        if (!(_i < tokens_1.length)) return [3 /*break*/, 7];
                        token = tokens_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.blacklistToken(token)];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        error_7 = _a.sent();
                        errorMessage = error_7 instanceof Error ? error_7.message : 'Unknown error';
                        this.logger.warn('Failed to blacklist individual token', {
                            token: token.substring(0, 20) + '...',
                            error: errorMessage,
                        });
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        this.logger.debug('All tokens blacklisted for user', { userId: userId });
                        return [3 /*break*/, 9];
                    case 8:
                        error_8 = _a.sent();
                        errorMessage = error_8 instanceof Error ? error_8.message : 'Unknown error';
                        this.logger.error('Failed to blacklist user tokens:', {
                            error: errorMessage,
                        });
                        throw new Error('User token blacklisting failed');
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up expired blacklisted tokens
     */
    JWTProvider.prototype.cleanupExpiredBlacklistedTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var pattern, tokens, cleanedCount, _i, tokens_2, token, tokenKey, ttl, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        pattern = "blacklisted_tokens:".concat(userId);
                        return [4 /*yield*/, this.redis.smembers(pattern)];
                    case 1:
                        tokens = _a.sent();
                        cleanedCount = 0;
                        _i = 0, tokens_2 = tokens;
                        _a.label = 2;
                    case 2:
                        if (!(_i < tokens_2.length)) return [3 /*break*/, 6];
                        token = tokens_2[_i];
                        tokenKey = "".concat(this.blacklistKeyPrefix).concat(token);
                        return [4 /*yield*/, this.redis.ttl(tokenKey)];
                    case 3:
                        ttl = _a.sent();
                        if (!(ttl === -1 || ttl === -2)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.redis.srem(pattern, token)];
                    case 4:
                        _a.sent();
                        cleanedCount++;
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, cleanedCount];
                    case 7:
                        error_9 = _a.sent();
                        this.logger.error('Failed to cleanup expired tokens:', {
                            error: error_9 instanceof Error ? error_9.message : String(error_9),
                        });
                        return [2 /*return*/, 0];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get token payload without verification (for debugging/logging)
     */
    JWTProvider.prototype.getTokenPayload = function (token) {
        try {
            var jwtModule = jwt.default || jwt;
            return jwtModule.decode(token);
        }
        catch (error) {
            this.logger.debug('Failed to decode token:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    };
    /**
     * Revoke a specific refresh token
     */
    JWTProvider.prototype.revokeRefreshToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var decoded, key, error_10, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        decoded = this.getTokenPayload(token);
                        if (!decoded || decoded.type !== 'refresh') {
                            throw new Error('Invalid refresh token');
                        }
                        key = "".concat(this.refreshTokenPrefix).concat(decoded.userId, ":").concat(decoded.sessionId);
                        return [4 /*yield*/, this.redis.del(key)];
                    case 1:
                        _a.sent();
                        this.logger.debug('Refresh token revoked', {
                            userId: decoded.userId,
                            sessionId: decoded.sessionId,
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _a.sent();
                        errorMessage = error_10 instanceof Error ? error_10.message : 'Unknown error';
                        this.logger.error('Failed to revoke refresh token:', {
                            error: errorMessage,
                        });
                        throw new Error('Refresh token revocation failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Revoke all refresh tokens for a user
     */
    JWTProvider.prototype.revokeAllRefreshTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var pattern, error_11, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        pattern = "refresh_tokens:".concat(userId, ":*");
                        return [4 /*yield*/, this.redis.del(pattern)];
                    case 1:
                        _a.sent();
                        this.logger.debug('All refresh tokens revoked for user', { userId: userId });
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        errorMessage = error_11 instanceof Error ? error_11.message : 'Unknown error';
                        this.logger.error('Failed to revoke all refresh tokens:', {
                            error: errorMessage,
                        });
                        throw new Error('Refresh token revocation failed');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse expiration string to seconds
     */
    JWTProvider.prototype.parseExpirationToSeconds = function (expiration) {
        var timeUnits = {
            s: 1,
            m: 60,
            h: 3600,
            d: 86400,
            w: 604800,
        };
        var match = expiration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            throw new Error("Invalid expiration format: ".concat(expiration));
        }
        var value = parseInt(match[1], 10);
        var unit = match[2];
        return value * (timeUnits[unit] || 1);
    };
    return JWTProvider;
}());
exports.JWTProvider = JWTProvider;
