import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { glob } from 'glob';

export interface TemplateContext {
  name: string;
  projectName: string;
  pascalCase: string;
  camelCase: string;
  kebabCase: string;
  snakeCase: string;
  upperCase: string;
  language: string;
  framework: string;
  database?: string;
  features: string[];
  [key: string]: unknown;
}

interface HandlebarsOptions {
  fn: (context: unknown) => string;
  inverse: (context: unknown) => string;
  data?: { root?: unknown };
}

export class TemplateEngine {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '../../templates');
    this.registerHelpers();
  }

  async generateProject(projectDir: string, name: string, config: any) {
    const context = this.createContext(name, config);
    const templateDir = path.join(this.templatesDir, 'project', config.template);
    
    if (!await fs.pathExists(templateDir)) {
      throw new Error(`Template ${config.template} not found`);
    }

    await this.processDirectory(templateDir, projectDir, context);
  }

  async generateRoute(config: any) {
    const context = this.createContext(config.name, config);
    const templateDir = path.join(this.templatesDir, 'route');
    const outputDir = path.join(config.project.rootDir, 'src', 'routes');

    await fs.ensureDir(outputDir);
    await this.processDirectory(templateDir, outputDir, context);
  }

  async generateModel(config: any) {
    const context = this.createContext(config.name, config);
    const templateDir = path.join(this.templatesDir, 'model');
    const outputDir = path.join(config.project.rootDir, 'src', 'models');

    await fs.ensureDir(outputDir);
    await this.processDirectory(templateDir, outputDir, context);

    // Generate migration if requested
    if (config.migrations) {
      await this.generateMigration({
        name: `create_${config.name.toLowerCase()}_table`,
        displayName: `Create ${config.name} table`,
        project: config.project,
        model: config
      });
    }
  }

  async generatePlugin(config: any) {
    const context = this.createContext(config.name, config);
    const templateDir = path.join(this.templatesDir, 'plugin', config.type);
    const outputDir = path.join(config.project.rootDir, 'src', 'plugins');

    await fs.ensureDir(outputDir);
    await this.processDirectory(templateDir, outputDir, context);
  }

  async generateService(config: any) {
    const context = this.createContext(config.name, config);
    const templateDir = path.join(this.templatesDir, 'service');
    const outputDir = path.join(config.project.rootDir, 'src', 'services');

    await fs.ensureDir(outputDir);
    await this.processDirectory(templateDir, outputDir, context);
  }

  async generateTest(config: any) {
    const context = this.createContext(config.name, config);
    
    if (config.unit) {
      const templateDir = path.join(this.templatesDir, 'test', 'unit');
      const outputDir = path.join(config.project.rootDir, 'tests', 'unit');
      await fs.ensureDir(outputDir);
      await this.processDirectory(templateDir, outputDir, context);
    }

    if (config.integration) {
      const templateDir = path.join(this.templatesDir, 'test', 'integration');
      const outputDir = path.join(config.project.rootDir, 'tests', 'integration');
      await fs.ensureDir(outputDir);
      await this.processDirectory(templateDir, outputDir, context);
    }
  }

  async generateMigration(config: any) {
    const context = this.createContext(config.name, config);
    const templateDir = path.join(this.templatesDir, 'migration');
    const outputDir = path.join(config.project.rootDir, 'migrations');

    await fs.ensureDir(outputDir);
    await this.processDirectory(templateDir, outputDir, context);
  }

  private async processDirectory(
    templateDir: string, 
    outputDir: string, 
    context: TemplateContext
  ) {
    const files = await glob('**/*', { 
      cwd: templateDir, 
      dot: true,
      nodir: true 
    });

    for (const file of files) {
      await this.processFile(
        path.join(templateDir, file),
        path.join(outputDir, file),
        context
      );
    }
  }

  private async processFile(
    templatePath: string, 
    outputPath: string, 
    context: TemplateContext
  ) {
    // Process filename template
    const processedPath = this.processTemplate(outputPath, context);
    
    // Ensure output directory exists
    await fs.ensureDir(path.dirname(processedPath));

    // Read template content
    const template = await fs.readFile(templatePath, 'utf-8');
    
    // Process template content
    const content = this.processTemplate(template, context);
    
    // Write processed file
    await fs.writeFile(processedPath, content);
  }

  private processTemplate(template: string, context: TemplateContext): string {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context);
  }

  private createContext(name: string, config: any): TemplateContext {
    return {
      name,
      projectName: name,
      pascalCase: this.toPascalCase(name),
      camelCase: this.toCamelCase(name),
      kebabCase: this.toKebabCase(name),
      snakeCase: this.toSnakeCase(name),
      upperCase: this.toUpperCase(name),
      language: config.language || 'typescript',
      framework: config.framework || 'express',
      database: config.database,
      features: config.features || [],
      ...config
    };
  }

  private registerHelpers() {
    // String case helpers
    Handlebars.registerHelper('pascalCase', (str: string) => this.toPascalCase(str));
    Handlebars.registerHelper('camelCase', (str: string) => this.toCamelCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => this.toKebabCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => this.toSnakeCase(str));
    Handlebars.registerHelper('upperCase', (str: string) => this.toUpperCase(str));

    // Conditional helpers
    Handlebars.registerHelper('if_eq', (a: unknown, b: unknown, options: HandlebarsOptions) => {
      return a === b ? options.fn(options.data?.root || {}) : options.inverse(options.data?.root || {});
    });

    Handlebars.registerHelper('if_includes', (array: unknown[], value: unknown, options: HandlebarsOptions) => {
      return Array.isArray(array) && array.includes(value) ? options.fn(options.data?.root || {}) : options.inverse(options.data?.root || {});
    });

    // Date helpers
    Handlebars.registerHelper('currentYear', () => new Date().getFullYear());
    Handlebars.registerHelper('currentDate', () => new Date().toISOString().split('T')[0]);
    Handlebars.registerHelper('timestamp', () => Date.now());

    // File extension helper
    Handlebars.registerHelper('ext', function(language: string) {
      return language === 'typescript' ? 'ts' : 'js';
    });
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, char => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  private toUpperCase(str: string): string {
    return this.toSnakeCase(str).toUpperCase();
  }
}
