// Redirect script for Render.com deployment
// This script ensures that when Render.com falls back to using `npm start`,
// it will directly use the dist/index.js file which has the emergency server.
// Using ESM syntax based on package.json type:module setting

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

console.log('Starting BrokerGPT application through start.js...');
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);

// Set environment variable if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('Setting NODE_ENV to production');
}

// Check if dist/index.js exists first - that's our primary target
const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
const prodScriptPath = path.join(process.cwd(), 'prod.js');

console.log(`Checking for dist/index.js at ${distIndexPath}`);

// Try to use dist/index.js first (our emergency server)
if (fs.existsSync(distIndexPath)) {
  console.log('Found dist/index.js, using it directly...');
  
  // Spawn the process to run dist/index.js
  const child = spawn('node', [distIndexPath], {
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
    console.error('Failed to start dist/index.js server:', err);
    startEmergencyServer();
  });
} 
// If dist/index.js doesn't exist, try prod.js
else if (fs.existsSync(prodScriptPath)) {
  console.log(`Dist index not found, trying prod.js at ${prodScriptPath}`);
  
  // Spawn the process to run prod.js
  const child = spawn('node', [prodScriptPath], {
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
    console.error('Failed to start prod.js server:', err);
    startEmergencyServer();
  });
}
// If neither exists, start emergency server directly
else {
  console.error('Neither dist/index.js nor prod.js exist!');
  startEmergencyServer();
}

// Emergency server function if all else fails
async function startEmergencyServer() {
  console.log('Starting emergency inline server...');
  
  try {
    // Use dynamic import for ESM
    const expressModule = await import('express');
    const express = expressModule.default;
    const app = express();
    const PORT = process.env.PORT || 5000;
    
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>BrokerGPT</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .logo { font-size: 2rem; font-weight: bold; color: #0087FF; }
          </style>
        </head>
        <body>
          <div class="logo">BrokerGPT</div>
          <p>Emergency server is running. This is a fallback of last resort.</p>
        </body>
        </html>
      `);
    });
    
    app.listen(PORT, () => {
      console.log(`[INLINE EMERGENCY SERVER] Running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Complete server failure. Cannot start Express:', err);
    console.log('Exiting process');
    process.exit(1);
  }
}