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
npm run build

# Ensure dist directory exists
echo "Ensuring dist directory exists..."
mkdir -p dist

# Create fallback index.js if it doesn't exist
if [ ! -f "dist/index.js" ]; then
  echo "Creating fallback index.js file..."
  cp start.js dist/index.js
fi

echo "Setup complete. Application will start using production script."
echo "Build completed successfully!"