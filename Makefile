# Makefile for Thrilled Monorepo Docker Operations
.PHONY: help setup up down build rebuild logs clean reset test lint

# Default target
help: ## Show this help message
	@echo "Thrilled Monorepo Docker Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Setup environment (copy .env.example to .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env file from .env.example"; \
		echo "📝 Please review and update .env file as needed"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

up: ## Start all services in detached mode
	docker compose up -d

up-fg: ## Start all services in foreground (with logs)
	docker compose up

up-base: ## Start only base backend service with dependencies
	docker compose up base-be

up-faithcircle: ## Start only faithcircle backend service with dependencies
	docker compose up faithcircle-be

down: ## Stop all services
	docker compose down

build: ## Build all images
	docker compose build

rebuild: ## Rebuild all images without cache
	docker compose build --no-cache

restart: ## Restart all services
	docker compose restart

restart-base: ## Restart base backend service
	docker compose restart base-be

restart-faithcircle: ## Restart faithcircle backend service
	docker compose restart faithcircle-be

logs: ## View logs from all services
	docker compose logs

logs-f: ## Follow logs from all services
	docker compose logs -f

logs-base: ## View logs from base backend service
	docker compose logs base-be

logs-faithcircle: ## View logs from faithcircle backend service
	docker compose logs faithcircle-be

logs-db: ## View logs from database service
	docker compose logs postgres

shell-base: ## Open shell in base backend container
	docker compose exec base-be sh

shell-faithcircle: ## Open shell in faithcircle backend container
	docker compose exec faithcircle-be sh

shell-db: ## Open PostgreSQL shell
	docker compose exec postgres psql -U postgres -d thrilled_dev

test: ## Run tests in all services
	docker compose exec base-be yarn nx test base-be
	docker compose exec faithcircle-be yarn nx test faithcircle-be

test-base: ## Run tests in base backend service
	docker compose exec base-be yarn nx test base-be

test-faithcircle: ## Run tests in faithcircle backend service
	docker compose exec faithcircle-be yarn nx test faithcircle-be

lint: ## Run linting in all services
	docker compose exec base-be yarn nx lint base-be
	docker compose exec faithcircle-be yarn nx lint faithcircle-be

lint-base: ## Run linting in base backend service
	docker compose exec base-be yarn nx lint base-be

lint-faithcircle: ## Run linting in faithcircle backend service
	docker compose exec faithcircle-be yarn nx lint faithcircle-be

migrate-base: ## Run migrations for base backend
	docker compose exec base-be yarn nx run base-be:migrate:up

migrate-faithcircle: ## Run migrations for faithcircle backend
	docker compose exec faithcircle-be yarn nx run faithcircle-be:migrate:up

migrate-status-base: ## Check migration status for base backend
	docker compose exec base-be yarn nx run base-be:migrate:status

migrate-status-faithcircle: ## Check migration status for faithcircle backend
	docker compose exec faithcircle-be yarn nx run faithcircle-be:migrate:status

clean: ## Remove stopped containers and unused images
	docker compose down
	docker system prune -f

reset: ## Complete reset - remove all containers, images, and volumes
	docker compose down -v --rmi all --remove-orphans
	docker system prune -af --volumes

reset-modules: ## Reset only node_modules volumes (fix native module issues)
	docker compose down
	docker volume rm thrilled-monorepo_node_modules thrilled-monorepo_base_node_modules thrilled-monorepo_faithcircle_node_modules 2>/dev/null || true
	docker compose up --build -d

# Production commands
prod-up: ## Start production services
	docker compose -f docker-compose.prod.yml up

prod-up-d: ## Start production services in detached mode
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker compose -f docker-compose.prod.yml down

prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-logs: ## View production logs
	docker compose -f docker-compose.prod.yml logs

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@docker compose ps

status: ## Show status of all services
	docker compose ps

# Utility commands
install: setup build ## Setup and build everything for first time use
	@echo "🚀 Installation complete! Run 'make up' to start services"

graph: ## Visualize Nx dependency graph
	docker compose exec base-be yarn nx graph

# Fast startup commands (optimized for development)
fast: ## Fast startup using optimized Docker configuration
	docker compose -f docker-compose.fast.yml up -d

fast-build: ## Build optimized Docker images for fast startup
	docker compose -f docker-compose.fast.yml build

fast-rebuild: ## Rebuild optimized images without cache
	docker compose -f docker-compose.fast.yml build --no-cache

fast-down: ## Stop fast startup services
	docker compose -f docker-compose.fast.yml down

fast-logs: ## View logs from fast startup services
	docker compose -f docker-compose.fast.yml logs

fast-status: ## Check status of fast startup services
	docker compose -f docker-compose.fast.yml ps

fast-clean: ## Clean fast startup cache and restart
	docker compose -f docker-compose.fast.yml down -v && docker compose -f docker-compose.fast.yml up -d

# Ultra-fast startup commands (minimal overhead)
ultra-fast: ## Ultra-fast startup with minimal overhead
	docker compose -f docker-compose.ultra-fast.yml up -d

ultra-fast-build: ## Build images for ultra-fast startup
	docker compose -f docker-compose.ultra-fast.yml build

ultra-fast-down: ## Stop ultra-fast startup services
	docker compose -f docker-compose.ultra-fast.yml down

ultra-fast-logs: ## View logs from ultra-fast startup services
	docker compose -f docker-compose.ultra-fast.yml logs

ultra-fast-status: ## Check status of ultra-fast startup services
	docker compose -f docker-compose.ultra-fast.yml ps

# =============================================================================
# LOCAL DEVELOPMENT (No Docker) - FAST STARTUP
# =============================================================================

local-setup: ## Setup local development environment
	@echo "🔧 Setting up local development environment..."
	@./scripts/local-dev-setup.sh

local-services: ## Start local PostgreSQL and Redis with Docker (only what we need)
	@echo "🐘 Starting PostgreSQL..."
	docker compose up -d postgres
	@echo "🟥 Starting Redis..."
	docker compose up -d redis
	@echo "✅ Local services (Postgres + Redis) started!"

local-base: ## Start base backend locally (requires local-services)
	@./scripts/start-base-local.sh

local-faithcircle: ## Start faithcircle backend locally (requires local-services)
	@./scripts/start-faithcircle-local.sh

local-dev: ## Start both backends locally in parallel
	@echo "🚀 Starting all backends locally..."
	@make local-services
	@echo "⏳ Waiting for services to be ready..."
	@sleep 3
	@echo "🔥 Starting backends in parallel..."
	@echo "📝 Base Backend will be on http://localhost:5555"
	@echo "📝 FaithCircle Backend will be on http://localhost:8001"
	@echo "💡 Press Ctrl+C to stop all servers"
	@echo ""
	@(cd apps/be/base && dotenv -e .env.local -- yarn nx run base-be:dev) & \
	(cd apps/be/faithcircle/faithcircle-be && dotenv -e .env.local -- yarn nx run faithcircle-be:dev) & \
	wait

local-stop: ## Stop local services
	@echo "🛑 Stopping local services..."
	docker compose stop postgres redis
	@echo "✅ Local services stopped!"

local-clean: ## Clean local setup and stop services
	@echo "🧹 Cleaning local development..."
	@make local-stop
	docker compose down postgres redis
	@echo "✅ Local development cleaned!"

# =============================================================================
