"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheAdapter = void 0;
/**
 * Redis cache adapter that implements the CacheManager interface
 * Provides JSON serialization/deserialization for objects
 */
class RedisCacheAdapter {
    constructor(redis) {
        this.redis = redis;
    }
    /**
     * Get a string value from cache
     */
    async get(key) {
        return this.redis.get(key);
    }
    /**
     * Set a string value in cache with optional TTL
     */
    async set(key, value, ttl) {
        if (ttl) {
            await this.redis.setex(key, ttl, value);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    /**
     * Delete a key from cache
     */
    async del(key) {
        await this.redis.del(key);
    }
    /**
     * Get all keys matching a pattern
     */
    async keys(pattern) {
        return this.redis.keys(pattern);
    }
    /**
     * Check if a key exists in cache
     */
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    /**
     * Get an object from cache with JSON deserialization
     */
    async getObject(key) {
        const value = await this.redis.get(key);
        if (value === null) {
            return null;
        }
        try {
            return JSON.parse(value);
        }
        catch {
            // If parsing fails, return null
            return null;
        }
    }
    /**
     * Set an object in cache with JSON serialization and optional TTL
     */
    async setObject(key, value, ttl) {
        const serialized = JSON.stringify(value);
        if (ttl) {
            await this.redis.setex(key, ttl, serialized);
        }
        else {
            await this.redis.set(key, serialized);
        }
    }
}
exports.RedisCacheAdapter = RedisCacheAdapter;
