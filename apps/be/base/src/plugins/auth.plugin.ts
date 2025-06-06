import { BasePlugin } from '@mono/be-core';
import type { Express } from 'express';
import { Container } from 'typedi';
import { createRedisClient, createJWTConfig, createPasswordConfig, createSessionConfig } from '../config/auth.config';

// Function to import ES module from CommonJS context
const importESModule = async (specifier: string) => {
  return new Function('specifier', 'return import(specifier)')(specifier);
};

export class AuthPlugin extends BasePlugin {
  readonly name = 'auth';
  readonly version = '1.0.0';
  override dependencies = ['database']; // Depends on database plugin

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jwtProvider: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private passwordManager: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sessionManager: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private rbacManager: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private authMiddleware: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private redisClient: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cacheAdapter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private authModule: any;

  protected async setup(): Promise<void> {
    this.logger.info('Setting up authentication services');

    try {
      // Dynamically import the ES module using a wrapper function
      this.authModule = await importESModule('@thrilled/be-auth');

      // Create Redis client
      this.redisClient = createRedisClient();
      await this.redisClient.connect();
      this.logger.info('Redis client connected successfully');

      // Create cache adapter
      this.cacheAdapter = new this.authModule.RedisCacheAdapter(this.redisClient);

      // Initialize JWT Provider
      const jwtConfig = createJWTConfig();
      this.logger.info('JWT Config being passed to JWTProvider:', {
        hasAccessTokenSecret: !!jwtConfig.accessToken.secret,
        accessTokenExpiresIn: jwtConfig.accessToken.expiresIn,
        algorithm: jwtConfig.accessToken.algorithm
      });
      this.jwtProvider = new this.authModule.JWTProvider(this.redisClient, jwtConfig, this.logger);

      // Initialize Password Manager
      this.passwordManager = new this.authModule.PasswordManager(createPasswordConfig(), this.cacheAdapter, this.logger);

      // Initialize Session Manager
      this.sessionManager = new this.authModule.SessionManager(createSessionConfig(), this.cacheAdapter, this.logger);

      // Initialize RBAC Manager
      this.rbacManager = new this.authModule.RBACManager(this.cacheAdapter, this.logger);

      // Initialize Auth Middleware
      this.authMiddleware = new this.authModule.AuthMiddleware(this.jwtProvider, this.sessionManager, this.rbacManager, this.logger);

      this.logger.info('Authentication services initialized successfully');

      // Register auth package instances with TypeDI container for dependency injection
      this.registerWithContainer();
    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPlugin.setup' });
      throw error;
    }
  }

  /**
   * Register auth package instances with TypeDI container
   * This enables dependency injection of auth services into other services
   */
  private registerWithContainer(): void {
    try {
      // Register auth package instances with specific tokens
      Container.set('jwtProvider', this.jwtProvider);
      Container.set('passwordManager', this.passwordManager);
      Container.set('sessionManager', this.sessionManager);
      Container.set('rbacManager', this.rbacManager);

      this.logger.info('Auth package instances registered with TypeDI container');
    } catch (error) {
      this.logger.error('Failed to register auth instances with container', { error });
      throw error;
    }
  }

  protected override registerRoutes(app: Express): void {
    this.logger.info('Registering authentication routes');

    // Authentication middleware for protected auth routes only (exclude login/signup)
    // Apply auth middleware to logout and other protected auth endpoints
    app.use('/api/v1/auth/logout', this.authMiddleware.authenticate());
    app.use('/api/v1/auth/profile', this.authMiddleware.authenticate());
    app.use('/api/v1/auth/refresh', this.authMiddleware.authenticate());

    // Protected routes middleware - use this for any routes that require authentication
    app.use('/api/v1/protected/*', this.authMiddleware.authenticate());

    // RBAC middleware - use this for routes that require specific permissions
    // Example: app.use('/api/v1/admin/*', this.authMiddleware.authorize(['admin']));

    this.logger.info('Authentication routes registered successfully');
  }

  protected async teardown(): Promise<void> {
    this.logger.info('Tearing down authentication services');

    if (this.redisClient) {
      await this.redisClient.disconnect();
      this.logger.info('Redis client disconnected');
    }
  }

  // Getters for auth services (can be used by other plugins or services)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getJWTProvider(): any {
    return this.jwtProvider;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPasswordManager(): any {
    return this.passwordManager;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getSessionManager(): any {
    return this.sessionManager;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getRBACManager(): any {
    return this.rbacManager;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getAuthMiddleware(): any {
    return this.authMiddleware;
  }
}
