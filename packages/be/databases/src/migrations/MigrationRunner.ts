import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { MigrationConfig, MigrationStatus } from '@thrilled/be-types';
import { Logger } from '@mono/be-core';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down?: string;
  checksum?: string;
}

export class MigrationRunner {
  private migrationsTable: string;
  private migrationsDirectory: string;

  constructor(
    private pool: Pool,
    config: MigrationConfig = {},
    private logger: Logger
  ) {
    this.migrationsTable = config.tableName || 'migrations';
    this.migrationsDirectory = config.directory || 'migrations';
    // Logger from be-core doesn't have child method
  }

  /**
   * Initialize migrations table if it doesn't exist
   */
  private async initializeMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum VARCHAR(64),
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT TRUE
      )
    `;

    try {
      await this.pool.query(createTableQuery);
      this.logger.debug(
        `Migrations table '${this.migrationsTable}' initialized`
      );
    } catch (error) {
      this.logger.error('Failed to initialize migrations table:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load migration files from directory
   */
  private async loadMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await readdir(this.migrationsDirectory);
      const migrationFiles = files
        .filter((file) => extname(file) === '.sql')
        .sort(); // Ensure alphabetical order

      const migrations: Migration[] = [];

      for (const file of migrationFiles) {
        const filePath = join(this.migrationsDirectory, file);
        const content = await readFile(filePath, 'utf-8');

        // Split content by special comments to separate up/down migrations
        const sections = this.parseMigrationContent(content);

        const migration: Migration = {
          id: this.extractMigrationId(file),
          name: file,
          up: sections.up,
          down: sections.down,
          checksum: this.calculateChecksum(content),
        };

        migrations.push(migration);
      }

      return migrations;
    } catch (error) {
      this.logger.error('Failed to load migration files:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Parse migration content to extract up and down sections
   */
  private parseMigrationContent(content: string): {
    up: string;
    down?: string;
  } {
    const upMatch = content.match(/--\s*UP\s*$(.*?)(?=--\s*DOWN|$)/ms);
    const downMatch = content.match(/--\s*DOWN\s*$(.*?)$/ms);

    return {
      up: upMatch ? upMatch[1].trim() : content.trim(),
      down: downMatch ? downMatch[1].trim() : undefined,
    };
  }

  /**
   * Extract migration ID from filename
   */
  private extractMigrationId(filename: string): string {
    // Extract timestamp/version from filename (e.g., 20240101120000_create_users.sql -> 20240101120000)
    const match = filename.match(/^(\d+)/);
    return match ? match[1] : filename.replace('.sql', '');
  }

  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<MigrationStatus[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, name, applied_at FROM ${this.migrationsTable} WHERE success = true ORDER BY applied_at`
      );

      return result.rows.map((row) => ({
        name: row.name,
        appliedAt: row.applied_at,
        version: row.id,
      }));
    } catch (error) {
      this.logger.error('Failed to get applied migrations:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');

      // Execute the migration
      await client.query(migration.up);

      // Record the migration
      await client.query(
        `INSERT INTO ${this.migrationsTable} (id, name, checksum, execution_time_ms, success) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          migration.id,
          migration.name,
          migration.checksum,
          Date.now() - startTime,
          true,
        ]
      );

      await client.query('COMMIT');

      this.logger.info(
        `Applied migration: ${migration.name} (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      await client.query('ROLLBACK');

      // Record failed migration
      try {
        await client.query(
          `INSERT INTO ${this.migrationsTable} (id, name, checksum, execution_time_ms, success) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            migration.id,
            migration.name,
            migration.checksum,
            Date.now() - startTime,
            false,
          ]
        );
        await client.query('COMMIT');
      } catch (recordError) {
        this.logger.error('Failed to record migration failure:', {
          error:
            recordError instanceof Error
              ? recordError.message
              : String(recordError),
        });
      }

      this.logger.error(`Failed to apply migration ${migration.name}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a single migration
   */
  private async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(
        `Migration ${migration.name} does not have a rollback script`
      );
    }

    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');

      // Execute the rollback
      await client.query(migration.down);

      // Remove the migration record
      await client.query(`DELETE FROM ${this.migrationsTable} WHERE id = $1`, [
        migration.id,
      ]);

      await client.query('COMMIT');

      this.logger.info(
        `Rolled back migration: ${migration.name} (${Date.now() - startTime}ms)`
      );
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Failed to rollback migration ${migration.name}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run pending migrations
   */
  async runMigrations(_connectionName?: string): Promise<void> {
    try {
      this.logger.info('Starting migration process...');

      // Initialize migrations table
      await this.initializeMigrationsTable();

      // Load migration files
      const migrations = await this.loadMigrationFiles();

      if (migrations.length === 0) {
        this.logger.info('No migration files found');
        return;
      }

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedIds = new Set(appliedMigrations.map((m) => m.version));

      // Filter pending migrations
      const pendingMigrations = migrations.filter((m) => !appliedIds.has(m.id));

      if (pendingMigrations.length === 0) {
        this.logger.info('No pending migrations to apply');
        return;
      }

      this.logger.info(`Found ${pendingMigrations.length} pending migrations`);

      // Apply pending migrations
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }

      this.logger.info(
        `Successfully applied ${pendingMigrations.length} migrations`
      );
    } catch (error) {
      this.logger.error('Migration process failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Rollback migrations to a specific version
   */
  async rollbackTo(targetVersion: string): Promise<void> {
    try {
      this.logger.info(`Rolling back to version: ${targetVersion}`);

      // Load migration files
      const migrations = await this.loadMigrationFiles();

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();

      // Find migrations to rollback (in reverse order)
      const migrationsToRollback = appliedMigrations
        .filter((applied) => applied.version > targetVersion)
        .reverse();

      if (migrationsToRollback.length === 0) {
        this.logger.info('No migrations to rollback');
        return;
      }

      this.logger.info(
        `Rolling back ${migrationsToRollback.length} migrations`
      );

      // Rollback migrations
      for (const appliedMigration of migrationsToRollback) {
        const migration = migrations.find(
          (m) => m.id === appliedMigration.version
        );
        if (migration) {
          await this.rollbackMigration(migration);
        } else {
          this.logger.warn(
            `Migration file not found for version: ${appliedMigration.version}`
          );
        }
      }

      this.logger.info(`Successfully rolled back to version: ${targetVersion}`);
    } catch (error) {
      this.logger.error('Rollback process failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: MigrationStatus[];
    pending: string[];
    total: number;
  }> {
    try {
      // Initialize migrations table
      await this.initializeMigrationsTable();

      // Load migration files
      const migrations = await this.loadMigrationFiles();

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedIds = new Set(appliedMigrations.map((m) => m.version));

      // Filter pending migrations
      const pendingMigrations = migrations
        .filter((m) => !appliedIds.has(m.id))
        .map((m) => m.name);

      return {
        applied: appliedMigrations,
        pending: pendingMigrations,
        total: migrations.length,
      };
    } catch (error) {
      this.logger.error('Failed to get migration status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a new migration file
   */
  async createMigration(
    name: string,
    content?: { up: string; down?: string }
  ): Promise<string> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 14);
    const filename = `${timestamp}_${name
      .replace(/\s+/g, '_')
      .toLowerCase()}.sql`;
    const filepath = join(this.migrationsDirectory, filename);

    const migrationContent = content
      ? `-- UP
${content.up}

${
  content.down
    ? `-- DOWN
${content.down}`
    : `-- DOWN
-- Add rollback statements here`
}`
      : `-- UP
-- Add your migration statements here

-- DOWN  
-- Add rollback statements here`;

    try {
      await readFile(filepath, 'utf-8');
      throw new Error(`Migration file already exists: ${filename}`);
    } catch (error) {
      // File doesn't exist, which is what we want
    }

    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filepath, migrationContent, 'utf-8');
      this.logger.info(`Created migration file: ${filename}`);
      return filepath;
    } catch (error) {
      this.logger.error('Failed to create migration file:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
