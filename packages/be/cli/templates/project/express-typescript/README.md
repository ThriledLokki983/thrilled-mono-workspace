# {{pascalCase name}}

A modern backend application built with {{pascalCase framework}} and {{#if_eq language 'typescript'}}TypeScript{{else}}JavaScript{{/if_eq}}.

## Features

{{#each features}}
- {{this}}
{{/each}}

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- {{#if database}}{{pascalCase database}}{{else}}No database required{{/if}}

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd {{kebabCase name}}
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env.development
```

4. Configure your environment variables in `.env.development`

{{#if database}}
5. Set up the database:
```bash
npm run db:create
npm run migrate:up
npm run db:seed
```
{{/if}}

### Development

Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000

### Building for Production

{{#if_eq language 'typescript'}}
Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```
{{else}}
Start the production server:
```bash
NODE_ENV=production npm start
```
{{/if_eq}}

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

### API Documentation

{{#if_includes features 'swagger'}}
API documentation is available at http://localhost:3000/api-docs when the server is running.
{{else}}
API endpoints:

- `GET /` - Welcome message
- `GET /health` - Health check
{{#if_includes features 'auth'}}
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
{{/if_includes}}
{{/if_includes}}

## Project Structure

```
{{kebabCase name}}/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Data models
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
{{#if_eq language 'typescript'}}│   ├── types/           # TypeScript type definitions{{/if_eq}}
│   └── index.{{ext language}}         # Application entry point
├── tests/               # Test files
├── migrations/          # Database migrations
├── seeders/            # Database seeders
├── docs/               # Documentation
└── logs/               # Log files
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `APP_NAME` | Application name | {{name}} |
{{#if database}}
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | {{#if_eq database 'postgresql'}}5432{{/if_eq}}{{#if_eq database 'mysql'}}3306{{/if_eq}}{{#if_eq database 'mongodb'}}27017{{/if_eq}} |
| `DB_NAME` | Database name | {{snakeCase name}} |
| `DB_USER` | Database username | |
| `DB_PASSWORD` | Database password | |
{{/if}}
{{#if_includes features 'auth'}}
| `JWT_SECRET` | JWT secret key | |
| `JWT_EXPIRES_IN` | JWT expiration | 7d |
{{/if_includes}}

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code
{{#if database}}
- `npm run db:create` - Create database
- `npm run db:drop` - Drop database
- `npm run migrate:up` - Run migrations
- `npm run migrate:down` - Rollback migrations
- `npm run db:seed` - Run seeders
{{/if}}

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
