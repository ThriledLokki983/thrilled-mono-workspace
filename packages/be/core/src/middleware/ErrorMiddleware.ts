import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logging/Logger';
import { HttpStatusCodes } from '../types';
import { apiResponse } from '../plugins/responseFormatter';
import { HttpException } from '@thrilled/be-types';

export class ErrorMiddleware {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Global error handler middleware
   */
  handle() {
    return (
      error: HttpException,
      req: Request,
      res: Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: NextFunction
    ) => {
      try {
        // Handle both HttpException class and legacy error objects with statusCode
        const statusCode = 'statusCode' in error ? (error as unknown as { statusCode: number }).statusCode : undefined;
        const status: number =
          error.status ||
          statusCode ||
          HttpStatusCodes.INTERNAL_SERVER_ERROR;
        const message: string = error.message || 'Something went wrong';
        const requestId = (req as Request & { requestId?: string }).requestId;

        // Log the error with request context
        this.logger.error(error, {
          method: req.method,
          url: req.url,
          requestId,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });

        // Don't expose internal errors in production
        const responseMessage =
          status === HttpStatusCodes.INTERNAL_SERVER_ERROR &&
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : message;

        // Create meta data for development debugging
        const meta = {
          ...(requestId && { requestId }),
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
          }),
        };

        // Create error objects for validation errors
        const errors =
          requestId || (process.env.NODE_ENV === 'development' && error.stack)
            ? [
                {
                  message: responseMessage,
                  ...(requestId && { field: 'requestId' }),
                },
              ]
            : undefined;

        switch (status) {
          case HttpStatusCodes.BAD_REQUEST:
            apiResponse.custom(
              res,
              status,
              responseMessage,
              undefined,
              meta,
              errors
            );
            break;
          case HttpStatusCodes.UNAUTHORIZED:
            apiResponse.custom(res, status, responseMessage, undefined, meta);
            break;
          case HttpStatusCodes.FORBIDDEN:
            apiResponse.custom(res, status, responseMessage, undefined, meta);
            break;
          case HttpStatusCodes.NOT_FOUND:
            apiResponse.custom(res, status, responseMessage, undefined, meta);
            break;
          case HttpStatusCodes.CONFLICT:
            apiResponse.custom(res, status, responseMessage, undefined, meta);
            break;
          case HttpStatusCodes.UNPROCESSABLE_ENTITY:
            apiResponse.custom(
              res,
              status,
              responseMessage,
              undefined,
              meta,
              errors
            );
            break;
          default:
            apiResponse.custom(res, status, responseMessage, undefined, meta);
        }
      } catch (err) {
        // Fallback error handling
        this.logger.error(err as Error, { context: 'ErrorMiddleware.handle' });
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          statusCode: 500,
        });
      }
    };
  }

  /**
   * 404 Not Found handler
   */
  notFound() {
    return (req: Request, res: Response) => {
      const requestId = (req as Request & { requestId?: string }).requestId;

      res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found`,
        statusCode: 404,
        ...(requestId && { requestId }),
      });
    };
  }
}
