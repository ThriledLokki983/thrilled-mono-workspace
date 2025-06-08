/**
 * TypeScript type definitions for file upload system
 */
import { Request } from 'express';

export interface UploadConfig {
  storage: {
    provider: 'local' | 's3' | 'gcp';
    basePath: string;
    generateUniqueNames?: boolean;
    preserveOriginalName?: boolean;
    s3?: {
      bucket: string;
      region: string;
      accessKeyId?: string;
      secretAccessKey?: string;
    };
    gcp?: {
      bucket: string;
      projectId: string;
      keyFilename?: string;
    };
  };
  security: {
    maxFileSize: number; // in bytes
    maxFiles?: number;
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    minFileSize?: number;
    virusScanEnabled?: boolean;
    quarantineDirectory?: string;
  };
  imageProcessing: {
    enabled: boolean;
    quality?: number;
    formats?: ('jpeg' | 'png' | 'webp' | 'avif')[];
    generateThumbnails?: boolean;
    thumbnailSizes?: Array<{
      name: string;
      width: number;
      height: number;
      quality?: number;
    }>;
    resize?: {
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
  };
}

export interface UploadedFile {
  id: string;
  originalName: string;
  safeName: string;
  filename?: string;
  path?: string;
  url?: string;
  size: number;
  mimetype: string;
  extension?: string;
  isImage: boolean;
  uploadedAt: Date;
  folder?: string;
  metadata?: Record<string, any>;
  variants?: Array<{
    name: string;
    path: string;
    url?: string;
    size: number;
    format: string;
  }>;
  thumbnails?: Array<{
    name: string;
    path: string;
    url?: string;
    size: number;
    width: number;
    height: number;
  }>;
}

export interface UploadResult {
  success: boolean;
  files: UploadedFile[];
  error?: string;
  errors?: string[];
}

export interface FileValidationOptions {
  maxFileSize: number;
  maxFiles?: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  minFileSize?: number;
  virusScanEnabled?: boolean;
}

export interface StorageProvider {
  saveFile(file: UploadedFile, buffer: Buffer, processed?: ProcessedImageResult): Promise<Partial<UploadedFile>>;
  deleteFile(fileId: string): Promise<boolean>;
  fileExists(fileId: string): Promise<boolean>;
  getFileInfo(fileId: string): Promise<UploadedFile | null>;
  moveFile(fileId: string, newFolder: string): Promise<boolean>;
  copyFile(fileId: string, newFolder?: string): Promise<string | null>;
  getFileStream(fileId: string, variant?: string): Promise<NodeJS.ReadableStream | null>;
  cleanup?(): Promise<void>;
}

export interface ImageProcessingOptions {
  enabled: boolean;
  quality?: number;
  formats?: ('jpeg' | 'png' | 'webp' | 'avif')[];
  generateThumbnails?: boolean;
  thumbnailSizes?: Array<{
    name: string;
    width: number;
    height: number;
    quality?: number;
  }>;
  thumbnails?: Array<{
    name: string;
    width: number;
    height: number;
    quality?: number;
  }>;
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
}

export interface ProcessedImageResult {
  optimized: {
    buffer: Buffer;
    format: string;
    size: number;
  };
  variants: Array<{
    name: string;
    buffer: Buffer;
    format: string;
    size: number;
  }>;
  thumbnails: Array<{
    name: string;
    buffer: Buffer;
    size: number;
    width: number;
    height: number;
  }>;
  metadata: {
    width: number;
    height: number;
    format: string;
    hasAlpha: boolean;
    orientation?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface MulterRequest extends Request {
  uploadResult?: UploadResult;
}
