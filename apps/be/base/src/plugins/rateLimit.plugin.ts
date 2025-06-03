import { Express, RequestHandler } from 'express';
import { BasePlugin, SecurityMiddleware } from '@mono/be-core';

interface RateLimitPluginConfig {
  environment?: string;
}

export class RateLimitPlugin extends BasePlugin {
  readonly name = 'rateLimit';
  readonly version = '1.0.0';
  private isDev = false;

  protected async setup(config: RateLimitPluginConfig): Promise<void> {
    this.logger.info('Initializing rate limiting plugin...');
    this.isDev = config.environment === 'development';

    const windowMs = this.isDev ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
    this.logger.info(`Rate limiting configured for ${this.isDev ? 'development' : 'production'} mode (${windowMs}ms window)`);
  }

  protected registerMiddleware(app: Express): void {
    const windowMs = this.isDev ? 24 * 60 * 60 * 1000 : 15 * 60 * 1000;

    // Authentication endpoints rate limiter (login, registration)
    const authLimiter = SecurityMiddleware.rateLimit({
      windowMs,
      max: this.isDev ? 1000 : 30,
      message: 'Too many authentication attempts, please try again later',
    });

    // API endpoints with standard access patterns
    const standardApiLimiter = SecurityMiddleware.rateLimit({
      windowMs,
      max: this.isDev ? 5000 : 100,
      message: 'Too many requests from this IP, please try again later',
    });

    // Public read-only endpoints can have higher limits
    const publicReadLimiter = SecurityMiddleware.rateLimit({
      windowMs,
      max: this.isDev ? 10000 : 300,
      message: 'Too many requests from this IP, please try again later',
    });

    // Apply rate limiters to specific routes
    app.use('/api/v1/auth/login', authLimiter as unknown as RequestHandler);
    app.use('/api/v1/auth/register', authLimiter as unknown as RequestHandler);
    app.use('/api/v1/auth', standardApiLimiter as unknown as RequestHandler);
    app.use('/health', publicReadLimiter as unknown as RequestHandler);
    app.use('/api/v1', standardApiLimiter as unknown as RequestHandler);

    this.logger.info('Rate limiting middleware registered');
  }
}
