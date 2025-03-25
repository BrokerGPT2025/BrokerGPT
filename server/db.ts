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
 * Maximum number of connection attempts before failing
 */
const MAX_CONNECTION_ATTEMPTS = 5;

/**
 * Delay between connection attempts in milliseconds
 */
const CONNECTION_RETRY_DELAY = 3000;

/**
 * Attempts to connect to the PostgreSQL database
 * @param attempt Current attempt number
 * @returns True if connection successful, false otherwise
 */
async function attemptDatabaseConnection(attempt = 1): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found. Database connection is required.");
    return false;
  }

  try {
    console.log(`PostgreSQL connection attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS}...`);
    
    // Log connection info (without credentials)
    const dbUrlParts = process.env.DATABASE_URL.split('@');
    if (dbUrlParts.length > 1) {
      console.log(`Attempting to connect to: ${dbUrlParts[1].split('/')[0]}`);
      
      // Extract hostname from connection string
      const hostnamePart = dbUrlParts[1].split('/')[0];
      const hostname = hostnamePart.split(':')[0];
      console.log(`Extracted hostname: ${hostname}`);
      
      // Try to resolve hostname to IPv4 address
      try {
        const dns = await import('dns');
        const dnsPromise = new Promise<string>((resolve, reject) => {
          dns.lookup(hostname, { family: 4 }, (err, address) => {
            if (err) {
              console.error(`DNS resolution failed: ${err.message}`);
              reject(err);
            } else {
              console.log(`✅ Successfully resolved ${hostname} to IPv4 address: ${address}`);
              resolve(address);
            }
          });
        });
        
        // Wait up to 5 seconds for DNS resolution
        await Promise.race([
          dnsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('DNS resolution timeout')), 5000))
        ]);
      } catch (dnsError) {
        console.error(`DNS resolution issue: ${dnsError.message}`);
        // Continue anyway, pg will retry
      }
    }
    
    // Choose the appropriate connection method
    if (isNeonDbUrl) {
      console.log('Using Neon.tech serverless PostgreSQL connection');
      
      // For Neon.tech (serverless)
      pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        connect_timeout: 60 // Increase timeout for initial connection
      });
      
      // Verify the connection works with a simple query
      const result = await pool.query('SELECT NOW() as time');
      console.log(`✅ Connected to Neon PostgreSQL. Server time: ${result.rows[0].time}`);
      
      db = drizzle({ client: pool, schema });
      console.log("Neon PostgreSQL database connection initialized successfully");
    } else {
      console.log('Using standard PostgreSQL connection with pg');
      
      // Build connection options with optimizations for Render.com
      const connectionOptions: pg.PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Force IPv4 to avoid ENETUNREACH on IPv6
        family: 4,
        // Increase timeouts
        connectionTimeoutMillis: 30000,
        idle_in_transaction_session_timeout: 30000,
        // Set a small pool to avoid connection issues
        max: 5,
        min: 0
      };
      
      // Log connection options (without credentials)
      console.log(`Connection options: max=${connectionOptions.max}, family=${connectionOptions.family}, timeout=${connectionOptions.connectionTimeoutMillis}ms`);
      
      // Create the connection pool
      pgPool = new pg.Pool(connectionOptions);
      
      // Set up error handling on the pool
      pgPool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
      
      // Verify the connection works with a simple query
      const result = await pgPool.query('SELECT NOW() as time');
      console.log(`✅ Connected to PostgreSQL. Server time: ${result.rows[0].time}`);
      
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
    
    // Check for specific error types to provide better debugging info
    if (error.code === 'ENETUNREACH') {
      console.error(`Network unreachable error (ENETUNREACH). This often happens with IPv6 addressing.`);
      console.error(`Suggestion: Try forcing IPv4 by setting 'family: 4' in connection options.`);
    } else if (error.code === 'ENOTFOUND') {
      console.error(`Host not found error (ENOTFOUND). Check if the database hostname is correct.`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`Connection timeout (ETIMEDOUT). The database server might be unreachable or blocked by firewall.`);
    }
    
    if (attempt < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying in ${CONNECTION_RETRY_DELAY/1000} seconds (attempt ${attempt+1}/${MAX_CONNECTION_ATTEMPTS})...`);
      await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
      return attemptDatabaseConnection(attempt + 1);
    } else {
      console.error(`❌ Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts.`);
      return false;
    }
  }
}

/**
 * Initializes the database connection and sets up tables if needed
 */
async function initializeDatabase() {
  console.log('🔌 Initializing database connection...');
  const connected = await attemptDatabaseConnection();
  
  if (connected) {
    try {
      // Check tables but do not create them
      // We assume tables already exist in production
      console.log('Checking if database tables exist...');
      
      try {
        // Just test query to the clients table
        await pool?.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'clients\')');
        console.log('Database tables exist, proceeding with application startup');
      } catch (tableError) {
        console.error("Error checking tables:", tableError);
        console.log("Tables may not exist or may have different names.");
      }
    } catch (dbError) {
      console.error("Database initialization failed:", dbError);
    }
  } else {
    console.error("DATABASE CONNECTION FAILED - Application will have limited functionality");
  }
}

// Initialize database
initializeDatabase().catch(err => {
  console.error("Database initialization failed:", err);
});

// Export pool and db, which might be null if connection failed
export { pool, db };

// Helper function to check if DB is available
export function isDatabaseAvailable(): boolean {
  return !!pool && !!db;
}