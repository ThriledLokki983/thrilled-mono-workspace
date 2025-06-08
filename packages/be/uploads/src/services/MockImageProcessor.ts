import path from 'path';
import fs from 'fs-extra';
import { ImageProcessingOptions, ProcessedImageResult } from '../types/upload.types.js';

/**
 * Mock image processing service for testing when Sharp is not available
 * This maintains the same interface as ImageProcessor but doesn't actually process images
 */
export class MockImageProcessor {
  private options: ImageProcessingOptions;

  constructor(options: ImageProcessingOptions = { enabled: false }) {
    this.options = options;
  }

  /**
   * Mock process an image - returns the original buffer without processing
   */
  async processImage(
    inputBuffer: Buffer,
    options?: Partial<ImageProcessingOptions>
  ): Promise<ProcessedImageResult> {
    const processingOptions = { ...this.options, ...options };
    
    // If processing is disabled, return minimal processed result
    if (!processingOptions.enabled) {
      return {
        optimized: {
          buffer: inputBuffer,
          format: 'original',
          size: inputBuffer.length
        },
        variants: [],
        thumbnails: [],
        metadata: {
          width: 800,
          height: 600,
          format: 'jpeg',
          hasAlpha: false
        }
      };
    }

    // Mock processing - just return the original buffer with proper structure
    const format = processingOptions.formats?.[0] || 'jpeg';
    const width = processingOptions.resize?.width || 800;
    const height = processingOptions.resize?.height || 600;

    return {
      optimized: {
        buffer: inputBuffer,
        format,
        size: inputBuffer.length
      },
      variants: processingOptions.formats?.slice(1).map(fmt => ({
        name: fmt,
        buffer: inputBuffer,
        format: fmt,
        size: inputBuffer.length
      })) || [],
      thumbnails: processingOptions.thumbnailSizes?.map(size => ({
        name: size.name,
        buffer: inputBuffer,
        size: inputBuffer.length,
        width: size.width,
        height: size.height
      })) || [],
      metadata: {
        width,
        height,
        format,
        hasAlpha: false
      }
    };
  }

  /**
   * Mock generate thumbnails - returns proper thumbnail structure
   */
  async generateThumbnails(
    inputBuffer: Buffer,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<Array<{ buffer: Buffer; filename: string; size: number }>> {
    // Mock thumbnail generation
    return sizes.map(size => ({
      buffer: inputBuffer,
      filename: `thumb_${size.suffix}`,
      size: inputBuffer.length
    }));
  }

  /**
   * Mock optimize image - returns original buffer
   */
  async optimizeImage(
    inputBuffer: Buffer,
    format = 'jpeg',
    quality = 85
  ): Promise<Buffer> {
    // Mock optimization - return original buffer
    return inputBuffer;
  }

  /**
   * Mock get image metadata - returns basic info
   */
  async getMetadata(inputBuffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    // Mock metadata - return default values
    return {
      width: 800,
      height: 600,
      format: 'jpeg',
      size: inputBuffer.length
    };
  }

  /**
   * Mock convert format - returns original buffer
   */
  async convertFormat(
    inputBuffer: Buffer,
    targetFormat: 'jpeg' | 'png' | 'webp'
  ): Promise<Buffer> {
    // Mock format conversion - return original buffer
    return inputBuffer;
  }

  /**
   * Mock save processed image to file
   */
  async saveProcessedImage(
    buffer: Buffer,
    outputPath: string,
    filename?: string
  ): Promise<string> {
    await fs.ensureDir(outputPath);
    const finalFilename = filename || `processed_${Date.now()}.jpg`;
    const filePath = path.join(outputPath, finalFilename);
    
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Mock process image for web - returns proper ProcessedImageResult structure
   */
  async processForWeb(
    inputBuffer: Buffer,
    maxWidth = 1920,
    quality = 85
  ): Promise<ProcessedImageResult> {
    // Mock web processing
    const actualWidth = Math.min(800, maxWidth);
    const actualHeight = 600;

    return {
      optimized: {
        buffer: inputBuffer,
        format: 'jpeg',
        size: inputBuffer.length
      },
      variants: [{
        name: 'webp',
        buffer: inputBuffer,
        format: 'webp',
        size: inputBuffer.length
      }],
      thumbnails: [],
      metadata: {
        width: actualWidth,
        height: actualHeight,
        format: 'jpeg',
        hasAlpha: false
      }
    };
  }
}
