import inquirer from 'inquirer';
const chalk = require('chalk');
import ora from 'ora';
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';
import { MigrationManager } from '../utils/migration-manager.js';
import { TemplateEngine } from '../utils/template-engine.js';

interface MigrationOptions {
  env?: string;
  steps?: string | number;
  force?: boolean;
}

export const migrationCommands = {
  async create(name: string) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Creating migration...').start();

      // Generate timestamp
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
      const migrationName = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;

      // Generate migration file
      const templateEngine = new TemplateEngine();
      const migrationConfig = {
        name: migrationName,
        displayName: name,
        project: projectInfo
      };

      await templateEngine.generateMigration(migrationConfig);

      spinner.succeed(`Migration ${migrationName} created successfully`);

      logger.info(`\nGenerated file:`);
      logger.info(`  - migrations/${migrationName}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      logger.info(`\nNext steps:`);
      logger.info(`  - Edit the migration file to define your database changes`);
      logger.info(`  - Run: thrilled migrate up`);

    } catch (error) {
      logger.error('Failed to create migration:', error);
      process.exit(1);
    }
  },

  async up(options: MigrationOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const steps = options.steps ? parseInt(options.steps.toString()) : undefined;
      
      const spinner = ora(`Running migrations for ${env} environment...`).start();

      const migrationManager = new MigrationManager(env);
      const result = await migrationManager.up(steps);

      if (result.migrations.length === 0) {
        spinner.succeed('No pending migrations to run');
      } else {
        spinner.succeed(`Ran ${result.migrations.length} migration(s)`);
        logger.info(`\nMigrations executed:`);
        result.migrations.forEach(migration => {
          logger.info(`  ✓ ${migration}`);
        });
      }

    } catch (error) {
      logger.error('Failed to run migrations:', error);
      process.exit(1);
    }
  },

  async down(options: MigrationOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const steps = options.steps ? parseInt(options.steps.toString()) : 1;

      // Confirmation prompt
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to rollback ${steps} migration(s) for ${env} environment?`,
          default: false
        }
      ]);

      if (!answers.confirm) {
        logger.info('Migration rollback cancelled');
        return;
      }

      const spinner = ora(`Rolling back migrations for ${env} environment...`).start();

      const migrationManager = new MigrationManager(env);
      const result = await migrationManager.down(steps);

      if (result.migrations.length === 0) {
        spinner.succeed('No migrations to rollback');
      } else {
        spinner.succeed(`Rolled back ${result.migrations.length} migration(s)`);
        logger.info(`\nMigrations rolled back:`);
        result.migrations.forEach(migration => {
          logger.info(`  ✓ ${migration}`);
        });
      }

    } catch (error) {
      logger.error('Failed to rollback migrations:', error);
      process.exit(1);
    }
  },

  async status(options: MigrationOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const spinner = ora(`Checking migration status for ${env} environment...`).start();

      const migrationManager = new MigrationManager(env);
      const status = await migrationManager.status();

      spinner.succeed(`Migration status for ${env} environment`);

      if (status.pending.length === 0 && status.executed.length === 0) {
        logger.info('\nNo migrations found');
        return;
      }

      if (status.executed.length > 0) {
        logger.info(`\n${chalk.green('Executed migrations:')}`);
        status.executed.forEach(migration => {
          logger.info(`  ✓ ${migration.name} (${migration.executedAt})`);
        });
      }

      if (status.pending.length > 0) {
        logger.info(`\n${chalk.yellow('Pending migrations:')}`);
        status.pending.forEach(migration => {
          logger.info(`  ○ ${migration}`);
        });
      } else {
        logger.info(`\n${chalk.green('All migrations are up to date')}`);
      }

    } catch (error) {
      logger.error('Failed to check migration status:', error);
      process.exit(1);
    }
  },

  async refresh(options: MigrationOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';

      // Confirmation prompt
      if (!options.force) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to refresh migrations for ${env} environment? This will rollback all migrations and re-run them.`,
            default: false
          }
        ]);

        if (!answers.confirm) {
          logger.info('Migration refresh cancelled');
          return;
        }
      }

      const spinner = ora(`Refreshing migrations for ${env} environment...`).start();

      const migrationManager = new MigrationManager(env);
      
      // Rollback all migrations
      spinner.text = 'Rolling back all migrations...';
      await migrationManager.reset();
      
      // Re-run all migrations
      spinner.text = 'Re-running all migrations...';
      const result = await migrationManager.up();

      spinner.succeed(`Migration refresh complete for ${env} environment`);

      if (result.migrations.length > 0) {
        logger.info(`\nMigrations executed:`);
        result.migrations.forEach(migration => {
          logger.info(`  ✓ ${migration}`);
        });
      }

    } catch (error) {
      logger.error('Failed to refresh migrations:', error);
      process.exit(1);
    }
  }
};
