"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACManager = void 0;
const be_core_1 = require("@mono/be-core");
class RBACManager {
    constructor(redis, config, logger) {
        this.rolePermissionsCache = new Map();
        this.userRolesCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        this.redis = redis;
        this.logger = logger || new be_core_1.Logger({ level: 'info', dir: './logs/rbac' });
    }
    /**
     * Create a new role
     */
    async createRole(role) {
        try {
            const roleId = this.generateId();
            const now = new Date();
            const newRole = {
                id: roleId,
                name: role.name,
                description: role.description,
                permissions: role.permissions || [],
                isSystem: role.isSystem || false,
                isActive: role.isActive !== false,
                createdAt: now,
                updatedAt: now,
            };
            // Store role in Redis
            await this.redis.hset(`role:${roleId}`, 'data', JSON.stringify(newRole));
            // Add to roles index
            await this.redis.sadd('roles:all', roleId);
            // Add to name index
            await this.redis.hset('roles:by_name', role.name, roleId);
            // Cache permissions
            this.rolePermissionsCache.set(role.name, newRole.permissions);
            this.logger.info(`Role created: ${role.name} (${roleId})`);
            return newRole;
        }
        catch (error) {
            this.logger.error('Failed to create role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to create role');
        }
    }
    /**
     * Get role by ID
     */
    async getRole(roleId) {
        try {
            const roleData = await this.redis.hget(`role:${roleId}`, 'data');
            if (!roleData)
                return null;
            return JSON.parse(roleData);
        }
        catch (error) {
            this.logger.error('Failed to get role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    /**
     * Get role by name
     */
    async getRoleByName(roleName) {
        try {
            const roleId = await this.redis.hget('roles:by_name', roleName);
            if (!roleId)
                return null;
            return this.getRole(roleId);
        }
        catch (error) {
            this.logger.error('Failed to get role by name:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    /**
     * Update role
     */
    async updateRole(roleId, updates) {
        try {
            const existingRole = await this.getRole(roleId);
            if (!existingRole) {
                throw new Error('Role not found');
            }
            const updatedRole = {
                ...existingRole,
                ...updates,
                updatedAt: new Date(),
            };
            // Update role in Redis
            await this.redis.hset(`role:${roleId}`, 'data', JSON.stringify(updatedRole));
            // Update name index if name changed
            if (updates.name && updates.name !== existingRole.name) {
                await this.redis.hdel('roles:by_name', existingRole.name);
                await this.redis.hset('roles:by_name', updates.name, roleId);
            }
            // Update cache
            this.rolePermissionsCache.set(updatedRole.name, updatedRole.permissions);
            this.logger.info(`Role updated: ${updatedRole.name} (${roleId})`);
            return updatedRole;
        }
        catch (error) {
            this.logger.error('Failed to update role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to update role');
        }
    }
    /**
     * Delete role
     */
    async deleteRole(roleId) {
        try {
            const role = await this.getRole(roleId);
            if (!role)
                return false;
            if (role.isSystem) {
                throw new Error('Cannot delete system role');
            }
            // Remove all user assignments for this role
            await this.removeRoleFromAllUsers(role.name);
            // Remove from Redis
            await this.redis.del(`role:${roleId}`);
            await this.redis.srem('roles:all', roleId);
            await this.redis.hdel('roles:by_name', role.name);
            // Clear cache
            this.rolePermissionsCache.delete(role.name);
            this.logger.info(`Role deleted: ${role.name} (${roleId})`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to delete role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to delete role');
        }
    }
    /**
     * List all roles
     */
    async listRoles(options = {}) {
        try {
            const roleIds = await this.redis.smembers('roles:all');
            const roles = [];
            for (const roleId of roleIds) {
                const role = await this.getRole(roleId);
                if (role && (options.includeInactive || role.isActive)) {
                    roles.push(role);
                }
            }
            return roles.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (error) {
            this.logger.error('Failed to list roles:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Create a new permission
     */
    async createPermission(permission) {
        try {
            const permissionId = this.generateId();
            const now = new Date();
            const newPermission = {
                id: permissionId,
                name: permission.name,
                description: permission.description,
                resource: permission.resource,
                action: permission.action,
                isSystem: permission.isSystem || false,
                createdAt: now,
                updatedAt: now,
            };
            // Store permission in Redis
            await this.redis.hset(`permission:${permissionId}`, 'data', JSON.stringify(newPermission));
            // Add to permissions index
            await this.redis.sadd('permissions:all', permissionId);
            // Add to name index
            await this.redis.hset('permissions:by_name', permission.name, permissionId);
            this.logger.info(`Permission created: ${permission.name} (${permissionId})`);
            return newPermission;
        }
        catch (error) {
            this.logger.error('Failed to create permission:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to create permission');
        }
    }
    /**
     * Get permission by name
     */
    async getPermissionByName(permissionName) {
        try {
            const permissionId = await this.redis.hget('permissions:by_name', permissionName);
            if (!permissionId)
                return null;
            const permissionData = await this.redis.hget(`permission:${permissionId}`, 'data');
            if (!permissionData)
                return null;
            return JSON.parse(permissionData);
        }
        catch (error) {
            this.logger.error('Failed to get permission by name:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return null;
        }
    }
    /**
     * List all permissions
     */
    async listPermissions() {
        try {
            const permissionIds = await this.redis.smembers('permissions:all');
            const permissions = [];
            for (const permissionId of permissionIds) {
                const permissionData = await this.redis.hget(`permission:${permissionId}`, 'data');
                if (permissionData) {
                    permissions.push(JSON.parse(permissionData));
                }
            }
            return permissions.sort((a, b) => a.name.localeCompare(b.name));
        }
        catch (error) {
            this.logger.error('Failed to list permissions:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Assign role to user
     */
    async assignRoleToUser(userId, roleName) {
        try {
            const role = await this.getRoleByName(roleName);
            if (!role || !role.isActive) {
                throw new Error('Role not found or inactive');
            }
            // Add to user roles set
            await this.redis.sadd(`user:${userId}:roles`, roleName);
            // Add to role users set
            await this.redis.sadd(`role:${roleName}:users`, userId);
            // Clear cache
            this.userRolesCache.delete(userId);
            this.logger.info(`Role assigned: ${roleName} to user ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to assign role to user:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to assign role to user');
        }
    }
    /**
     * Remove role from user
     */
    async removeRoleFromUser(userId, roleName) {
        try {
            // Remove from user roles set
            await this.redis.srem(`user:${userId}:roles`, roleName);
            // Remove from role users set
            await this.redis.srem(`role:${roleName}:users`, userId);
            // Clear cache
            this.userRolesCache.delete(userId);
            this.logger.info(`Role removed: ${roleName} from user ${userId}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to remove role from user:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Remove role from all users
     */
    async removeRoleFromAllUsers(roleName) {
        try {
            const userIds = await this.redis.smembers(`role:${roleName}:users`);
            for (const userId of userIds) {
                await this.removeRoleFromUser(userId, roleName);
            }
            // Clear the role users set
            await this.redis.del(`role:${roleName}:users`);
        }
        catch (error) {
            this.logger.error('Failed to remove role from all users:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to remove role from all users');
        }
    }
    /**
     * Get user roles
     */
    async getUserRoles(userId) {
        try {
            // Check cache first
            const cached = this.userRolesCache.get(userId);
            if (cached)
                return cached;
            const roles = await this.redis.smembers(`user:${userId}:roles`);
            // Cache result
            this.userRolesCache.set(userId, roles);
            setTimeout(() => this.userRolesCache.delete(userId), this.cacheTimeout);
            return roles;
        }
        catch (error) {
            this.logger.error('Failed to get user roles:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Get user permissions (from all assigned roles)
     */
    async getUserPermissions(userId) {
        try {
            const userRoles = await this.getUserRoles(userId);
            const permissions = new Set();
            for (const roleName of userRoles) {
                const rolePermissions = await this.getRolePermissions(roleName);
                rolePermissions.forEach((permission) => permissions.add(permission));
            }
            return Array.from(permissions);
        }
        catch (error) {
            this.logger.error('Failed to get user permissions:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Get role permissions
     */
    async getRolePermissions(roleName) {
        try {
            // Check cache first
            const cached = this.rolePermissionsCache.get(roleName);
            if (cached)
                return cached.map((p) => p.name);
            const role = await this.getRoleByName(roleName);
            if (!role)
                return [];
            // Cache result
            this.rolePermissionsCache.set(roleName, role.permissions);
            setTimeout(() => this.rolePermissionsCache.delete(roleName), this.cacheTimeout);
            return role.permissions.map((p) => p.name);
        }
        catch (error) {
            this.logger.error('Failed to get role permissions:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Check if user has role
     */
    async userHasRole(userId, roleName) {
        try {
            const userRoles = await this.getUserRoles(userId);
            return userRoles.includes(roleName);
        }
        catch (error) {
            this.logger.error('Failed to check user role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Check if user has permission
     */
    async userHasPermission(userId, permissionName) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            return userPermissions.includes(permissionName);
        }
        catch (error) {
            this.logger.error('Failed to check user permission:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Check if user has any of the specified roles
     */
    async userHasAnyRole(userId, roleNames) {
        try {
            const userRoles = await this.getUserRoles(userId);
            return roleNames.some((role) => userRoles.includes(role));
        }
        catch (error) {
            this.logger.error('Failed to check user roles:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Check if user has all specified permissions
     */
    async userHasAllPermissions(userId, permissionNames) {
        try {
            const userPermissions = await this.getUserPermissions(userId);
            return permissionNames.every((permission) => userPermissions.includes(permission));
        }
        catch (error) {
            this.logger.error('Failed to check user permissions:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    /**
     * Get users with specific role
     */
    async getUsersWithRole(roleName) {
        try {
            return await this.redis.smembers(`role:${roleName}:users`);
        }
        catch (error) {
            this.logger.error('Failed to get users with role:', {
                error: error instanceof Error ? error.message : String(error),
            });
            return [];
        }
    }
    /**
     * Initialize default roles and permissions
     */
    async initializeDefaultRoles() {
        try {
            // Default permissions
            const defaultPermissions = [
                {
                    name: 'user.read',
                    description: 'Read user data',
                    resource: 'user',
                    action: 'read',
                },
                {
                    name: 'user.write',
                    description: 'Write user data',
                    resource: 'user',
                    action: 'write',
                },
                {
                    name: 'user.delete',
                    description: 'Delete user data',
                    resource: 'user',
                    action: 'delete',
                },
                {
                    name: 'admin.access',
                    description: 'Access admin panel',
                    resource: 'admin',
                    action: 'access',
                },
                {
                    name: 'system.manage',
                    description: 'Manage system settings',
                    resource: 'system',
                    action: 'manage',
                },
            ];
            const createdPermissions = [];
            for (const permission of defaultPermissions) {
                let existingPermission = await this.getPermissionByName(permission.name);
                if (!existingPermission) {
                    existingPermission = await this.createPermission({
                        ...permission,
                        isSystem: true,
                    });
                }
                createdPermissions.push(existingPermission);
            }
            // Default roles with Permission objects
            const userReadPermission = createdPermissions.find((p) => p.name === 'user.read');
            const defaultRoles = [
                {
                    name: 'user',
                    description: 'Standard user role',
                    permissions: userReadPermission ? [userReadPermission] : [],
                    isSystem: true,
                },
                {
                    name: 'moderator',
                    description: 'Moderator role with user management permissions',
                    permissions: createdPermissions.filter((p) => ['user.read', 'user.write'].includes(p.name)),
                    isSystem: true,
                },
                {
                    name: 'admin',
                    description: 'Administrator role with full access',
                    permissions: createdPermissions,
                    isSystem: true,
                },
            ];
            for (const role of defaultRoles) {
                const existing = await this.getRoleByName(role.name);
                if (!existing) {
                    await this.createRole(role);
                }
            }
            this.logger.info('Default roles and permissions initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize default roles:', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to initialize default roles');
        }
    }
    /**
     * Clear caches
     */
    clearCaches() {
        this.rolePermissionsCache.clear();
        this.userRolesCache.clear();
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.RBACManager = RBACManager;
