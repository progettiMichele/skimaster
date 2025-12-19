import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './CompleteProfileModal.css';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onProfileCompleted: () => void;
}

export default function CompleteProfileModal({ isOpen, onClose, userId, onProfileCompleted }: CompleteProfileModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username.trim()) {
      setError('Lo username non può essere vuoto.');
      setLoading(false);
      return;
    }

    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.trim())
        .not('id', 'eq', userId) // Exclude current user's profile
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        throw checkError;
      }
      if (existingUser) {
        setError('Questo username è già in uso. Scegliere un altro.');
        setLoading(false);
        return;
      }

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: username.trim(), updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) throw updateError;

      onProfileCompleted();
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Errore durante l\'aggiornamento del profilo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal">
        <h3>Completa il tuo Profilo</h3>
        <p>Prima di iniziare, scegli uno username unico.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              className="profile-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Scegli un username"
              autoFocus
              required
            />
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Salvataggio...' : 'Salva Username'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}