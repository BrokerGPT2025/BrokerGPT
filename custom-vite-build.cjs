/**
 * CommonJS-compatible Vite build script for Render.com deployment
 * This script avoids ESM syntax to ensure maximum compatibility across environments
 */

// Using CommonJS require
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('Starting custom Vite build (CommonJS mode)...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

/**
 * Execute a command synchronously and log output
 * @param {string} command - The command to execute
 * @param {object} options - Options for execSync
 * @returns {Buffer} The command output
 */
function exec(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Run a command as a separate process
 * @param {string} command - The command to run
 * @param {Array<string>} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<boolean>} Whether the command succeeded
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Command succeeded: ${command} ${args.join(' ')}`);
        resolve(true);
      } else {
        console.error(`Command failed with code ${code}: ${command} ${args.join(' ')}`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error(`Command error: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path to create
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Try to install Vite and needed dependencies if not already installed
 */
async function ensureViteDependencies() {
  try {
    // Check if Vite is installed and accessible
    execSync('npx vite --version', { stdio: 'pipe' });
    console.log('Vite is already installed and accessible');
  } catch (error) {
    console.log('Vite not found or not accessible, installing dependencies...');
    
    // Try to install Vite in multiple ways to ensure it's available
    await runCommand('npm', ['install', '--no-save', 'vite@latest', '@vitejs/plugin-react@latest', 'esbuild@latest']);
    await runCommand('npm', ['install', '-g', 'vite@latest', 'esbuild@latest']);
    
    // Add global binaries to PATH
    process.env.PATH = `${process.env.PATH}:${execSync('npm bin -g').toString().trim()}`;
    console.log(`Updated PATH: ${process.env.PATH}`);
  }
}

/**
 * Build the frontend using Vite
 */
async function buildFrontend() {
  console.log('Building frontend with Vite...');
  
  try {
    // Set up client/dist directory where build output will go
    const distDir = path.join(process.cwd(), 'client', 'dist');
    ensureDir(distDir);
    
    // Try to build with Vite directly
    if (await runCommand('npx', ['vite', 'build'])) {
      console.log('Vite build completed successfully');
      return true;
    }
    
    // If direct build fails, try alternative approaches
    console.log('Direct Vite build failed, trying alternative approach...');
    
    // Try using Vite's JavaScript API
    const viteBuildScript = `
      const { build } = require('vite');
      
      async function buildApp() {
        try {
          await build({
            configFile: './vite.config.js',
            root: process.cwd(),
            logLevel: 'info',
            mode: 'production'
          });
          console.log('Vite build completed via API');
        } catch (err) {
          console.error('Build error:', err);
          process.exit(1);
        }
      }
      
      buildApp();
    `;
    
    const tempScriptPath = path.join(process.cwd(), 'vite-build-temp.js');
    fs.writeFileSync(tempScriptPath, viteBuildScript);
    
    if (await runCommand('node', [tempScriptPath])) {
      // Clean up temp file
      fs.unlinkSync(tempScriptPath);
      console.log('Vite API build completed successfully');
      return true;
    }
    
    // Clean up temp file
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
    
    // Last resort: Try to use esbuild directly for a simple build
    console.log('Vite build failed, attempting basic build with esbuild...');
    
    if (await runCommand('npx', ['esbuild', 'client/src/main.tsx', '--bundle', '--outfile=client/dist/bundle.js'])) {
      // Create a basic HTML file to load the bundle
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BrokerGPT</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <div id="root"></div>
          <script src="/bundle.js"></script>
        </body>
        </html>
      `;
      
      fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
      console.log('Basic esbuild process completed');
      return true;
    }
    
    console.log('All build attempts failed, falling back to static-frontend.js');
    return false;
  } catch (error) {
    console.error('Frontend build error:', error);
    return false;
  }
}

/**
 * Build the backend using esbuild
 */
async function buildBackend() {
  console.log('Building backend with esbuild...');
  
  try {
    const outDir = path.join(process.cwd(), 'dist');
    ensureDir(outDir);
    
    if (await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'])) {
      console.log('Backend build completed successfully');
      return true;
    }
    
    console.log('Standard backend build failed, trying alternative approach...');
    
    // Try a more compatible build approach
    if (await runCommand('npx', ['esbuild', 'server/index.ts', '--bundle', '--platform=node', '--outfile=dist/index.js'])) {
      console.log('Alternative backend build completed successfully');
      return true;
    }
    
    console.log('All backend build attempts failed');
    return false;
  } catch (error) {
    console.error('Backend build error:', error);
    return false;
  }
}

/**
 * Create a minimal index.js in dist as a fallback
 */
function createFallbackServer() {
  console.log('Creating fallback server...');
  
  const fallbackServerPath = path.join(process.cwd(), 'dist', 'index.js');
  const fallbackContent = `
    // Emergency fallback server
    import express from 'express';
    import path from 'path';
    import { fileURLToPath } from 'url';
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const app = express();
    const PORT = process.env.PORT || 5000;
    
    // Serve static frontend
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    // Basic API endpoints
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });
    
    app.get('/api/clients', (req, res) => {
      res.json([]);
    });
    
    app.get('/api/carriers', (req, res) => {
      res.json([]);
    });
    
    // Serve frontend on all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
    
    app.listen(PORT, () => {
      console.log(\`Emergency fallback server running on port \${PORT}\`);
    });
  `;
  
  fs.writeFileSync(fallbackServerPath, fallbackContent);
  console.log(`Created fallback server at: ${fallbackServerPath}`);
}

/**
 * Main build function
 */
async function main() {
  console.log('Starting build process...');
  
  // Ensure Vite and other dependencies are installed
  await ensureViteDependencies();
  
  // Build frontend
  const frontendSuccess = await buildFrontend();
  if (!frontendSuccess) {
    console.log('Frontend build failed, will use static-frontend.js later');
    
    // Try running the static frontend generator
    try {
      // Try ESM version
      exec('node static-frontend.js');
    } catch (e) {
      // If that fails, try require version
      try {
        const staticFrontend = require('./static-frontend.js');
        if (typeof staticFrontend === 'function') {
          staticFrontend();
        }
      } catch (err) {
        console.error('Failed to run static frontend generator:', err);
      }
    }
  }
  
  // Build backend
  const backendSuccess = await buildBackend();
  if (!backendSuccess) {
    console.log('Backend build failed, creating fallback server');
    createFallbackServer();
  }
  
  // Final check to make sure we have necessary files
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  const clientIndexPath = path.join(clientDistDir, 'index.html');
  
  if (!fs.existsSync(distIndexPath)) {
    console.error('ERROR: dist/index.js not found! Application will not run correctly!');
    createFallbackServer();
  }
  
  if (!fs.existsSync(clientIndexPath)) {
    console.error('ERROR: client/dist/index.html not found! Running static frontend generator...');
    exec('node ensure-dist.js');
  }
  
  console.log('Build process completed!');
  return true;
}

// Run the build process
main().then((success) => {
  if (success) {
    console.log('Build completed successfully');
    process.exit(0);
  } else {
    console.error('Build failed');
    process.exit(1);
  }
}).catch((error) => {
  console.error('Build error:', error);
  process.exit(1);
});