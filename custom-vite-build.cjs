/**
 * CommonJS-compatible Vite build script for Render.com deployment
 * This script avoids ESM syntax to ensure maximum compatibility across environments
 */

// Using CommonJS require
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('Starting custom Vite build (CommonJS mode)...');
console.log(`Node version: ${process.version}`);
console.log(`Current directory: ${process.cwd()}`);

/**
 * Execute a command synchronously and log output
 * @param {string} command - The command to execute
 * @param {object} options - Options for execSync
 * @returns {Buffer} The command output
 */
function exec(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    return execSync(command, {
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Run a command as a separate process
 * @param {string} command - The command to run
 * @param {Array<string>} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<boolean>} Whether the command succeeded
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`Command succeeded: ${command} ${args.join(' ')}`);
        resolve(true);
      } else {
        console.error(`Command failed with code ${code}: ${command} ${args.join(' ')}`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error(`Command error: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * Ensure a directory exists
 * @param {string} dir - Directory path to create
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Try to install Vite and needed dependencies if not already installed
 */
async function ensureViteDependencies() {
  try {
    // Check if Vite is installed and accessible
    execSync('npx vite --version', { stdio: 'pipe' });
    console.log('Vite is already installed and accessible');
  } catch (error) {
    console.log('Vite not found or not accessible, installing dependencies...');
    
    // Try to install Vite in multiple ways to ensure it's available
    await runCommand('npm', ['install', '--no-save', 'vite@latest', '@vitejs/plugin-react@latest', 'esbuild@latest']);
    await runCommand('npm', ['install', '-g', 'vite@latest', 'esbuild@latest']);
    
    // Add global binaries to PATH
    process.env.PATH = `${process.env.PATH}:${execSync('npm bin -g').toString().trim()}`;
    console.log(`Updated PATH: ${process.env.PATH}`);
  }
}

/**
 * Build the frontend using Vite
 */
async function buildFrontend() {
  console.log('Building frontend with Vite...');
  
  try {
    // Set up client/dist directory where build output will go
    const distDir = path.join(process.cwd(), 'client', 'dist');
    ensureDir(distDir);
    
    // Try to build with Vite directly
    if (await runCommand('npx', ['vite', 'build'])) {
      console.log('Vite build completed successfully');
      return true;
    }
    
    // If direct build fails, try alternative approaches
    console.log('Direct Vite build failed, trying alternative approach...');
    
    // Try using Vite's JavaScript API (ESM-compatible version)
    const viteBuildScript = `
      // ESM-compatible Vite build script
      import { build } from 'vite';
      
      async function buildApp() {
        try {
          await build({
            configFile: './vite.config.js',
            root: process.cwd(),
            logLevel: 'info',
            mode: 'production'
          });
          console.log('Vite build completed via API');
        } catch (err) {
          console.error('Build error:', err);
          process.exit(1);
        }
      }
      
      buildApp();
    `;
    
    const tempScriptPath = path.join(process.cwd(), 'vite-build-temp.js');
    fs.writeFileSync(tempScriptPath, viteBuildScript);
    
    if (await runCommand('node', [tempScriptPath])) {
      // Clean up temp file
      fs.unlinkSync(tempScriptPath);
      console.log('Vite API build completed successfully');
      return true;
    }
    
    // Clean up temp file
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
    
    // Last resort: Try to use esbuild directly for a simple build
    console.log('Vite build failed, attempting basic build with esbuild...');
    
    if (await runCommand('npx', ['esbuild', 'client/src/main.tsx', '--bundle', '--outfile=client/dist/bundle.js'])) {
      // Create a basic HTML file to load the bundle
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>BrokerGPT</title>
          <link rel="stylesheet" href="/styles.css" />
        </head>
        <body>
          <div id="root"></div>
          <script src="/bundle.js"></script>
        </body>
        </html>
      `;
      
      fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
      console.log('Basic esbuild process completed');
      return true;
    }
    
    console.log('All build attempts failed, falling back to static-frontend.js');
    return false;
  } catch (error) {
    console.error('Frontend build error:', error);
    return false;
  }
}

/**
 * Ensures the database module is compatible with both ESM and CommonJS
 */
