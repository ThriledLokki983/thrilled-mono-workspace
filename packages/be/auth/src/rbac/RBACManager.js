"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACManager = void 0;
var be_core_1 = require("@mono/be-core");
var RBACManager = /** @class */ (function () {
    function RBACManager(redis, config, logger) {
        this.rolePermissionsCache = new Map();
        this.userRolesCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        this.redis = redis;
        this.logger = logger || new be_core_1.Logger({ level: 'info', dir: './logs/rbac' });
    }
    /**
     * Create a new role
     */
    RBACManager.prototype.createRole = function (role) {
        return __awaiter(this, void 0, void 0, function () {
            var roleId, now, newRole, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        roleId = this.generateId();
                        now = new Date();
                        newRole = {
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
                        return [4 /*yield*/, this.redis.hset("role:".concat(roleId), 'data', JSON.stringify(newRole))];
                    case 1:
                        // Store role in Redis
                        _a.sent();
                        // Add to roles index
                        return [4 /*yield*/, this.redis.sadd('roles:all', roleId)];
                    case 2:
                        // Add to roles index
                        _a.sent();
                        // Add to name index
                        return [4 /*yield*/, this.redis.hset('roles:by_name', role.name, roleId)];
                    case 3:
                        // Add to name index
                        _a.sent();
                        // Cache permissions
                        this.rolePermissionsCache.set(role.name, newRole.permissions);
                        this.logger.info("Role created: ".concat(role.name, " (").concat(roleId, ")"));
                        return [2 /*return*/, newRole];
                    case 4:
                        error_1 = _a.sent();
                        this.logger.error('Failed to create role:', {
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                        });
                        throw new Error('Failed to create role');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get role by ID
     */
    RBACManager.prototype.getRole = function (roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var roleData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.hget("role:".concat(roleId), 'data')];
                    case 1:
                        roleData = _a.sent();
                        if (!roleData)
                            return [2 /*return*/, null];
                        return [2 /*return*/, JSON.parse(roleData)];
                    case 2:
                        error_2 = _a.sent();
                        this.logger.error('Failed to get role:', {
                            error: error_2 instanceof Error ? error_2.message : String(error_2),
                        });
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get role by name
     */
    RBACManager.prototype.getRoleByName = function (roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var roleId, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.hget('roles:by_name', roleName)];
                    case 1:
                        roleId = _a.sent();
                        if (!roleId)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.getRole(roleId)];
                    case 2:
                        error_3 = _a.sent();
                        this.logger.error('Failed to get role by name:', {
                            error: error_3 instanceof Error ? error_3.message : String(error_3),
                        });
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update role
     */
    RBACManager.prototype.updateRole = function (roleId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var existingRole, updatedRole, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getRole(roleId)];
                    case 1:
                        existingRole = _a.sent();
                        if (!existingRole) {
                            throw new Error('Role not found');
                        }
                        updatedRole = __assign(__assign(__assign({}, existingRole), updates), { updatedAt: new Date() });
                        // Update role in Redis
                        return [4 /*yield*/, this.redis.hset("role:".concat(roleId), 'data', JSON.stringify(updatedRole))];
                    case 2:
                        // Update role in Redis
                        _a.sent();
                        if (!(updates.name && updates.name !== existingRole.name)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.redis.hdel('roles:by_name', existingRole.name)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.redis.hset('roles:by_name', updates.name, roleId)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        // Update cache
                        this.rolePermissionsCache.set(updatedRole.name, updatedRole.permissions);
                        this.logger.info("Role updated: ".concat(updatedRole.name, " (").concat(roleId, ")"));
                        return [2 /*return*/, updatedRole];
                    case 6:
                        error_4 = _a.sent();
                        this.logger.error('Failed to update role:', {
                            error: error_4 instanceof Error ? error_4.message : String(error_4),
                        });
                        throw new Error('Failed to update role');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete role
     */
    RBACManager.prototype.deleteRole = function (roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var role, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getRole(roleId)];
                    case 1:
                        role = _a.sent();
                        if (!role)
                            return [2 /*return*/, false];
                        if (role.isSystem) {
                            throw new Error('Cannot delete system role');
                        }
                        // Remove all user assignments for this role
                        return [4 /*yield*/, this.removeRoleFromAllUsers(role.name)];
                    case 2:
                        // Remove all user assignments for this role
                        _a.sent();
                        // Remove from Redis
                        return [4 /*yield*/, this.redis.del("role:".concat(roleId))];
                    case 3:
                        // Remove from Redis
                        _a.sent();
                        return [4 /*yield*/, this.redis.srem('roles:all', roleId)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.redis.hdel('roles:by_name', role.name)];
                    case 5:
                        _a.sent();
                        // Clear cache
                        this.rolePermissionsCache.delete(role.name);
                        this.logger.info("Role deleted: ".concat(role.name, " (").concat(roleId, ")"));
                        return [2 /*return*/, true];
                    case 6:
                        error_5 = _a.sent();
                        this.logger.error('Failed to delete role:', {
                            error: error_5 instanceof Error ? error_5.message : String(error_5),
                        });
                        throw new Error('Failed to delete role');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List all roles
     */
    RBACManager.prototype.listRoles = function () {
        return __awaiter(this, arguments, void 0, function (options) {
            var roleIds, roles, _i, roleIds_1, roleId, role, error_6;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.redis.smembers('roles:all')];
                    case 1:
                        roleIds = _a.sent();
                        roles = [];
                        _i = 0, roleIds_1 = roleIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < roleIds_1.length)) return [3 /*break*/, 5];
                        roleId = roleIds_1[_i];
                        return [4 /*yield*/, this.getRole(roleId)];
                    case 3:
                        role = _a.sent();
                        if (role && (options.includeInactive || role.isActive)) {
                            roles.push(role);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, roles.sort(function (a, b) { return a.name.localeCompare(b.name); })];
                    case 6:
                        error_6 = _a.sent();
                        this.logger.error('Failed to list roles:', {
                            error: error_6 instanceof Error ? error_6.message : String(error_6),
                        });
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Create a new permission
     */
    RBACManager.prototype.createPermission = function (permission) {
        return __awaiter(this, void 0, void 0, function () {
            var permissionId, now, newPermission, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        permissionId = this.generateId();
                        now = new Date();
                        newPermission = {
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
                        return [4 /*yield*/, this.redis.hset("permission:".concat(permissionId), 'data', JSON.stringify(newPermission))];
                    case 1:
                        // Store permission in Redis
                        _a.sent();
                        // Add to permissions index
                        return [4 /*yield*/, this.redis.sadd('permissions:all', permissionId)];
                    case 2:
                        // Add to permissions index
                        _a.sent();
                        // Add to name index
                        return [4 /*yield*/, this.redis.hset('permissions:by_name', permission.name, permissionId)];
                    case 3:
                        // Add to name index
                        _a.sent();
                        this.logger.info("Permission created: ".concat(permission.name, " (").concat(permissionId, ")"));
                        return [2 /*return*/, newPermission];
                    case 4:
                        error_7 = _a.sent();
                        this.logger.error('Failed to create permission:', {
                            error: error_7 instanceof Error ? error_7.message : String(error_7),
                        });
                        throw new Error('Failed to create permission');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get permission by name
     */
    RBACManager.prototype.getPermissionByName = function (permissionName) {
        return __awaiter(this, void 0, void 0, function () {
            var permissionId, permissionData, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.redis.hget('permissions:by_name', permissionName)];
                    case 1:
                        permissionId = _a.sent();
                        if (!permissionId)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.redis.hget("permission:".concat(permissionId), 'data')];
                    case 2:
                        permissionData = _a.sent();
                        if (!permissionData)
                            return [2 /*return*/, null];
                        return [2 /*return*/, JSON.parse(permissionData)];
                    case 3:
                        error_8 = _a.sent();
                        this.logger.error('Failed to get permission by name:', {
                            error: error_8 instanceof Error ? error_8.message : String(error_8),
                        });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List all permissions
     */
    RBACManager.prototype.listPermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            var permissionIds, permissions, _i, permissionIds_1, permissionId, permissionData, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.redis.smembers('permissions:all')];
                    case 1:
                        permissionIds = _a.sent();
                        permissions = [];
                        _i = 0, permissionIds_1 = permissionIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < permissionIds_1.length)) return [3 /*break*/, 5];
                        permissionId = permissionIds_1[_i];
                        return [4 /*yield*/, this.redis.hget("permission:".concat(permissionId), 'data')];
                    case 3:
                        permissionData = _a.sent();
                        if (permissionData) {
                            permissions.push(JSON.parse(permissionData));
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, permissions.sort(function (a, b) { return a.name.localeCompare(b.name); })];
                    case 6:
                        error_9 = _a.sent();
                        this.logger.error('Failed to list permissions:', {
                            error: error_9 instanceof Error ? error_9.message : String(error_9),
                        });
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assign role to user
     */
    RBACManager.prototype.assignRoleToUser = function (userId, roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var role, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getRoleByName(roleName)];
                    case 1:
                        role = _a.sent();
                        if (!role || !role.isActive) {
                            throw new Error('Role not found or inactive');
                        }
                        // Add to user roles set
                        return [4 /*yield*/, this.redis.sadd("user:".concat(userId, ":roles"), roleName)];
                    case 2:
                        // Add to user roles set
                        _a.sent();
                        // Add to role users set
                        return [4 /*yield*/, this.redis.sadd("role:".concat(roleName, ":users"), userId)];
                    case 3:
                        // Add to role users set
                        _a.sent();
                        // Clear cache
                        this.userRolesCache.delete(userId);
                        this.logger.info("Role assigned: ".concat(roleName, " to user ").concat(userId));
                        return [2 /*return*/, true];
                    case 4:
                        error_10 = _a.sent();
                        this.logger.error('Failed to assign role to user:', {
                            error: error_10 instanceof Error ? error_10.message : String(error_10),
                        });
                        throw new Error('Failed to assign role to user');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove role from user
     */
    RBACManager.prototype.removeRoleFromUser = function (userId, roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Remove from user roles set
                        return [4 /*yield*/, this.redis.srem("user:".concat(userId, ":roles"), roleName)];
                    case 1:
                        // Remove from user roles set
                        _a.sent();
                        // Remove from role users set
                        return [4 /*yield*/, this.redis.srem("role:".concat(roleName, ":users"), userId)];
                    case 2:
                        // Remove from role users set
                        _a.sent();
                        // Clear cache
                        this.userRolesCache.delete(userId);
                        this.logger.info("Role removed: ".concat(roleName, " from user ").concat(userId));
                        return [2 /*return*/, true];
                    case 3:
                        error_11 = _a.sent();
                        this.logger.error('Failed to remove role from user:', {
                            error: error_11 instanceof Error ? error_11.message : String(error_11),
                        });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove role from all users
     */
    RBACManager.prototype.removeRoleFromAllUsers = function (roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var userIds, _i, userIds_1, userId, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.redis.smembers("role:".concat(roleName, ":users"))];
                    case 1:
                        userIds = _a.sent();
                        _i = 0, userIds_1 = userIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < userIds_1.length)) return [3 /*break*/, 5];
                        userId = userIds_1[_i];
                        return [4 /*yield*/, this.removeRoleFromUser(userId, roleName)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: 
                    // Clear the role users set
                    return [4 /*yield*/, this.redis.del("role:".concat(roleName, ":users"))];
                    case 6:
                        // Clear the role users set
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_12 = _a.sent();
                        this.logger.error('Failed to remove role from all users:', {
                            error: error_12 instanceof Error ? error_12.message : String(error_12),
                        });
                        throw new Error('Failed to remove role from all users');
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user roles
     */
    RBACManager.prototype.getUserRoles = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, roles, error_13;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cached = this.userRolesCache.get(userId);
                        if (cached)
                            return [2 /*return*/, cached];
                        return [4 /*yield*/, this.redis.smembers("user:".concat(userId, ":roles"))];
                    case 1:
                        roles = _a.sent();
                        // Cache result
                        this.userRolesCache.set(userId, roles);
                        setTimeout(function () { return _this.userRolesCache.delete(userId); }, this.cacheTimeout);
                        return [2 /*return*/, roles];
                    case 2:
                        error_13 = _a.sent();
                        this.logger.error('Failed to get user roles:', {
                            error: error_13 instanceof Error ? error_13.message : String(error_13),
                        });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user permissions (from all assigned roles)
     */
    RBACManager.prototype.getUserPermissions = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, permissions_1, _i, userRoles_1, roleName, rolePermissions, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getUserRoles(userId)];
                    case 1:
                        userRoles = _a.sent();
                        permissions_1 = new Set();
                        _i = 0, userRoles_1 = userRoles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < userRoles_1.length)) return [3 /*break*/, 5];
                        roleName = userRoles_1[_i];
                        return [4 /*yield*/, this.getRolePermissions(roleName)];
                    case 3:
                        rolePermissions = _a.sent();
                        rolePermissions.forEach(function (permission) { return permissions_1.add(permission); });
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, Array.from(permissions_1)];
                    case 6:
                        error_14 = _a.sent();
                        this.logger.error('Failed to get user permissions:', {
                            error: error_14 instanceof Error ? error_14.message : String(error_14),
                        });
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get role permissions
     */
    RBACManager.prototype.getRolePermissions = function (roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, role, error_15;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cached = this.rolePermissionsCache.get(roleName);
                        if (cached)
                            return [2 /*return*/, cached.map(function (p) { return p.name; })];
                        return [4 /*yield*/, this.getRoleByName(roleName)];
                    case 1:
                        role = _a.sent();
                        if (!role)
                            return [2 /*return*/, []];
                        // Cache result
                        this.rolePermissionsCache.set(roleName, role.permissions);
                        setTimeout(function () { return _this.rolePermissionsCache.delete(roleName); }, this.cacheTimeout);
                        return [2 /*return*/, role.permissions.map(function (p) { return p.name; })];
                    case 2:
                        error_15 = _a.sent();
                        this.logger.error('Failed to get role permissions:', {
                            error: error_15 instanceof Error ? error_15.message : String(error_15),
                        });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user has role
     */
    RBACManager.prototype.userHasRole = function (userId, roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUserRoles(userId)];
                    case 1:
                        userRoles = _a.sent();
                        return [2 /*return*/, userRoles.includes(roleName)];
                    case 2:
                        error_16 = _a.sent();
                        this.logger.error('Failed to check user role:', {
                            error: error_16 instanceof Error ? error_16.message : String(error_16),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user has permission
     */
    RBACManager.prototype.userHasPermission = function (userId, permissionName) {
        return __awaiter(this, void 0, void 0, function () {
            var userPermissions, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUserPermissions(userId)];
                    case 1:
                        userPermissions = _a.sent();
                        return [2 /*return*/, userPermissions.includes(permissionName)];
                    case 2:
                        error_17 = _a.sent();
                        this.logger.error('Failed to check user permission:', {
                            error: error_17 instanceof Error ? error_17.message : String(error_17),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user has any of the specified roles
     */
    RBACManager.prototype.userHasAnyRole = function (userId, roleNames) {
        return __awaiter(this, void 0, void 0, function () {
            var userRoles_2, error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUserRoles(userId)];
                    case 1:
                        userRoles_2 = _a.sent();
                        return [2 /*return*/, roleNames.some(function (role) { return userRoles_2.includes(role); })];
                    case 2:
                        error_18 = _a.sent();
                        this.logger.error('Failed to check user roles:', {
                            error: error_18 instanceof Error ? error_18.message : String(error_18),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if user has all specified permissions
     */
    RBACManager.prototype.userHasAllPermissions = function (userId, permissionNames) {
        return __awaiter(this, void 0, void 0, function () {
            var userPermissions_1, error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getUserPermissions(userId)];
                    case 1:
                        userPermissions_1 = _a.sent();
                        return [2 /*return*/, permissionNames.every(function (permission) {
                                return userPermissions_1.includes(permission);
                            })];
                    case 2:
                        error_19 = _a.sent();
                        this.logger.error('Failed to check user permissions:', {
                            error: error_19 instanceof Error ? error_19.message : String(error_19),
                        });
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get users with specific role
     */
    RBACManager.prototype.getUsersWithRole = function (roleName) {
        return __awaiter(this, void 0, void 0, function () {
            var error_20;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.redis.smembers("role:".concat(roleName, ":users"))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_20 = _a.sent();
                        this.logger.error('Failed to get users with role:', {
                            error: error_20 instanceof Error ? error_20.message : String(error_20),
                        });
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize default roles and permissions
     */
    RBACManager.prototype.initializeDefaultRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var defaultPermissions, createdPermissions, _i, defaultPermissions_1, permission, existingPermission, userReadPermission, defaultRoles, _a, defaultRoles_1, role, existing, error_21;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 12, , 13]);
                        defaultPermissions = [
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
                        createdPermissions = [];
                        _i = 0, defaultPermissions_1 = defaultPermissions;
                        _b.label = 1;
                    case 1:
                        if (!(_i < defaultPermissions_1.length)) return [3 /*break*/, 6];
                        permission = defaultPermissions_1[_i];
                        return [4 /*yield*/, this.getPermissionByName(permission.name)];
                    case 2:
                        existingPermission = _b.sent();
                        if (!!existingPermission) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createPermission(__assign(__assign({}, permission), { isSystem: true }))];
                    case 3:
                        existingPermission = _b.sent();
                        _b.label = 4;
                    case 4:
                        createdPermissions.push(existingPermission);
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        userReadPermission = createdPermissions.find(function (p) { return p.name === 'user.read'; });
                        defaultRoles = [
                            {
                                name: 'user',
                                description: 'Standard user role',
                                permissions: userReadPermission ? [userReadPermission] : [],
                                isSystem: true,
                            },
                            {
                                name: 'moderator',
                                description: 'Moderator role with user management permissions',
                                permissions: createdPermissions.filter(function (p) {
                                    return ['user.read', 'user.write'].includes(p.name);
                                }),
                                isSystem: true,
                            },
                            {
                                name: 'admin',
                                description: 'Administrator role with full access',
                                permissions: createdPermissions,
                                isSystem: true,
                            },
                        ];
                        _a = 0, defaultRoles_1 = defaultRoles;
                        _b.label = 7;
                    case 7:
                        if (!(_a < defaultRoles_1.length)) return [3 /*break*/, 11];
                        role = defaultRoles_1[_a];
                        return [4 /*yield*/, this.getRoleByName(role.name)];
                    case 8:
                        existing = _b.sent();
                        if (!!existing) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.createRole(role)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10:
                        _a++;
                        return [3 /*break*/, 7];
                    case 11:
                        this.logger.info('Default roles and permissions initialized');
                        return [3 /*break*/, 13];
                    case 12:
                        error_21 = _b.sent();
                        this.logger.error('Failed to initialize default roles:', {
                            error: error_21 instanceof Error ? error_21.message : String(error_21),
                        });
                        throw new Error('Failed to initialize default roles');
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear caches
     */
    RBACManager.prototype.clearCaches = function () {
        this.rolePermissionsCache.clear();
        this.userRolesCache.clear();
    };
    /**
     * Generate unique ID
     */
    RBACManager.prototype.generateId = function () {
        return "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    return RBACManager;
}());
exports.RBACManager = RBACManager;
