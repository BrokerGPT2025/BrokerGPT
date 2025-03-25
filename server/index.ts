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
      
      // Set up basic API routes with in-memory fallback data
      setupFallbackData(app);
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

// Set up fallback data for when database connection fails
function setupFallbackData(app: any) {
  console.log('Setting up in-memory fallback data and routes');
  
  // Fallback data
  const fallbackData = {
    clients: [
      { 
        id: 1, 
        name: 'Chicko Chicken Ltd', 
        address: '123 Main St', 
        city: 'Vancouver', 
        province: 'BC', 
        postal_code: 'V6B 1G1', 
        phone: '604-555-1234', 
        email: 'info@chickochicken.com', 
        business_type: 'Restaurant', 
        annual_revenue: 1500000, 
        employees: 25,
        risk_profile: { industry_risk: 'medium', claims_history: 'low' }
      },
      { 
        id: 2, 
        name: 'Tech Innovations Inc', 
        address: '456 Tech Ave', 
        city: 'Toronto', 
        province: 'ON', 
        postal_code: 'M5V 2N4', 
        phone: '416-555-9876', 
        email: 'hello@techinnovations.ca', 
        business_type: 'Technology', 
        annual_revenue: 5000000, 
        employees: 42,
        risk_profile: { industry_risk: 'low', claims_history: 'none' }
      }
    ],
    carriers: [
      {
        id: 1,
        name: 'Acme Insurance',
        website: 'https://acmeinsurance.example',
        phone: '1-800-555-1234',
        email: 'info@acmeinsurance.example',
        specialties: ['Property', 'General Liability', 'Professional Liability'],
        risk_appetite: { industries: ['Technology', 'Retail', 'Professional Services'], max_revenue: 10000000 },
        min_premium: 1000,
        max_premium: 50000,
        regions: ['Alberta', 'British Columbia', 'Ontario'],
        business_types: ['Technology', 'Professional Services', 'Retail']
      },
      {
        id: 2,
        name: 'SafeGuard Insurance Co',
        website: 'https://safeguard.example',
        phone: '1-877-555-9876',
        email: 'info@safeguard.example',
        specialties: ['Workers Compensation', 'Auto', 'General Liability'],
        risk_appetite: { industries: ['Construction', 'Manufacturing', 'Transportation'], max_revenue: 25000000 },
        min_premium: 2500,
        max_premium: 100000,
        regions: ['All Canada'],
        business_types: ['Construction', 'Manufacturing', 'Transportation']
      }
    ],
    coverTypes: [
      { id: 1, name: 'General Liability', description: 'Coverage for third-party bodily injury and property damage claims' },
      { id: 2, name: 'Property', description: 'Coverage for damage to business property and assets' },
      { id: 3, name: 'Professional Liability', description: 'Coverage for professional errors and omissions' },
      { id: 4, name: 'Cyber Liability', description: 'Coverage for data breaches and cyber attacks' },
      { id: 5, name: 'Workers Compensation', description: 'Coverage for employee injuries and illnesses' }
    ],
    recordTypes: [
      { id: 1, name: 'Property', description: 'Information about property assets' },
      { id: 2, name: 'Employee', description: 'Information about employees' },
      { id: 3, name: 'Vehicle', description: 'Information about vehicles' },
      { id: 4, name: 'Equipment', description: 'Information about business equipment' },
      { id: 5, name: 'Claim', description: 'Information about insurance claims' }
    ],
    clientRecords: [
      { 
        id: 1, 
        client_id: 1, 
        type: 'Property', 
        description: 'Main restaurant location', 
        value: JSON.stringify({
          address: '123 Main St, Vancouver, BC',
          size: '2500 sq ft',
          construction: 'concrete',
          year_built: 1998,
          fire_protection: 'sprinklers'
        }),
        date: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      { 
        id: 2, 
        client_id: 1, 
        type: 'Equipment', 
        description: 'Kitchen equipment', 
        value: JSON.stringify({
          type: 'commercial kitchen',
          value: 250000,
          year: 2020
        }),
        date: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ],
    chat_messages: []
  };
  
  // Set up direct API routes that bypass the database
  app.get('/api/clients', (_req: any, res: any) => {
    console.log('Using fallback clients data');
    res.json(fallbackData.clients);
  });
  
  app.get('/api/clients/:id', (req: any, res: any) => {
    const clientId = parseInt(req.params.id);
    const client = fallbackData.clients.find(c => c.id === clientId);
    if (client) {
      console.log(`Using fallback data for client ${clientId}`);
      res.json(client);
    } else {
      res.status(404).json({ error: 'Client not found' });
    }
  });
  
  app.get('/api/carriers', (_req: any, res: any) => {
    console.log('Using fallback carriers data');
    res.json(fallbackData.carriers);
  });
  
  app.get('/api/cover-types', (_req: any, res: any) => {
    console.log('Database not available, using fallback cover types data');
    res.json(fallbackData.coverTypes);
  });
  
  app.get('/api/record-types', (_req: any, res: any) => {
    console.log('Using fallback record types data');
    res.json(fallbackData.recordTypes);
  });
  
  app.get('/api/clients/:id/records', (req: any, res: any) => {
    const clientId = parseInt(req.params.id);
    const records = fallbackData.clientRecords.filter(r => r.client_id === clientId);
    console.log(`Using fallback records data for client ${clientId}`);
    res.json(records);
  });
  
  app.get('/api/chat/:clientId', (req: any, res: any) => {
    console.log('Using fallback chat data');
    res.json({ messages: [] });
  });
  
  // Add more API routes as needed
  
  console.log('Fallback routes set up successfully');
}