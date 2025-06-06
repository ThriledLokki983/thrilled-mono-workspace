import { Express } from 'express';
import { Logger } from '../logging/Logger';

export interface Plugin {
  /** Unique name of the plugin */
  name: string;

  /** Version of the plugin */
  version: string;

  /** Plugin dependencies that must be loaded before this plugin */
  dependencies?: string[];

  /** Register the plugin with the Express app */
  register(app: Express, config: unknown): Promise<void> | void;
}

export abstract class BasePlugin implements Plugin {
  abstract readonly name: string;
  abstract readonly version: string;
  protected logger: Logger;

  dependencies?: string[];

  constructor(logger?: Logger) {
    this.logger = logger || Logger.create({ level: 'info' });
  }

  async register(app: Express, config: unknown): Promise<void> {
    await this.setup(config);
    this.registerMiddleware(app);
    this.registerRoutes(app);
    this.registerErrorHandlers(app);
  }

  /**
   * Setup the plugin with configuration
   */
  protected abstract setup(config: unknown): Promise<void> | void;

  /**
   * Register middleware for this plugin
   */
  protected registerMiddleware(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _app: Express
  ): void {
    // Override in subclasses if needed
    this.logger.debug(`Registering middleware for plugin: ${this.name}`);
  }

  /**
   * Register routes for this plugin
   */
  protected registerRoutes(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _app: Express
  ): void {
    // Override in subclasses if needed
    this.logger.debug(`Registering routes for plugin: ${this.name}`);
  }

  /**
   * Register error handlers for this plugin
   */
  protected registerErrorHandlers(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _app: Express
  ): void {
    // Override in subclasses if needed
    this.logger.debug(`Registering error handlers for plugin: ${this.name}`);
  }
}
