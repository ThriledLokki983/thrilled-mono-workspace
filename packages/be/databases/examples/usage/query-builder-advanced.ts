import { DatabaseManager } from '../../src';
import { developmentConfig } from '../config/development';
import { createLogger } from '../utils/logger';

/**
 * Advanced QueryBuilder usage examples
 */

async function queryBuilderExamples() {
  console.log('=== Advanced QueryBuilder Examples ===\n');

  const logger = createLogger('QueryBuilderExample');
  const dbManager = new DatabaseManager(developmentConfig, logger);
  await dbManager.initialize();

  const qb = dbManager.query_builder();

  try {
    // 1. Complex SELECT with JOINs
    console.log('1. Complex SELECT with JOINs:');
    const complexSelect = await qb
      .select([
        'u.id',
        'u.email',
        'u.name',
        'up.preference_key',
        'up.preference_value',
      ])
      .from('users u')
      .leftJoin('user_preferences up', 'u.id = up.user_id')
      .where('u.is_active = $1', true)
      .where('u.created_at > $2', new Date('2024-01-01'))
      .orderBy('u.created_at', 'DESC')
      .limit(20)
      .execute();

    console.log('Query executed successfully, rows:', complexSelect.rowCount);
    console.log();

    // 2. INSERT with returning
    console.log('2. INSERT with RETURNING:');
    const insertResult = await qb
      .insert()
      .into('users')
      .values({
        email: 'newuser@example.com',
        name: 'New User',
        first_name: 'New',
        last_name: 'User',
        role: 'user',
      })
      .returning(['id', 'email', 'created_at'])
      .execute();

    console.log('Insert executed successfully, rows:', insertResult.rowCount);
    console.log();

    // 3. Batch INSERT
    console.log('3. Batch INSERT:');
    const batchInsertResult = await qb
      .insert()
      .into('user_preferences')
      .values([
        { user_id: 1, preference_key: 'theme', preference_value: 'dark' },
        { user_id: 1, preference_key: 'language', preference_value: 'en' },
        { user_id: 2, preference_key: 'theme', preference_value: 'light' },
      ])
      .execute();

    console.log(
      'Batch insert executed successfully, rows:',
      batchInsertResult.rowCount
    );
    console.log();

    // 4. UPDATE with conditions
    console.log('4. UPDATE with conditions:');
    const updateResult = await qb
      .update()
      .table('users')
      .set({
        last_name: 'Updated',
        updated_at: new Date(),
      })
      .where('id = $1', 123)
      .execute();

    console.log('Update executed successfully, rows:', updateResult.rowCount);
    console.log();

    // 5. DELETE with conditions
    console.log('5. DELETE with conditions:');
    const deleteResult = await qb
      .delete()
      .from('user_preferences')
      .where('user_id = $1', 123)
      .where('preference_key = $2', 'old_setting')
      .execute();

    console.log('Delete executed successfully, rows:', deleteResult.rowCount);
    console.log();

    // 6. Raw query example
    console.log('6. Raw query example:');
    const rawResult = await qb.raw(
      'SELECT * FROM users WHERE id IN (SELECT user_id FROM user_preferences WHERE preference_key = $1)',
      ['theme']
    );

    console.log('Raw query executed successfully, rows:', rawResult.rowCount);
    console.log();
  } catch (error) {
    console.error('Query builder error:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await dbManager.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  queryBuilderExamples().catch(console.error);
}

export { queryBuilderExamples };
