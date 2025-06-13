#!/bin/bash

# Fast Development Startup Script
# This script optimizes Docker startup time for development

set -e

echo "🚀 Thrilled Monorepo - Fast Development Startup"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f docker-compose.fast.yml down > /dev/null 2>&1 || true

# Check if we need to build images
if [ "$1" = "--build" ] || [ "$1" = "-b" ]; then
    echo "🔨 Building optimized Docker images..."
    docker compose -f docker-compose.fast.yml build
fi

# Start services
echo "⚡ Starting services with optimized configuration..."
docker compose -f docker-compose.fast.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."

# Function to check service health
check_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker compose -f docker-compose.fast.yml ps $service | grep -q "healthy"; then
            echo "✅ $service is healthy"
            return 0
        fi

        if [ $attempt -eq $max_attempts ]; then
            echo "❌ $service failed to start within timeout"
            return 1
        fi

        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
}

# Check database services first
echo "📊 Checking database services..."
check_service postgres
check_service redis

# Check backend services
echo "🔗 Checking backend services..."
check_service base-be
check_service faithcircle-be

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   Base API:       http://localhost:5555"
echo "   FaithCircle API: http://localhost:8001"
echo "   Nginx Gateway:   http://localhost"
echo "   API Docs:        http://localhost/api/base/api-docs"
echo "                    http://localhost/api/faithcircle/api-docs"
echo ""
echo "📝 Useful commands:"
echo "   make fast-logs    # View logs"
echo "   make fast-status  # Check status"
echo "   make fast-down    # Stop services"
echo ""
echo "🏁 Ready for development!"
