
import { Server } from 'http';
import { Logger } from '../logging/Logger';

export interface GracefulShutdownConfig {
  enabled?: boolean;
  timeout?: number;
  signals?: string[];
}

export class GracefulShutdown {
  private server?: Server;
  private logger: Logger;
  private config: Required<GracefulShutdownConfig>;
  private shutdownHandlers: Array<() => Promise<void>> = [];
  private isShuttingDown = false;

  constructor(config: GracefulShutdownConfig = {}, logger?: Logger) {
    this.config = {
      enabled: true,
      timeout: 30000, // 30 seconds
      signals: ['SIGTERM', 'SIGINT', 'SIGUSR2'],
      ...config,
    };
    this.logger = logger || Logger.create({ level: 'info' });

    if (this.config.enabled) {
      this.setupSignalHandlers();
    }
  }

  /**
   * Set the HTTP server instance
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Add a shutdown handler
   */
  addHandler(handler: () => Promise<void>): void {
    this.shutdownHandlers.push(handler);
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    this.config.signals.forEach((signal) => {
      process.on(signal, () => {
        this.logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.shutdown();
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error(error, { context: 'UncaughtException' });
      this.shutdown(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error(new Error(`Unhandled Rejection: ${reason}`), {
        context: 'UnhandledRejection',
        promise: promise.toString(),
      });
      this.shutdown(1);
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(exitCode = 0): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();

    try {
      // Set a timeout for the entire shutdown process
      const shutdownTimeout = setTimeout(() => {
        this.logger.error('Shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, this.config.timeout);

      // Run custom shutdown handlers
      if (this.shutdownHandlers.length > 0) {
        this.logger.info(`Running ${this.shutdownHandlers.length} shutdown handlers...`);
        
        await Promise.all(
          this.shutdownHandlers.map(async (handler, index) => {
            try {
              await handler();
              this.logger.debug(`Shutdown handler ${index + 1} completed`);
            } catch (error) {
              this.logger.error(error as Error, {
                context: `ShutdownHandler-${index + 1}`,
              });
            }
          })
        );
      }

      // Close HTTP server
      if (this.server) {
        this.logger.info('Closing HTTP server...');
        await new Promise<void>((resolve, reject) => {
          if (this.server) {
            this.server.close((error) => {
              if (error) {
                this.logger.error(error, { context: 'ServerClose' });
                reject(error);
              } else {
                this.logger.info('HTTP server closed');
                resolve();
              }
            });
          } else {
            resolve();
          }
        });
      }

      clearTimeout(shutdownTimeout);
      
      const shutdownTime = Date.now() - startTime;
      this.logger.info(`Graceful shutdown completed in ${shutdownTime}ms`);
      
      process.exit(exitCode);
    } catch (error) {
      this.logger.error(error as Error, { context: 'GracefulShutdown' });
      process.exit(1);
    }
  }

  /**
   * Force shutdown (for testing or emergency situations)
   */
  forceShutdown(exitCode = 0): void {
    this.logger.warn('Force shutdown initiated');
    process.exit(exitCode);
  }
}
