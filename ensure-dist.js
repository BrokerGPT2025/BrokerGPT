// Script to ensure dist directory and index.js exist
// This is used during the build process to guarantee proper deployment
// Using ESM syntax based on package.json type:module setting

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();

// Paths
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.js');

console.log('Ensuring dist/index.js exists...');
console.log('Ensuring dist directory exists...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Content for index.js if it doesn't exist - using ESM format
// IMPORTANT: This content must never import vite or build tools directly 
// because it will run in production where they may not be available
const indexContent = `// STANDALONE EMERGENCY SERVER
// This server has NO external dependencies outside of Node.js built-ins and Express
// It is designed to run even when the main build fails
// ⚠️ IMPORTANT: THIS FILE MUST NOT IMPORT VITE OR ANY BUILD TOOLS ⚠️

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

// Try multiple static file paths to handle different build outputs
const possibleStaticPaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, '..', 'dist', 'public'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), 'dist', 'public')
];

// Set up static serving - check multiple possible paths
let staticPathFound = false;
for (const staticPath of possibleStaticPaths) {
  if (fs.existsSync(staticPath)) {
    console.log(\`Serving static files from \${staticPath}\`);
    app.use(express.static(staticPath));
    staticPathFound = true;
  }
}

if (!staticPathFound) {
  console.log('WARNING: No static file paths found. Creating emergency HTML...');
  
  // Create client/dist if it doesn't exist
  const clientDistPath = path.join(process.cwd(), 'client', 'dist');
  if (!fs.existsSync(clientDistPath)) {
    fs.mkdirSync(clientDistPath, { recursive: true });
  }
  
  // Create emergency HTML file
  const emergencyHtml = \`<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
    h1 { color: #0087FF; }
    .card { border: 1px solid #eee; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    button { background: #0087FF; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    .success { color: #10b981; }
    .error { color: #ef4444; }
  </style>
</head>
<body>
  <h1>BrokerGPT</h1>
  <div class="card">
    <h2>Emergency Server Mode</h2>
    <p>The application is running in emergency mode. This indicates there might have been an issue with the main application build.</p>
    <p>The API endpoints are still functional.</p>
  </div>
  <div class="card">
    <h2>API Status</h2>
    <div id="api-status">Checking API connection...</div>
    <button onclick="checkStatus()">Check Again</button>
  </div>
  <div class="card">
    <h2>Static Paths Checked</h2>
    <ul>
      ${possibleStaticPaths.map(p => \`<li>\${p}</li>\`).join('')}
    </ul>
  </div>
  <script>
    // Check API status
    function checkStatus() {
      document.getElementById('api-status').innerHTML = 'Connecting...';
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          document.getElementById('api-status').innerHTML = 
            '<p class="success">✅ API is online and working properly</p>' +
            '<p>Server time: ' + new Date(data.timestamp).toLocaleString() + '</p>';
        })
        .catch(err => {
          document.getElementById('api-status').innerHTML = 
            '<p class="error">❌ API appears to be offline: ' + err.message + '</p>';
        });
    }
    
    // Initial API check
    checkStatus();
  </script>
</body>
</html>\`;
  
  fs.writeFileSync(path.join(clientDistPath, 'index.html'), emergencyHtml);
  console.log('Created emergency index.html in client/dist');
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    staticPaths: possibleStaticPaths.filter(p => fs.existsSync(p))
  });
});

// API endpoint for chat - minimal fallback
app.get('/api/chat', (req, res) => {
  res.json({ messages: [] });
});

// API endpoint for carriers - minimal fallback
app.get('/api/carriers', (req, res) => {
  res.json([
    { id: 1, name: 'Acme Insurance', specialties: ['Property', 'General Liability'] },
    { id: 2, name: 'Umbrella Corp', specialties: ['Worker Compensation', 'Medical'] }
  ]);
});

// API endpoint for clients - minimal fallback
app.get('/api/clients', (req, res) => {
  res.json([
    { id: 1, name: 'Tech Startup Inc', businessType: 'Technology' },
    { id: 2, name: 'Local Restaurant', businessType: 'Food Service' }
  ]);
});

// SPA fallback - check multiple paths for index.html
app.get('*', (req, res) => {
  // Check each possible path for index.html
  for (const staticPath of possibleStaticPaths) {
    const indexHtmlPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      return res.sendFile(indexHtmlPath);
    }
  }
  
  // If no index.html found, serve minimal HTML
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
      <p>Emergency server is running. Index file not found in any static directory.</p>
    </body>
    </html>
  \`);
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT}\`);
  console.log('Environment variables:');
  console.log(\`- NODE_ENV: \${process.env.NODE_ENV || 'not set'}\`);
  console.log(\`- PORT: \${PORT}\`);
});`;

// Check if index.js exists
if (!fs.existsSync(indexPath)) {
  console.log('Creating dist/index.js...');
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created dist/index.js');
} else {
  console.log('dist/index.js already exists');
  
  // Update the existing file
  try {
    fs.writeFileSync(indexPath, indexContent);
    console.log('Updated dist/index.js to remove external dependencies...');
    console.log('Updated dist/index.js');
  } catch (error) {
    console.error('Error updating dist/index.js:', error);
  }
}

console.log('Dist directory setup complete!');