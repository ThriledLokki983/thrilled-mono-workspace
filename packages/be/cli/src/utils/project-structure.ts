import fs from 'fs-extra';
import path from 'path';

export class ProjectStructure {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async create(projectDir: string, name: string) {
    // Create base directory structure
    await this.createBaseStructure(projectDir);
    
    // Create language-specific structure
    if (this.config.language === 'typescript') {
      await this.createTypeScriptStructure(projectDir);
    } else {
      await this.createJavaScriptStructure(projectDir);
    }

    // Create framework-specific structure
    await this.createFrameworkStructure(projectDir);

    // Create database-specific structure
    if (this.config.database && this.config.database !== 'none') {
      await this.createDatabaseStructure(projectDir);
    }

    // Create feature-specific structure
    await this.createFeatureStructure(projectDir);
  }

  private async createBaseStructure(projectDir: string) {
    const dirs = [
      'src',
      'src/controllers',
      'src/routes',
      'src/services',
      'src/middleware',
      'src/utils',
      'src/config',
      'tests',
      'tests/unit',
      'tests/integration',
      'docs',
      'logs'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }

    // Create .gitkeep files for empty directories
    const keepDirs = ['logs'];
    for (const dir of keepDirs) {
      await fs.writeFile(path.join(projectDir, dir, '.gitkeep'), '');
    }
  }

  private async createTypeScriptStructure(projectDir: string) {
    const dirs = [
      'src/types',
      'dist'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createJavaScriptStructure(projectDir: string) {
    // JavaScript-specific directories if needed
    const dirs = [
      'lib'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createFrameworkStructure(projectDir: string) {
    switch (this.config.framework) {
      case 'express':
        await this.createExpressStructure(projectDir);
        break;
      case 'fastify':
        await this.createFastifyStructure(projectDir);
        break;
      case 'nestjs':
        await this.createNestJSStructure(projectDir);
        break;
    }
  }

  private async createExpressStructure(projectDir: string) {
    const dirs = [
      'src/routes',
      'src/middleware',
      'public',
      'views'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createFastifyStructure(projectDir: string) {
    const dirs = [
      'src/plugins',
      'src/routes',
      'static'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createNestJSStructure(projectDir: string) {
    const dirs = [
      'src/modules',
      'src/decorators',
      'src/guards',
      'src/interceptors',
      'src/pipes',
      'src/filters'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createDatabaseStructure(projectDir: string) {
    const dirs = [
      'src/models',
      'src/entities',
      'migrations',
      'seeders'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }

    // Database-specific directories
    switch (this.config.database) {
      case 'postgresql':
      case 'mysql':
        await fs.ensureDir(path.join(projectDir, 'src/repositories'));
        break;
      case 'mongodb':
        await fs.ensureDir(path.join(projectDir, 'src/schemas'));
        break;
    }
  }

  private async createFeatureStructure(projectDir: string) {
    const features = this.config.features || [];

    for (const feature of features) {
      switch (feature) {
        case 'auth':
          await this.createAuthStructure(projectDir);
          break;
        case 'upload':
          await this.createUploadStructure(projectDir);
          break;
        case 'email':
          await this.createEmailStructure(projectDir);
          break;
        case 'monitoring':
          await this.createMonitoringStructure(projectDir);
          break;
        case 'swagger':
          await this.createSwaggerStructure(projectDir);
          break;
      }
    }
  }

  private async createAuthStructure(projectDir: string) {
    const dirs = [
      'src/auth',
      'src/auth/strategies',
      'src/auth/guards'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createUploadStructure(projectDir: string) {
    const dirs = [
      'uploads',
      'uploads/temp',
      'uploads/images',
      'uploads/documents'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }

    // Create .gitkeep files
    for (const dir of dirs.slice(1)) {
      await fs.writeFile(path.join(projectDir, dir, '.gitkeep'), '');
    }
  }

  private async createEmailStructure(projectDir: string) {
    const dirs = [
      'src/email',
      'src/email/templates'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createMonitoringStructure(projectDir: string) {
    const dirs = [
      'src/monitoring',
      'metrics'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }

  private async createSwaggerStructure(projectDir: string) {
    const dirs = [
      'docs/api'
    ];

    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectDir, dir));
    }
  }
}
