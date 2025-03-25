/**
 * DNS Fix for Supabase
 * 
 * This module rewrites Supabase hostnames to fix DNS resolution issues
 * on Render.com and other environments.
 */

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
        console.log(`Fixing Supabase DB hostname: ${dbHost} → ${fixedHost}`);
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
          console.log(`Fixing Supabase API URL: removing db. prefix`);
        }
        return `${prefix}${projectId}${suffix}`;
      }
    }
  } catch (err) {
    console.error('Error fixing Supabase hostname:', err);
  }
  
  // If nothing matched or there was an error, return the original
  return url;
}

/**
 * Patches environment variables to fix Supabase connections
 */
export function fixSupabaseConnection() {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')) {
    const originalDbUrl = process.env.DATABASE_URL;
    const fixedDbUrl = fixSupabaseHostname(originalDbUrl);
    
    if (fixedDbUrl !== originalDbUrl) {
      console.log('Fixed DATABASE_URL for Supabase connection');
      process.env.DATABASE_URL = fixedDbUrl;
    }
  }
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.includes('supabase')) {
    const originalApiUrl = process.env.SUPABASE_URL;
    const fixedApiUrl = fixSupabaseHostname(originalApiUrl);
    
    if (fixedApiUrl !== originalApiUrl) {
      console.log('Fixed SUPABASE_URL for Supabase connection');
      process.env.SUPABASE_URL = fixedApiUrl;
    }
  }
}

// Apply the fix immediately when this module is imported
console.log('Applying Supabase DNS fix to environment variables...');
fixSupabaseConnection();
console.log('Supabase DNS fix applied. Connections should now work correctly.');