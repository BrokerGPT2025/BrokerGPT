// Production server entry point that works in both dev and production
// Bypasses Vite in production mode
import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './server/routes.js';
import fs from 'fs';

console.log(`Starting BrokerGPT in ${process.env.NODE_ENV || 'development'} mode...`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the required directories exist
const distPath = path.join(__dirname, 'client', 'dist');
try {
  if (!fs.existsSync(distPath)) {
    console.log('Creating client/dist directory...');
    fs.mkdirSync(distPath, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not check or create client/dist directory:', error);
}

// Ensure theme.json exists
const themeJsonPath = path.join(__dirname, 'theme.json');
try {
  if (!fs.existsSync(themeJsonPath)) {
    console.log('Creating default theme.json file...');
    const defaultTheme = {
      primary: "#0087FF",
      variant: "professional",
      appearance: "light",
      radius: 0.5
    };
    fs.writeFileSync(themeJsonPath, JSON.stringify(defaultTheme, null, 2));
  }
} catch (error) {
  console.warn('Warning: Could not check or create theme.json file:', error);
}

// Initialize Express
const app = express();
app.use(express.json());

// Session setup
const SessionStore = MemoryStore(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'broker-gpt-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new SessionStore({
      checkPeriod: 86400000, // 24 hours
    }),
  })
);

// Production static file serving
if (process.env.NODE_ENV === 'production') {
  console.log('Setting up static file serving from client/dist...');
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
}

// Register API routes
try {
  console.log('Registering API routes...');
  const httpServer = await registerRoutes(app);

  // Production route fallback for SPA
  if (process.env.NODE_ENV === 'production') {
    // For any other request, send the index.html file
    console.log('Setting up SPA fallback route for client-side routing...');
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    });
  }

  // Start the server
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`[${process.env.NODE_ENV || 'development'}] Server running at http://localhost:${PORT}`);
    console.log('Environment variables:');
    console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
    console.log('- OpenAI API key:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
    console.log('- Supabase URL:', process.env.SUPABASE_URL ? 'set' : 'not set');
    console.log('- Database URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}