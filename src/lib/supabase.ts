import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nsgucgicmfrudzedynuj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZ3VjZ2ljbWZydWR6ZWR5bnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjQ0MDUsImV4cCI6MjA4MzM0MDQwNX0.rimJyQRa7xnIVgxSVc5CR3hevzTfWwI0UW-Hy_w1hMM';

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
