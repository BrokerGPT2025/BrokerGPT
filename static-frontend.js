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

// Create assets directory for static files
const assetsDir = path.join(clientDistDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log(`Created directory: ${assetsDir}`);
}

// Function to copy a logo file if it exists
function copyLogoFile() {
  const possibleLogoPaths = [
    path.join(process.cwd(), 'client', 'public', 'brokergpt-logo.svg'),
    path.join(process.cwd(), 'public', 'brokergpt-logo.svg'),
    path.join(process.cwd(), 'client', 'src', 'assets', 'brokergpt-logo.svg')
  ];
  
  for (const logoPath of possibleLogoPaths) {
    if (fs.existsSync(logoPath)) {
      const destLogoPath = path.join(assetsDir, 'brokergpt-logo.svg');
      fs.copyFileSync(logoPath, destLogoPath);
      console.log(`Copied logo from ${logoPath} to ${destLogoPath}`);
      return '/assets/brokergpt-logo.svg';
    }
  }
  
  // If no logo found, return emoji fallback
  return null;
}

// Try to copy logo, or use emoji
const logoPath = copyLogoFile();
const logoHtml = logoPath 
  ? `<img src="${logoPath}" alt="BrokerGPT Logo" style="height: 40px; margin-right: 10px;">` 
  : `<div class="logo">🤝</div>`;

