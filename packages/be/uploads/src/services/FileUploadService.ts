/**
 * Main File Upload Service
 * Orchestrates file uploads with validation, processing, and storage
 */
import { Request } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { 
  UploadConfig, 
  UploadedFile, 
  UploadResult, 
  StorageProvider,
  ImageProcessingOptions 
} from '../types/upload.types.js';
import { FileValidator } from '../utils/FileValidator.js';
import { ImageProcessor } from './ImageProcessor.js';
import { MockImageProcessor } from './MockImageProcessor.js';
import { LocalStorageProvider } from '../providers/LocalStorageProvider.js';

export class FileUploadService {
  private config: UploadConfig;
  private storageProvider!: StorageProvider;
  private fileValidator!: FileValidator;
  private imageProcessor!: ImageProcessor;
  private multerUpload!: multer.Multer;

  constructor(config: Partial<UploadConfig> = {}) {
    // Set default configuration
    this.config = {
      storage: {
        provider: 'local',
        basePath: './uploads',
        ...config.storage
      },
      security: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'],
        ...config.security
      },
      imageProcessing: {
        enabled: true,
        formats: ['webp', 'jpeg'],
        quality: 85,
        generateThumbnails: true,
        thumbnailSizes: [
          { name: 'small', width: 150, height: 150 },
          { name: 'medium', width: 300, height: 300 },
          { name: 'large', width: 800, height: 600 }
        ],
        ...config.imageProcessing
      },
      ...config
    };

    // Initialize components
    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Initialize storage provider
    switch (this.config.storage.provider) {
      case 'local':
        this.storageProvider = new LocalStorageProvider(this.config.storage.basePath);
        break;
      // Future: case 's3', case 'gcp', etc.
      default:
        this.storageProvider = new LocalStorageProvider(this.config.storage.basePath);
    }

    // Initialize utilities
    this.fileValidator = new FileValidator(this.config.security);
    
    // Try to use ImageProcessor, fall back to MockImageProcessor if Sharp is not available
    try {
      this.imageProcessor = new ImageProcessor(this.config.imageProcessing);
    } catch (error) {
      console.warn('Sharp not available, using MockImageProcessor:', error);
      this.imageProcessor = new MockImageProcessor(this.config.imageProcessing) as unknown as ImageProcessor;
    }

