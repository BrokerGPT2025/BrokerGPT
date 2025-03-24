// Script to ensure dist directory and index.js exist
// This is used during the build process to guarantee proper deployment

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.js');
const startScriptPath = path.join(__dirname, 'start.js');

console.log('Ensuring dist directory exists...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Content for index.js if it doesn't exist
const indexContent = `// Fallback entry point for Render.com deployment
// This script redirects to the production script if it's run by mistake

import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

console.log('WARNING: dist/index.js was called directly.');
console.log('Redirecting to the proper production entry point...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prodScriptPath = path.join(__dirname, '..', 'prod.js');

process.env.NODE_ENV = 'production';

// Spawn the process using --import tsx for TypeScript support
const child = spawn('node', ['--import', 'tsx', prodScriptPath], {
  stdio: 'inherit',
  env: process.env
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code);
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start production script:', err);
  process.exit(1);
});`;

// Check if index.js exists
if (!fs.existsSync(indexPath)) {
  console.log('Creating dist/index.js...');
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created dist/index.js');
} else {
  console.log('dist/index.js already exists');
}

console.log('Dist directory setup complete!');