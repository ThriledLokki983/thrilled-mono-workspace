import { Request, Response, NextFunction } from 'express';
import { Sanitizer } from './Sanitizer.js';
import { SanitizationOptions } from '../types/index.js';

/**
 * SQL Injection Protection middleware and utilities
 */
export class SQLInjectionProtection {
  private static defaultOptions: SanitizationOptions['sql'] = {
    escapeQuotes: true,
    removeSqlKeywords: false // Be conservative by default
  };

  /**
   * Express middleware for SQL injection protection
   */
  static middleware(options?: SanitizationOptions['sql']) {
    const sqlOptions = { ...this.defaultOptions, ...options };

    return (req: Request, res: Response, next: NextFunction) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body, sqlOptions);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query, sqlOptions);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params, sqlOptions);
        }

        next();
      } catch (error) {
        console.error('SQL Injection Protection middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Sanitize object for SQL injection protection
   */
  private static sanitizeObject(
    obj: Record<string, any>, 
    options: SanitizationOptions['sql']
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = Sanitizer.sanitizeSQL(value, options);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? Sanitizer.sanitizeSQL(item, options) : item
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
   * Scan text for SQL injection patterns
   */
  static scanForSQLInjection(input: string): {
    hasSQLInjection: boolean;
    patterns: string[];
    severity: 'low' | 'medium' | 'high';
    risk: string[];
  } {
    if (!input || typeof input !== 'string') {
      return { hasSQLInjection: false, patterns: [], severity: 'low', risk: [] };
    }

    const sqlPatterns = [
      // Union-based injection
      { pattern: /\bunion\s+select\b/gi, severity: 'high' as const, risk: 'Union-based injection' },
      // Boolean-based blind injection
      { pattern: /\b(and|or)\s+\d+\s*=\s*\d+/gi, severity: 'high' as const, risk: 'Boolean-based blind' },
      // Time-based blind injection
      { pattern: /\b(sleep\s*\(|waitfor\s+delay|delay\s*\()/gi, severity: 'high' as const, risk: 'Time-based blind' },
      // Stacked queries
      { pattern: /;\s*(select|insert|update|delete|drop|create|alter)/gi, severity: 'high' as const, risk: 'Stacked queries' },
      // Comment-based injection
      { pattern: /(\/\*|\*\/|--|\#)/g, severity: 'medium' as const, risk: 'Comment injection' },
      // Quote escaping attempts
      { pattern: /['"]\s*;\s*['"]/g, severity: 'high' as const, risk: 'Quote escaping' },
      // Common SQL functions
      { pattern: /\b(concat|substring|ascii|char|hex|unhex|md5|sha1)\s*\(/gi, severity: 'medium' as const, risk: 'SQL functions' },
      // Information schema access
      { pattern: /\binformation_schema\b/gi, severity: 'high' as const, risk: 'Information schema access' },
      // System tables
      { pattern: /\b(sys\.|sysobjects|syscolumns|sysusers)\b/gi, severity: 'high' as const, risk: 'System tables access' },
      // SQL keywords in unexpected contexts
      { pattern: /\b(select|insert|update|delete|drop|create|alter|exec|execute|declare|cast|convert)\b/gi, severity: 'medium' as const, risk: 'SQL keywords' },
      // Hexadecimal values
      { pattern: /0x[0-9a-f]+/gi, severity: 'low' as const, risk: 'Hexadecimal values' },
      // Multiple single quotes
      { pattern: /'{2,}/g, severity: 'medium' as const, risk: 'Quote manipulation' }
    ];

    const foundPatterns: string[] = [];
    const riskTypes: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' = 'low';

    for (const { pattern, severity, risk } of sqlPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        foundPatterns.push(...matches);
        riskTypes.push(risk);
        if (severity === 'high' || (severity === 'medium' && maxSeverity === 'low')) {
          maxSeverity = severity;
        }
      }
    }

    return {
      hasSQLInjection: foundPatterns.length > 0,
      patterns: [...new Set(foundPatterns)], // Remove duplicates
      severity: foundPatterns.length > 0 ? maxSeverity : 'low',
      risk: [...new Set(riskTypes)] // Remove duplicates
    };
  }

  /**
   * Detect SQL injection patterns in input (alias for scanForSQLInjection for backward compatibility)
   */
  static detectSQLInjection(input: string): boolean {
    const result = this.scanForSQLInjection(input);
    return result.hasSQLInjection;
  }

  /**
   * Escape SQL string for safe usage in queries
   */
  static escapeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\x00/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }

  /**
   * Validate SQL identifier (table names, column names, etc.)
   */
  static validateIdentifier(identifier: string): boolean {
    if (!identifier || typeof identifier !== 'string') {
      return false;
    }

    // SQL identifiers should only contain letters, numbers, and underscores
    // and should not start with a number
    const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    // Check if it's a reserved keyword
    const reservedKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'TABLE', 'DATABASE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION',
      'TRIGGER', 'UNION', 'WHERE', 'ORDER', 'GROUP', 'HAVING', 'JOIN',
      'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AS', 'FROM', 'INTO',
      'VALUES', 'SET', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE'
    ];

    return identifierRegex.test(identifier) && 
           !reservedKeywords.includes(identifier.toUpperCase());
  }

  /**
   * Prepare value for parameterized query
   */
  static prepareValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return this.escapeString(value);
    }

    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map(item => this.prepareValue(item));
    }

    if (typeof value === 'object') {
      const prepared: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        if (this.validateIdentifier(key)) {
          prepared[key] = this.prepareValue(val);
        }
      }
      return prepared;
    }

    return String(value);
  }

  /**
   * Generate safe ORDER BY clause
   */
  static sanitizeOrderBy(
    orderBy: string, 
    allowedColumns: string[] = []
  ): string {
    if (!orderBy || typeof orderBy !== 'string') {
      return '';
    }

    const parts = orderBy.split(',').map(part => part.trim());
    const safeParts: string[] = [];

    for (const part of parts) {
      const match = part.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);
      if (match) {
        const column = match[1];
        const direction = match[2]?.toUpperCase() || 'ASC';

        if (this.validateIdentifier(column) && 
            (allowedColumns.length === 0 || allowedColumns.includes(column))) {
          safeParts.push(`${column} ${direction}`);
        }
      }
    }

    return safeParts.join(', ');
  }

  /**
   * Check if content is safe for SQL usage
   */
  static isSafe(content: string): boolean {
    const sqlCheck = this.scanForSQLInjection(content);
    return !sqlCheck.hasSQLInjection || sqlCheck.severity === 'low';
  }

  /**
   * Create parameterized query placeholder
   */
  static createPlaceholder(index: number, dbType: 'mysql' | 'postgresql' | 'sqlite' = 'mysql'): string {
    switch (dbType) {
      case 'mysql':
      case 'sqlite':
        return '?';
      case 'postgresql':
        return `$${index}`;
      default:
        return '?';
    }
  }

  /**
   * Build safe WHERE clause from object
   */
  static buildWhereClause(
    conditions: Record<string, any>, 
    dbType: 'mysql' | 'postgresql' | 'sqlite' = 'mysql'
  ): { clause: string; values: any[] } {
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      if (!this.validateIdentifier(key)) {
        continue; // Skip invalid identifiers
      }

      if (value === null || value === undefined) {
        whereConditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => this.createPlaceholder(paramIndex++, dbType));
        whereConditions.push(`${key} IN (${placeholders.join(', ')})`);
        values.push(...value.map(v => this.prepareValue(v)));
      } else {
        whereConditions.push(`${key} = ${this.createPlaceholder(paramIndex++, dbType)}`);
        values.push(this.prepareValue(value));
      }
    }

    return {
      clause: whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '',
      values
    };
  }

  /**
   * Create a safe parameterized query
   */
  static createSafeQuery(query: string, parameters: any[] = []): { query: string; params: any[] } {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    // Count placeholders in query
    const placeholderCount = (query.match(/\?/g) || []).length;
    
    if (placeholderCount !== parameters.length) {
      throw new Error(`Parameter count mismatch: query has ${placeholderCount} placeholders but ${parameters.length} parameters provided`);
    }

    // Sanitize parameters
    const safeParameters = parameters.map(param => this.prepareValue(param));

    return {
      query: query.trim(),
      params: safeParameters
    };
  }
}
