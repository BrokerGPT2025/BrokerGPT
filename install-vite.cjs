// Special Vite installation script for Render.com platform
// This script skips native dependencies that cause problems
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 PLATFORM-SPECIFIC VITE INSTALLER');
console.log(`Node version: ${process.version}`);
console.log(`Platform: ${process.platform} (${process.arch})`);

// Skip native dependencies for Rollup on Linux
const isLinux = process.platform === 'linux';
if (isLinux) {
  console.log('Linux platform detected - setting up special Rollup config');
  process.env.ROLLUP_SKIP_NODEJS_NATIVE = '1';
}

// Direct installation without native dependencies
try {
  // Skip native bindings for problematic packages
  console.log('Installing Vite and core packages directly (skipping native builds)...');
  execSync('npm i --no-save --no-optional --ignore-scripts vite@latest esbuild@latest @vitejs/plugin-react@latest react@latest react-dom@latest', { 
    stdio: 'inherit',
    env: { 
      ...process.env,
      ESBUILD_BINARY_PATH: "/tmp/esbuild-binary",
      ROLLUP_SKIP_NODEJS_NATIVE: "1"
    }
  });
  console.log('✅ Core packages installed successfully');
} catch (err) {
  console.error('❌ Error installing packages:', err.message);
}

// Create minimal Vite config file
try {
  console.log('Creating minimal Vite config file...');
  
  const minimalViteConfig = `// Minimal Vite config that works in any environment
// Created by install-vite.cjs on ${new Date().toISOString()}
'use strict';

// Plain CommonJS format for maximum compatibility
module.exports = {
  // Basic build settings
  root: '.',
  publicDir: 'public',
  
  // Build configuration
  build: {
    outDir: 'client/dist',
    emptyOutDir: true,
    minify: true
  }
};`;

  fs.writeFileSync(path.join(process.cwd(), 'minimal-vite.config.js'), minimalViteConfig);
  console.log('✅ Created minimal Vite config file');
} catch (configErr) {
  console.error('❌ Error creating config file:', configErr.message);
}

// Check if Vite is properly installed by trying to load it
try {
  console.log('Checking Vite installation...');
  
  // Try to require Vite to see if it works
  const vitePath = require.resolve('vite');
  console.log(`✅ Vite found at: ${vitePath}`);
  
  // Check version using execSync
  try {
    const viteVersion = execSync('npx vite --version', { 
      encoding: 'utf8',
      timeout: 5000
    }).trim();
    console.log(`✅ Vite version: ${viteVersion}`);
  } catch (versionErr) {
    console.error('Failed to check Vite version:', versionErr.message);
  }
} catch (checkErr) {
  console.error('❌ Error checking Vite installation:', checkErr.message);
}

console.log('Installation script completed.');