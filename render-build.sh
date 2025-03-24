#!/bin/bash
# Simplified build script for Render.com with direct execution approach

set -e # Exit immediately if a command exits with a non-zero status

echo "Starting build process..."

# Install required dependencies
echo "Installing dependencies..."
npm ci

# Create entry point script that uses tsx to execute TypeScript directly
echo "Creating direct execution entry point..."
cat > run.js << 'EOL'
#!/usr/bin/env node

// Simple startup script for production
console.log('Starting BrokerGPT application...');
console.log('Using Node.js version:', process.version);
console.log('Using direct TypeScript execution mode');

// Use tsx to run the TypeScript files directly
require('tsx/esm')('./server/index.ts');
EOL

# Make the entry point executable
chmod +x run.js

echo "Setup complete. Application will start using tsx to run TypeScript directly."
echo "Build completed successfully!"