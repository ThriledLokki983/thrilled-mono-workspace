import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';
import { SanitizationOptions } from '../types/index.js';

/**
 * Main sanitization class for input cleaning and security
 */
export class Sanitizer {
  private static domPurify: typeof DOMPurify;

  static {
    // Initialize DOMPurify with JSDOM for server-side usage
    const window = new JSDOM('').window;
    this.domPurify = DOMPurify(window as any);
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(input: string, options?: SanitizationOptions['html']): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    if (options?.stripTags) {
      let sanitized = input;
      
      // First remove script tags and their content (security critical)
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Then strip all remaining HTML tags but keep content
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      
      return sanitized;
    }

    const config: any = {
      ALLOWED_TAGS: options?.allowedTags || ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: options?.allowedAttributes || ['class', 'id']
    };

    return this.domPurify.sanitize(input, config) as unknown as string;
  }

  /**
   * Remove XSS vectors from input
   */
  static sanitizeXSS(input: string, options?: SanitizationOptions['xss']): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove script tags
    if (options?.removeScriptTags !== false) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Encode HTML entities
    if (options?.encodeHtml !== false) {
      sanitized = validator.escape(sanitized);
    }

    // Remove dangerous attributes
    const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'];
    if (options?.allowSafeAttributes) {
      // If allowSafeAttributes is specified, remove dangerous attributes but keep safe ones
      dangerousAttrs.forEach(attr => {
        const regex = new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]*`, 'gi');
        sanitized = sanitized.replace(regex, '');
      });
    } else {
      // Remove all event attributes
      dangerousAttrs.forEach(attr => {
        const regex = new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]*`, 'gi');
        sanitized = sanitized.replace(regex, '');
      });
    }

    return sanitized;
  }

  /**
   * Sanitize SQL injection attempts
   */
  static sanitizeSQL(input: string, options?: SanitizationOptions['sql']): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Escape quotes
    if (options?.escapeQuotes !== false) {
      sanitized = sanitized.replace(/'/g, "\\'");
    }

    // Remove SQL keywords
    if (options?.removeSqlKeywords) {
      const sqlKeywords = [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 
        'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT',
        'TABLE', 'DATABASE', 'SCHEMA', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION'
      ];
      
      sqlKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        sanitized = sanitized.replace(regex, '');
      });
    }

    return sanitized.trim();
  }

  /**
   * General sanitization for common input cleaning
   */
  static sanitizeGeneral(input: string, options?: SanitizationOptions['general']): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remove null characters
    if (options?.removeNullChars !== false) {
      sanitized = sanitized.replace(/\0/g, '');
    }

    // Trim whitespace
    if (options?.trim !== false) {
      sanitized = sanitized.trim();
    }

    // Convert to lowercase
    if (options?.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    return sanitized;
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Check if it's a valid email format first
    if (!validator.isEmail(input.trim())) {
      return '';
    }

    return validator.normalizeEmail(input.trim().toLowerCase()) || '';
  }

  /**
   * Sanitize phone number input
   */
  static sanitizePhone(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Keep only digits, plus, parentheses, and hyphens
    return input.replace(/[^\d+()-\s]/g, '').trim();
  }

  /**
   * Sanitize URL input
   */
  static sanitizeURL(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    try {
      const url = new URL(input.trim());
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return '';
      }

      return url.toString();
    } catch {
      return '';
    }
  }

  /**
   * Sanitize filename for safe file operations
   */
  static sanitizeFilename(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove path traversal attempts and dangerous characters
    return input
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
      .replace(/^\.+/, '')
      .replace(/\.+$/, '')
      .replace(/\s+/g, '_')
      .substring(0, 255)
      .trim();
  }

  /**
   * Comprehensive sanitization using all methods
   */
  static sanitizeComprehensive(
    input: any, 
    options?: SanitizationOptions
  ): string {
    // Convert to string if not already (this handles null and undefined correctly)
    const stringInput = typeof input === 'string' ? input : String(input);

    // Handle empty strings and null strings
    if (stringInput === '' || stringInput === 'null' && input === null) {
      return stringInput;
    }

    let sanitized = stringInput;

    // Apply general sanitization first (but skip trim for now)
    const generalOptions = { ...options?.general };
    const shouldTrim = generalOptions.trim;
    delete generalOptions.trim; // Remove trim temporarily
    sanitized = this.sanitizeGeneral(sanitized, generalOptions);

    // Apply HTML sanitization
    if (options?.html) {
      sanitized = this.sanitizeHTML(sanitized, options.html);
    }

    // Apply XSS sanitization
    if (options?.xss) {
      sanitized = this.sanitizeXSS(sanitized, options.xss);
    }

    // Apply SQL sanitization
    if (options?.sql) {
      sanitized = this.sanitizeSQL(sanitized, options.sql);
    }

    // Apply trim at the end if requested
    if (shouldTrim) {
      sanitized = sanitized.trim();
    }

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  static sanitizeObject(
    obj: Record<string, any>, 
    options?: SanitizationOptions
  ): Record<string, any> {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return {};
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeGeneral(key, { 
        removeNullChars: true, 
        trim: true 
      });
      
      if (sanitizedKey) {
        if (value === null) {
          sanitized[sanitizedKey] = null;
        } else if (value === undefined) {
          sanitized[sanitizedKey] = undefined;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively sanitize nested objects
          sanitized[sanitizedKey] = this.sanitizeObject(value, options);
        } else if (Array.isArray(value)) {
          // Sanitize arrays
          sanitized[sanitizedKey] = this.sanitizeArray(value, options);
        } else if (typeof value === 'string') {
          // Sanitize string values
          sanitized[sanitizedKey] = this.sanitizeComprehensive(value, options);
        } else {
          // Preserve non-string primitives (numbers, booleans)
          sanitized[sanitizedKey] = value;
        }
      }
    }

    return sanitized;
  }

  /**
   * Sanitize array of values
   */
  static sanitizeArray(
    arr: any[], 
    options?: SanitizationOptions
  ): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr.map(item => this.sanitizeComprehensive(item, options));
  }
}
