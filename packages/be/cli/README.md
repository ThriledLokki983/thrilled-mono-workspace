# @thrilled/cli

A comprehensive command-line interface for the Thrilled Backend Framework that provides project generation, code scaffolding, database management, and development tools.

## 🚀 Features

- **Project Generation** - Create new backend applications with interactive setup
- **Code Scaffolding** - Generate routes, models, services, plugins, and tests
- **Database Management** - Create, drop, reset, and seed databases
- **Migration System** - Manage database migrations with up/down support
- **Environment Management** - Validate and manage environment configuration
- **Development Tools** - Build, test, lint, and format your code

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g @thrilled/cli
# or
yarn global add @thrilled/cli
```

### Local Installation

```bash
npm install --save-dev @thrilled/cli
# or
yarn add --dev @thrilled/cli
```

## 🎯 Quick Start

### Create a New Application

```bash
# Using the standalone create command
npx create-be-app my-app

# Or using the main CLI
thrilled create-app my-app
```

### Interactive Setup

The CLI will guide you through an interactive setup process:

```bash
? What is your application name? my-awesome-api
? Choose a template: Express TypeScript
? Select a database: PostgreSQL
? Enable authentication? Yes
? Enable input validation? Yes
? Install dependencies now? Yes
? Initialize git repository? Yes
```

## 📚 Commands

### Project Creation

#### `thrilled create-app [name]`
Creates a new backend application with interactive setup.

**Aliases:** `new`

**Options:**
- `-t, --template <template>` - Template to use (express, fastify)
- `-d, --directory <dir>` - Directory to create the app in
- `--typescript` - Use TypeScript (default)
- `--javascript` - Use JavaScript
- `--skip-install` - Skip npm install
- `--skip-git` - Skip git initialization

**Examples:**
```bash
# Interactive setup
thrilled create-app

# With specific options
thrilled create-app my-api --template express --typescript

# JavaScript project
thrilled create-app my-api --javascript

# Skip installation and git
thrilled create-app my-api --skip-install --skip-git
```

### Code Generation

#### `thrilled generate [type]`
Generates code scaffolding for various components.

**Aliases:** `g`

**Available Generators:**
- `route` - Generate API route with controller
- `model` - Generate database model
- `service` - Generate business logic service
- `plugin` - Generate reusable plugin
- `test` - Generate test files

**Examples:**
```bash
# Generate a new route
thrilled generate route users

# Generate a model
thrilled generate model User

# Generate a service
thrilled generate service EmailService

# Generate with options
thrilled generate route posts --auth --validation
```

### Database Management

#### `thrilled db [command]`
Manages database operations.

**Commands:**
- `create` - Create database
- `drop` - Drop database
- `reset` - Drop and recreate database
- `seed` - Run database seeders

**Options:**
- `--env <environment>` - Environment (default: development)
- `--force` - Skip confirmation prompts
- `--seeder <name>` - Run specific seeder

**Examples:**
```bash
# Create development database
thrilled db create

# Drop production database (with confirmation)
thrilled db drop --env production

# Reset database and run migrations
thrilled db reset

# Run all seeders
thrilled db seed

# Run specific seeder
thrilled db seed --seeder UserSeeder
```

### Migration Management

#### `thrilled migrate [command]`
Manages database migrations.

**Aliases:** `migration`

**Commands:**
- `create <name>` - Create new migration
- `up` - Run pending migrations
- `down` - Rollback migrations
- `status` - Show migration status
- `refresh` - Rollback all and re-run migrations

**Options:**
- `--env <environment>` - Environment (default: development)
- `--steps <number>` - Number of migrations to run/rollback
- `--force` - Skip confirmation prompts

**Examples:**
```bash
# Create a new migration
thrilled migrate create add_users_table

# Run all pending migrations
thrilled migrate up

# Run specific number of migrations
thrilled migrate up --steps 2

# Rollback last migration
thrilled migrate down

# Check migration status
thrilled migrate status

# Refresh all migrations
thrilled migrate refresh
```

### Environment Management

#### `thrilled env [command]`
Manages environment configuration.

**Commands:**
- `init` - Initialize environment files
- `validate` - Validate environment configuration
- `copy <from> <to>` - Copy environment file

**Examples:**
```bash
# Initialize environment files
thrilled env init

