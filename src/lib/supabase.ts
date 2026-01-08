import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export a flag to check if Supabase is configured
// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Helper function to check Supabase connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
    if (!supabase) return false;

    try {
        const { error } = await supabase.from('universities').select('count', { count: 'exact', head: true });
        return !error;
    } catch {
        return false;
    }
};
