import { DatabaseManager, QueryBuilder, CacheManager } from '../../src';
import { developmentConfig } from '../config/development';
import { createLogger } from '../utils/logger';

/**
 * Basic usage example showing how to set up and use the database package
 */

async function basicUsageExample() {
  console.log('=== Basic Database Usage Example ===\n');

  const logger = createLogger('BasicUsageExample');

  // 1. Initialize the database manager
  const dbManager = new DatabaseManager(developmentConfig, logger);
  await dbManager.initialize();

  // 2. Initialize cache manager
  const cacheManager = new CacheManager(developmentConfig.cache!, logger);
  await cacheManager.initialize();

  try {
    // 3. Basic query using the database manager
    console.log('📝 Running basic query...');
    const result = await dbManager.query('SELECT NOW() as current_time');
    console.log('Current time:', result.rows[0].current_time);

    // 4. Using the QueryBuilder for type-safe queries
    console.log('\n🔧 Using QueryBuilder...');
    const queryBuilder = dbManager.query_builder();

    // Build a SELECT query
    const selectQuery = queryBuilder
      .select(['id', 'email', 'name'])
      .from('users')
      .where('is_active = $1', [true])
      .orderBy('created_at', 'DESC')
      .limit(10);

    const builtQuery = await selectQuery.execute();
    console.log('Query executed successfully');

    // 5. Cache operations
    console.log('\n💾 Using Cache...');
    await cacheManager.set('user:123', { id: 123, name: 'John Doe' }, 3600);
    const cachedUser = await cacheManager.get('user:123');
    console.log('Cached user:', cachedUser);

    // 6. Transaction example
    console.log('\n🔄 Running transaction...');
    const transactionResult = await dbManager.withTransaction(
      async (client) => {
        // Multiple operations in a single transaction
        await client.query(
          'INSERT INTO users (email, name, first_name, last_name) VALUES ($1, $2, $3, $4)',
          ['test@example.com', 'Test User', 'Test', 'User']
        );

        const user = await client.query(
          'SELECT * FROM users WHERE email = $1',
          ['test@example.com']
        );
        return user.rows[0];
      }
    );

    console.log('Transaction completed:', transactionResult);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 7. Cleanup
    console.log('\n🧹 Cleaning up...');
    await cacheManager.close();
    await dbManager.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };
