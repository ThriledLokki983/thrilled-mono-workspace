# Docker Setup for Thrilled Monorepo

This Docker Compose setup allows you to run both backend applications (`base-be` and `faithcircle-be`) together in a containerized environment with shared services.

## Architecture

The setup includes:

- **base-be**: Base backend service running on port 5555
- **faithcircle-be**: FaithCircle backend service running on port 8001
- **postgres**: Shared PostgreSQL database on port 5432
- **redis**: Shared Redis cache on port 6379
- **nginx**: Reverse proxy on port 80 (optional)

## Quick Start

1. **Copy environment configuration:**
   ```bash
   cp .env.example .env
   ```

2. **Start all services:**
   ```bash
   docker-compose up
   ```

3. **Start specific services:**
   ```bash
   # Start only base backend with its dependencies
   docker-compose up base-be

   # Start only faithcircle backend with its dependencies
   docker-compose up faithcircle-be
   ```

4. **Build and start (rebuild if needed):**
   ```bash
   docker-compose up --build
   ```

## Development

### Hot Reload

The setup supports hot reload through volume mounts:
- Source code changes in `apps/` and `packages/` are automatically detected
- Both services use `nodemon` for automatic restarts on file changes
- Native modules are preserved in named volumes for optimal performance

### Running Nx Commands

You can run Nx commands directly in the containers:

```bash
# Run commands in base-be container
docker-compose exec base-be yarn nx test base-be
docker-compose exec base-be yarn nx lint base-be

# Run commands in faithcircle-be container
docker-compose exec faithcircle-be yarn nx test faithcircle-be
docker-compose exec faithcircle-be yarn nx lint faithcircle-be
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d thrilled_dev

# Run migrations for base-be
docker-compose exec base-be yarn nx run base-be:migrate:up

# Run migrations for faithcircle-be
docker-compose exec faithcircle-be yarn nx run faithcircle-be:migrate:up
```

## API Access

With the nginx proxy:
- Base API: `http://localhost/api/base/`
- FaithCircle API: `http://localhost/api/faithcircle/`

Direct access:
- Base API: `http://localhost:5555`
- FaithCircle API: `http://localhost:8001`

## Production

For production deployment, use the production targets:

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Adjust ports in `.env` file if needed
2. **Native module issues**: Stop containers and run `docker-compose up --build`
3. **Database connection**: Ensure PostgreSQL is healthy before starting backend services

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs base-be
docker-compose logs faithcircle-be
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f base-be
```

### Clean Reset

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove built images
docker-compose down --rmi all

# Complete cleanup including volumes
docker-compose down -v --rmi all --remove-orphans
```

## Environment Variables

Key environment variables (see `.env.example`):

- `BASE_PORT`: Port for base backend service (default: 5555)
- `FAITHCIRCLE_PORT`: Port for faithcircle backend service (default: 8001)
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `REDIS_PORT`: Redis port (default: 6379)
- `POSTGRES_DATABASE`: Database name (default: thrilled_dev)
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_PASSWORD`: Database password (default: postgres)

## Network Configuration

Services communicate through a dedicated Docker network (`thrilled-network`) on subnet `172.20.0.0/16`. This ensures proper isolation and service discovery.

## Volume Management

- `postgres_data`: Persistent PostgreSQL data
- `redis_data`: Persistent Redis data
- `node_modules`: Shared workspace node_modules (optimized for Linux)
- `base_node_modules`: Base app specific node_modules
- `faithcircle_node_modules`: FaithCircle app specific node_modules

## Health Checks

All services include health checks for proper orchestration:
- PostgreSQL: `pg_isready` check
- Redis: `redis-cli ping` check
- Backend services: HTTP health endpoint checks
