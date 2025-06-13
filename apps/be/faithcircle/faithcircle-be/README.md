# FaithCircle Backend API

FaithCircle is a faith-based social networking backend API built with TypeScript, Express.js, and PostgreSQL. This application follows the same foundational structure as the base backend application.

## 🚀 Features

- **TypeScript**: Full TypeScript support with strict type checking
- **Express.js**: Fast, unopinionated, minimalist web framework
- **PostgreSQL**: Powerful, open source object-relational database
- **Redis**: In-memory data structure store for caching and sessions
- **Authentication**: JWT-based authentication with refresh tokens
- **Validation**: Request validation using custom validation middleware
- **Monitoring**: Built-in monitoring and health checks
- **Database Migrations**: PostgreSQL migrations with node-pg-migrate
- **Testing**: Jest testing framework with comprehensive test coverage
- **Logging**: Structured logging with sensitive data redaction
- **Docker**: Full Docker support for development and production

## 📦 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT
- **Validation**: Custom validation middleware
- **Testing**: Jest
- **Building**: SWC (Fast TypeScript/JavaScript compiler)
- **Process Manager**: PM2
- **Containerization**: Docker

## 🛠 Development

### Prerequisites

- Node.js 18+
- Yarn
- PostgreSQL 14+
- Redis 6+

### Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb faithcircle_be

   # Run migrations
   yarn migrate:up
   ```

4. **Start Development Server**
   ```bash
   yarn dev
   ```

### Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production using SWC
- `yarn build:tsc` - Build for production using TypeScript compiler
- `yarn start` - Start production server
- `yarn test` - Run tests
- `yarn lint` - Run linting
- `yarn lint:fix` - Fix linting issues
- `yarn typecheck` - Run TypeScript type checking

### Database Operations

- `yarn migrate:create <name>` - Create new migration
- `yarn migrate:up` - Run pending migrations
- `yarn migrate:down` - Rollback last migration
- `yarn migrate:status` - Check migration status

### Deployment

- `yarn deploy:prod` - Deploy to production using PM2
- `yarn deploy:dev` - Deploy to development using PM2

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── database/        # Database connection and utilities
├── dtos/           # Data Transfer Objects
├── interfaces/     # TypeScript interfaces
├── middlewares/    # Express middlewares
├── routes/         # Route definitions
├── services/       # Business logic services
├── utils/          # Utility functions
├── app.ts          # Express app configuration
└── server.ts       # Server entry point
```

## 🔧 Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and customize:

- **Server**: Port, environment
- **Database**: PostgreSQL connection details
- **Redis**: Redis connection details
- **Security**: JWT secrets, encryption keys
- **Logging**: Log levels and directories
- **CORS**: Cross-origin resource sharing settings

## 🚀 API Documentation

The API documentation is automatically generated using Swagger/OpenAPI and available at:
- Development: `http://localhost:8001/api-docs`
- Health Check: `http://localhost:8001/health`

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage
```

## 📊 Monitoring

The application includes built-in monitoring and health checks:

- **Health Endpoint**: `/health`
- **Metrics Endpoint**: `/metrics`
- **Performance Monitoring**: Request/response timing
- **Database Health**: Connection status monitoring

## 🐳 Docker

```bash
# Development
docker compose up

# Production
docker compose -f docker-compose.prod.yml up
```

## 📄 License

ISC License

## 👨‍💻 Author

Gideon Nimoh
