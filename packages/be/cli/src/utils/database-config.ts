import fs from 'fs-extra';
import path from 'path';
import execa from 'execa';
import dotenv from 'dotenv';

export interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
}

export class DatabaseConfig {
  private config: DatabaseConnectionConfig;

  constructor(config: DatabaseConnectionConfig, env: string) {
    this.config = config;
    // env parameter kept for potential future use
  }

  static async load(env = 'development'): Promise<DatabaseConfig> {
    const envFile = `.env.${env}`;
    const envPath = path.join(process.cwd(), envFile);

    if (!await fs.pathExists(envPath)) {
      throw new Error(`Environment file ${envFile} not found`);
    }

    const envContent = await fs.readFile(envPath, 'utf-8');
    const envConfig = dotenv.parse(envContent);

    const config: DatabaseConnectionConfig = {
      host: envConfig.DB_HOST || 'localhost',
      port: parseInt(envConfig.DB_PORT || '5432'),
      database: envConfig.DB_NAME || 'thrilled',
      username: envConfig.DB_USER || 'postgres',
      password: envConfig.DB_PASSWORD || '',
      type: (envConfig.DB_TYPE as any) || 'postgresql'
    };

    return new DatabaseConfig(config, env);
  }

  async createDatabase(): Promise<void> {
    switch (this.config.type) {
      case 'postgresql':
        await this.createPostgreSQLDatabase();
        break;
      case 'mysql':
        await this.createMySQLDatabase();
        break;
      case 'sqlite':
        await this.createSQLiteDatabase();
        break;
      case 'mongodb':
        await this.createMongoDatabase();
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  async dropDatabase(): Promise<void> {
    switch (this.config.type) {
      case 'postgresql':
        await this.dropPostgreSQLDatabase();
        break;
      case 'mysql':
        await this.dropMySQLDatabase();
        break;
      case 'sqlite':
        await this.dropSQLiteDatabase();
        break;
      case 'mongodb':
        await this.dropMongoDatabase();
        break;
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  async runMigrations(): Promise<void> {
    const migrationsDir = path.join(process.cwd(), 'migrations');
    
    if (!await fs.pathExists(migrationsDir)) {
      return; // No migrations to run
    }

    // This would typically use a migration tool like Knex, TypeORM, or Sequelize
    // For now, we'll just log that migrations would be run
    console.log(`Running migrations for ${this.config.type} database...`);
    
    // Example implementation would depend on the migration tool used
    // await execa('npx', ['knex', 'migrate:latest'], { cwd: process.cwd() });
  }

  async runSeeders(): Promise<void> {
    const seedersDir = path.join(process.cwd(), 'seeders');
    
    if (!await fs.pathExists(seedersDir)) {
      return; // No seeders to run
    }

    console.log(`Running seeders for ${this.config.type} database...`);
    
    // Example implementation would depend on the seeding tool used
    // await execa('npx', ['knex', 'seed:run'], { cwd: process.cwd() });
  }

  async runSeeder(seederName: string): Promise<void> {
    console.log(`Running seeder ${seederName} for ${this.config.type} database...`);
    
    // Example implementation for specific seeder
    // await execa('npx', ['knex', 'seed:run', '--specific', seederName], { cwd: process.cwd() });
  }

  private async createPostgreSQLDatabase(): Promise<void> {
    const connectionString = `postgresql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/postgres`;
    
    try {
      await execa('psql', [
        connectionString,
        '-c',
        `CREATE DATABASE "${this.config.database}";`
      ]);
    } catch (error) {
      if (!(error as any).message.includes('already exists')) {
        throw error;
      }
    }
  }

  private async dropPostgreSQLDatabase(): Promise<void> {
    const connectionString = `postgresql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/postgres`;
    
    await execa('psql', [
      connectionString,
      '-c',
      `DROP DATABASE IF EXISTS "${this.config.database}";`
    ]);
  }

  private async createMySQLDatabase(): Promise<void> {
    const args = [
      '-h', this.config.host,
      '-P', this.config.port.toString(),
      '-u', this.config.username
    ];

    if (this.config.password) {
      args.push('-p' + this.config.password);
    }

    args.push('-e', `CREATE DATABASE IF NOT EXISTS \`${this.config.database}\`;`);

    await execa('mysql', args);
  }

  private async dropMySQLDatabase(): Promise<void> {
    const args = [
      '-h', this.config.host,
      '-P', this.config.port.toString(),
      '-u', this.config.username
    ];

    if (this.config.password) {
      args.push('-p' + this.config.password);
    }

    args.push('-e', `DROP DATABASE IF EXISTS \`${this.config.database}\`;`);

    await execa('mysql', args);
  }

  private async createSQLiteDatabase(): Promise<void> {
    const dbPath = path.join(process.cwd(), 'database', `${this.config.database}.db`);
    await fs.ensureDir(path.dirname(dbPath));
    
    // SQLite creates the database file automatically when first accessed
    await fs.ensureFile(dbPath);
  }

  private async dropSQLiteDatabase(): Promise<void> {
    const dbPath = path.join(process.cwd(), 'database', `${this.config.database}.db`);
    
    if (await fs.pathExists(dbPath)) {
      await fs.remove(dbPath);
    }
  }

  private async createMongoDatabase(): Promise<void> {
    // MongoDB creates databases automatically when first accessed
    console.log(`MongoDB database ${this.config.database} will be created automatically when first accessed`);
  }

  private async dropMongoDatabase(): Promise<void> {
    const connectionString = `mongodb://${this.config.host}:${this.config.port}`;
    
    await execa('mongo', [
      connectionString,
      '--eval',
      `db.getSiblingDB('${this.config.database}').dropDatabase()`
    ]);
  }
}
