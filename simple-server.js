// Simple HTTP server using ES modules
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple HTML content
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Server</title>
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
    h1 { color: #333; }
    .time { margin-top: 20px; font-size: 18px; }
  </style>
</head>
<body>
  <h1>Server is working!</h1>
  <p>This page confirms the server is running correctly.</p>
  <div class="time">Page loaded at: <span id="timestamp"></span></div>
  <script>
    document.getElementById('timestamp').textContent = new Date().toLocaleTimeString();
  </script>
</body>
</html>
`;

// Create server
const server = http.createServer((req, res) => {
  // Add CORS headers to prevent caching
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(htmlContent);
  
  // Log request to console
  console.log(`[${new Date().toLocaleTimeString()}] Request received: ${req.url}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  
  if (err.code === 'EADDRINUSE') {
    console.log('Address in use, retrying in 1 second...');
    setTimeout(() => {
      server.close();
      server.listen(PORT, '0.0.0.0');
    }, 1000);
  }
});

// Set port (with fallback)
const PORT = process.env.PORT || 6543;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop');
});