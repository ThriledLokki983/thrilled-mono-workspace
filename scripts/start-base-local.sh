#!/bin/bash

# Base Backend - Local Development Script

set -e

echo "🚀 Starting Base Backend (Local Development)"
echo "============================================="

# Change to the base backend directory
cd "$(dirname "$0")/../apps/be/base"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "💡 Run 'make local-setup' first"
    exit 1
fi

# Set environment file
export DOTENV_CONFIG_PATH=".env.local"

echo "📝 Loading environment from .env.local"
echo "🏗️  Building dependencies..."

# Build dependencies first
yarn nx run-many -t build --projects=be-types,validation,core,databases,auth,monitoring

echo "🔥 Starting Base Backend with hot reload..."
echo "🌐 Server will be available at: http://localhost:5555"
echo "📚 API Documentation: http://localhost:5555/api-docs"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the server with the local environment
dotenv -e .env.local -- yarn nx run base-be:dev
