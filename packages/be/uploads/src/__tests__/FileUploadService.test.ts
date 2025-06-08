/**
 * Tests for FileUploadService
 */
import { FileUploadService } from '../services/FileUploadService.js';
import { UploadConfig } from '../types/upload.types.js';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let config: Partial<UploadConfig>;

  beforeEach(() => {
    config = {
      storage: {
        provider: 'local',
        basePath: './test-uploads'
      },
      security: {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
        allowedExtensions: ['.jpg', '.jpeg', '.png']
      },
      imageProcessing: {
        enabled: true,
        quality: 85,
        generateThumbnails: false
      }
    };
    
    service = new FileUploadService(config);
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new FileUploadService();
      const serviceConfig = defaultService.getConfig();
      
      expect(serviceConfig.storage.provider).toBe('local');
      expect(serviceConfig.security.maxFileSize).toBe(10 * 1024 * 1024);
      expect(serviceConfig.imageProcessing.enabled).toBe(true);
    });

    it('should merge provided configuration with defaults', () => {
      const serviceConfig = service.getConfig();
      
      expect(serviceConfig.storage.provider).toBe('local');
      expect(serviceConfig.storage.basePath).toBe('./test-uploads');
      expect(serviceConfig.security.maxFileSize).toBe(5 * 1024 * 1024);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const newConfig = {
        security: {
          maxFileSize: 20 * 1024 * 1024 // 20MB
        }
      };

      service.updateConfig(newConfig);
      const updatedConfig = service.getConfig();
      
      expect(updatedConfig.security.maxFileSize).toBe(20 * 1024 * 1024);
    });
  });

  describe('multer middleware', () => {
    it('should provide single file middleware', () => {
      const middleware = service.single('file');
      expect(typeof middleware).toBe('function');
    });

    it('should provide array middleware', () => {
      const middleware = service.array('files', 5);
      expect(typeof middleware).toBe('function');
    });

    it('should provide fields middleware', () => {
      const middleware = service.fields([{ name: 'avatar' }, { name: 'cover' }]);
      expect(typeof middleware).toBe('function');
    });
  });

  describe('processUpload', () => {
    it('should return error when no files provided', async () => {
      const mockReq = {
        file: undefined,
        files: undefined
      } as any;

      const result = await service.processUpload(mockReq);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('No files provided');
      expect(result.files).toHaveLength(0);
    });
  });

  describe('file operations', () => {
    it('should provide file existence check', async () => {
      const exists = await service.fileExists('non-existent-id');
      expect(typeof exists).toBe('boolean');
    });

    it('should provide file info retrieval', async () => {
      const info = await service.getFileInfo('non-existent-id');
      expect(info).toBeNull();
    });

    it('should provide file deletion', async () => {
      const deleted = await service.deleteFile('non-existent-id');
      expect(typeof deleted).toBe('boolean');
    });
  });

  describe('cleanup', () => {
    it('should provide cleanup method', async () => {
      await expect(service.cleanup()).resolves.not.toThrow();
    });
  });
});
