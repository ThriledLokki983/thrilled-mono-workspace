# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Nx monorepo called "Thrilled" with a multi-application architecture containing backend and frontend applications with shared packages.

### Architecture Structure

- **apps/be/** - Backend applications
  - **base/** - Main Express.js API server with PostgreSQL, JWT auth, and comprehensive middleware
  - **faithcircle/** - Secondary backend service
- **apps/fe/** - Frontend applications
  - **faithcircle-fe/** - React frontend application
- **packages/** - Shared libraries organized by scope
  - **be/** - Backend-specific packages
    - **core** (`@mono/be-core`) - Core backend framework with BaseApp, plugins, middleware
    - **be-types** (`@thrilled/be-types`) - Shared TypeScript types for backend
  - **fe/** - Frontend-specific packages
    - **components** (`@mono/components`) - Shared React components
    - **styles** (`@mono/styles`) - Shared styling system
  - **shared/** - Cross-platform packages
    - **custom-eslint** (`@mono/custom-eslint`) - ESLint configuration
    - **types** - Shared TypeScript types

### Core Backend Architecture

The base backend uses a plugin-based architecture built on `@mono/be-core`:

- **BaseApp** - Core application class with plugin system
- **Plugins** - Modular functionality (Database, Routes, Swagger, RateLimit)
- **Middleware** - Security, Error handling, Validation
- **Controllers/Services/Routes** - Standard MVC pattern with TypeDI dependency injection

## Development Commands

### Global Commands (run from root)

```bash
# Build all projects
npx nx run-many -t build

# Run tests across all projects
npx nx run-many -t test

# Lint all projects
npx nx run-many -t lint

# Typecheck all projects
npx nx run-many -t typecheck

# Visual project graph
npx nx graph

# Sync TypeScript project references
npx nx sync
```

### Backend Development (apps/be/base)

```bash
# Development server
npx nx dev base-be

# Build
npx nx build base-be

# Production start
npx nx start base-be

# Tests
npx nx test base-be

# Lint
npx nx lint base-be

# Lint with auto-fix
npx nx lint:fix base-be

# TypeScript type checking
npx nx typecheck base-be

# Database migrations
npx nx migrate:create base-be    # Create new migration
npx nx migrate:up base-be        # Run migrations
npx nx migrate:down base-be      # Rollback migration
npx nx migrate:status base-be    # Check migration status

# Environment check
npx nx check-env base-be

# Production deployment
npx nx deploy:prod base-be       # Deploy with PM2
npx nx deploy:dev base-be        # Deploy development
```

### Frontend Development (apps/fe/faithcircle-fe)

```bash
# Development server
npx nx dev faithcircle-fe

# Build
npx nx build faithcircle-fe

# Tests
npx nx test faithcircle-fe

# End-to-end tests
npx nx e2e faithcircle-fe-e2e

# Lint
npx nx lint faithcircle-fe
```

### Package Development

```bash
# Build specific package
npx nx build core                # Backend core package
npx nx build be-types           # Backend types
npx nx build databases          # Database management package
npx nx build components         # Frontend components

# Test specific package
npx nx test core
npx nx test databases
```

### Database Package Development (`@thrilled/databases`)

```bash
# Build the database package
npx nx build databases

# Run tests
npx nx test databases

# Lint
npx nx lint databases

# Run examples
npx ts-node packages/be/databases/examples/usage/basic-usage.ts
npx ts-node packages/be/databases/examples/usage/migration-example.ts
```

## Important Notes

### Module Boundaries

The project enforces strict module boundaries via ESLint:

- Apps can only depend on libs, utils, and shared packages
- Libs can depend on other libs, utils, and shared packages
- Utils can only depend on other utils and shared packages
- Scope-specific dependencies (be/fe packages can't cross-reference)

### Backend Configuration

- Uses environment-based configuration with `envalid` validation
- PostgreSQL database with migrations via `node-pg-migrate`
- Redis for caching and rate limiting
- JWT authentication with blacklist support
- Comprehensive logging with Winston (file rotation)
- Swagger documentation auto-generated

### Testing Strategy

- Jest for backend unit/integration tests
- Vitest for frontend and packages
- Playwright for e2e testing
- Tests run with dependency graph awareness

### Build System

- SWC for fast compilation (backend)
- Vite for frontend bundling
- TypeScript project references for optimal builds
- Nx caching and distributed execution

## Environment Setup

Backend applications require:

- `.env` file with PostgreSQL connection details
- Redis server for caching
- Node.js environment variables for JWT secrets

Use `npx nx check-env base-be` to verify database configuration.

### Database Package (`@thrilled/databases`)

A comprehensive database management package providing:

- **Multi-database Support** - Connect to multiple PostgreSQL databases
- **Connection Pooling** - Optimized connection management with health monitoring
- **Transaction Management** - Safe transaction handling with automatic rollback
- **Query Builder** - Type-safe SQL query construction
- **Migration System** - Database schema versioning with rollback support
- **Redis Caching** - Advanced caching with TTL and pattern matching
- **Health Monitoring** - Real-time connection and cache status
- **Auto Database Creation** - Automatically create databases if they don't exist

**Key Files:**

- `packages/be/databases/` - Main package directory
- `packages/be/databases/src/managers/DatabaseManager.ts` - Core database manager
- `packages/be/databases/src/builders/QueryBuilder.ts` - SQL query builder
- `packages/be/databases/src/cache/CacheManager.ts` - Redis cache manager
- `packages/be/databases/src/migrations/MigrationRunner.ts` - Migration system
- `packages/be/databases/examples/` - Usage examples and configuration templates
- `packages/be/databases/INTEGRATION.md` - Integration guide
