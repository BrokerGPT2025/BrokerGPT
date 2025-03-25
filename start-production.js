// Universal production startup script with module format compatibility
// This script tries multiple server startup methods and handles format mismatches

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 UNIVERSAL PRODUCTION STARTUP SCRIPT 🚀');
console.log(`Node version: ${process.version}`);
console.log(`Working directory: ${process.cwd()}`);

// Define an immediate function to allow top-level await
(async function main() {
  try {
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
    async function createAndStartInlineServer() {
      console.log('Creating inline emergency server as last resort...');
      
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
        
        // Create minimal HTML
        app.get('*', (req, res) => {
          const isApiRequest = req.path.startsWith('/api');
          
          if (isApiRequest) {
            // Handle API requests
            if (req.path === '/api/health') {
              return res.json({
                status: 'ok',
                mode: 'inline-emergency',
                timestamp: new Date().toISOString()
              });
            }
            
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
        
        // Start server
        const PORT = process.env.PORT || 10000;
        app.listen(PORT, '0.0.0.0', () => {
          console.log(`🆘 INLINE EMERGENCY SERVER RUNNING ON PORT ${PORT} 🆘`);
        });
      } catch (expressError) {
        console.error('Failed to import Express:', expressError);
        console.log('Falling back to pure Node.js HTTP server');
        
        try {
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
                <p>Critical recovery mode active. All normal services are unavailable.</p>
                <p>This is the most minimal emergency server.</p>
              </body>
              </html>
            `);
          });
          
          const PORT = process.env.PORT || 10000;
          server.listen(PORT, '0.0.0.0', () => {
            console.log(`⚠️ CRITICAL HTTP FALLBACK SERVER RUNNING ON PORT ${PORT} ⚠️`);
          });
        } catch (httpError) {
          console.error('Fatal: Could not create any type of server:', httpError);
          process.exit(1);
        }
      }
    }
  } catch (startupError) {
    console.error('Catastrophic startup error:', startupError);
    process.exit(1);
  }
})();