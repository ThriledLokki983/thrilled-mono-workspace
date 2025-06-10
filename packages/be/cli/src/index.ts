export * from './lib/cli.js';

// Re-export main functionality for library usage
export { createApp } from './commands/create-app.js';
export { generateCommand } from './commands/generate.js';
export { databaseCommands } from './commands/database.js';
export { migrationCommands } from './commands/migration.js';
export { environmentCommands } from './commands/environment.js';
export { devCommands } from './commands/dev.js';

export { Logger } from './utils/logger.js';
export { ProjectDetector } from './utils/project-detector.js';
export { TemplateEngine } from './utils/template-engine.js';
export { ProjectStructure } from './utils/project-structure.js';
export { EnvironmentValidator } from './utils/environment-validator.js';
export { DatabaseConfig } from './utils/database-config.js';
export { MigrationManager } from './utils/migration-manager.js';
