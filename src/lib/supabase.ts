import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure Supabase client with additional options for better CORS handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist auth state in embedded context
    detectSessionInUrl: false // Don't detect session from URL in embedded context
  },
  global: {
    headers: {
      'X-Client-Info': 'audio-platform-embed'
    }
  }
});