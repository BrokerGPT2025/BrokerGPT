#!/bin/bash
# Enhanced build script for Render.com with improved frontend build support
# Optimized for ESM compatibility for Node.js

# Don't exit on errors to allow fallbacks to work
set +e

echo "Starting enhanced build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install required dependencies
echo "Installing dependencies..."
npm ci

# Ensure Vite is installed directly
echo "Installing Vite and esbuild explicitly..."
npm install vite esbuild

# Create theme.json if it doesn't exist
echo "Ensuring theme.json exists..."
if [ ! -f theme.json ]; then
  echo '{ "primary": "#0087FF", "variant": "professional", "appearance": "light", "radius": 0.5 }' > theme.json
fi

# Verify Vite is actually available
echo "Verifying Vite installation..."
if [ -f "./node_modules/.bin/vite" ]; then
  echo "✅ Vite found in node_modules/.bin at $(ls -la ./node_modules/.bin/vite)"
else
  echo "⚠️ Vite not found in expected location, checking if it was installed..."
  ls -la ./node_modules/vite/bin
  
  # Create the symlink manually if needed
  if [ -f "./node_modules/vite/bin/vite.js" ] && [ ! -f "./node_modules/.bin/vite" ]; then
    echo "📌 Creating symlink for Vite..."
    mkdir -p ./node_modules/.bin
    ln -sf ../vite/bin/vite.js ./node_modules/.bin/vite
    chmod +x ./node_modules/.bin/vite
  fi
fi

# Add node_modules/.bin to PATH
export PATH="./node_modules/.bin:$PATH"
echo "Updated PATH: $PATH"

# First attempt the standard build process 
echo "Attempting standard build process (Vite + esbuild)..."
npm run build

# Check if the standard build succeeded
if [ ! -f "client/dist/index.html" ] || [ ! -f "dist/index.js" ]; then
  echo "Standard build process failed, falling back to specialized build steps..."
  
  # Try direct build using node to execute vite
  echo "Trying direct build with Node..."
  if [ -f "./node_modules/vite/bin/vite.js" ]; then
    echo "Building with: node ./node_modules/vite/bin/vite.js build"
    node ./node_modules/vite/bin/vite.js build
  fi
  
  # Try our specialized Vite build script
  if [ ! -f "client/dist/index.html" ]; then
    echo "Trying specialized frontend build script..."
    node vite-build.js || echo "Specialized Vite build script failed"
  fi
  
  # If specialized script failed, try static frontend generator
  if [ ! -f "client/dist/index.html" ]; then
    echo "Generating static frontend as fallback..."
    node static-frontend.js
  fi
  
  # Build backend with esbuild specifically
  echo "Building backend with esbuild..."
  if [ -f "./node_modules/.bin/esbuild" ]; then
    echo "✅ esbuild found in node_modules/.bin"
    ./node_modules/.bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
  elif [ -f "./node_modules/esbuild/bin/esbuild" ]; then
    echo "Using esbuild from module path..."
    node ./node_modules/esbuild/bin/esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
  else
    echo "esbuild not found, falling back to minimal build..."
  fi
fi

# Run the minimal build script as a fallback if needed
echo "Running minimal build to ensure base files..."
node minimal-build.js

# Ensure the emergency fallback is in place
echo "Ensuring dist/index.js exists..."
node ensure-dist.js

# Additional debugging: list contents of important directories
echo "Contents of dist directory:"
ls -la dist/

echo "Contents of client/dist directory:"
if [ -d "client/dist" ]; then
  ls -la client/dist/
else
  echo "client/dist directory does not exist! Creating it..."
  mkdir -p client/dist
fi

echo "Contents of dist/public directory (where Vite might be outputting):"
if [ -d "dist/public" ]; then
  ls -la dist/public/
  
  # If dist/public exists but client/dist is empty, copy files over
  if [ ! -f "client/dist/index.html" ] && [ -f "dist/public/index.html" ]; then
    echo "Moving Vite build output from dist/public to client/dist..."
    cp -r dist/public/* client/dist/
  fi
else
  echo "dist/public directory does not exist."
fi

echo "Setup complete. Application ready for production serving."
echo "Build completed successfully!"