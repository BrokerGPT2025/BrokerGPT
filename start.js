// Redirect script for Render.com deployment
// This script ensures that when Render.com falls back to using `npm start`,
// it will properly redirect to our production script.

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

console.log('Starting BrokerGPT application through start.js...');
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Set environment variable if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('Setting NODE_ENV to production');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prodScriptPath = path.join(__dirname, 'prod.js');

// Verify that prod.js exists
if (!fs.existsSync(prodScriptPath)) {
  console.error(`ERROR: Production script not found at ${prodScriptPath}`);
  console.log('Attempting to create minimal prod.js file...');
  
  const minimalProdJs = `
  // Minimal production server created by start.js
  import express from 'express';
  import path from 'path';
  import { fileURLToPath } from 'url';
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const app = express();
  app.use(express.json());
  
  // Serve static files from dist directory
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
  
  // Fallback route
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT}\`);
  });`;
  
  fs.writeFileSync(prodScriptPath, minimalProdJs);
  console.log('Created minimal prod.js file');
}

console.log(`Redirecting to production script at ${prodScriptPath}`);

// Check if tsx is available
let command = 'node';
let args = [];

try {
  // Check if tsx is installed
  require.resolve('tsx');
  console.log('Using tsx for TypeScript support');
  args = ['--import', 'tsx', prodScriptPath];
} catch (e) {
  console.log('tsx not found, trying to run prod.js directly');
  args = [prodScriptPath];
}

// Spawn the process
const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env
});

// Handle process exit
child.on('exit', (code) => {
  console.log(`Child process exited with code ${code}`);
  process.exit(code);
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start production script:', err);
  
  // Try one last fallback approach
  console.log('Attempting emergency direct server startup...');
  
  const app = require('express')();
  const PORT = process.env.PORT || 5000;
  
  app.get('/', (req, res) => {
    res.send('BrokerGPT Emergency Server');
  });
  
  app.listen(PORT, () => {
    console.log(`[EMERGENCY SERVER] Running at http://localhost:${PORT}`);
  });
});