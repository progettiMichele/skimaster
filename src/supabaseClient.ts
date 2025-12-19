import { createClient } from '@supabase/supabase-js';

// Assicurati che nel tuo file .env le variabili inizino con VITE_
// Esempio: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Errore: Le variabili d\'ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devono essere definite');
  console.error('Supabase URL:', supabaseUrl ? 'Definito' : 'Mancante');
  console.error('Supabase Key:', supabaseAnonKey ? 'Definito' : 'Mancante');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variabili d\'ambiente Supabase mancanti. Controlla la configurazione su Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);