    // Initialize Multer
    this.initializeMulter();
  }

  private initializeMulter(): void {
    const storage = multer.memoryStorage(); // Use memory storage for validation first

    this.multerUpload = multer({
      storage,
      limits: {
        fileSize: this.config.security.maxFileSize,
        files: this.config.security.maxFiles || 10
      },
      fileFilter: (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        try {
          const validation = this.fileValidator.validateMimeType(file.mimetype, file.originalname);
          if (!validation.isValid) {
            return cb(new Error(validation.error || 'Invalid file type'));
          }
          cb(null, true);
        } catch (error) {
          cb(error as Error);
        }
      }
    });
  }

  /**
   * Get configured multer middleware for single file upload
   */
  public single(fieldName: string) {
    return this.multerUpload.single(fieldName) as unknown;
  }

  /**
   * Get configured multer middleware for multiple file upload
   */
  public array(fieldName: string, maxCount?: number) {
    return this.multerUpload.array(fieldName, maxCount) as unknown;
  }

  /**
   * Get configured multer middleware for multiple fields
   */
  public fields(fields: multer.Field[]) {
    return this.multerUpload.fields(fields) as unknown;
  }

  /**
   * Process uploaded files from Express request
   */
  public async processUpload(req: Request, options?: {
    folder?: string;
    overrideImageProcessing?: Partial<ImageProcessingOptions>;
  }): Promise<UploadResult> {
    try {
      const files = this.extractFilesFromRequest(req);
      
      if (files.length === 0) {
        return {
          success: false,
          error: 'No files provided',
          files: []
        };
      }

      const processedFiles: UploadedFile[] = [];
      const errors: string[] = [];

      for (const file of files) {
        try {
          const result = await this.processSingleFile(file, options);
          processedFiles.push(result);
        } catch (error) {
          errors.push(`Error processing ${file.originalname}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        files: processedFiles,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload processing failed',
        files: []
      };
    }
  }

  private extractFilesFromRequest(req: Request): Express.Multer.File[] {
    const files: Express.Multer.File[] = [];

    if (req.file) {
      files.push(req.file);
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        files.push(...req.files);
      } else {
        // req.files is { [fieldname: string]: Express.Multer.File[] }
        Object.values(req.files).forEach(fileArray => {
          files.push(...fileArray);
        });
      }
    }

    return files;
  }

  private async processSingleFile(
    file: Express.Multer.File, 
    options?: {
      folder?: string;
      overrideImageProcessing?: Partial<ImageProcessingOptions>;
    }
  ): Promise<UploadedFile> {
    // Generate unique ID and safe filename
    const fileId = uuidv4();
    const safeName = this.fileValidator.sanitizeFilename(file.originalname);
    
    // Validate file
    const validation = this.fileValidator.validateFile({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer
    });

    if (!validation.isValid) {
      throw new Error(validation.error || 'File validation failed');
    }

    // Check if it's an image
    const isImage = this.fileValidator.isImageFile(file.mimetype);
    
    // Prepare file metadata
    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName: file.originalname,
      safeName,
      mimetype: file.mimetype,
      size: file.size,
      isImage,
      uploadedAt: new Date(),
      folder: options?.folder
    };

    // Process and store file
    if (isImage && this.config.imageProcessing.enabled) {
      // Process image with image processor
      const imageProcessingOptions = {
        ...this.config.imageProcessing,
        ...options?.overrideImageProcessing
      };

      const processed = await this.imageProcessor.processImage(file.buffer, imageProcessingOptions);
      const stored = await this.storageProvider.saveFile(uploadedFile, file.buffer, processed);
      
      // Map processed results to expected format
      const variants = processed.variants.map(variant => ({
        name: variant.name,
        path: `${stored.path}_${variant.name}.${variant.format}`,
        url: stored.url ? `${stored.url}_${variant.name}.${variant.format}` : undefined,
        size: variant.size,
        format: variant.format
      }));

      const thumbnails = processed.thumbnails.map(thumb => ({
        name: thumb.name,
        path: `${stored.path}_${thumb.name}.jpg`,
        url: stored.url ? `${stored.url}_${thumb.name}.jpg` : undefined,
        size: thumb.size,
        width: thumb.width,
        height: thumb.height
      }));
      
      return {
        ...uploadedFile,
        ...stored,
        variants,
        thumbnails,
        metadata: processed.metadata
      };
    } else {
      // Store regular file
      const stored = await this.storageProvider.saveFile(uploadedFile, file.buffer);
      
      return {
        ...uploadedFile,
        ...stored
      };
    }
  }

  /**
   * Delete uploaded file(s)
   */
  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      return await this.storageProvider.deleteFile(fileId);
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get file information
   */
  public async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      return await this.storageProvider.getFileInfo(fileId);
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  public async fileExists(fileId: string): Promise<boolean> {
    try {
      return await this.storageProvider.fileExists(fileId);
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * Move file to different folder
   */
  public async moveFile(fileId: string, newFolder: string): Promise<boolean> {
    try {
      return await this.storageProvider.moveFile(fileId, newFolder);
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  /**
   * Copy file
   */
  public async copyFile(fileId: string, newFolder?: string): Promise<string | null> {
    try {
      return await this.storageProvider.copyFile(fileId, newFolder);
    } catch (error) {
      console.error('Error copying file:', error);
      return null;
    }
  }

  /**
   * Get file stream for download
   */
  public async getFileStream(fileId: string, variant?: string): Promise<NodeJS.ReadableStream | null> {
    try {
      return await this.storageProvider.getFileStream(fileId, variant);
    } catch (error) {
      console.error('Error getting file stream:', error);
      return null;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeComponents();
  }

  /**
   * Get current configuration
   */
  public getConfig(): UploadConfig {
    return { ...this.config };
  }

  /**
   * Clean up temporary files and perform maintenance
   */
  public async cleanup(): Promise<void> {
    try {
      await this.storageProvider.cleanup?.();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
