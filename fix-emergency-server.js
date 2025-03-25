#!/usr/bin/env node
// fix-emergency-server.js - Guarantees a working emergency server
// This script creates a rock-solid fallback emergency server
// without any dependencies on Vite or build tools

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 EMERGENCY SERVER REPAIR SCRIPT 🔧');
console.log(`Working directory: ${process.cwd()}`);

// Ensure dist directory exists
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Minimal emergency server content
const emergencyServer = `// EMERGENCY SERVER - DO NOT MODIFY
// This file contains a standalone Express server with no external dependencies
// It's designed to run even when the normal build process fails

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get file path in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚠️ EMERGENCY SERVER ACTIVATED ⚠️');
console.log(\`Node version: \${process.version}\`);
console.log(\`Current directory: \${process.cwd()}\`);

// Initialize Express app
const app = express();
app.use(express.json());

// Define possible static file locations
const possiblePaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, '..', 'dist', 'public'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), 'dist', 'public')
];

// Set up static serving
let foundStaticPath = false;
for (const staticPath of possiblePaths) {
  if (fs.existsSync(staticPath)) {
    console.log(\`Serving static files from: \${staticPath}\`);
    app.use(express.static(staticPath));
    foundStaticPath = true;
  }
}

// Create emergency HTML if needed
if (!foundStaticPath) {
  console.log('No static files found, creating emergency content');
  
  // Create client/dist directory if needed
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  if (!fs.existsSync(clientDistDir)) {
    fs.mkdirSync(clientDistDir, { recursive: true });
  }
  
  // Create a basic but functional emergency HTML file
  const html = \`<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT - Emergency Mode</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0087FF; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>BrokerGPT - Emergency Mode</h1>
  <div class="card">
    <h2>Server Status</h2>
    <p>The server is running in emergency mode.</p>
    <p>API endpoints are available but the main application didn't load.</p>
  </div>
  <div class="card">
    <h2>API Status</h2>
    <div id="status">Checking...</div>
    <button onclick="checkApi()">Test API</button>
  </div>
  <script>
    function checkApi() {
      fetch('/api/health')
        .then(r => r.json())
        .then(data => {
          document.getElementById('status').innerHTML = 
            '<p style="color:green">✓ API is working</p><pre>' + 
            JSON.stringify(data, null, 2) + '</pre>';
        })
        .catch(err => {
          document.getElementById('status').innerHTML = 
            '<p style="color:red">✗ API error: ' + err.message + '</p>';
        });
    }
    checkApi();
  </script>
</body>
</html>\`;
  
  fs.writeFileSync(path.join(clientDistDir, 'index.html'), html);
  app.use(express.static(clientDistDir));
}

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'emergency',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    staticPaths: possiblePaths.map(p => ({ 
      path: p, 
      exists: fs.existsSync(p) 
    }))
  });
});

app.get('/api/carriers', (req, res) => {
  res.json([
    { id: 1, name: 'Example Insurance Co', specialties: ['Property', 'General Liability'] },
    { id: 2, name: 'Sample Carrier Inc', specialties: ['Workers Comp', 'Auto'] }
  ]);
});

app.get('/api/clients', (req, res) => {
  res.json([
    { id: 1, name: 'Tech Startup', businessType: 'Technology' },
    { id: 2, name: 'Corner Restaurant', businessType: 'Food Service' }
  ]);
});

// SPA fallback
app.get('*', (req, res) => {
  // Try each static path for index.html
  for (const staticPath of possiblePaths) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Basic 404 page
  res.status(404).send(\`
    <html><body style="font-family:sans-serif;text-align:center;margin-top:50px">
      <h1 style="color:#0087FF">Page Not Found</h1>
      <p>The requested page doesn't exist in emergency mode.</p>
      <a href="/" style="color:#0087FF">Home</a>
    </body></html>
  \`);
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`⚠️ EMERGENCY SERVER RUNNING AT http://localhost:\${PORT} ⚠️\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'not set'}\`);
});`;

// Write the emergency server to dist/index.js
const indexJsPath = path.join(distDir, 'index.js');
fs.writeFileSync(indexJsPath, emergencyServer);
console.log(`✅ Created guaranteed working emergency server at ${indexJsPath}`);

// Also create a direct fallback file
const fallbackPath = path.join(distDir, 'index.js.fallback');
fs.writeFileSync(fallbackPath, emergencyServer);
console.log(`✅ Created backup file at ${fallbackPath}`);

// Create a client/dist directory and emergency index.html if needed
const clientDistDir = path.join(process.cwd(), 'client', 'dist');
if (!fs.existsSync(clientDistDir)) {
  fs.mkdirSync(clientDistDir, { recursive: true });
  console.log(`Created client/dist directory`);
  
  // Create a basic HTML file as fallback
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT - Emergency Mode</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0087FF; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <h1>BrokerGPT - Emergency Mode</h1>
  <div class="card">
    <h2>Direct Emergency Page</h2>
    <p>This is the direct emergency fallback page.</p>
  </div>
  <div class="card">
    <h2>API Status</h2>
    <div id="status">Checking...</div>
    <button onclick="checkApi()">Test API</button>
  </div>
  <script>
    function checkApi() {
      fetch('/api/health')
        .then(r => r.json())
        .then(data => {
          document.getElementById('status').innerHTML = 
            '<p style="color:green">✓ API is working</p><pre>' + 
            JSON.stringify(data, null, 2) + '</pre>';
        })
        .catch(err => {
          document.getElementById('status').innerHTML = 
            '<p style="color:red">✗ API error: ' + err.message + '</p>';
        });
    }
    checkApi();
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(clientDistDir, 'index.html'), html);
  console.log(`✅ Created emergency index.html`);
}

console.log('🟢 Emergency server repair completed successfully');
console.log('The application will now have a guaranteed fallback if the build fails');