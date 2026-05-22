import { createClient } from '@supabase/supabase-js';

// Default values as active fallbacks if environment variables are not injected/present
const defaultUrl = 'https://gwyfdkcaklvxdhuokdel.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eWZka2Nha2x2eGRodW9rZGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MTE1ODcsImV4cCI6MjA5NDk4NzU4N30.3p7O3PCC97fm82LfO_uW1Yjafuw5lcZQRFMR7G19R00';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

