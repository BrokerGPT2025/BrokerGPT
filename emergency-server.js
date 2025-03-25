// STANDALONE EMERGENCY SERVER FOR PRODUCTION
// This file has NO external dependencies other than Express
// It is designed to run in production without build tools

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 STANDALONE EMERGENCY SERVER STARTING 🚨');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Express app setup
const app = express();
app.use(express.json());

// Define possible static file paths to check
const staticPaths = [
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'dist', 'public'),
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), 'dist', 'public'),
];

// Serve static files from all paths that exist
let staticPathFound = false;
for (const staticPath of staticPaths) {
  if (fs.existsSync(staticPath)) {
    console.log(`Serving static files from: ${staticPath}`);
    app.use(express.static(staticPath));
    staticPathFound = true;
  }
}

// If no static files found, create an emergency HTML file
if (!staticPathFound) {
  console.log('No static files found, creating emergency content');
  
  // Create client/dist directory if it doesn't exist
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  if (!fs.existsSync(clientDistDir)) {
    fs.mkdirSync(clientDistDir, { recursive: true });
  }

  // Create a basic HTML file with diagnostic info
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT - Emergency Mode</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #0087FF; }
    .card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
    button { background: #0087FF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    pre { background: #f5f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>BrokerGPT - Standalone Emergency Server</h1>
  
  <div class="card">
    <h2>Server Status</h2>
    <p>The application is running through a standalone emergency server. The normal build process encountered issues.</p>
  </div>
  
  <div class="card">
    <h2>API Status</h2>
    <div id="api-status">Checking API status...</div>
    <button onclick="checkApi()">Test API</button>
  </div>
  
  <div class="card">
    <h2>Static Files</h2>
    <p>The server checked the following paths for static files:</p>
    <ul id="static-paths"></ul>
  </div>
  
  <div class="card">
    <h2>Environment</h2>
    <div id="environment">Loading...</div>
  </div>
  
  <script>
    // Check API status
    function checkApi() {
      fetch('/api/health')
        .then(res => res.json())
        .then(data => {
          document.getElementById('api-status').innerHTML = 
            '<p style="color: green">✓ API is working</p>' +
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          
          // Also update static paths display
          if (data.staticPaths) {
            const pathsList = document.getElementById('static-paths');
            pathsList.innerHTML = '';
            data.staticPaths.forEach(p => {
              const li = document.createElement('li');
              li.textContent = p.path + (p.exists ? ' ✓' : ' ✗');
              li.style.color = p.exists ? 'green' : 'red';
              pathsList.appendChild(li);
            });
          }
        })
        .catch(err => {
          document.getElementById('api-status').innerHTML = 
            '<p style="color: red">✗ API error: ' + err.message + '</p>';
        });
    }
    
    // Get environment info
    function getEnvironment() {
      fetch('/api/environment')
        .then(res => res.json())
        .then(data => {
          document.getElementById('environment').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        })
        .catch(err => {
          document.getElementById('environment').innerHTML = '<p style="color: red">Error: ' + err.message + '</p>';
        });
    }
    
    // Run API checks on page load
    checkApi();
    getEnvironment();
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(clientDistDir, 'index.html'), html);
  console.log('Created emergency index.html');
  app.use(express.static(clientDistDir));
}

// Define API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'standalone-emergency',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    staticPaths: staticPaths.map(p => ({
      path: p,
      exists: fs.existsSync(p)
    }))
  });
});

app.get('/api/environment', (req, res) => {
  // Safely get environment info without exposing secrets
  res.json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Sample API endpoints
app.get('/api/carriers', (req, res) => {
  res.json([
    { id: 1, name: 'Example Insurance Co', specialties: ['Property', 'General Liability'] },
    { id: 2, name: 'Sample Carrier Inc', specialties: ['Workers Comp', 'Auto'] }
  ]);
});

app.get('/api/clients', (req, res) => {
  res.json([
    { id: 1, name: 'Tech Startup Inc', businessType: 'Technology', employees: 25 },
    { id: 2, name: 'Main Street Restaurant', businessType: 'Food Service', employees: 12 }
  ]);
});

// Fallback for SPA routes
app.get('*', (req, res) => {
  // First try to find index.html in each static path
  for (const staticPath of staticPaths) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // If not found, return a basic 404 page
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Not Found - BrokerGPT</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #0087FF; }
      </style>
    </head>
    <body>
      <h1>Page Not Found</h1>
      <p>The requested page does not exist in emergency mode.</p>
      <p><a href="/" style="color: #0087FF">Return Home</a></p>
    </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 STANDALONE EMERGENCY SERVER RUNNING ON PORT ${PORT} 🚨`);
});