import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import './ClientsList.css';

// Interfaccia per la singola lezione (Row del database)
interface Lesson {
  id: string;
  created_at: string;
  nome_cliente: string;
  cognome_cliente: string;
  data_lezione: string;
  ora_inizio: string | null;
  durata_ore: number;
  voto_obiettivi: number | null;
  note: string | null;
}

// Interfaccia per il Cliente Raggruppato
interface ClientStats {
  id: string; // key univoca (nome-cognome)
  nome: string;
  cognome: string;
  oreTotali: number;
}

interface ClientsListProps {
  onBack: () => void; // Torna alla Home
}

export default function ClientsList({ onBack }: ClientsListProps) {
  // STATI DATI
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [clients, setClients] = useState<ClientStats[]>([]);
  const [loading, setLoading] = useState(true);

  // STATI NAVIGAZIONE INTERNA
  // view: 'list' (tutti i clienti) | 'client-history' (lezioni di un cliente) | 'lesson-detail' (singola lezione)
  const [view, setView] = useState<'list' | 'client-history' | 'lesson-detail'>('list');
  
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Scarichiamo TUTTE le lezioni (ci serviranno per i dettagli)
      const { data, error } = await supabase
        .from('lezioni_sci')
        .select('*')
        .eq('user_id', user.id)
        .order('data_lezione', { ascending: false }); // Dal più recente

      if (error) throw error;
      if (!data) return;

      setAllLessons(data as Lesson[]);

      // Calcoliamo i clienti unici per la vista principale
      const clientsMap = new Map<string, ClientStats>();

      data.forEach((l: Lesson) => {
        const key = `${l.nome_cliente}-${l.cognome_cliente}`.toLowerCase();
        
        if (!clientsMap.has(key)) {
          clientsMap.set(key, {
            id: key,
            nome: l.nome_cliente,
            cognome: l.cognome_cliente,
            oreTotali: 0,
          });
        }
        clientsMap.get(key)!.oreTotali += Number(l.durata_ore);
      });

      setClients(Array.from(clientsMap.values()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS NAVIGAZIONE ---

  // 1. Clicco su un cliente -> Vado alla lista delle sue lezioni
  const handleClientClick = (clientKey: string) => {
    setSelectedClientKey(clientKey);
    setView('client-history');
  };

  // 2. Clicco su una lezione -> Vado al dettaglio
  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setView('lesson-detail');
  };

  // 3. Torna Indietro (Gestione livelli)
  const handleInternalBack = () => {
    if (view === 'lesson-detail') {
      setView('client-history'); // Torna alla lista lezioni del cliente
    } else if (view === 'client-history') {
      setView('list'); // Torna alla lista clienti
      setSelectedClientKey(null);
    } else {
      onBack(); // Torna alla Home (funzione passata da App.tsx)
    }
  };

  // --- FILTRI ---
  
  // Ottieni solo le lezioni del cliente selezionato
  const filteredLessons = selectedClientKey 
    ? allLessons.filter(l => `${l.nome_cliente}-${l.cognome_cliente}`.toLowerCase() === selectedClientKey)
    : [];
  
  // Nome del cliente selezionato (per il titolo)
  const currentClientName = filteredLessons.length > 0 
    ? `${filteredLessons[0].nome_cliente} ${filteredLessons[0].cognome_cliente}`
    : 'Cliente';


  // --- RENDER VIEW 1: LISTA CLIENTI ---
  if (view === 'list') {
    return (
      <div className="clients-page">
        <div className="clients-header">
          <button onClick={onBack} className="back-link">← Home</button>
          <div className="header-title-row">
            <h1>I tuoi Clienti</h1>
            <span className="count-badge">{clients.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Caricamento...</div>
        ) : clients.length === 0 ? (
          <div className="empty-state">Nessun cliente trovato.</div>
        ) : (
          <div className="clients-grid">
            {clients.map((client) => (
              <div 
                key={client.id} 
                className="client-card clickable"
                onClick={() => handleClientClick(client.id)}
              >
                <div className="client-avatar">
                  {client.nome.charAt(0)}{client.cognome.charAt(0)}
                </div>
                <div className="client-info">
                  <h3>{client.nome} {client.cognome}</h3>
                  <p className="sub-info">Clicca per vedere lo storico</p>
                </div>
                <div className="client-stats">
                  <span className="hours-badge">{client.oreTotali}h</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- RENDER VIEW 2: STORICO LEZIONI (LISTA DATE) ---
  if (view === 'client-history') {
    return (
      <div className="clients-page">
        <div className="clients-header">
          <button onClick={handleInternalBack} className="back-link">← Clienti</button>
          <h1>{currentClientName}</h1>
          <p className="subtitle">Storico Lezioni</p>
        </div>

        <div className="history-list">
          {filteredLessons.map((lesson) => (
            <div 
              key={lesson.id} 
              className="history-card"
              onClick={() => handleLessonClick(lesson)}
            >
              <div className="date-box">
                <span className="day">{new Date(lesson.data_lezione).getDate()}</span>
                <span className="month">
                  {new Date(lesson.data_lezione).toLocaleString('it-IT', { month: 'short' }).toUpperCase()}
                </span>
              </div>
              
              <div className="lesson-mini-info">
                <div className="row-info">
                  <span className="label">Durata:</span>
                  <span className="value">{lesson.durata_ore} ore</span>
                </div>
                {lesson.voto_obiettivi && (
                  <div className="row-info">
                    <span className="label">Voto:</span>
                    <span className="value-vote">{lesson.voto_obiettivi}/10</span>
                  </div>
                )}
              </div>
              
              <div className="arrow-icon">›</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- RENDER VIEW 3: DETTAGLIO LEZIONE (NOTE E INFO) ---
  if (view === 'lesson-detail' && selectedLesson) {
    return (
      <div className="clients-page">
        <div className="clients-header">
          <button onClick={handleInternalBack} className="back-link">
            ← Torna a {selectedLesson.nome_cliente}
          </button>
          <h1>Dettaglio Lezione</h1>
        </div>

        <div className="detail-card">
          {/* Intestazione Data */}
          <div className="detail-section highlight-section">
            <span className="detail-label">Data</span>
            <span className="detail-value big-date">
              {new Date(selectedLesson.data_lezione).toLocaleDateString('it-IT', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </span>
          </div>

          <div className="grid-2">
            <div className="detail-section">
              <span className="detail-label">Orario Inizio</span>
              <span className="detail-value">{selectedLesson.ora_inizio?.slice(0, 5) || '--:--'}</span>
            </div>
            <div className="detail-section">
              <span className="detail-label">Durata</span>
              <span className="detail-value">{selectedLesson.durata_ore} ore</span>
            </div>
          </div>

          <div className="detail-section">
            <span className="detail-label">Obiettivi Raggiunti</span>
            <div className="vote-display">
              <span className="vote-number">{selectedLesson.voto_obiettivi ?? '-'}</span>
              <span className="vote-max">/10</span>
            </div>
            {/* Barra visiva del voto */}
            <div className="vote-bar-bg">
              <div 
                className="vote-bar-fill" 
                style={{ width: `${(selectedLesson.voto_obiettivi || 0) * 10}%` }}
              ></div>
            </div>
          </div>

          <div className="detail-section notes-section">
            <span className="detail-label">Note Maestro</span>
            <div className="notes-box">
              {selectedLesson.note ? selectedLesson.note : "Nessuna nota inserita per questa lezione."}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
}