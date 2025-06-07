import type { Redis } from 'ioredis';
import type { CacheManager } from '../types/index.js';
/**
 * Redis cache adapter that implements the CacheManager interface
 * Provides JSON serialization/deserialization for objects
 */
export declare class RedisCacheAdapter implements CacheManager {
    private readonly redis;
    constructor(redis: Redis);
    /**
     * Get a string value from cache
     */
    get(key: string): Promise<string | null>;
    /**
     * Set a string value in cache with optional TTL
     */
    set(key: string, value: string, ttl?: number): Promise<void>;
    /**
     * Delete a key from cache
     */
    del(key: string): Promise<void>;
    /**
     * Get all keys matching a pattern
     */
    keys(pattern: string): Promise<string[]>;
    /**
     * Check if a key exists in cache
     */
    exists(key: string): Promise<boolean>;
    /**
     * Get an object from cache with JSON deserialization
     */
    getObject<T>(key: string): Promise<T | null>;
    /**
     * Set an object in cache with JSON serialization and optional TTL
     */
    setObject<T>(key: string, value: T, ttl?: number): Promise<void>;
}
