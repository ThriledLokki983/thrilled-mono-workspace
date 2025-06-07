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
exports.PasswordManager = void 0;
var bcrypt_1 = require("bcrypt");
var crypto_1 = require("crypto");
var PasswordManager = /** @class */ (function () {
    function PasswordManager(config, cache, logger) {
        this.resetTokenPrefix = 'pwd:reset:';
        this.attemptPrefix = 'pwd:attempt:';
        // Set defaults for missing config properties
        var defaults = {
            saltRounds: 12,
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false,
            requireSpecialChars: false,
            maxAttempts: 5,
            lockoutDuration: '15m',
        };
        this.config = __assign(__assign({}, defaults), config);
        this.cache = cache;
        this.logger = logger;
    }
    /**
     * Hash a password using bcrypt
     */
    PasswordManager.prototype.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            var salt, hash, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.validatePasswordPolicy(password);
                        return [4 /*yield*/, bcrypt_1.default.genSalt(this.config.saltRounds)];
                    case 1:
                        salt = _a.sent();
                        return [4 /*yield*/, bcrypt_1.default.hash(password, salt)];
                    case 2:
                        hash = _a.sent();
                        this.logger.debug('Password hashed successfully', {
                            saltRounds: this.config.saltRounds,
                        });
                        return [2 /*return*/, hash];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error('Password hashing failed', {
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                        });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify password against hash
     */
    PasswordManager.prototype.verifyPassword = function (password, hash) {
        return __awaiter(this, void 0, void 0, function () {
            var isValid, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, bcrypt_1.default.compare(password, hash)];
                    case 1:
                        isValid = _a.sent();
                        this.logger.debug('Password verification completed', {
                            isValid: isValid,
                        });
                        return [2 /*return*/, isValid];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('Password verification failed', {
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate password against policy
     */
    PasswordManager.prototype.validatePasswordPolicy = function (password) {
        var errors = [];
        // Length check
        if (password.length < this.config.minLength) {
            errors.push("Password must be at least ".concat(this.config.minLength, " characters long"));
        }
        // Uppercase check
        if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        // Lowercase check
        if (this.config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        // Numbers check
        if (this.config.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        // Symbols check
        if (this.config.requireSymbols &&
            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        // Blacklist check
        if (this.config.blacklistedPasswords) {
            var lowercasePassword = password.toLowerCase();
            for (var _i = 0, _a = this.config.blacklistedPasswords; _i < _a.length; _i++) {
                var blacklisted = _a[_i];
                if (lowercasePassword.includes(blacklisted.toLowerCase())) {
                    errors.push('Password contains forbidden words or patterns');
                    break;
                }
            }
        }
        if (errors.length > 0) {
            throw new Error("Password policy validation failed: ".concat(errors.join(', ')));
        }
    };
    /**
     * Generate password strength score (0-100)
     */
    PasswordManager.prototype.calculatePasswordStrength = function (password) {
        var score = 0;
        var feedback = [];
        // Length scoring
        if (password.length >= 8)
            score += 20;
        if (password.length >= 12)
            score += 10;
        if (password.length >= 16)
            score += 10;
        else if (password.length < 8) {
            feedback.push('Use at least 8 characters');
        }
        // Character variety
        if (/[a-z]/.test(password))
            score += 10;
        else
            feedback.push('Add lowercase letters');
        if (/[A-Z]/.test(password))
            score += 10;
        else
            feedback.push('Add uppercase letters');
        if (/\d/.test(password))
            score += 10;
        else
            feedback.push('Add numbers');
        if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password))
            score += 15;
        else
            feedback.push('Add special characters');
        // Pattern checking
        if (!/(.)\1{2,}/.test(password))
            score += 10; // No repeated characters
        else
            feedback.push('Avoid repeated characters');
        if (!/(\d{3,})/.test(password))
            score += 5; // No long number sequences
        else
            feedback.push('Avoid long number sequences');
        // Common patterns
        var commonPatterns = ['123', 'abc', 'qwe', 'password', 'admin'];
        var hasCommonPattern = commonPatterns.some(function (pattern) {
            return password.toLowerCase().includes(pattern);
        });
        if (!hasCommonPattern)
            score += 10;
        else
            feedback.push('Avoid common patterns');
        return {
            score: Math.min(score, 100),
            feedback: feedback,
        };
    };
    /**
     * Generate a secure random password
     */
    PasswordManager.prototype.generatePassword = function (length) {
        if (length === void 0) { length = 16; }
        var lowercase = 'abcdefghijklmnopqrstuvwxyz';
        var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var numbers = '0123456789';
        var symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        var charset = '';
        var password = '';
        // Ensure required character types are included
        if (this.config.requireLowercase) {
            charset += lowercase;
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
        }
        if (this.config.requireUppercase) {
            charset += uppercase;
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
        }
        if (this.config.requireNumbers) {
            charset += numbers;
            password += numbers[Math.floor(Math.random() * numbers.length)];
        }
        if (this.config.requireSymbols) {
            charset += symbols;
            password += symbols[Math.floor(Math.random() * symbols.length)];
        }
        // Fill remaining length with random characters from charset
        for (var i = password.length; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        // Shuffle the password to avoid predictable patterns
        return password
            .split('')
            .sort(function () { return Math.random() - 0.5; })
            .join('');
    };
    /**
     * Create password reset token
     */
    PasswordManager.prototype.createResetToken = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, expiresInMinutes) {
            var token, hashedToken, resetData, error_3;
            if (expiresInMinutes === void 0) { expiresInMinutes = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        token = (0, crypto_1.randomBytes)(32).toString('hex');
                        hashedToken = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
                        resetData = {
                            token: token,
                            hashedToken: hashedToken,
                            userId: userId,
                            expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
                            used: false,
                            createdAt: new Date(),
                        };
                        return [4 /*yield*/, this.cache.setObject("".concat(this.resetTokenPrefix).concat(hashedToken), resetData, expiresInMinutes * 60)];
                    case 1:
                        _a.sent();
                        // Store user->token mapping for cleanup
                        return [4 /*yield*/, this.cache.set("".concat(this.resetTokenPrefix, "user:").concat(userId), hashedToken, expiresInMinutes * 60)];
                    case 2:
                        // Store user->token mapping for cleanup
                        _a.sent();
                        this.logger.info('Password reset token created', {
                            userId: userId,
                            expiresInMinutes: expiresInMinutes,
                        });
                        return [2 /*return*/, { token: token, hashedToken: hashedToken }];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error('Failed to create reset token', {
                            error: error_3 instanceof Error ? error_3.message : String(error_3),
                            userId: userId,
                        });
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify and consume reset token
     */
    PasswordManager.prototype.verifyResetToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var hashedToken, resetData, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        hashedToken = (0, crypto_1.createHash)('sha256').update(token).digest('hex');
                        return [4 /*yield*/, this.cache.getObject("".concat(this.resetTokenPrefix).concat(hashedToken))];
                    case 1:
                        resetData = _a.sent();
                        if (!resetData) {
                            throw new Error('Invalid or expired reset token');
                        }
                        if (resetData.used) {
                            throw new Error('Reset token has already been used');
                        }
                        if (!(new Date() > resetData.expiresAt)) return [3 /*break*/, 3];
                        // Clean up expired token
                        return [4 /*yield*/, this.cache.del("".concat(this.resetTokenPrefix).concat(hashedToken))];
                    case 2:
                        // Clean up expired token
                        _a.sent();
                        throw new Error('Reset token has expired');
                    case 3:
                        // Mark token as used
                        resetData.used = true;
                        return [4 /*yield*/, this.cache.setObject("".concat(this.resetTokenPrefix).concat(hashedToken), resetData, 60 // Keep for 1 minute to prevent reuse
                            )];
                    case 4:
                        _a.sent();
                        // Clean up user mapping
                        return [4 /*yield*/, this.cache.del("".concat(this.resetTokenPrefix, "user:").concat(resetData.userId))];
                    case 5:
                        // Clean up user mapping
                        _a.sent();
                        this.logger.info('Reset token verified and consumed', {
                            userId: resetData.userId,
                        });
                        return [2 /*return*/, resetData.userId];
                    case 6:
                        error_4 = _a.sent();
                        this.logger.error('Reset token verification failed', {
                            error: error_4 instanceof Error ? error_4.message : String(error_4),
                        });
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Revoke existing reset tokens for user
     */
    PasswordManager.prototype.revokeResetTokens = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userTokenKey, hashedToken, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        userTokenKey = "".concat(this.resetTokenPrefix, "user:").concat(userId);
                        return [4 /*yield*/, this.cache.get(userTokenKey)];
                    case 1:
                        hashedToken = _a.sent();
                        if (!hashedToken) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.cache.del("".concat(this.resetTokenPrefix).concat(hashedToken))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.cache.del(userTokenKey)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        this.logger.info('Reset tokens revoked for user', { userId: userId });
                        return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        this.logger.error('Failed to revoke reset tokens', {
                            error: error_5 instanceof Error ? error_5.message : String(error_5),
                            userId: userId,
                        });
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Track password reset attempts (rate limiting)
     */
    PasswordManager.prototype.trackResetAttempt = function (identifier) {
        return __awaiter(this, void 0, void 0, function () {
            var key, attemptsStr, attempts, maxAttempts, windowMinutes, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        key = "".concat(this.attemptPrefix).concat(identifier);
                        return [4 /*yield*/, this.cache.get(key)];
                    case 1:
                        attemptsStr = _a.sent();
                        attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
                        maxAttempts = 5;
                        windowMinutes = 15;
                        if (attempts >= maxAttempts) {
                            this.logger.warn('Reset attempt rate limit exceeded', {
                                identifier: identifier,
                                attempts: attempts,
                            });
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.cache.set(key, (attempts + 1).toString(), windowMinutes * 60)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_6 = _a.sent();
                        this.logger.error('Failed to track reset attempt', {
                            error: error_6 instanceof Error ? error_6.message : String(error_6),
                            identifier: identifier,
                        });
                        return [2 /*return*/, true]; // Fail open
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get password policy requirements
     */
    PasswordManager.prototype.getPasswordPolicy = function () {
        return __assign({}, this.config);
    };
    /**
     * Update password policy
     */
    PasswordManager.prototype.updatePasswordPolicy = function (newConfig) {
        Object.assign(this.config, newConfig);
        this.logger.info('Password policy updated', { newConfig: newConfig });
    };
    return PasswordManager;
}());
exports.PasswordManager = PasswordManager;
