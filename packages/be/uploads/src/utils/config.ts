/**
 * Configuration utilities and presets for file uploads
 */
import { UploadConfig } from '../types/upload.types.js';

/**
 * Default configuration presets for common use cases
 */
export const CONFIG_PRESETS = {
  // Basic image upload configuration
  images: {
    storage: {
      provider: 'local' as const,
      basePath: './uploads/images'
    },
    security: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif'
      ] as string[],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'] as string[],
      maxFiles: 5
    },
    imageProcessing: {
      enabled: true,
      formats: ['webp', 'jpeg'] as ('webp' | 'jpeg' | 'png' | 'avif')[],
      quality: 85,
      generateThumbnails: true,
      thumbnailSizes: [
        { name: 'thumb', width: 150, height: 150 },
        { name: 'small', width: 300, height: 300 },
        { name: 'medium', width: 600, height: 600 },
        { name: 'large', width: 1200, height: 1200 }
      ]
    }
  },

  // Profile picture specific configuration
  profilePictures: {
    storage: {
      provider: 'local' as const,
      basePath: './uploads/profiles'
    },
    security: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as string[],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'] as string[],
      maxFiles: 1
    },
    imageProcessing: {
      enabled: true,
      formats: ['webp', 'jpeg'] as ('webp' | 'jpeg' | 'png' | 'avif')[],
      quality: 90,
      generateThumbnails: true,
      thumbnailSizes: [
        { name: 'avatar', width: 100, height: 100 },
        { name: 'small', width: 200, height: 200 },
        { name: 'medium', width: 400, height: 400 }
      ]
    }
  },

  // Document upload configuration
  documents: {
    security: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ] as string[],
      allowedExtensions: [
        '.pdf', '.doc', '.docx', '.txt', '.csv', 
        '.xls', '.xlsx', '.ppt', '.pptx'
      ] as string[],
      maxFiles: 10
    },
    imageProcessing: {
      enabled: false
    }
  },

  // Media files (images + videos)
  media: {
    security: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
      ] as string[],
      allowedExtensions: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.mp4', '.webm', '.ogg', '.mov'
      ] as string[],
      maxFiles: 20
    },
    imageProcessing: {
      enabled: true,
      formats: ['webp', 'jpeg'] as ('webp' | 'jpeg' | 'png' | 'avif')[],
      quality: 80,
      generateThumbnails: true,
      thumbnailSizes: [
        { name: 'thumb', width: 200, height: 200 },
        { name: 'preview', width: 800, height: 600 }
      ]
    }
  },

  // Strict security configuration
  strict: {
    security: {
      maxFileSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] as string[],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'] as string[],
      maxFiles: 1,
      virusScanEnabled: true
    },
    imageProcessing: {
      enabled: true,
      formats: ['jpeg'] as ('webp' | 'jpeg' | 'png' | 'avif')[],
      quality: 70,
      generateThumbnails: false
    }
  }
};

/**
 * Environment-based configuration
 */
export function getEnvironmentConfig(): Partial<UploadConfig> {
  return {
    storage: {
      provider: process.env.UPLOAD_PROVIDER as 'local' | 's3' | 'gcp' || 'local',
      basePath: process.env.UPLOAD_BASE_PATH || './uploads',
      ...(process.env.AWS_S3_BUCKET && {
        s3: {
          bucket: process.env.AWS_S3_BUCKET,
          region: process.env.AWS_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      }),
      ...(process.env.GCP_BUCKET && process.env.GCP_PROJECT_ID && {
        gcp: {
          bucket: process.env.GCP_BUCKET,
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GCP_KEY_FILE
        }
      })
    },
    security: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
      maxFiles: parseInt(process.env.MAX_FILES || '10'),
      allowedMimeTypes: ['*'],
      allowedExtensions: ['*'],
      virusScanEnabled: process.env.NODE_ENV === 'production' && process.env.VIRUS_SCAN_ENABLED === 'true'
    },
    imageProcessing: {
      enabled: process.env.IMAGE_PROCESSING_ENABLED !== 'false',
      quality: parseInt(process.env.IMAGE_QUALITY || '85')
    }
  };
}

