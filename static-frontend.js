// Static frontend generator that doesn't rely on Vite or Rollup
// Creates a minimal but functional frontend for production deployment
// This file is completely standalone and has no external dependencies 

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory paths in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 STATIC FRONTEND GENERATOR 🔧');
console.log(`Working directory: ${process.cwd()}`);

// Create client/dist directory if it doesn't exist
const clientDistDir = path.join(process.cwd(), 'client', 'dist');
if (!fs.existsSync(clientDistDir)) {
  fs.mkdirSync(clientDistDir, { recursive: true });
  console.log(`Created directory: ${clientDistDir}`);
}

// Create a basic but functional index.html file without any build tools
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrokerGPT</title>
  <style>
    :root {
      --primary: #0087FF;
      --background: #f3f4f6;
      --foreground: #1f2937;
      --card: #ffffff;
      --card-foreground: #1f2937;
      --border: #e5e7eb;
      --input: #ffffff;
      --ring: #0087FF;
      --radius: 0.5rem;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: var(--foreground);
      background-color: var(--background);
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      display: flex;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .header h1 {
      color: var(--primary);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .logo {
      margin-right: 10px;
      font-weight: bold;
      color: var(--primary);
      font-size: 1.5rem;
    }
    .card {
      background-color: var(--card);
      border-radius: var(--radius);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      margin: 1.5rem 0;
    }
    .card h2 {
      margin-bottom: 0.75rem;
      font-size: 1.25rem;
    }
    .button {
      background-color: var(--primary);
      color: white;
      border: none;
      border-radius: var(--radius);
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      cursor: pointer;
      font-weight: 500;
    }
    .button:hover {
      opacity: 0.9;
    }
    .status {
      margin-top: 1rem;
      padding: 0.5rem;
      border-radius: var(--radius);
    }
    .success {
      background-color: #dcfce7;
      color: #166534;
    }
    .error {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .loading {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">🤝</div>
      <h1>BrokerGPT</h1>
    </header>
    
    <main>
      <div class="card">
        <h2>Welcome to BrokerGPT</h2>
        <p>BrokerGPT helps insurance agents find the best carriers for their clients.</p>
        <p>This is a static fallback version of the application.</p>
      </div>
      
      <div class="card">
        <h2>API Status</h2>
        <div id="apiStatus" class="status loading">Checking API connection...</div>
        <button class="button" onclick="checkApiStatus()">Check API Status</button>
      </div>
      
      <div class="card">
        <h2>Static Build Info</h2>
        <p>This is a statically generated frontend created without Vite or other build tools.</p>
        <p>The application is running in a simplified mode with limited functionality.</p>
        <p>Build time: ${new Date().toISOString()}</p>
      </div>
    </main>
  </div>

  <script>
    function checkApiStatus() {
      const statusElement = document.getElementById('apiStatus');
      statusElement.className = 'status loading';
      statusElement.textContent = 'Connecting to API...';
      
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          statusElement.className = 'status success';
          statusElement.innerHTML = \`
            <p>✅ API is online and working properly</p>
            <p>Server time: \${new Date(data.timestamp).toLocaleString()}</p>
            <p>Environment: \${data.environment || 'unknown'}</p>
          \`;
        })
        .catch(error => {
          statusElement.className = 'status error';
          statusElement.innerHTML = \`
            <p>❌ API appears to be offline</p>
            <p>Error: \${error.message}</p>
            <p>Please check server logs or try again later.</p>
          \`;
        });
    }
    
    // Check API status on load
    document.addEventListener('DOMContentLoaded', checkApiStatus);
  </script>
</body>
</html>`;

// Write the index.html file
fs.writeFileSync(path.join(clientDistDir, 'index.html'), indexHtml);
console.log(`Created file: ${path.join(clientDistDir, 'index.html')}`);

// Create an app.css file with minimal styles
const appCss = `/* Static app styles */
:root {
  --primary: #0087FF;
  --background: #f3f4f6;
  --foreground: #1f2937;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
  background: var(--background);
  color: var(--foreground);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

h1, h2, h3 {
  color: var(--primary);
}`;

// Write the CSS file
fs.writeFileSync(path.join(clientDistDir, 'app.css'), appCss);
console.log(`Created file: ${path.join(clientDistDir, 'app.css')}`);

// Create assets directory
const assetsDir = path.join(clientDistDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created directory: ${assetsDir}`);
}

// Create simple JavaScript file
const appJs = `// Static app script - no build tools required
console.log('BrokerGPT static app loaded');

// Simplified API client
const api = {
  async getHealth() {
    const response = await fetch('/api/health');
    return response.json();
  },
  
  async getCarriers() {
    const response = await fetch('/api/carriers');
    return response.json();
  },
  
  async getClients() {
    const response = await fetch('/api/clients');
    return response.json();
  }
};

// Add to window for debugging
window.brokerApi = api;`;

// Write the JavaScript file
fs.writeFileSync(path.join(assetsDir, 'app.js'), appJs);
console.log(`Created file: ${path.join(assetsDir, 'app.js')}`);

console.log('✅ Static frontend generated successfully!');
console.log(`Files are available in: ${clientDistDir}`);