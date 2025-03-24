// Production server entry point - CommonJS version
// Bypasses Vite in production mode with CommonJS compatibility
'use strict';

const path = require('path');
const fs = require('fs');

console.log(`Starting BrokerGPT in ${process.env.NODE_ENV || 'development'} mode (CommonJS)...`);
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

// We already have __dirname in CommonJS
console.log(`__dirname resolved to: ${__dirname}`);

// Ensure the required directories exist
const distPath = path.join(__dirname, 'client', 'dist');
try {
  if (!fs.existsSync(distPath)) {
    console.log('Creating client/dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not check or create client/dist directory:', error);
}

// Ensure theme.json exists
const themeJsonPath = path.join(__dirname, 'theme.json');
try {
  if (!fs.existsSync(themeJsonPath)) {
    console.log('Creating default theme.json file...');
    const defaultTheme = {
      primary: "#0087FF",
      variant: "professional",
      appearance: "light",
      radius: 0.5
    };
    fs.writeFileSync(themeJsonPath, JSON.stringify(defaultTheme, null, 2));
  }
} catch (error) {
  console.warn('Warning: Could not check or create theme.json file:', error);
}

// Ensure index.html exists in client/dist
const indexHtmlPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.log('Creating minimal index.html...');
  try {
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
    <h1>BrokerGPT (CommonJS)</h1>
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
  } catch (error) {
    console.warn('Warning: Could not create index.html:', error);
  }
}

// Load dependencies
let express;
try {
  express = require('express');
} catch (error) {
  console.error('ERROR: Express is required. Attempting to install it...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install express --no-save', { stdio: 'inherit' });
    express = require('express');
  } catch (installError) {
    console.error('Failed to install Express. Cannot continue:', installError);
    process.exit(1);
  }
}

// Initialize Express
const app = express();
app.use(express.json());

// Try to load and set up session
try {
  const session = require('express-session');
  const MemoryStore = require('memorystore')(session);
  
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'broker-gpt-session-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      },
      store: new MemoryStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );
  console.log('Session middleware configured successfully');
} catch (error) {
  console.warn('Warning: Failed to set up session middleware:', error);
  console.log('Continuing without session support...');
}

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  console.log('Setting up static file serving from client/dist...');
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
}

// API health check endpoint that doesn't require any modules
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'commonjs',
    timestamp: new Date().toISOString() 
  });
});

// Global error handler for the case where routes.js fails to load
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Try to register API routes
let httpServer;
try {
  console.log('Trying to load routes module...');
  
  // Since server/routes.ts might be an ESM module, we use a workaround
  const { spawn } = require('child_process');
  const child = spawn(
    'node',
    ['--experimental-specifier-resolution=node', '-e', `
      import('./server/routes.js').then(routes => {
        routes.registerRoutes(null);
        process.exit(0);
      }).catch(err => {
        console.error('Failed to import routes:', err);
        process.exit(1);
      });
    `],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  
  // If the import works, we assume routes.js is ESM and we should use start.js instead
  child.on('exit', (code) => {
    if (code === 0) {
      console.log('Routes module appears to be ESM. Consider using start.js instead.');
    }
  });
  
  // Attempt to require routes directly (this will likely fail if it's ESM)
  try {
    const routesModule = require('./server/routes.js');
    console.log('Registering API routes...');
    httpServer = routesModule.registerRoutes(app);
    console.log('Routes registered successfully via CommonJS require');
  } catch (requireError) {
    console.log('Cannot require routes module directly, falling back to HTTP server');
    const http = require('http');
    httpServer = http.createServer(app);
  }

  // Production route fallback for SPA
  if (process.env.NODE_ENV === 'production') {
    // For any other request, send the index.html file
    console.log('Setting up SPA fallback route for client-side routing...');
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    });
  }
} catch (error) {
  console.error('Failed to register routes:', error);
  
  // Create a simple HTTP server if routes.js fails
  console.log('Creating fallback HTTP server...');
  const http = require('http');
  httpServer = http.createServer(app);
  
  // Set SPA fallback for production mode
  if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    });
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
try {
  if (httpServer) {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`[${process.env.NODE_ENV || 'development'}] Server running at http://localhost:${PORT} (CommonJS)`);
      console.log('Environment variables:');
      console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
      console.log('- OpenAI API key:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
      console.log('- Serper API key:', process.env.SERPER_API_KEY ? 'set' : 'not set');
      console.log('- Browserless API key:', process.env.BROWSERLESS_API_KEY ? 'set' : 'not set');
      console.log('- Supabase URL:', process.env.SUPABASE_URL ? 'set' : 'not set');
      console.log('- Database URL:', process.env.DATABASE_URL ? 'set' : 'not set');
    });
  } else {
    // Fallback to direct Express listen if HTTP server creation failed
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[FALLBACK SERVER] Running at http://localhost:${PORT} (CommonJS)`);
    });
  }
} catch (error) {
  console.error('Failed to start server:', error);
  
  // Last resort - try to start a simple Express server
  try {
    console.log('Attempting to start minimal server...');
    const minimalApp = express();
    minimalApp.get('/', (req, res) => {
      res.send('BrokerGPT Emergency Server (CommonJS)');
    });
    
    minimalApp.listen(PORT, '0.0.0.0', () => {
      console.log(`[EMERGENCY SERVER] Running at http://localhost:${PORT} (CommonJS)`);
    });
  } catch (finalError) {
    console.error('All server start attempts failed:', finalError);
    process.exit(1);
  }
}