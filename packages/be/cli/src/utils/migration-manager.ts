import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export interface MigrationResult {
  migrations: string[];
}

export interface MigrationStatus {
  executed: Array<{ name: string; executedAt: string }>;
  pending: string[];
}

interface MigrationData {
  migrations: Array<{ name: string; executedAt: string }>;
}

export class MigrationManager {
  private migrationsDir: string;

  constructor(env = 'development') {
    // env parameter kept for potential future use
    this.migrationsDir = path.join(process.cwd(), 'migrations');
  }

  async up(steps?: number): Promise<MigrationResult> {
    const pendingMigrations = await this.getPendingMigrations();
    const migrationsToRun = steps 
      ? pendingMigrations.slice(0, steps)
      : pendingMigrations;

    const result: MigrationResult = {
      migrations: []
    };

    for (const migration of migrationsToRun) {
      await this.executeMigration(migration, 'up');
      await this.recordMigration(migration);
      result.migrations.push(migration);
    }

    return result;
  }

  async down(steps = 1): Promise<MigrationResult> {
    const executedMigrations = await this.getExecutedMigrations();
    const migrationsToRollback = executedMigrations
      .reverse()
      .slice(0, steps);

    const result: MigrationResult = {
      migrations: []
    };

    for (const migration of migrationsToRollback) {
      await this.executeMigration(migration.name, 'down');
      await this.removeMigrationRecord(migration.name);
      result.migrations.push(migration.name);
    }

    return result;
  }

  async status(): Promise<MigrationStatus> {
    const allMigrations = await this.getAllMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = executedMigrations.map(m => m.name);
    
    const pending = allMigrations.filter(m => !executedNames.includes(m));

    return {
      executed: executedMigrations,
      pending
    };
  }

  async reset(): Promise<void> {
    const executedMigrations = await this.getExecutedMigrations();
    
    // Rollback all migrations in reverse order
    for (const migration of executedMigrations.reverse()) {
      await this.executeMigration(migration.name, 'down');
      await this.removeMigrationRecord(migration.name);
    }
  }

  private async getAllMigrations(): Promise<string[]> {
    if (!await fs.pathExists(this.migrationsDir)) {
      return [];
    }

    const files = await glob('*.{js,ts}', { 
      cwd: this.migrationsDir,
      ignore: ['*.d.ts']
    });

    return files
      .map(file => path.parse(file).name)
      .sort();
  }

  private async getPendingMigrations(): Promise<string[]> {
    const allMigrations = await this.getAllMigrations();
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = executedMigrations.map(m => m.name);
    
    return allMigrations.filter(m => !executedNames.includes(m));
  }

  private async getExecutedMigrations(): Promise<Array<{ name: string; executedAt: string }>> {
    const migrationTablePath = path.join(process.cwd(), '.migrations.json');
    
    if (!await fs.pathExists(migrationTablePath)) {
      return [];
    }

    try {
      const data = await fs.readJSON(migrationTablePath);
      return data.migrations || [];
    } catch (error) {
      return [];
    }
  }

  private async executeMigration(migrationName: string, direction: 'up' | 'down'): Promise<void> {
    const migrationFile = await this.findMigrationFile(migrationName);
    
    if (!migrationFile) {
      throw new Error(`Migration file not found: ${migrationName}`);
    }

    // Import and execute the migration
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    try {
      // For JavaScript/TypeScript files, we would dynamically import
      // and call the up() or down() method
      const migration = require(migrationPath);
      
      if (typeof migration[direction] === 'function') {
        await migration[direction]();
      } else {
        throw new Error(`Migration ${migrationName} does not have a ${direction}() method`);
      }
    } catch (error) {
      throw new Error(`Failed to execute migration ${migrationName}: ${(error as any).message}`);
    }
  }

  private async findMigrationFile(migrationName: string): Promise<string | null> {
    const extensions = ['js', 'ts'];
    
    for (const ext of extensions) {
      const fileName = `${migrationName}.${ext}`;
      const filePath = path.join(this.migrationsDir, fileName);
      
      if (await fs.pathExists(filePath)) {
        return fileName;
      }
    }
    
    return null;
  }

  private async recordMigration(migrationName: string): Promise<void> {
    const migrationTablePath = path.join(process.cwd(), '.migrations.json');
    
    let data: MigrationData = { migrations: [] };
    
    if (await fs.pathExists(migrationTablePath)) {
      try {
        data = await fs.readJSON(migrationTablePath);
      } catch (error) {
        // If file is corrupted, start fresh
        data = { migrations: [] };
      }
    }

    // Add migration record
    data.migrations.push({
      name: migrationName,
      executedAt: new Date().toISOString()
    });

    await fs.writeJSON(migrationTablePath, data, { spaces: 2 });
  }

  private async removeMigrationRecord(migrationName: string): Promise<void> {
    const migrationTablePath = path.join(process.cwd(), '.migrations.json');
    
    if (!await fs.pathExists(migrationTablePath)) {
      return;
    }

    try {
      const data = await fs.readJSON(migrationTablePath);
      data.migrations = data.migrations.filter((m: any) => m.name !== migrationName);
      
      await fs.writeJSON(migrationTablePath, data, { spaces: 2 });
    } catch (error) {
      // If file is corrupted, ignore
    }
  }
}
