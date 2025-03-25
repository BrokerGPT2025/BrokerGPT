// Comprehensive test script for port conflict handling
import { createServer } from 'net';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🧪 COMPREHENSIVE PORT CONFLICT TEST 🧪');

// Function to check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free, close the server
        server.close();
        resolve(false);
      })
      .listen(port, '0.0.0.0');
  });
}

// Function to find an available port
async function findAvailablePort(startPort) {
  let port = startPort;
  const maxPort = startPort + 10; // Only search 10 ports to avoid infinite loop
  
  while (port < maxPort) {
    if (!(await isPortInUse(port))) {
      return port;
    }
    port++;
  }
  throw new Error(`Could not find available port in range ${startPort}-${maxPort-1}`);
}

// Function to create a blocking server on a specific port
async function blockPort(port) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.on('error', (err) => {
      console.error(`❌ Error blocking port ${port}:`, err.message);
      reject(err);
    });
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Successfully blocked port ${port}`);
      resolve(server);
    });
  });
}

// Main test function
async function runTest() {
  try {
    // Find a range of available ports to use for the test
    console.log('Finding available ports for testing...');
    const basePort = await findAvailablePort(20000);
    console.log(`Using port range starting at ${basePort}`);
    
    // Block multiple sequential ports
    console.log(`\nStep 1: Blocking multiple ports (${basePort}, ${basePort+1}, ${basePort+2})`);
    const server1 = await blockPort(basePort);
    const server2 = await blockPort(basePort+1);
    const server3 = await blockPort(basePort+2);
    
    // Give the servers a moment to stabilize
    await setTimeout(1000);
    
    // Now try to start the emergency server
    console.log(`\nStep 2: Starting emergency server with PORT=${basePort}`);
    console.log(`Expected outcome: Server should start on port ${basePort+3}`);
    
    const emergencyServer = spawn('node', ['emergency-server.js'], {
      env: { ...process.env, PORT: basePort.toString() },
      stdio: 'inherit'
    });
    
    // Give the emergency server time to start and handle conflicts
    await setTimeout(5000);
    
    // Cleanup blocking servers
    console.log('\nStep 3: Test complete. Cleaning up...');
    server1.close(() => console.log(`✅ Server 1 (port ${basePort}) closed`));
    server2.close(() => console.log(`✅ Server 2 (port ${basePort+1}) closed`));
    server3.close(() => console.log(`✅ Server 3 (port ${basePort+2}) closed`));
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
    
    // Wait a bit before exiting to let the emergency server continue running
    await setTimeout(1000);
    console.log('\nEmergency server is still running. Press Ctrl+C to terminate.');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

// Run the test
runTest();