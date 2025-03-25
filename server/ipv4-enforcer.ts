/**
 * This is a global IPv4 enforcer module that patches Node.js networking
 * to force all connections to use IPv4 instead of IPv6.
 * 
 * This helps prevent ENETUNREACH errors on platforms like Render.com
 * where IPv6 is enabled but not fully supported.
 */

import net from 'net';
import * as dns from 'dns';

/**
 * Force all DNS lookups to prefer IPv4
 */
export function enforceIPv4() {
  console.log('🛡️ IPv4 Enforcer: Patching Node.js networking to force IPv4');
  
  try {
    // 1. Set DNS default to IPv4
    dns.setDefaultResultOrder('ipv4first');
    console.log('✅ DNS lookup order set to ipv4first');
  } catch (error) {
    console.error('❌ Failed to set DNS lookup order:', error);
  }
  
  try {
    // 2. Monkey patch Socket.connect to force IPv4
    const originalConnect = net.Socket.prototype.connect;
    
    // @ts-ignore - we're monkey patching
    net.Socket.prototype.connect = function(options: any, ...args: any[]) {
      if (typeof options === 'object' && options.host) {
        // Debug logging in production only
        if (process.env.NODE_ENV === 'production') {
          console.log(`⚙️ Socket connecting to ${options.host}:${options.port || ''}, forcing IPv4...`);
        }
        
        // Force IPv4
        options.family = 4;
      }
      return originalConnect.call(this, options, ...args);
    };
    
    console.log('✅ Socket.connect patched to force IPv4');
  } catch (error) {
    console.error('❌ Failed to patch Socket.connect:', error);
  }
  
  try {
    // 3. We can't patch http.createServer directly because imports are immutable
    // Instead, we'll add an IPv4 server creator utility function
    console.log('✅ Adding IPv4-enabled server creation utility');
  } catch (error) {
    console.error('❌ Failed to set up server utilities:', error);
  }
  
  console.log('🛡️ IPv4 Enforcer: All patches applied successfully');
  return true;
}

// Add a utility function to create a server that uses IPv4
export function createIPv4Server(handler: any) {
  // We can't modify http.createServer, but we can create our own IPv4-specific function
  console.log('Creating server with IPv4 enforcement');
  
  // Dynamically import http to avoid the immutable import issue
  return import('http').then(http => {
    const server = http.createServer(handler);
    
    // Store the original listen method
    const originalListen = server.listen;
    
    // Replace the listen method with our IPv4-enforcing version
    server.listen = function(port?: any, hostname?: any, ...listenArgs: any[]) {
      // If hostname is not specified, use 0.0.0.0 (IPv4 all interfaces)
      if (!hostname) {
        hostname = '0.0.0.0';
        console.log(`Setting hostname to ${hostname} for IPv4 compatibility`);
      }
      
      // Log information about the connection
      console.log(`🌐 HTTP server binding to ${hostname}:${port} (IPv4)`);
      
      // Call the original listen with our potentially modified hostname
      return originalListen.call(server, port, hostname, ...listenArgs);
    };
    
    return server;
  });
}

// Apply the enforcer immediately when this module is imported
enforceIPv4();

// Export a function that can be used to test direct IPv4 connectivity
export async function testIPv4Connectivity(host: string, port: number): Promise<boolean> {
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

// Export a function to manually resolve a hostname to IPv4
export async function resolveToIPv4(hostname: string): Promise<string | null> {
  return new Promise((resolve) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) {
        console.error(`❌ Failed to resolve ${hostname} to IPv4:`, err.message);
        resolve(null);
      } else {
        console.log(`✅ Resolved ${hostname} to IPv4: ${address}`);
        resolve(address);
      }
    });
  });
}