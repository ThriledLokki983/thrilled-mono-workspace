# @thrilled/databases

A comprehensive database management package for all the backend applications in this workspace with PostgreSQL connection pooling, transaction management, query building, migrations, and Redis caching.

## Features

- 🚀 **Multi-database Support** - Connect to multiple PostgreSQL databases
- 🔄 **Connection Pooling** - Optimized connection management with health monitoring
- 🛡️ **Transaction Management** - Safe transaction handling with automatic rollback
- 🏗️ **Query Builder** - Type-safe SQL query construction
- 📋 **Migration System** - Database schema versioning with rollback support
- 💾 **Redis Caching** - Advanced caching with TTL and pattern matching
- 🔍 **Health Monitoring** - Real-time connection and cache status
- 🛠️ **Auto Database Creation** - Automatically create databases if they don't exist

## Installation

```bash
yarn add @mono/database
```

## Quick Start

👋 **New to the package?** Check out the [Integration Guide](./INTEGRATION.md) for step-by-step setup instructions!

### Basic Setup

```typescript
import { DatabaseManager } from '@thrilled/databases';
import { DatabaseManagerConfig } from '@thrilled/be-types';

const config: DatabaseManagerConfig = {
  connections: {
    primary: {
      host: 'localhost',
      port: 5432,
      database: 'myapp',
      username: 'postgres',
      password: 'password',
    },
  },
  default: 'primary',
  autoCreateDatabase: true,
  healthCheck: {
    enabled: true,
    interval: 30000,
  },
  cache: {
    host: 'localhost',
    port: 6379,
    keyPrefix: 'myapp:',
  },
};

const logger = new Logger();
const dbManager = new DatabaseManager(config, logger);

// Initialize the database manager
await dbManager.initialize();
```

### Query Builder Usage

```typescript
// Get query builder
const qb = dbManager.query_builder();

// SELECT query
const users = await qb
  .select(['id', 'name', 'email'])
  .from('users')
  .where('active = ?', true)
  .orderBy('created_at', 'DESC')
  .limit(10)
  .execute();

// INSERT query
const newUser = await qb
  .insert()
  .into('users')
  .values({
    name: 'John Doe',
    email: 'john@example.com',
    active: true,
  })
  .returning(['id', 'created_at'])
  .execute();

// UPDATE query
await qb
  .update()
  .table('users')
  .set({ last_login: new Date() })
  .where('id = ?', userId)
  .execute();

// DELETE query
await qb
  .delete()
  .from('users')
  .where('active = ? AND last_login < ?', false, thirtyDaysAgo)
  .execute();
```

### Transaction Management

```typescript
// Execute operations within a transaction
const result = await dbManager.withTransaction(async (client) => {
  // All operations here are in the same transaction
  const user = await client.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING id',
    ['John']
  );
  const profile = await client.query(
    'INSERT INTO profiles (user_id, bio) VALUES ($1, $2)',
    [user.rows[0].id, 'Bio']
  );

  return { user: user.rows[0], profile: profile.rows[0] };
});
```

### Migrations

```typescript
// Run pending migrations
await dbManager.runMigrations();

// Check migration status
const status = await dbManager.migrationRunner.getStatus();
console.log('Applied:', status.applied.length);
console.log('Pending:', status.pending.length);

// Create new migration
await dbManager.migrationRunner.createMigration('create_users_table', {
  up: `
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `,
  down: `DROP TABLE users;`,
});
```

### Caching

```typescript
const cache = dbManager.getCache();

// Basic cache operations
await cache.set('user:123', { name: 'John', email: 'john@example.com' }, 3600);
const user = await cache.get('user:123');
await cache.del('user:123');

// Multiple operations
await cache.mset(
  {
    'user:1': { name: 'John' },
    'user:2': { name: 'Jane' },
  },
  3600
);

const users = await cache.mget(['user:1', 'user:2']);

// Pattern matching
const userKeys = await cache.keys('user:*');

// Counters
const visits = await cache.incr('page:visits');
```

### Health Monitoring

```typescript
// Get overall health status
const health = await dbManager.getHealthCheck();
console.log('Status:', health.status); // 'healthy', 'degraded', or 'unhealthy'
console.log('Connections:', health.connections);
console.log('Cache:', health.cache);

// Get specific connection status
const connStatus = await dbManager.getConnectionStatus('default');
console.log('Connected:', connStatus.connected);
console.log('Pool stats:', connStatus.poolStats);
```

## Configuration

### Database Configuration

```typescript
interface DatabaseManagerConfig {
  connections: Record<string, DatabaseConnectionConfig>;
  default?: string; // Default connection name
  migrations?: MigrationConfig;
  autoCreateDatabase?: boolean; // Auto-create databases if they don't exist
  healthCheck?: {
    enabled?: boolean;
    interval?: number; // Health check interval in ms
    timeout?: number;
  };
  cache?: CacheConfig;
}

interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean | any;
  pool?: {
    min?: number; // Minimum connections in pool
    max?: number; // Maximum connections in pool
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}
```

