import { Express } from 'express';
import { BasePlugin } from '@mono/be-core';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

interface SwaggerPluginConfig {
  title?: string;
  version?: string;
  description?: string;
  apiPath?: string;
  docsPath?: string;
}

/**
 * Plugin for managing Swagger API documentation in the application.
 * This plugin provides a flexible way to generate and serve Swagger documentation
 * based on the defined API routes and data transfer objects (DTOs).
 */
export class SwaggerPlugin extends BasePlugin {
  readonly name = 'swagger';
  readonly version = '1.0.0';
  private config: SwaggerPluginConfig = {};

  protected async setup(config: SwaggerPluginConfig): Promise<void> {
    this.logger.info('Initializing Swagger plugin...');
    this.config = {
      title: 'HuisHelder API',
      version: '1.0.0',
      description: 'HuisHelder management API documentation',
      apiPath: '/api/v1',
      docsPath: '/api-docs',
      ...config,
    };
  }

  protected registerRoutes(app: Express): void {
    try {
      const options = {
        swaggerDefinition: {
          openapi: '3.0.0',
          info: {
            title: this.config.title,
            version: this.config.version,
            description: this.config.description,
            contact: {
              name: 'API Support',
              email: 'support@huishelder-api.com',
            },
            license: {
              name: 'MIT',
              url: 'https://opensource.org/licenses/MIT',
            },
          },
          servers: [
            {
              url: this.config.apiPath,
              description: 'API Server v1',
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
          security: [{ bearerAuth: [] }],
        },
        apis: [
          path.join(__dirname, '../routes', '*.js'),
          path.join(__dirname, '../routes', '*.ts'),
          path.join(__dirname, '../dtos', '*.js'),
          path.join(__dirname, '../dtos', '*.ts'),
          path.join(__dirname, '../interfaces', '*.js'),
          path.join(__dirname, '../interfaces', '*.ts'),
        ],
      };

      const specs = swaggerJSDoc(options);
      app.use(this.config.docsPath!, swaggerUi.serve as any);
      app.get(
        this.config.docsPath!,
        swaggerUi.setup(specs, {
          explorer: true,
          customCss: '.swagger-ui .topbar { display: none }',
          swaggerOptions: {
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
            persistAuthorization: true,
          },
        }) as any,
      );

      this.logger.info(`Swagger documentation available at ${this.config.docsPath}`);
    } catch (error) {
      this.logger.error('Swagger initialization failed', { error });
      // Continue even if Swagger fails - don't block app startup
    }
  }
}
