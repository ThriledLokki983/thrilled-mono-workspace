export interface TokenOptions {
    length?: number;
    encoding?: BufferEncoding;
}
export interface HashOptions {
    algorithm?: 'pbkdf2' | 'scrypt';
    iterations?: number;
    keyLength?: number;
    saltLength?: number;
}
export declare class CryptoUtils {
    /**
     * Generate a cryptographically secure random token
     */
    static generateToken(options?: TokenOptions): string;
    /**
     * Generate a random salt
     */
    static generateSalt(length?: number): string;
    /**
     * Hash a password with salt using PBKDF2 or scrypt
     */
    static hashPassword(password: string, options?: HashOptions): Promise<string>;
    /**
     * Verify a password against a hash
     */
    static verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    /**
     * Generate a secure random password
     */
    static generatePassword(length?: number, includeSymbols?: boolean): string;
    /**
     * Generate HMAC for data integrity
     */
    static generateHMAC(data: string, secret: string): string;
    /**
     * Verify HMAC
     */
    static verifyHMAC(data: string, signature: string, secret: string): boolean;
}
export declare class ValidationUtils {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean;
    /**
     * Validate password strength
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        score: number;
        feedback: string[];
    };
    /**
     * Validate username format
     */
    static isValidUsername(username: string): boolean;
    /**
     * Sanitize input string
     */
    static sanitizeString(input: string): string;
    /**
     * Validate phone number format
     */
    static isValidPhoneNumber(phone: string): boolean;
    /**
     * Check if string contains only allowed characters
     */
    static containsOnlyAllowedChars(input: string, allowedChars: string): boolean;
}
export declare class TimeUtils {
    /**
     * Get current timestamp in seconds
     */
    static getCurrentTimestamp(): number;
    /**
     * Check if timestamp is expired
     */
    static isExpired(timestamp: number): boolean;
    /**
     * Get expiration timestamp
     */
    static getExpirationTimestamp(durationMs: number): number;
    /**
     * Parse duration string to milliseconds
     */
    static parseDuration(duration: string): number;
    /**
     * Format duration for human reading
     */
    static formatDuration(durationMs: number): string;
}
export declare class IPUtils {
    /**
     * Validate IPv4 address
     */
    static isValidIPv4(ip: string): boolean;
    /**
     * Check if IP is in private range
     */
    static isPrivateIP(ip: string): boolean;
    /**
     * Get IP geolocation info (basic)
     */
    static getIPInfo(ip: string): {
        isPrivate: boolean;
        isLoopback: boolean;
        version: string;
    };
}
export declare class DeviceUtils {
    /**
     * Generate device fingerprint from user agent and other headers
     */
    static generateDeviceFingerprint(userAgent: string, acceptLanguage?: string, acceptEncoding?: string): string;
    /**
     * Parse user agent for device info
     */
    static parseUserAgent(userAgent: string): {
        browser: string;
        browserVersion: string;
        os: string;
        osVersion: string;
        device: string;
        isMobile: boolean;
    };
}
export declare class RateLimitUtils {
    /**
     * Calculate sliding window rate limit
     */
    static calculateSlidingWindow(timestamps: number[], windowMs: number, maxRequests: number, currentTime?: number): {
        allowed: boolean;
        resetTime: number;
        remaining: number;
    };
    /**
     * Generate rate limit key
     */
    static generateRateLimitKey(prefix: string, identifier: string): string;
}
