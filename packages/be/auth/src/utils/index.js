"use strict";
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
exports.RateLimitUtils = exports.DeviceUtils = exports.IPUtils = exports.TimeUtils = exports.ValidationUtils = exports.CryptoUtils = void 0;
var crypto_1 = require("crypto");
var util_1 = require("util");
var pbkdf2Async = (0, util_1.promisify)(crypto_1.pbkdf2);
var scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
var CryptoUtils = /** @class */ (function () {
    function CryptoUtils() {
    }
    /**
     * Generate a cryptographically secure random token
     */
    CryptoUtils.generateToken = function (options) {
        if (options === void 0) { options = {}; }
        var _a = options.length, length = _a === void 0 ? 32 : _a, _b = options.encoding, encoding = _b === void 0 ? 'hex' : _b;
        return (0, crypto_1.randomBytes)(length).toString(encoding);
    };
    /**
     * Generate a random salt
     */
    CryptoUtils.generateSalt = function (length) {
        if (length === void 0) { length = 16; }
        return (0, crypto_1.randomBytes)(length).toString('hex');
    };
    /**
     * Hash a password with salt using PBKDF2 or scrypt
     */
    CryptoUtils.hashPassword = function (password_1) {
        return __awaiter(this, arguments, void 0, function (password, options) {
            var _a, algorithm, _b, iterations, _c, keyLength, _d, saltLength, salt, hash;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.algorithm, algorithm = _a === void 0 ? 'pbkdf2' : _a, _b = options.iterations, iterations = _b === void 0 ? 100000 : _b, _c = options.keyLength, keyLength = _c === void 0 ? 64 : _c, _d = options.saltLength, saltLength = _d === void 0 ? 16 : _d;
                        salt = this.generateSalt(saltLength);
                        if (!(algorithm === 'pbkdf2')) return [3 /*break*/, 2];
                        return [4 /*yield*/, pbkdf2Async(password, salt, iterations, keyLength, 'sha512')];
                    case 1:
                        hash = _e.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, scryptAsync(password, salt, keyLength)];
                    case 3:
                        hash = _e.sent();
                        _e.label = 4;
                    case 4: return [2 /*return*/, "".concat(algorithm, "$").concat(iterations, "$").concat(salt, "$").concat(hash.toString('hex'))];
                }
            });
        });
    };
    /**
     * Verify a password against a hash
     */
    CryptoUtils.verifyPassword = function (password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var parts, algorithm, iterations, salt, hash, iterationsNum, keyLength, computedHash, expectedHash, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        parts = hashedPassword.split('$');
                        if (parts.length !== 4) {
                            throw new Error('Invalid hash format');
                        }
                        algorithm = parts[0], iterations = parts[1], salt = parts[2], hash = parts[3];
                        iterationsNum = parseInt(iterations, 10);
                        keyLength = hash.length / 2;
                        computedHash = void 0;
                        if (!(algorithm === 'pbkdf2')) return [3 /*break*/, 2];
                        return [4 /*yield*/, pbkdf2Async(password, salt, iterationsNum, keyLength, 'sha512')];
                    case 1:
                        computedHash = _a.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        if (!(algorithm === 'scrypt')) return [3 /*break*/, 4];
                        return [4 /*yield*/, scryptAsync(password, salt, keyLength)];
                    case 3:
                        computedHash = _a.sent();
                        return [3 /*break*/, 5];
                    case 4: throw new Error('Unsupported algorithm');
                    case 5:
                        expectedHash = Buffer.from(hash, 'hex');
                        return [2 /*return*/, (0, crypto_1.timingSafeEqual)(computedHash, expectedHash)];
                    case 6:
                        error_1 = _a.sent();
                        // Hash verification failed - this could be due to invalid input
                        // We don't log the error here for security reasons
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a secure random password
     */
    CryptoUtils.generatePassword = function (length, includeSymbols) {
        if (length === void 0) { length = 16; }
        if (includeSymbols === void 0) { includeSymbols = true; }
        var lowercase = 'abcdefghijklmnopqrstuvwxyz';
        var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var numbers = '0123456789';
        var symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        var charset = lowercase + uppercase + numbers;
        if (includeSymbols) {
            charset += symbols;
        }
        var password = '';
        for (var i = 0; i < length; i++) {
            var randomIndex = (0, crypto_1.randomBytes)(1)[0] % charset.length;
            password += charset[randomIndex];
        }
        return password;
    };
    /**
     * Generate HMAC for data integrity
     */
    CryptoUtils.generateHMAC = function (data, secret) {
        var crypto = require('crypto');
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    };
    /**
     * Verify HMAC
     */
    CryptoUtils.verifyHMAC = function (data, signature, secret) {
        var expected = this.generateHMAC(data, secret);
        return (0, crypto_1.timingSafeEqual)(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    };
    return CryptoUtils;
}());
exports.CryptoUtils = CryptoUtils;
var ValidationUtils = /** @class */ (function () {
    function ValidationUtils() {
    }
    /**
     * Validate email format
     */
    ValidationUtils.isValidEmail = function (email) {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    /**
     * Validate password strength
     */
    ValidationUtils.validatePasswordStrength = function (password) {
        var feedback = [];
        var score = 0;
        // Length check
        if (password.length >= 8) {
            score += 1;
        }
        else {
            feedback.push('Password must be at least 8 characters long');
        }
        if (password.length >= 12) {
            score += 1;
        }
        // Character variety checks
        if (/[a-z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain lowercase letters');
        }
        if (/[A-Z]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain uppercase letters');
        }
        if (/[0-9]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password must contain numbers');
        }
        if (/[^a-zA-Z0-9]/.test(password)) {
            score += 1;
        }
        else {
            feedback.push('Password should contain special characters');
        }
        // Common patterns
        if (/(.)\1{2,}/.test(password)) {
            score -= 1;
            feedback.push('Avoid repeating characters');
        }
        if (/123|abc|qwe/i.test(password)) {
            score -= 1;
            feedback.push('Avoid common sequences');
        }
        return {
            isValid: score >= 4 && feedback.length === 0,
            score: Math.max(0, Math.min(6, score)),
            feedback: feedback,
        };
    };
    /**
     * Validate username format
     */
    ValidationUtils.isValidUsername = function (username) {
        // 3-20 characters, alphanumeric, underscore, hyphen
        var usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    };
    /**
     * Sanitize input string
     */
    ValidationUtils.sanitizeString = function (input) {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML
            .replace(/['"]/g, '') // Remove quotes
            .replace(/\\/g, ''); // Remove backslashes
    };
    /**
     * Validate phone number format
     */
    ValidationUtils.isValidPhoneNumber = function (phone) {
        // Basic international phone number validation
        var phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
    };
    /**
     * Check if string contains only allowed characters
     */
    ValidationUtils.containsOnlyAllowedChars = function (input, allowedChars) {
        var regex = new RegExp("^[".concat(allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "]+$"));
        return regex.test(input);
    };
    return ValidationUtils;
}());
exports.ValidationUtils = ValidationUtils;
var TimeUtils = /** @class */ (function () {
    function TimeUtils() {
    }
    /**
     * Get current timestamp in seconds
     */
    TimeUtils.getCurrentTimestamp = function () {
        return Math.floor(Date.now() / 1000);
    };
    /**
     * Check if timestamp is expired
     */
    TimeUtils.isExpired = function (timestamp) {
        return timestamp < this.getCurrentTimestamp();
    };
    /**
     * Get expiration timestamp
     */
    TimeUtils.getExpirationTimestamp = function (durationMs) {
        return this.getCurrentTimestamp() + Math.floor(durationMs / 1000);
    };
    /**
     * Parse duration string to milliseconds
     */
    TimeUtils.parseDuration = function (duration) {
        var units = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        var match = duration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            throw new Error('Invalid duration format. Use format like "5m", "1h", "7d"');
        }
        var value = match[1], unit = match[2];
        return parseInt(value, 10) * units[unit];
    };
    /**
     * Format duration for human reading
     */
    TimeUtils.formatDuration = function (durationMs) {
        var seconds = Math.floor(durationMs / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        if (days > 0) {
            return "".concat(days, "d ").concat(hours % 24, "h");
        }
        else if (hours > 0) {
            return "".concat(hours, "h ").concat(minutes % 60, "m");
        }
        else if (minutes > 0) {
            return "".concat(minutes, "m ").concat(seconds % 60, "s");
        }
        else {
            return "".concat(seconds, "s");
        }
    };
    return TimeUtils;
}());
exports.TimeUtils = TimeUtils;
var IPUtils = /** @class */ (function () {
    function IPUtils() {
    }
    /**
     * Validate IPv4 address
     */
    IPUtils.isValidIPv4 = function (ip) {
        var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    };
    /**
     * Check if IP is in private range
     */
    IPUtils.isPrivateIP = function (ip) {
        if (!this.isValidIPv4(ip))
            return false;
        var parts = ip.split('.').map(Number);
        var a = parts[0], b = parts[1];
        // 10.0.0.0/8
        if (a === 10)
            return true;
        // 172.16.0.0/12
        if (a === 172 && b >= 16 && b <= 31)
            return true;
        // 192.168.0.0/16
        if (a === 192 && b === 168)
            return true;
        // 127.0.0.0/8 (loopback)
        if (a === 127)
            return true;
        return false;
    };
    /**
     * Get IP geolocation info (basic)
     */
    IPUtils.getIPInfo = function (ip) {
        return {
            isPrivate: this.isPrivateIP(ip),
            isLoopback: ip.startsWith('127.'),
            version: this.isValidIPv4(ip) ? 'IPv4' : 'IPv6',
        };
    };
    return IPUtils;
}());
exports.IPUtils = IPUtils;
var DeviceUtils = /** @class */ (function () {
    function DeviceUtils() {
    }
    /**
     * Generate device fingerprint from user agent and other headers
     */
    DeviceUtils.generateDeviceFingerprint = function (userAgent, acceptLanguage, acceptEncoding) {
        var components = [
            userAgent || 'unknown',
            acceptLanguage || 'unknown',
            acceptEncoding || 'unknown',
        ];
        return CryptoUtils.generateHMAC(components.join('|'), 'device-fingerprint-salt');
    };
    /**
     * Parse user agent for device info
     */
    DeviceUtils.parseUserAgent = function (userAgent) {
        var defaultInfo = {
            browser: 'unknown',
            browserVersion: 'unknown',
            os: 'unknown',
            osVersion: 'unknown',
            device: 'unknown',
            isMobile: false,
        };
        if (!userAgent)
            return defaultInfo;
        var ua = userAgent.toLowerCase();
        // Basic browser detection
        var browser = 'unknown';
        var browserVersion = 'unknown';
        if (ua.includes('chrome/')) {
            browser = 'Chrome';
            var match = ua.match(/chrome\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('firefox/')) {
            browser = 'Firefox';
            var match = ua.match(/firefox\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('safari/') && !ua.includes('chrome')) {
            browser = 'Safari';
            var match = ua.match(/version\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('edge/')) {
            browser = 'Edge';
            var match = ua.match(/edge\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        // Basic OS detection
        var os = 'unknown';
        var osVersion = 'unknown';
        if (ua.includes('windows nt')) {
            os = 'Windows';
            var match = ua.match(/windows nt ([0-9.]+)/);
            osVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('mac os x')) {
            os = 'macOS';
            var match = ua.match(/mac os x ([0-9_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
        }
        else if (ua.includes('linux')) {
            os = 'Linux';
        }
        else if (ua.includes('android')) {
            os = 'Android';
            var match = ua.match(/android ([0-9.]+)/);
            osVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('iphone') || ua.includes('ipad')) {
            os = 'iOS';
            var match = ua.match(/os ([0-9_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
        }
        // Device type detection
        var isMobile = /mobile|android|iphone|ipad|phone|tablet/i.test(userAgent);
        var device = 'desktop';
        if (ua.includes('iphone')) {
            device = 'iPhone';
        }
        else if (ua.includes('ipad')) {
            device = 'iPad';
        }
        else if (ua.includes('android')) {
            device = ua.includes('mobile') ? 'Android Phone' : 'Android Tablet';
        }
        else if (isMobile) {
            device = 'mobile';
        }
        return {
            browser: browser,
            browserVersion: browserVersion,
            os: os,
            osVersion: osVersion,
            device: device,
            isMobile: isMobile,
        };
    };
    return DeviceUtils;
}());
exports.DeviceUtils = DeviceUtils;
var RateLimitUtils = /** @class */ (function () {
    function RateLimitUtils() {
    }
    /**
     * Calculate sliding window rate limit
     */
    RateLimitUtils.calculateSlidingWindow = function (timestamps, windowMs, maxRequests, currentTime) {
        if (currentTime === void 0) { currentTime = Date.now(); }
        var windowStart = currentTime - windowMs;
        var validTimestamps = timestamps.filter(function (ts) { return ts > windowStart; });
        var allowed = validTimestamps.length < maxRequests;
        var resetTime = validTimestamps.length > 0
            ? validTimestamps[0] + windowMs
            : currentTime + windowMs;
        var remaining = Math.max(0, maxRequests - validTimestamps.length);
        return { allowed: allowed, resetTime: resetTime, remaining: remaining };
    };
    /**
     * Generate rate limit key
     */
    RateLimitUtils.generateRateLimitKey = function (prefix, identifier) {
        return "rate_limit:".concat(prefix, ":").concat(identifier);
    };
    return RateLimitUtils;
}());
exports.RateLimitUtils = RateLimitUtils;
