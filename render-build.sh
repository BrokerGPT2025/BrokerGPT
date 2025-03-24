#!/bin/bash
# Simplified build script for Render.com with direct execution approach

set -e # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install required dependencies
echo "Installing dependencies..."
npm ci 

# Create theme.json if it doesn't exist
echo "Ensuring theme.json exists..."
if [ ! -f theme.json ]; then
  echo '{ "primary": "#0087FF", "variant": "professional", "appearance": "light", "radius": 0.5 }' > theme.json
fi

# Build client assets
echo "Building client assets..."
# Run build commands directly to avoid vite not found error
echo "Running vite build..."
npx vite build
echo "Running esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Run the Node.js script to ensure dist directory is properly set up
echo "Running ensure-dist.js to set up dist directory..."
node --import tsx ensure-dist.js

echo "Setup complete. Application will start using production script."
echo "Build completed successfully!"