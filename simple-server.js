// Simple HTTP server using ES modules with static file diagnostics
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Function to check static files
function checkStaticFiles() {
  // Directories to check
  const directories = [
    join(__dirname, 'client', 'dist'),
    join(__dirname, 'dist', 'public')
  ];
  
  const results = [];
  
  directories.forEach(dir => {
    const dirExists = fs.existsSync(dir);
    
    const dirResult = {
      path: dir,
      exists: dirExists,
      files: []
    };
    
    if (dirExists) {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = join(dir, file);
          const stats = fs.statSync(filePath);
          dirResult.files.push({
            name: file,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modifiedTime: stats.mtime,
            path: filePath
          });
          
          // If it's a directory, check for index.html
          if (stats.isDirectory()) {
            const indexPath = join(filePath, 'index.html');
            if (fs.existsSync(indexPath)) {
              dirResult.files.push({
                name: file + '/index.html',
                exists: true,
                size: fs.statSync(indexPath).size,
                modifiedTime: fs.statSync(indexPath).mtime,
                path: indexPath,
                content: fs.readFileSync(indexPath, 'utf8').substring(0, 200) + '...' // First 200 chars
              });
            }
          }
          
          // If it's an index.html, get a preview
          if (file === 'index.html') {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              dirResult.files.push({
                name: 'index.html (content preview)',
                exists: true,
                size: stats.size,
                path: filePath,
                content: content.substring(0, 200) + '...' // First 200 chars
              });
            } catch (err) {
              dirResult.files.push({
                name: 'index.html (error reading)',
                exists: true,
                error: err.message
              });
            }
          }
        });
      } catch (err) {
        dirResult.error = err.message;
      }
    }
    
    results.push(dirResult);
  });
  
  return results;
}

