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
    // Try multiple static paths
    const possiblePaths = [
      path.resolve(__dirname, "../client/dist"),
      path.resolve(__dirname, "public"),
      path.resolve(process.cwd(), "client/dist"),
      path.resolve(process.cwd(), "dist/public")
    ];
    
    let foundStatic = false;
    
    for (const staticPath of possiblePaths) {
      if (fs.existsSync(staticPath)) {
        console.log(`Serving static files from: ${staticPath}`);
        app.use(express.static(staticPath));
        foundStatic = true;
        
        // Set up fallback to index.html for this path
        app.use("*", (req, res, next) => {
          const indexPath = path.join(staticPath, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            next();
          }
        });
      }
    }
    
    if (!foundStatic) {
      console.error("Could not find any static files to serve!");
      // Set up minimal response for all routes
      app.use("*", (_req, res) => {
        res.status(500).send(`
          <html>
            <head><title>BrokerGPT - Error</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #0087FF">BrokerGPT</h1>
              <p>The application could not find any static files to serve.</p>
              <p>Please check the build process or server logs.</p>
            </body>
          </html>
        `);
      });
    }
  } catch (error) {
    console.error("Error in serveStatic:", error);
    // Set up minimal response for all routes as a last resort
    app.use("*", (_req, res) => {
      res.status(500).send("Server error: " + error.message);
    });
  }
}