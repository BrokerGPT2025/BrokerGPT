// Script to populate the covertype table in Supabase
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Standard insurance types to add
const coverTypes = [
  { type: 'general liability' },
  { type: 'errors & omissions' },
  { type: 'cyber liability' },
  { type: 'workers compensation' },
  { type: 'business interruption' },
  { type: 'commercial property' },
  { type: 'directors & officers' }
];

// Insert the cover types into Supabase
async function loadCoverTypes() {
  console.log('Populating covertype table in Supabase...');
  
  // First check if the table exists, if not create it
  try {
    const { error: checkError } = await supabase
      .from('covertype')
      .select('*')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist, creating covertype table...');
      
      // Create the table using SQL (this requires special permissions)
      const { error: createError } = await supabase.rpc('create_cover_type_table');
      
      if (createError) {
        console.error('Error creating table:', createError);
        console.log('Will try to insert anyway in case the table exists with a different schema...');
      } else {
        console.log('Table created successfully');
      }
    } else {
      console.log('covertype table exists, checking if it has data...');
      
      const { data, error } = await supabase
        .from('covertype')
        .select('*');
      
      if (error) {
        console.error('Error checking table data:', error);
      } else if (data && data.length > 0) {
        console.log(`Table already has ${data.length} records:`, data);
        console.log('Clearing existing data before insert...');
        
        // Delete all existing records
        const { error: deleteError } = await supabase
          .from('covertype')
          .delete()
          .neq('id', -999); // This is a trick to delete all records
        
        if (deleteError) {
          console.error('Error deleting existing data:', deleteError);
        } else {
          console.log('Existing data cleared successfully');
        }
      } else {
        console.log('Table exists but is empty, ready for data insertion');
      }
    }
    
    // Insert the cover types
    console.log('Inserting cover types:', coverTypes);
    const { data, error } = await supabase
      .from('covertype')
      .insert(coverTypes)
      .select();
    
    if (error) {
      console.error('Error inserting cover types:', error);
    } else {
      console.log('Cover types inserted successfully:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Execute the function
loadCoverTypes().then(() => {
  console.log('Operation completed');
});