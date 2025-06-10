import fs from 'fs-extra';
import path from 'path';

export interface ProjectInfo {
  name: string;
  language: 'typescript' | 'javascript';
  framework: 'express' | 'fastify' | 'nestjs' | 'custom';
  database?: string;
  features: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm';
  isMonorepo: boolean;
  rootDir: string;
}

export class ProjectDetector {
  async detect(dir: string = process.cwd()): Promise<ProjectInfo | null> {
    try {
      // Check if we're in a Thrilled project
      const packageJsonPath = path.join(dir, 'package.json');
      
      if (!await fs.pathExists(packageJsonPath)) {
        return null;
      }

      const packageJson = await fs.readJSON(packageJsonPath);
      
      // Check for Thrilled CLI marker or specific dependencies
      const isThrilled = this.isThrilled(packageJson);
      if (!isThrilled) {
        return null;
      }

      // Detect language
      const language = await this.detectLanguage(dir);
      
      // Detect framework
      const framework = this.detectFramework(packageJson);
      
      // Detect database
      const database = this.detectDatabase(packageJson);
      
      // Detect features
      const features = this.detectFeatures(packageJson);
      
      // Detect package manager
      const packageManager = await this.detectPackageManager(dir);
      
      // Check if monorepo
      const isMonorepo = await this.isMonorepo(dir);

      return {
        name: packageJson.name || path.basename(dir),
        language,
        framework,
        database,
        features,
        packageManager,
        isMonorepo,
        rootDir: dir
      };

    } catch (error) {
      return null;
    }
  }

  private isThrilled(packageJson: any): boolean {
    // Check for Thrilled-specific markers
    if (packageJson.thrilled) return true;
    
    // Check for Thrilled dependencies
    const thrilledDeps = [
      '@thrilled/core',
      '@thrilled/auth',
      '@thrilled/validation',
      '@thrilled/monitoring'
    ];

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    return thrilledDeps.some(dep => deps[dep]);
  }

  private async detectLanguage(dir: string): Promise<'typescript' | 'javascript'> {
    // Check for TypeScript config
    const tsConfigPath = path.join(dir, 'tsconfig.json');
    if (await fs.pathExists(tsConfigPath)) {
      return 'typescript';
    }

    // Check for TypeScript files in src
    const srcDir = path.join(dir, 'src');
    if (await fs.pathExists(srcDir)) {
      const files = await fs.readdir(srcDir);
      const hasTypeScript = files.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
      if (hasTypeScript) {
        return 'typescript';
      }
    }

    return 'javascript';
  }

  private detectFramework(packageJson: any): 'express' | 'fastify' | 'nestjs' | 'custom' {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (deps['@nestjs/core']) return 'nestjs';
    if (deps['fastify']) return 'fastify';
    if (deps['express']) return 'express';
    
    return 'custom';
  }

  private detectDatabase(packageJson: any): string | undefined {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (deps['pg'] || deps['postgresql']) return 'postgresql';
    if (deps['mysql'] || deps['mysql2']) return 'mysql';
    if (deps['sqlite3'] || deps['better-sqlite3']) return 'sqlite';
    if (deps['mongodb'] || deps['mongoose']) return 'mongodb';
    if (deps['redis']) return 'redis';
    
    return undefined;
  }

  private detectFeatures(packageJson: any): string[] {
    const features: string[] = [];
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (deps['@thrilled/auth'] || deps['passport'] || deps['jsonwebtoken']) {
      features.push('auth');
    }
    
    if (deps['swagger-ui-express'] || deps['@nestjs/swagger']) {
      features.push('swagger');
    }
    
    if (deps['@thrilled/validation'] || deps['joi'] || deps['yup'] || deps['zod']) {
      features.push('validation');
    }
    
    if (deps['winston'] || deps['pino'] || deps['morgan']) {
      features.push('logging');
    }
    
    if (deps['express-rate-limit'] || deps['@fastify/rate-limit']) {
      features.push('rateLimit');
    }
    
    if (deps['cors']) {
      features.push('cors');
    }
    
    if (deps['@thrilled/monitoring']) {
      features.push('monitoring');
    }
    
    if (deps['multer'] || deps['@fastify/multipart']) {
      features.push('upload');
    }
    
    if (deps['nodemailer'] || deps['@sendgrid/mail']) {
      features.push('email');
    }
    
    if (deps['redis'] || deps['ioredis']) {
      features.push('cache');
    }
    
    if (deps['jest'] || deps['vitest'] || deps['mocha']) {
      features.push('testing');
    }

    return features;
  }

  private async detectPackageManager(dir: string): Promise<'npm' | 'yarn' | 'pnpm'> {
    if (await fs.pathExists(path.join(dir, 'yarn.lock'))) {
      return 'yarn';
    }
    
    if (await fs.pathExists(path.join(dir, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    
    return 'npm';
  }

  private async isMonorepo(dir: string): Promise<boolean> {
    // Check for nx.json
    if (await fs.pathExists(path.join(dir, 'nx.json'))) {
      return true;
    }
    
    // Check for lerna.json
    if (await fs.pathExists(path.join(dir, 'lerna.json'))) {
      return true;
    }
    
    // Check for workspace structure
    const packageJsonPath = path.join(dir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      if (packageJson.workspaces) {
        return true;
      }
    }
    
    return false;
  }
}
