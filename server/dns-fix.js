/**
 * DNS Fix for Supabase
 * 
 * This module rewrites Supabase hostnames to fix DNS resolution issues
 * on Render.com and other environments.
 */

// No fs imports - we'll avoid file operations entirely

/**
 * Fixes a Supabase database hostname
 * From: db.pnikbrakkfottoylxaxy.supabase.co
 * To: pnikbrakkfottoylxaxy.supabase.co
 * 
 * @param {string} url The connection URL or Supabase URL
 * @returns {string} The fixed URL
 */
export function fixSupabaseHostname(url) {
  if (!url || !url.includes('supabase')) {
    return url;
  }
  
  try {
    // Check for a database connection string first
    if (url.includes('postgres')) {
      // This is for DATABASE_URL
      // Format: postgres://username:password@db.pnikbrakkfottoylxaxy.supabase.co:5432/postgres
      const dbMatch = url.match(/(postgres(?:ql)?:\/\/.*@)(db\.([^\.]+)\.supabase\.co)(:.+)/);
      if (dbMatch) {
        const prefix = dbMatch[1];        // postgres://username:password@
        const dbHost = dbMatch[2];        // db.pnikbrakkfottoylxaxy.supabase.co
        const projectId = dbMatch[3];     // pnikbrakkfottoylxaxy
        const suffix = dbMatch[4];        // :5432/postgres
        
        // Replace db.X.supabase.co with X.supabase.co
        const fixedHost = `${projectId}.supabase.co`;
        console.log(`[DNS-FIX] Fixing Supabase DB hostname: ${dbHost} → ${fixedHost}`);
        return `${prefix}${fixedHost}${suffix}`;
      }
    } else if (url.includes('https')) {
      // This is for SUPABASE_URL
      // Format: https://pnikbrakkfottoylxaxy.supabase.co
      // Handle if it's already correct or if it has db. prefix
      const apiMatch = url.match(/(https:\/\/)(db\.)?([^\.]+)(\.supabase\.co.*)/);
      if (apiMatch) {
        const prefix = apiMatch[1];        // https://
        const hasDbPrefix = !!apiMatch[2]; // whether it had db. prefix
        const projectId = apiMatch[3];     // pnikbrakkfottoylxaxy
        const suffix = apiMatch[4];        // .supabase.co or .supabase.co/v1/etc
        
        // Always use the format without db. prefix
        if (hasDbPrefix) {
          console.log(`[DNS-FIX] Fixing Supabase API URL: removing db. prefix from ${projectId}.supabase.co`);
          return `${prefix}${projectId}${suffix}`;
        }
      }
    }
  } catch (err) {
    console.error('[DNS-FIX] Error fixing Supabase hostname:', err);
  }
  
  // If nothing matched or there was an error, return the original
  return url;
}

/**
 * Patches environment variables to fix Supabase connections
 */
export function fixSupabaseConnection() {
  console.log('[DNS-FIX] Starting Supabase URL fix...');
  
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')) {
    const originalDbUrl = process.env.DATABASE_URL;
    
    // Extract original hostname for debugging
    const originalHostMatch = originalDbUrl.match(/@([^:]+):/);
    if (originalHostMatch && originalHostMatch[1]) {
      process.env.ORIGINAL_DB_HOSTNAME = originalHostMatch[1];
      console.log(`[DNS-FIX] Original DB hostname: ${originalHostMatch[1]}`);
    }
    
    const fixedDbUrl = fixSupabaseHostname(originalDbUrl);
    
    if (fixedDbUrl !== originalDbUrl) {
      console.log('[DNS-FIX] Fixed DATABASE_URL for Supabase connection');
      // Replace masked URL for logging
      const maskedOriginal = originalDbUrl.replace(/:[^:]*@/, ':***@');
      const maskedFixed = fixedDbUrl.replace(/:[^:]*@/, ':***@');
      console.log(`[DNS-FIX] Original: ${maskedOriginal}`);
      console.log(`[DNS-FIX] Fixed: ${maskedFixed}`);
      
      // Mark that the DNS fix was applied
      process.env.DNS_FIX_APPLIED = 'true';
      
      // Actually update the environment variable
      process.env.DATABASE_URL = fixedDbUrl;
    } else {
      console.log('[DNS-FIX] No changes needed for DATABASE_URL');
    }
  }
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('supabase')) {
    const originalApiUrl = process.env.SUPABASE_URL;
    const fixedApiUrl = fixSupabaseHostname(originalApiUrl);
    
    if (fixedApiUrl !== originalApiUrl) {
      console.log('[DNS-FIX] Fixed SUPABASE_URL for Supabase connection');
      console.log(`[DNS-FIX] Original: ${originalApiUrl}`);
      console.log(`[DNS-FIX] Fixed: ${fixedApiUrl}`);
      
      // Mark that the DNS fix was applied
      process.env.DNS_FIX_APPLIED = 'true';
      
      // Update the environment variable
      process.env.SUPABASE_URL = fixedApiUrl;
    } else {
      console.log('[DNS-FIX] No changes needed for SUPABASE_URL');
    }
  }
  
  // Set the current time when the fix was applied
  process.env.DNS_FIX_TIMESTAMP = new Date().toISOString();
  
  console.log('[DNS-FIX] Supabase URL fix completed');
}

// Apply the fix immediately when this module is imported
console.log('[DNS-FIX] Applying Supabase DNS fix to environment variables...');
fixSupabaseConnection();