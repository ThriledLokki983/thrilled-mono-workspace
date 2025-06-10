const inquirer = require('inquirer');
const ora = require('ora');
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';
import { DatabaseConfig } from '../utils/database-config.js';

interface DatabaseOptions {
  env?: string;
  force?: boolean;
  seeder?: string;
}

export const databaseCommands = {
  async create(options: DatabaseOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const spinner = ora(`Creating database for ${env} environment...`).start();

      const dbConfig = await DatabaseConfig.load(env);
      await dbConfig.createDatabase();

      spinner.succeed(`Database created for ${env} environment`);

    } catch (error) {
      logger.error('Failed to create database:', error);
      process.exit(1);
    }
  },

  async drop(options: DatabaseOptions = {}) {
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
            message: `Are you sure you want to drop the database for ${env} environment?`,
            default: false
          }
        ]);

        if (!answers.confirm) {
          logger.info('Database drop cancelled');
          return;
        }
      }

      const spinner = ora(`Dropping database for ${env} environment...`).start();

      const dbConfig = await DatabaseConfig.load(env);
      await dbConfig.dropDatabase();

      spinner.succeed(`Database dropped for ${env} environment`);

    } catch (error) {
      logger.error('Failed to drop database:', error);
      process.exit(1);
    }
  },

  async reset(options: DatabaseOptions = {}) {
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
            message: `Are you sure you want to reset the database for ${env} environment? This will drop and recreate the database.`,
            default: false
          }
        ]);

        if (!answers.confirm) {
          logger.info('Database reset cancelled');
          return;
        }
      }

      const spinner = ora(`Resetting database for ${env} environment...`).start();

      const dbConfig = await DatabaseConfig.load(env);
      
      // Drop database
      spinner.text = 'Dropping database...';
      await dbConfig.dropDatabase();
      
      // Create database
      spinner.text = 'Creating database...';
      await dbConfig.createDatabase();

      // Run migrations
      spinner.text = 'Running migrations...';
      await dbConfig.runMigrations();

      spinner.succeed(`Database reset complete for ${env} environment`);

    } catch (error) {
      logger.error('Failed to reset database:', error);
      process.exit(1);
    }
  },

  async seed(options: DatabaseOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const spinner = ora(`Running seeders for ${env} environment...`).start();

      const dbConfig = await DatabaseConfig.load(env);
      
      if (options.seeder) {
        await dbConfig.runSeeder(options.seeder);
        spinner.succeed(`Seeder ${options.seeder} completed for ${env} environment`);
      } else {
        await dbConfig.runSeeders();
        spinner.succeed(`All seeders completed for ${env} environment`);
      }

    } catch (error) {
      logger.error('Failed to run seeders:', error);
      process.exit(1);
    }
  }
};
