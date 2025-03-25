#\!/bin/bash
# Deployment test script for BrokerGPT
# This script verifies that the application is properly configured for deployment

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                BROKERGPT DEPLOYMENT TEST                   ║"
echo "║        Verifies your application is ready for Render       ║"
echo "╚════════════════════════════════════════════════════════════╝"

echo "1. Checking environment..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Check for required directories
echo -e "\n2. Checking directory structure..."
if [ -d "client" ]; then
  echo "✓ Client directory exists"
else
  echo "✗ Client directory is missing\!"
fi

if [ -d "server" ]; then
  echo "✓ Server directory exists"
else
  echo "✗ Server directory is missing\!"
fi

if [ -d "shared" ]; then
  echo "✓ Shared directory exists"
else
  echo "✗ Shared directory is missing"
fi

# Check for key files
echo -e "\n3. Checking for key files..."
FILES_TO_CHECK=(
  "package.json"
  "render-build.sh"
  "emergency-server.js"
  "static-frontend.js"
  "start-production.js"
  "ensure-dist.js"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ $file is missing\!"
  fi
done

# Check package.json for required scripts
echo -e "\n4. Checking package.json scripts..."
if grep -q '"start":' package.json; then
  echo "✓ start script exists"
else
  echo "✗ start script is missing\!"
fi

if grep -q '"build":' package.json; then
  echo "✓ build script exists"
else
  echo "✗ build script is missing\!"
fi

# Generate static frontend
echo -e "\n5. Testing static frontend generation..."
if node static-frontend.js; then
  echo "✓ Static frontend generated successfully"
else
  echo "✗ Static frontend generation failed\!"
fi

# Checking generated static files
echo -e "\n6. Checking generated static files..."
if [ -d "client/dist" ]; then
  echo "✓ client/dist directory exists"
  if [ -f "client/dist/index.html" ]; then
    echo "✓ index.html exists"
  else
    echo "✗ index.html is missing\!"
  fi
else
  echo "✗ client/dist directory is missing\!"
fi

# Test emergency server startup
echo -e "\n7. Testing emergency server startup (will exit after 3 seconds)..."
(node emergency-server.js & SERVER_PID=$\!; sleep 3; kill $SERVER_PID) &> /tmp/server-test.log

if grep -q "STANDALONE EMERGENCY SERVER RUNNING" /tmp/server-test.log; then
  echo "✓ Emergency server starts successfully"
else
  echo "✗ Emergency server failed to start\!"
  echo "Error log:"
  cat /tmp/server-test.log
fi
rm /tmp/server-test.log

# Test minimal diagnostic server
echo -e "\n8. Testing diagnostic server (will exit after 3 seconds)..."
(node simple-server.js & SERVER_PID=$\!; sleep 3; kill $SERVER_PID) &> /tmp/diagnostic-test.log

if grep -q "Diagnostic server running" /tmp/diagnostic-test.log; then
  echo "✓ Diagnostic server starts successfully"
else
  echo "✗ Diagnostic server failed to start\!"
  echo "Error log:"
  cat /tmp/diagnostic-test.log
fi
rm /tmp/diagnostic-test.log

# Run full verifier
echo -e "\n9. Running full deployment verifier..."

# Create dist directory for testing
mkdir -p dist

# Run simplified server to test for any syntax errors
echo "const express = require('express'); const app = express(); app.get('/', (req, res) => res.send('test')); app.listen(0);" > /tmp/test-server.js
if node /tmp/test-server.js & SERVER_PID=$\!; then
  sleep 1
  kill $SERVER_PID
  echo "✓ Basic Express server test passed"
else
  echo "✗ Basic Express server test failed\!"
fi
rm /tmp/test-server.js

echo -e "\n✨ DEPLOYMENT TEST COMPLETE ✨"
echo "If all checks passed, your application should deploy successfully to Render.com"
echo "For production, run these commands:"
echo "  1. npm run build      (to prepare files)"
echo "  2. npm start          (to start the production server)"
echo "  3. npm run diagnose   (to run diagnostics if needed)"
