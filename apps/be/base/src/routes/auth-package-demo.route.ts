import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { AuthPackageDemoController } from '@controllers/auth-package-demo.controller';
import { AuthPlugin } from '@/plugins/auth.plugin';

/**
 * Demo routes to showcase @thrilled/be-auth package functionality
 */
export class AuthPackageDemoRoute implements Routes {
  public path = '/auth-demo';
  public router = Router();
  private authDemoController: AuthPackageDemoController;

  constructor(authPlugin: AuthPlugin) {
    // Initialize controller with auth services from the plugin
    this.authDemoController = new AuthPackageDemoController(
      authPlugin.getJWTProvider(),
      authPlugin.getPasswordManager(), 
      authPlugin.getSessionManager(),
      authPlugin.getRBACManager()
    );
    
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Password validation demo
    this.router.post(
      `${this.path}/validate-password`, 
      this.authDemoController.validatePassword
    );

    // JWT token generation demo
    this.router.post(
      `${this.path}/generate-token`, 
      this.authDemoController.generateDemoToken
    );

    // Session management demo
    this.router.post(
      `${this.path}/create-session`, 
      this.authDemoController.createDemoSession
    );

    // RBAC demonstration
    this.router.post(
      `${this.path}/demonstrate-rbac`, 
      this.authDemoController.demonstrateRBAC
    );

    // Complete auth flow demo
    this.router.post(
      `${this.path}/complete-flow`, 
      this.authDemoController.completeAuthFlow
    );

    // Health check for auth package
    this.router.get(`${this.path}/health`, (req, res) => {
      res.json({
        success: true,
        message: 'Auth package demo routes are working',
        timestamp: new Date().toISOString(),
        availableEndpoints: [
          'POST /auth-demo/validate-password',
          'POST /auth-demo/generate-token', 
          'POST /auth-demo/create-session',
          'POST /auth-demo/demonstrate-rbac',
          'POST /auth-demo/complete-flow',
          'GET /auth-demo/health'
        ]
      });
    });
  }
}
