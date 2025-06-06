import { Response } from 'express';
import { HttpStatusCodes, ApiResponse, ApiError } from '../types';

/**
 * Creates a standardized API response
 */
export function formatResponse<T>(
  res: Response,
  statusCode: HttpStatusCodes,
  message: string,
  data?: T,
  meta?: ApiResponse<T>['meta'],
  errors?: ApiError[]
): Response<ApiResponse<T>> {
  const success = statusCode >= 200 && statusCode < 400;

  const response: ApiResponse<T> = {
    success,
    message,
    statusCode,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  } else if (Array.isArray(data)) {
    // Automatically add count when returning arrays
    response.meta = { count: data.length };
  }

  if (errors && errors.length > 0) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

/**
 * Helper for pagination metadata
 * */
export function createPaginationMeta(options: {
  page: number;
  limit: number;
  total?: number;
}): ApiResponse<unknown>['meta'] {
  const { page, limit, total } = options;
  return {
    page,
    limit,
    total: total || 0,
    pages: total ? Math.ceil(total / limit) : 0,
  };
}

/**
 * Common response helper methods
 */
export const apiResponse = {
  success: <T>(
    res: Response,
    message = 'Success',
    data?: T,
    meta?: ApiResponse<T>['meta']
  ) => formatResponse(res, HttpStatusCodes.OK, message, data, meta),
  created: <T>(res: Response, message = 'Created successfully', data?: T) =>
    formatResponse(res, HttpStatusCodes.CREATED, message, data),
  noContent: (res: Response, message = 'No content') =>
    formatResponse(res, HttpStatusCodes.NO_CONTENT, message),
  badRequest: (res: Response, message = 'Bad request', errors?: ApiError[]) =>
    formatResponse(
      res,
      HttpStatusCodes.BAD_REQUEST,
      message,
      undefined,
      undefined,
      errors
    ),
  unauthorized: (res: Response, message = 'Unauthorized') =>
    formatResponse(res, HttpStatusCodes.UNAUTHORIZED, message),
  forbidden: (res: Response, message = 'Forbidden') =>
    formatResponse(res, HttpStatusCodes.FORBIDDEN, message),
  notFound: (res: Response, message = 'Not found') =>
    formatResponse(res, HttpStatusCodes.NOT_FOUND, message),
  conflict: (res: Response, message = 'Conflict') =>
    formatResponse(res, HttpStatusCodes.CONFLICT, message),
  unprocessableEntity: (
    res: Response,
    message = 'Unprocessable entity',
    errors?: ApiError[]
  ) =>
    formatResponse(
      res,
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
      message,
      undefined,
      undefined,
      errors
    ),
  serverError: (res: Response, message = 'Internal server error') =>
    formatResponse(res, HttpStatusCodes.INTERNAL_SERVER_ERROR, message),
  serviceUnavailable: (res: Response, message = 'Service unavailable') =>
    formatResponse(res, HttpStatusCodes.SERVICE_UNAVAILABLE, message),
  custom: <T>(
    res: Response,
    statusCode: HttpStatusCodes,
    message: string,
    data?: T,
    meta?: ApiResponse<T>['meta'],
    errors?: ApiError[]
  ) => formatResponse(res, statusCode, message, data, meta, errors),
};
