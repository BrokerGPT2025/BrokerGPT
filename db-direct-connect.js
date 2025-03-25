/**
 * Direct Database Connection Tester for Debugging
 * 
 * This script establishes direct database connections using IP addresses
 * to bypass DNS resolution issues that might lead to IPv6 ENETUNREACH errors.
 */

import pg from 'pg';
import dns from 'dns';
import net from 'net';
import fs from 'fs';

// Force IPv4 for all DNS lookups and connections
dns.setDefaultResultOrder('ipv4first');

// Monkey patch Socket.connect to force IPv4
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(options, ...args) {
  if (typeof options === 'object' && options.host) {
    console.log(`Socket connecting to ${options.host}:${options.port || ''}, forcing IPv4...`);
    options.family = 4; // Force IPv4
  }
  return originalConnect.call(this, options, ...args);
};

// Known Supabase IP addresses
const SUPABASE_IPS = [
  '104.18.38.10',   // Primary IP from nslookup
  '172.64.149.246', // Secondary IP from nslookup
  '45.8.126.7'      // Another common Supabase IP
];

// Function to parse a PostgreSQL connection string
function parseConnectionString(connectionString) {
  try {
    // Format: postgres://username:password@hostname:port/database
    const regex = /postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = connectionString.match(regex);
    
    if (match) {
      return {
        user: match[1],
        password: match[2], 
        host: match[3],
        port: parseInt(match[4]),
        database: match[5].split('?')[0], // Remove query parameters
        // Extract SSL mode if present
        ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      };
    }
  } catch (err) {
    console.error('Error parsing connection string:', err);
  }
  
  return null;
}

// Function to test connection with an IP address directly
async function testDirectConnection(config, ip) {
  // Create a modified config that uses IP address instead of hostname
  const directConfig = {
    ...config,
    host: ip
  };
  
  // For SSL
  if (process.env.NODE_ENV === 'production') {
    directConfig.ssl = { rejectUnauthorized: false };
  }
  
  console.log(`Testing direct connection to IP: ${ip} for database ${config.database}`);
  
  try {
    // Create a client with the IP-based config
    const client = new pg.Client(directConfig);
    
    // Connect to the database
    await client.connect();
    console.log(`✅ Successfully connected to ${config.database} via IP ${ip}`);
    
    // Test with a simple query
    const result = await client.query('SELECT NOW() as time');
    console.log(`✅ Query successful! Server time: ${result.rows[0].time}`);
    
    // Close the connection
    await client.end();
    
    // Write the working IP to a file for future use
    try {
      fs.writeFileSync('./working-db-ip.txt', ip);
      console.log(`✅ Saved working IP ${ip} to working-db-ip.txt`);
    } catch (writeErr) {
      console.error('Could not save working IP:', writeErr);
    }
    
    return true;
  } catch (err) {
    console.error(`❌ Failed to connect to ${ip}:`, err.message);
    return false;
  }
}

// Main function to test all connections
async function testAllConnections() {
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    return false;
  }
  
  console.log('DATABASE_URL is defined, attempting to parse...');
  
  // Parse the connection string
  const config = parseConnectionString(process.env.DATABASE_URL);
  if (!config) {
    console.error('Failed to parse DATABASE_URL');
    return false;
  }
  
  console.log(`Parsed connection string for database: ${config.database} at host: ${config.host}`);
  
  // First try the original hostname
  console.log(`\nTesting connection with original hostname: ${config.host}`);
  try {
    const client = new pg.Client({
      ...config,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      family: 4 // Force IPv4
    });
    
    await client.connect();
    console.log(`✅ Successfully connected using original hostname`);
    
    const result = await client.query('SELECT NOW() as time');
    console.log(`✅ Query successful! Server time: ${result.rows[0].time}`);
    
    await client.end();
    return true;
  } catch (err) {
    console.error(`❌ Failed to connect using hostname:`, err.message);
    
    // Start trying IPs if hostname failed
    console.log('\nTrying direct IP connections:');
    
    // Try previously working IP first if available
    try {
      if (fs.existsSync('./working-db-ip.txt')) {
        const savedIp = fs.readFileSync('./working-db-ip.txt', 'utf8').trim();
        console.log(`Found previously working IP: ${savedIp}`);
        
        if (await testDirectConnection(config, savedIp)) {
          console.log(`✅ Successfully connected using saved IP: ${savedIp}`);
          return true;
        }
      }
    } catch (readErr) {
      console.error('Error reading saved IP file:', readErr);
    }
    
    // Try each known Supabase IP
    for (const ip of SUPABASE_IPS) {
      if (await testDirectConnection(config, ip)) {
        console.log(`✅ Successfully connected using IP: ${ip}`);
        return true;
      }
    }
    
    console.error('❌ All connection attempts failed');
    return false;
  }
}

// Run the tests
console.log('Starting direct database connection tests...');
testAllConnections()
  .then(success => {
    if (success) {
      console.log('\n✅ Found a working database connection!');
      process.exit(0);
    } else {
      console.error('\n❌ All database connection attempts failed');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error in connection testing:', err);
    process.exit(1);
  });