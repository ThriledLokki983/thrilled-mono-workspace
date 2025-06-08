/**
 * Express router for file upload endpoints
 * Provides ready-to-use routes for common upload scenarios
 */
import { Router, Request, Response, NextFunction } from 'express';
import { FileUploadService } from '../services/FileUploadService.js';
import { 
  createSingleUploadMiddleware,
  createMultipleUploadMiddleware,
  createFileServingMiddleware,
  UploadMiddlewareOptions
} from '../middleware/upload.middleware.js';
import { UploadConfig } from '../types/upload.types.js';

export interface UploadRouterOptions {
  config?: Partial<UploadConfig>;
  basePath?: string;
  enableFileServing?: boolean;
  enableManagement?: boolean;
  authMiddleware?: (req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Create a complete upload router with all endpoints
 */
export function createUploadRouter(options: UploadRouterOptions = {}): Router {
  const router = Router();
  const uploadService = new FileUploadService(options.config);
  
  const middlewareOptions: UploadMiddlewareOptions = {
    config: options.config
  };

  // Apply auth middleware if provided
  if (options.authMiddleware) {
    router.use(options.authMiddleware);
  }

  // Single file upload endpoint
  const singleUploadMiddleware = createSingleUploadMiddleware('file', {
    ...middlewareOptions,
    folder: undefined, // Will be set from params
    onSuccess: async (result, req, res) => {
      const folder = req.params.folder;
      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          ...result.files[0],
          folder
        }
      });
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/single/:folder?', singleUploadMiddleware as any);

  // Multiple files upload endpoint
  const multipleUploadMiddleware = createMultipleUploadMiddleware('files', 10, {
    ...middlewareOptions,
    folder: undefined, // Will be set from params
    onSuccess: async (result, req, res) => {
      const folder = req.params.folder;
      res.status(200).json({
        success: true,
        message: `${result.files.length} files uploaded successfully`,
        data: result.files.map(file => ({
          ...file,
          folder
        }))
      });
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/multiple/:folder?', multipleUploadMiddleware as any);

  // Profile picture upload (single image with specific processing)
  const profilePictureMiddleware = createSingleUploadMiddleware('profilePicture', {
    ...middlewareOptions,
    config: {
      ...options.config,
      security: {
        ...options.config?.security,
        maxFileSize: 5 * 1024 * 1024, // 5MB for profile pictures
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
      },
      imageProcessing: {
        ...options.config?.imageProcessing,
        enabled: true,
        formats: ['webp', 'jpeg'],
        quality: 90,
        generateThumbnails: true,
        thumbnailSizes: [
          { name: 'avatar', width: 100, height: 100 },
          { name: 'small', width: 200, height: 200 },
          { name: 'medium', width: 400, height: 400 }
        ]
      }
    },
    folder: 'profiles'
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/profile-picture', profilePictureMiddleware as any);

  // Document upload endpoint
  const documentUploadMiddleware = createSingleUploadMiddleware('document', {
    ...middlewareOptions,
    config: {
      ...options.config,
      security: {
        ...options.config?.security,
        maxFileSize: 50 * 1024 * 1024, // 50MB for documents
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xls', '.xlsx']
      },
      imageProcessing: {
        enabled: false // No image processing for documents
      }
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/document/:folder?', documentUploadMiddleware as any);

  if (options.enableFileServing !== false) {
    // File serving endpoints
    router.get('/file/:fileId', createFileServingMiddleware(middlewareOptions));
    router.get('/file/:fileId/:variant', createFileServingMiddleware(middlewareOptions));
  }

  if (options.enableManagement !== false) {
    // File management endpoints
    
    // Get file information
    router.get('/info/:fileId', async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const fileInfo = await uploadService.getFileInfo(fileId);
        
        if (!fileInfo) {
          return res.status(404).json({
            success: false,
            message: 'File not found'
          });
        }

        return res.json({
          success: true,
          data: fileInfo
        });
      } catch {
        return res.status(500).json({
          success: false,
          message: 'Error retrieving file information'
        });
      }
    });

    // Delete file
    router.delete('/file/:fileId', async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const deleted = await uploadService.deleteFile(fileId);
        
        if (!deleted) {
          return res.status(404).json({
            success: false,
            message: 'File not found or could not be deleted'
          });
        }

        return res.json({
          success: true,
          message: 'File deleted successfully'
        });
      } catch {
        return res.status(500).json({
          success: false,
          message: 'Error deleting file'
        });
      }
    });

    // Move file
    router.put('/file/:fileId/move', async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const { folder } = req.body;
        
        if (!folder) {
          return res.status(400).json({
            success: false,
            message: 'Folder is required'
          });
        }

        const moved = await uploadService.moveFile(fileId, folder);
        
        if (!moved) {
          return res.status(404).json({
            success: false,
            message: 'File not found or could not be moved'
          });
        }

        return res.json({
          success: true,
          message: 'File moved successfully'
        });
      } catch {
        return res.status(500).json({
          success: false,
          message: 'Error moving file'
        });
      }
    });

    // Copy file
    router.post('/file/:fileId/copy', async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const { folder } = req.body;
        
        const newFileId = await uploadService.copyFile(fileId, folder);
        
        if (!newFileId) {
          return res.status(404).json({
            success: false,
            message: 'File not found or could not be copied'
          });
        }

        return res.json({
          success: true,
          message: 'File copied successfully',
          data: { newFileId }
        });
      } catch {
        return res.status(500).json({
          success: false,
          message: 'Error copying file'
        });
      }
    });

    // Check if file exists
    router.head('/file/:fileId', async (req: Request, res: Response) => {
      try {
        const { fileId } = req.params;
        const exists = await uploadService.fileExists(fileId);
        
        if (exists) {
          res.status(200).end();
        } else {
          res.status(404).end();
        }
      } catch {
        res.status(500).end();
      }
    });
  }

  // Health check endpoint
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Upload service is healthy',
      config: {
        provider: uploadService.getConfig().storage.provider,
        maxFileSize: uploadService.getConfig().security.maxFileSize,
        imageProcessing: uploadService.getConfig().imageProcessing.enabled
      }
    });
  });

  return router;
}

/**
 * Create a simple upload router with basic endpoints only
 */
export function createSimpleUploadRouter(options: UploadRouterOptions = {}): Router {
  const router = Router();
  
  const middlewareOptions: UploadMiddlewareOptions = {
    config: options.config
  };

  // Apply auth middleware if provided
  if (options.authMiddleware) {
    router.use(options.authMiddleware);
  }

  // Single file upload
  const simpleUploadMiddleware = createSingleUploadMiddleware('file', middlewareOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/upload', simpleUploadMiddleware as any);

  // Multiple files upload
  const simpleMultipleUploadMiddleware = createMultipleUploadMiddleware('files', 10, middlewareOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router.post('/upload-multiple', simpleMultipleUploadMiddleware as any);

  // File serving
  if (options.enableFileServing !== false) {
    router.get('/:fileId', createFileServingMiddleware(middlewareOptions));
  }

  return router;
}

export { Router };
