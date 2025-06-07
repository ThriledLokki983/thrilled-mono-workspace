import { App } from './app';
import { AuthRoute } from './routes/auth.route';
import { UserRoute } from './routes/users.route';
import { HealthRoute } from './routes/health.route';
import { AuthPlugin } from './/plugins/auth.plugin';
import { ValidateEnv } from './utils/validateEnv';
import { logger as customAppLogger } from './utils/logger';

ValidateEnv();

async function startApp() {
  try {
    // Create a shared AuthPlugin instance
    const authPlugin = new AuthPlugin(customAppLogger);

    // We need to manually set up the AuthPlugin to register services with TypeDI
    // Unfortunately, the setup() method is protected, so we need to work around this
    // by creating a workaround that can access the protected method
    const setupAuthPlugin = async (plugin: AuthPlugin) => {
      // Use any type to access the protected setup method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (plugin as any).setup();
    };

    await setupAuthPlugin(authPlugin);

    // Now create routes after AuthPlugin services are registered
    const routes = [
      new AuthRoute(),
      new UserRoute(),
      new HealthRoute(),
    ];

    // Create the full app with all plugins
    const app = new App(routes, authPlugin);

    // Start the app
    await app.start();
  } catch (error) {
    customAppLogger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Start the application
startApp();
