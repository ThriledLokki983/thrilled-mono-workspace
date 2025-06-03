import { NextFunction, Request, Response } from 'express';
import { apiResponse, HttpStatusCodes, createPaginationMeta } from '@mono/be-core';

/**
 * Demonstration controller showing be/core integration features
 */
export class CoreDemoController {
  /**
   * Demo endpoint showing standardized response formatting
   */
  public demoResponse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sampleData = {
        id: 1,
        name: 'Sample Item',
        description: 'This response was formatted using be/core apiResponse utilities',
        timestamp: new Date().toISOString(),
      };

      apiResponse.success(res, 'Data retrieved successfully', sampleData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Demo endpoint showing pagination with meta information
   */
  public demoPagination = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const total = 100; // Simulated total count

      const sampleData = Array.from({ length: limit }, (_, i) => ({
        id: (page - 1) * limit + i + 1,
        name: `Item ${(page - 1) * limit + i + 1}`,
        description: `Sample item #${(page - 1) * limit + i + 1}`,
      }));

      const meta = createPaginationMeta({ page, limit, total });

      apiResponse.success(res, 'Paginated data retrieved successfully', sampleData, meta);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Demo endpoint showing different status codes and error handling
   */
  public demoStatusCodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.params;

      switch (type) {
        case 'created':
          apiResponse.created(res, 'Resource created successfully', { id: 123, name: 'New Resource' });
          break;
        case 'nocontent':
          apiResponse.noContent(res, 'Operation completed successfully');
          break;
        case 'badrequest':
          apiResponse.badRequest(res, 'Invalid request parameters', [
            { message: 'Name is required', field: 'name' },
            { message: 'Email format is invalid', field: 'email' }
          ]);
          break;
        case 'notfound':
          apiResponse.notFound(res, 'Resource not found');
          break;
        case 'conflict':
          apiResponse.conflict(res, 'Resource already exists');
          break;
        default:
          apiResponse.custom(res, HttpStatusCodes.OK, 'Choose a status type: created, nocontent, badrequest, notfound, conflict');
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Demo endpoint showing error scenarios
   */
  public demoError = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { errorType } = req.params;

      switch (errorType) {
        case 'validation':
          apiResponse.unprocessableEntity(res, 'Validation failed', [
            { message: 'Username must be at least 3 characters', field: 'username' },
            { message: 'Password must contain special characters', field: 'password' }
          ]);
          break;
        case 'unauthorized':
          apiResponse.unauthorized(res, 'Authentication required');
          break;
        case 'forbidden':
          apiResponse.forbidden(res, 'Access denied');
          break;
        case 'server':
          // This will trigger the error middleware
          throw new Error('Simulated server error');
        default:
          apiResponse.badRequest(res, 'Choose an error type: validation, unauthorized, forbidden, server');
      }
    } catch (error) {
      next(error);
    }
  };
}
