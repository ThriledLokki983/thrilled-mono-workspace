#!/bin/bash

# FaithCircle Backend - Local Development Script

set -e

echo "🚀 Starting FaithCircle Backend (Local Development)"
echo "=================================================="

# Change to the faithcircle backend directory
cd "$(dirname "$0")/../apps/be/faithcircle/faithcircle-be"

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

echo "🔥 Starting FaithCircle Backend with hot reload..."
echo "🌐 Server will be available at: http://localhost:8001"
echo "📚 API Documentation: http://localhost:8001/api-docs"
echo ""
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Start the server with the local environment
dotenv -e .env.local -- yarn nx run faithcircle-be:dev
