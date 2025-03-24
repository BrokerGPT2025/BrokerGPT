#!/usr/bin/env node

/**
 * CommonJS script to run Vite commands with proper configuration
 * This helps ensure that Vite runs correctly regardless of module type configuration
 */

'use strict';

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vite runner (CommonJS)...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Try to detect if we're in an ESM or CommonJS project
const packageJsonPath = path.join(process.cwd(), 'package.json');
let isEsmProject = false;

try {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    isEsmProject = packageJson.type === 'module';
    console.log(`Package.json type: ${isEsmProject ? 'module (ESM)' : 'commonjs or unspecified'}`);
  } else {
    console.log('package.json not found, assuming CommonJS project');
  }
} catch (error) {
  console.error('Error reading package.json:', error);
}

// Determine which config file to use
const cjsConfigPath = path.join(process.cwd(), 'vite.config.cjs');
const jsConfigPath = path.join(process.cwd(), 'vite.config.js');
const tsConfigPath = path.join(process.cwd(), 'vite.config.ts');

let configPath = null;
let configFileArg = [];

if (fs.existsSync(cjsConfigPath)) {
  console.log('Using CommonJS vite.config.cjs');
  configPath = cjsConfigPath;
  configFileArg = ['--config', cjsConfigPath];
} else if (fs.existsSync(jsConfigPath)) {
  console.log('Using vite.config.js');
  configPath = jsConfigPath;
  configFileArg = ['--config', jsConfigPath];
} else if (fs.existsSync(tsConfigPath)) {
  console.log('Using TypeScript vite.config.ts');
  configPath = tsConfigPath;
  configFileArg = ['--config', tsConfigPath];
} else {
  console.log('No Vite config file found, using default settings');
}

// Find the Vite binary
function findViteBinary() {
  try {
    // Try local node_modules/.bin/vite
    const localVitePath = path.join(process.cwd(), 'node_modules', '.bin', 'vite');
    if (fs.existsSync(localVitePath)) {
      console.log(`Found Vite at ${localVitePath}`);
      return localVitePath;
    }

    // Try using npm bin
    try {
      const npmBinPath = execSync('npm bin', { encoding: 'utf8' }).trim();
      const npmVitePath = path.join(npmBinPath, 'vite');
      if (fs.existsSync(npmVitePath)) {
        console.log(`Found Vite at ${npmVitePath}`);
        return npmVitePath;
      }
    } catch (error) {
      console.log('Error finding npm bin path:', error.message);
    }

    // Try global installation
    try {
      const globalVitePath = execSync('which vite || echo ""', { encoding: 'utf8' }).trim();
      if (globalVitePath) {
        console.log(`Found global Vite at ${globalVitePath}`);
        return globalVitePath;
      }
    } catch (error) {
      console.log('Error finding global Vite path:', error.message);
    }

    // Try within global npm folder
    try {
      const globalNpmPath = execSync('npm root -g', { encoding: 'utf8' }).trim();
      const globalVitePath = path.join(globalNpmPath, '.bin', 'vite');
      if (fs.existsSync(globalVitePath)) {
        console.log(`Found Vite in global npm at ${globalVitePath}`);
        return globalVitePath;
      }
    } catch (error) {
      console.log('Error finding global npm path:', error.message);
    }

    // Default to 'vite' and hope it's in PATH
    console.log('No specific Vite path found, using "vite" command from PATH');
    return 'vite';
  } catch (error) {
    console.error('Error finding Vite binary:', error);
    return 'vite'; // Default to 'vite' command
  }
}

// Run Vite with appropriate settings
function runVite(command, args = []) {
  const vitePath = findViteBinary();
  
  // Combine the command-line arguments
  const fullArgs = [command, ...configFileArg, ...args];
  console.log(`Running: ${vitePath} ${fullArgs.join(' ')}`);
  
  // For ESM projects, we need to use the --experimental-specifier-resolution=node flag
  const nodeArgs = isEsmProject ? ['--experimental-specifier-resolution=node'] : [];
  const options = {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeArgs.join(' ') + (process.env.NODE_OPTIONS ? ' ' + process.env.NODE_OPTIONS : '')
    }
  };
  
  return new Promise((resolve, reject) => {
    const viteProcess = spawn(vitePath, fullArgs, options);
    
    viteProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Vite ${command} completed successfully`);
        resolve(true);
      } else {
        console.error(`Vite ${command} failed with code ${code}`);
        resolve(false); // Resolve with false instead of rejecting to allow fallbacks
      }
    });
    
    viteProcess.on('error', (err) => {
      console.error(`Failed to start Vite: ${err.message}`);
      resolve(false);
    });
  });
}

// Extract command-line arguments
const args = process.argv.slice(2);
const command = args.length > 0 ? args[0] : 'build';
const commandArgs = args.length > 1 ? args.slice(1) : [];

// Run the Vite command
runVite(command, commandArgs).then(success => {
  if (success) {
    process.exit(0);
  } else {
    // Use our fallback build with esbuild
    console.log('Vite build failed, trying fallback with esbuild...');
    
    try {
      // Create the output directory if it doesn't exist
      const outDir = path.join(process.cwd(), 'client', 'dist');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      
      // Run esbuild
      console.log('Running esbuild...');
      const esbuildCmd = 'npx esbuild client/src/main.tsx --bundle --outfile=client/dist/bundle.js';
      execSync(esbuildCmd, { stdio: 'inherit' });
      
      // Create index.html
      const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrokerGPT</title>
  <link rel="stylesheet" href="/bundle.css" />
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>
      `;
      
      fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
      console.log('Fallback build completed');
      process.exit(0);
    } catch (error) {
      console.error('Fallback build failed:', error);
      process.exit(1);
    }
  }
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});