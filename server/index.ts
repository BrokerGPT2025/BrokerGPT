import 'dotenv/config'; // Load environment variables from .env file
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { supabase } from './supabase';
import { pool, isDatabaseAvailable } from './db';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Wrap in a try/catch to prevent server crashes
(async () => {
  try {
    // Check database connection
    if (isDatabaseAvailable()) {
      console.log('PostgreSQL database connection initialized successfully');
    } else {
      console.warn('PostgreSQL database not available. Using in-memory storage fallback.');
    }
    
    // Check for Supabase connection
    try {
      console.log('Connecting to Supabase with provided credentials');
      const { data, error } = await supabase.from('healthcheck').select('*').limit(1);
      if (error) throw error;
      console.log('Successfully connected to Supabase');
    } catch (error) {
      console.warn('Could not connect to Supabase. Using in-memory storage fallback.', error);
    }
    
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set. AI features will not work properly.');
    } else {
      console.log('OPENAI_API_KEY is set. AI features are enabled.');
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Server error:", err);
      // Don't throw the error - just log it
    });

    // Set up static file or dev server based on environment
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        serveStatic(app);
      }
    } catch (setupError) {
      console.error("Error setting up file serving:", setupError);
      // Fall back to minimal static serving
      try {
        const path = await import('path');
        const fs = await import('fs');
        const __dirname = process.cwd();
        
        // Try multiple static file paths
        const possiblePaths = [
          path.join(__dirname, "client/dist"),
          path.join(__dirname, "dist/public")
        ];
        
        let foundStatic = false;
        for (const staticPath of possiblePaths) {
          if (fs.existsSync(staticPath)) {
            console.log(`Serving static files from: ${staticPath}`);
            app.use(express.static(staticPath));
            foundStatic = true;
          }
        }
        
        if (!foundStatic) {
          console.warn("No static files found, API-only mode");
        }
      } catch (fallbackError) {
        console.error("Complete failure in static file serving:", fallbackError);
      }
    }

    // Use the port from environment variable or fallback to 6543
    const port = process.env.PORT ? parseInt(process.env.PORT) : 6543;
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
    });
    
    // Set up graceful shutdown handlers
    setupGracefulShutdown(server);
    
    // Helper function for graceful shutdown
    function setupGracefulShutdown(server: Server) {
      // Track connections
      let connections: Record<string, any> = {};
      let connectionCounter = 0;
      
      // Track connections
      server.on('connection', (conn) => {
        const key = `${connectionCounter++}`;
        connections[key] = conn;
        conn.on('close', () => {
          delete connections[key];
        });
      });
      
      // Handle shutdown signals
      const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2']; // SIGUSR2 is for Nodemon
      
      signals.forEach((signal) => {
        process.on(signal, () => {
          console.log(`\n${signal} received. Starting graceful shutdown...`);
          
          // Stop accepting new connections
          server.close(() => {
            console.log('HTTP server closed.');
            
            // Close database connections
            try {
              if (pool) {
                console.log('Closing database pool...');
                pool.end();
                console.log('Database pool closed.');
              }
            } catch (err) {
              console.error('Error closing database pool:', err);
            }
            
            console.log('Graceful shutdown completed.');
            process.exit(0);
          });
          
          // Force close after timeout
          setTimeout(() => {
            console.error('Forcing shutdown after timeout...');
            process.exit(1);
          }, 30000); // 30 seconds
          
          // Force close existing connections after short delay
          setTimeout(() => {
            console.log(`Closing ${Object.keys(connections).length} remaining connections...`);
            for (const key in connections) {
              connections[key].destroy();
            }
          }, 10000); // 10 seconds
        });
      });
    }
  } catch (error) {
    console.error("Critical server error:", error);
    console.log("Starting emergency fallback server...");
    
    // Create emergency Express server
    try {
      const PORT = process.env.PORT ? parseInt(process.env.PORT) : 10000;
      app.get('*', (_req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>BrokerGPT - Error Recovery</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; }
              h1 { color: #0087FF; }
            </style>
          </head>
          <body>
            <h1>BrokerGPT</h1>
            <p>The server encountered a critical error and is running in recovery mode.</p>
            <p>API endpoints are available but the full application is not loaded.</p>
          </body>
          </html>
        `);
      });
      
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[RECOVERY SERVER] Running on port ${PORT}`);
      });
    } catch (emergencyError) {
      console.error("Fatal error - could not start any server:", emergencyError);
      process.exit(1);
    }
  }
})();