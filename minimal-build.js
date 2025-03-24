// Minimal build script for production on Render.com
// This bypasses the need for Vite and creates a basic client build

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting minimal build process...');

// Create required directories
const distDir = path.join(__dirname, 'dist');
const clientDistDir = path.join(__dirname, 'client', 'dist');

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
    fetch('/api/chat')
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
// This redirects to prod.js for the actual server logic

import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';

console.log('Starting minimal server bundle...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prodScriptPath = path.join(__dirname, '..', 'prod.js');

console.log(\`Redirecting to production script at \${prodScriptPath}\`);

try {
  // Try to run with tsx
  console.log('Attempting to start with tsx...');
  process.env.NODE_ENV = 'production';
  const child = spawn('node', ['--import', 'tsx', prodScriptPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('exit', (code) => process.exit(code));
  child.on('error', () => {
    console.log('Failed to start with tsx, attempting direct execution...');
    const child2 = spawn('node', [prodScriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    child2.on('exit', (code) => process.exit(code));
    child2.on('error', (err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
  });
} catch (error) {
  console.error('Caught error while trying to start server:', error);
  process.exit(1);
}`;
  
  fs.writeFileSync(serverBundlePath, serverBundle);
  console.log('Created minimal server bundle');
}

console.log('Minimal build completed successfully!');