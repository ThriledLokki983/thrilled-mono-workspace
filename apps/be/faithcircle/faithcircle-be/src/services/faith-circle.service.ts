import { createLogger } from '@mono/be-core';

// Create a logger for the FaithCircle backend
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  dir: './logs/faithcircle',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
  maxFiles: 30,
});

// Example of using the logger in a service
export class FaithCircleService {
  async initialize() {
    logger.info('FaithCircle service initializing', {
      environment: process.env.NODE_ENV,
      version: '1.0.0',
    });

    try {
      // Simulate some initialization logic
      await this.connectToDatabase();
      await this.setupRoutes();

      logger.info('FaithCircle service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize FaithCircle service', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async connectToDatabase() {
    logger.debug('Connecting to database...');
    // Simulate database connection
    await new Promise((resolve) => setTimeout(resolve, 100));
    logger.info('Database connection established');
  }

  private async setupRoutes() {
    logger.debug('Setting up API routes...');
    // Simulate route setup
    await new Promise((resolve) => setTimeout(resolve, 50));
    logger.info('API routes configured');
  }

  async handleUserLogin(userId: string, email: string) {
    logger.info('User login attempt', { userId, email });

    try {
      // Simulate login logic
      const success = Math.random() > 0.2; // 80% success rate

      if (success) {
        logger.info('User login successful', { userId, email });
        return { success: true, userId };
      } else {
        logger.warn('User login failed - invalid credentials', {
          userId,
          email,
        });
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      logger.error('User login error', {
        userId,
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

// Export the logger for use in other parts of the application
export { logger as faithCircleLogger };
