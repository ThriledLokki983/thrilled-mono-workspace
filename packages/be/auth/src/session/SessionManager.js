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
exports.SessionManager = void 0;
var crypto_1 = require("crypto");
var SessionManager = /** @class */ (function () {
    function SessionManager(config, cache, logger) {
        this.eventPrefix = 'auth:event:';
        // Set defaults for configuration
        var defaults = {
            defaultTTL: '24h',
            prefix: 'session:',
            ttl: 86400, // 24 hours in seconds
            rolling: true,
            maxSessionsPerUser: 5,
            maxSessions: 5,
            enableRollingSession: true,
            trackDevices: true,
            enableEventLogging: true,
        };
        this.config = __assign(__assign({}, defaults), config);
        this.cache = cache;
        this.logger = logger;
        this.sessionPrefix = this.config.prefix;
        this.userSessionPrefix = "".concat(this.config.prefix, "user:");
    }
    /**
     * Generate a unique session ID
     */
    SessionManager.prototype.generateSessionId = function () {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    };
    /**
     * Create a new user session
     */
    SessionManager.prototype.createSession = function (userId, deviceInfo, deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, now, expiresAt, session, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        sessionId = this.generateSessionId();
                        now = new Date();
                        expiresAt = new Date(now.getTime() + this.config.ttl * 1000);
                        session = {
                            sessionId: sessionId,
                            userId: userId,
                            deviceId: deviceId,
                            deviceInfo: deviceInfo,
                            createdAt: now,
                            lastActiveAt: now,
                            expiresAt: expiresAt,
                            isActive: true,
                        };
                        // Store session data
                        return [4 /*yield*/, this.cache.setObject("".concat(this.sessionPrefix).concat(sessionId), session, this.config.ttl)];
                    case 1:
                        // Store session data
                        _a.sent();
                        // Manage user session limit
                        return [4 /*yield*/, this.manageUserSessionLimit(userId, sessionId)];
                    case 2:
                        // Manage user session limit
                        _a.sent();
                        // Track authentication event
                        return [4 /*yield*/, this.trackAuthEvent({
                                eventType: 'login',
                                success: true,
                                userId: userId,
                                sessionId: sessionId,
                                ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ip,
                                userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                                metadata: { deviceInfo: deviceInfo, deviceId: deviceId },
                                timestamp: now,
                            })];
                    case 3:
                        // Track authentication event
                        _a.sent();
                        this.logger.info('Session created', {
                            sessionId: sessionId,
                            userId: userId,
                            deviceId: deviceId,
                        });
                        return [2 /*return*/, session];
                    case 4:
                        error_1 = _a.sent();
                        this.logger.error('Failed to create session', {
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                            userId: userId,
                        });
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get session by ID
     */
    SessionManager.prototype.getSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.sessionPrefix).concat(sessionId))];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            return [2 /*return*/, null];
                        }
                        if (!(new Date() > new Date(session.expiresAt))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.destroySession(sessionId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, null];
                    case 3:
                        if (!this.config.rolling) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.touchSession(sessionId)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/, session];
                    case 6:
                        error_2 = _a.sent();
                        this.logger.error('Failed to get session', {
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                            sessionId: sessionId,
                        });
                        return [2 /*return*/, null];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update session last active time
     */
    SessionManager.prototype.touchSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, now, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.sessionPrefix).concat(sessionId))];
                    case 1:
                        session = _a.sent();
                        if (!session) {
                            return [2 /*return*/];
                        }
                        now = new Date();
                        session.lastActiveAt = now;
                        // Extend expiration if rolling
                        if (this.config.rolling) {
                            session.expiresAt = new Date(now.getTime() + this.config.ttl * 1000);
                        }
                        return [4 /*yield*/, this.cache.setObject("".concat(this.sessionPrefix).concat(sessionId), session, this.config.ttl)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error('Failed to touch session', {
                            error: error_3 instanceof Error ? error_3.message : String(error_3),
                            sessionId: sessionId,
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Destroy a session
     */
    SessionManager.prototype.destroySession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.sessionPrefix).concat(sessionId))];
                    case 1:
                        session = _a.sent();
                        if (!session) return [3 /*break*/, 4];
                        // Remove from user session list
                        return [4 /*yield*/, this.removeFromUserSessions(session.userId, sessionId)];
                    case 2:
                        // Remove from user session list
                        _a.sent();
                        // Track logout event
                        return [4 /*yield*/, this.trackAuthEvent({
                                eventType: 'logout',
                                success: true,
                                userId: session.userId,
                                sessionId: sessionId,
                                timestamp: new Date(),
                            })];
                    case 3:
                        // Track logout event
                        _a.sent();
                        _a.label = 4;
                    case 4: 
                    // Remove session data
                    return [4 /*yield*/, this.cache.del("".concat(this.sessionPrefix).concat(sessionId))];
                    case 5:
                        // Remove session data
                        _a.sent();
                        this.logger.info('Session destroyed', { sessionId: sessionId });
                        return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        this.logger.error('Failed to destroy session', {
                            error: error_4 instanceof Error ? error_4.message : String(error_4),
                            sessionId: sessionId,
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all active sessions for a user
     */
    SessionManager.prototype.getUserSessions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionIds, sessions, _i, sessionIds_1, sessionId, session, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.userSessionPrefix).concat(userId))];
                    case 1:
                        sessionIds = (_a.sent()) || [];
                        sessions = [];
                        _i = 0, sessionIds_1 = sessionIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < sessionIds_1.length)) return [3 /*break*/, 5];
                        sessionId = sessionIds_1[_i];
                        return [4 /*yield*/, this.getSession(sessionId)];
                    case 3:
                        session = _a.sent();
                        if (session && session.isActive) {
                            sessions.push(session);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, sessions];
                    case 6:
                        error_5 = _a.sent();
                        this.logger.error('Failed to get user sessions', {
                            error: error_5 instanceof Error ? error_5.message : String(error_5),
                            userId: userId,
                        });
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Destroy all sessions for a user
     */
    SessionManager.prototype.destroyAllUserSessions = function (userId, excludeSessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionIds, _i, sessionIds_2, sessionId, remainingSessions, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.userSessionPrefix).concat(userId))];
                    case 1:
                        sessionIds = (_a.sent()) || [];
                        _i = 0, sessionIds_2 = sessionIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < sessionIds_2.length)) return [3 /*break*/, 5];
                        sessionId = sessionIds_2[_i];
                        if (!(sessionId !== excludeSessionId)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.destroySession(sessionId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        remainingSessions = excludeSessionId ? [excludeSessionId] : [];
                        if (!(remainingSessions.length > 0)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.cache.setObject("".concat(this.userSessionPrefix).concat(userId), remainingSessions, this.config.ttl)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.cache.del("".concat(this.userSessionPrefix).concat(userId))];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        this.logger.info('All user sessions destroyed', {
                            userId: userId,
                            excludeSessionId: excludeSessionId,
                        });
                        return [3 /*break*/, 11];
                    case 10:
                        error_6 = _a.sent();
                        this.logger.error('Failed to destroy user sessions', {
                            error: error_6 instanceof Error ? error_6.message : String(error_6),
                            userId: userId,
                        });
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Manage user session limit
     */
    SessionManager.prototype.manageUserSessionLimit = function (userId, newSessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionIds, sessionsToRemove, _i, sessionsToRemove_1, sessionId, keepSessions, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 10, , 11]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.userSessionPrefix).concat(userId))];
                    case 1:
                        sessionIds = (_a.sent()) || [];
                        // Add new session
                        sessionIds.push(newSessionId);
                        if (!(this.config.maxSessions &&
                            sessionIds.length > this.config.maxSessions)) return [3 /*break*/, 7];
                        sessionsToRemove = sessionIds.slice(0, sessionIds.length - this.config.maxSessions);
                        _i = 0, sessionsToRemove_1 = sessionsToRemove;
                        _a.label = 2;
                    case 2:
                        if (!(_i < sessionsToRemove_1.length)) return [3 /*break*/, 5];
                        sessionId = sessionsToRemove_1[_i];
                        return [4 /*yield*/, this.destroySession(sessionId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        keepSessions = sessionIds.slice(-this.config.maxSessions);
                        return [4 /*yield*/, this.cache.setObject("".concat(this.userSessionPrefix).concat(userId), keepSessions, this.config.ttl)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.cache.setObject("".concat(this.userSessionPrefix).concat(userId), sessionIds, this.config.ttl)];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_7 = _a.sent();
                        this.logger.error('Failed to manage session limit', {
                            error: error_7 instanceof Error ? error_7.message : String(error_7),
                            userId: userId,
                        });
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove session from user session list
     */
    SessionManager.prototype.removeFromUserSessions = function (userId, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionIds, updatedSessions, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.cache.getObject("".concat(this.userSessionPrefix).concat(userId))];
                    case 1:
                        sessionIds = (_a.sent()) || [];
                        updatedSessions = sessionIds.filter(function (id) { return id !== sessionId; });
                        if (!(updatedSessions.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.cache.setObject("".concat(this.userSessionPrefix).concat(userId), updatedSessions, this.config.ttl)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.cache.del("".concat(this.userSessionPrefix).concat(userId))];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_8 = _a.sent();
                        this.logger.error('Failed to remove session from user list', {
                            error: error_8 instanceof Error ? error_8.message : String(error_8),
                            userId: userId,
                            sessionId: sessionId,
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track authentication events
     */
    SessionManager.prototype.trackAuthEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var eventKey, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        eventKey = "".concat(this.eventPrefix).concat(event.userId, ":").concat(Date.now());
                        return [4 /*yield*/, this.cache.setObject(eventKey, event, 86400 // Keep events for 24 hours
                            )];
                    case 1:
                        _a.sent();
                        this.logger.debug('Auth event tracked', {
                            eventType: event.eventType,
                            userId: event.userId,
                            sessionId: event.sessionId,
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        this.logger.error('Failed to track auth event', {
                            error: error_9 instanceof Error ? error_9.message : String(error_9),
                            eventType: event.eventType,
                        });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get authentication events for a user
     */
    SessionManager.prototype.getUserAuthEvents = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            var pattern, keys, events, keysToProcess, _i, keysToProcess_1, key, event_1, error_10;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        pattern = "".concat(this.eventPrefix).concat(userId, ":*");
                        return [4 /*yield*/, this.cache.keys(pattern)];
                    case 1:
                        keys = _a.sent();
                        // Sort by timestamp (newest first)
                        keys.sort().reverse();
                        events = [];
                        keysToProcess = keys.slice(0, limit);
                        _i = 0, keysToProcess_1 = keysToProcess;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keysToProcess_1.length)) return [3 /*break*/, 5];
                        key = keysToProcess_1[_i];
                        return [4 /*yield*/, this.cache.getObject(key)];
                    case 3:
                        event_1 = _a.sent();
                        if (event_1) {
                            events.push(event_1);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, events];
                    case 6:
                        error_10 = _a.sent();
                        this.logger.error('Failed to get user auth events', {
                            error: error_10 instanceof Error ? error_10.message : String(error_10),
                            userId: userId,
                        });
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up expired sessions
     */
    SessionManager.prototype.cleanupExpiredSessions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pattern, keys, cleaned, _i, keys_1, key, session, sessionId, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        pattern = "".concat(this.sessionPrefix, "*");
                        return [4 /*yield*/, this.cache.keys(pattern)];
                    case 1:
                        keys = _a.sent();
                        cleaned = 0;
                        _i = 0, keys_1 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 6];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.cache.getObject(key)];
                    case 3:
                        session = _a.sent();
                        if (!(session && new Date() > new Date(session.expiresAt))) return [3 /*break*/, 5];
                        sessionId = key.replace(this.sessionPrefix, '');
                        return [4 /*yield*/, this.destroySession(sessionId)];
                    case 4:
                        _a.sent();
                        cleaned++;
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        this.logger.debug('Session cleanup completed', { cleaned: cleaned });
                        return [2 /*return*/, cleaned];
                    case 7:
                        error_11 = _a.sent();
                        this.logger.error('Session cleanup failed', {
                            error: error_11 instanceof Error ? error_11.message : String(error_11),
                        });
                        return [2 /*return*/, 0];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get session statistics
     */
    SessionManager.prototype.getSessionStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var pattern, keys, now, totalSessions, activeSessions, expiredSessions, _i, keys_2, key, session, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        pattern = "".concat(this.sessionPrefix, "*");
                        return [4 /*yield*/, this.cache.keys(pattern)];
                    case 1:
                        keys = _a.sent();
                        now = new Date();
                        totalSessions = 0;
                        activeSessions = 0;
                        expiredSessions = 0;
                        _i = 0, keys_2 = keys;
                        _a.label = 2;
                    case 2:
                        if (!(_i < keys_2.length)) return [3 /*break*/, 5];
                        key = keys_2[_i];
                        return [4 /*yield*/, this.cache.getObject(key)];
                    case 3:
                        session = _a.sent();
                        if (session) {
                            totalSessions++;
                            if (now <= new Date(session.expiresAt) && session.isActive) {
                                activeSessions++;
                            }
                            else {
                                expiredSessions++;
                            }
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, {
                            totalSessions: totalSessions,
                            activeSessions: activeSessions,
                            expiredSessions: expiredSessions,
                        }];
                    case 6:
                        error_12 = _a.sent();
                        this.logger.error('Failed to get session stats', {
                            error: error_12 instanceof Error ? error_12.message : String(error_12),
                        });
                        return [2 /*return*/, {
                                totalSessions: 0,
                                activeSessions: 0,
                                expiredSessions: 0,
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update session configuration
     */
    SessionManager.prototype.updateConfig = function (newConfig) {
        Object.assign(this.config, newConfig);
        this.logger.info('Session configuration updated', { newConfig: newConfig });
    };
    /**
     * Get current session configuration
     */
    SessionManager.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    return SessionManager;
}());
exports.SessionManager = SessionManager;
