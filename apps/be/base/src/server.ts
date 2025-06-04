import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { HealthRoute } from '@routes/health.route';
import { CoreDemoRoute } from '@routes/core-demo.route';
import { AuthPackageDemoRoute } from '@routes/auth-package-demo.route';
import { AuthPlugin } from '@/plugins/auth.plugin';
import { ValidateEnv } from '@utils/validateEnv';
import { logger } from '@utils/logger';

ValidateEnv();

// Create a shared AuthPlugin instance for demo purposes
const authPlugin = new AuthPlugin(logger);

const app = new App([
  new AuthRoute(),
  new UserRoute(),
  new HealthRoute(),
  new CoreDemoRoute(),
  new AuthPackageDemoRoute(authPlugin)
], authPlugin);

// Handle the async nature of the start method
app.start().catch(error => {
  logger.error(`Server failed to start: ${error.message}`);
  process.exit(1);
});
