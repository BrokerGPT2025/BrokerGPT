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
    console.log(`PostgreSQL connection attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS} (CommonJS)...`);
    
    // Log connection info (without credentials)
    const dbUrlParts = process.env.DATABASE_URL.split('@');
    if (dbUrlParts.length > 1) {
      console.log(`Attempting to connect to: ${dbUrlParts[1].split('/')[0]}`);
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
    console.error(`Connection attempt ${attempt} failed:`, error);
    
    if (attempt < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying in ${CONNECTION_RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
      return attemptDatabaseConnection(attempt + 1);
    } else {
      console.warn(`Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts. Using in-memory storage.`);
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
};