// Create a basic but functional index.html file without any build tools
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrokerGPT</title>
  <link rel="stylesheet" href="/assets/app.css">
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
      margin-bottom: 1.5rem;
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
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
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
      transition: opacity 0.2s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .status {
      margin-top: 1rem;
      padding: 0.75rem;
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
    .debug-panel {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #f8fafc;
      border-radius: var(--radius);
      border: 1px solid #e2e8f0;
    }
    .debug-panel h3 {
      margin-bottom: 0.5rem;
      font-size: 1rem;
      color: #334155;
    }
    .debug-panel pre {
      background: #f1f5f9;
      padding: 0.75rem;
      border-radius: 0.25rem;
      overflow-x: auto;
      font-family: monospace;
      font-size: 0.875rem;
    }
    .carriers {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .carrier-card {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem;
    }
    .carrier-card h3 {
      color: var(--primary);
      margin-bottom: 0.5rem;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background-color: #e2e8f0;
      color: #334155;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-right: 0.25rem;
      margin-bottom: 0.25rem;
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
      ${logoHtml}
      <h1>BrokerGPT</h1>
    </header>
    
    <main>
      <div class="card">
        <h2>Welcome to BrokerGPT</h2>
        <p>BrokerGPT helps insurance agents find the best carriers for their clients.</p>
        <p>This is a static emergency version of the application deployed on ${new Date().toLocaleDateString()}.</p>
      </div>
      
      <div class="grid">
        <div class="card">
          <h2>API Status</h2>
          <div id="apiStatus" class="status loading">Checking API connection...</div>
          <button class="button" onclick="checkApiStatus()">Check API Status</button>
        </div>
        
        <div class="card">
          <h2>Available Carriers</h2>
          <div id="carriers">Loading carriers...</div>
          <button class="button" onclick="loadCarriers()">Load Carriers</button>
        </div>
      </div>
      
      <div class="card">
        <h2>Server Information</h2>
        <div id="environment">Loading server information...</div>
        <button class="button" onclick="loadEnvironment()">Check Server</button>
      </div>
      
      <div class="debug-panel">
        <h3>Diagnostics</h3>
        <div id="diagnostics">
          <p>Use the buttons above to check application connectivity.</p>
        </div>
        <button class="button" onclick="runDiagnostics()" style="margin-top: 10px;">Run Full Diagnostics</button>
      </div>
    </main>
  </div>

  <script src="/assets/app.js"></script>
  <script>
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      checkApiStatus();
      setTimeout(loadEnvironment, 500);
      setTimeout(loadCarriers, 1000);
    });

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
            <p>Mode: \${data.mode || 'unknown'}</p>
          \`;
          
          if (data) {
            addDiagnosticInfo('API Health Check', 'success', data);
          }
        })
        .catch(error => {
          statusElement.className = 'status error';
          statusElement.innerHTML = \`
            <p>❌ API appears to be offline</p>
            <p>Error: \${error.message}</p>
            <p>Please check server logs or try again later.</p>
          \`;
          
          addDiagnosticInfo('API Health Check', 'error', { error: error.message });
        });
    }
    
    function loadCarriers() {
      const carriersElement = document.getElementById('carriers');
      carriersElement.innerHTML = '<p>Loading carriers data...</p>';
      
      fetch('/api/carriers')
        .then(response => response.json())
        .then(carriers => {
          if (carriers && carriers.length > 0) {
            carriersElement.innerHTML = '<div class="carriers">' + 
              carriers.map(carrier => \`
                <div class="carrier-card">
                  <h3>\${carrier.name}</h3>
                  <div>
                    \${carrier.specialties ? carrier.specialties.map(s => \`<span class="badge">\${s}</span>\`).join('') : ''}
                  </div>
                </div>
              \`).join('') + 
            '</div>';
            
            addDiagnosticInfo('Carriers Data', 'success', carriers);
          } else {
            carriersElement.innerHTML = '<p>No carriers found or empty response.</p>';
            addDiagnosticInfo('Carriers Data', 'warning', carriers || { message: 'Empty response' });
          }
        })
        .catch(error => {
          carriersElement.innerHTML = \`<p>Error loading carriers: \${error.message}</p>\`;
          addDiagnosticInfo('Carriers Data', 'error', { error: error.message });
        });
    }
    
    function loadEnvironment() {
      const envElement = document.getElementById('environment');
      envElement.innerHTML = '<p>Loading environment data...</p>';
      
      fetch('/api/environment')
        .then(response => response.json())
        .then(data => {
          envElement.innerHTML = \`
            <p><strong>Node Environment:</strong> \${data.nodeEnv}</p>
            <p><strong>Node Version:</strong> \${data.nodeVersion}</p>
            <p><strong>Running on:</strong> \${data.platform} (\${data.arch})</p>
            <p><strong>Port:</strong> \${data.port}</p>
            <p><strong>Uptime:</strong> \${formatUptime(data.uptime)}</p>
            <p><strong>Server Type:</strong> \${data.serverType || 'unknown'}</p>
          \`;
          
          addDiagnosticInfo('Server Environment', 'success', data);
        })
        .catch(error => {
          envElement.innerHTML = \`<p>Error loading environment: \${error.message}</p>\`;
          addDiagnosticInfo('Server Environment', 'error', { error: error.message });
        });
    }
    
    function formatUptime(seconds) {
      if (typeof seconds !== 'number') return 'unknown';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      return \`\${hours}h \${minutes}m \${secs}s\`;
    }
    
    function addDiagnosticInfo(title, status, data) {
      const diagnosticsElement = document.getElementById('diagnostics');
      const timestamp = new Date().toLocaleTimeString();
      
      // Create diagnostic entry
      const entry = document.createElement('div');
      entry.style.marginBottom = '10px';
      entry.innerHTML = \`
        <p>
          <strong>\${title}:</strong> 
          <span style="color: \${status === 'success' ? 'green' : status === 'warning' ? 'orange' : 'red'}">
            \${status}
          </span> 
          <small>[\${timestamp}]</small>
        </p>
        <pre>\${JSON.stringify(data, null, 2)}</pre>
      \`;
      
      // Add to diagnostics panel (at the top)
      if (diagnosticsElement.children.length > 0) {
        diagnosticsElement.insertBefore(entry, diagnosticsElement.firstChild);
      } else {
        diagnosticsElement.appendChild(entry);
      }
      
      // Limit the number of entries to 5
      while (diagnosticsElement.children.length > 5) {
        diagnosticsElement.removeChild(diagnosticsElement.lastChild);
      }
    }
    
    function runDiagnostics() {
      document.getElementById('diagnostics').innerHTML = '<p>Running full diagnostics...</p>';
      
      // Check current URL
      addDiagnosticInfo('Location', 'info', { 
        url: window.location.href,
        pathname: window.location.pathname,
        host: window.location.host
      });
      
      // Check API endpoints sequentially
      setTimeout(checkApiStatus, 100);
      setTimeout(loadEnvironment, 500);
      setTimeout(loadCarriers, 1000);
      
      // Additional check for static assets
      fetch('/assets/app.css')
        .then(response => {
          addDiagnosticInfo('Static Assets', response.ok ? 'success' : 'warning', {
            status: response.status,
            statusText: response.statusText,
            path: '/assets/app.css'
          });
        })
        .catch(error => {
          addDiagnosticInfo('Static Assets', 'error', { 
            error: error.message,
            path: '/assets/app.css'
          });
        });
    }
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
}

.diagnostic-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 5px;
}

.diagnostic-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.indicator-success {
  background-color: #22c55e;
}

.indicator-warning {
  background-color: #f59e0b;
}

.indicator-error {
  background-color: #ef4444;
}

.indicator-info {
  background-color: #3b82f6;
}`;

// Write the CSS file
fs.writeFileSync(path.join(assetsDir, 'app.css'), appCss);
console.log(`Created file: ${path.join(assetsDir, 'app.css')}`);

// Create simple JavaScript file
const appJs = `// Static app script - no build tools required
console.log('BrokerGPT static app loaded');

// Simplified API client
const api = {
  async getHealth() {
    const response = await fetch('/api/health');
    return response.json();
  },
  
  async getEnvironment() {
    const response = await fetch('/api/environment');
    return response.json();
  },
  
  async getCarriers() {
    const response = await fetch('/api/carriers');
    return response.json();
  },
  
  async getClients() {
    const response = await fetch('/api/clients');
    return response.json();
  },
  
  // Add diagnostics method
  async runDiagnostics() {
    // Collect results from multiple endpoints
    try {
      const health = await this.getHealth().catch(err => ({ error: err.message }));
      const env = await this.getEnvironment().catch(err => ({ error: err.message }));
      const paths = await fetch('/api/staticPaths').then(r => r.json()).catch(() => null);
      
      return {
        health,
        environment: env,
        staticPaths: paths,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }
};

// Add to window for debugging
window.brokerApi = api;`;

// Write the JavaScript file
fs.writeFileSync(path.join(assetsDir, 'app.js'), appJs);
console.log(`Created file: ${path.join(assetsDir, 'app.js')}`);

// Create a simple manifest file
const manifestJson = `{
  "name": "BrokerGPT",
  "short_name": "BrokerGPT",
  "description": "Insurance broker assistant application",
  "start_url": "/",
  "icons": [],
  "theme_color": "#0087FF",
  "background_color": "#f3f4f6",
  "display": "standalone"
}`;

// Write the manifest file
fs.writeFileSync(path.join(clientDistDir, 'manifest.json'), manifestJson);
console.log(`Created file: ${path.join(clientDistDir, 'manifest.json')}`);

console.log('✅ Static frontend generated successfully!');
console.log(`Files are available in: ${clientDistDir}`);