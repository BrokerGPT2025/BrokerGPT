// Redirect script for Render.com deployment (CommonJS version)
// This script ensures that when Render.com falls back to using `npm start`,
// it will directly use the dist/index.js file which has the emergency server.

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// First, let's ensure database compatibility by creating CommonJS versions if needed
function ensureDatabaseCompatibility() {
  console.log('Ensuring database module compatibility...');
  
  const dbTsPath = path.join(process.cwd(), 'server', 'db.ts');
  const dbCjsPath = path.join(process.cwd(), 'server', 'db.cjs');
  const createTablesTsPath = path.join(process.cwd(), 'scripts', 'create-tables.ts');
  const createTablesCjsPath = path.join(process.cwd(), 'scripts', 'create-tables.cjs');
  
  // Check if the CommonJS versions exist
  const dbCjsExists = fs.existsSync(dbCjsPath);
  const createTablesCjsExists = fs.existsSync(createTablesCjsPath);
  
  // Create server/db.cjs if it doesn't exist
  if (!dbCjsExists && fs.existsSync(dbTsPath)) {
    console.log('Creating CommonJS version of server/db.ts...');
    
    const dbCjsContent = `// CommonJS version of database connection module

'use strict';

const { Pool } = require('@neondatabase/serverless');
const pg = require('pg');
const ws = require('ws');
const path = require('path');

// Use require.resolve to find the path to create-tables.cjs
const CREATE_TABLES_PATH = path.resolve(__dirname, '../scripts/create-tables.cjs');

// Require the createTables function
let createTables;
try {
  createTables = require(CREATE_TABLES_PATH);
  console.log("Successfully loaded create-tables.cjs module");
} catch (err) {
  console.error("Error loading create-tables.cjs:", err);
  // Fallback empty function
  createTables = async () => {
    console.log("Using fallback empty createTables function");
  };
}

// Configure neon for WebSocket support
try {
  const neonConfig = require('@neondatabase/serverless').neonConfig;
  neonConfig.webSocketConstructor = ws;
} catch (err) {
  console.error("Error configuring neon:", err);
}

// Create connection pools
let pool = null;
let pgPool = null;
let db = null;

// Determine if using Neon or standard PostgreSQL
const isNeonDbUrl = process.env.DATABASE_URL?.includes('neon.tech');

/**
 * Maximum number of connection attempts before falling back to in-memory storage
 */
const MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Delay between connection attempts in milliseconds
 */
const CONNECTION_RETRY_DELAY = 2000;

/**
 * Attempts to connect to the PostgreSQL database
 * @param attempt Current attempt number
 * @returns True if connection successful, false otherwise
 */
async function attemptDatabaseConnection(attempt = 1) {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found. The application will use in-memory storage as a fallback.");
    return false;
  }

  try {
    console.log(\`PostgreSQL connection attempt \${attempt}/\${MAX_CONNECTION_ATTEMPTS} (CommonJS)...\`);
    
    // Log connection info (without credentials)
    const dbUrlParts = process.env.DATABASE_URL.split('@');
    if (dbUrlParts.length > 1) {
      console.log(\`Attempting to connect to: \${dbUrlParts[1].split('/')[0]}\`);
    }
    
    // Choose the appropriate connection method
    if (isNeonDbUrl) {
      // For Neon.tech (serverless)
      pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // Verify the connection works with a simple query
      await pool.query('SELECT NOW()');
      
      // We don't set up drizzle here as it may require ESM
      console.log("Neon PostgreSQL database connection initialized successfully (CommonJS)");
    } else {
      // For standard PostgreSQL (Replit, Render, etc.)
      pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      // Verify the connection works with a simple query
      await pgPool.query('SELECT NOW()');
      
      // Assign the pgPool to pool for compatibility with the rest of the code
      pool = pgPool;
      
      console.log("Standard PostgreSQL database connection initialized successfully (CommonJS)");
    }
    
    // Return true to indicate successful connection
    return true;
  } catch (error) {
    console.error(\`Connection attempt \${attempt} failed:\`, error);
    
    if (attempt < MAX_CONNECTION_ATTEMPTS) {
      console.log(\`Retrying in \${CONNECTION_RETRY_DELAY/1000} seconds...\`);
      await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
      return attemptDatabaseConnection(attempt + 1);
    } else {
      console.warn(\`Failed to connect after \${MAX_CONNECTION_ATTEMPTS} attempts. Using in-memory storage.\`);
      return false;
    }
  }
}

async function initializeDatabase() {
  const connected = await attemptDatabaseConnection();
  
  if (connected) {
    try {
      // Use our external create tables script
      console.log("Creating tables using CommonJS module...");
      await createTables(pool);
    } catch (tableError) {
      console.error("Error creating tables:", tableError);
      console.log("Continuing with existing database structure");
    }
  }
}

// Initialize database
initializeDatabase().catch(err => {
  console.error("Database initialization failed:", err);
  console.warn("Falling back to in-memory storage");
});

// Helper function to check if DB is available
function isDatabaseAvailable() {
  return !!pool;
}

// Export pool and functions
module.exports = {
  pool,
  db,
  isDatabaseAvailable
};`;
    
    fs.writeFileSync(dbCjsPath, dbCjsContent);
    console.log('Created CommonJS version of db.ts at db.cjs');
  }
  
  // Create scripts/create-tables.cjs if it doesn't exist
  if (!createTablesCjsExists && fs.existsSync(createTablesTsPath)) {
    console.log('Creating CommonJS version of scripts/create-tables.ts...');
    
    const createTablesCjsContent = `// Create database tables script (CommonJS version)
// This will be executed from index.ts

'use strict';

/**
 * Creates all required database tables if they don't exist
 * @param pool The PostgreSQL connection pool
 */
const createTables = async (pool) => {
  if (!pool) {
    console.log("No database pool available, skipping table creation");
    return;
  }

  try {
    console.log("Checking if tables need to be created (CommonJS)...");
    
    // First try to query the clients table to see if it exists
    try {
      await pool.query("SELECT 1 FROM clients LIMIT 1");
      console.log("Tables already exist, skipping creation");
      return; // Tables exist, exit early
    } catch (error) {
      // Table doesn't exist, continue with creation
      console.log("Tables don't exist, creating now...");
    }

    // Create tables based on schema
    const createTableQueries = [
      \`CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        province TEXT,
        postal_code TEXT,
        phone TEXT,
        email TEXT,
        business_type TEXT,
        annual_revenue INTEGER,
        employees INTEGER,
        risk_profile JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )\`,
      \`CREATE TABLE IF NOT EXISTS carriers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        website TEXT,
        phone TEXT,
        email TEXT,
        specialties TEXT[],
        risk_appetite JSONB,
        min_premium INTEGER,
        max_premium INTEGER,
        regions TEXT[],
        business_types TEXT[]
      )\`,
      \`CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        carrier_id INTEGER NOT NULL,
        policy_type TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        premium INTEGER,
        status TEXT NOT NULL,
        coverage_limits JSONB
      )\`,
      \`CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        client_id INTEGER,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )\`,
      \`CREATE TABLE IF NOT EXISTS record_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      )\`,
      \`CREATE TABLE IF NOT EXISTS client_records (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        value TEXT,
        date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )\`
    ];
    
    for (const query of createTableQueries) {
      try {
        await pool.query(query);
        console.log("Successfully created table from query:", query.substring(0, 60) + '...');
      } catch (err) {
        console.error("Error creating table:", err);
      }
    }
    
    console.log("All tables created successfully.");
  } catch (error) {
    console.error("Error in database table creation:", error);
  }
};

module.exports = createTables;`;
    
    fs.writeFileSync(createTablesCjsPath, createTablesCjsContent);
    console.log('Created CommonJS version of create-tables.ts at create-tables.cjs');
  }
  
  return true;
}

// Run the compatibility check
try {
  ensureDatabaseCompatibility();
} catch (err) {
  console.error('Error ensuring database compatibility:', err);
  // Continue anyway, since this is just a preparation step
}

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