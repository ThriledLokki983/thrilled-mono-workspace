#!/usr/bin/env node

import { program } from 'commander';
import { createApp } from '../commands/create-app.js';
import { generateCommand } from '../commands/generate.js';
import { databaseCommands } from '../commands/database.js';
import { environmentCommands } from '../commands/environment.js';
import { migrationCommands } from '../commands/migration.js';
import { devCommands } from '../commands/dev.js';
import chalk from 'chalk';

const packageJson = require('../../package.json');

program
  .name('thrilled')
  .description('CLI for Thrilled Backend Framework')
  .version(packageJson.version);

// Project Generation Commands
program
  .command('create-app')
  .alias('new')
  .description('Create a new backend application')
  .argument('[name]', 'Application name')
  .option('-t, --template <template>', 'Template to use', 'express')
  .option('-d, --directory <directory>', 'Directory to create the app in')
  .option('--skip-install', 'Skip npm install')
  .option('--skip-git', 'Skip git initialization')
  .action(createApp);

// Code Generation Commands
const generate = program
  .command('generate')
  .alias('g')
  .description('Generate code scaffolding');

generate
  .command('route')
  .description('Generate a new route')
  .argument('<name>', 'Route name')
  .option('-p, --path <path>', 'Route path')
  .option('-m, --methods <methods>', 'HTTP methods (comma-separated)', 'GET,POST')
  .option('--auth', 'Add authentication middleware')
  .option('--validation', 'Add request validation')
  .action(generateCommand.route);

generate
  .command('model')
  .description('Generate a new data model')
  .argument('<name>', 'Model name')
  .option('-f, --fields <fields>', 'Model fields (comma-separated)')
  .option('--database <database>', 'Database type', 'postgresql')
  .option('--migrations', 'Generate migrations')
  .action(generateCommand.model);

generate
  .command('plugin')
  .description('Generate a new plugin')
  .argument('<name>', 'Plugin name')
  .option('-t, --type <type>', 'Plugin type', 'middleware')
  .action(generateCommand.plugin);

generate
  .command('service')
  .description('Generate a new service')
  .argument('<name>', 'Service name')
  .option('--injectable', 'Make service injectable')
  .action(generateCommand.service);

generate
  .command('test')
  .description('Generate test files')
  .argument('<name>', 'Test name')
  .option('--unit', 'Generate unit tests')
  .option('--integration', 'Generate integration tests')
  .action(generateCommand.test);

// Database Commands
const db = program
  .command('db')
  .description('Database management commands');

db
  .command('create')
  .description('Create database')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(databaseCommands.create);

db
  .command('drop')
  .description('Drop database')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('--force', 'Force drop without confirmation')
  .action(databaseCommands.drop);

db
  .command('reset')
  .description('Reset database (drop and recreate)')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('--force', 'Force reset without confirmation')
  .action(databaseCommands.reset);

db
  .command('seed')
  .description('Run database seeders')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('-s, --seeder <seeder>', 'Specific seeder to run')
  .action(databaseCommands.seed);

// Migration Commands
const migrate = program
  .command('migrate')
  .alias('migration')
  .description('Database migration commands');

migrate
  .command('create')
  .description('Create a new migration')
  .argument('<name>', 'Migration name')
  .action(migrationCommands.create);

migrate
  .command('up')
  .description('Run pending migrations')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('-s, --steps <steps>', 'Number of migrations to run')
  .action(migrationCommands.up);

migrate
  .command('down')
  .description('Rollback migrations')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('-s, --steps <steps>', 'Number of migrations to rollback', '1')
  .action(migrationCommands.down);

migrate
  .command('status')
  .description('Show migration status')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(migrationCommands.status);

migrate
  .command('refresh')
  .description('Refresh migrations (rollback all and re-run)')
  .option('-e, --env <environment>', 'Environment', 'development')
  .option('--force', 'Force refresh without confirmation')
  .action(migrationCommands.refresh);

// Environment Commands
const env = program
  .command('env')
  .description('Environment management commands');

env
  .command('init')
  .description('Initialize environment configuration')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(environmentCommands.init);

env
  .command('validate')
  .description('Validate environment configuration')
  .option('-e, --env <environment>', 'Environment', 'development')
  .action(environmentCommands.validate);

env
  .command('copy')
  .description('Copy environment from one to another')
  .argument('<from>', 'Source environment')
  .argument('<to>', 'Target environment')
  .action(environmentCommands.copy);

// Development Commands
const dev = program
  .command('dev')
  .description('Development tools');

dev
  .command('start')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--watch', 'Watch for file changes', true)
  .option('--debug', 'Enable debug mode')
  .action(devCommands.start);

dev
  .command('build')
  .description('Build the application')
  .option('-e, --env <environment>', 'Environment', 'production')
  .option('--watch', 'Watch for file changes')
  .action(devCommands.build);

dev
  .command('test')
  .description('Run tests')
  .option('--watch', 'Watch for file changes')
  .option('--coverage', 'Generate coverage report')
  .option('--unit', 'Run only unit tests')
  .option('--integration', 'Run only integration tests')
  .action(devCommands.test);

dev
  .command('lint')
  .description('Run linting')
  .option('--fix', 'Auto-fix issues')
  .action(devCommands.lint);

dev
  .command('format')
  .description('Format code')
  .action(devCommands.format);

// Error handling
program.on('command:*', (operands) => {
  console.error(chalk.red(`Unknown command: ${operands[0]}`));
  console.log('See --help for a list of available commands.');
  process.exit(1);
});

// Parse CLI arguments
program.parse();
