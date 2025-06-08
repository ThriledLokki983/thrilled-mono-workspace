import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, UploadConfig, UploadedFile, ProcessedImageResult } from '../types/upload.types.js';
import { FileValidator } from '../utils/FileValidator.js';
import { ImageProcessor } from '../services/ImageProcessor.js';

/**
 * Local file storage provider
 */
export class LocalStorageProvider implements StorageProvider {
  private baseDirectory: string;

  constructor(baseDirectory: string) {
    this.baseDirectory = baseDirectory;
  }

  /**
   * Save file to storage (implementing StorageProvider interface)
   */
  async saveFile(file: UploadedFile, buffer: Buffer, processed?: ProcessedImageResult): Promise<Partial<UploadedFile>> {
    try {
      // Ensure base directory exists
      await fs.ensureDir(this.baseDirectory);

      // Generate filename if not provided
      const filename = file.filename || file.safeName || file.originalName;
      const filePath = path.join(this.baseDirectory, filename);

      // Save file
      await fs.writeFile(filePath, buffer);

      // Get file stats
      const stats = await fs.stat(filePath);

      const result: Partial<UploadedFile> = {
        path: filePath,
        url: path.relative(this.baseDirectory, filePath),
        size: stats.size
      };

      // Add processed image data if available
      if (processed) {
        // Save variants and thumbnails to separate files and create proper metadata
        if (processed.variants) {
          result.variants = [];
          for (const variant of processed.variants) {
            const variantPath = path.join(this.baseDirectory, 'variants', `${filename}_${variant.name}.${variant.format}`);
            await fs.ensureDir(path.dirname(variantPath));
            await fs.writeFile(variantPath, variant.buffer);
            result.variants.push({
              name: variant.name,
              path: variantPath,
              url: path.relative(this.baseDirectory, variantPath),
              size: variant.size,
              format: variant.format
            });
          }
        }
        
        if (processed.thumbnails) {
          result.thumbnails = [];
          for (const thumbnail of processed.thumbnails) {
            const thumbPath = path.join(this.baseDirectory, 'thumbnails', `${filename}_${thumbnail.name}.jpg`);
            await fs.ensureDir(path.dirname(thumbPath));
            await fs.writeFile(thumbPath, thumbnail.buffer);
            result.thumbnails.push({
              name: thumbnail.name,
              path: thumbPath,
              url: path.relative(this.baseDirectory, thumbPath),
              size: thumbnail.size,
              width: thumbnail.width,
              height: thumbnail.height
            });
          }
        }
        
        result.metadata = { ...result.metadata, ...processed.metadata };
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // For now, assume fileId is the filename or use a mapping
      const filePath = path.join(this.baseDirectory, fileId);
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Check if file exists by ID
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDirectory, fileId);
      return await fs.pathExists(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file information by ID
   */
  async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      const filePath = path.join(this.baseDirectory, fileId);
      if (await fs.pathExists(filePath)) {
        const stats = await fs.stat(filePath);
        // This is a simplified implementation - in practice you'd store metadata separately
        return {
          id: fileId,
          originalName: fileId,
          safeName: fileId,
          filename: fileId,
          path: filePath,
          size: stats.size,
          mimetype: 'application/octet-stream', // Default - would be stored in metadata
          isImage: false, // Would be determined from stored metadata
          uploadedAt: stats.birthtime
        } as UploadedFile;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Move file to new folder
   */
  async moveFile(fileId: string, newFolder: string): Promise<boolean> {
    try {
      const oldPath = path.join(this.baseDirectory, fileId);
      const newPath = path.join(this.baseDirectory, newFolder, fileId);
      
      await fs.ensureDir(path.dirname(newPath));
      await fs.move(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  /**
   * Copy file to new location
   */
  async copyFile(fileId: string, newFolder?: string): Promise<string | null> {
    try {
      const sourcePath = path.join(this.baseDirectory, fileId);
      const newFileId = `${uuidv4()}_${fileId}`;
      const destinationPath = newFolder 
        ? path.join(this.baseDirectory, newFolder, newFileId)
        : path.join(this.baseDirectory, newFileId);
      
      await fs.ensureDir(path.dirname(destinationPath));
      await fs.copy(sourcePath, destinationPath);
      return newFileId;
    } catch (error) {
      console.error('Error copying file:', error);
      return null;
    }
  }

  /**
   * Get file stream for reading
   */
  async getFileStream(fileId: string, variant?: string): Promise<NodeJS.ReadableStream | null> {
    try {
      let filePath = path.join(this.baseDirectory, fileId);
      
      // Handle variants (thumbnails, different formats, etc.)
      if (variant) {
        const baseName = path.basename(fileId, path.extname(fileId));
        const variantPath = path.join(this.baseDirectory, 'variants', `${baseName}_${variant}`);
        if (await fs.pathExists(variantPath)) {
          filePath = variantPath;
        }
      }
      
      if (await fs.pathExists(filePath)) {
        return fs.createReadStream(filePath);
      }
      return null;
    } catch (error) {
      console.error('Error getting file stream:', error);
      return null;
    }
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(): Promise<void> {
    try {
      // Clean up any temporary files or perform maintenance
      // This is implementation-specific
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Legacy methods for backward compatibility
  async save(file: Express.Multer.File, config: UploadConfig): Promise<UploadedFile> {
    try {
      // Ensure base directory exists
      await fs.ensureDir(this.baseDirectory);

      // Generate unique filename
      const fileId = uuidv4();
      const extension = FileValidator.getFileExtension(file.originalname);
      const filename = config.storage.generateUniqueNames 
        ? `${fileId}${extension}`
        : config.storage.preserveOriginalName
          ? FileValidator.sanitizeFilename(file.originalname)
          : FileValidator.generateSafeFilename(file.originalname);

      const filePath = path.join(this.baseDirectory, filename);

      // Save original file
      if (file.buffer) {
        await fs.writeFile(filePath, file.buffer);
      } else if (file.path) {
        await fs.move(file.path, filePath);
      } else {
        throw new Error('No file buffer or path provided');
      }

      // Create uploaded file object
      const uploadedFile: UploadedFile = {
        id: fileId,
        originalName: file.originalname,
        safeName: FileValidator.sanitizeFilename(file.originalname),
        filename,
        path: filePath,
        size: file.size,
        mimetype: file.mimetype,
        extension,
        isImage: FileValidator.isImage(file),
        uploadedAt: new Date(),
        metadata: {
          encoding: file.encoding,
          fieldname: file.fieldname
        }
      };

      // Process image if it's an image and processing is enabled
      if (FileValidator.isImage(file) && config.imageProcessing?.enabled) {
        await this.processImage(uploadedFile, config);
      }

      return uploadedFile;
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image (optimization, thumbnails, etc.)
   */
  private async processImage(uploadedFile: UploadedFile, config: UploadConfig): Promise<void> {
    if (!config.imageProcessing?.enabled || !uploadedFile.path) return;

    const processing = config.imageProcessing;
    const inputPath = uploadedFile.path;
    const fileDir = path.dirname(inputPath);
    const fileBaseName = path.basename(inputPath, uploadedFile.extension || '');

    try {
      // Optimize original image if quality is specified
      if (processing.quality && processing.quality < 100) {
        const optimizedPath = path.join(fileDir, `${fileBaseName}_optimized${uploadedFile.extension || ''}`);
        await ImageProcessor.optimizeForWeb(inputPath, optimizedPath, processing.quality);
        
        // Replace original with optimized version
        await fs.move(optimizedPath, inputPath, { overwrite: true });
        
        // Update file size
        const stats = await fs.stat(inputPath);
        uploadedFile.size = stats.size;
      }

      // Generate thumbnails if specified
      if (processing.thumbnailSizes && processing.thumbnailSizes.length > 0) {
        const thumbnailsDir = path.join(fileDir, 'thumbnails');
        await fs.ensureDir(thumbnailsDir);

        const thumbnails = await ImageProcessor.generateThumbnails(
          inputPath,
          thumbnailsDir,
          processing.thumbnailSizes
        );

        // Convert to proper format
        uploadedFile.thumbnails = thumbnails.map(thumb => ({
          name: thumb.name,
          path: thumb.path,
          url: path.relative(this.baseDirectory, thumb.path),
          size: thumb.size,
          width: 0, // Would need to be extracted from metadata
          height: 0  // Would need to be extracted from metadata
        }));
      }

      // Convert to different formats if specified
      if (processing.formats && processing.formats.length > 0) {
        const formatsDir = path.join(fileDir, 'formats');
        await fs.ensureDir(formatsDir);

        for (const format of processing.formats) {
          const formatPath = path.join(formatsDir, `${fileBaseName}.${format}`);
          await ImageProcessor.convertFormat(inputPath, formatPath, format, processing.quality);
        }
      }

      // Get and store image metadata
      if (FileValidator.isImage({ mimetype: uploadedFile.mimetype } as Express.Multer.File)) {
        const metadata = await ImageProcessor.getImageMetadata(inputPath);
        uploadedFile.metadata = {
          ...uploadedFile.metadata,
          imageMetadata: {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            channels: metadata.channels,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha
          }
        };
      }
    } catch (error) {
      console.error('Error processing image:', error);
      // Don't throw error here, as the file was already saved successfully
    }
  }
}
