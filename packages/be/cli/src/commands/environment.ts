import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';
import { EnvironmentValidator } from '../utils/environment-validator.js';

interface EnvironmentOptions {
  env?: string;
}

export const environmentCommands = {
  async init(options: EnvironmentOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const envFile = `.env.${env}`;
      const envPath = path.join(process.cwd(), envFile);

      // Check if env file already exists
      if (await fs.pathExists(envPath)) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `${envFile} already exists. Do you want to overwrite it?`,
            default: false
          }
        ]);

        if (!answers.overwrite) {
          logger.info('Environment initialization cancelled');
          return;
        }
      }

      const spinner = ora(`Initializing ${env} environment...`).start();

      // Generate environment template
      const envTemplate = generateEnvironmentTemplate(projectInfo, env);
      
      // Write environment file
      await fs.writeFile(envPath, envTemplate);

      spinner.succeed(`Environment file ${envFile} created successfully`);

      logger.info(`\nNext steps:`);
      logger.info(`  1. Edit ${envFile} and configure your environment variables`);
      logger.info(`  2. Run: thrilled env validate --env ${env}`);
      logger.info(`\nImportant: Add ${envFile} to your .gitignore if it contains sensitive data`);

    } catch (error) {
      logger.error('Failed to initialize environment:', error);
      process.exit(1);
    }
  },

  async validate(options: EnvironmentOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'development';
      const spinner = ora(`Validating ${env} environment...`).start();

      const validator = new EnvironmentValidator();
      const result = await validator.validate(env);

      if (result.isValid) {
        spinner.succeed(`Environment ${env} is valid`);
        
        if (result.warnings.length > 0) {
          logger.warn(`\nWarnings:`);
          result.warnings.forEach(warning => {
            logger.warn(`  ⚠ ${warning}`);
          });
        }
      } else {
        spinner.fail(`Environment ${env} validation failed`);
        
        logger.error(`\nErrors:`);
        result.errors.forEach(error => {
          logger.error(`  ✗ ${error}`);
        });

        if (result.warnings.length > 0) {
          logger.warn(`\nWarnings:`);
          result.warnings.forEach(warning => {
            logger.warn(`  ⚠ ${warning}`);
          });
        }

        process.exit(1);
      }

    } catch (error) {
      logger.error('Failed to validate environment:', error);
      process.exit(1);
    }
  },

  async copy(from: string, to: string) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const fromFile = `.env.${from}`;
      const toFile = `.env.${to}`;
      const fromPath = path.join(process.cwd(), fromFile);
      const toPath = path.join(process.cwd(), toFile);

      // Check if source file exists
      if (!await fs.pathExists(fromPath)) {
        logger.error(`Source environment file ${fromFile} does not exist`);
        process.exit(1);
      }

      // Check if destination file exists
      if (await fs.pathExists(toPath)) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `${toFile} already exists. Do you want to overwrite it?`,
            default: false
          }
        ]);

        if (!answers.overwrite) {
          logger.info('Environment copy cancelled');
          return;
        }
      }

      const spinner = ora(`Copying environment from ${from} to ${to}...`).start();

      // Read source environment
      const envContent = await fs.readFile(fromPath, 'utf-8');
      
      // Parse and modify environment variables if needed
      const envConfig = dotenv.parse(envContent);
      const modifiedContent = generateModifiedEnvironment(envConfig, from, to);

      // Write to destination
      await fs.writeFile(toPath, modifiedContent);

      spinner.succeed(`Environment copied from ${from} to ${to}`);

      logger.info(`\nCopied from: ${fromFile}`);
      logger.info(`Copied to: ${toFile}`);
      logger.info(`\nNext steps:`);
      logger.info(`  1. Review and modify ${toFile} for the ${to} environment`);
      logger.info(`  2. Run: thrilled env validate --env ${to}`);

    } catch (error) {
      logger.error('Failed to copy environment:', error);
      process.exit(1);
    }
  }
};

function generateEnvironmentTemplate(projectInfo: any, env: string): string {
  const template = `# Environment: ${env}
# Generated by Thrilled CLI

# Application
NODE_ENV=${env}
PORT=3000
APP_NAME=${projectInfo.name || 'thrilled-app'}
APP_VERSION=1.0.0

# Database
DB_HOST=localhost
DB_PORT=${getDatabasePort(projectInfo.database)}
DB_NAME=${projectInfo.name || 'thrilled'}_${env}
DB_USER=postgres
DB_PASSWORD=password

# Redis (if using caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# API
API_PREFIX=/api/v1
API_RATE_LIMIT=100

# Logging
LOG_LEVEL=${env === 'production' ? 'info' : 'debug'}
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:3000

# File Upload
UPLOAD_MAX_SIZE=10mb
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Email (if using email service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@yourapp.com
FROM_NAME=Your App Name

# External APIs
# Add your external API keys and configurations here

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-here

# Health Checks
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090
`;

  return template;
}

function getDatabasePort(database: string): number {
  switch (database) {
    case 'postgresql':
      return 5432;
    case 'mysql':
      return 3306;
    case 'mongodb':
      return 27017;
    case 'redis':
      return 6379;
    default:
      return 5432;
  }
}

function generateModifiedEnvironment(envConfig: Record<string, string>, from: string, to: string): string {
  const lines: string[] = [];
  
  lines.push(`# Environment: ${to}`);
  lines.push(`# Copied from: ${from}`);
  lines.push(`# Modified: ${new Date().toISOString()}`);
  lines.push('');

  for (const [key, value] of Object.entries(envConfig)) {
    // Modify environment-specific values
    let modifiedValue = value;
    
    if (key === 'NODE_ENV') {
      modifiedValue = to;
    } else if (key.includes('_NAME') && value.includes(from)) {
      modifiedValue = value.replace(from, to);
    } else if (key === 'PORT' && to === 'production') {
      modifiedValue = '80';
    } else if (key === 'LOG_LEVEL') {
      modifiedValue = to === 'production' ? 'info' : 'debug';
    }

    lines.push(`${key}=${modifiedValue}`);
  }

  return lines.join('\n');
}
