import type { Logger } from '@mono/be-core';
import type { PasswordConfig, CacheManager } from '../types/index.js';
export declare class PasswordManager {
    private readonly config;
    private readonly cache;
    private readonly logger;
    private readonly resetTokenPrefix;
    private readonly attemptPrefix;
    constructor(config: PasswordConfig, cache: CacheManager, logger: Logger);
    /**
     * Hash a password using bcrypt
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password against hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Validate password against policy
     */
    validatePasswordPolicy(password: string): void;
    /**
     * Generate password strength score (0-100)
     */
    calculatePasswordStrength(password: string): {
        score: number;
        feedback: string[];
    };
    /**
     * Generate a secure random password
     */
    generatePassword(length?: number): string;
    /**
     * Create password reset token
     */
    createResetToken(userId: string, expiresInMinutes?: number): Promise<{
        token: string;
        hashedToken: string;
    }>;
    /**
     * Verify and consume reset token
     */
    verifyResetToken(token: string): Promise<string>;
    /**
     * Revoke existing reset tokens for user
     */
    revokeResetTokens(userId: string): Promise<void>;
    /**
     * Track password reset attempts (rate limiting)
     */
    trackResetAttempt(identifier: string): Promise<boolean>;
    /**
     * Get password policy requirements
     */
    getPasswordPolicy(): PasswordConfig;
    /**
     * Update password policy
     */
    updatePasswordPolicy(newConfig: Partial<PasswordConfig>): void;
}
