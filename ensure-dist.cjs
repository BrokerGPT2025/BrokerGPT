// Script to ensure dist directory and index.js exist (CommonJS version)
// This is used during the build process to guarantee proper deployment
// Using CommonJS syntax for maximum compatibility

'use strict';

const fs = require('fs');
const path = require('path');

// __dirname and __filename are already available in CommonJS
// No need for fileURLToPath
const rootDir = process.cwd();

// Paths
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.js');

console.log('Ensuring dist/index.js exists (CommonJS version)...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Content for index.js - using ESM format since that's what's expected
// IMPORTANT: This content must never import vite or build tools directly 
// because it will run in production where they may not be available
const indexContent = '// STANDALONE EMERGENCY SERVER\n' +
'// This server has NO external dependencies outside of Node.js built-ins and Express\n' +
'// It is designed to run even when the main build fails\n' +
'// ⚠️ IMPORTANT: THIS FILE MUST NOT IMPORT VITE OR ANY BUILD TOOLS ⚠️\n' +
'\n' +
'import express from \'express\';\n' +
'import path from \'path\';\n' +
'import fs from \'fs\';\n' +
'import { fileURLToPath } from \'url\';\n' +
'\n' +
'console.log(\'WARNING: dist/index.js was called directly.\');\n' +
'console.log(\'Starting minimal Express server...\');\n' +
'console.log(\'Node version: \' + process.version);\n' +
'console.log(\'Current directory: \' + process.cwd());\n' +
'\n' +
'// Get directory name in ESM context (only needed in ESM, not CommonJS)\n' +
'const __dirname = path.dirname(fileURLToPath(import.meta.url));\n' +
'\n' +
'// Initialize Express\n' +
'const app = express();\n' +
'app.use(express.json());\n' +
'\n' +
'// Try multiple static file paths to handle different build outputs\n' +
'const possibleStaticPaths = [\n' +
'  path.join(__dirname, \'..\', \'client\', \'dist\'),\n' +
'  path.join(__dirname, \'..\', \'dist\', \'public\'),\n' +
'  path.join(__dirname, \'public\'),\n' +
'  path.join(process.cwd(), \'client\', \'dist\'),\n' +
'  path.join(process.cwd(), \'dist\', \'public\')\n' +
'];\n' +
'\n' +
'// Set up static serving - check multiple possible paths\n' +
'let staticPathFound = false;\n' +
'for (const staticPath of possibleStaticPaths) {\n' +
'  if (fs.existsSync(staticPath)) {\n' +
'    console.log(\'Serving static files from \' + staticPath);\n' +
'    app.use(express.static(staticPath));\n' +
'    staticPathFound = true;\n' +
'  }\n' +
'}\n' +
'\n' +
'if (!staticPathFound) {\n' +
'  console.log(\'WARNING: No static file paths found. Creating emergency HTML...\');\n' +
'  \n' +
'  // Create client/dist if it doesn\'t exist\n' +
'  const clientDistPath = path.join(process.cwd(), \'client\', \'dist\');\n' +
'  if (!fs.existsSync(clientDistPath)) {\n' +
'    fs.mkdirSync(clientDistPath, { recursive: true });\n' +
'  }\n' +
'  \n' +
'  // Create emergency HTML file without template literals\n' +
'  const emergencyHtml = \'<!DOCTYPE html>\\n\' +\n' +
'\'<html>\\n\' +\n' +
'\'<head>\\n\' +\n' +
'\'  <title>BrokerGPT</title>\\n\' +\n' +
'\'  <meta charset="UTF-8">\\n\' +\n' +
'\'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\\n\' +\n' +
'\'  <style>\\n\' +\n' +
'\'    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }\\n\' +\n' +
'\'    h1 { color: #0087FF; }\\n\' +\n' +
'\'    .card { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }\\n\' +\n' +
'\'  </style>\\n\' +\n' +
'\'</head>\\n\' +\n' +
'\'<body>\\n\' +\n' +
'\'  <h1>BrokerGPT</h1>\\n\' +\n' +
'\'  <div class="card">\\n\' +\n' +
'\'    <h2>Emergency Mode</h2>\\n\' +\n' +
'\'    <p>The application is running in emergency mode.</p>\\n\' +\n' +
'\'    <p>Minimal API endpoints are available.</p>\\n\' +\n' +
'\'  </div>\\n\' +\n' +
'\'</body>\\n\' +\n' +
'\'</html>\';\n' +
'  \n' +
'  fs.writeFileSync(path.join(clientDistPath, \'index.html\'), emergencyHtml);\n' +
'  console.log(\'Created emergency index.html in client/dist\');\n' +
'  app.use(express.static(clientDistPath));\n' +
'}\n' +
'\n' +
'// Health check endpoint\n' +
'app.get(\'/api/health\', (req, res) => {\n' +
'  res.json({ \n' +
'    status: \'ok\', \n' +
'    timestamp: new Date().toISOString(),\n' +
'    staticPaths: possibleStaticPaths.filter(p => fs.existsSync(p))\n' +
'  });\n' +
'});\n' +
'\n' +
'// API endpoint for chat - minimal fallback\n' +
'app.get(\'/api/chat\', (req, res) => {\n' +
'  res.json({ messages: [] });\n' +
'});\n' +
'\n' +
'// API endpoint for carriers - minimal fallback\n' +
'app.get(\'/api/carriers\', (req, res) => {\n' +
'  res.json([\n' +
'    { id: 1, name: \'Acme Insurance\', specialties: [\'Property\', \'General Liability\'] },\n' +
'    { id: 2, name: \'Umbrella Corp\', specialties: [\'Worker Compensation\', \'Medical\'] }\n' +
'  ]);\n' +
'});\n' +
'\n' +
'// API endpoint for clients - minimal fallback\n' +
'app.get(\'/api/clients\', (req, res) => {\n' +
'  res.json([\n' +
'    { id: 1, name: \'Tech Startup Inc\', businessType: \'Technology\' },\n' +
'    { id: 2, name: \'Local Restaurant\', businessType: \'Food Service\' }\n' +
'  ]);\n' +
'});\n' +
'\n' +
'// SPA fallback - check multiple paths for index.html\n' +
'app.get(\'*\', (req, res) => {\n' +
'  // Check each possible path for index.html\n' +
'  for (const staticPath of possibleStaticPaths) {\n' +
'    const indexHtmlPath = path.join(staticPath, \'index.html\');\n' +
'    if (fs.existsSync(indexHtmlPath)) {\n' +
'      return res.sendFile(indexHtmlPath);\n' +
'    }\n' +
'  }\n' +
'  \n' +
'  // If no index.html found, serve minimal HTML\n' +
'  res.send(\n' +
'    \'<!DOCTYPE html>\\n\' +\n' +
'    \'<html>\\n\' +\n' +
'    \'<head>\\n\' +\n' +
'    \'  <title>BrokerGPT</title>\\n\' +\n' +
'    \'  <style>\\n\' +\n' +
'    \'    body { font-family: sans-serif; text-align: center; padding: 50px; }\\n\' +\n' +
'    \'    .logo { font-size: 2rem; font-weight: bold; color: #0087FF; }\\n\' +\n' +
'    \'  </style>\\n\' +\n' +
'    \'</head>\\n\' +\n' +
'    \'<body>\\n\' +\n' +
'    \'  <div class="logo">BrokerGPT</div>\\n\' +\n' +
'    \'  <p>Emergency server is running. Index file not found in any static directory.</p>\\n\' +\n' +
'    \'</body>\\n\' +\n' +
'    \'</html>\'\n' +
'  );\n' +
'});\n' +
'\n' +
'// Start the server\n' +
'const PORT = process.env.PORT || 10000;\n' +
'app.listen(PORT, \'0.0.0.0\', () => {\n' +
'  console.log(\'[EMERGENCY SERVER] Running at http://localhost:\' + PORT);\n' +
'  console.log(\'Environment variables:\');\n' +
'  console.log(\'- NODE_ENV: \' + (process.env.NODE_ENV || \'not set\'));\n' +
'  console.log(\'- PORT: \' + PORT);\n' +
'});';

// In CommonJS, __filename and __dirname are already available
// No need to redefine them with fileURLToPath

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
    console.log('Serving static files from ' + staticPath);
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
  
  // Create emergency HTML file without template literals
  const emergencyHtml = '<!DOCTYPE html>\n' +
'<html>\n' +
'<head>\n' +
'  <title>BrokerGPT</title>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <style>\n' +
'    body { font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }\n' +
'    h1 { color: #0087FF; }\n' +
'    .card { border: 1px solid #eee; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }\n' +
'    button { background: #0087FF; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }\n' +
'    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }\n' +
'    .success { color: #10b981; }\n' +
'    .error { color: #ef4444; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <h1>BrokerGPT</h1>\n' +
'  <div class="card">\n' +
'    <h2>Emergency Server Mode</h2>\n' +
'    <p>The application is running in emergency mode. This indicates there might have been an issue with the main application build.</p>\n' +
'    <p>The API endpoints are still functional.</p>\n' +
'  </div>\n' +
'  <div class="card">\n' +
'    <h2>API Status</h2>\n' +
'    <div id="api-status">Checking API connection...</div>\n' +
'    <button onclick="checkStatus()">Check Again</button>\n' +
'  </div>\n' +
'  <div class="card">\n' +
'    <h2>Static Paths</h2>\n' +
'    <div id="static-paths">Loading path information...</div>\n' +
'  </div>\n' +
'  <script>\n' +
'    // Check API status\n' +
'    function checkStatus() {\n' +
'      document.getElementById(\'api-status\').innerHTML = \'Connecting...\';\n' +
'      fetch(\'/api/health\')\n' +
'        .then(response => response.json())\n' +
'        .then(data => {\n' +
'          document.getElementById(\'api-status\').innerHTML = \n' +
'            \'<p class="success">✅ API is online and working properly</p>\' +\n' +
'            \'<p>Server time: \' + new Date(data.timestamp).toLocaleString() + \'</p>\';\n' +
'          \n' +
'          // Display static paths\n' +
'          if (data.staticPaths) {\n' +
'            const pathsList = document.getElementById(\'static-paths\');\n' +
'            let html = \'<ul>\';\n' +
'            data.staticPaths.forEach(function(path) {\n' +
'              html += \'<li>\' + path.path + (path.exists ? \' ✓\' : \' ✗\') + \'</li>\';\n' +
'            });\n' +
'            html += \'</ul>\';\n' +
'            pathsList.innerHTML = html;\n' +
'          }\n' +
'        })\n' +
'        .catch(err => {\n' +
'          document.getElementById(\'api-status\').innerHTML = \n' +
'            \'<p class="error">❌ API appears to be offline: \' + err.message + \'</p>\';\n' +
'        });\n' +
'    }\n' +
'    \n' +
'    // Initial API check\n' +
'    checkStatus();\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
  
  fs.writeFileSync(path.join(clientDistPath, 'index.html'), emergencyHtml);
  console.log('Created emergency index.html in client/dist');
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: 'emergency',
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
  res.send(
    '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    '  <title>BrokerGPT</title>\n' +
    '  <style>\n' +
    '    body { font-family: sans-serif; text-align: center; padding: 50px; }\n' +
    '    .logo { font-size: 2rem; font-weight: bold; color: #0087FF; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div class="logo">BrokerGPT</div>\n' +
    '  <p>Emergency server is running. Index file not found in any static directory.</p>\n' +
    '</body>\n' +
    '</html>'
  );
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('[EMERGENCY SERVER] Running at http://localhost:' + PORT);
  console.log('Environment variables:');
  console.log('- NODE_ENV: ' + (process.env.NODE_ENV || 'not set'));
  console.log('- PORT: ' + PORT);
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
    console.log('Updated dist/index.js to fix static file serving...');
    console.log('Updated dist/index.js');
  } catch (error) {
    console.error('Error updating dist/index.js:', error);
  }
}

console.log('Dist directory setup complete!');