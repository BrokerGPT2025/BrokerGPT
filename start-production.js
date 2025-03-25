// Universal production startup script with module format compatibility
// This script tries multiple server startup methods and handles format mismatches

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createServer } from 'net';

// Try to load dotenv if available
try {
  // Dynamic import to avoid issues if dotenv isn't installed
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('Environment variables loaded from .env file');
} catch (err) {
  console.log('No dotenv found or .env file missing - using system environment variables');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 UNIVERSAL PRODUCTION STARTUP SCRIPT 🚀');
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);

// Log sanitized environment variables for debugging
console.log('Environment variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- PORT: ${process.env.PORT || 'not set'}`);
console.log(`- Database: ${process.env.DATABASE_URL ? 'configured ✓' : 'not configured ✗'}`);
console.log(`- Supabase: ${process.env.SUPABASE_URL && process.env.SUPABASE_KEY ? 'configured ✓' : 'not configured ✗'}`);
console.log(`- OpenAI: ${process.env.OPENAI_API_KEY ? 'configured ✓' : 'not configured ✗'}`);
console.log(`- Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);

// Check for minimum required environment variables
if (!process.env.NODE_ENV) {
  console.log('NODE_ENV not set, defaulting to production');
  process.env.NODE_ENV = 'production';
}

// Set memory limits for Render's 512MB environment if not already set
if (!process.env.NODE_OPTIONS && process.env.NODE_ENV === 'production') {
  // Set memory limit to 75% of available memory to prevent OOM issues
  process.env.NODE_OPTIONS = '--max-old-space-size=384';
  console.log(`Set memory limit to 384MB for production environment`);
}

// Define an immediate function to allow top-level await
//  Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free, close the server
        server.close();
        resolve(false);
      })
      .listen(port, '0.0.0.0');
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    console.log(`Port ${port} is in use, trying ${port + 1}...`);
    port++;
  }
  return port;
}

// Global tracking of server state to prevent multiple startups
let serverStarted = false;

(async function main() {
  try {
    // Find available port
    const requestedPort = parseInt(process.env.PORT || '10000');
    const availablePort = await findAvailablePort(requestedPort);
    
    if (requestedPort !== availablePort) {
      console.log(`⚠️ Requested port ${requestedPort} is in use, using port ${availablePort} instead`);
      process.env.PORT = availablePort.toString();
    } else {
      console.log(`✅ Port ${availablePort} is available`);
    }
    
    // Try to dynamically import createRequire for CommonJS compatibility
    let createRequire;
    try {
      const moduleUtil = await import('module');
      createRequire = moduleUtil.createRequire;
      console.log('Successfully imported createRequire - CommonJS bridge available');
    } catch (err) {
      console.log('createRequire not available - limited CommonJS compatibility');
    }

    // Check if dist/index.js exists
    const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
    const distExists = fs.existsSync(distIndexPath);

    console.log(`Checking for dist/index.js: ${distExists ? 'Found' : 'Not found'}`);

    // Emergency server path
    const emergencyServerPath = path.join(process.cwd(), 'emergency-server.js');
    const emergencyExists = fs.existsSync(emergencyServerPath);

    console.log(`Checking for emergency-server.js: ${emergencyExists ? 'Found' : 'Not found'}`);

    // First attempt: Try to start the regular server if it exists
    if (distExists && !serverStarted) {
      console.log('Attempting to start the regular server from dist/index.js...');
      
      // Set a timeout to prevent hanging indefinitely (increased to 5 minutes)
      console.log('Setting server startup timeout of 5 minutes...');
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          console.log('⚠️ Regular server startup timed out after 5 minutes. Switching to emergency server...');
          startEmergencyServer();
        }
      }, 300000); // 5 minute timeout (300,000 ms)
      
      try {
        // Create a custom stdio configuration to detect the success signal
        // stdio must be an array of ['pipe', process.stderr, process.stderr] for [stdin, stdout, stderr]
        const mainServer = spawn('node', ['dist/index.js'], {
          stdio: ['ignore', 'pipe', process.stderr], // pipe stdout to capture success signal
          env: { ...process.env, NODE_ENV: 'production' }
        });
        
        // Process stdout to detect success signal
        mainServer.stdout.on('data', (data) => {
          // Pass the output to the parent process's stdout
          process.stdout.write(data);
          
          // Check for success signal
          const output = data.toString();
          if (output.includes('SERVER_STARTED_SUCCESSFULLY')) {
            console.log('✅ Detected server startup success signal');
            serverStarted = true;
            clearTimeout(timeout);
          }
          
          // Also check for running message as a secondary signal
          if (output.includes('Running at http://localhost:')) {
            console.log('⚠️ Server appears to be running, but waiting for explicit success signal...');
          }
        });
        
        mainServer.on('error', (err) => {
          console.error(`Regular server error: ${err.message}`);
          clearTimeout(timeout);
          if (!serverStarted) {
            serverStarted = true; 
            startEmergencyServer();
          }
        });
        
        mainServer.on('exit', (code, signal) => {
          clearTimeout(timeout);
          
          if (code !== 0) {
            console.error(`Regular server exited with code ${code} and signal ${signal}`);
            if (!serverStarted) {
              serverStarted = true;
              startEmergencyServer();
            }
          } else if (!serverStarted) {
            // Handle clean exit but no success signal
            console.log('Server exited cleanly but no success signal was detected');
            serverStarted = true;
          }
        });
      } catch (err) {
        console.error(`Failed to spawn regular server: ${err.message}`);
        clearTimeout(timeout);
        if (!serverStarted) {
          serverStarted = true;
          startEmergencyServer();
        }
      }
    } else if (!serverStarted) {
      console.log('Regular server not found. Starting emergency server...');
      serverStarted = true;
      startEmergencyServer();
    }

    // Function to start the emergency server
    function startEmergencyServer() {
      if (serverStarted) {
        console.log('Server already started, skipping emergency server');
        return;
      }
      
      console.log('Starting emergency server...');
      serverStarted = true;
      
      if (emergencyExists) {
        console.log('Using standalone emergency server from emergency-server.js');
        
        try {
          // Pass the available port to ensure it matches what we checked
          const PORT = process.env.PORT || '10000';
          console.log(`Passing PORT=${PORT} to emergency-server.js`);
          const emergencyServer = spawn('node', ['emergency-server.js'], {
            stdio: 'inherit',
            env: { 
              ...process.env, 
              NODE_ENV: 'production',
              PORT
            }
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
    async function createAndStartInlineServer() {
      if (serverStarted) {
        console.log('Server already started, skipping inline server');
        return;
      }
      
      console.log('Creating inline emergency server as last resort...');
      
      // Find another available port to avoid conflicts
      const PORT = parseInt(process.env.PORT || '10000');
      const newPort = await findAvailablePort(PORT);
      console.log(`Using port ${newPort} for inline server`);
      process.env.PORT = newPort.toString();
      
      serverStarted = true;
      
      // Try to import express
      try {
        const expressModule = await import('express');
        const express = expressModule.default;
        const app = express();
        
        console.log('Express imported successfully - starting inline server');
        
        // Look for static files to serve
        const staticPaths = [
          path.join(process.cwd(), 'client/dist'),
          path.join(process.cwd(), 'dist/public')
        ];
        
        for (const p of staticPaths) {
          if (fs.existsSync(p)) {
            console.log(`Serving static files from: ${p}`);
            app.use(express.static(p));
          }
        }
        
        // Add health check endpoint
        app.get('/api/health', (req, res) => {
          res.json({
            status: 'ok',
            mode: 'inline-emergency',
            timestamp: new Date().toISOString(),
            port: newPort
          });
        });
        
        // Create minimal HTML
        app.get('*', (req, res) => {
          if (req.path.startsWith('/api') && req.path !== '/api/health') {
            // Generic API response
            return res.json({
              error: 'API running in emergency mode',
              endpoint: req.path
            });
          }
          
          // Serve minimal HTML for all other requests
          res.send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>BrokerGPT - Emergency Mode</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; max-width: 800px; margin: 0 auto; }
                h1 { color: #0087FF; }
                .card { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <h1>BrokerGPT</h1>
              <div class="card">
                <h2>Service Status</h2>
                <p>The application is running in inline emergency mode.</p>
                <p>API endpoints are available but full functionality is limited.</p>
                <p>Running on port ${newPort}</p>
              </div>
              <div class="card">
                <h2>API Status</h2>
                <div id="api-status">Checking...</div>
                <script>
                  fetch('/api/health')
                    .then(r => r.json())
                    .then(data => {
                      document.getElementById('api-status').innerHTML = 
                        '<p style="color:green">✓ API is online - ' + 
                        new Date(data.timestamp).toLocaleString() + '</p>';
                    })
                    .catch(err => {
                      document.getElementById('api-status').innerHTML = 
                        '<p style="color:red">✗ API error: ' + err.message + '</p>';
                    });
                </script>
              </div>
            </body>
            </html>
          `);
        });
        
        // Start server on the available port
        const server = app.listen(newPort, '0.0.0.0', () => {
          console.log(`🆘 INLINE EMERGENCY SERVER RUNNING ON PORT ${newPort} 🆘`);
        });
        
        // Handle errors to prevent crashes
        server.on('error', (err) => {
          console.error('Express server error:', err);
          if (err.code === 'EADDRINUSE') {
            console.error(`Port ${newPort} is already in use, trying HTTP fallback`);
            startHttpFallback();
          }
        });
      } catch (expressError) {
        console.error('Failed to import Express:', expressError);
        startHttpFallback();
      }
    }
    
    // Final fallback using only Node.js HTTP module
    async function startHttpFallback() {
      console.log('Falling back to pure Node.js HTTP server');
      
      try {
        // Find yet another port as last resort
        const PORT = parseInt(process.env.PORT || '10000');
        const lastPort = await findAvailablePort(PORT + 1);
        console.log(`Using port ${lastPort} for HTTP fallback server`);
        
        // Use Node's built-in HTTP module as final fallback
        const http = await import('http');
        
        const server = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>BrokerGPT - Critical Recovery</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; }
                h1 { color: #0087FF; }
              </style>
            </head>
            <body>
              <h1>BrokerGPT</h1>
              <p>Critical recovery mode active on port ${lastPort}.</p>
              <p>This is the most minimal emergency server.</p>
            </body>
            </html>
          `);
        });
        
        server.listen(lastPort, '0.0.0.0', () => {
          console.log(`⚠️ CRITICAL HTTP FALLBACK SERVER RUNNING ON PORT ${lastPort} ⚠️`);
        });
        
        server.on('error', (err) => {
          console.error('Fatal HTTP server error:', err);
          console.error('All server start attempts have failed.');
          process.exit(1);
        });
      } catch (httpError) {
        console.error('Fatal: Could not create any type of server:', httpError);
        process.exit(1);
      }
    }
  } catch (startupError) {
    console.error('Catastrophic startup error:', startupError);
    process.exit(1);
  }
})();