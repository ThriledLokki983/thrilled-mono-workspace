"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitUtils = exports.DeviceUtils = exports.IPUtils = exports.TimeUtils = exports.ValidationUtils = exports.CryptoUtils = void 0;
const crypto_1 = require("crypto");
const util_1 = require("util");
const pbkdf2Async = (0, util_1.promisify)(crypto_1.pbkdf2);
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
class CryptoUtils {
    /**
     * Generate a cryptographically secure random token
     */
    static generateToken(options = {}) {
        const { length = 32, encoding = 'hex' } = options;
        return (0, crypto_1.randomBytes)(length).toString(encoding);
    }
    /**
     * Generate a random salt
     */
    static generateSalt(length = 16) {
        return (0, crypto_1.randomBytes)(length).toString('hex');
    }
    /**
     * Hash a password with salt using PBKDF2 or scrypt
     */
    static async hashPassword(password, options = {}) {
        const { algorithm = 'pbkdf2', iterations = 100000, keyLength = 64, saltLength = 16, } = options;
        const salt = this.generateSalt(saltLength);
        let hash;
        if (algorithm === 'pbkdf2') {
            hash = await pbkdf2Async(password, salt, iterations, keyLength, 'sha512');
        }
        else {
            hash = await scryptAsync(password, salt, keyLength);
        }
        return `${algorithm}$${iterations}$${salt}$${hash.toString('hex')}`;
    }
    /**
     * Verify a password against a hash
     */
    static async verifyPassword(password, hashedPassword) {
        try {
            const parts = hashedPassword.split('$');
            if (parts.length !== 4) {
                throw new Error('Invalid hash format');
            }
            const [algorithm, iterations, salt, hash] = parts;
            const iterationsNum = parseInt(iterations, 10);
            const keyLength = hash.length / 2; // hex string length / 2
            let computedHash;
            if (algorithm === 'pbkdf2') {
                computedHash = await pbkdf2Async(password, salt, iterationsNum, keyLength, 'sha512');
            }
            else if (algorithm === 'scrypt') {
                computedHash = await scryptAsync(password, salt, keyLength);
            }
            else {
                throw new Error('Unsupported algorithm');
            }
            const expectedHash = Buffer.from(hash, 'hex');
            return (0, crypto_1.timingSafeEqual)(computedHash, expectedHash);
        }
        catch (error) {
            // Hash verification failed - this could be due to invalid input
            // We don't log the error here for security reasons
            return false;
        }
    }
    /**
     * Generate a secure random password
     */
    static generatePassword(length = 16, includeSymbols = true) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let charset = lowercase + uppercase + numbers;
        if (includeSymbols) {
            charset += symbols;
        }
        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = (0, crypto_1.randomBytes)(1)[0] % charset.length;
            password += charset[randomIndex];
        }
        return password;
    }
    /**
     * Generate HMAC for data integrity
     */
    static generateHMAC(data, secret) {
        const crypto = require('crypto');
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }
    /**
     * Verify HMAC
     */
    static verifyHMAC(data, signature, secret) {
        const expected = this.generateHMAC(data, secret);
        return (0, crypto_1.timingSafeEqual)(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    }
}
exports.CryptoUtils = CryptoUtils;
class ValidationUtils {
    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password) {
        const feedback = [];
        let score = 0;
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
            feedback,
        };
    }
    /**
     * Validate username format
     */
    static isValidUsername(username) {
        // 3-20 characters, alphanumeric, underscore, hyphen
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }
    /**
     * Sanitize input string
     */
    static sanitizeString(input) {
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML
            .replace(/['"]/g, '') // Remove quotes
            .replace(/\\/g, ''); // Remove backslashes
    }
    /**
     * Validate phone number format
     */
    static isValidPhoneNumber(phone) {
        // Basic international phone number validation
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
    }
    /**
     * Check if string contains only allowed characters
     */
    static containsOnlyAllowedChars(input, allowedChars) {
        const regex = new RegExp(`^[${allowedChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]+$`);
        return regex.test(input);
    }
}
exports.ValidationUtils = ValidationUtils;
class TimeUtils {
    /**
     * Get current timestamp in seconds
     */
    static getCurrentTimestamp() {
        return Math.floor(Date.now() / 1000);
    }
    /**
     * Check if timestamp is expired
     */
    static isExpired(timestamp) {
        return timestamp < this.getCurrentTimestamp();
    }
    /**
     * Get expiration timestamp
     */
    static getExpirationTimestamp(durationMs) {
        return this.getCurrentTimestamp() + Math.floor(durationMs / 1000);
    }
    /**
     * Parse duration string to milliseconds
     */
    static parseDuration(duration) {
        const units = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
        };
        const match = duration.match(/^(\d+)([smhdw])$/);
        if (!match) {
            throw new Error('Invalid duration format. Use format like "5m", "1h", "7d"');
        }
        const [, value, unit] = match;
        return parseInt(value, 10) * units[unit];
    }
    /**
     * Format duration for human reading
     */
    static formatDuration(durationMs) {
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
}
exports.TimeUtils = TimeUtils;
class IPUtils {
    /**
     * Validate IPv4 address
     */
    static isValidIPv4(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    }
    /**
     * Check if IP is in private range
     */
    static isPrivateIP(ip) {
        if (!this.isValidIPv4(ip))
            return false;
        const parts = ip.split('.').map(Number);
        const [a, b] = parts;
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
    }
    /**
     * Get IP geolocation info (basic)
     */
    static getIPInfo(ip) {
        return {
            isPrivate: this.isPrivateIP(ip),
            isLoopback: ip.startsWith('127.'),
            version: this.isValidIPv4(ip) ? 'IPv4' : 'IPv6',
        };
    }
}
exports.IPUtils = IPUtils;
class DeviceUtils {
    /**
     * Generate device fingerprint from user agent and other headers
     */
    static generateDeviceFingerprint(userAgent, acceptLanguage, acceptEncoding) {
        const components = [
            userAgent || 'unknown',
            acceptLanguage || 'unknown',
            acceptEncoding || 'unknown',
        ];
        return CryptoUtils.generateHMAC(components.join('|'), 'device-fingerprint-salt');
    }
    /**
     * Parse user agent for device info
     */
    static parseUserAgent(userAgent) {
        const defaultInfo = {
            browser: 'unknown',
            browserVersion: 'unknown',
            os: 'unknown',
            osVersion: 'unknown',
            device: 'unknown',
            isMobile: false,
        };
        if (!userAgent)
            return defaultInfo;
        const ua = userAgent.toLowerCase();
        // Basic browser detection
        let browser = 'unknown';
        let browserVersion = 'unknown';
        if (ua.includes('chrome/')) {
            browser = 'Chrome';
            const match = ua.match(/chrome\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('firefox/')) {
            browser = 'Firefox';
            const match = ua.match(/firefox\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('safari/') && !ua.includes('chrome')) {
            browser = 'Safari';
            const match = ua.match(/version\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('edge/')) {
            browser = 'Edge';
            const match = ua.match(/edge\/([0-9.]+)/);
            browserVersion = match ? match[1] : 'unknown';
        }
        // Basic OS detection
        let os = 'unknown';
        let osVersion = 'unknown';
        if (ua.includes('windows nt')) {
            os = 'Windows';
            const match = ua.match(/windows nt ([0-9.]+)/);
            osVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('mac os x')) {
            os = 'macOS';
            const match = ua.match(/mac os x ([0-9_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
        }
        else if (ua.includes('linux')) {
            os = 'Linux';
        }
        else if (ua.includes('android')) {
            os = 'Android';
            const match = ua.match(/android ([0-9.]+)/);
            osVersion = match ? match[1] : 'unknown';
        }
        else if (ua.includes('iphone') || ua.includes('ipad')) {
            os = 'iOS';
            const match = ua.match(/os ([0-9_]+)/);
            osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
        }
        // Device type detection
        const isMobile = /mobile|android|iphone|ipad|phone|tablet/i.test(userAgent);
        let device = 'desktop';
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
            browser,
            browserVersion,
            os,
            osVersion,
            device,
            isMobile,
        };
    }
}
exports.DeviceUtils = DeviceUtils;
class RateLimitUtils {
    /**
     * Calculate sliding window rate limit
     */
    static calculateSlidingWindow(timestamps, windowMs, maxRequests, currentTime = Date.now()) {
        const windowStart = currentTime - windowMs;
        const validTimestamps = timestamps.filter((ts) => ts > windowStart);
        const allowed = validTimestamps.length < maxRequests;
        const resetTime = validTimestamps.length > 0
            ? validTimestamps[0] + windowMs
            : currentTime + windowMs;
        const remaining = Math.max(0, maxRequests - validTimestamps.length);
        return { allowed, resetTime, remaining };
    }
    /**
     * Generate rate limit key
     */
    static generateRateLimitKey(prefix, identifier) {
        return `rate_limit:${prefix}:${identifier}`;
    }
}
exports.RateLimitUtils = RateLimitUtils;
