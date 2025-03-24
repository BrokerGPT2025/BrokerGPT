#!/bin/bash
# Ultra-simple build script for Render.com

echo "Building application..."
# Skip the db:push step that causes the 'drizzle-kit: not found' error
# We'll rely on the database being set up separately

# Run build directly with npx to ensure binaries are found
npx vite build
mkdir -p dist
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Setting up public directory..."
mkdir -p dist/server/public

# Note: In Render.com, the build artifacts need to be in dist/
# The app will serve static files from dist/server/public

echo "Build completed successfully!"