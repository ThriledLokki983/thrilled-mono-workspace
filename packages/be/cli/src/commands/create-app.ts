import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import validatePackageName from 'validate-npm-package-name';
import { TemplateEngine } from '../utils/template-engine.js';
import { ProjectStructure } from '../utils/project-structure.js';
import { Logger } from '../utils/logger.js';

interface CreateAppOptions {
  template?: string;
  directory?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  typescript?: boolean;
  javascript?: boolean;
}

export async function createApp(name?: string, options: CreateAppOptions = {}) {
  const logger = new Logger();
  
  try {
    // Get project name
    if (!name) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          validate: (input: string) => {
            if (!input) {
              return 'Project name is required';
            }
            const validation = validatePackageName(input);
            if (!validation.validForNewPackages) {
              return validation.errors?.[0] || 'Invalid package name';
            }
            return true;
          }
        }
      ]);
      name = answers.name;
    }

    // Validate package name
    const validation = validatePackageName(name!);
    if (!validation.validForNewPackages) {
      logger.error(`Invalid package name: ${validation.errors?.[0]}`);
      process.exit(1);
    }

    // Determine project directory
    const projectDir = options.directory 
      ? path.resolve(options.directory, name!)
      : path.resolve(process.cwd(), name!);

    // Check if directory already exists
    if (await fs.pathExists(projectDir)) {
      logger.error(`Directory ${projectDir} already exists`);
      process.exit(1);
    }

    // Get additional project configuration
    const config = await getProjectConfig(options);

    // Create project
    const spinner = ora('Creating project structure...').start();
    
    try {
      await createProjectStructure(projectDir, name!, config);
      spinner.succeed('Project structure created');

      // Generate files from templates
      spinner.start('Generating project files...');
      await generateProjectFiles(projectDir, name!, config);
      spinner.succeed('Project files generated');

      // Install dependencies
      if (!options.skipInstall) {
        spinner.start('Installing dependencies...');
        await installDependencies(projectDir);
        spinner.succeed('Dependencies installed');
      }

      // Initialize git repository
      if (!options.skipGit) {
        spinner.start('Initializing git repository...');
        await initializeGit(projectDir);
        spinner.succeed('Git repository initialized');
      }

      // Success message
      logger.success(`\n🎉 Successfully created ${name}!`);
      logger.info(`\nNext steps:`);
      logger.info(`  cd ${name}`);
      if (options.skipInstall) {
        logger.info(`  npm install`);
      }
      logger.info(`  npm run dev`);
      logger.info(`\nHappy coding! 🚀`);

    } catch (error) {
      spinner.fail('Failed to create project');
      throw error;
    }

  } catch (error) {
    logger.error('Failed to create application:', error);
    process.exit(1);
  }
}

async function getProjectConfig(options: CreateAppOptions) {
  const questions = [];

  // Template selection
  if (!options.template) {
    questions.push({
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        { name: 'Express.js + TypeScript', value: 'express-typescript' },
        { name: 'Express.js + JavaScript', value: 'express-javascript' },
        { name: 'Fastify + TypeScript', value: 'fastify-typescript' },
        { name: 'NestJS', value: 'nestjs' },
        { name: 'Basic API', value: 'basic-api' }
      ],
      default: 'express-typescript'
    });
  }

  // Language selection (if not already determined by template)
  if (!options.typescript && !options.javascript && !options.template?.includes('typescript') && !options.template?.includes('javascript')) {
    questions.push({
      type: 'list',
      name: 'language',
      message: 'Choose a language:',
      choices: [
        { name: 'TypeScript', value: 'typescript' },
        { name: 'JavaScript', value: 'javascript' }
      ],
      default: 'typescript'
    });
  }

  // Database selection
  questions.push({
    type: 'list',
    name: 'database',
    message: 'Choose a database:',
    choices: [
      { name: 'PostgreSQL', value: 'postgresql' },
      { name: 'MySQL', value: 'mysql' },
      { name: 'SQLite', value: 'sqlite' },
      { name: 'MongoDB', value: 'mongodb' },
      { name: 'None', value: 'none' }
    ],
    default: 'postgresql'
  });

  // Features selection
  questions.push({
    type: 'checkbox',
    name: 'features',
    message: 'Select features to include:',
    choices: [
      { name: 'Authentication & Authorization', value: 'auth', checked: true },
      { name: 'API Documentation (Swagger)', value: 'swagger', checked: true },
      { name: 'Request Validation', value: 'validation', checked: true },
      { name: 'Logging', value: 'logging', checked: true },
      { name: 'Rate Limiting', value: 'rateLimit', checked: true },
      { name: 'CORS', value: 'cors', checked: true },
      { name: 'Health Checks', value: 'health', checked: true },
      { name: 'Monitoring & Metrics', value: 'monitoring', checked: true },
      { name: 'File Upload', value: 'upload', checked: false },
      { name: 'Email Service', value: 'email', checked: false },
      { name: 'Caching (Redis)', value: 'cache', checked: false },
      { name: 'Testing Setup', value: 'testing', checked: true }
    ]
  });

  const answers = await inquirer.prompt(questions);

  return {
    template: options.template || answers.template,
    language: options.typescript ? 'typescript' : options.javascript ? 'javascript' : answers.language,
    database: answers.database,
    features: answers.features || []
  };
}

async function createProjectStructure(projectDir: string, name: string, config: any) {
  const structure = new ProjectStructure(config);
  await structure.create(projectDir, name);
}

async function generateProjectFiles(projectDir: string, name: string, config: any) {
  const templateEngine = new TemplateEngine();
  await templateEngine.generateProject(projectDir, name, config);
}

async function installDependencies(projectDir: string) {
  await execa('npm', ['install'], { cwd: projectDir });
}

async function initializeGit(projectDir: string) {
  await execa('git', ['init'], { cwd: projectDir });
  await execa('git', ['add', '.'], { cwd: projectDir });
  await execa('git', ['commit', '-m', 'Initial commit'], { cwd: projectDir });
}
