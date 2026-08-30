import { createClient } from '@supabase/supabase-js';

// Vos valeurs Supabase (remplacez par les vôtres si différentes)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zawszodeqcsfumrvhdco.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphd3N6b2RlcWNzZnVtcnZoZGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4ODc2MjQsImV4cCI6MjEwMjQ2MzYyNH0.RxmwMJpkJ-8UVKNtrbCeQpYW-wV8wP_7uxcoGIdgfMI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);