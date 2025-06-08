/**
 * Express middleware for file uploads
 * Provides convenient middleware functions for different upload scenarios
 */
import { Request, Response, NextFunction } from 'express';
import { FileUploadService } from '../services/FileUploadService.js';
import { UploadConfig, UploadResult } from '../types/upload.types.js';

export interface UploadMiddlewareOptions {
  config?: Partial<UploadConfig>;
  folder?: string;
  onSuccess?: (result: UploadResult, req: Request, res: Response) => void | Promise<void>;
  onError?: (error: Error, req: Request, res: Response) => void | Promise<void>;
}

// Extend Request interface to include uploadResult
interface RequestWithUpload extends Request {
  uploadResult?: UploadResult;
}

/**
 * Create upload middleware for single file upload
 */
export function createSingleUploadMiddleware(
  fieldName: string,
  options: UploadMiddlewareOptions = {}
) {
  const uploadService = new FileUploadService(options.config);

  return [
    uploadService.single(fieldName),
    async (req: Request, res: Response) => {
      try {
        const result = await uploadService.processUpload(req, {
          folder: options.folder
        });

        // Attach result to request for downstream use
        (req as RequestWithUpload).uploadResult = result;

        if (result.success) {
          if (options.onSuccess) {
            await options.onSuccess(result, req, res);
            return;
          } else {
            // Default success response
            return res.status(200).json({
              success: true,
              message: 'File uploaded successfully',
              data: result.files[0]
            });
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        if (options.onError) {
          await options.onError(error as Error, req, res);
          return;
        } else {
          // Default error response
          return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }
    }
  ];
}

/**
 * Create upload middleware for multiple file upload
 */
export function createMultipleUploadMiddleware(
  fieldName: string,
  maxCount = 10,
  options: UploadMiddlewareOptions = {}
) {
  const uploadService = new FileUploadService(options.config);

  return [
    uploadService.array(fieldName, maxCount),
    async (req: Request, res: Response) => {
      try {
        const result = await uploadService.processUpload(req, {
          folder: options.folder
        });

        // Attach result to request for downstream use
        (req as RequestWithUpload).uploadResult = result;

        if (result.success) {
          if (options.onSuccess) {
            await options.onSuccess(result, req, res);
            return;
          } else {
            // Default success response
            return res.status(200).json({
              success: true,
              message: `${result.files.length} files uploaded successfully`,
              data: result.files
            });
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        if (options.onError) {
          await options.onError(error as Error, req, res);
          return;
        } else {
          // Default error response
          return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }
    }
  ];
}

/**
 * Create upload middleware for multiple fields
 */
export function createFieldsUploadMiddleware(
  fields: { name: string; maxCount?: number }[],
  options: UploadMiddlewareOptions = {}
) {
  const uploadService = new FileUploadService(options.config);
  const multerFields = fields.map(field => ({
    name: field.name,
    maxCount: field.maxCount || 1
  }));

  return [
    uploadService.fields(multerFields),
    async (req: Request, res: Response) => {
      try {
        const result = await uploadService.processUpload(req, {
          folder: options.folder
        });

        // Attach result to request for downstream use
        (req as RequestWithUpload).uploadResult = result;

        if (result.success) {
          if (options.onSuccess) {
            await options.onSuccess(result, req, res);
            return;
          } else {
            // Default success response
            return res.status(200).json({
              success: true,
              message: `${result.files.length} files uploaded successfully`,
              data: result.files
            });
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        if (options.onError) {
          await options.onError(error as Error, req, res);
          return;
        } else {
          // Default error response
          return res.status(400).json({
            success: false,
            message: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }
    }
  ];
}

/**
 * Generic upload middleware that can handle any upload type
 * Requires manual processing of files
 */
export function createUploadMiddleware(options: UploadMiddlewareOptions = {}) {
  const uploadService = new FileUploadService(options.config);

  return {
    service: uploadService,
    
    // Middleware for processing after multer has parsed files
    process: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await uploadService.processUpload(req, {
          folder: options.folder
        });

        // Attach result to request for downstream use
        (req as RequestWithUpload).uploadResult = result;

        if (result.success) {
          if (options.onSuccess) {
            await options.onSuccess(result, req, res);
          } else {
            next(); // Let the route handle the response
          }
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        if (options.onError) {
          await options.onError(error as Error, req, res);
        } else {
          next(error); // Pass error to error handler
        }
      }
    }
  };
}

/**
 * Middleware to serve uploaded files
 */
export function createFileServingMiddleware(options: UploadMiddlewareOptions = {}) {
  const uploadService = new FileUploadService(options.config);

  return async (req: Request, res: Response) => {
    try {
      const { fileId, variant } = req.params;
      
      if (!fileId) {
        return res.status(400).json({
          success: false,
          message: 'File ID is required'
        });
      }

      // Check if file exists
      const fileExists = await uploadService.fileExists(fileId);
      if (!fileExists) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Get file info for headers
      const fileInfo = await uploadService.getFileInfo(fileId);
      if (!fileInfo) {
        return res.status(404).json({
          success: false,
          message: 'File information not found'
        });
      }

      // Get file stream
      const stream = await uploadService.getFileStream(fileId, variant);
      if (!stream) {
        return res.status(500).json({
          success: false,
          message: 'Unable to retrieve file stream'
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', fileInfo.mimetype);
      res.setHeader('Content-Disposition', `inline; filename="${fileInfo.safeName}"`);
      
      if (fileInfo.size) {
        res.setHeader('Content-Length', fileInfo.size);
      }

      // Cache headers for static files
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.setHeader('ETag', fileId);

      // Stream the file
      stream.pipe(res);

      stream.on('error', (error) => {
        console.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming file'
          });
        }
      });

      // Return to indicate this code path completes successfully
      return;

    } catch (error) {
      console.error('Error serving file:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

/**
 * Type augmentation for Express Request to include upload results
 */
declare module 'express-serve-static-core' {
  interface Request {
    uploadResult?: UploadResult;
  }
}
