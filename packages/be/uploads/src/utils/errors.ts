/**
 * Custom error classes for file upload operations
 */

export class UploadError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code = 'UPLOAD_ERROR', statusCode = 400, details?: any) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UploadError);
    }
  }
}

export class ValidationError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class StorageError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'STORAGE_ERROR', 500, details);
    this.name = 'StorageError';
  }
}

export class ProcessingError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'PROCESSING_ERROR', 500, details);
    this.name = 'ProcessingError';
  }
}

export class SecurityError extends UploadError {
  constructor(message: string, details?: any) {
    super(message, 'SECURITY_ERROR', 403, details);
    this.name = 'SecurityError';
  }
}

export class FileSizeError extends ValidationError {
  constructor(maxSize: number, actualSize: number) {
    super(`File size ${actualSize} bytes exceeds maximum allowed size of ${maxSize} bytes`, {
      maxSize,
      actualSize
    });
    this.name = 'FileSizeError';
  }
}

export class FileTypeError extends ValidationError {
  constructor(allowedTypes: string[], receivedType: string) {
    super(`File type '${receivedType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`, {
      allowedTypes,
      receivedType
    });
    this.name = 'FileTypeError';
  }
}

export class FileNotFoundError extends UploadError {
  constructor(fileId: string) {
    super(`File with ID '${fileId}' not found`, 'FILE_NOT_FOUND', 404, { fileId });
    this.name = 'FileNotFoundError';
  }
}

/**
 * Error handler middleware for Express
 */
export function uploadErrorHandler(error: any, req: any, res: any, next: any) {
  // Handle multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: `File size exceeds the maximum allowed size`
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: 'Too many files',
      message: 'Number of files exceeds the maximum allowed count'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected field',
      message: 'Unexpected file field in request'
    });
  }

  // Handle our custom upload errors
  if (error instanceof UploadError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
      details: error.details
    });
  }

  // Handle other errors
  console.error('Upload error:', error);
  
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An internal error occurred during file upload'
  });
}

/**
 * Utility function to wrap async functions with error handling
 */
export function asyncHandler(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