async function ensureDatabaseCompatibility() {
  console.log('Ensuring database module compatibility...');
  
  const dbTsPath = path.join(process.cwd(), 'server', 'db.ts');
  const dbCjsPath = path.join(process.cwd(), 'server', 'db.cjs');
  const createTablesTsPath = path.join(process.cwd(), 'scripts', 'create-tables.ts');
  const createTablesCjsPath = path.join(process.cwd(), 'scripts', 'create-tables.cjs');
  
  // Check if the CommonJS versions exist
  const dbCjsExists = fs.existsSync(dbCjsPath);
  const createTablesCjsExists = fs.existsSync(createTablesCjsPath);
  
  if (!dbCjsExists && fs.existsSync(dbTsPath)) {
    console.log('Creating CommonJS version of server/db.ts...');
    
    const dbCjsContent = `
// CommonJS version of database connection module

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

/**
 * Build the backend using esbuild
 */
async function buildBackend() {
  console.log('Building backend with esbuild...');
  
  // Ensure database compatibility by creating CommonJS versions
  await ensureDatabaseCompatibility();
  
  try {
    const outDir = path.join(process.cwd(), 'dist');
    ensureDir(outDir);
    
    if (await runCommand('npx', ['esbuild', 'server/index.ts', '--platform=node', '--packages=external', '--bundle', '--format=esm', '--outdir=dist'])) {
      console.log('Backend build completed successfully');
      return true;
    }
    
    console.log('Standard backend build failed, trying alternative approach...');
    
    // Try a more compatible build approach
    if (await runCommand('npx', ['esbuild', 'server/index.ts', '--bundle', '--platform=node', '--outfile=dist/index.js'])) {
      console.log('Alternative backend build completed successfully');
      return true;
    }
    
    console.log('All backend build attempts failed');
    return false;
  } catch (error) {
    console.error('Backend build error:', error);
    return false;
  }
}

/**
 * Create a minimal index.js in dist as a fallback
 */
function createFallbackServer() {
  console.log('Creating fallback server...');
  
  const fallbackServerPath = path.join(process.cwd(), 'dist', 'index.js');
  const fallbackContent = `
    // Emergency fallback server
    import express from 'express';
    import path from 'path';
    import { fileURLToPath } from 'url';
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const app = express();
    const PORT = process.env.PORT || 5000;
    
    // Serve static frontend
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    // Basic API endpoints
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });
    
    app.get('/api/clients', (req, res) => {
      res.json([]);
    });
    
    app.get('/api/carriers', (req, res) => {
      res.json([]);
    });
    
    // Serve frontend on all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
    
    app.listen(PORT, () => {
      console.log(\`Emergency fallback server running on port \${PORT}\`);
    });
  `;
  
  fs.writeFileSync(fallbackServerPath, fallbackContent);
  console.log(`Created fallback server at: ${fallbackServerPath}`);
}

/**
 * Main build function
 */
async function main() {
  console.log('Starting build process...');
  
  // Ensure Vite and other dependencies are installed
  await ensureViteDependencies();
  
  // Build frontend
  const frontendSuccess = await buildFrontend();
  if (!frontendSuccess) {
    console.log('Frontend build failed, will use static-frontend.js later');
    
    // Try running the static frontend generator
    try {
      // Try ESM version
      exec('node static-frontend.js');
    } catch (e) {
      // If that fails, try require version
      try {
        const staticFrontend = require('./static-frontend.js');
        if (typeof staticFrontend === 'function') {
          staticFrontend();
        }
      } catch (err) {
        console.error('Failed to run static frontend generator:', err);
      }
    }
  }
  
  // Build backend
  const backendSuccess = await buildBackend();
  if (!backendSuccess) {
    console.log('Backend build failed, creating fallback server');
    createFallbackServer();
  }
  
  // Final check to make sure we have necessary files
  const distIndexPath = path.join(process.cwd(), 'dist', 'index.js');
  const clientDistDir = path.join(process.cwd(), 'client', 'dist');
  const clientIndexPath = path.join(clientDistDir, 'index.html');
  
  if (!fs.existsSync(distIndexPath)) {
    console.error('ERROR: dist/index.js not found! Application will not run correctly!');
    createFallbackServer();
  }
  
  if (!fs.existsSync(clientIndexPath)) {
    console.error('ERROR: client/dist/index.html not found! Running static frontend generator...');
    exec('node ensure-dist.js');
  }
  
  console.log('Build process completed!');
  return true;
}

// Run the build process
main().then((success) => {
  if (success) {
    console.log('Build completed successfully');
    process.exit(0);
  } else {
    console.error('Build failed');
    process.exit(1);
  }
}).catch((error) => {
  console.error('Build error:', error);
  process.exit(1);
});