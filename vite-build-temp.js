// ESM-compatible Vite build script with improved path resolution
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// First determine where Vite is actually installed
const possibleVitePaths = [
  './node_modules/vite/dist/node/index.js',
  './node_modules/vite/dist/node-cjs/index.cjs',
  '../node_modules/vite/dist/node/index.js',
  '/opt/render/project/node_modules/vite/dist/node/index.js'
];

async function buildApp() {
  try {
    console.log('Starting vite-build-temp.js with dynamic Vite import...');
    console.log(`Current directory: ${process.cwd()}`);
    
    // Try to find which Vite path exists
    let viteModulePath = null;
    for (const path of possibleVitePaths) {
      try {
        console.log(`Checking for Vite at: ${path}`);
        if (fs.existsSync(path)) {
          viteModulePath = path;
          console.log(`Found Vite at: ${path}`);
          break;
        }
      } catch (e) {
        console.log(`Error checking path ${path}: ${e.message}`);
      }
    }
    
    if (!viteModulePath) {
      console.log('Could not find Vite module path. Attempting direct import.');
    }
    
    // Dynamically import Vite using the path or direct import as fallback
    let vite;
    try {
      if (viteModulePath) {
        const vitePath = new URL(viteModulePath, import.meta.url).href;
        console.log(`Importing Vite from: ${vitePath}`);
        vite = await import(vitePath);
      } else {
        console.log('Importing Vite directly...');
        vite = await import('vite');
      }
      console.log('Successfully imported Vite module');
    } catch (importError) {
      console.error('Failed to import Vite:', importError);
      process.exit(1);
    }
    
    // Run the build
    try {
      console.log('Starting Vite build...');
      await vite.build({
        configFile: resolve(process.cwd(), 'vite.config.js'),
        root: process.cwd(),
        logLevel: 'info',
        mode: 'production'
      });
      console.log('Vite build completed via API');
    } catch (buildErr) {
      console.error('Build error:', buildErr);
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    process.exit(1);
  }
}

buildApp();