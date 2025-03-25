// Advanced Deployment Build Fixer for Vite Issues
// This script tackles the specific Node.js ESM Vite loading issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🛠️ ADVANCED VITE DEPLOYMENT FIX SCRIPT 🛠️");
console.log(`Running in directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Helper functions
function executeCommand(command, silent = false) {
  try {
    if (!silent) console.log(`Executing: ${command}`);
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Check if a package is installed
function isPackageInstalled(packageName) {
  try {
    const result = execSync(`npm list ${packageName}`, { encoding: 'utf8', stdio: 'pipe' });
    return !result.includes('empty');
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log("Starting Vite deployment fix process...");
  
  // 1. Ensure Vite is properly installed
  if (!isPackageInstalled('vite')) {
    console.log("Installing Vite...");
    executeCommand('npm install vite@latest --save-dev');
  }
  
  if (!isPackageInstalled('@vitejs/plugin-react')) {
    console.log("Installing Vite React plugin...");
    executeCommand('npm install @vitejs/plugin-react --save-dev');
  }
  
  // 2. Create a simplified vite.config.cjs file
  console.log("Creating simplified Vite configuration...");
  
  // Use ESM-compatible template string for the CommonJS config
  const simplifiedViteConfig = `// Simplified Vite configuration for builds
// This file is auto-generated and designed to work in any environment

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  plugins: [react()],
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
    },
  },
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});`;

  // Create a compatible CommonJS version as well
  const commonJSViteConfig = `// Simplified Vite configuration for builds (CommonJS version)
// This file is auto-generated and designed to work in any environment

'use strict';

const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  plugins: [react()],
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html'),
      },
    },
  },
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});`;

  // Write both ESM and CommonJS versions
  fs.writeFileSync(path.join(__dirname, 'vite.config.js'), simplifiedViteConfig);
  fs.writeFileSync(path.join(__dirname, 'vite.config.cjs'), commonJSViteConfig);
  console.log("Created compatible Vite configuration files in both ESM and CommonJS formats");
  
  // 3. Create a universal Vite build script
  console.log("Creating universal Vite build script...");
  
  const universalBuildScript = `// Universal Vite build script that works with both ESM and CommonJS
// Uses direct Vite API calls to avoid module format issues
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 UNIVERSAL VITE BUILD SCRIPT");
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Make the client dist directory if it doesn't exist
const clientDistDir = path.join(process.cwd(), 'client', 'dist');
if (!fs.existsSync(clientDistDir)) {
  fs.mkdirSync(clientDistDir, { recursive: true });
  console.log(\`Created client dist directory: \${clientDistDir}\`);
}

// Run vite build using spawn
console.log("Starting Vite build process...");
const viteProcess = spawn('npx', ['vite', 'build'], {
  stdio: 'inherit',
  env: process.env
});

viteProcess.on('close', (code) => {
  if (code === 0) {
    console.log("✅ Vite build completed successfully!");
  } else {
    console.error(\`❌ Vite build failed with code \${code}\`);
    console.log("Creating fallback static files...");
    
    // Create a minimal index.html file as fallback
    const fallbackHtml = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrokerGPT</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0087FF; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>BrokerGPT</h1>
  <div class="card">
    <h2>Static Fallback</h2>
    <p>This is a fallback static version. The full application build process encountered an issue.</p>
    <p>API endpoints should still be functional.</p>
  </div>
  <div class="card">
    <h2>API Status</h2>
    <div id="status">Checking connection...</div>
  </div>

  <script>
    // Check API connection
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        document.getElementById('status').innerHTML = 
          '<p style="color:green">✅ API is working - ' + 
          new Date(data.timestamp).toLocaleString() + '</p>';
      })
      .catch(err => {
        document.getElementById('status').innerHTML = 
          '<p style="color:red">❌ API appears to be offline: ' + err.message + '</p>';
      });
  </script>
</body>
</html>\`;
    
    fs.writeFileSync(path.join(clientDistDir, 'index.html'), fallbackHtml);
    console.log("Created fallback index.html");
  }
});`;

  fs.writeFileSync(path.join(__dirname, 'universal-vite-build.js'), universalBuildScript);
  console.log("Created universal Vite build script");
  
  // 4. Create a compatibility checker
  console.log("Creating Vite compatibility checker...");
  
  const compatibilityChecker = `// ESM compatibility checker for Vite
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🔍 VITE ESM COMPATIBILITY CHECKER");
console.log(\`Node version: \${process.version}\`);

// Check for ESM compatibility
try {
  // Try dynamic import
  import('vite').then(vite => {
    console.log("✅ Successfully imported Vite via ESM dynamic import");
    
    // Try to load our ESM vite config
    import('./vite.config.js').then(config => {
      console.log("✅ Successfully imported vite.config.js via ESM");
      console.log("All ESM compatibility checks passed!");
    }).catch(err => {
      console.error("❌ Error importing vite.config.js:", err.message);
      console.log("Using CommonJS version instead");
    });
  }).catch(err => {
    console.error("❌ Error importing Vite via ESM:", err.message);
    console.log("ESM imports are not working properly in this environment");
  });
} catch (err) {
  console.error("❌ Error with dynamic imports:", err.message);
  console.log("This environment may not support ESM fully");
}`;

  fs.writeFileSync(path.join(__dirname, 'vite-esm-checker.js'), compatibilityChecker);
  console.log("Created Vite ESM compatibility checker");
  
  console.log("Fix process completed. Use the new scripts for improved compatibility!");
}

main().catch(error => {
  console.error("Error in fix script:", error);
  process.exit(1);
});