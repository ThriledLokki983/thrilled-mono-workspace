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
var JWTProvider_js_1 = require("../jwt/JWTProvider.js");
// Mock Redis
jest.mock('ioredis', function () {
    return {
        Redis: jest.fn(),
    };
});
// Mock Logger
jest.mock('@mono/be-core', function () {
    return {
        Logger: jest.fn(),
    };
});
describe('JWTProvider', function () {
    var jwtProvider;
    var mockRedis;
    var mockLogger;
    var testConfig = {
        accessToken: {
            secret: 'test-access-secret',
            expiresIn: '15m',
            algorithm: 'HS256',
        },
        refreshToken: {
            secret: 'test-refresh-secret',
            expiresIn: '7d',
            algorithm: 'HS256',
        },
    };
    beforeEach(function () {
        // Setup mocks
        mockRedis = {
            setex: jest.fn().mockResolvedValue('OK'),
            get: jest.fn().mockResolvedValue(null),
            del: jest.fn().mockResolvedValue(1),
            set: jest.fn().mockResolvedValue('OK'),
            keys: jest.fn().mockResolvedValue([]),
            sadd: jest.fn().mockResolvedValue(1),
            smembers: jest.fn().mockResolvedValue([]),
            srem: jest.fn().mockResolvedValue(1),
            ttl: jest.fn().mockResolvedValue(3600),
            exists: jest.fn().mockResolvedValue(0),
        };
        mockLogger = {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        };
        jwtProvider = new JWTProvider_js_1.JWTProvider(mockRedis, testConfig, mockLogger);
    });
    afterEach(function () {
        jest.clearAllMocks();
    });
    describe('createAccessToken', function () {
        it('should create a valid access token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: { email: 'test@example.com' },
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        expect(token).toBeDefined();
                        expect(typeof token).toBe('string');
                        expect(token.split('.')).toHaveLength(3); // JWT format
                        return [2 /*return*/];
                }
            });
        }); });
        it('should create token with custom options', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: { email: 'test@example.com' },
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        expect(token).toBeDefined();
                        expect(typeof token).toBe('string');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle errors gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidPayload;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidPayload = null;
                        return [4 /*yield*/, expect(jwtProvider.createAccessToken(invalidPayload)).rejects.toThrow()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('createRefreshToken', function () {
        it('should create and store a refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        token = _a.sent();
                        expect(token).toBeDefined();
                        expect(typeof token).toBe('string');
                        expect(mockRedis.setex).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle custom expiration', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        token = _a.sent();
                        expect(token).toBeDefined();
                        expect(mockRedis.setex).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('verifyAccessToken', function () {
        it('should verify a valid token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token, verified;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _c.sent();
                        // Mock Redis to return that token is not blacklisted
                        mockRedis.exists.mockResolvedValue(0);
                        return [4 /*yield*/, jwtProvider.verifyAccessToken(token)];
                    case 2:
                        verified = _c.sent();
                        expect(verified).toBeDefined();
                        expect(verified.isValid).toBe(true);
                        expect((_a = verified.payload) === null || _a === void 0 ? void 0 : _a.userId).toBe('user123');
                        expect((_b = verified.payload) === null || _b === void 0 ? void 0 : _b.sessionId).toBe('session123');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject blacklisted tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        // Mock Redis to return that token is blacklisted
                        mockRedis.exists.mockResolvedValue(1);
                        return [4 /*yield*/, jwtProvider.verifyAccessToken(token)];
                    case 2:
                        verified = _a.sent();
                        expect(verified.isValid).toBe(false);
                        expect(verified.error).toBe('Token is blacklisted');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject invalid tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidToken, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidToken = 'invalid.token.here';
                        return [4 /*yield*/, jwtProvider.verifyAccessToken(invalidToken)];
                    case 1:
                        verified = _a.sent();
                        expect(verified.isValid).toBe(false);
                        expect(verified.error).toContain('invalid token');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject expired tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var config, shortJwtProvider, payload, token, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = __assign(__assign({}, testConfig), { accessToken: __assign(__assign({}, testConfig.accessToken), { expiresIn: '1ms' }) });
                        shortJwtProvider = new JWTProvider_js_1.JWTProvider(mockRedis, config, mockLogger);
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, shortJwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        // Wait for token to expire
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                    case 2:
                        // Wait for token to expire
                        _a.sent();
                        return [4 /*yield*/, shortJwtProvider.verifyAccessToken(token)];
                    case 3:
                        verified = _a.sent();
                        expect(verified.isValid).toBe(false);
                        expect(verified.error).toContain('expired');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('verifyRefreshToken', function () {
        it('should verify a valid refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, token, verified;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        token = _c.sent();
                        // Mock Redis to return the same token
                        mockRedis.get.mockResolvedValue(token);
                        return [4 /*yield*/, jwtProvider.verifyRefreshToken(token)];
                    case 2:
                        verified = _c.sent();
                        expect(verified.isValid).toBe(true);
                        expect((_a = verified.payload) === null || _a === void 0 ? void 0 : _a.userId).toBe(userId);
                        expect((_b = verified.payload) === null || _b === void 0 ? void 0 : _b.sessionId).toBe(sessionId);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should reject tokens not in Redis', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, token, verified;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        token = _a.sent();
                        // Mock Redis to return null (token not found)
                        mockRedis.get.mockResolvedValue(null);
                        return [4 /*yield*/, jwtProvider.verifyRefreshToken(token)];
                    case 2:
                        verified = _a.sent();
                        expect(verified.isValid).toBe(false);
                        expect(verified.error).toBe('Token not found in store');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('refreshTokens', function () {
        it('should refresh tokens successfully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, userData, roles, permissions, oldRefreshToken, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        userData = { email: 'test@example.com' };
                        roles = ['user'];
                        permissions = ['read'];
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        oldRefreshToken = _a.sent();
                        // Mock Redis to return the same token for verification
                        mockRedis.get.mockResolvedValue(oldRefreshToken);
                        return [4 /*yield*/, jwtProvider.refreshTokens(oldRefreshToken, {
                                userData: userData,
                                roles: roles,
                                permissions: permissions,
                            })];
                    case 2:
                        result = _a.sent();
                        expect(result).toBeDefined();
                        if (result) {
                            expect(result.accessToken).toBeDefined();
                            expect(result.refreshToken).toBeDefined();
                            expect(result.refreshToken).not.toBe(oldRefreshToken); // Should be rotated
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        it('should not rotate refresh token when disabled', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, oldRefreshToken, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        oldRefreshToken = _a.sent();
                        // Mock Redis to return the same token for verification
                        mockRedis.get.mockResolvedValue(oldRefreshToken);
                        return [4 /*yield*/, jwtProvider.refreshTokens(oldRefreshToken, { userData: {}, roles: [], permissions: [] }, { rotateRefreshToken: false })];
                    case 2:
                        result = _a.sent();
                        expect(result).toBeDefined();
                        if (result) {
                            expect(result.refreshToken).toBe(oldRefreshToken);
                        }
                        return [2 /*return*/];
                }
            });
        }); });
        it('should fail with invalid refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidToken, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidToken = 'invalid.token.here';
                        return [4 /*yield*/, jwtProvider.refreshTokens(invalidToken, {
                                userData: {},
                                roles: [],
                                permissions: [],
                            })];
                    case 1:
                        result = _a.sent();
                        expect(result).toBeNull();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('blacklistToken', function () {
        it('should blacklist a token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        return [4 /*yield*/, jwtProvider.blacklistToken(token)];
                    case 2:
                        _a.sent();
                        expect(mockRedis.setex).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should handle invalid tokens gracefully', function () { return __awaiter(void 0, void 0, void 0, function () {
            var invalidToken;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invalidToken = 'invalid.token.here';
                        return [4 /*yield*/, expect(jwtProvider.blacklistToken(invalidToken)).rejects.toThrow()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('isTokenBlacklisted', function () {
        it('should check if token is blacklisted', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token, isBlacklisted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        // Mock Redis to return that token exists in blacklist
                        mockRedis.exists.mockResolvedValue(1);
                        return [4 /*yield*/, jwtProvider.isTokenBlacklisted(token)];
                    case 2:
                        isBlacklisted = _a.sent();
                        expect(isBlacklisted).toBe(true);
                        expect(mockRedis.exists).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return false for non-blacklisted tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token, isBlacklisted;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        // Mock Redis to return that token doesn't exist in blacklist
                        mockRedis.exists.mockResolvedValue(0);
                        return [4 /*yield*/, jwtProvider.isTokenBlacklisted(token)];
                    case 2:
                        isBlacklisted = _a.sent();
                        expect(isBlacklisted).toBe(false);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('blacklistUserTokens', function () {
        it('should blacklist all tokens for a user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        // Mock Redis to return some blacklisted tokens
                        mockRedis.smembers.mockResolvedValue(['token1', 'token2']);
                        return [4 /*yield*/, jwtProvider.blacklistUserTokens(userId)];
                    case 1:
                        _a.sent();
                        expect(mockRedis.smembers).toHaveBeenCalledWith("blacklisted_tokens:".concat(userId));
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('cleanupExpiredBlacklistedTokens', function () {
        it('should cleanup expired blacklisted tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, cleaned;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        // Mock Redis to return some tokens with TTL
                        mockRedis.smembers.mockResolvedValue(['token1', 'token2']);
                        mockRedis.ttl.mockResolvedValueOnce(-1).mockResolvedValueOnce(3600);
                        return [4 /*yield*/, jwtProvider.cleanupExpiredBlacklistedTokens(userId)];
                    case 1:
                        cleaned = _a.sent();
                        expect(cleaned).toBe(1); // One token should be cleaned
                        expect(mockRedis.srem).toHaveBeenCalledWith("blacklisted_tokens:".concat(userId), 'token1');
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTokenPayload', function () {
        it('should decode token payload without verification', function () { return __awaiter(void 0, void 0, void 0, function () {
            var payload, token, decoded;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        payload = {
                            userId: 'user123',
                            sessionId: 'session123',
                            roles: ['user'],
                            permissions: ['read'],
                            userData: {},
                        };
                        return [4 /*yield*/, jwtProvider.createAccessToken(payload)];
                    case 1:
                        token = _a.sent();
                        decoded = jwtProvider.getTokenPayload(token);
                        expect(decoded).toBeDefined();
                        expect(decoded === null || decoded === void 0 ? void 0 : decoded.userId).toBe('user123');
                        expect(decoded === null || decoded === void 0 ? void 0 : decoded.sessionId).toBe('session123');
                        return [2 /*return*/];
                }
            });
        }); });
        it('should return null for invalid tokens', function () {
            var invalidToken = 'invalid.token.here';
            var decoded = jwtProvider.getTokenPayload(invalidToken);
            expect(decoded).toBeNull();
        });
    });
    describe('revokeRefreshToken', function () {
        it('should revoke a refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId, sessionId, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        sessionId = 'session123';
                        return [4 /*yield*/, jwtProvider.createRefreshToken(userId, sessionId)];
                    case 1:
                        token = _a.sent();
                        return [4 /*yield*/, jwtProvider.revokeRefreshToken(token)];
                    case 2:
                        _a.sent();
                        expect(mockRedis.del).toHaveBeenCalled();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('revokeAllRefreshTokens', function () {
        it('should revoke all refresh tokens for a user', function () { return __awaiter(void 0, void 0, void 0, function () {
            var userId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userId = 'user123';
                        return [4 /*yield*/, jwtProvider.revokeAllRefreshTokens(userId)];
                    case 1:
                        _a.sent();
                        expect(mockRedis.del).toHaveBeenCalledWith("refresh_tokens:".concat(userId, ":*"));
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
