import 'reflect-metadata';
import express, { Express, RequestHandler } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import hpp from 'hpp';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Logger } from './logging/Logger.js';
import { Plugin } from './plugins/Plugin.js';
import { PluginManager } from './plugins/PluginManager.js';
import { CoreValidationPlugin } from './plugins/ValidationPlugin.js';
import { HealthCheckManager, HealthCheck } from './utils/HealthCheck.js';
import { GracefulShutdown } from './utils/GracefulShutdown.js';
import { AppConfig, RateLimitConfig, PluginConfig } from './types/index.js';

export class BaseApp {
  private app: Express;
  private pluginManager: PluginManager;
  private healthCheckManager: HealthCheckManager;
  private gracefulShutdown: GracefulShutdown;
  private logger: Logger;

  constructor(private config: AppConfig) {
    this.app = express();
    this.logger = Logger.create(config.logging || {});
    this.pluginManager = new PluginManager(this.logger);
    this.healthCheckManager = new HealthCheckManager(
      config.health,
      this.logger
    );
    this.gracefulShutdown = new GracefulShutdown(
      config.gracefulShutdown,
      this.logger
    );
    this.initializeCore();
    this.setupDefaultPlugins();
    this.setupHealthChecks();
  }

  /**
   * Add a plugin to the application
   */
  use(plugin: Plugin, config?: PluginConfig, enabled = true): this {
    this.pluginManager.register(plugin, config, enabled);
    return this;
  }

  /**
   * Get the Express application instance
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get the plugin manager instance
   */
  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  /**
   * Get the logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Enable a plugin by name
   */
  enablePlugin(name: string): boolean {
    return this.pluginManager.enable(name);
  }

  /**
   * Disable a plugin by name
   */
  disablePlugin(name: string): boolean {
    return this.pluginManager.disable(name);
  }

  /**
   * Get list of all registered plugins
   */
  listPlugins(): { name: string; version: string; enabled: boolean }[] {
    return this.pluginManager.list();
  }

  /**
   * Setup default plugins that should be included by default
   */
  private setupDefaultPlugins(): void {
    // Add validation plugin by default if not explicitly disabled
    const validationConfig = this.config.validation || {};
    const isValidationEnabled = validationConfig.enabled !== false; // Default to true

    if (isValidationEnabled) {
      const validationPlugin = new CoreValidationPlugin(this.logger, validationConfig);
      this.use(validationPlugin, validationConfig);
      this.logger.info('Validation plugin automatically registered', { context: 'BaseApp' });
    } else {
      this.logger.info('Validation plugin disabled via configuration', { context: 'BaseApp' });
    }
  }

  /**
   * Get the validation plugin instance if it exists
   */
  getValidationPlugin(): CoreValidationPlugin | undefined {
    const plugin = this.pluginManager.get('validation');
    return plugin as CoreValidationPlugin | undefined;
  }

  /**
   * Start the application server
   */
  async start(): Promise<void> {
    try {
      await this.initializePlugins();
      await this.listen();
    } catch (error) {
      this.logger.error(error as Error, { context: 'BaseApp.start' });
      process.exit(1);
    }
  }

  /**
   * Initialize core middleware that should always be present
   */
  private initializeCore(): void {
    // Trust proxy configuration (must be set before other middleware)
    if (this.config.trustProxy !== undefined) {
      this.app.set('trust proxy', this.config.trustProxy);
    }

    // Security middleware
    this.app.use(helmet() as unknown as RequestHandler);
    this.app.use(hpp() as unknown as RequestHandler);

    // Performance middleware
    this.app.use(compression() as unknown as RequestHandler);

    // CORS configuration
    if (this.config.cors) {
      this.app.use(cors(this.config.cors));
    }

    // Rate limiting
    if (this.config.rateLimit) {
      this.app.use(
        this.createRateLimit(this.config.rateLimit) as unknown as RequestHandler
      );
    }

    // Logging
    if (this.config.logging?.httpLogging !== false) {
      // Custom format: shows response time in milliseconds instead of response size
      const customFormat =
        ':method :url HTTP/:http-version" :status ==> :response-time ms';

      this.app.use(
        morgan(customFormat, {
          stream: { write: (message) => this.logger.info(message.trim()) },
        })
      );
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Cookie parsing
    this.app.use(cookieParser());
  }

  /**
   * Initialize all registered plugins
   */
  private async initializePlugins(): Promise<void> {
    await this.pluginManager.initializeAll(this.app);
  }

  /**
   * Create rate limiting middleware
   */
  private createRateLimit(config: RateLimitConfig): RateLimitRequestHandler {
    return rateLimit({
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.max || 100, // limit each IP to 100 requests per windowMs
      message: config.message || 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
      ...config,
    });
  }

  /**
   * Start listening on the configured port
   */
  private async listen(): Promise<void> {
    return new Promise((resolve) => {
      const environment = this.config.environment || this.config.env || 'development';
      const appName = this.config.name || 'Application';
      const appPort = this.config.port || 3000;

      this.app.listen(this.config.port || 3000, () => {
        // Log application startup information
        this.logger.info(`==================================================`);
        this.logger.info(`================ ENV: ${environment} =================`);
        this.logger.info(`🚀 ${appName || 'Base App'} is on port: ${appPort}`);
        this.logger.info(`==================================================`);
        this.logger.info(`Listening for incoming requests...`);
        resolve();
      });
    });
  }

  /**
   * Setup default health checks
   */
  private setupHealthChecks(): void {
    // Add basic application health check
    this.healthCheckManager.register({
      name: 'application',
      check: async () => ({
        status: 'healthy',
        details: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          pid: process.pid,
        },
      }),
    });

    // Setup health check endpoint
    this.healthCheckManager.setupEndpoint(this.app);
  }

  /**
   * Add a health check
   */
  addHealthCheck(check: HealthCheck): this {
    this.healthCheckManager.register(check);
    return this;
  }

  /**
   * Add a shutdown handler
   */
  addShutdownHandler(handler: () => Promise<void>): this {
    this.gracefulShutdown.addHandler(handler);
    return this;
  }
}
