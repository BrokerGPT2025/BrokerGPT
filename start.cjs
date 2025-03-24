// Redirect script for Render.com deployment (CommonJS version)
// This script ensures that when Render.com falls back to using `npm start`,
// it will directly use the dist/index.js file which has the emergency server.

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting BrokerGPT application through start.cjs...');
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current directory: ${process.cwd()}`);

// Set environment variable if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('Setting NODE_ENV to production');
}

// Check if dist/index.js exists first - that's our primary target
const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
const prodScriptPath = path.join(process.cwd(), 'prod.js');
const startEsmPath = path.join(process.cwd(), 'start.js');

console.log(`Checking for dist/index.js at ${distIndexPath}`);

// Try to use ESM version of start script first if available
if (fs.existsSync(startEsmPath) && process.env.NODE_ENV === 'production') {
  console.log('Found ESM start script, trying to use it...');
  
  // Spawn the process using node with ESM support enabled
  const child = spawn('node', ['--experimental-specifier-resolution=node', startEsmPath], {
    stdio: 'inherit',
    env: process.env
  });

  // Handle process exit
  child.on('exit', (code) => {
    console.log(`ESM start script exited with code ${code}`);
    
    // If ESM start script fails, continue with CommonJS version
    if (code !== 0) {
      console.log('ESM script failed, falling back to CommonJS implementation...');
      startWithCommonJS();
    } else {
      process.exit(code);
    }
  });

  // Handle errors
  child.on('error', (err) => {
    console.error('Failed to start ESM version:', err);
    startWithCommonJS();
  });
} else {
  // Start directly with CommonJS
  startWithCommonJS();
}

function startWithCommonJS() {
  // Try to use dist/index.js first (our emergency server)
  if (fs.existsSync(distIndexPath)) {
    console.log('Found dist/index.js, using it directly...');
    
    // For ESM modules in dist/index.js (which is the expected format)
    const child = spawn('node', ['--experimental-specifier-resolution=node', distIndexPath], {
      stdio: 'inherit',
      env: process.env
    });

    // Handle process exit
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`);
      process.exit(code);
    });

    // Handle errors
    child.on('error', (err) => {
      console.error('Failed to start dist/index.js server:', err);
      startEmergencyServer();
    });
  } 
  // If dist/index.js doesn't exist, try prod.js
  else if (fs.existsSync(prodScriptPath)) {
    console.log(`Dist index not found, trying prod.js at ${prodScriptPath}`);
    
    // Spawn the process to run prod.js
    const child = spawn('node', [prodScriptPath], {
      stdio: 'inherit',
      env: process.env
    });

    // Handle process exit
    child.on('exit', (code) => {
      console.log(`Child process exited with code ${code}`);
      process.exit(code);
    });

    // Handle errors
    child.on('error', (err) => {
      console.error('Failed to start prod.js server:', err);
      startEmergencyServer();
    });
  }
  // If neither exists, start emergency server directly
  else {
    console.error('Neither dist/index.js nor prod.js exist!');
    startEmergencyServer();
  }
}

// Emergency server function if all else fails
function startEmergencyServer() {
  console.log('Starting emergency inline server with CommonJS...');
  
  try {
    // Generate static frontend if possible
    const staticFrontendCjsPath = path.join(process.cwd(), 'static-frontend.cjs');
    const staticFrontendPath = path.join(process.cwd(), 'static-frontend.js');
    const clientDistDir = path.join(process.cwd(), 'client', 'dist');
    
    // Try to generate static frontend
    if (!fs.existsSync(path.join(clientDistDir, 'index.html'))) {
      // Create the client/dist directory if it doesn't exist
      if (!fs.existsSync(clientDistDir)) {
        fs.mkdirSync(clientDistDir, { recursive: true });
      }

      // Try CommonJS version first
      if (fs.existsSync(staticFrontendCjsPath)) {
        console.log('Generating static frontend using CommonJS version...');
        try {
          require(staticFrontendCjsPath);
        } catch (err) {
          console.error('Error running CommonJS static frontend generator:', err);
        }
      }
      // Fall back to ESM version if CJS version fails or doesn't exist
      else if (fs.existsSync(staticFrontendPath)) {
        console.log('Trying to generate static frontend using ESM version...');
        // Use exec since we can't require ESM modules in CommonJS
        const { execSync } = require('child_process');
        try {
          execSync(`node ${staticFrontendPath}`, { stdio: 'inherit' });
        } catch (err) {
          console.error('Error executing ESM static frontend generator:', err);
        }
      }
    }
    
    // Check if we have Express installed
    let express;
    try {
      express = require('express');
    } catch (err) {
      console.error('Express not found, attempting to install it...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install express --no-save', { stdio: 'inherit' });
        express = require('express');
      } catch (installErr) {
        console.error('Failed to install Express:', installErr);
        
        // Create a minimal server using Node.js http module as last resort
        const http = require('http');
        const server = http.createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>BrokerGPT</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 50px; max-width: 800px; margin: 0 auto; }
                .logo { font-size: 2rem; font-weight: bold; color: #0087FF; margin-bottom: 1rem; }
                .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .status { display: inline-block; padding: 6px 12px; background: #e6f7ff; color: #0087FF; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="logo">BrokerGPT</div>
              <div class="card">
                <h2>Critical Emergency Mode</h2>
                <p>The application is running in ultra minimal mode.</p>
                <p>Express.js is not available. Using Node.js HTTP server.</p>
                <div class="status">Basic System Online</div>
              </div>
            </body>
            </html>
          `);
        });
        
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
          console.log(`[CRITICAL EMERGENCY SERVER] Running with HTTP module at http://localhost:${PORT}`);
        });
        
        return; // Stop execution here
      }
    }
    
    // Start Express server
    const app = express();
    const PORT = process.env.PORT || 5000;
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        mode: 'emergency-cjs',
        timestamp: new Date().toISOString() 
      });
    });
    
    // Basic API mock endpoints
    app.get('/api/carriers', (req, res) => {
      res.json([]);
    });
    
    app.get('/api/clients', (req, res) => {
      res.json([]);
    });
    
    // Serve static files if they exist
    if (fs.existsSync(path.join(clientDistDir, 'index.html'))) {
      console.log('Serving static files from client/dist');
      app.use(express.static(clientDistDir));
      
      // Serve SPA - redirect all requests to index.html for client-side routing
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistDir, 'index.html'));
      });
    } else {
      // Fallback to inline HTML
      app.get('/', (req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>BrokerGPT</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; max-width: 800px; margin: 0 auto; }
              .logo { font-size: 2rem; font-weight: bold; color: #0087FF; margin-bottom: 1rem; }
              .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .status { display: inline-block; padding: 6px 12px; background: #e6f7ff; color: #0087FF; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="logo">BrokerGPT</div>
            <div class="card">
              <h2>Emergency Mode (CommonJS)</h2>
              <p>The application is running in emergency fallback mode.</p>
              <p>This is a minimal server to maintain availability.</p>
              <div class="status">System Online</div>
            </div>
            <div class="card">
              <h3>Next Steps</h3>
              <p>Please contact system administrator to resolve deployment issues.</p>
            </div>
          </body>
          </html>
        `);
      });
      
      // Catch-all handler
      app.get('*', (req, res) => {
        res.redirect('/');
      });
    }
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[EMERGENCY SERVER] Running with CommonJS at http://localhost:${PORT}`);
      console.log('Ready to accept connections');
    });
  } catch (err) {
    console.error('Complete server failure. Cannot start server:', err);
    console.log('Exiting process');
    process.exit(1);
  }
}