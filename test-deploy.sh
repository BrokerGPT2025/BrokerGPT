#!/bin/bash
# Test Render deployment locally

set -e  # Exit immediately if a command exits with a non-zero status

# Create a test environment
mkdir -p deploy-test
cd deploy-test

# Copy required files
echo "Copying files for deployment test..."
cp ../package.json ../package-lock.json ../render-build.sh ../theme.json ../prod.js ./
cp -r ../server ../shared ./

# Run the build script
echo "Running build script..."
bash render-build.sh

# Create a simple index.html for testing
mkdir -p client/dist
echo '<!DOCTYPE html><html><head><title>BrokerGPT Test</title></head><body><h1>BrokerGPT Deployment Test</h1><p>If you see this page, client assets are being served correctly.</p></body></html>' > client/dist/index.html

# Try to start the server
echo "Starting server in production mode..."
NODE_ENV=production node --import tsx prod.js