// Function to serve a file
function serveFile(filePath, req, res) {
  const extname = String(extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end(`File ${filePath} not found!`);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

// HTML for the test page
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT Diagnostics</title>
  <meta http-equiv="Cache-Control" content="no-store, no-cache, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #0087FF; }
    h2 { margin-top: 30px; }
    .card { background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .time { margin-top: 20px; font-size: 14px; color: #666; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; max-height: 300px; overflow-y: auto; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; }
    .success { color: green; }
    .error { color: red; }
    .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-error { background-color: #fee2e2; color: #991b1b; }
    .badge-warning { background-color: #fef3c7; color: #92400e; }
    button { background: #0087FF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <h1>BrokerGPT Diagnostic Server</h1>
  <div class="card">
    <h2>Server Information</h2>
    <p>This page confirms the diagnostic server is running correctly.</p>
    <table>
      <tr>
        <td><strong>Node Version:</strong></td>
        <td>${process.version}</td>
      </tr>
      <tr>
        <td><strong>Platform:</strong></td>
        <td>${process.platform} (${process.arch})</td>
      </tr>
      <tr>
        <td><strong>Working Directory:</strong></td>
        <td>${process.cwd()}</td>
      </tr>
      <tr>
        <td><strong>Server Start Time:</strong></td>
        <td id="start-time"></td>
      </tr>
      <tr>
        <td><strong>Current Time:</strong></td>
        <td id="current-time"></td>
      </tr>
      <tr>
        <td><strong>Uptime:</strong></td>
        <td id="uptime"></td>
      </tr>
    </table>
    <div class="time">Page loaded at: <span id="timestamp"></span></div>
  </div>
  
  <div class="card">
    <h2>Static File Diagnostics</h2>
    <p>Checking for static files in key directories...</p>
    <div id="static-files">Loading...</div>
    <button onclick="refreshStaticFiles()" style="margin-top: 10px;">Refresh File Check</button>
  </div>
  
  <div class="card">
    <h2>Environment Variables</h2>
    <p>Sanitized environment variables (no sensitive data):</p>
    <pre id="env-vars">Loading...</pre>
  </div>

  <script>
    // Store server start time
    const serverStartTime = new Date();
    document.getElementById('start-time').textContent = serverStartTime.toLocaleString();
    document.getElementById('timestamp').textContent = new Date().toLocaleString();
    
    // Update current time and uptime every second
    setInterval(() => {
      const now = new Date();
      document.getElementById('current-time').textContent = now.toLocaleString();
      
      const uptimeMs = now - serverStartTime;
      const uptimeSec = Math.floor(uptimeMs / 1000);
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      document.getElementById('uptime').textContent = 
        \`\${hours}h \${minutes}m \${seconds}s\`;
    }, 1000);
    
    // Load static file diagnostics
    function refreshStaticFiles() {
      fetch('/api/static-files')
        .then(response => response.json())
        .then(data => {
          const container = document.getElementById('static-files');
          let html = '';
          
          data.forEach(dir => {
            const statusBadge = dir.exists 
              ? '<span class="badge badge-success">EXISTS</span>' 
              : '<span class="badge badge-error">MISSING</span>';
              
            html += \`
              <h3>\${dir.path} \${statusBadge}</h3>
            \`;
            
            if (dir.error) {
              html += \`<p class="error">Error: \${dir.error}</p>\`;
            }
            
            if (dir.exists && dir.files.length > 0) {
              html += '<table><tr><th>File</th><th>Type</th><th>Size</th><th>Modified</th></tr>';
              
              dir.files.forEach(file => {
                // Skip content preview entries as they're redundant
                if (file.name.includes('(content preview)')) return;
                
                const fileType = file.isDirectory ? 'Directory' : 'File';
                const fileSize = file.size ? (file.size < 1024 ? file.size + ' B' : 
                                            (file.size / 1024).toFixed(1) + ' KB') : '-';
                const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : '-';
                
                html += \`
                  <tr>
                    <td>\${file.name}</td>
                    <td>\${fileType}</td>
                    <td>\${fileSize}</td>
                    <td>\${modified}</td>
                  </tr>
                \`;
              });
              
              html += '</table>';
              
              // Show content previews for index.html files
              const indexFiles = dir.files.filter(f => f.content);
              if (indexFiles.length > 0) {
                html += '<h4>Content Previews:</h4>';
                
                indexFiles.forEach(file => {
                  html += \`
                    <div style="margin-bottom: 10px;">
                      <p><strong>\${file.path}</strong></p>
                      <pre>\${escapeHtml(file.content || '')}</pre>
                    </div>
                  \`;
                });
              }
            } else if (dir.exists) {
              html += '<p>No files found in this directory.</p>';
            }
          });
          
          container.innerHTML = html;
        })
        .catch(err => {
          document.getElementById('static-files').innerHTML = 
            \`<p class="error">Error fetching static file info: \${err.message}</p>\`;
        });
    }
    
    // Load environment variables
    fetch('/api/env')
      .then(response => response.json())
      .then(data => {
        document.getElementById('env-vars').textContent = JSON.stringify(data, null, 2);
      })
      .catch(err => {
        document.getElementById('env-vars').textContent = 'Error fetching environment data: ' + err.message;
      });
    
    // Initial load of static files
    refreshStaticFiles();
    
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  </script>
</body>
</html>
`;

// Server start time
const SERVER_START_TIME = new Date();

// Create server
const server = http.createServer((req, res) => {
  // Log request
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  
  // Handle API endpoints
  if (req.url === '/api/static-files') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(checkStaticFiles()));
    return;
  }
  
  if (req.url === '/api/env') {
    // Return safe environment variables (no secrets)
    const safeEnv = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      startTime: SERVER_START_TIME.toISOString(),
      uptime: process.uptime(),
      cwd: process.cwd(),
      // Add flags for specific environment variables (without values)
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasDatabase: !!process.env.DATABASE_URL,
      hasSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_KEY),
      // Memory usage
      memoryUsage: process.memoryUsage()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(safeEnv));
    return;
  }
  
  // Serve static files if requested
  if (req.url !== '/' && req.url !== '/index.html') {
    // Check if file exists in client/dist first, then in dist/public
    const clientDistPath = join(__dirname, 'client', 'dist', req.url);
    const distPublicPath = join(__dirname, 'dist', 'public', req.url);
    
    if (fs.existsSync(clientDistPath)) {
      serveFile(clientDistPath, req, res);
      return;
    } else if (fs.existsSync(distPublicPath)) {
      serveFile(distPublicPath, req, res);
      return;
    }
  }
  
  // Default: serve the diagnostic HTML
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end(htmlContent);
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
const PORT = process.env.PORT || 8080;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Diagnostic server running at http://localhost:${PORT}/`);
  console.log(`Server started at: ${SERVER_START_TIME.toISOString()}`);
  console.log('Press Ctrl+C to stop');
});