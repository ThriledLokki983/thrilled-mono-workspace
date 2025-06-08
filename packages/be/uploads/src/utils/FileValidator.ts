import mime from 'mime-types';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileValidationOptions, ValidationResult } from '../types/upload.types.js';

/**
 * File validation utilities for security and type checking
 */
export class FileValidator {
  private options: FileValidationOptions;

  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.run', '.bin', '.sh', '.php'
  ];

  private static readonly IMAGE_MIME_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/bmp', 'image/tiff', 'image/svg+xml', 'image/avif'
  ];

  private static readonly DOCUMENT_MIME_TYPES = [
    'application/pdf', 'application/msword', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  constructor(options: FileValidationOptions) {
    this.options = options;
  }

  /**
   * Validate MIME type and filename consistency
   */
  validateMimeType(mimeType: string, filename: string): ValidationResult {
    // Check if MIME type is allowed
    if (this.options.allowedMimeTypes && 
        !this.options.allowedMimeTypes.includes('*') &&
        !this.options.allowedMimeTypes.includes(mimeType)) {
      return {
        isValid: false,
        error: `MIME type '${mimeType}' is not allowed. Allowed types: ${this.options.allowedMimeTypes.join(', ')}`
      };
    }

    // Check MIME type vs extension consistency
    const expectedMimeType = mime.lookup(filename);
    if (expectedMimeType && expectedMimeType !== mimeType) {
      return {
        isValid: false,
        error: `MIME type '${mimeType}' does not match file extension. Expected: '${expectedMimeType}'`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): ValidationResult {
    if (this.options.maxFileSize && size > this.options.maxFileSize) {
      return {
        isValid: false,
        error: `File size ${size} bytes exceeds maximum allowed size of ${this.options.maxFileSize} bytes`
      };
    }

    if (this.options.minFileSize && size < this.options.minFileSize) {
      return {
        isValid: false,
        error: `File size ${size} bytes is below minimum required size of ${this.options.minFileSize} bytes`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file extension
   */
  validateExtension(filename: string): ValidationResult {
    const fileExtension = path.extname(filename).toLowerCase();
    
    // Check if extension is allowed
    if (this.options.allowedExtensions && 
        !this.options.allowedExtensions.includes('*')) {
      const allowedExts = this.options.allowedExtensions.map(ext => 
        ext.startsWith('.') ? ext : '.' + ext
      );
      
      if (!allowedExts.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File extension '${fileExtension}' is not allowed. Allowed extensions: ${allowedExts.join(', ')}`
        };
      }
    }

    // Security check for dangerous extensions
    if (FileValidator.DANGEROUS_EXTENSIONS.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File extension '${fileExtension}' is potentially dangerous and not allowed`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate complete file object
   */
  validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }): ValidationResult {
    // MIME type validation
    const mimeValidation = this.validateMimeType(file.mimetype, file.originalname);
    if (!mimeValidation.isValid) {
      return mimeValidation;
    }

    // Size validation
    const sizeValidation = this.validateFileSize(file.size);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // Extension validation
    const extensionValidation = this.validateExtension(file.originalname);
    if (!extensionValidation.isValid) {
      return extensionValidation;
    }

    return { isValid: true };
  }

  /**
   * Check if file is an image
   */
  isImageFile(mimeType: string): boolean {
    return FileValidator.IMAGE_MIME_TYPES.includes(mimeType);
  }

  /**
   * Check if file is a document
   */
  isDocumentFile(mimeType: string): boolean {
    return FileValidator.DOCUMENT_MIME_TYPES.includes(mimeType);
  }

  /**
   * Sanitize filename for safe storage
   */
  sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters but preserve unicode
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous path characters
      .replace(/\.\./g, '_') // Remove directory traversal
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .trim();
  }

  /**
   * Generate safe filename with unique ID
   */
  generateSafeFilename(originalFilename: string, preserveOriginal = false): string {
    const extension = path.extname(originalFilename).toLowerCase();
    const baseName = path.basename(originalFilename, extension);
    
    if (preserveOriginal) {
      return this.sanitizeFilename(originalFilename);
    }

    const sanitizedBaseName = this.sanitizeFilename(baseName);
    const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID
    
    return `${sanitizedBaseName}_${uniqueId}${extension}`;
  }

  /**
   * Check if file content matches its declared MIME type (basic check)
   */
  async validateFileSignature(buffer: Buffer, mimeType: string): Promise<ValidationResult> {
    // Check common file signatures
    const signatures: Record<string, number[][]> = {
      'image/jpeg': [[0xFF, 0xD8, 0xFF]],
      'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      'image/gif': [[0x47, 0x49, 0x46, 0x38], [0x47, 0x49, 0x46, 0x39]],
      'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
      'image/webp': [[0x52, 0x49, 0x46, 0x46]]
    };

    const expectedSignatures = signatures[mimeType];
    if (!expectedSignatures) {
      return { isValid: true }; // No signature check available for this type
    }

    const isValid = expectedSignatures.some(signature =>
      signature.every((byte, index) => buffer[index] === byte)
    );

    if (!isValid) {
      return {
        isValid: false,
        error: `File signature does not match declared MIME type '${mimeType}'`
      };
    }

    return { isValid: true };
  }

  /**
   * Get human-readable file size
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Static method for file extension extraction
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Static method for sanitizing filenames
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') 
      .replace(/\.\./g, '_') 
      .replace(/_+/g, '_') 
      .replace(/^_+|_+$/g, '') 
      .trim();
  }

  /**
   * Static method for generating safe filenames
   */
  static generateSafeFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename).toLowerCase();
    const baseName = path.basename(originalFilename, extension);
    const sanitizedBaseName = this.sanitizeFilename(baseName);
    const uniqueId = uuidv4().split('-')[0];
    return `${sanitizedBaseName}_${uniqueId}${extension}`;
  }

  /**
   * Static method for checking if file is image
   */
  static isImage(file: { mimetype: string }): boolean {
    return FileValidator.IMAGE_MIME_TYPES.includes(file.mimetype);
  }
}
