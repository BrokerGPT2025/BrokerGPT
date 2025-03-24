import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
// Explicitly import the function to avoid TypeScript issues
import createTables from "../scripts/create-tables.ts";
import pg from 'pg';

// Configure neon for WebSocket support
neonConfig.webSocketConstructor = ws;

// Create connection pools
let pool: Pool | null = null;
let pgPool: pg.Pool | null = null;
let db: any = null;

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
async function attemptDatabaseConnection(attempt = 1): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found. The application will use in-memory storage as a fallback.");
    return false;
  }

  try {
    console.log(`PostgreSQL connection attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS}...`);
    
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
      
      db = drizzle({ client: pool, schema });
      console.log("Neon PostgreSQL database connection initialized successfully");
    } else {
      // For standard PostgreSQL (Replit, Render, etc.)
      pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      // Verify the connection works with a simple query
      await pgPool.query('SELECT NOW()');
      
      // Assign the pgPool to pool for compatibility with the rest of the code
      pool = pgPool as unknown as Pool;
      
      // Use drizzle with the pg Pool
      db = drizzle({ client: pool, schema });
      console.log("Standard PostgreSQL database connection initialized successfully");
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

// Export pool and db, which might be null if connection failed
export { pool, db };

// Helper function to check if DB is available
export function isDatabaseAvailable(): boolean {
  return !!pool && !!db;
}
