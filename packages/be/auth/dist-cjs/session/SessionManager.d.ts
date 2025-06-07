import type { Logger } from '@mono/be-core';
import type { SessionConfig, UserSession, AuthEvent, CacheManager } from '../types/index.js';
export declare class SessionManager {
    private readonly config;
    private readonly cache;
    private readonly logger;
    private readonly sessionPrefix;
    private readonly userSessionPrefix;
    private readonly eventPrefix;
    constructor(config: SessionConfig, cache: CacheManager, logger: Logger);
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Create a new user session
     */
    createSession(userId: string, deviceInfo?: {
        userAgent?: string;
        ip?: string;
        platform?: string;
    }, deviceId?: string): Promise<UserSession>;
    /**
     * Get session by ID
     */
    getSession(sessionId: string): Promise<UserSession | null>;
    /**
     * Update session last active time
     */
    touchSession(sessionId: string): Promise<void>;
    /**
     * Destroy a session
     */
    destroySession(sessionId: string): Promise<void>;
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId: string): Promise<UserSession[]>;
    /**
     * Destroy all sessions for a user
     */
    destroyAllUserSessions(userId: string, excludeSessionId?: string): Promise<void>;
    /**
     * Manage user session limit
     */
    private manageUserSessionLimit;
    /**
     * Remove session from user session list
     */
    private removeFromUserSessions;
    /**
     * Track authentication events
     */
    private trackAuthEvent;
    /**
     * Get authentication events for a user
     */
    getUserAuthEvents(userId: string, limit?: number): Promise<AuthEvent[]>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Get session statistics
     */
    getSessionStats(): Promise<{
        totalSessions: number;
        activeSessions: number;
        expiredSessions: number;
    }>;
    /**
     * Update session configuration
     */
    updateConfig(newConfig: Partial<SessionConfig>): void;
    /**
     * Get current session configuration
     */
    getConfig(): SessionConfig;
}
