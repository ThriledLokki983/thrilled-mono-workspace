# Database Directory - DEPRECATED

⚠️ **This directory has been deprecated and is no longer used.**

## Migration Summary

The local database setup in this directory has been **consolidated** and replaced with the centralized database package `@thrilled/databases`.

### What Changed

1. **Local Database Removed**: The `index.ts` file containing local PostgreSQL pool setup has been removed.

2. **Centralized Database**: The app now uses the centralized `DatabaseManager` from `@thrilled/databases` package through the `DatabasePlugin`.

3. **Test Files Updated**: All test files now use `DbHelper` from `@thrilled/databases` instead of the local database connection.

### How It Works Now

- **Database Connection**: Managed by `DatabasePlugin` using `DatabaseManager` from `@thrilled/databases`
- **Database Operations**: Use `DbHelper` static methods for queries and transactions
- **Migrations**: Handled by the centralized `MigrationRunner`
- **Health Checks**: Automated health monitoring through the centralized system

### Benefits

- ✅ **Centralized Management**: Single source of truth for database operations
- ✅ **Consistent Configuration**: Standardized across all applications
- ✅ **Enhanced Features**: Built-in health checks, caching, query building
- ✅ **Better Error Handling**: Robust error handling and logging
- ✅ **TypeScript Support**: Full type safety for database operations

### Integration Points

- **Plugin**: `src/plugins/database.plugin.ts` - Initializes centralized database
- **Container**: Services use TypeDI container to access database components
- **Tests**: Use `DbHelper` for database operations in test suites

## Removal Date

**January 2025** - Consolidated during the Authentication and Redis middleware consolidation project.

For questions about database operations, refer to:
- `packages/be/databases/README.md`
- `packages/be/databases/INTEGRATION.md`
