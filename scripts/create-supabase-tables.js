// Create Supabase database tables script
// Run this directly with: node scripts/create-supabase-tables.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Define table schemas
const tables = [
  {
    name: 'clients',
    columns: `
      id serial primary key,
      name text not null,
      address text,
      city text,
      province text,
      postal_code text,
      phone text,
      email text,
      business_type text,
      annual_revenue integer,
      employees integer,
      risk_profile jsonb,
      created_at timestamp default now()
    `
  },
  {
    name: 'carriers',
    columns: `
      id serial primary key,
      name text not null,
      website text,
      phone text,
      email text,
      specialties text[],
      risk_appetite jsonb,
      min_premium integer,
      max_premium integer,
      regions text[],
      business_types text[]
    `
  },
  {
    name: 'policies',
    columns: `
      id serial primary key,
      client_id integer not null,
      carrier_id integer not null,
      policy_type text not null,
      start_date timestamp not null,
      end_date timestamp not null,
      premium integer,
      status text not null,
      coverage_limits jsonb
    `
  },
  {
    name: 'chat_messages',
    columns: `
      id serial primary key,
      client_id integer,
      role text not null,
      content text not null,
      timestamp timestamp default now()
    `
  },
  {
    name: 'record_types',
    columns: `
      id serial primary key,
      name text not null,
      description text
    `
  },
  {
    name: 'client_records',
    columns: `
      id serial primary key,
      client_id integer not null,
      type text not null,
      description text,
      value text,
      date timestamp,
      created_at timestamp default now()
    `
  },
  {
    name: 'covertype',
    columns: `
      id serial primary key,
      type text not null,
      description text
    `
  }
];

// Sample data for initial setup
const sampleData = {
  clients: [
    { 
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
  covertype: [
    { type: 'General Liability', description: 'Coverage for third-party bodily injury and property damage claims' },
    { type: 'Property', description: 'Coverage for damage to business property and assets' },
    { type: 'Professional Liability', description: 'Coverage for professional errors and omissions' },
    { type: 'Cyber Liability', description: 'Coverage for data breaches and cyber attacks' },
    { type: 'Workers Compensation', description: 'Coverage for employee injuries and illnesses' }
  ],
  record_types: [
    { name: 'Property', description: 'Information about property assets' },
    { name: 'Employee', description: 'Information about employees' },
    { name: 'Vehicle', description: 'Information about vehicles' },
    { name: 'Equipment', description: 'Information about business equipment' },
    { name: 'Claim', description: 'Information about insurance claims' }
  ],
  client_records: [
    { 
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
      date: new Date().toISOString() 
    },
    { 
      client_id: 1, 
      type: 'Equipment', 
      description: 'Kitchen equipment', 
      value: JSON.stringify({
        type: 'commercial kitchen',
        value: 250000,
        year: 2020
      }),
      date: new Date().toISOString() 
    }
  ]
};

// Create tables and insert sample data
async function setupDatabase() {
  try {
    console.log('Starting Supabase table creation...');
    
    // Use Supabase's RESTful API to execute SQL
    // First check if tables exist
    const { data: existingTables, error: tableCheckError } = await supabase.rpc('get_tables');
    
    if (tableCheckError) {
      // If we can't check tables, define a custom RPC function
      console.log('Creating custom RPC function to get tables...');
      const { error: createRpcError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE OR REPLACE FUNCTION get_tables()
          RETURNS TABLE (table_name text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY SELECT tablename::text FROM pg_tables WHERE schemaname = 'public';
          END;
          $$;
        `
      });
      
      if (createRpcError) {
        console.error('Error creating RPC function:', createRpcError);
        // Fall back to direct table creation
      } else {
        const { data: tables } = await supabase.rpc('get_tables');
        console.log('Existing tables:', tables);
      }
    } else {
      console.log('Existing tables:', existingTables);
    }
    
    // Create each table if it doesn't exist
    for (const table of tables) {
      console.log(`Creating table: ${table.name}`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS ${table.name} (
            ${table.columns}
          );
        `
      });
      
      if (error) {
        console.error(`Error creating table ${table.name}:`, error);
        
        // Direct SQL approach as fallback
        const { error: directError } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', `CREATE TABLE IF NOT EXISTS ${table.name} (${table.columns});`);
        
        if (directError) {
          console.error(`Direct SQL execution also failed:`, directError);
        } else {
          console.log(`Created table ${table.name} using direct SQL`);
        }
      } else {
        console.log(`Table ${table.name} created or already exists`);
      }
    }
    
    // Insert sample data
    for (const [tableName, items] of Object.entries(sampleData)) {
      console.log(`Inserting sample data into ${tableName}`);
      
      // Check if table already has data
      const { data: existingData, error: countError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (!countError && existingData.length > 0) {
        console.log(`Table ${tableName} already has data, skipping insertion`);
        continue;
      }
      
      // Insert data
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(items);
      
      if (insertError) {
        console.error(`Error inserting data into ${tableName}:`, insertError);
      } else {
        console.log(`Successfully inserted ${items.length} rows into ${tableName}`);
      }
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase().then(() => {
  console.log('Setup completed!');
  process.exit(0);
}).catch(error => {
  console.error('Setup failed:', error);
  process.exit(1);
});