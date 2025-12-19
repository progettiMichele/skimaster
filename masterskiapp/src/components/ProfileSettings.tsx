import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './ModalLogin.css'; // Ricicliamo lo stile del modale login che è bello

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  session: { user: { id: string } } | null;
}

export default function ProfileSettings({ isOpen, onClose, session }: ProfileSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [bio, setBio] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('nome, cognome, instagram, facebook, bio')
      .eq('id', session.user.id)
      .single();

    if (data && !error) {
      setNome(data.nome || '');
      setCognome(data.cognome || '');
      setInstagram(data.instagram || '');
      setFacebook(data.facebook || '');
      setBio(data.bio || '');
    }
    setLoading(false);
  }, [session]);

  // Quando apro il modale, scarico i dati attuali
  useEffect(() => {
    if (isOpen && session) {
      fetchProfile();
    }
  }, [isOpen, session, fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);

    const updates = {
      id: session.user.id,
      nome,
      cognome,
      instagram,
      facebook,
      bio,
      updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      alert('Errore nel salvataggio!');
    } else {
      alert('Profilo aggiornato!');
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Il tuo Profilo Pubblico</h2>
        
        <form onSubmit={handleSave} className="login-form">
          
          <div className="form-group">
            <label>Nome e Cognome</label>
            <div style={{display: 'flex', gap: '10px'}}>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" />
              <input value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Cognome" />
            </div>
          </div>

          <div className="form-group">
            <label>Bio (Titoli, località, specialità)</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)} 
              placeholder="Es. Maestro Snowboard Freestyle - Dolomiti"
              rows={2}
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
            />
          </div>

          <div className="form-group">
            <label>Instagram (Nome Utente)</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <span style={{fontSize: '1.2rem'}}>📸</span>
              <input 
                value={instagram} 
                onChange={e => setInstagram(e.target.value)} 
                placeholder="es. mariorossi_ski" 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Facebook (Link o Nome)</label>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
              <span style={{fontSize: '1.2rem'}}>📘</span>
              <input 
                value={facebook} 
                onChange={e => setFacebook(e.target.value)} 
                placeholder="es. Mario Rossi Maestro" 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
          
          <button type="button" onClick={onClose} className="btn-secondary">
            Chiudi
          </button>
        </form>
      </div>
    </div>
  );
}