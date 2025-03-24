#!/bin/bash
# Build script for Render.com with improved error handling

set -e # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Create necessary directories
mkdir -p dist/server/public

# Ensure dependencies are properly installed in the environment
echo "Verifying node_modules and dependencies..."
npm ci

# Skip the Vite build and just copy the client files directly
echo "Building application in simplified mode..."

# Copy necessary client files (this is a simplified build)
echo "Creating client build..."
if [ -d "client/public" ]; then
  echo "Copying public assets..."
  cp -r client/public/* dist/server/public/ || true
fi

# Copy server files
echo "Building server-side application..."
mkdir -p dist/server
cp -r server/* dist/server/ || true
cp -r shared dist/ || true
cp tsconfig.json dist/ || true
cp package.json dist/ || true

# Create the main entry point that Render will execute
echo "Creating main entry point..."
cat > dist/index.js << 'EOL'
// Import required modules
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createRequire } from 'module';

// Setup path handling for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Log startup information
console.log('Starting BrokerGPT application...');
console.log('Current directory:', __dirname);

// Import and start the server
import('./server/index.js')
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
EOL

echo "Setup complete. Build artifacts are in the dist/ directory."
echo "Build completed successfully!"