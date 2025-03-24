// Minimal build script for production on Render.com
// This bypasses the need for Vite and creates a basic client build
// Using CommonJS for maximum compatibility

const fs = require('fs');
const path = require('path');

// Use process.cwd() for maximum compatibility
const rootDir = process.cwd();

console.log('Starting minimal build process...');

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
      height: 100vh;
      text-align: center;
      padding: 0 20px;
    }
    h1 {
      color: #0087FF;
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      color: #4b5563;
      max-width: 600px;
      line-height: 1.6;
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
    }
    .status {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #e0f2fe;
      border-radius: 0.5rem;
      color: #0369a1;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="logo">BG</div>
    <h1>BrokerGPT</h1>
    <p>AI-powered insurance recommendation platform that intelligently matches clients with optimal insurance carriers through advanced risk profiling and personalized matching technologies.</p>
    <div class="status">
      Server is running. API endpoints are available at <code>/api/*</code>
    </div>
  </div>
  <script>
    // Basic API status check
    fetch('/api/health')
      .then(response => {
        const statusEl = document.querySelector('.status');
        if (response.ok) {
          statusEl.innerHTML = 'API is up and running! <br>✅ Server is healthy';
          statusEl.style.backgroundColor = '#dcfce7';
          statusEl.style.color = '#166534';
        } else {
          statusEl.innerHTML = 'API returned an error. <br>❌ Check server logs';
          statusEl.style.backgroundColor = '#fee2e2';
          statusEl.style.color = '#b91c1c';
        }
      })
      .catch(error => {
        const statusEl = document.querySelector('.status');
        statusEl.innerHTML = 'Could not connect to API. <br>❌ Server may be starting up';
        statusEl.style.backgroundColor = '#fee2e2';
        statusEl.style.color = '#b91c1c';
      });
  </script>
</body>
</html>`;
  
  fs.writeFileSync(indexHtmlPath, indexHtml);
  console.log('Created minimal index.html');
}

// Create a minimal server bundle in dist/index.js
const serverBundlePath = path.join(distDir, 'index.js');
if (!fs.existsSync(serverBundlePath)) {
  console.log('Creating minimal server bundle...');
  const serverBundle = `// Minimal server bundle created by minimal-build.js
// This serves a minimal Express application without external dependencies

// Use CommonJS for maximum compatibility
const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Starting minimal emergency server...');
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
  
  fs.writeFileSync(serverBundlePath, serverBundle);
  console.log('Created minimal server bundle');
}

console.log('Minimal build completed successfully!');