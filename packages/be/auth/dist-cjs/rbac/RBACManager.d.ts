import { Role, Permission, RBACConfig } from '../types/index.js';
import { Logger } from '@mono/be-core';
import type { Redis } from 'ioredis';
export interface RolePermissionMap {
    [roleName: string]: Permission[];
}
export interface UserRoleMap {
    [userId: string]: string[];
}
export declare class RBACManager {
    private redis;
    private logger;
    private rolePermissionsCache;
    private userRolesCache;
    private cacheTimeout;
    constructor(redis: Redis, config: RBACConfig, logger?: Logger);
    /**
     * Create a new role
     */
    createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role>;
    /**
     * Get role by ID
     */
    getRole(roleId: string): Promise<Role | null>;
    /**
     * Get role by name
     */
    getRoleByName(roleName: string): Promise<Role | null>;
    /**
     * Update role
     */
    updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<Role | null>;
    /**
     * Delete role
     */
    deleteRole(roleId: string): Promise<boolean>;
    /**
     * List all roles
     */
    listRoles(options?: {
        includeInactive?: boolean;
    }): Promise<Role[]>;
    /**
     * Create a new permission
     */
    createPermission(permission: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<Permission>;
    /**
     * Get permission by name
     */
    getPermissionByName(permissionName: string): Promise<Permission | null>;
    /**
     * List all permissions
     */
    listPermissions(): Promise<Permission[]>;
    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, roleName: string): Promise<boolean>;
    /**
     * Remove role from user
     */
    removeRoleFromUser(userId: string, roleName: string): Promise<boolean>;
    /**
     * Remove role from all users
     */
    removeRoleFromAllUsers(roleName: string): Promise<void>;
    /**
     * Get user roles
     */
    getUserRoles(userId: string): Promise<string[]>;
    /**
     * Get user permissions (from all assigned roles)
     */
    getUserPermissions(userId: string): Promise<string[]>;
    /**
     * Get role permissions
     */
    getRolePermissions(roleName: string): Promise<string[]>;
    /**
     * Check if user has role
     */
    userHasRole(userId: string, roleName: string): Promise<boolean>;
    /**
     * Check if user has permission
     */
    userHasPermission(userId: string, permissionName: string): Promise<boolean>;
    /**
     * Check if user has any of the specified roles
     */
    userHasAnyRole(userId: string, roleNames: string[]): Promise<boolean>;
    /**
     * Check if user has all specified permissions
     */
    userHasAllPermissions(userId: string, permissionNames: string[]): Promise<boolean>;
    /**
     * Get users with specific role
     */
    getUsersWithRole(roleName: string): Promise<string[]>;
    /**
     * Initialize default roles and permissions
     */
    initializeDefaultRoles(): Promise<void>;
    /**
     * Clear caches
     */
    clearCaches(): void;
    /**
     * Generate unique ID
     */
    private generateId;
}
