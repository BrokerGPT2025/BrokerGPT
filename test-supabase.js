// Simple test to check our Supabase connection and tables
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Testing Supabase connection...');
console.log('SUPABASE_URL available:', !!supabaseUrl);
console.log('SUPABASE_KEY available:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List all tables in the public schema
async function listTables() {
  try {
    console.log('Listing all tables in the public schema...');
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      
      // Try a different approach if the RPC doesn't exist
      console.log('Trying direct database access...');
      
      // Try to access common tables to see what exists
      const testTables = ['clients', 'carriers', 'covertype', 'cover_types', 'policies'];
      
      for (const tableName of testTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('count(*)', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`Table '${tableName}' exists with approximately ${data} rows`);
          } else {
            console.log(`Table '${tableName}' does not exist or is not accessible:`, error.message);
          }
        } catch (err) {
          console.log(`Error testing table '${tableName}':`, err.message);
        }
      }
    } else {
      console.log('Available tables:', data);
    }
    
    // Try to specifically check the covertype table
    try {
      console.log('Checking covertype table specifically...');
      const { data, error } = await supabase
        .from('covertype')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Error checking covertype table:', error);
      } else {
        console.log('covertype data sample:', data);
      }
    } catch (err) {
      console.error('Exception checking covertype table:', err);
    }
  } catch (err) {
    console.error('General error:', err);
  }
}

// Execute the test
listTables().then(() => {
  console.log('Test completed');
});