/**
 * Merge configuration with presets
 */
export function createConfig(
  preset?: keyof typeof CONFIG_PRESETS,
  overrides?: Partial<UploadConfig>
): UploadConfig {
  const baseConfig: UploadConfig = {
    storage: {
      provider: 'local',
      basePath: './uploads'
    },
    security: {
      maxFileSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['*'],
      allowedExtensions: ['*'],
      maxFiles: 10,
      virusScanEnabled: false
    },
    imageProcessing: {
      enabled: true,
      formats: ['webp', 'jpeg'],
      quality: 85,
      generateThumbnails: false,
      thumbnailSizes: []
    }
  };

  const environmentConfig = getEnvironmentConfig();
  const presetConfig = preset ? CONFIG_PRESETS[preset] as Partial<UploadConfig> : {} as Partial<UploadConfig>;

  return {
    ...baseConfig,
    ...environmentConfig,
    ...presetConfig,
    ...overrides,
    // Deep merge nested objects
    storage: {
      ...baseConfig.storage,
      ...environmentConfig.storage,
      ...(presetConfig.storage || {}),
      ...overrides?.storage
    },
    security: {
      ...baseConfig.security,
      ...environmentConfig.security,
      ...(presetConfig.security || {}),
      ...overrides?.security
    },
    imageProcessing: {
      ...baseConfig.imageProcessing,
      ...environmentConfig.imageProcessing,
      ...(presetConfig.imageProcessing || {}),
      ...overrides?.imageProcessing
    }
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: UploadConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate storage configuration
  if (!config.storage.provider) {
    errors.push('Storage provider is required');
  }

  if (config.storage.provider === 'local' && !config.storage.basePath) {
    errors.push('Base path is required for local storage');
  }

  if (config.storage.provider === 's3' && !config.storage.s3?.bucket) {
    errors.push('S3 bucket is required for S3 storage');
  }

  if (config.storage.provider === 'gcp' && !config.storage.gcp?.bucket) {
    errors.push('GCP bucket is required for GCP storage');
  }

  // Validate security configuration
  if (config.security.maxFileSize <= 0) {
    errors.push('Max file size must be greater than 0');
  }

  if (config.security.maxFiles && config.security.maxFiles <= 0) {
    errors.push('Max files must be greater than 0');
  }

  if (!config.security.allowedMimeTypes || config.security.allowedMimeTypes.length === 0) {
    errors.push('At least one allowed MIME type is required');
  }

  if (!config.security.allowedExtensions || config.security.allowedExtensions.length === 0) {
    errors.push('At least one allowed extension is required');
  }

  // Validate image processing configuration
  if (config.imageProcessing.enabled) {
    if (config.imageProcessing.quality && (config.imageProcessing.quality < 1 || config.imageProcessing.quality > 100)) {
      errors.push('Image quality must be between 1 and 100');
    }

    if (config.imageProcessing.generateThumbnails && 
        (!config.imageProcessing.thumbnailSizes || config.imageProcessing.thumbnailSizes.length === 0)) {
      errors.push('Thumbnail sizes are required when thumbnail generation is enabled');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration summary for logging/debugging
 */
export function getConfigSummary(config: UploadConfig): Record<string, unknown> {
  return {
    storage: {
      provider: config.storage.provider,
      hasBasePath: !!config.storage.basePath,
      hasS3Config: !!config.storage.s3,
      hasGcpConfig: !!config.storage.gcp
    },
    security: {
      maxFileSize: `${Math.round(config.security.maxFileSize / 1024 / 1024)}MB`,
      maxFiles: config.security.maxFiles,
      allowedTypes: config.security.allowedMimeTypes.length,
      allowedExtensions: config.security.allowedExtensions.length,
      virusScanEnabled: config.security.virusScanEnabled
    },
    imageProcessing: {
      enabled: config.imageProcessing.enabled,
      formats: config.imageProcessing.formats,
      quality: config.imageProcessing.quality,
      thumbnails: config.imageProcessing.generateThumbnails ? config.imageProcessing.thumbnailSizes?.length : 0
    }
  };
}
