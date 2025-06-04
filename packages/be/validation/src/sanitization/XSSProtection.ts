import { Request, Response, NextFunction } from 'express';
import { Sanitizer } from './Sanitizer.js';
import { SanitizationOptions } from '../types/index.js';

/**
 * XSS Protection middleware and utilities
 */
export class XSSProtection {
  private static defaultOptions: SanitizationOptions['xss'] = {
    removeScriptTags: true,
    encodeHtml: true,
    allowSafeAttributes: []
  };

  /**
   * Express middleware for XSS protection
   */
  static middleware(options?: SanitizationOptions['xss']) {
    const xssOptions = { ...this.defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body, xssOptions);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query, xssOptions);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params, xssOptions);
        }

        next();
      } catch (error) {
        console.error('XSS Protection middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Sanitize object for XSS protection
   */
  private static sanitizeObject(
    obj: Record<string, any>, 
    options: SanitizationOptions['xss']
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = Sanitizer.sanitizeXSS(value, options);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? Sanitizer.sanitizeXSS(item, options) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value, options);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Scan text for XSS patterns
   */
  static scanForXSS(input: string): {
    hasXSS: boolean;
    patterns: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    if (!input || typeof input !== 'string') {
      return { hasXSS: false, patterns: [], severity: 'low' };
    }

    const xssPatterns = [
      // Script tags
      { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, severity: 'high' as const },
      // Event handlers
      { pattern: /on\w+\s*=\s*[^>\s]+/gi, severity: 'high' as const },
      // JavaScript protocol
      { pattern: /javascript\s*:/gi, severity: 'high' as const },
      // Data URIs with scripts
      { pattern: /data:.*script/gi, severity: 'high' as const },
      // Expression functions
      { pattern: /expression\s*\(/gi, severity: 'medium' as const },
      // Iframe with javascript
      { pattern: /<iframe[^>]*src\s*=\s*["\']javascript:/gi, severity: 'high' as const },
      // Object/embed tags
      { pattern: /<(object|embed)\b[^>]*>/gi, severity: 'medium' as const },
      // Meta refresh
      { pattern: /<meta[^>]*http-equiv\s*=\s*["\']refresh["\'][^>]*>/gi, severity: 'medium' as const },
      // Link with javascript
      { pattern: /<link[^>]*href\s*=\s*["\']javascript:/gi, severity: 'high' as const },
      // Style with expression
      { pattern: /<style[^>]*>.*expression\s*\(/gi, severity: 'medium' as const }
    ];

    const foundPatterns: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';

    for (const { pattern, severity } of xssPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        foundPatterns.push(...matches);
        if (severity === 'high' || (severity === 'medium' && maxSeverity === 'low')) {
          maxSeverity = severity;
        }
      }
    }

    return {
      hasXSS: foundPatterns.length > 0,
      patterns: foundPatterns,
      severity: foundPatterns.length > 0 ? maxSeverity : 'low'
    };
  }

  /**
   * Clean and validate HTML content
   */
  static cleanHTML(
    html: string, 
    options?: {
      allowedTags?: string[];
      allowedAttributes?: Record<string, string[]>;
      allowedSchemes?: string[];
    }
  ): string {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const sanitizationOptions: SanitizationOptions['html'] = {
      allowedTags: options?.allowedTags || [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      allowedAttributes: options?.allowedAttributes || {
        '*': ['class', 'id'],
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title', 'width', 'height']
      }
    };

    return Sanitizer.sanitizeHTML(html, sanitizationOptions);
  }

  /**
   * Encode special characters for safe output
   */
  static encode(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Decode HTML entities
   */
  static decode(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
  }

  /**
   * Check if content is safe for rendering
   */
  static isSafe(content: string): boolean {
    const xssCheck = this.scanForXSS(content);
    return !xssCheck.hasXSS;
  }

  /**
   * Create CSP (Content Security Policy) header
   */
  static createCSPHeader(options?: {
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
  }): string {
    const cspOptions = {
      scriptSrc: options?.scriptSrc || ["'self'"],
      styleSrc: options?.styleSrc || ["'self'", "'unsafe-inline'"],
      imgSrc: options?.imgSrc || ["'self'", 'data:', 'https:'],
      connectSrc: options?.connectSrc || ["'self'"],
      fontSrc: options?.fontSrc || ["'self'"],
      objectSrc: options?.objectSrc || ["'none'"],
      mediaSrc: options?.mediaSrc || ["'self'"],
      frameSrc: options?.frameSrc || ["'none'"]
    };

    const directives = [
      `script-src ${cspOptions.scriptSrc.join(' ')}`,
      `style-src ${cspOptions.styleSrc.join(' ')}`,
      `img-src ${cspOptions.imgSrc.join(' ')}`,
      `connect-src ${cspOptions.connectSrc.join(' ')}`,
      `font-src ${cspOptions.fontSrc.join(' ')}`,
      `object-src ${cspOptions.objectSrc.join(' ')}`,
      `media-src ${cspOptions.mediaSrc.join(' ')}`,
      `frame-src ${cspOptions.frameSrc.join(' ')}`,
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return directives.join('; ');
  }

  /**
   * Detect XSS patterns in input (alias for scanForXSS for backward compatibility)
   */
  static detectXSS(input: string): boolean {
    const result = this.scanForXSS(input);
    return result.hasXSS;
  }

  /**
   * Clean content by removing XSS patterns (alias for cleanHTML)
   */
  static cleanContent(input: string, options?: SanitizationOptions['xss']): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return Sanitizer.sanitizeXSS(input, options || this.defaultOptions);
  }
}
