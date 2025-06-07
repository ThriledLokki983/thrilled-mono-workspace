"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheAdapter = void 0;
// Redis adapter for CacheManager
class RedisCacheAdapter {
    constructor(redis) {
        this.redis = redis;
    }
    async get(key) {
        return await this.redis.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.redis.setex(key, ttl, value);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    async del(key) {
        await this.redis.del(key);
    }
    async keys(pattern) {
        return await this.redis.keys(pattern);
    }
    async exists(key) {
        const result = await this.redis.exists(key);
        return result === 1;
    }
    async getObject(key) {
        const data = await this.get(key);
        if (!data)
            return null;
        try {
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async setObject(key, value, ttl) {
        await this.set(key, JSON.stringify(value), ttl);
    }
}
exports.RedisCacheAdapter = RedisCacheAdapter;
