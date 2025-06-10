const ora = require('ora');
const execa = require('execa');
const fs = require('fs-extra');
const path = require('path');
import { Logger } from '../utils/logger.js';
import { ProjectDetector } from '../utils/project-detector.js';

interface DevOptions {
  port?: string;
  watch?: boolean;
  debug?: boolean;
  env?: string;
  coverage?: boolean;
  unit?: boolean;
  integration?: boolean;
  fix?: boolean;
}

export const devCommands = {
  async start(options: DevOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const port = options.port || '3000';
      const watch = options.watch !== false;
      const debug = options.debug || false;

      logger.info(`🚀 Starting development server...`);
      logger.info(`   Port: ${port}`);
      logger.info(`   Watch: ${watch ? 'enabled' : 'disabled'}`);
      logger.info(`   Debug: ${debug ? 'enabled' : 'disabled'}`);

      // Build command arguments
      const args = [];
      
      if (projectInfo.language === 'typescript') {
        if (watch) {
          args.push('--watch');
        }
        if (debug) {
          args.push('--inspect');
        }
      }

      // Set environment variables
      const env: Record<string, string> = {
        ...process.env,
        PORT: port,
        NODE_ENV: 'development'
      };

      if (debug) {
        env.DEBUG = '*';
      }

      // Start the development server
      const command = projectInfo.language === 'typescript' ? 'tsx' : 'node';
      const entryFile = projectInfo.language === 'typescript' ? 'src/index.ts' : 'src/index.js';

      await execa(command, [entryFile, ...args], {
        stdio: 'inherit',
        env,
        cwd: process.cwd()
      });

    } catch (error: unknown) {
      const execError = error as { exitCode?: number };
      if (execError.exitCode !== 0) {
        logger.error('Development server failed to start:', error);
        process.exit(1);
      }
    }
  },

  async build(options: DevOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const env = options.env || 'production';
      const watch = options.watch || false;

      const spinner = ora(`Building application for ${env}...`).start();

      // Build command based on project type
      let buildCommand: string[];
      
      if (projectInfo.language === 'typescript') {
        buildCommand = ['tsc'];
        if (watch) {
          buildCommand.push('--watch');
        }
      } else {
        // For JavaScript projects, we might just copy files or run babel
        buildCommand = ['npm', 'run', 'build'];
      }

      const buildEnv = {
        ...process.env,
        NODE_ENV: env
      };

      if (watch) {
        spinner.stop();
        logger.info(`Building in watch mode for ${env}...`);
        
        await execa(buildCommand[0], buildCommand.slice(1), {
          stdio: 'inherit',
          env: buildEnv,
          cwd: process.cwd()
        });
      } else {
        await execa(buildCommand[0], buildCommand.slice(1), {
          env: buildEnv,
          cwd: process.cwd()
        });
        
        spinner.succeed(`Build completed for ${env}`);
      }

    } catch (error) {
      logger.error('Build failed:', error);
      process.exit(1);
    }
  },

  async test(options: DevOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const watch = options.watch || false;
      const coverage = options.coverage || false;
      const unit = options.unit || false;
      const integration = options.integration || false;

      // Build test command
      const testCommand = ['npm', 'test'];
      
      if (watch) {
        testCommand.push('--', '--watch');
      }
      
      if (coverage) {
        testCommand.push('--', '--coverage');
      }

      // Filter test types
      if (unit && !integration) {
        testCommand.push('--', '--testPathPattern=unit');
      } else if (integration && !unit) {
        testCommand.push('--', '--testPathPattern=integration');
      }

      const spinner = ora('Running tests...').start();

      if (watch) {
        spinner.stop();
        logger.info('Running tests in watch mode...');
      }

      try {
        await execa(testCommand[0], testCommand.slice(1), {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        if (!watch) {
          spinner.succeed('Tests completed successfully');
        }
      } catch (error) {
        if (!watch) {
          spinner.fail('Tests failed');
        }
        throw error;
      }

    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'exitCode' in error && (error as { exitCode: number }).exitCode !== 0) {
        logger.error('Tests failed');
        process.exit(1);
      }
    }
  },

  async lint(options: DevOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const fix = options.fix || false;
      const spinner = ora('Running linter...').start();

      // Build lint command
      const lintCommand = ['eslint', 'src'];
      
      if (fix) {
        lintCommand.push('--fix');
      }

      if (projectInfo.language === 'typescript') {
        lintCommand.push('--ext', '.ts,.tsx');
      } else {
        lintCommand.push('--ext', '.js,.jsx');
      }

      try {
        await execa(lintCommand[0], lintCommand.slice(1), {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        spinner.succeed(fix ? 'Linting completed with auto-fixes applied' : 'Linting completed successfully');
      } catch (error) {
        spinner.fail('Linting failed');
        throw error;
      }

    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'exitCode' in error && (error as { exitCode: number }).exitCode !== 0) {
        logger.error('Linting failed');
        process.exit(1);
      }
    }
  },

  async format(options: DevOptions = {}) {
    const logger = new Logger();
    const detector = new ProjectDetector();
    
    try {
      const projectInfo = await detector.detect();
      if (!projectInfo) {
        logger.error('Not in a Thrilled project directory');
        process.exit(1);
      }

      const spinner = ora('Formatting code...').start();

      // Check if prettier is available
      const prettierConfigExists = await fs.pathExists(path.join(process.cwd(), '.prettierrc')) ||
                                   await fs.pathExists(path.join(process.cwd(), '.prettierrc.json')) ||
                                   await fs.pathExists(path.join(process.cwd(), 'prettier.config.js'));

      if (!prettierConfigExists) {
        spinner.warn('No Prettier configuration found');
        logger.info('Creating default Prettier configuration...');
        
        const prettierConfig = {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false
        };

        await fs.writeJSON(path.join(process.cwd(), '.prettierrc.json'), prettierConfig, { spaces: 2 });
      }

      // Run prettier
      const formatCommand = ['prettier', '--write', 'src/**/*'];
      
      if (projectInfo.language === 'typescript') {
        formatCommand[formatCommand.length - 1] = 'src/**/*.{ts,tsx,js,jsx,json}';
      } else {
        formatCommand[formatCommand.length - 1] = 'src/**/*.{js,jsx,json}';
      }

      try {
        await execa(formatCommand[0], formatCommand.slice(1), {
          cwd: process.cwd()
        });

        spinner.succeed('Code formatting completed');
      } catch (error) {
        spinner.fail('Code formatting failed');
        throw error;
      }

    } catch (error) {
      logger.error('Formatting failed:', error);
      process.exit(1);
    }
  }
};
