import { Router } from 'express';
import { CoreDemoController } from '@controllers/core-demo.controller';
import { Routes } from '@interfaces/routes.interface';

export class CoreDemoRoute implements Routes {
  public path = '/core-demo';
  public router = Router();
  public coreDemo = new CoreDemoController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @swagger
     * /core-demo/response:
     *   get:
     *     tags: [Core Demo]
     *     summary: Demo standardized response formatting
     *     responses:
     *       200:
     *         description: Success response using be/core formatting
     */
    this.router.get(`${this.path}/response`, this.coreDemo.demoResponse);

    /**
     * @swagger
     * /core-demo/pagination:
     *   get:
     *     tags: [Core Demo]
     *     summary: Demo pagination with meta information
     *     parameters:
     *       - name: page
     *         in: query
     *         description: Page number
     *         schema:
     *           type: integer
     *           default: 1
     *       - name: limit
     *         in: query
     *         description: Items per page
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: Paginated response with meta information
     */
    this.router.get(`${this.path}/pagination`, this.coreDemo.demoPagination);

    /**
     * @swagger
     * /core-demo/status/{type}:
     *   get:
     *     tags: [Core Demo]
     *     summary: Demo different HTTP status codes
     *     parameters:
     *       - name: type
     *         in: path
     *         required: true
     *         description: Status code type (created, nocontent, badrequest, notfound, conflict)
     *         schema:
     *           type: string
     *           enum: [created, nocontent, badrequest, notfound, conflict]
     *     responses:
     *       200:
     *         description: Various status code responses
     */
    this.router.get(`${this.path}/status/:type`, this.coreDemo.demoStatusCodes);

    /**
     * @swagger
     * /core-demo/error/{errorType}:
     *   get:
     *     tags: [Core Demo]
     *     summary: Demo error handling scenarios
     *     parameters:
     *       - name: errorType
     *         in: path
     *         required: true
     *         description: Error type (validation, unauthorized, forbidden, server)
     *         schema:
     *           type: string
     *           enum: [validation, unauthorized, forbidden, server]
     *     responses:
     *       400:
     *         description: Various error responses
     */
    this.router.get(`${this.path}/error/:errorType`, this.coreDemo.demoError);
  }
}
