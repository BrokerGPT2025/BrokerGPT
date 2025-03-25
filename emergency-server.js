// STANDALONE EMERGENCY SERVER FOR PRODUCTION
// This file has NO external dependencies other than Express
// It is designed to run in production without build tools

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'net';
import dns from 'dns';

// Force IPv4 for all DNS lookups and connections
dns.setDefaultResultOrder('ipv4first');

// Monkey patch Socket.connect to force IPv4
const net = await import('net');
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(options, ...args) {
  if (typeof options === 'object' && options.host) {
    console.log(`Socket connecting to ${options.host}:${options.port || ''}, forcing IPv4...`);
    options.family = 4; // Force IPv4
  }
  return originalConnect.call(this, options, ...args);
};

// Get dirname in ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 STANDALONE EMERGENCY SERVER STARTING 🚨');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// Track server start time for diagnostics
const SERVER_START_TIME = new Date().toISOString();
console.log(`Start time: ${SERVER_START_TIME}`);

// Function to check if a port is in use and gather connection info
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.once('error', (err) => {
      // Port is in use, check for pid later
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use - checking owner process...`);
        // Find process listening on this port
        try {
          // Try to get our PID
          const ourPid = process.pid;
          console.log(`Our process ID: ${ourPid}`);
          
          // Could use 'lsof -i :PORT' on Unix or 'netstat' on Windows,
          // but for simplicity we'll just check timestamps as a heuristic
          
          // If this is a very recent process (< 10s old), it's likely ours
          const uptime = process.uptime();
          if (uptime < 10) {
            console.log(`We appear to be a new process (${uptime}s uptime), port might be used by parent process`);
          }
          
          resolve({
            inUse: true,
            likelyOurs: uptime < 10,
            pid: ourPid
          });
        } catch (err) {
          console.error('Error detecting port owner:', err);
          resolve({ inUse: true, likelyOurs: false });
        }
      } else {
        // Some other error
        console.error(`Port check error: ${err.code}`);
        resolve({ inUse: true, likelyOurs: false });
      }
    })
    .once('listening', () => {
      // Port is free, close the server
      server.close();
      resolve({ inUse: false });
    })
    .listen(port, '0.0.0.0');
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  let portCheck = await isPortInUse(port);
  
  while (portCheck.inUse) {
    // If port is in use by what seems to be our parent/relative process, we can use a specific offset
    if (portCheck.likelyOurs) {
      // Use a predictable offset for our own process to avoid endless searching
      const newPort = port + 1000;
      console.log(`Port ${port} appears to be used by a related process (PID: ${portCheck.pid})`);
      console.log(`Using predictable offset of 1000 to avoid conflict, trying ${newPort}...`);
      port = newPort;
    } else {
      // Otherwise just increment to the next port
      console.log(`Port ${port} is in use by an unrelated process, trying ${port + 1}...`);
      port++;
    }
    
    // Check the new port
    portCheck = await isPortInUse(port);
  }
  
  return port;
}

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
    
    // Configure static file serving with proper options
    app.use(express.static(staticPath, {
      index: 'index.html',   // Explicitly set index file
      etag: true,            // Enable ETags for caching
      lastModified: true,    // Send Last-Modified headers
      maxAge: '1h',          // Cache for 1 hour
      fallthrough: true      // Continue to next middleware if file not found
    }));
    
    staticPathFound = true;
    
    // Log directory contents for debugging
    try {
      console.log(`Files in ${staticPath}:`);
      const files = fs.readdirSync(staticPath);
      files.forEach(file => console.log(`  - ${file}`));
      
      // Check for index.html
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`Found index.html at ${indexPath}`);
        
        // Read first few lines to verify content
        try {
          const indexContent = fs.readFileSync(indexPath, 'utf8').slice(0, 200);
          console.log(`Index.html content preview: ${indexContent.replace(/\n/g, ' ').trim()}`);
        } catch (readErr) {
          console.error(`Error reading index.html: ${readErr.message}`);
        }
      } else {
        console.log(`WARNING: No index.html found in ${staticPath}`);
      }
    } catch (err) {
      console.error(`Error listing directory: ${err.message}`);
    }
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
    .badge { display: inline-block; background: #0087FF; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; }
  </style>
</head>
<body>
  <h1>BrokerGPT - Standalone Emergency Server</h1>
  
  <div class="card">
    <h2>Server Status</h2>
    <p>The application is running through a standalone emergency server. The normal build process encountered issues.</p>
    <p>Current Port: <span id="current-port">Checking...</span></p>
    <p>Server Start Time: <span id="start-time">Checking...</span></p>
    <p>Uptime: <span id="uptime">Checking...</span></p>
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
          
          // Update port display
          document.getElementById('current-port').innerHTML = 
            data.port + '<span class="badge">Active</span>';
          
          // Update start time
          if (data.serverStartTime) {
            document.getElementById('start-time').textContent = 
              new Date(data.serverStartTime).toLocaleString();
          }
          
          // Update uptime
          if (data.uptime) {
            const uptime = data.uptime;
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            document.getElementById('uptime').textContent = 
              \`\${hours}h \${minutes}m \${seconds}s\`;
          }
          
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
    
    // Auto-refresh stats
    function refreshStats() {
      checkApi();
      getEnvironment();
      setTimeout(refreshStats, 30000); // Refresh every 30 seconds
    }
    
    // Run checks on page load and start auto-refresh
    refreshStats();
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
    port: process.env.PORT || 'unknown',
    staticPaths: staticPaths.map(p => ({
      path: p,
      exists: fs.existsSync(p)
    })),
    serverStartTime: SERVER_START_TIME,
    uptime: process.uptime()
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
    port: process.env.PORT || 'unknown',
    requestedPort: req.query.requestedPort || 'unknown',
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    serverType: 'emergency-server',
    startTime: SERVER_START_TIME
  });
});

// Add an endpoint to check static paths in detail
app.get('/api/staticPaths', (req, res) => {
  const results = [];
  
  // Check each possible static path
  for (const staticPath of staticPaths) {
    const result = {
      path: staticPath,
      exists: fs.existsSync(staticPath),
      files: []
    };
    
    if (result.exists) {
      try {
        // List files in the directory
        const files = fs.readdirSync(staticPath);
        
        // Check for index.html specifically
        const hasIndex = files.includes('index.html');
        const indexPath = path.join(staticPath, 'index.html');
        let indexContent = null;
        
        if (hasIndex) {
          try {
            // Get a preview of index.html content (first 200 chars)
            indexContent = fs.readFileSync(indexPath, 'utf8').slice(0, 200);
          } catch (err) {
            indexContent = `Error reading index.html: ${err.message}`;
          }
        }
        
        // Add directory info
        result.fileCount = files.length;
        result.hasIndexHtml = hasIndex;
        result.indexContent = indexContent;
        
        // Add individual files (up to 20)
        files.slice(0, 20).forEach(file => {
          const filePath = path.join(staticPath, file);
          try {
            const stats = fs.statSync(filePath);
            result.files.push({
              name: file,
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime
            });
          } catch (err) {
            result.files.push({
              name: file,
              error: err.message
            });
          }
        });
        
        if (files.length > 20) {
          result.note = `Showing 20 of ${files.length} files`;
        }
      } catch (err) {
        result.error = err.message;
      }
    }
    
    results.push(result);
  }
  
  res.json(results);
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

// Fallback for SPA routes (React router)
app.get('*', (req, res) => {
  console.log(`Handling SPA route: ${req.path}`);
  
  // Special case for API endpoints to prevent them from going through SPA routing
  if (req.path.startsWith('/api/')) {
    console.log(`API request to ${req.path} - not treating as SPA route`);
    return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
  }
  
  // Log the static paths we're checking
  console.log(`Looking for index.html in ${staticPaths.length} static paths`);
  
  // First try to find index.html in each static path
  for (const staticPath of staticPaths) {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`✓ Found index.html at ${indexPath}, serving for SPA route: ${req.path}`);
      return res.sendFile(indexPath, { 
        headers: {
          'Content-Type': 'text/html',
          'X-SPA-Fallback': 'true' 
        }
      });
    } else {
      console.log(`✗ No index.html found at ${indexPath}`);
    }
  }
  
  // Create a special check for the root route
  if (req.path === '/') {
    console.log('Request for root path, but no index.html found in any static directory');
  }
  
  // If not found, return a basic 404 page
  console.log(`No index.html found in any static path for ${req.path}, returning 404`);
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
      <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 5px; text-align: left;">
        <h3>Debug Information:</h3>
        <p>Requested Path: ${req.path}</p>
        <p>User Agent: ${req.headers['user-agent'] || 'Not provided'}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Checked Paths:</p>
        <ul>
          ${staticPaths.map(p => `<li>${p}/index.html - ${fs.existsSync(path.join(p, 'index.html')) ? 'Exists' : 'Not Found'}</li>`).join('')}
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Start the server with port conflict handling
(async () => {
  try {
    const requestedPort = parseInt(process.env.PORT || '10000');
    const availablePort = await findAvailablePort(requestedPort);
    
    if (requestedPort !== availablePort) {
      console.log(`⚠️ Requested port ${requestedPort} is in use, using port ${availablePort} instead`);
      process.env.PORT = availablePort.toString();
    } else {
      console.log(`✅ Port ${availablePort} is available`);
    }
    
    // Start server on the available port
    const server = app.listen(availablePort, '0.0.0.0', () => {
      console.log(`🚨 STANDALONE EMERGENCY SERVER RUNNING ON PORT ${availablePort} 🚨`);
      
      // Send success signal for start-production.js to detect
      console.log('SERVER_STARTED_SUCCESSFULLY');
    });
    
    // Handle errors to prevent crashes
    server.on('error', (err) => {
      console.error('Emergency server error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${availablePort} conflict detected after server start - this is unexpected`);
        process.exit(1); // Exit with error code so the process can be restarted
      }
    });
    
    // Set up graceful shutdown
    const shutdownGracefully = () => {
      console.log('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        console.log('Server closed successfully');
        process.exit(0);
      });
      
      // Force close after timeout if graceful shutdown fails
      setTimeout(() => {
        console.error('Forcing server shutdown after timeout');
        process.exit(1);
      }, 5000);
    };
    
    // Handle signals
    process.on('SIGTERM', shutdownGracefully);
    process.on('SIGINT', shutdownGracefully);
  } catch (err) {
    console.error('Fatal error starting emergency server:', err);
    process.exit(1);
  }
})();