# @thrilled/be-auth

Comprehensive authentication package for backend services in the Thrilled monorepo. This package provides JWT token management, password security, session handling, role-based access control (RBAC), and authentication middleware for Express.js applications.

## Features

- 🔐 **JWT Provider**: Access/refresh token management with blacklisting support
- 🔒 **Password Manager**: Secure password hashing, validation, and reset flows
- 📱 **Session Manager**: Redis-based session management with multi-device support
- 🛡️ **Authentication Middleware**: Express middleware for route protection
- 👥 **RBAC System**: Role and permission management with hierarchical support
- 🔧 **Utility Functions**: Crypto, validation, time, IP, and device utilities
- ⚡ **Rate Limiting**: Built-in rate limiting for authentication endpoints
- 📊 **Event Logging**: Comprehensive authentication event tracking

## Installation

```bash
# Using yarn (recommended for Nx workspace)
yarn add @thrilled/be-auth

# Using npm
npm install @thrilled/be-auth
```

## Dependencies

This package requires the following peer dependencies:

```bash
yarn add ioredis express jsonwebtoken bcrypt @mono/be-core @thrilled/be-types @thrilled/be-databases
```

## Quick Start

### Basic Setup

```typescript
import express from 'express';
import Redis from 'ioredis';
import {
  JWTProvider,
  PasswordManager,
  SessionManager,
  AuthMiddleware,
  RBACManager,
  AuthConfig
} from '@thrilled/be-auth';

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Configuration
const config: AuthConfig = {
  jwt: {
    accessToken: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
      algorithm: 'HS256'
    },
    refreshToken: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  },
  password: {
    saltRounds: 12,
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  session: {
    defaultTTL: '24h',
    maxSessionsPerUser: 5,
    enableRollingSession: true
  },
  rbac: {
    enableRoleHierarchy: true,
    defaultRole: 'user'
  }
};

// Initialize components
const jwtProvider = new JWTProvider(redis, config.jwt);
const passwordManager = new PasswordManager(redis, config.password);
const sessionManager = new SessionManager(redis, config.session);
const rbacManager = new RBACManager(redis, config.rbac);
const authMiddleware = new AuthMiddleware(jwtProvider, sessionManager, config);
```

### Authentication Middleware Usage

```typescript
// Protect all routes under /api/protected
app.use('/api/protected', authMiddleware.requireAuth());

// Admin-only routes
app.use('/api/admin', authMiddleware.requireAdmin());

// Role-based protection
app.get('/api/moderator', 
  authMiddleware.requireRoles(['admin', 'moderator']),
  (req, res) => {
    res.json({ message: 'Moderator content' });
  }
);

// Permission-based protection
app.post('/api/content', 
  authMiddleware.requirePermissions(['content.write']),
  (req, res) => {
    res.json({ message: 'Content created' });
  }
);

// Custom authorization
app.get('/api/users/:userId/data',
  authMiddleware.requireAuth(),
  authMiddleware.authorize(async (authContext, req) => {
    return authContext.userId === req.params.userId || 
           authContext.roles.includes('admin');
  }),
  (req, res) => {
    res.json({ data: 'User data' });
  }
);

// Rate limiting
app.post('/api/auth/login',
  authMiddleware.rateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  async (req, res) => {
    // Login logic
  }
);
```

## Core Components

### JWT Provider

Manages access and refresh tokens with comprehensive security features.

```typescript
// Create access token
const accessToken = await jwtProvider.createAccessToken({
  userId: 'user123',
  sessionId: 'session456',
  roles: ['user'],
  permissions: ['read', 'write'],
  userData: { email: 'user@example.com' }
});

// Create refresh token
const refreshToken = await jwtProvider.createRefreshToken('user123', 'session456');

// Verify tokens
const payload = await jwtProvider.verifyAccessToken(accessToken);
const refreshData = await jwtProvider.verifyRefreshToken(refreshToken);

// Refresh tokens
const newTokens = await jwtProvider.refreshTokens(refreshToken, {
  userData: { email: 'user@example.com' },
  roles: ['user'],
  permissions: ['read', 'write']
});

// Blacklist tokens
await jwtProvider.blacklistToken(accessToken);
await jwtProvider.blacklistUserTokens('user123');
```

For more detailed documentation, examples, and API reference, see the full documentation in the package.

## Building

Run `nx build auth` to build the library.

## Running unit tests

Run `nx test auth` to execute the unit tests via [Jest](https://jestjs.io).
