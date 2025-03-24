import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
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
    
    // Check if tables exist and create them if they don't
    ensureTablesExist().catch(error => {
      console.error("Error ensuring tables exist:", error);
    });
  } else {
    console.warn("DATABASE_URL not found. The application will use in-memory storage as a fallback.");
    // The pool will remain null, and the application will use MemStorage instead
  }
} catch (error) {
  console.error("Error initializing database connection:", error);
  console.warn("The application will use in-memory storage as a fallback.");
  // The pool and db will remain null, and the application will use MemStorage instead
}

// Function to check if tables exist and create them if they don't
async function ensureTablesExist() {
  if (!db) return;
  
  try {
    // Try to query one of the tables to check if it exists
    await db.select().from(schema.clients).limit(1);
    console.log("Database tables already exist.");
  } catch (error: any) {
    // If table doesn't exist, create all tables
    if (error.message && error.message.includes('does not exist')) {
      console.log("Tables don't exist. Creating tables...");
      
      // Create tables based on schema
      const createTableQueries = [
        `CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT,
          city TEXT,
          province TEXT,
          postal_code TEXT,
          phone TEXT,
          email TEXT,
          business_type TEXT,
          annual_revenue INTEGER,
          employees INTEGER,
          risk_profile JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS carriers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          website TEXT,
          phone TEXT,
          email TEXT,
          specialties TEXT[],
          risk_appetite JSONB,
          min_premium INTEGER,
          max_premium INTEGER,
          regions TEXT[],
          business_types TEXT[]
        )`,
        `CREATE TABLE IF NOT EXISTS policies (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL,
          carrier_id INTEGER NOT NULL,
          policy_type TEXT NOT NULL,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          premium INTEGER,
          status TEXT NOT NULL,
          coverage_limits JSONB
        )`,
        `CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          client_id INTEGER,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS record_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS client_records (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          description TEXT,
          value TEXT,
          date TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )`
      ];
      
      for (const query of createTableQueries) {
        try {
          await pool!.query(query);
          console.log("Successfully created table from query:", query.substring(0, 60) + '...');
        } catch (err) {
          console.error("Error creating table:", err);
        }
      }
      
      console.log("All tables created successfully.");
    } else {
      // Some other error occurred
      console.error("Error checking if tables exist:", error);
    }
  }
}

// Export pool and db, which might be null if connection failed
export { pool, db };

// Helper function to check if DB is available
export function isDatabaseAvailable(): boolean {
  return !!pool && !!db;
}