# Validate current environment
thrilled env validate

# Validate specific environment
thrilled env validate --env production

# Copy environment file
thrilled env copy development staging
```

### Development Tools

#### `thrilled dev [command]`
Development workflow commands.

**Commands:**
- `start` - Start development server
- `build` - Build the application
- `test` - Run tests
- `lint` - Run linter
- `format` - Format code

**Options:**
- `--port <port>` - Server port (default: 3000)
- `--watch` - Watch mode for tests
- `--fix` - Auto-fix linting issues
- `--coverage` - Generate test coverage

**Examples:**
```bash
# Start development server
thrilled dev start

# Start on specific port
thrilled dev start --port 8080

# Build for production
thrilled dev build

# Run tests with coverage
thrilled dev test --coverage

# Run tests in watch mode
thrilled dev test --watch

# Lint and fix issues
thrilled dev lint --fix

# Format all code
thrilled dev format
```

## 🏗️ Project Templates

### Express TypeScript (Default)
- **Framework:** Express.js with TypeScript
- **Features:** CORS, Helmet, Morgan logging
- **Database Support:** PostgreSQL, MySQL, SQLite, MongoDB
- **Authentication:** JWT with bcrypt
- **Validation:** Joi schema validation
- **Testing:** Jest with Supertest

### Express JavaScript
- **Framework:** Express.js with JavaScript
- **Features:** Same as TypeScript version
- **No compilation step required**

### Fastify TypeScript
- **Framework:** Fastify with TypeScript
- **Features:** High-performance alternative to Express
- **Plugin Architecture:** Built-in plugin system
- **Type Safety:** Full TypeScript support

## 🗃️ Database Support

The CLI supports multiple database systems:

- **PostgreSQL** - Full-featured relational database
- **MySQL** - Popular relational database
- **SQLite** - Lightweight file-based database
- **MongoDB** - Document-based NoSQL database

### Database Configuration

Environment variables are automatically configured based on your database choice:

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=myapp

# SQLite
DB_FILE=./myapp.sqlite

# MongoDB
MONGODB_URI=mongodb://localhost:27017/myapp
```

## 🔧 Configuration

### Project Detection

The CLI automatically detects your project type by analyzing:
- `package.json` dependencies
- Framework-specific files
- TypeScript configuration
- Database configuration

### Template Engine

Uses Handlebars for template processing with custom helpers:
- `{{kebabCase name}}` - Convert to kebab-case
- `{{camelCase name}}` - Convert to camelCase
- `{{pascalCase name}}` - Convert to PascalCase
- `{{snakeCase name}}` - Convert to snake_case
- `{{#if_eq a b}}` - Conditional equality
- `{{#if_includes array value}}` - Array inclusion check

## 📁 Generated Project Structure

```
my-app/
├── src/
│   ├── index.ts              # Application entry point
│   ├── routes/               # API routes
│   ├── controllers/          # Route controllers
│   ├── models/              # Database models
│   ├── services/            # Business logic
│   ├── middleware/          # Custom middleware
│   └── utils/               # Utility functions
├── migrations/              # Database migrations
├── seeders/                 # Database seeders
├── tests/                   # Test files
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## 🧪 Testing

The CLI includes comprehensive testing support:

### Unit Tests
```bash
# Run all tests
thrilled dev test

# Run with coverage
thrilled dev test --coverage

# Watch mode
thrilled dev test --watch
```

### Test Generation
```bash
# Generate test for a route
thrilled generate test routes/users

# Generate test for a service
thrilled generate test services/EmailService
```

## 🔍 Environment Validation

The CLI validates your environment configuration for:

- **Required Variables** - Ensures all necessary environment variables are set
- **Type Validation** - Validates variable types (string, number, boolean)
- **Security Checks** - Warns about insecure default values
- **Database Connectivity** - Tests database connections

```bash
# Validate current environment
thrilled env validate

