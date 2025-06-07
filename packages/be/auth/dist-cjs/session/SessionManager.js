"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const crypto_1 = require("crypto");
class SessionManager {
    constructor(config, cache, logger) {
        this.eventPrefix = 'auth:event:';
        // Set defaults for configuration
        const defaults = {
            defaultTTL: '24h',
            prefix: 'session:',
            ttl: 86400, // 24 hours in seconds
            rolling: true,
            maxSessionsPerUser: 5,
            maxSessions: 5,
            enableRollingSession: true,
            trackDevices: true,
            enableEventLogging: true,
        };
        this.config = { ...defaults, ...config };
        this.cache = cache;
        this.logger = logger;
        this.sessionPrefix = this.config.prefix;
        this.userSessionPrefix = `${this.config.prefix}user:`;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    /**
     * Create a new user session
     */
    async createSession(userId, deviceInfo, deviceId) {
        try {
            const sessionId = this.generateSessionId();
            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.config.ttl * 1000);
            const session = {
                sessionId,
                userId,
                deviceId,
                deviceInfo,
                createdAt: now,
                lastActiveAt: now,
                expiresAt,
                isActive: true,
            };
            // Store session data
            await this.cache.setObject(`${this.sessionPrefix}${sessionId}`, session, this.config.ttl);
            // Manage user session limit
            await this.manageUserSessionLimit(userId, sessionId);
            // Track authentication event
            await this.trackAuthEvent({
                eventType: 'login',
                success: true,
                userId,
                sessionId,
                ipAddress: deviceInfo?.ip,
                userAgent: deviceInfo?.userAgent,
                metadata: { deviceInfo, deviceId },
                timestamp: now,
            });
            this.logger.info('Session created', {
                sessionId,
                userId,
                deviceId,
            });
            return session;
        }
        catch (error) {
            this.logger.error('Failed to create session', {
                error: error instanceof Error ? error.message : String(error),
                userId,
            });
            throw error;
        }
    }
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        try {
            const session = await this.cache.getObject(`${this.sessionPrefix}${sessionId}`);
            if (!session) {
                return null;
            }
            // Check if session has expired
            if (new Date() > new Date(session.expiresAt)) {
                await this.destroySession(sessionId);
                return null;
            }
            // Update last active time if rolling sessions enabled
            if (this.config.rolling) {
                await this.touchSession(sessionId);
            }
            return session;
        }
        catch (error) {
            this.logger.error('Failed to get session', {
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
            return null;
        }
    }
    /**
     * Update session last active time
     */
    async touchSession(sessionId) {
        try {
            const session = await this.cache.getObject(`${this.sessionPrefix}${sessionId}`);
            if (!session) {
                return;
            }
            const now = new Date();
            session.lastActiveAt = now;
            // Extend expiration if rolling
            if (this.config.rolling) {
                session.expiresAt = new Date(now.getTime() + this.config.ttl * 1000);
            }
            await this.cache.setObject(`${this.sessionPrefix}${sessionId}`, session, this.config.ttl);
        }
        catch (error) {
            this.logger.error('Failed to touch session', {
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    }
    /**
     * Destroy a session
     */
    async destroySession(sessionId) {
        try {
            const session = await this.cache.getObject(`${this.sessionPrefix}${sessionId}`);
            if (session) {
                // Remove from user session list
                await this.removeFromUserSessions(session.userId, sessionId);
                // Track logout event
                await this.trackAuthEvent({
                    eventType: 'logout',
                    success: true,
                    userId: session.userId,
                    sessionId,
                    timestamp: new Date(),
                });
            }
            // Remove session data
            await this.cache.del(`${this.sessionPrefix}${sessionId}`);
            this.logger.info('Session destroyed', { sessionId });
        }
        catch (error) {
            this.logger.error('Failed to destroy session', {
                error: error instanceof Error ? error.message : String(error),
                sessionId,
            });
        }
    }
    /**
     * Get all active sessions for a user
     */
    async getUserSessions(userId) {
        try {
            const sessionIds = (await this.cache.getObject(`${this.userSessionPrefix}${userId}`)) || [];
            const sessions = [];
            for (const sessionId of sessionIds) {
                const session = await this.getSession(sessionId);
                if (session && session.isActive) {
                    sessions.push(session);
                }
            }
            return sessions;
        }
        catch (error) {
            this.logger.error('Failed to get user sessions', {
                error: error instanceof Error ? error.message : String(error),
                userId,
            });
            return [];
        }
    }
    /**
     * Destroy all sessions for a user
     */
    async destroyAllUserSessions(userId, excludeSessionId) {
        try {
            const sessionIds = (await this.cache.getObject(`${this.userSessionPrefix}${userId}`)) || [];
            for (const sessionId of sessionIds) {
                if (sessionId !== excludeSessionId) {
                    await this.destroySession(sessionId);
                }
            }
            // Update user session list
            const remainingSessions = excludeSessionId ? [excludeSessionId] : [];
            if (remainingSessions.length > 0) {
                await this.cache.setObject(`${this.userSessionPrefix}${userId}`, remainingSessions, this.config.ttl);
            }
            else {
                await this.cache.del(`${this.userSessionPrefix}${userId}`);
            }
            this.logger.info('All user sessions destroyed', {
                userId,
                excludeSessionId,
            });
        }
        catch (error) {
            this.logger.error('Failed to destroy user sessions', {
                error: error instanceof Error ? error.message : String(error),
                userId,
            });
        }
    }
    /**
     * Manage user session limit
     */
    async manageUserSessionLimit(userId, newSessionId) {
        try {
            const sessionIds = (await this.cache.getObject(`${this.userSessionPrefix}${userId}`)) || [];
            // Add new session
            sessionIds.push(newSessionId);
            // Enforce session limit
            if (this.config.maxSessions &&
                sessionIds.length > this.config.maxSessions) {
                // Remove oldest sessions
                const sessionsToRemove = sessionIds.slice(0, sessionIds.length - this.config.maxSessions);
                for (const sessionId of sessionsToRemove) {
                    await this.destroySession(sessionId);
                }
                // Keep only the allowed number of sessions
                const keepSessions = sessionIds.slice(-this.config.maxSessions);
                await this.cache.setObject(`${this.userSessionPrefix}${userId}`, keepSessions, this.config.ttl);
            }
            else {
                await this.cache.setObject(`${this.userSessionPrefix}${userId}`, sessionIds, this.config.ttl);
            }
        }
        catch (error) {
            this.logger.error('Failed to manage session limit', {
                error: error instanceof Error ? error.message : String(error),
                userId,
            });
        }
    }
    /**
     * Remove session from user session list
     */
    async removeFromUserSessions(userId, sessionId) {
        try {
            const sessionIds = (await this.cache.getObject(`${this.userSessionPrefix}${userId}`)) || [];
            const updatedSessions = sessionIds.filter((id) => id !== sessionId);
            if (updatedSessions.length > 0) {
                await this.cache.setObject(`${this.userSessionPrefix}${userId}`, updatedSessions, this.config.ttl);
            }
            else {
                await this.cache.del(`${this.userSessionPrefix}${userId}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to remove session from user list', {
                error: error instanceof Error ? error.message : String(error),
                userId,
                sessionId,
            });
        }
    }
    /**
     * Track authentication events
     */
    async trackAuthEvent(event) {
        try {
            const eventKey = `${this.eventPrefix}${event.userId}:${Date.now()}`;
            await this.cache.setObject(eventKey, event, 86400 // Keep events for 24 hours
            );
            this.logger.debug('Auth event tracked', {
                eventType: event.eventType,
                userId: event.userId,
                sessionId: event.sessionId,
            });
        }
        catch (error) {
            this.logger.error('Failed to track auth event', {
                error: error instanceof Error ? error.message : String(error),
                eventType: event.eventType,
            });
        }
    }
    /**
     * Get authentication events for a user
     */
    async getUserAuthEvents(userId, limit = 50) {
        try {
            const pattern = `${this.eventPrefix}${userId}:*`;
            const keys = await this.cache.keys(pattern);
            // Sort by timestamp (newest first)
            keys.sort().reverse();
            const events = [];
            const keysToProcess = keys.slice(0, limit);
            for (const key of keysToProcess) {
                const event = await this.cache.getObject(key);
                if (event) {
                    events.push(event);
                }
            }
            return events;
        }
        catch (error) {
            this.logger.error('Failed to get user auth events', {
                error: error instanceof Error ? error.message : String(error),
                userId,
            });
            return [];
        }
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        try {
            const pattern = `${this.sessionPrefix}*`;
            const keys = await this.cache.keys(pattern);
            let cleaned = 0;
            for (const key of keys) {
                const session = await this.cache.getObject(key);
                if (session && new Date() > new Date(session.expiresAt)) {
                    const sessionId = key.replace(this.sessionPrefix, '');
                    await this.destroySession(sessionId);
                    cleaned++;
                }
            }
            this.logger.debug('Session cleanup completed', { cleaned });
            return cleaned;
        }
        catch (error) {
            this.logger.error('Session cleanup failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            return 0;
        }
    }
    /**
     * Get session statistics
     */
    async getSessionStats() {
        try {
            const pattern = `${this.sessionPrefix}*`;
            const keys = await this.cache.keys(pattern);
            const now = new Date();
            let totalSessions = 0;
            let activeSessions = 0;
            let expiredSessions = 0;
            for (const key of keys) {
                const session = await this.cache.getObject(key);
                if (session) {
                    totalSessions++;
                    if (now <= new Date(session.expiresAt) && session.isActive) {
                        activeSessions++;
                    }
                    else {
                        expiredSessions++;
                    }
                }
            }
            return {
                totalSessions,
                activeSessions,
                expiredSessions,
            };
        }
        catch (error) {
            this.logger.error('Failed to get session stats', {
                error: error instanceof Error ? error.message : String(error),
            });
            return {
                totalSessions: 0,
                activeSessions: 0,
                expiredSessions: 0,
            };
        }
    }
    /**
     * Update session configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.logger.info('Session configuration updated', { newConfig });
    }
    /**
     * Get current session configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.SessionManager = SessionManager;
