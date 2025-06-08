# @thrilled/be-uploads

A comprehensive file upload package for Node.js/Express applications with support for multiple storage providers, image processing, security validation, and more.

## Features

- 🔒 **Security First**: File type validation, size limits, virus scanning integration
- 🖼️ **Image Processing**: Automatic optimization, format conversion, thumbnail generation
- 📁 **Multiple Storage**: Local, AWS S3, Google Cloud Storage (future)
- 🚀 **Express Integration**: Ready-to-use middleware and routes
- 🎨 **Flexible Configuration**: Presets for common use cases
- 🧪 **Well Tested**: Comprehensive test coverage
- 📝 **TypeScript**: Full type safety

## Installation

```bash
yarn add @thrilled/be-uploads
```

## Quick Start

### Basic Usage

```typescript
import { FileUploadService, createUploadRouter } from '@thrilled/be-uploads';
import express from 'express';

const app = express();

// Create upload service with default configuration
const uploadService = new FileUploadService();

// Use the complete upload router
app.use('/api/uploads', createUploadRouter({
  config: {
    storage: {
      provider: 'local',
      basePath: './uploads'
    }
  }
}));

// Or use individual middleware
app.post('/upload', 
  uploadService.single('file'),
  async (req, res) => {
    const result = await uploadService.processUpload(req);
    res.json(result);
  }
);
```

### Configuration Presets

```typescript
import { createConfig, CONFIG_PRESETS } from '@thrilled/be-uploads';

// Use predefined presets
const imageConfig = createConfig('images');
const profileConfig = createConfig('profilePictures');
const documentConfig = createConfig('documents');

// Custom configuration
const customConfig = createConfig('images', {
  security: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    virusScanEnabled: true
  },
  imageProcessing: {
    quality: 90,
    formats: ['webp', 'avif']
  }
});
```

## Configuration

### Storage Configuration

#### Local Storage
```typescript
{
  storage: {
    provider: 'local',
    basePath: './uploads'
  }
}
```

#### AWS S3 (Future)
```typescript
{
  storage: {
    provider: 's3',
    s3: {
      bucket: 'my-bucket',
      region: 'us-west-2',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  }
}
```

### Security Configuration

```typescript
{
  security: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    virusScanEnabled: false
  }
}
```

### Image Processing Configuration

```typescript
{
  imageProcessing: {
    enabled: true,
    formats: ['webp', 'jpeg'],
    quality: 85,
    generateThumbnails: true,
    thumbnailSizes: [
      { name: 'small', width: 150, height: 150 },
      { name: 'medium', width: 300, height: 300 },
      { name: 'large', width: 800, height: 600 }
    ]
  }
}
```

## Usage Examples

### Single File Upload

```typescript
import { createSingleUploadMiddleware } from '@thrilled/be-uploads';

app.post('/avatar', 
  ...createSingleUploadMiddleware('avatar', {
    config: createConfig('profilePictures'),
    folder: 'avatars',
    onSuccess: async (result, req, res) => {
      // Custom success handling
      const user = await User.findById(req.user.id);
      user.avatar = result.files[0].id;
      await user.save();
      
      res.json({ success: true, avatar: result.files[0] });
    }
  })
);
```

### Multiple Files Upload

```typescript
import { createMultipleUploadMiddleware } from '@thrilled/be-uploads';

app.post('/gallery', 
  ...createMultipleUploadMiddleware('photos', 10, {
    config: createConfig('images'),
    folder: 'gallery'
  })
);
```

### Custom Processing

```typescript
const uploadService = new FileUploadService(createConfig('images'));

app.post('/custom-upload',
  uploadService.single('file'),
  async (req, res) => {
    try {
      const result = await uploadService.processUpload(req, {
        folder: 'custom',
        overrideImageProcessing: {
          quality: 95,
          generateThumbnails: true,
          thumbnailSizes: [
            { name: 'preview', width: 400, height: 300 }
          ]
        }
      });

      if (result.success) {
        res.json({ success: true, files: result.files });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Upload failed' });
    }
  }
);
```

