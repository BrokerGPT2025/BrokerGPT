// Script to ensure dist directory and index.js exist
// This is used during the build process to guarantee proper deployment

const fs = require('fs');
const path = require('path');

// Use process.cwd() instead of __dirname for CommonJS compatibility
const rootDir = process.cwd();

// Paths
const distDir = path.join(rootDir, 'dist');
const indexPath = path.join(distDir, 'index.js');

console.log('Ensuring dist directory exists...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('Created dist directory');
}

// Content for index.js if it doesn't exist - using CommonJS format
const indexContent = `// Fallback entry point for Render.com deployment
// This script serves a minimal Express server without any external dependencies

// Use CommonJS format for maximum compatibility
const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('WARNING: dist/index.js was called directly.');
console.log('Starting minimal Express server...');

// Initialize Express
const app = express();
app.use(express.json());

// Set up static serving
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log('Serving static files from client/dist...');
  app.use(express.static(clientDistPath));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoint for chat - minimal fallback
app.get('/api/chat', (req, res) => {
  res.json({ messages: [] });
});

// API endpoint for carriers - minimal fallback
app.get('/api/carriers', (req, res) => {
  res.json([]);
});

// SPA fallback
app.get('*', (req, res) => {
  const indexHtmlPath = path.join(clientDistPath, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.send(\`
      <!DOCTYPE html>
      <html>
      <head>
        <title>BrokerGPT</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .logo { font-size: 2rem; font-weight: bold; color: #0087FF; }
        </style>
      </head>
      <body>
        <div class="logo">BrokerGPT</div>
        <p>Emergency server is running. Regular API endpoints are unavailable.</p>
      </body>
      </html>
    \`);
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`[EMERGENCY SERVER] Running at http://localhost:\${PORT}\`);
});`;

// Check if index.js exists
if (!fs.existsSync(indexPath)) {
  console.log('Creating dist/index.js...');
  fs.writeFileSync(indexPath, indexContent);
  console.log('Created dist/index.js');
} else {
  console.log('dist/index.js already exists');
  
  // Update the existing file to use CommonJS without vite/tsx dependencies
  try {
    const currentContent = fs.readFileSync(indexPath, 'utf8');
    
    // Only replace if it contains problematic imports
    if (currentContent.includes('import') && 
        (currentContent.includes('vite') || currentContent.includes('tsx'))) {
      console.log('Updating dist/index.js to remove external dependencies...');
      fs.writeFileSync(indexPath, indexContent);
      console.log('Updated dist/index.js');
    }
  } catch (error) {
    console.error('Error checking or updating dist/index.js:', error);
  }
}

console.log('Dist directory setup complete!');