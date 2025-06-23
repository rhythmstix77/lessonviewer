import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Database table names
export const TABLES = {
  ACTIVITIES: 'activities',
  LESSONS: 'lessons',
  LESSON_PLANS: 'lesson_plans',
  EYFS_STATEMENTS: 'eyfs_statements'
};

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey;
};