import { createClient } from '@supabase/supabase-js';

// Assicurati che nel tuo file .env le variabili inizino con VITE_
// Esempio: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);