import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class EnvironmentValidator {
  async validate(env = 'development'): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      const envFile = `.env.${env}`;
      const envPath = path.join(process.cwd(), envFile);

      // Check if environment file exists
      if (!await fs.pathExists(envPath)) {
        result.errors.push(`Environment file ${envFile} not found`);
        result.isValid = false;
        return result;
      }

      // Load environment variables
      const envContent = await fs.readFile(envPath, 'utf-8');
      const envConfig = dotenv.parse(envContent);

      // Validate required variables
      await this.validateRequired(envConfig, result);
      
      // Validate database configuration
      await this.validateDatabase(envConfig, result);
      
      // Validate security configuration
      await this.validateSecurity(envConfig, result);
      
      // Validate API configuration
      await this.validateAPI(envConfig, result);

      // Validate file paths
      await this.validatePaths(envConfig, result);

    } catch (error) {
      result.errors.push(`Failed to validate environment: ${(error as any).message}`);
      result.isValid = false;
    }

    return result;
  }

  private async validateRequired(envConfig: Record<string, string>, result: ValidationResult) {
    const required = [
      'NODE_ENV',
      'PORT',
      'APP_NAME'
    ];

    for (const key of required) {
      if (!envConfig[key]) {
        result.errors.push(`Required environment variable ${key} is missing`);
        result.isValid = false;
      }
    }

    // Validate NODE_ENV values
    if (envConfig.NODE_ENV && !['development', 'production', 'test', 'staging'].includes(envConfig.NODE_ENV)) {
      result.warnings.push(`NODE_ENV value '${envConfig.NODE_ENV}' is not standard`);
    }

    // Validate PORT
    if (envConfig.PORT) {
      const port = parseInt(envConfig.PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        result.errors.push(`PORT must be a valid port number (1-65535)`);
        result.isValid = false;
      }
    }
  }

  private async validateDatabase(envConfig: Record<string, string>, result: ValidationResult) {
    const dbKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER'];
    const hasAnyDbKey = dbKeys.some(key => envConfig[key]);

    if (hasAnyDbKey) {
      // If any database key is present, check for required ones
      const requiredDbKeys = ['DB_HOST', 'DB_NAME'];
      
      for (const key of requiredDbKeys) {
        if (!envConfig[key]) {
          result.errors.push(`Database configuration incomplete: ${key} is missing`);
          result.isValid = false;
        }
      }

      // Validate DB_PORT
      if (envConfig.DB_PORT) {
        const port = parseInt(envConfig.DB_PORT);
        if (isNaN(port) || port < 1 || port > 65535) {
          result.errors.push(`DB_PORT must be a valid port number`);
          result.isValid = false;
        }
      }

      // Warn about missing password in non-development environments
      if (!envConfig.DB_PASSWORD && envConfig.NODE_ENV !== 'development') {
        result.warnings.push(`DB_PASSWORD is not set for ${envConfig.NODE_ENV} environment`);
      }
    }
  }

  private async validateSecurity(envConfig: Record<string, string>, result: ValidationResult) {
    // Validate JWT_SECRET
    if (envConfig.JWT_SECRET) {
      if (envConfig.JWT_SECRET.length < 32) {
        result.warnings.push(`JWT_SECRET should be at least 32 characters long for security`);
      }
      
      if (envConfig.JWT_SECRET === 'your-super-secret-jwt-key-here') {
        result.errors.push(`JWT_SECRET is using the default template value`);
        result.isValid = false;
      }
    }

    // Validate SESSION_SECRET
    if (envConfig.SESSION_SECRET) {
      if (envConfig.SESSION_SECRET.length < 32) {
        result.warnings.push(`SESSION_SECRET should be at least 32 characters long`);
      }
      
      if (envConfig.SESSION_SECRET === 'your-session-secret-here') {
        result.errors.push(`SESSION_SECRET is using the default template value`);
        result.isValid = false;
      }
    }

    // Validate BCRYPT_ROUNDS
    if (envConfig.BCRYPT_ROUNDS) {
      const rounds = parseInt(envConfig.BCRYPT_ROUNDS);
      if (isNaN(rounds) || rounds < 10 || rounds > 15) {
        result.warnings.push(`BCRYPT_ROUNDS should be between 10-15 for optimal security`);
      }
    }
  }

  private async validateAPI(envConfig: Record<string, string>, result: ValidationResult) {
    // Validate CORS_ORIGIN
    if (envConfig.CORS_ORIGIN) {
      if (envConfig.CORS_ORIGIN === '*' && envConfig.NODE_ENV === 'production') {
        result.warnings.push(`CORS_ORIGIN is set to '*' in production environment`);
      }
    }

    // Validate API_RATE_LIMIT
    if (envConfig.API_RATE_LIMIT) {
      const limit = parseInt(envConfig.API_RATE_LIMIT);
      if (isNaN(limit) || limit < 1) {
        result.errors.push(`API_RATE_LIMIT must be a positive number`);
        result.isValid = false;
      }
    }

    // Validate upload size
    if (envConfig.UPLOAD_MAX_SIZE) {
      const sizePattern = /^(\d+)(mb|gb|kb)$/i;
      if (!sizePattern.test(envConfig.UPLOAD_MAX_SIZE)) {
        result.errors.push(`UPLOAD_MAX_SIZE must be in format like '10mb', '1gb', etc.`);
        result.isValid = false;
      }
    }
  }

  private async validatePaths(envConfig: Record<string, string>, result: ValidationResult) {
    const pathKeys = ['LOG_FILE'];
    
    for (const key of pathKeys) {
      if (envConfig[key]) {
        const filePath = path.resolve(envConfig[key]);
        const dir = path.dirname(filePath);
        
        try {
          await fs.ensureDir(dir);
        } catch (error) {
          result.warnings.push(`Cannot ensure directory for ${key}: ${dir}`);
        }
      }
    }
  }
}
