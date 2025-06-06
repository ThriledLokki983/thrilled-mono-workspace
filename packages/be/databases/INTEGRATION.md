# Database Package Integration Guide

This guide shows how to integrate the `@thrilled/databases` package into your backend applications within the Nx workspace.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Plugin Integration](#plugin-integration)
- [Usage Examples](#usage-examples)
- [Migration Management](#migration-management)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Install Dependencies

```bash
# Add the package to your application
yarn add @thrilled/databases

# Install peer dependencies if not already installed
yarn add pg redis ioredis
yarn add -D @types/pg
```

### 2. Basic Setup

```typescript
import { DatabaseManager, CacheManager } from '@thrilled/databases';
import { DatabaseManagerConfig } from '@thrilled/be-types';

const config: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'your_db',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      pool: { min: 2, max: 10 },
    },
  },
  default: 'primary',
  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    keyPrefix: 'myapp:',
    ttl: 3600,
  },
};

const dbManager = new DatabaseManager(config);
const cacheManager = new CacheManager(config.cache!);

// Initialize
await dbManager.initialize();
await cacheManager.initialize();
```

## Configuration

### Environment Variables

Create a `.env` file in your application root:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=your_database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### Configuration Files

Create environment-specific configuration files:

```typescript
// config/database.ts
import { DatabaseManagerConfig } from '@thrilled/be-types';

export const databaseConfig: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: process.env.POSTGRES_HOST!,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB!,
      username: process.env.POSTGRES_USER!,
      password: process.env.POSTGRES_PASSWORD!,
      ssl: process.env.NODE_ENV === 'production',
      pool: {
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    }
  },
  default: 'primary',
  migrations: {
    directory: './migrations',
    tableName: 'migrations',
  },
  autoCreateDatabase: process.env.NODE_ENV === 'development',
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
  },
  cache: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: \`\${process.env.APP_NAME || 'app'}:\`,
    ttl: 3600,
    maxRetries: 3,
    retryDelay: 1000,
  }
};
```

## Plugin Integration

For applications using `@mono/be-core`, create a database plugin:

```typescript
// plugins/database.plugin.ts
import { BasePlugin } from '@mono/be-core';
import { Express } from 'express';
import {
  DatabaseManager,
  CacheManager,
  MigrationRunner,
} from '@thrilled/databases';
import { databaseConfig } from '../config/database';

export class DatabasePlugin extends BasePlugin {
  readonly name = 'database';
  readonly version = '1.0.0';

  private dbManager?: DatabaseManager;
  private cacheManager?: CacheManager;

  protected async setup(): Promise<void> {
    this.logger.info('Initializing database plugin...');

    // Initialize database manager
    this.dbManager = new DatabaseManager(databaseConfig);
    await this.dbManager.initialize();

    // Initialize cache manager
    if (databaseConfig.cache) {
      this.cacheManager = new CacheManager(databaseConfig.cache);
      await this.cacheManager.initialize();
    }

    // Run migrations
    if (databaseConfig.migrations) {
      const migrationRunner = new MigrationRunner(
        this.dbManager.getConnection(),
        databaseConfig.migrations
      );
      await migrationRunner.up();
    }

    this.logger.info('Database plugin initialized');
  }

  protected registerMiddleware(app: Express): void {
    // Add database and cache to request context
    app.use((req, res, next) => {
      (req as any).db = this.dbManager;
      (req as any).cache = this.cacheManager;
      next();
    });

    // Health check endpoint
    app.get('/health/database', async (req, res) => {
      try {
        const health = await this.dbManager?.getHealth();
        res.json({ status: 'ok', health });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  protected async teardown(): Promise<void> {
    if (this.cacheManager) await this.cacheManager.disconnect();
    if (this.dbManager) await this.dbManager.disconnect();
  }

  // Getters for accessing services
  get database() {
    return this.dbManager;
  }
  get cache() {
    return this.cacheManager;
  }
}
```

Register the plugin in your application:

```typescript
// app.ts
import { BaseApp } from '@mono/be-core';
import { DatabasePlugin } from './plugins/database.plugin';

const app = new BaseApp({
  name: 'Your App',
  port: 3000,
});

// Register plugins
app.use(new DatabasePlugin());

// Start the application
await app.start();
```

## Usage Examples

### Basic Database Operations

```typescript
// In your controllers or services
import { QueryBuilder } from '@thrilled/databases';

export class UserService {
  constructor(
    private db: DatabaseManager,
    private cache: CacheManager
  ) {}

  async createUser(userData: CreateUserDto) {
    const qb = new QueryBuilder();

    const query = qb
      .insert('users')
      .values(userData)
      .returning(['id', 'email', 'created_at'])
      .build();

    const result = await this.db.query(query.query, query.params);
    return result.rows[0];
  }

  async getUserById(id: number) {
    // Try cache first
    const cacheKey = \`user:\${id}\`;
    let user = await this.cache.get(cacheKey);

    if (!user) {
      const qb = new QueryBuilder();
      const query = qb
        .select(['*'])
        .from('users')
        .where('id = $1', [id])
        .where('deleted_at IS NULL')
        .build();

      const result = await this.db.query(query.query, query.params);
      user = result.rows[0];

      if (user) {
        await this.cache.set(cacheKey, user, 3600); // Cache for 1 hour
      }
    }

    return user;
  }

  async updateUser(id: number, updates: UpdateUserDto) {
    const result = await this.db.transaction(async (client) => {
      const qb = new QueryBuilder();

      // Update user
      const updateQuery = qb
        .update('users')
        .set({ ...updates, updated_at: new Date() })
        .where('id = $1', [id])
        .returning(['*'])
        .build();

      const userResult = await client.query(updateQuery.query, updateQuery.params);

      // Log the update
      await client.query(
        'INSERT INTO user_audit_log (user_id, action, changes) VALUES ($1, $2, $3)',
        [id, 'update', JSON.stringify(updates)]
      );

      return userResult.rows[0];
    });

    // Invalidate cache
    await this.cache.del(\`user:\${id}\`);

    return result;
  }
}
```

### Advanced Query Building

```typescript
export class OrderService {
  constructor(private db: DatabaseManager) {}

  async getOrdersWithDetails(filters: OrderFilters) {
    const qb = new QueryBuilder();

    let query = qb
      .select([
        'o.id',
        'o.order_number',
        'o.total_amount',
        'o.status',
        'o.created_at',
        'u.email as customer_email',
        'u.name as customer_name',
        'COUNT(oi.id) as item_count',
      ])
      .from('orders o')
      .innerJoin('users u', 'o.user_id = u.id')
      .leftJoin('order_items oi', 'o.id = oi.order_id')
      .groupBy(['o.id', 'u.email', 'u.name']);

    // Apply filters dynamically
    if (filters.status) {
      query = query.where('o.status = $?', [filters.status]);
    }

    if (filters.dateFrom) {
      query = query.where('o.created_at >= $?', [filters.dateFrom]);
    }

    if (filters.dateTo) {
      query = query.where('o.created_at <= $?', [filters.dateTo]);
    }

    query = query
      .orderBy('o.created_at', 'DESC')
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    const builtQuery = query.build();
    const result = await this.db.query(builtQuery.query, builtQuery.params);

    return result.rows;
  }
}
```

## Migration Management

### Creating Migrations

1. Create migration files in your `migrations/` directory:

```sql
-- migrations/2024-06-03-120000_create_users_table.sql

-- UP
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- DOWN
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

2. Run migrations programmatically:

```typescript
import { MigrationRunner } from '@thrilled/databases';

const migrationRunner = new MigrationRunner(
  dbManager.getConnection(),
  { directory: './migrations', tableName: 'migrations' }
);

// Apply all pending migrations
await migrationRunner.up();

// Check status
const status = await migrationRunner.getStatus();
console.log(\`Applied \${status.length} migrations\`);
```

### Migration Commands (package.json)

Add these scripts to your application's `package.json`:

```json
{
  "scripts": {
    "migrate:up": "ts-node scripts/migrate-up.ts",
    "migrate:down": "ts-node scripts/migrate-down.ts",
    "migrate:status": "ts-node scripts/migrate-status.ts"
  }
}
```

Create corresponding script files:

```typescript
// scripts/migrate-up.ts
import { DatabaseManager, MigrationRunner } from '@thrilled/databases';
import { databaseConfig } from '../src/config/database';

async function runMigrations() {
  const dbManager = new DatabaseManager(databaseConfig);
  await dbManager.initialize();

  const migrationRunner = new MigrationRunner(
    dbManager.getConnection(),
    databaseConfig.migrations!
  );

  const applied = await migrationRunner.up();
  console.log(\`Applied \${applied.length} migrations\`);

  await dbManager.disconnect();
}

runMigrations().catch(console.error);
```

## Best Practices

### 1. Connection Management

- Always call `disconnect()` when shutting down your application
- Use connection pooling appropriately for your load
- Monitor connection pool metrics

### 2. Error Handling

```typescript
try {
  const result = await db.transaction(async (client) => {
    // Your database operations
  });
} catch (error) {
  logger.error('Database operation failed', { error });
  throw new DatabaseError('Operation failed', error);
}
```

### 3. Caching Strategy

```typescript
// Use appropriate TTL values
const SHORT_TTL = 300;    // 5 minutes
const MEDIUM_TTL = 3600;  // 1 hour
const LONG_TTL = 86400;   // 24 hours

// Cache invalidation patterns
await cache.del(\`user:\${userId}\`);
await cache.del(\`user:\${userId}:*\`); // Pattern deletion
```

### 4. Query Optimization

- Use indexes appropriately
- Avoid N+1 queries
- Use JOINs instead of multiple queries when possible
- Implement pagination for large result sets

### 5. Migration Best Practices

- Always include both UP and DOWN sections
- Make migrations idempotent
- Test migrations on a copy of production data
- Keep migrations small and focused

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   ```
   Error: Connection timeout
   ```

   - Check database server status
   - Verify network connectivity
   - Increase connectionTimeoutMillis in pool config

2. **Pool Exhaustion**

   ```
   Error: Pool connection limit reached
   ```

   - Increase pool.max setting
   - Check for connection leaks
   - Ensure connections are properly released

3. **Migration Failures**

   ```
   Error: Migration already applied
   ```

   - Check migration table status
   - Verify migration file checksums
   - Use `migrate:status` to inspect current state

4. **Cache Connection Issues**
   ```
   Error: Redis connection failed
   ```
   - Verify Redis server is running
   - Check Redis credentials
   - Ensure network connectivity

### Debug Mode

Enable debug logging:

```typescript
const config: DatabaseManagerConfig = {
  // ... other config
  debug: process.env.NODE_ENV === 'development',
};
```

### Health Checks

Monitor your database health:

```typescript
// Regular health checks
setInterval(async () => {
  const health = await dbManager.getHealth();
  if (health.status !== 'healthy') {
    logger.warn('Database health check failed', { health });
  }
}, 30000);
```

## Additional Resources

- [Database Package README](../README.md)
- [Type Definitions](../../be-types/src/database.ts)
- [Example Usage](../examples/usage/)
- [Migration Examples](../examples/migrations/)
