import { FileUploadService } from '../services/FileUploadService.js';

describe('uploads', () => {
  it('should create FileUploadService instance', () => {
    const service = new FileUploadService();
    expect(service).toBeDefined();
    expect(typeof service.getConfig).toBe('function');
  });
});