# Output example
✓ PORT: 3000 (valid)
✓ DATABASE_URL: postgresql://... (valid)
⚠ JWT_SECRET: Using default value (insecure)
✗ SMTP_HOST: Required but not set
```

## 🚀 Migration System

### Creating Migrations

```bash
thrilled migrate create add_users_table
```

Generates a timestamped migration file:

```typescript
// migrations/20240610123045_add_users_table.ts
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email').unique().notNullable();
    table.string('password').notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
```

### Migration Commands

```bash
# Run pending migrations
thrilled migrate up

# Rollback last migration
thrilled migrate down

# Check status
thrilled migrate status

# Refresh (rollback all and re-run)
thrilled migrate refresh
```

## 🔌 Plugin System

Generate reusable plugins for your applications:

```bash
thrilled generate plugin RateLimiter
```

Generates a plugin with proper structure:

```typescript
// src/plugins/rate-limiter.ts
import { FastifyPluginAsync } from 'fastify';

const rateLimiterPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Plugin implementation
};

export default rateLimiterPlugin;
```

## 📖 Code Generation Examples

### Route Generation

```bash
thrilled generate route users --auth --validation
```

Generates:
- Route handler with CRUD operations
- Input validation schemas
- Authentication middleware
- Test files

### Model Generation

```bash
thrilled generate model User
```

Generates:
- Database model with relationships
- Type definitions
- Migration file
- Test files

### Service Generation

```bash
thrilled generate service EmailService
```

Generates:
- Service class with methods
- Interface definitions
- Error handling
- Test files

## 🛠️ Development Workflow

### Typical Development Flow

1. **Create Project**
   ```bash
   thrilled create-app my-api
   cd my-api
   ```

2. **Set Up Database**
   ```bash
   thrilled db create
   thrilled migrate up
   thrilled db seed
   ```

3. **Generate Code**
   ```bash
   thrilled generate route users
   thrilled generate model User
   thrilled generate service UserService
   ```

4. **Development**
   ```bash
   thrilled dev start
   ```

5. **Testing**
   ```bash
   thrilled dev test --watch
   ```

6. **Production Build**
   ```bash
   thrilled dev build
   ```

## 🎨 Customization

### Template Customization

You can customize templates by:
1. Copying default templates from `templates/` directory
2. Modifying them to fit your needs
3. Using custom template paths

### Configuration Files

The CLI respects standard configuration files:
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Jest testing configuration
- `.eslintrc.js` - ESLint configuration
- `prettier.config.js` - Prettier configuration

## 🐛 Troubleshooting

### Common Issues

#### Node.js Version
Ensure you're using Node.js 18 or higher:
```bash
node --version
```

#### Database Connection
Check your database configuration:
```bash
thrilled env validate
```

#### Template Issues
Clear template cache:
```bash
rm -rf ~/.thrilled/cache
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=thrilled:* thrilled create-app my-app
```

## Building

Run `nx build cli` to build the library.

## Running unit tests

Run `nx test cli` to execute the unit tests via [Jest](https://jestjs.io).

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/thrilled/cli.git
   cd cli
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Build the CLI**
   ```bash
   yarn build
   ```

4. **Link for local testing**
   ```bash
   yarn link
   ```

5. **Run tests**
   ```bash
   yarn test
   ```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Commander.js](https://github.com/tj/commander.js) - Command-line framework
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Handlebars](https://handlebarsjs.com/) - Template engine
- [Ora](https://github.com/sindresorhus/ora) - Loading spinners
- [Chalk](https://github.com/chalk/chalk) - Terminal colors

## 📞 Support

- **Documentation:** [https://docs.thrilled.dev](https://docs.thrilled.dev)
- **Issues:** [GitHub Issues](https://github.com/thrilled/cli/issues)
- **Discord:** [Join our community](https://discord.gg/thrilled)
- **Email:** support@thrilled.dev

---

<div align="center">
  <p>Built with ❤️ by the Thrilled Team</p>
  <p>
    <a href="https://thrilled.dev">Website</a> •
    <a href="https://docs.thrilled.dev">Documentation</a> •
    <a href="https://github.com/thrilled">GitHub</a> •
    <a href="https://twitter.com/thrilleddev">Twitter</a>
  </p>
</div>
