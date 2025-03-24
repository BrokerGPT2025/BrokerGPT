import { createClient as supabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { carriers, clients, policies, chatMessages } from '@shared/schema';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase: any = null;
let db: any = null;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  // Create dummy client and db for fallback
  const dummyClient = {
    from: () => ({
      select: () => ({ data: [], error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  };
  
  supabase = dummyClient;
  // Set up a minimal postgres client for drizzle
  const queryClient = postgres('postgres://user:password@localhost:5432/db', { 
    max: 1,
    onnotice: () => {} 
  });
  db = drizzle(queryClient);
} else {
  try {
    console.log('Connecting to Supabase with provided credentials');
    supabase = supabaseClient(supabaseUrl, supabaseKey);
    
    // We don't use drizzle directly with supabase client
    // Instead, set db to null and we'll use the supabase client directly
    db = null;
    console.log('Successfully connected to Supabase');
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

export { supabase, db };

// Helper functions for database operations
export async function getCarriers() {
  try {
    const { data, error } = await supabase
      .from('carriers')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching carriers:', error);
    throw error;
  }
}

export async function getClientById(id: number) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching client with ID ${id}:`, error);
    throw error;
  }
}

export async function createClientRecord(client: any) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
}

export async function getClientPolicies(clientId: number) {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*, carriers(*)')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching policies for client ${clientId}:`, error);
    throw error;
  }
}

export async function saveChatMessage(message: any) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select();
    
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error saving chat message:', error);
    throw error;
  }
}

export async function getClientChatHistory(clientId: number) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching chat history for client ${clientId}:`, error);
    throw error;
  }
}

export async function getCarriersByRiskProfile(riskProfile: any) {
  try {
    // This is a simplified implementation 
    // In a real application, you would have more complex logic to match risk profiles
    const { data, error } = await supabase
      .from('carriers')
      .select('*');
    
    if (error) throw error;
    
    // Filter carriers based on the risk profile
    // This is a simplified example
    return data.filter((carrier: any) => {
      const riskAppetite = carrier.risk_appetite || {};
      
      // Example matching logic (would be more sophisticated in a real app)
      if (riskProfile.industry && riskAppetite.industries && 
          !riskAppetite.industries.includes(riskProfile.industry)) {
        return false;
      }
      
      if (riskProfile.size && riskAppetite.company_size && 
          riskProfile.size > riskAppetite.company_size.max) {
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error finding carriers by risk profile:', error);
    throw error;
  }
}

// Get all cover types directly from the covertype table
export async function getCoverTypes() {
  try {
    console.log('Fetching cover types from covertype table...');
    
    // Get data from the covertype table
    const { data: coverTypes, error } = await supabase
      .from('covertype')
      .select('id, type');
    
    if (error) {
      console.error('Error fetching from covertype table:', error);
      throw error;
    }
    
    // Map the response to match our expected format
    const formattedCoverTypes = coverTypes.map((item: any) => ({
      id: item.id,
      name: item.type,
      description: `Insurance coverage for ${item.type}`
    }));
    
    console.log('Found cover types in database:', formattedCoverTypes);
    return formattedCoverTypes;
  } catch (error) {
    console.error('Error fetching cover types:', error);
    // Return empty array instead of throwing error to prevent app crashes
    return [];
  }
}
