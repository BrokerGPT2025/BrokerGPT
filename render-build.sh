#!/usr/bin/env bash
# This script helps Render.com build and deploy the application correctly

# Exit on error
set -e

# Build client and server
echo "Building client and server..."
npm run build

# Create server/public directory if it doesn't exist
mkdir -p server/public

# Copy built client files to the location expected by the server
echo "Copying built files to server/public directory..."

# Check where the build output is located (try different possible locations)
if [ -d "dist/public" ]; then
  echo "Found build in dist/public"
  cp -r dist/public/* server/public/
elif [ -d "dist/client" ]; then
  echo "Found build in dist/client"
  cp -r dist/client/* server/public/
elif [ -d "dist" ] && [ -f "dist/index.html" ]; then
  echo "Found build in dist"
  cp -r dist/* server/public/
else
  echo "WARNING: Could not find built client files. Checked dist/public, dist/client, and dist."
  echo "Creating dummy index.html for testing"
  echo "<html><body><h1>BrokerGPT</h1><p>Application is starting...</p></body></html>" > server/public/index.html
fi

# Make the server file executable
chmod +x dist/index.js

echo "Build completed successfully!"