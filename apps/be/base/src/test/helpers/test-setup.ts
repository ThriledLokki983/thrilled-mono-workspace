// Test setup helper for properly initializing auth services
import { AuthPlugin } from '../../plugins/auth.plugin';
import { logger as customAppLogger } from '../../utils/logger';

/**
 * Setup AuthPlugin for testing by manually calling its setup method
 * This ensures auth services are registered with TypeDI before tests run
 */
export async function setupAuthForTesting(): Promise<AuthPlugin> {
  const authPlugin = new AuthPlugin(customAppLogger);

  // Access the protected setup method for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (authPlugin as any).setup();

  return authPlugin;
}

/**
 * Teardown auth services
 */
export async function teardownAuth(authPlugin: AuthPlugin): Promise<void> {
  // Access the protected teardown method for testing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (authPlugin as any).teardown();
}
