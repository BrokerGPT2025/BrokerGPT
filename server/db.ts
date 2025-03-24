import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
let db: any = null;

try {
  if (process.env.DATABASE_URL) {
    console.log("Initializing PostgreSQL database connection...");
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("PostgreSQL database connection initialized successfully");
  } else {
    console.warn("DATABASE_URL not found. The application will use in-memory storage as a fallback.");
    // The pool will remain null, and the application will use MemStorage instead
  }
} catch (error) {
  console.error("Error initializing database connection:", error);
  console.warn("The application will use in-memory storage as a fallback.");
  // The pool and db will remain null, and the application will use MemStorage instead
}

// Export pool and db, which might be null if connection failed
export { pool, db };

// Helper function to check if DB is available
export function isDatabaseAvailable(): boolean {
  return !!pool && !!db;
}
