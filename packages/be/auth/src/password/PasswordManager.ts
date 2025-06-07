import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import type { Logger } from '@mono/be-core';
import type {
  PasswordConfig,
  PasswordResetToken,
  CacheManager,
} from '../types/index.js';

export class PasswordManager {
  private readonly config: PasswordConfig;
  private readonly cache: CacheManager;
  private readonly logger: Logger;
  private readonly resetTokenPrefix = 'pwd:reset:';
  private readonly attemptPrefix = 'pwd:attempt:';

  constructor(config: PasswordConfig, cache: CacheManager, logger: Logger) {
    // Set defaults for missing config properties
    const defaults: PasswordConfig = {
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

    this.config = { ...defaults, ...config };
    this.cache = cache;
    this.logger = logger;
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      this.validatePasswordPolicy(password);

      const salt = await bcrypt.genSalt(this.config.saltRounds);
      const hash = await bcrypt.hash(password, salt);

      this.logger.debug('Password hashed successfully', {
        saltRounds: this.config.saltRounds,
      });

      return hash;
    } catch (error) {
      this.logger.error('Password hashing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(password, hash);

      this.logger.debug('Password verification completed', {
        isValid,
      });

      return isValid;
    } catch (error) {
      this.logger.error('Password verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Validate password against policy
   */
  validatePasswordPolicy(password: string): void {
    const errors: string[] = [];

    // Length check
    if (password.length < this.config.minLength) {
      errors.push(
        `Password must be at least ${this.config.minLength} characters long`
      );
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
    if (
      this.config.requireSymbols &&
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    }

    // Blacklist check
    if (this.config.blacklistedPasswords) {
      const lowercasePassword = password.toLowerCase();
      for (const blacklisted of this.config.blacklistedPasswords) {
        if (lowercasePassword.includes(blacklisted.toLowerCase())) {
          errors.push('Password contains forbidden words or patterns');
          break;
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Password policy validation failed: ${errors.join(', ')}`
      );
    }
  }

  /**
   * Generate password strength score (0-100)
   */
  calculatePasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    else if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    }

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 10;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) score += 15;
    else feedback.push('Add special characters');

    // Pattern checking
    if (!/(.)\1{2,}/.test(password)) score += 10; // No repeated characters
    else feedback.push('Avoid repeated characters');

    if (!/(\d{3,})/.test(password)) score += 5; // No long number sequences
    else feedback.push('Avoid long number sequences');

    // Common patterns
    const commonPatterns = ['123', 'abc', 'qwe', 'password', 'admin'];
    const hasCommonPattern = commonPatterns.some((pattern) =>
      password.toLowerCase().includes(pattern)
    );

    if (!hasCommonPattern) score += 10;
    else feedback.push('Avoid common patterns');

    return {
      score: Math.min(score, 100),
      feedback,
    };
  }

  /**
   * Generate a secure random password
   */
  generatePassword(length = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = '';
    let password = '';

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
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * Create password reset token
   */
  async createResetToken(
    userId: string,
    expiresInMinutes = 30
  ): Promise<{ token: string; hashedToken: string }> {
    try {
      // Generate random token
      const token = randomBytes(32).toString('hex');
      const hashedToken = createHash('sha256').update(token).digest('hex');

      // Store in cache with expiration
      const resetData: PasswordResetToken = {
        token,
        hashedToken,
        userId,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
        used: false,
        createdAt: new Date(),
      };

      await this.cache.setObject(
        `${this.resetTokenPrefix}${hashedToken}`,
        resetData,
        expiresInMinutes * 60
      );

      // Store user->token mapping for cleanup
      await this.cache.set(
        `${this.resetTokenPrefix}user:${userId}`,
        hashedToken,
        expiresInMinutes * 60
      );

      this.logger.info('Password reset token created', {
        userId,
        expiresInMinutes,
      });

      return { token, hashedToken };
    } catch (error) {
      this.logger.error('Failed to create reset token', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Verify and consume reset token
   */
  async verifyResetToken(token: string): Promise<string> {
    try {
      const hashedToken = createHash('sha256').update(token).digest('hex');

      const resetData = await this.cache.getObject<PasswordResetToken>(
        `${this.resetTokenPrefix}${hashedToken}`
      );

      if (!resetData) {
        throw new Error('Invalid or expired reset token');
      }

      if (resetData.used) {
        throw new Error('Reset token has already been used');
      }

      if (new Date() > resetData.expiresAt) {
        // Clean up expired token
        await this.cache.del(`${this.resetTokenPrefix}${hashedToken}`);
        throw new Error('Reset token has expired');
      }

      // Mark token as used
      resetData.used = true;
      await this.cache.setObject(
        `${this.resetTokenPrefix}${hashedToken}`,
        resetData,
        60 // Keep for 1 minute to prevent reuse
      );

      // Clean up user mapping
      await this.cache.del(`${this.resetTokenPrefix}user:${resetData.userId}`);

      this.logger.info('Reset token verified and consumed', {
        userId: resetData.userId,
      });

      return resetData.userId;
    } catch (error) {
      this.logger.error('Reset token verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Revoke existing reset tokens for user
   */
  async revokeResetTokens(userId: string): Promise<void> {
    try {
      const userTokenKey = `${this.resetTokenPrefix}user:${userId}`;
      const hashedToken = await this.cache.get(userTokenKey);

      if (hashedToken) {
        await this.cache.del(`${this.resetTokenPrefix}${hashedToken}`);
        await this.cache.del(userTokenKey);
      }

      this.logger.info('Reset tokens revoked for user', { userId });
    } catch (error) {
      this.logger.error('Failed to revoke reset tokens', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
    }
  }

  /**
   * Track password reset attempts (rate limiting)
   */
  async trackResetAttempt(identifier: string): Promise<boolean> {
    try {
      const key = `${this.attemptPrefix}${identifier}`;
      const attemptsStr = await this.cache.get(key);
      const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
      const maxAttempts = 5;
      const windowMinutes = 15;

      if (attempts >= maxAttempts) {
        this.logger.warn('Reset attempt rate limit exceeded', {
          identifier,
          attempts,
        });
        return false;
      }

      await this.cache.set(key, (attempts + 1).toString(), windowMinutes * 60);
      return true;
    } catch (error) {
      this.logger.error('Failed to track reset attempt', {
        error: error instanceof Error ? error.message : String(error),
        identifier,
      });
      return true; // Fail open
    }
  }

  /**
   * Get password policy requirements
   */
  getPasswordPolicy(): PasswordConfig {
    return { ...this.config };
  }

  /**
   * Update password policy
   */
  updatePasswordPolicy(newConfig: Partial<PasswordConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info('Password policy updated', { newConfig });
  }
}
