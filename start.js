// Redirect script for Render.com deployment
// This script ensures that when Render.com falls back to using `npm start`,
// it will properly redirect to our production script.

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

console.log('Starting BrokerGPT application through start.js...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prodScriptPath = path.join(__dirname, 'prod.js');

console.log(`Redirecting to production script at ${prodScriptPath}`);

// Set environment variable
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
});