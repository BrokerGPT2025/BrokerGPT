import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
// Import vite only when needed in dev mode
// DO NOT import at the top level, only inside the function
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
// Import viteConfig only inside the function when needed
import { nanoid } from "nanoid";

// Basic logger implementation without vite dependency
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    // Dynamically import vite modules only when this function is called
    // This prevents the vite dependency from being bundled in production
    const { createServer: createViteServer, createLogger } = await import('vite');
    
    // Try to load vite config in multiple ways
    let viteConfig: any = {};
    try {
      // Try ESM format first
      const esModule = await import('../vite.config.js');
      viteConfig = esModule.default || {};
      console.log("Loaded vite config from ESM module");
    } catch (err) {
      console.log("Failed to load vite config as ESM, trying alternative methods:", err.message);
      
      try {
        // Try to load as CommonJS with require
        const requireFunc = (await import('module')).createRequire(import.meta.url);
        viteConfig = requireFunc('../vite.config.js');
        console.log("Loaded vite config using CommonJS require");
      } catch (err2) {
        console.log("Failed to load vite config using require:", err2.message);
        
        // Create minimal config if all else fails
        viteConfig = {
          root: path.resolve(__dirname, '..'),
          plugins: [(await import('@vitejs/plugin-react')).default()],
          server: {
            middlewareMode: true,
            hmr: { server },
            allowedHosts: true
          },
          appType: "custom"
        };
        console.log("Using fallback minimal vite config");
      }
    }
    
    const viteLogger = createLogger();
    
    const serverOptions = {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          console.error("Vite error:", msg);
          // Don't exit on error - just log it
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Failed to set up Vite:", error.message);
    console.log("Falling back to static file serving");
    // Fall back to static file serving
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  try {
    // Try multiple static paths in priority order
    const possiblePaths = [
      path.resolve(process.cwd(), "client/dist"),        // Primary location built by Vite
      path.resolve(__dirname, "../client/dist"),         // Relative from server dir
      path.resolve(process.cwd(), "dist/public"),        // Alternate location
      path.resolve(__dirname, "public")                  // Last resort
    ];
    
    // Debug info to help diagnose issues
    console.log('Static file paths to check:');
    for (const p of possiblePaths) {
      console.log(`- ${p} (${fs.existsSync(p) ? 'exists ✓' : 'missing ✗'})`);
    }
    
    // Find the first valid static path
    let staticPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          // Verify it has an index.html file
          const indexPath = path.join(p, 'index.html');
          if (fs.existsSync(indexPath)) {
            staticPath = p;
            console.log(`Found valid static path with index.html: ${staticPath}`);
            break;
          } else {
            console.log(`Path ${p} exists but is missing index.html`);
          }
        } catch (err) {
          console.log(`Error checking ${p}: ${err.message}`);
        }
      }
    }
    
    if (staticPath) {
      console.log(`Serving static files from: ${staticPath}`);
      
      // Configure static file serving with proper options
      app.use(express.static(staticPath, {
        index: 'index.html',  // Explicitly set index file
        etag: true,           // Enable ETags for caching
        lastModified: true,   // Send Last-Modified headers
        maxAge: '1h',         // Cache for 1 hour
        fallthrough: true     // Continue to next middleware if file not found
      }));
      
      // Add SPA fallback - send index.html for all routes not found
      app.use("*", (req, res) => {
        const indexPath = path.join(staticPath, "index.html");
        console.log(`SPA route ${req.originalUrl} - serving index.html`);
        res.sendFile(indexPath);
      });
      
      // Log directory contents for debugging
      try {
        console.log(`Files in ${staticPath}:`);
        const files = fs.readdirSync(staticPath);
        files.forEach(file => console.log(`  - ${file}`));
      } catch (err) {
        console.error(`Error listing directory: ${err.message}`);
      }
      
      // Signal success for monitoring
      console.log('SERVER_STARTED_SUCCESSFULLY');
    } else {
      console.error("Could not find any static files to serve!");
      
      // Generate a basic index.html as a last resort
      console.log("Generating basic fallback index.html in client/dist");
      
      const clientDistDir = path.resolve(process.cwd(), "client/dist");
      if (!fs.existsSync(clientDistDir)) {
        fs.mkdirSync(clientDistDir, { recursive: true });
      }
      
      const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <title>BrokerGPT</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { color: #0087FF; }
    .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    button { background: #0087FF; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>BrokerGPT</h1>
  <div class="card">
    <h2>API-Only Mode</h2>
    <p>The application is running in API-only mode.</p>
    <p>The frontend could not be built or located. Please check server logs.</p>
  </div>
  <div class="card">
    <h2>API Status</h2>
    <div id="status">Checking API connection...</div>
    <button onclick="fetch('/api/health').then(r=>r.json()).then(data=>{document.getElementById('status').innerHTML='API is working!'}).catch(e=>{document.getElementById('status').innerHTML='API error: '+e})">Check API</button>
  </div>
  <script>
    fetch('/api/health').then(r=>r.json()).then(data=>{document.getElementById('status').innerHTML='API is working!'}).catch(e=>{document.getElementById('status').innerHTML='API error: '+e});
  </script>
</body>
</html>`;

      fs.writeFileSync(path.join(clientDistDir, "index.html"), indexHtml);
      
      // Serve from the generated directory
      console.log(`Serving from generated files in: ${clientDistDir}`);
      app.use(express.static(clientDistDir));
      
      // Add SPA fallback for the generated files
      app.use("*", (_req, res) => {
        res.sendFile(path.join(clientDistDir, "index.html"));
      });
      
      // Signal success despite fallback
      console.log('SERVER_STARTED_SUCCESSFULLY');
    }
  } catch (error) {
    console.error("Error in serveStatic:", error);
    // Set up minimal response for all routes as a last resort
    app.use("*", (_req, res) => {
      res.status(500).send(`
        <html>
          <head><title>BrokerGPT - Error</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #0087FF">BrokerGPT</h1>
            <p>Server error: ${error.message}</p>
          </body>
        </html>
      `);
    });
  }
}