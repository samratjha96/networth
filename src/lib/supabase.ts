import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase = import.meta.env.VITE_USE_SUPABASE === "true";

// Only create Supabase client if explicitly enabled and configured
let supabase: any = null;

if (useSupabase) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "VITE_USE_SUPABASE is enabled but missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
  }

  // Create client with improved error handling
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { supabase };
