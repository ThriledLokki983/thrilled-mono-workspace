import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import { ImageProcessingOptions, ProcessedImageResult } from '../types/upload.types.js';

/**
 * Image processing service using Sharp
 */
export class ImageProcessor {
  private options: ImageProcessingOptions;

  constructor(options: ImageProcessingOptions = { enabled: false }) {
    this.options = options;
  }

  /**
   * Process an image with various transformations
   */
  async processImage(
    inputBuffer: Buffer,
    options?: Partial<ImageProcessingOptions>
  ): Promise<ProcessedImageResult> {
    const processingOptions = { ...this.options, ...options };
    let processor = sharp(inputBuffer);

    // Apply resize if specified
    if (processingOptions.resize) {
      processor = processor.resize({
        width: processingOptions.resize.width,
        height: processingOptions.resize.height,
        fit: processingOptions.resize.fit || 'cover',
        withoutEnlargement: true
      });
    }

    // Set quality and format
    const quality = processingOptions.quality || 85;
    const formats = processingOptions.formats || ['jpeg'];
    const format = formats[0];

    if (format) {
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality });
          break;
        case 'png':
          processor = processor.png({ quality: Math.round(quality / 10) });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
        case 'avif':
          processor = processor.avif({ quality });
          break;
      }
    }

    const optimizedBuffer = await processor.toBuffer();
    const metadata = await sharp(inputBuffer).metadata();
    
    const result: ProcessedImageResult = {
      optimized: {
        buffer: optimizedBuffer,
        format: format || 'jpeg',
        size: optimizedBuffer.length
      },
      variants: [], // Initialize as empty array
      thumbnails: [], // Initialize as empty array
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        hasAlpha: metadata.hasAlpha || false,
        orientation: metadata.orientation
      }
    };

    // Generate thumbnails if enabled
    if (processingOptions.generateThumbnails && processingOptions.thumbnailSizes) {
      result.thumbnails = await this.generateThumbnails(inputBuffer, processingOptions.thumbnailSizes);
    }

    return result;
  }

  /**
   * Generate thumbnails for an image
   */
  private async generateThumbnails(
    inputBuffer: Buffer,
    thumbnailSizes: Array<{ name: string; width: number; height: number; quality?: number }>
  ): Promise<Array<{ name: string; buffer: Buffer; width: number; height: number; size: number }>> {
    const thumbnails = [];
    
    for (const size of thumbnailSizes) {
      const processor = sharp(inputBuffer)
        .resize(size.width, size.height, { fit: 'cover' })
        .jpeg({ quality: size.quality || 85 });
        
      const buffer = await processor.toBuffer();
      
      thumbnails.push({
        name: size.name,
        buffer,
        width: size.width,
        height: size.height,
        size: buffer.length
      });
    }
    
    return thumbnails;
  }

  /**
   * Process an image file (static method for backwards compatibility)
   */
  static async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions = { enabled: false }
  ): Promise<void> {
    let processor = sharp(inputPath);

    // Apply resize if specified
    if (options.resize) {
      processor = processor.resize({
        width: options.resize.width,
        height: options.resize.height,
        fit: options.resize.fit || 'cover',
        withoutEnlargement: true
      });
    }

    // Set quality if specified
    if (options.quality) {
      processor = processor.jpeg({ quality: options.quality });
    }

    // Convert format if specified
    const formats = options.formats || ['jpeg'];
    const format = formats[0];
    if (format) {
      switch (format) {
        case 'jpeg':
          processor = processor.jpeg({ quality: options.quality || 80 });
          break;
        case 'png':
          processor = processor.png({ quality: Math.round((options.quality || 80) / 10) });
          break;
        case 'webp':
          processor = processor.webp({ quality: options.quality || 80 });
          break;
        case 'avif':
          processor = processor.avif({ quality: options.quality || 80 });
          break;
      }
    }

    // Ensure output directory exists
    await fs.ensureDir(path.dirname(outputPath));

    // Save processed image
    await processor.toFile(outputPath);
  }

  /**
   * Generate thumbnails for an image
   */
  static async generateThumbnails(
    inputPath: string,
    outputDir: string,
    thumbnails: Array<{
      name: string;
      width: number;
      height: number;
      quality?: number;
    }>
  ): Promise<Array<{ name: string; path: string; size: number }>> {
    const results: Array<{ name: string; path: string; size: number }> = [];

    await fs.ensureDir(outputDir);

    for (const thumbnail of thumbnails) {
      const outputPath = path.join(outputDir, thumbnail.name);
      
      await sharp(inputPath)
        .resize({
          width: thumbnail.width,
          height: thumbnail.height,
          fit: 'cover',
          withoutEnlargement: true
        })
        .jpeg({ quality: thumbnail.quality || 80 })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      results.push({
        name: thumbnail.name,
        path: outputPath,
        size: stats.size
      });
    }

    return results;
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    return await sharp(imagePath).metadata();
  }

  /**
   * Optimize image for web
   */
  static async optimizeForWeb(
    inputPath: string,
    outputPath: string,
    quality = 85
  ): Promise<void> {
    const metadata = await sharp(inputPath).metadata();
    
    let processor = sharp(inputPath);

    // Reduce size if too large
    if (metadata.width && metadata.width > 1920) {
      processor = processor.resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Convert to appropriate format with optimization
    if (metadata.format === 'png') {
      processor = processor.png({
        quality,
        compressionLevel: 9,
        progressive: true
      });
    } else {
      processor = processor.jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      });
    }

    await fs.ensureDir(path.dirname(outputPath));
    await processor.toFile(outputPath);
  }

  /**
   * Create a watermark on an image
   */
  static async addWatermark(
    inputPath: string,
    outputPath: string,
    watermarkPath: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' = 'bottom-right',
    opacity = 0.5
  ): Promise<void> {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const watermark = await sharp(watermarkPath)
      .resize({
        width: Math.floor((metadata.width || 800) * 0.2),
        height: Math.floor((metadata.height || 600) * 0.2),
        fit: 'inside'
      })
      .png({ palette: true })
      .composite([{ input: Buffer.alloc(4, Math.round(opacity * 255)), raw: { width: 1, height: 1, channels: 4 }, blend: 'multiply' }])
      .toBuffer();

    let gravity: keyof sharp.GravityEnum;
    switch (position) {
      case 'top-left':
        gravity = 'northwest';
        break;
      case 'top-right':
        gravity = 'northeast';
        break;
      case 'bottom-left':
        gravity = 'southwest';
        break;
      case 'bottom-right':
        gravity = 'southeast';
        break;
      case 'center':
        gravity = 'center';
        break;
      default:
        gravity = 'southeast';
    }

    await fs.ensureDir(path.dirname(outputPath));

    await image
      .composite([{
        input: watermark,
        gravity,
        blend: 'over'
      }])
      .toFile(outputPath);
  }

  /**
   * Convert image to different formats
   */
  static async convertFormat(
    inputPath: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif',
    quality = 80
  ): Promise<void> {
    let processor = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        processor = processor.jpeg({ quality, progressive: true });
        break;
      case 'png':
        processor = processor.png({ quality, progressive: true });
        break;
      case 'webp':
        processor = processor.webp({ quality });
        break;
      case 'avif':
        processor = processor.avif({ quality });
        break;
    }

    await fs.ensureDir(path.dirname(outputPath));
    await processor.toFile(outputPath);
  }

  /**
   * Create responsive image variants
   */
  static async createResponsiveVariants(
    inputPath: string,
    outputDir: string,
    baseName: string
  ): Promise<Array<{ name: string; path: string; width: number; size: number }>> {
    const variants = [
      { width: 320, suffix: 'xs' },
      { width: 640, suffix: 'sm' },
      { width: 1024, suffix: 'md' },
      { width: 1440, suffix: 'lg' },
      { width: 1920, suffix: 'xl' }
    ];

    const results: Array<{ name: string; path: string; width: number; size: number }> = [];

    await fs.ensureDir(outputDir);

    for (const variant of variants) {
      const outputPath = path.join(outputDir, `${baseName}_${variant.suffix}.jpg`);
      
      await sharp(inputPath)
        .resize({
          width: variant.width,
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      results.push({
        name: `${baseName}_${variant.suffix}.jpg`,
        path: outputPath,
        width: variant.width,
        size: stats.size
      });
    }

    return results;
  }
}
