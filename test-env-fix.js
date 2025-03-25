/**
 * Tests the DNS fix for Supabase connection strings
 */

// Import the fix module
import './server/dns-fix.js';

// Display the environment variables after the fix
console.log('Database URL after fix:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'));
console.log('Supabase URL after fix:', process.env.SUPABASE_URL);