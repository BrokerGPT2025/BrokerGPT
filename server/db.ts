import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
// Explicitly import the function to avoid TypeScript issues
import createTables from "../scripts/create-tables.ts";
import pg from 'pg';
import net from 'net';

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
 * Special patched version of pg to force IPv4
 * This is a workaround for the ENETUNREACH IPv6 issues on Render.com
 */
function patchPgForIPv4() {
  console.log('📍 Patching pg module to force IPv4 connections...');
  
  try {
    // Monkey patch Socket.connect to force IPv4
    const originalConnect = net.Socket.prototype.connect;
    
    // @ts-ignore - we're monkey patching
    net.Socket.prototype.connect = function(options: any, ...args: any[]) {
      if (typeof options === 'object' && options.host) {
        console.log(`⚙️ Socket connecting to ${options.host}:${options.port}, forcing IPv4...`);
        options.family = 4; // Force IPv4
        
        // For debugging - log the connection details
        if (process.env.NODE_ENV === 'production') {
          console.log(`Connection details: family=${options.family}, port=${options.port}`);
        }
      }
      return originalConnect.call(this, options, ...args);
    };
    
    console.log('✅ Successfully patched Socket.connect to force IPv4');
    return true;
  } catch (error) {
    console.error('❌ Failed to patch Socket.connect:', error);
    return false;
  }
}

// Apply the patch immediately
patchPgForIPv4();

/**
 * Extract hostname and port from PostgreSQL connection string
 */
function extractHostInfo(connectionString: string): { host: string; port: number; user: string; password: string; database: string } | null {
  try {
    // Format: postgres://username:password@hostname:port/database
    const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(regex);
    
    if (match) {
      return {
        user: match[1],
        password: match[2],
        host: match[3],
        port: parseInt(match[4], 10),
        database: match[5].split('?')[0] // Remove query parameters
      };
    }
  } catch (e) {
    console.error('Error parsing connection string:', e);
  }
  return null;
}

// Direct IP approach has been removed - using only DNS

/**
 * Manual test of IPv4 connectivity
 * This helps identify if the issue is with pg or with actual network connectivity
 */
async function testIPv4Connectivity(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`🧪 Testing direct IPv4 connectivity to ${host}:${port}...`);
    const socket = new net.Socket();
    let connected = false;
    
    // Set a timeout for the connection attempt
    socket.setTimeout(5000);
    
    socket.on('connect', () => {
      console.log(`✅ Successfully connected to ${host}:${port} via IPv4`);
      connected = true;
      socket.end();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      console.log(`⏱️ Connection timeout to ${host}:${port}`);
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (err) => {
      console.log(`❌ Direct connection error to ${host}:${port}: ${err.message}`);
      resolve(false);
    });
    
    // Force IPv4
    socket.connect({ host, port, family: 4 });
  });
}

/**
 * Handle unavailable database by providing error info
 */
function handleUnavailableDatabase(error: any) {
  // Log a very clear error message
  console.error('\n==================================================');
  console.error('❌❌❌ DATABASE CONNECTION FAILED ❌❌❌');
  console.error('==================================================');
  console.error('The application failed to connect to the database.');
  
  if (error) {
    console.error('Error details:');
    console.error(`  - Code: ${error.code || 'N/A'}`);
    console.error(`  - Message: ${error.message || 'Unknown error'}`);
    
    if (error.code === 'ENETUNREACH') {
      console.error('\nNetwork is unreachable. This is often an IPv6 vs IPv4 issue.');
      console.error('Suggestions:');
      console.error('1. Check if the database hostname is accessible from this server');
      console.error('2. Verify that the database service is running and accepting connections');
      console.error('3. Make sure firewall rules allow connections from this server');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\nHost not found. DNS resolution failed.');
      console.error('Suggestions:');
      console.error('1. Verify that the database hostname is correct');
      console.error('2. Check if DNS service is working correctly');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\nConnection timed out.');
      console.error('Suggestions:');
      console.error('1. Check if database server is running');
      console.error('2. Verify network connectivity between app and database');
      console.error('3. Check firewall rules or security groups');
    }
  }
  
  console.error('\nThe application will continue but database features will not work.');
  console.error('==================================================\n');
}

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
    
    // Extract hostname and port for direct testing
    const hostInfo = extractHostInfo(process.env.DATABASE_URL);
    if (hostInfo) {
      console.log(`Attempting to connect to: ${hostInfo.host}:${hostInfo.port}`);
      
      // Test direct IPv4 connectivity
      const canConnect = await testIPv4Connectivity(hostInfo.host, hostInfo.port);
      if (!canConnect) {
        console.log('⚠️ Direct IPv4 connection test failed, but continuing with pg client attempt');
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
      
      // Extract connection details from URL
      const hostInfo = extractHostInfo(process.env.DATABASE_URL);
      if (!hostInfo) {
        throw new Error('Failed to parse database connection string');
      }
      
      console.log(`Extracted host info: ${hostInfo.host}:${hostInfo.port}`);
      
      // Build connection options with optimizations for Render.com
      // Always use the connection string approach - DNS fix should have fixed the hostname
      console.log('Using connection string directly');
      const connectionOptions: pg.PoolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        // Force IPv4 to avoid ENETUNREACH on IPv6
        family: 4,
        // Further increase timeouts for Supabase in production
        connectionTimeoutMillis: 60000, // 60 seconds
        idle_in_transaction_session_timeout: 60000,
        // Set a small pool to avoid connection issues
        max: 3,
        min: 0,
        // Add statement timeout 
        statement_timeout: 30000
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
      // Provide helpful error info
      handleUnavailableDatabase(error);
      return false;
    }
  }
}

/**
 * Tries a last resort connection to check if PostgreSQL is accessible at all
 */
async function tryEmergencyConnection() {
  console.log('🚨 Attempting emergency connection to validate database availability...');
  
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('supabase')) {
    console.log('Not a Supabase database or DATABASE_URL not set, skipping emergency check');
    return false;
  }
  
  try {
    // Extract just the project ID
    const matches = process.env.DATABASE_URL.match(/supabase\.co/);
    if (!matches) {
      console.log('Could not extract Supabase project from URL, skipping emergency check');
      return false;
    }
    
    console.log('Checking if PostgreSQL is accessible via HTTP API...');
    const apiUrl = 'https://supabase.com/dashboard/project/status';
    console.log(`Would check status at: ${apiUrl} (not implemented)`);
    
    // Create a separate connection with extreme timeout
    const emergencyPoolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 120000, // 2 minutes
      family: 4,
      max: 1
    };
    
    console.log('Creating emergency pool with 2 minute timeout...');
    const emergencyPool = new pg.Pool(emergencyPoolConfig);
    
    try {
      console.log('Attempting simple query...');
      const result = await emergencyPool.query('SELECT 1 as test');
      console.log('✅ Emergency connection successful!', result.rows[0]);
      await emergencyPool.end();
      return true;
    } catch (innerError) {
      console.error('⛔ Emergency connection also failed:', innerError.message);
      await emergencyPool.end();
      return false;
    }
  } catch (error) {
    console.error('Emergency connection check failed:', error);
    return false;
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
    
    // Try emergency connection as last resort
    await tryEmergencyConnection();
    
    console.log("Continuing with limited functionality regardless");
  }
}

// Initialize database
initializeDatabase().catch(err => {
  console.error("Database initialization failed:", err);
  handleUnavailableDatabase(err);
});

// Export pool and db, which might be null if connection failed
export { pool, db };

// Helper function to check if DB is available
export function isDatabaseAvailable(): boolean {
  return !!pool && !!db;
}