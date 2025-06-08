/**
 * Tests for FileValidator utility
 */
import { FileValidator } from '../utils/FileValidator.js';
import { FileValidationOptions } from '../types/upload.types.js';

describe('FileValidator', () => {
  let validator: FileValidator;
  let options: FileValidationOptions;

  beforeEach(() => {
    options = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
      maxFiles: 5
    };
    validator = new FileValidator(options);
  });

  describe('validateMimeType', () => {
    it('should validate allowed MIME types', () => {
      const result = validator.validateMimeType('image/jpeg', 'test.jpg');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject disallowed MIME types', () => {
      const result = validator.validateMimeType('video/mp4', 'test.mp4');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should validate MIME type consistency with filename', () => {
      const result = validator.validateMimeType('image/jpeg', 'test.png');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('does not match');
    });
  });

  describe('validateFileSize', () => {
    it('should validate files within size limit', () => {
      const result = validator.validateFileSize(5 * 1024 * 1024); // 5MB
      expect(result.isValid).toBe(true);
    });

    it('should reject files exceeding size limit', () => {
      const result = validator.validateFileSize(15 * 1024 * 1024); // 15MB
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should handle minimum size validation', () => {
      const validatorWithMin = new FileValidator({
        ...options,
        minFileSize: 1024 // 1KB
      });
      
      const result = validatorWithMin.validateFileSize(500); // 500 bytes
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('below minimum');
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters', () => {
      const sanitized = validator.sanitizeFilename('../../evil/../file.jpg');
      expect(sanitized).not.toContain('../');
      expect(sanitized).not.toContain('\\');
    });

    it('should preserve safe characters', () => {
      const sanitized = validator.sanitizeFilename('my-file_name (1).jpg');
      expect(sanitized).toBe('my-file_name (1).jpg');
    });

    it('should handle unicode characters', () => {
      const sanitized = validator.sanitizeFilename('файл.jpg');
      expect(sanitized).toBe('файл.jpg');
    });
  });

  describe('isImageFile', () => {
    it('should identify image MIME types', () => {
      expect(validator.isImageFile('image/jpeg')).toBe(true);
      expect(validator.isImageFile('image/png')).toBe(true);
      expect(validator.isImageFile('application/pdf')).toBe(false);
    });
  });

  describe('isDocumentFile', () => {
    it('should identify document MIME types', () => {
      expect(validator.isDocumentFile('application/pdf')).toBe(true);
      expect(validator.isDocumentFile('application/msword')).toBe(true);
      expect(validator.isDocumentFile('image/jpeg')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate a complete file object', () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.from('fake image data')
      };

      const result = validator.validateFile(mockFile);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid files', () => {
      const mockFile = {
        originalname: 'test.exe',
        mimetype: 'application/octet-stream',
        size: 5 * 1024 * 1024,
        buffer: Buffer.from('fake data')
      };

      const result = validator.validateFile(mockFile);
      expect(result.isValid).toBe(false);
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate unique filenames', () => {
      const filename1 = validator.generateSafeFilename('test.jpg');
      const filename2 = validator.generateSafeFilename('test.jpg');
      
      expect(filename1).not.toBe(filename2);
      expect(filename1).toContain('test');
      expect(filename1).toContain('.jpg');
    });

    it('should preserve extension', () => {
      const filename = validator.generateSafeFilename('document.pdf');
      expect(filename).toMatch(/\.pdf$/);
    });
  });
});
