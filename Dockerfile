# Multi-stage Dockerfile for Nx monorepo applications
# NodeJS Version 20.x (Updated to support Sharp library and other native modules)
FROM --platform=linux/amd64 node:20-bullseye AS base

# Install system dependencies required for native modules
RUN apt-get update && apt-get install -y \
    build-essential \
    autoconf \
    automake \
    libtool \
    nasm \
    pkg-config \
    libpng-dev \
    python3 \
    libvips-dev \
    gcc \
    g++ \
    make \
    wget \
    software-properties-common \
    && apt-get update \
    && wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - \
    && apt-add-repository "deb http://apt.llvm.org/bullseye/ llvm-toolchain-bullseye-14 main" \
    && apt-get update \
    && apt-get install -y libstdc++-10-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json yarn.lock nx.json tsconfig.base.json ./

# Copy all package.json files to enable proper dependency resolution
COPY apps/be/base/package.json ./apps/be/base/
COPY apps/be/faithcircle/faithcircle-be/package.json ./apps/be/faithcircle/faithcircle-be/
COPY packages/be/auth/package.json ./packages/be/auth/
COPY packages/be/be-types/package.json ./packages/be/be-types/
COPY packages/be/cli/package.json ./packages/be/cli/
COPY packages/be/core/package.json ./packages/be/core/
COPY packages/be/databases/package.json ./packages/be/databases/
COPY packages/be/monitoring/package.json ./packages/be/monitoring/
COPY packages/be/testing/package.json ./packages/be/testing/
COPY packages/be/uploads/package.json ./packages/be/uploads/
COPY packages/be/validation/package.json ./packages/be/validation/
COPY packages/fe/components/package.json ./packages/fe/components/
COPY packages/fe/styles/package.json ./packages/fe/styles/
COPY packages/shared/custom-eslint/package.json ./packages/shared/custom-eslint/
COPY packages/shared/types/package.json ./packages/shared/types/

# Install workspace dependencies
RUN yarn install --frozen-lockfile --production=false

# Rebuild native modules for Linux platform
RUN npm rebuild bcrypt && npm rebuild sharp

# Verify bcrypt installation
RUN node -e "console.log('✅ bcrypt test:', require('bcrypt').hashSync('test', 10))"

# Set environment variables
ENV NODE_ENV=development
ENV RUNNING_IN_DOCKER=true
ENV LD_LIBRARY_PATH=/usr/lib/aarch64-linux-gnu

# Development stage
FROM base AS development

# Copy the entire workspace for development
COPY . .

# Clean and reinstall native modules for Linux platform
RUN rm -rf node_modules/bcrypt node_modules/sharp 2>/dev/null || true && \
    yarn install --check-files --production=false && \
    npm rebuild bcrypt && \
    npm rebuild sharp

# Final verification that bcrypt works
RUN node -e "console.log('✅ Final bcrypt test:', require('bcrypt').hashSync('test', 10))"

# Default command - will be overridden by docker-compose
CMD ["yarn", "nx", "run", "base-be:dev"]

# Production stage for base-be
FROM base AS production-base

# Copy source code
COPY . .

# Build the base application
RUN yarn nx build base-be

# Set working directory to base app
WORKDIR /app/apps/be/base

# Expose port
EXPOSE 5555

# Start production server
CMD ["yarn", "start"]

# Production stage for faithcircle-be
FROM base AS production-faithcircle

# Copy source code
COPY . .

# Build the faithcircle application
RUN yarn nx build faithcircle-be

# Set working directory to faithcircle app
WORKDIR /app/apps/be/faithcircle/faithcircle-be

# Expose port
EXPOSE 8001

# Start production server
CMD ["yarn", "start"]
