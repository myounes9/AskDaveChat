import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Basic check to ensure variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.\n",
    "Make sure you have a .env file in your project root with these values.\n",
    "URL Found:", supabaseUrl ? 'Yes' : 'No',
    "Anon Key Found:", supabaseAnonKey ? 'Yes' : 'No'
  );
  // Depending on your app structure, you might throw an error or return a null client
  // For now, we'll proceed, but calls will fail if keys are missing.
}

// Create and export the Supabase client instance
// The non-null assertion (!) assumes the check above or env setup guarantees their presence.
// Consider more robust error handling if they might truly be absent at runtime.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Log environment type based on URL
const isLocal = supabaseUrl?.includes('localhost') || supabaseUrl?.includes('127.0.0.1');
console.log(`Initializing Supabase client for: ${isLocal ? 'Local environment' : 'Hosted environment'}`);
console.log(`Supabase URL: ${supabaseUrl}`); 