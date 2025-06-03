import { DatabaseManager, MigrationRunner } from '../../src';
import { developmentConfig } from '../config/development';
import { createLogger } from '../utils/logger';

/**
 * Migration usage example showing how to manage database schema changes
 */

async function migrationExample() {
  console.log('=== Migration Usage Example ===\n');

  const logger = createLogger('MigrationExample');

  // 1. Initialize the database manager
  const dbManager = new DatabaseManager(developmentConfig, logger);
  await dbManager.initialize();

  // 2. Initialize migration runner
  const migrationRunner = new MigrationRunner(
    dbManager.getConnection(), // Get the default connection
    {
      directory: './examples/migrations',
      tableName: 'example_migrations',
    },
    logger
  );

  try {
    // 3. Check migration status
    console.log('📊 Checking migration status...');
    const status = await migrationRunner.getStatus();
    console.log(`Applied migrations: ${status.applied.length}`);
    status.applied.forEach(migration => {
      console.log(`- ${migration.name} (${migration.appliedAt})`);
    });

    // 4. Run pending migrations
    console.log('\n⬆️  Running pending migrations...');
    console.log(`Found ${status.pending.length} pending migrations`);
    if (status.pending.length > 0) {
      await migrationRunner.runMigrations();
      console.log(`Applied ${status.pending.length} migrations:`);
      status.pending.forEach(migration => {
        console.log(`- ${migration}`);
      });
    } else {
      console.log('No pending migrations to apply');
    }

    // 5. Example: Show rollback functionality (commented out for safety)
    console.log('\n⬇️  Rollback example (showing functionality)...');
    console.log('Note: Rollback would use migrationRunner.rollbackTo(targetVersion)');
    console.log('This example skips actual rollback for safety');
    
    // Example of how rollback would work:
    // const firstMigration = status.applied[0]; // Get first applied migration
    // if (firstMigration) {
    //   await migrationRunner.rollbackTo(firstMigration.version);
    //   console.log(`Rolled back to version: ${firstMigration.version}`);
    // }

    // 6. Check final status
    console.log('\n📋 Final migration status...');
    const finalStatus = await migrationRunner.getStatus();
    console.log(`Total applied migrations: ${finalStatus.applied.length}`);
    console.log(`Total pending migrations: ${finalStatus.pending.length}`);
    console.log(`Total migrations: ${finalStatus.total}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    // 7. Cleanup
    console.log('\n🧹 Cleaning up...');
    await dbManager.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  migrationExample().catch(console.error);
}

export { migrationExample };
