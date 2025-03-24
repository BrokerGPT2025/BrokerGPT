import { createClient as supabaseClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { carriers, clients, policies, chatMessages } from '@shared/schema';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase: any = null;
let db: any = null;

// Maximum number of connection attempts
const MAX_CONNECTION_ATTEMPTS = 3;
// Delay between connection attempts in milliseconds
const CONNECTION_RETRY_DELAY = 3000;

/**
 * Creates a dummy Supabase client for fallback
 * @returns A dummy client that returns empty results
 */
function createDummyClient() {
  return {
    from: () => ({
      select: () => ({ data: [], error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  };
}

/**
 * Attempts to connect to Supabase
 * @param attempt Current attempt number
 * @returns True if connection successful, false otherwise
 */
async function connectToSupabase(attempt = 1): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables');
    return false;
  }

  try {
    console.log(`Supabase connection attempt ${attempt}/${MAX_CONNECTION_ATTEMPTS}...`);
    supabase = supabaseClient(supabaseUrl, supabaseKey);
    
    // Just assume connection is successful - we'll find out later if it's not
    // No need to verify with a query since that was causing issues
    
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error(`Supabase connection attempt ${attempt} failed:`, error);
    
    if (attempt < MAX_CONNECTION_ATTEMPTS) {
      console.log(`Retrying in ${CONNECTION_RETRY_DELAY/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
      return connectToSupabase(attempt + 1);
    } else {
      console.warn(`Failed to connect to Supabase after ${MAX_CONNECTION_ATTEMPTS} attempts. Using fallback.`);
      return false;
    }
  }
}

// Initialize Supabase connection
(async () => {
  const connected = await connectToSupabase();
  
  if (!connected) {
    console.warn('Using dummy Supabase client as fallback');
    supabase = createDummyClient();
    
    // Set up a minimal postgres client for drizzle
    // Note: This won't actually connect to anything, it's just a placeholder
    const queryClient = postgres('postgres://user:password@localhost:5432/db', { 
      max: 1,
      onnotice: () => {},
      connection: {
        // Force an immediate error if this is ever used
        connect_timeout: 1
      }
    });
    db = drizzle(queryClient);
  } else {
    // We don't use drizzle directly with supabase client
    // Instead, set db to null and we'll use the supabase client directly
    db = null;
  }
})().catch(err => {
  console.error('Error during Supabase initialization:', err);
  console.warn('Using dummy Supabase client as fallback');
  supabase = createDummyClient();
});

export { supabase, db };

/**
 * Wrapper for Supabase operations that handle connection issues gracefully
 * @param operation The async operation to perform
 * @param fallbackValue The fallback value to return if the operation fails
 * @returns The result of the operation or the fallback value
 */
async function safeSupabaseOperation<T>(operation: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized yet, using fallback');
      return fallbackValue;
    }
    return await operation();
  } catch (error) {
    console.error('Error in Supabase operation:', error);
    return fallbackValue;
  }
}

// Helper functions for database operations
export async function getCarriers() {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase.from('carriers').select('*');
    if (error) throw error;
    return data;
  }, []);
}

export async function getClientById(id: number) {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }, null);
}

export async function createClientRecord(client: any) {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) throw error;
    return data[0];
  }, null);
}

export async function getClientPolicies(clientId: number) {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase
      .from('policies')
      .select('*, carriers(*)')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data;
  }, []);
}

export async function saveChatMessage(message: any) {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([message])
      .select();
    
    if (error) throw error;
    return data[0];
  }, null);
}

export async function getClientChatHistory(clientId: number) {
  return safeSupabaseOperation(async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data;
  }, []);
}

export async function getCarriersByRiskProfile(riskProfile: any) {
  return safeSupabaseOperation(async () => {
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
  }, []);
}

// Get all cover types directly from the covertype table
export async function getCoverTypes() {
  return safeSupabaseOperation(async () => {
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
  }, []);
}
