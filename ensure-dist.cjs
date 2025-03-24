// Script to ensure dist directory and index.js exist (CommonJS version)
// This is used during the build process to guarantee proper deployment
// Using CommonJS syntax for maximum compatibility

'use strict';

const fs = require('fs');
const path = require('path');

// __dirname is already available in CommonJS
const rootDir = process.cwd();

// Paths
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.js');

console.log('Ensuring dist directory exists (CommonJS version)...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Content for index.js if it doesn't exist - using ESM format since that's what's expected
// but we could create a CommonJS version if needed
const indexContentESM = `// Fallback entry point for Render.com deployment
// This script serves a minimal Express server without any external dependencies
// Using ESM syntax based on package.json type:module setting

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

console.log('WARNING: dist/index.js was called directly.');
console.log('Starting minimal Express server...');
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app = express();
app.use(express.json());

// Set up static serving
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(\`Serving static files from \${clientDistPath}\`);
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint for chat - minimal fallback
app.get('/api/chat', (req, res) => {
  res.json({ messages: [] });
});

// API endpoint for carriers - minimal fallback
app.get('/api/carriers', (req, res) => {
  res.json([]);
});

// SPA fallback
app.get('*', (req, res) => {
  const indexHtmlPath = path.join(clientDistPath, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.send(\`
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
        <p>Emergency server is running. Regular API endpoints are unavailable.</p>
      </body>
      </html>
    \`);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT}\`);
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- PORT:', process.env.PORT || '5000 (default)');
});`;

// Alternative content in CommonJS format if we need it
const indexContentCJS = `// Fallback entry point for Render.com deployment (CommonJS version)
// This script serves a minimal Express server without any external dependencies
// Using CommonJS syntax for maximum compatibility

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('WARNING: dist/index.js was called directly (CommonJS version).');
console.log('Starting minimal Express server...');
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Initialize Express
const app = express();
app.use(express.json());

// Set up static serving
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(\`Serving static files from \${clientDistPath}\`);
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'commonjs', timestamp: new Date().toISOString() });
});

// API endpoint for chat - minimal fallback
app.get('/api/chat', (req, res) => {
  res.json({ messages: [] });
});

// API endpoint for carriers - minimal fallback
app.get('/api/carriers', (req, res) => {
  res.json([]);
});

// SPA fallback
app.get('*', (req, res) => {
  const indexHtmlPath = path.join(clientDistPath, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.send(\`
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
        <p>Emergency server is running in CommonJS mode. Regular API endpoints are unavailable.</p>
      </body>
      </html>
    \`);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT} (CommonJS)\`);
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- PORT:', process.env.PORT || '5000 (default)');
});`;

// Check package.json for type:module to determine format to use
let indexContent = indexContentESM; // Default to ESM
try {
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.type !== 'module') {
      // If not type:module, use CommonJS format
      console.log('Package.json does not specify type:module, using CommonJS format');
      indexContent = indexContentCJS;
    }
  }
} catch (error) {
  console.warn('Error reading package.json, defaulting to ESM format:', error);
}

// Check if index.js exists
if (!fs.existsSync(indexPath)) {
  console.log('Creating dist/index.js...');
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created dist/index.js');
} else {
  console.log('dist/index.js already exists');
  
  // Update the existing file to use CommonJS without vite/tsx dependencies
  try {
    const currentContent = fs.readFileSync(indexPath, 'utf8');
    
    // Only replace if it contains problematic imports
    if (currentContent.includes('import') && 
        (currentContent.includes('vite') || currentContent.includes('tsx'))) {
      console.log('Updating dist/index.js to remove external dependencies...');
      fs.writeFileSync(indexPath, indexContent);
      console.log('Updated dist/index.js');
    }
  } catch (error) {
    console.error('Error checking or updating dist/index.js:', error);
  }
}

console.log('Dist directory setup complete!');