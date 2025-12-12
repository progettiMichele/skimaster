import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './ModalLogin.css';

interface ModalLoginProps {
  isOpen: boolean;
  onClose: () => void; // Viene chiamato SOLO a login avvenuto
}

export default function ModalLogin({ isOpen, onClose }: ModalLoginProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  
  // Nuovi stati per i campi aggiuntivi
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- VALIDAZIONI REGISTRAZIONE ---
        if (password !== confirmPassword) {
          throw new Error("Le password non coincidono.");
        }
        if (!firstName || !lastName) {
          throw new Error("Nome e Cognome sono obbligatori.");
        }

        // --- REGISTRAZIONE CON METADATI ---
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });
        
        if (error) throw error;
        
        setMessage('Registrazione completata! Controlla la tua email.');
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // Login riuscito -> Chiude il modale e sblocca l'app
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isSignUp ? 'Nuovo Maestro' : 'Bentornato'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleAuth} className="login-form">
          
          {/* Campi visibili SOLO in fase di registrazione */}
          {isSignUp && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Nome</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder=""
                  required={isSignUp}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cognome</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder=""
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@scuolasci.it"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caratteri"
              required
              minLength={6}
            />
          </div>

          {/* Conferma Password visibile SOLO in fase di registrazione */}
          {isSignUp && (
            <div className="form-group">
              <label>Conferma Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ripeti la password"
                required={isSignUp}
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading 
              ? 'Caricamento...' 
              : (isSignUp ? 'Crea Account' : 'Accedi')
            }
          </button>
        </form>

        <div className="toggle-container">
          <p>
            {isSignUp ? "Hai già un account?" : "Non hai un account?"}
            <button 
              type="button" 
              className="btn-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp ? 'Accedi ora' : 'Registrati qui'}
            </button>
          </p>
        </div>

        {/* Abbiamo rimosso il pulsante "Chiudi" o "Annulla" per renderlo bloccante */}
      </div>
    </div>
  );
}