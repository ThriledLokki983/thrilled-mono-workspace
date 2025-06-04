import { BasePlugin } from '@mono/be-core';
import type { Express } from 'express';
import { 
  JWTProvider, 
  PasswordManager, 
  SessionManager, 
  RBACManager, 
  AuthMiddleware,
  RedisCacheAdapter
} from '@thrilled/be-auth';
import { 
  createRedisClient, 
  createJWTConfig, 
  createPasswordConfig, 
  createSessionConfig,
  createAuthLoggingConfig
} from '@config/auth.config';

export class AuthPlugin extends BasePlugin {
  readonly name = 'auth';
  readonly version = '1.0.0';
  override dependencies = ['database']; // Depends on database plugin

  private jwtProvider!: JWTProvider;
  private passwordManager!: PasswordManager;
  private sessionManager!: SessionManager;
  private rbacManager!: RBACManager;
  private authMiddleware!: AuthMiddleware;
  private redisClient!: any;
  private cacheAdapter!: RedisCacheAdapter;

  protected async setup(): Promise<void> {
    this.logger.info('Setting up authentication services');

    try {
      // Create Redis client
      this.redisClient = createRedisClient();
      await this.redisClient.connect();
      this.logger.info('Redis client connected successfully');

      // Create cache adapter
      this.cacheAdapter = new RedisCacheAdapter(this.redisClient);

      // Create auth logging config
      const authLoggingConfig = createAuthLoggingConfig();

      // Initialize JWT Provider
      this.jwtProvider = new JWTProvider(
        createJWTConfig(),
        this.redisClient,
        authLoggingConfig
      );

      // Initialize Password Manager
      this.passwordManager = new PasswordManager(
        createPasswordConfig(),
        this.cacheAdapter,
        authLoggingConfig
      );

      // Initialize Session Manager
      this.sessionManager = new SessionManager(
        createSessionConfig(),
        this.cacheAdapter,
        authLoggingConfig
      );

      // Initialize RBAC Manager
      this.rbacManager = new RBACManager(
        this.cacheAdapter,
        authLoggingConfig
      );

      // Initialize Auth Middleware
      this.authMiddleware = new AuthMiddleware(
        this.jwtProvider,
        this.sessionManager,
        this.rbacManager,
        authLoggingConfig
      );

      this.logger.info('Authentication services initialized successfully');
    } catch (error) {
      this.logger.error(error as Error, { context: 'AuthPlugin.setup' });
      throw error;
    }
  }

  protected override registerRoutes(app: Express): void {
    this.logger.info('Registering authentication routes');

    // Authentication middleware for protected routes
    // This will be available for other route plugins to use
    app.use('/api/v1/auth/*', this.authMiddleware.authenticate());

    // Protected routes middleware - use this for any routes that require authentication
    app.use('/api/v1/protected/*', this.authMiddleware.authenticate());

    // RBAC middleware - use this for routes that require specific permissions
    // Example: app.use('/api/v1/admin/*', this.authMiddleware.authorize(['admin']));

    this.logger.info('Authentication routes registered successfully');
  }

  protected override async teardown(): Promise<void> {
    this.logger.info('Tearing down authentication services');
    
    if (this.redisClient) {
      await this.redisClient.disconnect();
      this.logger.info('Redis client disconnected');
    }
  }

  // Getters for auth services (can be used by other plugins or services)
  public getJWTProvider(): JWTProvider {
    return this.jwtProvider;
  }

  public getPasswordManager(): PasswordManager {
    return this.passwordManager;
  }

  public getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  public getRBACManager(): RBACManager {
    return this.rbacManager;
  }

  public getAuthMiddleware(): AuthMiddleware {
    return this.authMiddleware;
  }
}
