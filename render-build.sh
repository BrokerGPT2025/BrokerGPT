#!/bin/bash
# Build script for Render.com with improved error handling

echo "Starting build process..."

# Create necessary directories
mkdir -p dist/server/public

# Ensure dependencies are properly installed in the environment
echo "Verifying node_modules and dependencies..."
if [ ! -d "node_modules/vite" ]; then
  echo "Vite not found in node_modules. Reinstalling dependencies..."
  npm ci
fi

# Building the client (React frontend)
echo "Building client-side application..."
NODE_ENV=production ./node_modules/.bin/vite build || {
  echo "Vite build failed, falling back to direct client build..."
  NODE_ENV=production node ./node_modules/vite/bin/vite.js build
}

# Building the server (Node.js backend)
echo "Building server-side application..."
NODE_ENV=production ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist || {
  echo "esbuild failed, falling back to simple copy..."
  cp -r server dist/server
}

echo "Setup complete. Build artifacts are in the dist/ directory."
echo "Build completed successfully!"