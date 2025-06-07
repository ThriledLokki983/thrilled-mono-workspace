import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../exceptions/httpException';
import { logger } from '../utils/logger';
import { apiResponse, HttpStatusCodes, ApiError } from '@mono/be-core';

// Express error middleware must have exactly 4 parameters
export const ErrorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || HttpStatusCodes.INTERNAL_SERVER_ERROR;
    const message: string = error.message || 'Something went wrong';

    // Log the error with request details
    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);

    // Structure the error in our standard format
    const errorDetail: ApiError = {
      message,
    };

    switch (status) {
      case HttpStatusCodes.BAD_REQUEST:
        apiResponse.badRequest(res, message, [errorDetail]);
        break;
      case HttpStatusCodes.UNAUTHORIZED:
        apiResponse.unauthorized(res, message);
        break;
      case HttpStatusCodes.FORBIDDEN:
        apiResponse.forbidden(res, message);
        break;
      case HttpStatusCodes.NOT_FOUND:
        apiResponse.notFound(res, message);
        break;
      case HttpStatusCodes.CONFLICT:
        apiResponse.conflict(res, message);
        break;
      default:
        apiResponse.serverError(res, message);
    }
  } catch (err) {
    // If an error occurs while handling the error, fall back to a simple response
    logger.error(`Error in ErrorMiddleware: ${err.message}`);
    res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 });
  }
};
