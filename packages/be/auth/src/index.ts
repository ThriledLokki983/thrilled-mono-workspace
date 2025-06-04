// Main authentication package exports

// Core Components
export { JWTProvider } from './jwt/JWTProvider.js';
export { PasswordManager } from './password/PasswordManager.js';
export { SessionManager } from './session/SessionManager.js';

// Middleware
export { AuthMiddleware } from './middleware/AuthMiddleware.js';
export type { AuthenticatedRequest, AuthMiddlewareOptions } from './middleware/AuthMiddleware.js';

// RBAC
export { RBACManager } from './rbac/RBACManager.js';
export type { RolePermissionMap, UserRoleMap } from './rbac/RBACManager.js';

// Utilities
export * from './utils/index.js';

// Types
export * from './types/index.js';

// Re-export for convenience
export {
  CryptoUtils,
  ValidationUtils,
  TimeUtils,
  IPUtils,
  DeviceUtils,
  RateLimitUtils
} from './utils/index.js';

// Legacy support
export * from './lib/auth.js';

// Cache Adapters
export { RedisCacheAdapter } from './cache/RedisCacheAdapter.js';
