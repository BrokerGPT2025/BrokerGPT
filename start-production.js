// Failsafe production startup script
// This script tries to start the normal server, but falls back to the emergency server if it fails

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 PRODUCTION STARTUP SCRIPT 🚀');
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);

// Check if dist/index.js exists
const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
const distExists = fs.existsSync(distIndexPath);

console.log(`Checking for dist/index.js: ${distExists ? 'Found' : 'Not found'}`);

// Emergency server path
const emergencyServerPath = path.join(process.cwd(), 'emergency-server.js');
const emergencyExists = fs.existsSync(emergencyServerPath);

console.log(`Checking for emergency-server.js: ${emergencyExists ? 'Found' : 'Not found'}`);

// First attempt: Try to start the regular server if it exists
if (distExists) {
  console.log('Attempting to start the regular server from dist/index.js...');
  
  // Set a timeout to prevent hanging indefinitely
  const timeout = setTimeout(() => {
    console.log('⚠️ Regular server startup timed out. Switching to emergency server...');
    startEmergencyServer();
  }, 10000); // 10 second timeout
  
  try {
    const mainServer = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    mainServer.on('error', (err) => {
      console.error(`Regular server error: ${err.message}`);
      clearTimeout(timeout);
      startEmergencyServer();
    });
    
    mainServer.on('exit', (code, signal) => {
      clearTimeout(timeout);
      
      if (code !== 0) {
        console.error(`Regular server exited with code ${code} and signal ${signal}`);
        startEmergencyServer();
      }
    });
  } catch (err) {
    console.error(`Failed to spawn regular server: ${err.message}`);
    clearTimeout(timeout);
    startEmergencyServer();
  }
} else {
  console.log('Regular server not found. Starting emergency server...');
  startEmergencyServer();
}

// Function to start the emergency server
function startEmergencyServer() {
  console.log('Starting emergency server...');
  
  if (emergencyExists) {
    console.log('Using standalone emergency server from emergency-server.js');
    
    try {
      const emergencyServer = spawn('node', ['emergency-server.js'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      emergencyServer.on('error', (err) => {
        console.error(`Emergency server error: ${err.message}`);
        createAndStartInlineServer();
      });
      
      emergencyServer.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Emergency server exited with code ${code}`);
          createAndStartInlineServer();
        }
      });
    } catch (err) {
      console.error(`Failed to spawn emergency server: ${err.message}`);
      createAndStartInlineServer();
    }
  } else {
    console.log('Emergency server file not found. Creating inline server...');
    createAndStartInlineServer();
  }
}

// Last resort: Create an inline server and start it
function createAndStartInlineServer() {
  console.log('Creating inline emergency server as last resort...');
  
  const inlineServerPath = path.join(process.cwd(), 'inline-emergency-server.js');
  
  // Create a minimal server with only Express dependencies
  const serverCode = `
    // INLINE EMERGENCY SERVER - LAST RESORT
    // Created by start-production.js when all other servers fail
    
    import express from 'express';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import fs from 'fs';
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    console.log('🆘 INLINE EMERGENCY SERVER STARTING 🆘');
    
    const app = express();
    
    // Try to find and serve static files
    const staticPaths = [
      path.join(__dirname, 'client/dist'),
      path.join(__dirname, 'dist/public')
    ];
    
    for (const p of staticPaths) {
      if (fs.existsSync(p)) {
        console.log('Serving static files from: ' + p);
        app.use(express.static(p));
      }
    }
    
    // Create emergency HTML if needed
    const clientDist = path.join(__dirname, 'client/dist');
    if (!fs.existsSync(clientDist)) {
      fs.mkdirSync(clientDist, { recursive: true });
      
      // Create minimal HTML
      fs.writeFileSync(path.join(clientDist, 'index.html'), \`
        <!DOCTYPE html>
        <html>
        <head>
          <title>BrokerGPT - Inline Emergency Mode</title>
          <style>
            body { font-family: sans-serif; margin: 0 auto; max-width: 800px; padding: 20px; }
            h1 { color: #0087FF; }
          </style>
        </head>
        <body>
          <h1>BrokerGPT - Inline Emergency Server</h1>
          <p>This is the last-resort inline emergency server.</p>
          <p>All other server options have failed.</p>
          <div id="status">Checking API status...</div>
          <script>
            fetch('/api/health')
              .then(r => r.json())
              .then(data => {
                document.getElementById('status').innerHTML = 
                  '<p style="color:green">API is working: ' + 
                  JSON.stringify(data) + '</p>';
              })
              .catch(err => {
                document.getElementById('status').innerHTML = 
                  '<p style="color:red">API error: ' + err.message + '</p>';
              });
          </script>
        </body>
        </html>
      \`);
      
      app.use(express.static(clientDist));
    }
    
    // Basic API endpoints
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        mode: 'inline-emergency',
        time: new Date().toISOString() 
      });
    });
    
    app.get('/api/carriers', (req, res) => {
      res.json([{ id: 1, name: 'Example Carrier' }]);
    });
    
    app.get('/api/clients', (req, res) => {
      res.json([{ id: 1, name: 'Example Client' }]);
    });
    
    // SPA fallback
    app.get('*', (req, res) => {
      for (const p of staticPaths) {
        const indexPath = path.join(p, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      res.send('Page not found in emergency mode');
    });
    
    // Start server
    const PORT = process.env.PORT || 10000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(\`Inline emergency server running on port \${PORT}\`);
    });
  `;
  
  fs.writeFileSync(inlineServerPath, serverCode);
  console.log('Inline emergency server created');
  
  try {
    const inlineServer = spawn('node', ['inline-emergency-server.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    inlineServer.on('error', (err) => {
      console.error(`Inline server error: ${err.message}`);
      console.error('All server options have failed. Unable to start the application.');
      process.exit(1);
    });
  } catch (err) {
    console.error(`Failed to spawn inline server: ${err.message}`);
    console.error('All server options have failed. Unable to start the application.');
    process.exit(1);
  }
}