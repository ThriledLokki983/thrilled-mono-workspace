// jwtBlacklist.ts
import { Container } from 'typedi';
import { CacheManager } from '@thrilled/databases';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

/**
 * Class to handle JWT token blacklisting using the centralized CacheManager
 */
export class JwtBlacklist {
  private readonly keyPrefix = 'blacklist:';
  private cacheAvailable = true;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupHealthCheck();
  }

  /**
   * Get CacheManager instance from TypeDI container
   */
  private getCacheManager(): CacheManager {
    try {
      return Container.get('cacheManager');
    } catch (error) {
      logger.error('Failed to get CacheManager from container');
      this.cacheAvailable = false;
      throw error;
    }
  }

  /**
   * Setup a health check interval to periodically verify cache connectivity
   */
  private setupHealthCheck() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const cacheManager = this.getCacheManager();
        await cacheManager.ping();
        if (!this.cacheAvailable) {
          logger.info('Cache connection restored');
          this.cacheAvailable = true;
        }
      } catch (err) {
        if (this.cacheAvailable) {
          logger.error(`Cache health check failed: ${(err as Error).message}`);
          this.cacheAvailable = false;
        }
      }
    }, 30000); // 30 seconds
  }

  /**
   * Check if cache is available
   */
  public isCacheAvailable(): boolean {
    return this.cacheAvailable;
  }

  /**
   * Adds a token to the blacklist until it expires.
   * @param token JWT string
   * @returns Promise resolving to true if blacklisting was successful
   */
  async blacklistToken(token: string): Promise<boolean> {
    try {
      if (!this.cacheAvailable) {
        logger.warn('Cache unavailable, token blacklisting skipped');
        return false;
      }

      const decoded: unknown = jwt.decode(token);
      if (!decoded || typeof decoded !== 'object' || !('exp' in decoded) || typeof decoded.exp !== 'number') {
        logger.warn('Invalid token format: missing exp claim');
        throw new Error('Invalid token: missing exp claim');
      }

      const ttl = decoded.exp - Math.floor(Date.now() / 1000); // seconds
      if (ttl <= 0) {
        logger.info('Token already expired, no need to blacklist');
        return true; // Already expired, no need to blacklist
      }

      // Add to blacklist with expiry
      const cacheManager = this.getCacheManager();
      await cacheManager.set(`${this.keyPrefix}${token}`, '1', ttl);
      logger.debug(`Token blacklisted for ${ttl} seconds`);
      return true;
    } catch (err) {
      logger.error(`Failed to blacklist token: ${(err as Error).message}`);
      // Don't throw the error, but return false to indicate failure
      return false;
    }
  }

  /**
   * Checks if a token is blacklisted.
   * @param token JWT string
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      if (!this.cacheAvailable) {
        logger.warn('Cache unavailable during blacklist check, proceeding with caution');
        // Configure behavior based on security needs:
        // 1. Fail closed: return true (assuming token is blacklisted when cache is down)
        // 2. Fail open: return false (assuming token is valid when cache is down)
        // Default to fail open, but this is configurable based on security requirements
        return false;
      }

      const cacheManager = this.getCacheManager();
      const exists = await cacheManager.exists(`${this.keyPrefix}${token}`);
      return exists;
    } catch (err) {
      logger.error(`Error checking blacklisted token: ${(err as Error).message}`);
      // In case of cache error, fail open (assume token is valid)
      return false;
    }
  }

  /**
   * Clears all blacklisted tokens (admin use only)
   * @returns number of tokens cleared
   */
  async clearAllBlacklisted(): Promise<number> {
    try {
      if (!this.cacheAvailable) {
        logger.warn('Cache unavailable, cannot clear blacklist');
        return 0;
      }

      const cacheManager = this.getCacheManager();
      const keys = await cacheManager.keys(`${this.keyPrefix}*`);

      if (keys.length > 0) {
        for (const key of keys) {
          await cacheManager.del(key);
        }
        logger.info(`Cleared ${keys.length} blacklisted tokens`);
        return keys.length;
      }
      return 0;
    } catch (err) {
      logger.error(`Error clearing blacklisted tokens: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Clean up resources when this class is no longer needed
   */
  public destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export default JwtBlacklist;
