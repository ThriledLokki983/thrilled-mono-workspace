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