### File Management

```typescript
// Get file information
const fileInfo = await uploadService.getFileInfo('file-id');

// Check if file exists
const exists = await uploadService.fileExists('file-id');

// Delete file
const deleted = await uploadService.deleteFile('file-id');

// Move file to different folder
const moved = await uploadService.moveFile('file-id', 'new-folder');

// Copy file
const newFileId = await uploadService.copyFile('file-id', 'backup-folder');

// Get file stream for download
const stream = await uploadService.getFileStream('file-id', 'thumbnail');
```

## Express Routes

The package provides ready-to-use Express routes:

### Complete Router

```typescript
import { createUploadRouter } from '@thrilled/be-uploads';

app.use('/api/uploads', createUploadRouter({
  config: createConfig('images'),
  enableFileServing: true,
  enableManagement: true,
  authMiddleware: (req, res, next) => {
    // Your authentication logic
    next();
  }
}));
```

Available endpoints:
- `POST /single/:folder?` - Single file upload
- `POST /multiple/:folder?` - Multiple files upload
- `POST /profile-picture` - Profile picture upload (optimized)
- `POST /document/:folder?` - Document upload
- `GET /file/:fileId` - Serve file
- `GET /file/:fileId/:variant` - Serve file variant (thumbnail, etc.)
- `GET /info/:fileId` - Get file information
- `DELETE /file/:fileId` - Delete file
- `PUT /file/:fileId/move` - Move file
- `POST /file/:fileId/copy` - Copy file
- `HEAD /file/:fileId` - Check if file exists
- `GET /health` - Health check

### Simple Router

```typescript
import { createSimpleUploadRouter } from '@thrilled/be-uploads';

app.use('/uploads', createSimpleUploadRouter({
  config: createConfig('images')
}));
```

Available endpoints:
- `POST /upload` - Single file upload
- `POST /upload-multiple` - Multiple files upload
- `GET /:fileId` - Serve file

## Environment Variables

The package supports configuration via environment variables:

```env
# Storage configuration
UPLOAD_PROVIDER=local
UPLOAD_BASE_PATH=./uploads

# Security settings
MAX_FILE_SIZE=10485760
MAX_FILES=10
VIRUS_SCAN_ENABLED=true

# Image processing
IMAGE_PROCESSING_ENABLED=true
IMAGE_QUALITY=85

# AWS S3 (if using S3 provider)
AWS_S3_BUCKET=my-bucket
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Google Cloud (if using GCP provider)
GCP_BUCKET=my-bucket
GCP_PROJECT_ID=my-project
GCP_KEY_FILE=path/to/key.json
```

## Error Handling

The package provides comprehensive error handling:

```typescript
import { uploadErrorHandler, UploadError, ValidationError } from '@thrilled/be-uploads';

// Use the provided error handler middleware
app.use(uploadErrorHandler);

// Or handle errors manually
app.post('/upload', async (req, res) => {
  try {
    const result = await uploadService.processUpload(req);
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof UploadError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

## Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## API Reference

### Classes

- **FileUploadService** - Main service class
- **FileValidator** - File validation utilities
- **ImageProcessor** - Image processing with Sharp
- **LocalStorageProvider** - Local file storage

### Middleware

- **createSingleUploadMiddleware** - Single file upload middleware
- **createMultipleUploadMiddleware** - Multiple files upload middleware
- **createFieldsUploadMiddleware** - Multiple fields upload middleware
- **createFileServingMiddleware** - File serving middleware

### Routes

- **createUploadRouter** - Complete upload router
- **createSimpleUploadRouter** - Simple upload router

### Utilities

- **createConfig** - Configuration builder
- **CONFIG_PRESETS** - Predefined configurations
- **validateConfig** - Configuration validation

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
