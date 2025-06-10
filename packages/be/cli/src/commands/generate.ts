import inquirer from 'inquirer';
import ora from 'ora';
import { TemplateEngine } from '../utils/template-engine.js';
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';

interface RouteOptions {
  path?: string;
  methods?: string;
  auth?: boolean;
  validation?: boolean;
}

interface ModelOptions {
  fields?: string;
  database?: string;
  migrations?: boolean;
}

interface PluginOptions {
  type?: string;
}

interface ServiceOptions {
  injectable?: boolean;
}

interface TestOptions {
  unit?: boolean;
  integration?: boolean;
}

export const generateCommand = {
  async route(name: string, options: RouteOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      // Detect project structure
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Generating route...').start();

      // Parse methods
      const methods = options.methods?.split(',').map(m => m.trim().toUpperCase()) || ['GET', 'POST'];

      // Generate route configuration
      const routeConfig = {
        name,
        path: options.path || `/${name.toLowerCase()}`,
        methods,
        auth: options.auth || false,
        validation: options.validation || false,
        project: projectInfo
      };

      // Generate route files
      const templateEngine = new TemplateEngine();
      await templateEngine.generateRoute(routeConfig);

      spinner.succeed(`Route ${name} generated successfully`);

      logger.info(`\nGenerated files:`);
      logger.info(`  - src/routes/${name.toLowerCase()}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      if (options.validation) {
        logger.info(`  - src/validators/${name.toLowerCase()}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      }
      if (options.auth) {
        logger.info(`  - Added authentication middleware`);
      }

    } catch (error) {
      logger.error('Failed to generate route:', error);
      process.exit(1);
    }
  },

  async model(name: string, options: ModelOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Generating model...').start();

      // Parse fields
      const fields = options.fields?.split(',').map(field => {
        const [name, type = 'string'] = field.trim().split(':');
        return { name: name.trim(), type: type.trim() };
      }) || [];

      // Generate model configuration
      const modelConfig = {
        name,
        fields,
        database: options.database || projectInfo.database || 'postgresql',
        migrations: options.migrations || false,
        project: projectInfo
      };

      // Generate model files
      const templateEngine = new TemplateEngine();
      await templateEngine.generateModel(modelConfig);

      spinner.succeed(`Model ${name} generated successfully`);

      logger.info(`\nGenerated files:`);
      logger.info(`  - src/models/${name.toLowerCase()}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      if (options.migrations) {
        logger.info(`  - migrations/create_${name.toLowerCase()}_table.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      }

    } catch (error) {
      logger.error('Failed to generate model:', error);
      process.exit(1);
    }
  },

  async plugin(name: string, options: PluginOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Generating plugin...').start();

      // Get plugin type
      let pluginType = options.type;
      if (!pluginType) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'Choose plugin type:',
            choices: [
              { name: 'Middleware', value: 'middleware' },
              { name: 'Service', value: 'service' },
              { name: 'Utility', value: 'utility' },
              { name: 'Database Plugin', value: 'database' },
              { name: 'Authentication Plugin', value: 'auth' }
            ]
          }
        ]);
        pluginType = answers.type;
      }

      // Generate plugin configuration
      const pluginConfig = {
        name,
        type: pluginType,
        project: projectInfo
      };

      // Generate plugin files
      const templateEngine = new TemplateEngine();
      await templateEngine.generatePlugin(pluginConfig);

      spinner.succeed(`Plugin ${name} generated successfully`);

      logger.info(`\nGenerated files:`);
      logger.info(`  - src/plugins/${name.toLowerCase()}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);

    } catch (error) {
      logger.error('Failed to generate plugin:', error);
      process.exit(1);
    }
  },

  async service(name: string, options: ServiceOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Generating service...').start();

      // Generate service configuration
      const serviceConfig = {
        name,
        injectable: options.injectable || false,
        project: projectInfo
      };

      // Generate service files
      const templateEngine = new TemplateEngine();
      await templateEngine.generateService(serviceConfig);

      spinner.succeed(`Service ${name} generated successfully`);

      logger.info(`\nGenerated files:`);
      logger.info(`  - src/services/${name.toLowerCase()}.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);

    } catch (error) {
      logger.error('Failed to generate service:', error);
      process.exit(1);
    }
  },

  async test(name: string, options: TestOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Generating tests...').start();

      // Generate test configuration
      const testConfig = {
        name,
        unit: options.unit || false,
        integration: options.integration || false,
        project: projectInfo
      };

      // Generate test files
      const templateEngine = new TemplateEngine();
      await templateEngine.generateTest(testConfig);

      spinner.succeed(`Tests for ${name} generated successfully`);

      logger.info(`\nGenerated files:`);
      if (options.unit) {
        logger.info(`  - tests/unit/${name.toLowerCase()}.test.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      }
      if (options.integration) {
        logger.info(`  - tests/integration/${name.toLowerCase()}.test.${projectInfo.language === 'typescript' ? 'ts' : 'js'}`);
      }

    } catch (error) {
      logger.error('Failed to generate tests:', error);
      process.exit(1);
    }
  }
};
