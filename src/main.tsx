import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

// Verifica variabili d'ambiente prima di renderizzare
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; max-width: 600px; margin: 50px auto;">
      <h1 style="color: #e74c3c;">⚠️ Errore di Configurazione</h1>
      <p>Le variabili d'ambiente Supabase non sono configurate correttamente.</p>
      <p><strong>Variabili mancanti:</strong></p>
      <ul>
        ${!supabaseUrl ? '<li>VITE_SUPABASE_URL</li>' : ''}
        ${!supabaseAnonKey ? '<li>VITE_SUPABASE_ANON_KEY</li>' : ''}
      </ul>
      <p>Per risolvere:</p>
      <ol>
        <li>Vai su Vercel Dashboard → Il tuo progetto → Settings → Environment Variables</li>
        <li>Aggiungi le variabili <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code></li>
        <li>Redeploya l'applicazione</li>
      </ol>
    </div>
  `;
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