### Cache Configuration

```typescript
interface CacheConfig {
  host?: string; // Redis host
  port?: number; // Redis port
  password?: string; // Redis password
  db?: number; // Redis database number
  keyPrefix?: string; // Prefix for all keys
  ttl?: number; // Default TTL in seconds
  maxRetries?: number;
  retryDelay?: number;
}
```

### Migration Configuration

```typescript
interface MigrationConfig {
  tableName?: string; // Migration tracking table name
  directory?: string; // Directory containing migration files
  schemaTable?: string;
}
```

## Migration Files

Migration files should be named with timestamps and descriptive names:

```
migrations/
  20240101120000_create_users_table.sql
  20240102130000_add_user_profiles.sql
  20240103140000_add_indexes.sql
```

Migration file format:

```sql
-- UP
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- DOWN
DROP TABLE users;
```

## Examples and Integration

### 📁 Example Files

The package includes comprehensive examples in the `examples/` directory:

- **Configuration Examples**

  - `examples/config/development.ts` - Development environment setup
  - `examples/config/production.ts` - Production environment setup
  - `examples/config/test.ts` - Test environment setup
  - `examples/.env.template` - Environment variables template

- **Migration Examples**

  - `examples/migrations/2024-01-15-120000_create_users_table.sql` - User table creation
  - `examples/migrations/2024-01-16-103000_add_user_preferences.sql` - Adding user preferences

- **Usage Examples**
  - `examples/usage/basic-usage.ts` - Basic database operations
  - `examples/usage/migration-example.ts` - Migration management
  - `examples/usage/plugin-integration.ts` - Integration with @mono/be-core
  - `examples/usage/query-builder-advanced.ts` - Advanced query building patterns

### 🚀 Quick Integration

For step-by-step integration instructions, see the [Integration Guide](./INTEGRATION.md).

```bash
# Copy example configuration
cp examples/config/development.ts src/config/database.ts
cp examples/.env.template .env

# Run example usage
npx ts-node examples/usage/basic-usage.ts
```

## API Reference

### DatabaseManager

- `initialize()` - Initialize all connections and services
- `connect(name?)` - Get or create a connection pool
- `query(text, params?, connectionName?)` - Execute a query
- `withTransaction(callback, connectionName?)` - Execute operations in a transaction
- `query_builder(connectionName?)` - Get a query builder instance
- `getCache()` - Get the cache manager
- `runMigrations(connectionName?)` - Run pending migrations
- `getHealthCheck()` - Get overall health status
- `getConnectionStatus(name)` - Get connection status
- `close()` - Close all connections and cleanup

### QueryBuilder

- `select(columns?)` - Create SELECT query
- `insert()` - Create INSERT query
- `update()` - Create UPDATE query
- `delete()` - Create DELETE query
- `raw(sql, params?)` - Execute raw SQL

### Query Methods

- `from(table)`, `into(table)`, `table(name)` - Set target table
- `where(condition, ...params)` - Add WHERE clause
- `join(table, condition)` - Add JOIN clause
- `orderBy(column, direction?)` - Add ORDER BY clause
- `groupBy(columns)` - Add GROUP BY clause
- `limit(count)` - Add LIMIT clause
- `returning(columns?)` - Add RETURNING clause
- `execute()` - Execute the query
- `toSQL()` - Get SQL and parameters

### CacheManager

- `get<T>(key)` - Get value from cache
- `set<T>(key, value, ttl?)` - Set value in cache
- `del(key)` - Delete value from cache
- `exists(key)` - Check if key exists
- `keys(pattern)` - Get keys matching pattern
- `mget<T>(keys)` - Get multiple values
- `mset(data, ttl?)` - Set multiple values
- `incr(key)` - Increment counter
- `expire(key, seconds)` - Set TTL for key

## Best Practices

1. **Connection Management**: Always use the connection pool instead of creating direct connections
2. **Transactions**: Use `withTransaction` for operations that need atomicity
3. **Query Building**: Use the query builder for complex queries to avoid SQL injection
4. **Migrations**: Always include both UP and DOWN scripts in migrations
5. **Caching**: Set appropriate TTL values and use key prefixes to avoid conflicts
6. **Error Handling**: Always handle database errors gracefully
7. **Health Monitoring**: Enable health checks in production environments

## Example App Integration

```typescript
import { BaseApp } from '@mono/be-core';
import { DatabaseManager } from '@mono/database';

class MyApp extends BaseApp {
  private dbManager: DatabaseManager;

  async initialize() {
    await super.initialize();

    // Initialize database
    this.dbManager = new DatabaseManager(this.config.database, this.logger);
    await this.dbManager.initialize();

    // Run migrations
    await this.dbManager.runMigrations();
  }

  getDatabaseManager() {
    return this.dbManager;
  }

  async shutdown() {
    await this.dbManager.close();
    await super.shutdown();
  }
}
```

## Contributing

Please read our [contributing guidelines](../../CONTRIBUTING.md) before submitting changes.

## License

MIT License - see [LICENSE](../../LICENSE) file for details.
