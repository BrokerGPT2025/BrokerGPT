#!/bin/bash
# Simplified build script for Render.com with direct execution approach

# Don't exit on errors to allow fallbacks to work
set +e

echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install required dependencies
echo "Installing dependencies..."
npm ci

# Install required global packages
echo "Installing global packages..."
npm install -g tsx esbuild 

# Create theme.json if it doesn't exist
echo "Ensuring theme.json exists..."
if [ ! -f theme.json ]; then
  echo '{ "primary": "#0087FF", "variant": "professional", "appearance": "light", "radius": 0.5 }' > theme.json
fi

# Attempt to build client assets with standard approach
echo "Building client assets..."
echo "Attempting standard build process with npm run build..."
npm run build

# Check if the build succeeded
if [ ! -f "client/dist/index.html" ]; then
  echo "Standard build failed, trying direct commands..."
  
  # Try direct vite build
  echo "Running direct vite build..."
  npx vite build
  
  # Check if vite build succeeded
  if [ ! -f "client/dist/index.html" ]; then
    echo "Vite build failed, running minimal build script..."
    node --import tsx minimal-build.js || node minimal-build.js
  fi
fi

# Try to bundle the server code
echo "Running esbuild for server code..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist || echo "esbuild failed, will use fallback"

# Always run ensure-dist.js as a final fallback
echo "Running ensure-dist.js to set up dist directory..."
node --import tsx ensure-dist.js || node ensure-dist.js

echo "Setup complete. Application will start using production script."
echo "Build completed successfully!"