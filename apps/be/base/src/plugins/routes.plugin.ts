import { Express } from 'express';
import { BasePlugin } from '@mono/be-core';
import { Routes } from '@interfaces/routes.interface';

interface RoutesPluginConfig {
  routes: Routes[];
  apiPrefix?: string;
}

export class RoutesPlugin extends BasePlugin {
  readonly name = 'routes';
  readonly version = '1.0.0';
  private routes: Routes[] = [];
  private apiPrefix = '/api/v1';

  protected async setup(config: RoutesPluginConfig): Promise<void> {
    this.logger.info('Initializing routes plugin...');
    this.routes = config.routes || [];
    this.apiPrefix = config.apiPrefix || '/api/v1';
  }

  protected registerRoutes(app: Express): void {
    this.logger.info(`Registering ${this.routes.length} route groups...`);

    this.routes.forEach(route => {
      app.use(this.apiPrefix, route.router);
      this.logger.debug(`Registered route group: ${route.constructor.name}`);
    });
  }
}
