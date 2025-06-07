"use strict";
// Main authentication package exports
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheAdapter = exports.RateLimitUtils = exports.DeviceUtils = exports.IPUtils = exports.TimeUtils = exports.ValidationUtils = exports.CryptoUtils = exports.RBACManager = exports.AuthMiddleware = exports.SessionManager = exports.PasswordManager = exports.JWTProvider = void 0;
// Core Components
var JWTProvider_js_1 = require("./jwt/JWTProvider.js");
Object.defineProperty(exports, "JWTProvider", { enumerable: true, get: function () { return JWTProvider_js_1.JWTProvider; } });
var PasswordManager_js_1 = require("./password/PasswordManager.js");
Object.defineProperty(exports, "PasswordManager", { enumerable: true, get: function () { return PasswordManager_js_1.PasswordManager; } });
var SessionManager_js_1 = require("./session/SessionManager.js");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return SessionManager_js_1.SessionManager; } });
// Middleware
var AuthMiddleware_js_1 = require("./middleware/AuthMiddleware.js");
Object.defineProperty(exports, "AuthMiddleware", { enumerable: true, get: function () { return AuthMiddleware_js_1.AuthMiddleware; } });
// RBAC
var RBACManager_js_1 = require("./rbac/RBACManager.js");
Object.defineProperty(exports, "RBACManager", { enumerable: true, get: function () { return RBACManager_js_1.RBACManager; } });
// Utilities
__exportStar(require("./utils/index.js"), exports);
// Types
__exportStar(require("./types/index.js"), exports);
// Re-export for convenience
var index_js_1 = require("./utils/index.js");
Object.defineProperty(exports, "CryptoUtils", { enumerable: true, get: function () { return index_js_1.CryptoUtils; } });
Object.defineProperty(exports, "ValidationUtils", { enumerable: true, get: function () { return index_js_1.ValidationUtils; } });
Object.defineProperty(exports, "TimeUtils", { enumerable: true, get: function () { return index_js_1.TimeUtils; } });
Object.defineProperty(exports, "IPUtils", { enumerable: true, get: function () { return index_js_1.IPUtils; } });
Object.defineProperty(exports, "DeviceUtils", { enumerable: true, get: function () { return index_js_1.DeviceUtils; } });
Object.defineProperty(exports, "RateLimitUtils", { enumerable: true, get: function () { return index_js_1.RateLimitUtils; } });
// Legacy support
__exportStar(require("./lib/auth.js"), exports);
// Cache Adapters
var RedisCacheAdapter_js_1 = require("./cache/RedisCacheAdapter.js");
Object.defineProperty(exports, "RedisCacheAdapter", { enumerable: true, get: function () { return RedisCacheAdapter_js_1.RedisCacheAdapter; } });
