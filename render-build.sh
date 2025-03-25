#!/bin/bash
# Standard build script for Render.com deployment

set -e  # Exit immediately if a command exits with a non-zero status

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                BROKERGPT BUILD SCRIPT                      ║"
echo "║                Standard Production Build                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=1024"

# Install all dependencies
echo "Installing dependencies..."
npm install --production=false

# Build the client application
echo "Building client application..."
npx vite build --config vite.config.ts

# Build the server
echo "Building server application..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Create client/dist if it doesn't exist (should be created by Vite)
if [ ! -d "client/dist" ]; then
  echo "client/dist directory not found, creating it..."
  mkdir -p client/dist
fi

# Run database setup if environment variables are available
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_KEY" ]; then
  echo "Setting up database tables..."
  node scripts/create-supabase-tables.js || echo "Database setup failed, continuing anyway"
fi

# List contents of important directories
echo "Contents of dist directory:"
ls -la dist/

echo "Contents of client/dist directory:"
ls -la client/dist/

echo "Build completed successfully!"