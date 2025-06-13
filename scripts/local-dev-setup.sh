#!/bin/bash

# Thrilled Monorepo - Local Development Startup Script
# This script sets up and runs the entire development environment locally

set -e

echo "🚀 Thrilled Monorepo - Local Development Setup"
echo "================================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $service to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if nc -z $host $port 2>/dev/null; then
            echo "✅ $service is ready!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - waiting for $service..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "❌ $service failed to start after $max_attempts attempts"
    return 1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn is not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed (needed for PostgreSQL and Redis)"
    exit 1
fi

echo "✅ All prerequisites met!"

# Stop any existing Docker containers
echo "🛑 Stopping any existing Docker containers..."
docker compose down 2>/dev/null || true

# Check for port conflicts
echo "🔍 Checking for port conflicts..."
PORTS_IN_USE=()

if check_port 5555; then
    PORTS_IN_USE+=("5555 (Base Backend)")
fi

if check_port 8001; then
    PORTS_IN_USE+=("8001 (FaithCircle Backend)")
fi

if check_port 5432; then
    PORTS_IN_USE+=("5432 (PostgreSQL)")
fi

if check_port 6379; then
    PORTS_IN_USE+=("6379 (Redis)")
fi

if [ ${#PORTS_IN_USE[@]} -gt 0 ]; then
    echo "⚠️  The following ports are in use:"
    for port in "${PORTS_IN_USE[@]}"; do
        echo "   - $port"
    done
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted by user"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Build shared packages
echo "🏗️  Building shared packages..."
yarn nx run-many -t build --projects=be-types,validation,core,databases,auth,monitoring

# Start local services (PostgreSQL and Redis)
echo "🐘 Starting PostgreSQL..."
docker compose up -d postgres

echo "🟥 Starting Redis..."
docker compose up -d redis

# Wait for services to be ready
wait_for_service localhost 5432 "PostgreSQL"
wait_for_service localhost 6379 "Redis"

echo ""
echo "🎉 Local development environment is ready!"
echo "================================================"
echo ""
echo "📝 Available commands:"
echo "   make local-base        - Start Base Backend only"
echo "   make local-faithcircle - Start FaithCircle Backend only"
echo "   make local-dev         - Start both backends in parallel"
echo "   make local-stop        - Stop local services"
echo ""
echo "🌐 Service URLs (when running):"
echo "   Base Backend:       http://localhost:5555"
echo "   FaithCircle Backend: http://localhost:8001"
echo "   Base API Docs:      http://localhost:5555/api-docs"
echo "   FaithCircle Docs:   http://localhost:8001/api-docs"
echo ""
echo "💡 To start development servers:"
echo "   make local-dev"
echo ""
