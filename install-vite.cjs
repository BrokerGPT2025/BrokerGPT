#!/usr/bin/env node

/**
 * Installation script to ensure Vite and related dependencies are properly installed
 * This is intended to run before the build process on Render.com
 */

'use strict';

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vite dependency installation...');
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);

// Verify PATH and try to find the Vite binary
console.log('PATH:', process.env.PATH);
try {
  const vitePathResult = execSync('which vite || echo "Not found"', { encoding: 'utf8' });
  console.log('Vite location:', vitePathResult.trim());
} catch (error) {
  console.error('Error checking Vite location:', error.message);
}

// Check if node_modules exists
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const vitePath = path.join(nodeModulesPath, '.bin', 'vite');
const viteInstalled = fs.existsSync(vitePath);

console.log(`Checking node_modules: ${fs.existsSync(nodeModulesPath) ? 'Exists' : 'Missing'}`);
console.log(`Checking vite binary: ${viteInstalled ? 'Installed' : 'Missing'}`);

// Packages to install
const packages = [
  'vite@latest',
  '@vitejs/plugin-react@latest',
  'esbuild@latest'
];

// Check if package.json exists and has a "type": "module" field
let hasTypeModule = false;
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    hasTypeModule = packageJson.type === 'module';
    console.log(`package.json type field: ${hasTypeModule ? 'module' : 'not module or not present'}`);
  }
} catch (error) {
  console.error('Error reading package.json:', error.message);
}

// Install packages
function installPackages() {
  console.log(`Installing packages: ${packages.join(', ')}...`);
  
  try {
    // Try to install in multiple ways to ensure coverage
    
    // Method 1: Standard npm install
    console.log('Method 1: Standard npm install...');
    execSync(`npm install --no-save ${packages.join(' ')}`, {
      stdio: 'inherit',
      timeout: 120000 // 2 minute timeout
    });
    
    // Method 2: Install globally (might need sudo in some envs, but not on Render)
    console.log('Method 2: Global npm install...');
    execSync(`npm install -g ${packages.join(' ')}`, {
      stdio: 'inherit',
      timeout: 120000
    });
    
    // Method 3: Use npx to ensure latest versions
    console.log('Method 3: Using npx to install...');
    execSync(`npx ${packages.join(' && npx ')}`, {
      stdio: 'inherit',
      timeout: 10000 // shorter timeout as this is just a verification
    });
    
    console.log('All installation methods completed.');
    
    // Verify installation
    if (fs.existsSync(vitePath)) {
      console.log('✅ Vite binary is now present in node_modules/.bin/vite');
    } else {
      console.log('⚠️ Vite binary is still missing after installation');
      // Create symlinks if necessary
      createSymlinks();
    }
    
    // Add node_modules/.bin to PATH
    const binPath = path.join(nodeModulesPath, '.bin');
    if (fs.existsSync(binPath)) {
      process.env.PATH = `${binPath}:${process.env.PATH}`;
      console.log(`Updated PATH with node_modules/.bin: ${process.env.PATH}`);
    }
    
  } catch (error) {
    console.error('Error during installation:', error.message);
    return false;
  }
  
  return true;
}

// Create symlinks as a fallback
function createSymlinks() {
  console.log('Creating symlinks for Vite...');
  
  try {
    // Find global installations
    const globalVitePath = execSync('npm root -g', { encoding: 'utf8' }).trim();
    console.log(`Global npm packages directory: ${globalVitePath}`);
    
    const possibleVitePaths = [
      path.join(globalVitePath, 'vite', 'bin', 'vite.js'),
      path.join(globalVitePath, '.bin', 'vite'),
      path.join(globalVitePath, 'node_modules', '.bin', 'vite')
    ];
    
    let sourceVitePath = null;
    for (const p of possibleVitePaths) {
      if (fs.existsSync(p)) {
        sourceVitePath = p;
        console.log(`Found Vite at: ${p}`);
        break;
      }
    }
    
    if (sourceVitePath) {
      // Ensure .bin directory exists
      const binDir = path.join(nodeModulesPath, '.bin');
      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
      }
      
      // Create symlink
      fs.symlinkSync(sourceVitePath, vitePath, 'file');
      console.log(`Created symlink from ${sourceVitePath} to ${vitePath}`);
      
      if (fs.existsSync(vitePath)) {
        console.log('✅ Symlink created successfully');
        
        // Make it executable just in case
        try {
          fs.chmodSync(vitePath, '755');
          console.log('Made Vite binary executable');
        } catch (err) {
          console.error('Failed to make Vite binary executable:', err.message);
        }
      } else {
        console.log('⚠️ Symlink creation failed');
      }
    } else {
      console.log('❌ No Vite installation found globally');
    }
  } catch (error) {
    console.error('Error creating symlinks:', error.message);
  }
}

// Main function
async function main() {
  // Install packages
  const installSuccess = installPackages();
  
  if (installSuccess) {
    console.log('✅ Vite dependencies installation completed successfully');
  } else {
    console.log('⚠️ There were issues installing Vite dependencies');
  }
  
  // Log binary locations
  try {
    console.log('Binary locations:');
    execSync('which vite || echo "vite: Not found"', { stdio: 'inherit' });
    execSync('which esbuild || echo "esbuild: Not found"', { stdio: 'inherit' });
  } catch (error) {
    // Ignore errors
  }
  
  // Try to run vite version check as a final verification
  try {
    console.log('Checking Vite version:');
    execSync('npx vite --version', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to check Vite version:', error.message);
  }
  
  return installSuccess;
}

// Run the main function
main().then(success => {
  if (success) {
    console.log('Installation script completed successfully');
    process.exit(0);
  } else {
    console.error('Installation script completed with errors');
    // Don't exit with error code to let the build continue
    process.exit(0);
  }
}).catch(error => {
  console.error('Unhandled error in installation script:', error);
  // Don't exit with error code to let the build continue
  process.exit(0);
});