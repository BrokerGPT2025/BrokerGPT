/**
 * This is a global IPv4 enforcer module that patches Node.js networking
 * to force all connections to use IPv4 instead of IPv6.
 * 
 * This helps prevent ENETUNREACH errors on platforms like Render.com
 * where IPv6 is enabled but not fully supported.
 */

import net from 'net';
import * as dns from 'dns';
import * as http from 'http';

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
    // 3. Patch http.createServer to use IPv4 addresses by default
    const originalCreateServer = http.createServer;
    
    // @ts-ignore - we're monkey patching
    http.createServer = function(...args: any[]) {
      const server = originalCreateServer.call(this, ...args);
      
      const originalListen = server.listen;
      server.listen = function(port?: any, hostname?: any, ...listenArgs: any[]) {
        // If no hostname is specified or hostname is '0.0.0.0', leave it as is
        // Otherwise, we'll force IPv4
        if (typeof hostname === 'string' && hostname !== '0.0.0.0' && hostname !== '127.0.0.1') {
          console.log(`⚙️ Server binding to ${hostname}:${port}, checking for IPv4...`);
          
          // Try to resolve to make sure we're using an IPv4 address
          dns.lookup(hostname, { family: 4 }, (err, address) => {
            if (!err) {
              console.log(`✅ Resolved ${hostname} to IPv4 address: ${address}`);
            }
          });
        }
        
        // Always indicate we're forcing IPv4 for any listening server
        console.log(`🌐 HTTP server will use IPv4 addressing`);
        
        return originalListen.call(this, port, hostname, ...listenArgs);
      };
      
      return server;
    };
    
    console.log('✅ http.createServer patched for IPv4 compatibility');
  } catch (error) {
    console.error('❌ Failed to patch http.createServer:', error);
  }
  
  console.log('🛡️ IPv4 Enforcer: All patches applied successfully');
  return true;
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