// Create database tables script
// This will be executed from index.ts

import { Pool } from '@neondatabase/serverless';

/**
 * Creates all required database tables if they don't exist
 * @param pool The PostgreSQL connection pool
 */
const createTables = async (pool: Pool | null): Promise<void> => {
  if (!pool) {
    console.log("No database pool available, skipping table creation");
    return;
  }

  try {
    console.log("Checking if tables need to be created...");
    
    // First try to query the clients table to see if it exists
    try {
      await pool.query("SELECT 1 FROM clients LIMIT 1");
      console.log("Tables already exist, skipping creation");
      return; // Tables exist, exit early
    } catch (error) {
      // Table doesn't exist, continue with creation
      console.log("Tables don't exist, creating now...");
    }

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
        await pool.query(query);
        console.log("Successfully created table from query:", query.substring(0, 60) + '...');
      } catch (err) {
        console.error("Error creating table:", err);
      }
    }
    
    console.log("All tables created successfully.");
  } catch (error) {
    console.error("Error in database table creation:", error);
  }
};

export default createTables;