{{#if (eq project.database 'postgresql')}}
-- Migration: {{timestamp}}_{{snakeCase name}}.sql
-- Description: {{description}}

-- Up Migration
-- +migrate Up

{{#if (eq type 'create-table')}}
CREATE TABLE {{snakeCase (pluralize name)}} (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_{{snakeCase (pluralize name)}}_email ON {{snakeCase (pluralize name)}} (email);
CREATE INDEX idx_{{snakeCase (pluralize name)}}_created_at ON {{snakeCase (pluralize name)}} (created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_{{snakeCase (pluralize name)}}_updated_at
    BEFORE UPDATE ON {{snakeCase (pluralize name)}}
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
{{else if (eq type 'add-column')}}
ALTER TABLE {{snakeCase tableName}} 
ADD COLUMN {{snakeCase columnName}} {{columnType}}{{#if notNull}} NOT NULL{{/if}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}};

{{#if index}}
CREATE INDEX idx_{{snakeCase tableName}}_{{snakeCase columnName}} ON {{snakeCase tableName}} ({{snakeCase columnName}});
{{/if}}
{{else if (eq type 'drop-column')}}
ALTER TABLE {{snakeCase tableName}} 
DROP COLUMN {{snakeCase columnName}};
{{else if (eq type 'create-index')}}
CREATE INDEX {{indexName}} ON {{snakeCase tableName}} ({{columns}});
{{else if (eq type 'drop-index')}}
DROP INDEX {{indexName}};
{{/if}}

-- Down Migration
-- +migrate Down

{{#if (eq type 'create-table')}}
DROP TRIGGER IF EXISTS update_{{snakeCase (pluralize name)}}_updated_at ON {{snakeCase (pluralize name)}};
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS {{snakeCase (pluralize name)}};
{{else if (eq type 'add-column')}}
{{#if index}}
DROP INDEX IF EXISTS idx_{{snakeCase tableName}}_{{snakeCase columnName}};
{{/if}}
ALTER TABLE {{snakeCase tableName}} 
DROP COLUMN IF EXISTS {{snakeCase columnName}};
{{else if (eq type 'drop-column')}}
ALTER TABLE {{snakeCase tableName}} 
ADD COLUMN {{snakeCase columnName}} {{columnType}};
{{else if (eq type 'create-index')}}
DROP INDEX IF EXISTS {{indexName}};
{{else if (eq type 'drop-index')}}
CREATE INDEX {{indexName}} ON {{snakeCase tableName}} ({{columns}});
{{/if}}
{{else if (eq project.database 'mysql')}}
-- Migration: {{timestamp}}_{{snakeCase name}}.sql
-- Description: {{description}}

-- Up Migration
-- +migrate Up

{{#if (eq type 'create-table')}}
CREATE TABLE `{{snakeCase (pluralize name)}}` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX `idx_{{snakeCase (pluralize name)}}_email` ON `{{snakeCase (pluralize name)}}` (`email`);
CREATE INDEX `idx_{{snakeCase (pluralize name)}}_created_at` ON `{{snakeCase (pluralize name)}}` (`created_at`);
{{else if (eq type 'add-column')}}
ALTER TABLE `{{snakeCase tableName}}` 
ADD COLUMN `{{snakeCase columnName}}` {{columnType}}{{#if notNull}} NOT NULL{{/if}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}};

{{#if index}}
CREATE INDEX `idx_{{snakeCase tableName}}_{{snakeCase columnName}}` ON `{{snakeCase tableName}}` (`{{snakeCase columnName}}`);
{{/if}}
{{else if (eq type 'drop-column')}}
ALTER TABLE `{{snakeCase tableName}}` 
DROP COLUMN `{{snakeCase columnName}}`;
{{else if (eq type 'create-index')}}
CREATE INDEX `{{indexName}}` ON `{{snakeCase tableName}}` ({{columns}});
{{else if (eq type 'drop-index')}}
DROP INDEX `{{indexName}}` ON `{{snakeCase tableName}}`;
{{/if}}

-- Down Migration
-- +migrate Down

{{#if (eq type 'create-table')}}
DROP TABLE IF EXISTS `{{snakeCase (pluralize name)}}`;
{{else if (eq type 'add-column')}}
{{#if index}}
DROP INDEX `idx_{{snakeCase tableName}}_{{snakeCase columnName}}` ON `{{snakeCase tableName}}`;
{{/if}}
ALTER TABLE `{{snakeCase tableName}}` 
DROP COLUMN IF EXISTS `{{snakeCase columnName}}`;
{{else if (eq type 'drop-column')}}
ALTER TABLE `{{snakeCase tableName}}` 
ADD COLUMN `{{snakeCase columnName}}` {{columnType}};
{{else if (eq type 'create-index')}}
DROP INDEX `{{indexName}}` ON `{{snakeCase tableName}}`;
{{else if (eq type 'drop-index')}}
CREATE INDEX `{{indexName}}` ON `{{snakeCase tableName}}` ({{columns}});
{{/if}}
{{else if (eq project.database 'sqlite')}}
-- Migration: {{timestamp}}_{{snakeCase name}}.sql
-- Description: {{description}}

-- Up Migration
-- +migrate Up

{{#if (eq type 'create-table')}}
CREATE TABLE {{snakeCase (pluralize name)}} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_{{snakeCase (pluralize name)}}_email ON {{snakeCase (pluralize name)}} (email);
CREATE INDEX idx_{{snakeCase (pluralize name)}}_created_at ON {{snakeCase (pluralize name)}} (created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_{{snakeCase (pluralize name)}}_updated_at
    AFTER UPDATE ON {{snakeCase (pluralize name)}}
    FOR EACH ROW
    BEGIN
        UPDATE {{snakeCase (pluralize name)}} 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE id = NEW.id;
    END;
{{else if (eq type 'add-column')}}
ALTER TABLE {{snakeCase tableName}} 
ADD COLUMN {{snakeCase columnName}} {{columnType}}{{#if defaultValue}} DEFAULT {{defaultValue}}{{/if}};

{{#if index}}
CREATE INDEX idx_{{snakeCase tableName}}_{{snakeCase columnName}} ON {{snakeCase tableName}} ({{snakeCase columnName}});
{{/if}}
{{else if (eq type 'create-index')}}
CREATE INDEX {{indexName}} ON {{snakeCase tableName}} ({{columns}});
{{else if (eq type 'drop-index')}}
DROP INDEX {{indexName}};
{{/if}}

-- Down Migration
-- +migrate Down

{{#if (eq type 'create-table')}}
DROP TRIGGER IF EXISTS update_{{snakeCase (pluralize name)}}_updated_at;
DROP TABLE IF EXISTS {{snakeCase (pluralize name)}};
{{else if (eq type 'add-column')}}
{{#if index}}
DROP INDEX IF EXISTS idx_{{snakeCase tableName}}_{{snakeCase columnName}};
{{/if}}
-- SQLite doesn't support DROP COLUMN directly
-- You would need to recreate the table without the column
{{else if (eq type 'create-index')}}
DROP INDEX IF EXISTS {{indexName}};
{{else if (eq type 'drop-index')}}
CREATE INDEX {{indexName}} ON {{snakeCase tableName}} ({{columns}});
{{/if}}
{{/if}}
