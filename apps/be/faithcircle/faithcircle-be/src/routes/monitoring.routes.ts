import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';
import { createMonitoringRoutes } from './monitoring.route';

export class MonitoringRoute implements Routes {
  public path = '/monitoring';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Mount the monitoring routes
    this.router.use('/', createMonitoringRoutes());
  }
}
