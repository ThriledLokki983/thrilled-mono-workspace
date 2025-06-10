/**
 * HTTP Exception class for handling HTTP errors
 */
export class HttpException extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = this.constructor.name;
    this.status = status;

    // Maintains proper stack trace (only in V8 environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * HTTP Exception interface for middleware compatibility
 * @deprecated Use HttpException class instead
 */
export interface HttpExceptionInterface extends Error {
  status?: number;
  statusCode?: number;
}
