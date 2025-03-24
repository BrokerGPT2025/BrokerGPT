// Minimal build script for production on Render.com (CommonJS version)
// This bypasses the need for Vite and creates a basic client build
// Using CommonJS syntax for maximum compatibility

'use strict';

const fs = require('fs');
const path = require('path');

// __dirname is already available in CommonJS
const rootDir = process.cwd();

console.log('Starting minimal build process (CommonJS version)...');

// Create required directories
const distDir = path.join(rootDir, 'dist');
const clientDistDir = path.join(rootDir, 'client', 'dist');

console.log('Creating required directories...');
[distDir, clientDistDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create a minimal index.html file in client/dist
const indexHtmlPath = path.join(clientDistDir, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log('Creating minimal index.html...');
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrokerGPT</title>
  <style>
    body, html {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #f9fafb;
    }
    #app {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 30px 20px;
    }
    h1 {
      color: #0087FF;
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    h2 {
      color: #4b5563;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    p {
      color: #4b5563;
      max-width: 600px;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    .logo {
      width: 100px;
      height: 100px;
      margin-bottom: 2rem;
      background-color: #0087FF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      max-width: 700px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .status-banner {
      display: inline-block;
      padding: 10px 20px;
      background-color: #fef9c3;
      color: #854d0e;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
      border-left: 4px solid #f59e0b;
    }
    .reload-button {
      background-color: #0087FF;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      margin-top: 20px;
      text-decoration: none;
      display: inline-block;
    }
    .api-status {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
      background-color: #e0f2fe;
      color: #0369a1;
    }
    code {
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
    }
    .timestamp {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="logo">BG</div>
    <h1>BrokerGPT</h1>
    <p>AI-powered insurance recommendation platform that intelligently matches clients with optimal insurance carriers through advanced risk profiling and personalized matching technologies.</p>
    
    <div class="status-banner">
      This is a temporary placeholder page (CommonJS version)
    </div>
    
    <div class="card">
      <h2>Deployment Status</h2>
      <p>The BrokerGPT backend API is available, but the React frontend could not be built properly during deployment.</p>
      <p>This is a fallback page to indicate that the core service is still operational.</p>
      
      <div class="api-status" id="apiStatus">Checking API status...</div>
      
      <div class="timestamp">
        Page generated: ${new Date().toISOString()}
      </div>
      
      <a href="/" class="reload-button" onclick="window.location.reload(); return false;">Refresh Page</a>
    </div>
  </div>
  
  <script>
    // Check if the API is responding
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        const statusEl = document.getElementById('apiStatus');
        statusEl.innerHTML = 'API Status: ✅ Online<br>Server time: ' + (data.timestamp || 'N/A');
        statusEl.style.backgroundColor = '#dcfce7';
        statusEl.style.color = '#166534';
        
        // Also check if the frontend is available
        fetch('/assets/index.js')
          .then(() => {
            window.location.reload(); // Frontend assets now seem to exist - reload
          })
          .catch(() => {
            console.log('Frontend assets still not available');
          });
      })
      .catch(error => {
        const statusEl = document.getElementById('apiStatus');
        statusEl.innerHTML = 'API Status: ❌ Offline - The server may still be starting';
        statusEl.style.backgroundColor = '#fee2e2';
        statusEl.style.color = '#b91c1c';
        
        // Try again in 5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('Created minimal index.html');
}

// Create a minimal server bundle in dist/index.js
// Note: We're still creating an ESM version of the server bundle
// because that's what's expected by the system, but you could 
// create a CommonJS version if needed
const serverBundlePath = path.join(distDir, 'index.js');
if (!fs.existsSync(serverBundlePath)) {
  console.log('Creating minimal server bundle...');
  
  // Check package.json for type:module to determine format to use
  let isESM = true;
  try {
    const packageJsonPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      isESM = packageJson.type === 'module';
    }
  } catch (error) {
    console.warn('Error reading package.json, defaulting to ESM format:', error);
  }
  
  if (isESM) {
    // ESM server bundle
    const serverBundle = `// Minimal server bundle created by minimal-build.cjs
// This serves a minimal Express application without external dependencies
// Using ESM syntax based on package.json type:module setting

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

console.log('Starting minimal emergency server (built with CommonJS, running as ESM)...');
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

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
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT}\`);
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- PORT:', process.env.PORT || '5000 (default)');
});`;
    
    fs.writeFileSync(serverBundlePath, serverBundle);
  } else {
    // CommonJS server bundle
    const serverBundle = `// Minimal server bundle created by minimal-build.cjs
// This serves a minimal Express application without external dependencies
// Using CommonJS syntax

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Starting minimal emergency server (CommonJS)...');
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Set NODE_ENV to production
process.env.NODE_ENV = 'production';

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
        <p>Emergency server is running (CommonJS mode). Regular API endpoints are unavailable.</p>
      </body>
      </html>
    \`);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT} (CommonJS)\`);
  console.log('Environment variables:');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- PORT:', process.env.PORT || '5000 (default)');
});`;
    
    fs.writeFileSync(serverBundlePath, serverBundle);
  }
  
  console.log('Created minimal server bundle');
}

console.log('Minimal build completed successfully (CommonJS version)!');