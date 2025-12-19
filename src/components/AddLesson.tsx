import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './AddLesson.css';

interface AddLessonProps {
  onBack: () => void;
}

interface ClientSuggestion {
  nome: string;
  cognome: string;
}

// Struttura dati per il singolo studente nella form
interface StudentForm {
  nome: string;
  cognome: string;
  voto: number;
  note: string;
}

export default function AddLesson({ onBack }: AddLessonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // DATI CONDIVISI (Uguali per tutti)
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [oraInizio, setOraInizio] = useState('');
  const [durata, setDurata] = useState('');

  // LISTA STUDENTI (Inizia con uno vuoto)
  const [students, setStudents] = useState<StudentForm[]>([
    { nome: '', cognome: '', voto: 6, note: '' }
  ]);

  // STATI PER AUTOCOMPLETAMENTO
  const [allClients, setAllClients] = useState<ClientSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  
  // Tracciamo quale input (indice studente) ha il focus per mostrare i suggerimenti giusti
  const [activeStudentIndex, setActiveStudentIndex] = useState<number | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPastClients();
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setActiveStudentIndex(null); // Chiude il menu se clicco fuori
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPastClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('lezioni_sci')
      .select('nome_cliente, cognome_cliente')
      .eq('user_id', user.id);

    if (data) {
      const uniqueClientsMap = new Map();
      data.forEach(item => {
        const key = `${item.nome_cliente.toLowerCase()}-${item.cognome_cliente.toLowerCase()}`;
        if (!uniqueClientsMap.has(key)) {
          uniqueClientsMap.set(key, { 
            nome: item.nome_cliente, 
            cognome: item.cognome_cliente 
          });
        }
      });
      setAllClients(Array.from(uniqueClientsMap.values()));
    }
  };

  // --- GESTIONE STUDENTI ---

  const addStudent = () => {
    setStudents([...students, { nome: '', cognome: '', voto: 6, note: '' }]);
  };

  const removeStudent = (index: number) => {
    if (students.length === 1) return; // Impedisce di cancellare l'ultimo
    const newStudents = [...students];
    newStudents.splice(index, 1);
    setStudents(newStudents);
  };

  const updateStudent = (index: number, field: keyof StudentForm, value: string | number) => {
    const newStudents = [...students];
    // @ts-expect-error - This is a known issue with dynamic keys in TypeScript.
    newStudents[index][field] = value;
    setStudents(newStudents);

    // Se stiamo scrivendo il nome, gestiamo l'autocompletamento
    if (field === 'nome' && typeof value === 'string') {
      if (value.length > 0) {
        const filtered = allClients.filter(client => 
          client.nome.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered);
        setActiveStudentIndex(index);
      } else {
        setActiveStudentIndex(null);
      }
    }
  };

  const selectSuggestion = (index: number, client: ClientSuggestion) => {
    const newStudents = [...students];
    newStudents[index].nome = client.nome;
    newStudents[index].cognome = client.cognome;
    setStudents(newStudents);
    setActiveStudentIndex(null); // Chiudi menu
  };

  // --- SALVATAGGIO ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Devi essere loggato.");

      // Prepariamo l'array di righe da inserire (una per studente)
      const lessonGroupId = crypto.randomUUID(); // ID unico per questa lezione collettiva

      const rowsToInsert = students.map(student => ({
        user_id: user.id,
        group_id: lessonGroupId, // Aggiunto!
        nome_cliente: student.nome.trim(),
        cognome_cliente: student.cognome.trim(),
        data_lezione: data,
        ora_inizio: oraInizio || null,
        durata_ore: parseFloat(durata),
        voto_obiettivi: student.voto,
        note: student.note
      }));

      const { error: insertError } = await supabase
        .from('lezioni_sci')
        .insert(rowsToInsert);

      if (insertError) throw insertError;

      // NON usare alert() perché è bloccante
      onBack(); // Naviga indietro DOPO che il salvataggio è andato a buon fine

    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("Si è verificato un errore sconosciuto.");
        }
    } finally {
      setLoading(false); // Questo verrà eseguito in caso di errore, o dopo la navigazione
    }
  };

  return (
    <div className="page-container">
      <div className="add-lesson-header">
        <button onClick={onBack} className="back-btn">← Indietro</button>
        <h1>Nuova Lezione</h1>
      </div>

      <div className="form-card" ref={wrapperRef}>
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* SEZIONE 1: INFO CONDIVISE (DATA/ORA) */}
          <div className="shared-info-box">
            <div className="section-title">Dettagli Lezione (Comuni)</div>
            <div className="input-group">
              <label>Data *</label>
              <input 
                type="date" 
                required 
                value={data} 
                onChange={e => setData(e.target.value)} 
              />
            </div>

            <div className="row-2">
              <div className="input-group">
                <label>Ora Inizio</label>
                <input 
                  type="time" 
                  value={oraInizio} 
                  onChange={e => setOraInizio(e.target.value)} 
                />
              </div>
              <div className="input-group">
                <label>Durata (h) *</label>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0.5"
                  required 
                  placeholder="Es. 2"
                  value={durata} 
                  onChange={e => setDurata(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="section-title" style={{ marginTop: '30px' }}>Atleti ({students.length})</div>

          {/* LISTA STUDENTI DINAMICA */}
          {students.map((student, index) => (
            <div key={index} className="student-card-form">
              
              {/* Header card studente con bottone rimuovi */}
              <div className="student-header">
                <span className="student-number">Atleta #{index + 1}</span>
                {students.length > 1 && (
                  <button 
                    type="button" 
                    className="remove-btn" 
                    onClick={() => removeStudent(index)}
                  >
                    Rimuovi ✕
                  </button>
                )}
              </div>

              <div className="row-2">
                {/* NOME CON AUTOCOMPLETAMENTO */}
                <div className="input-group relative-container">
                  <label>Nome *</label>
                  <input 
                    type="text" 
                    required 
                    value={student.nome} 
                    onChange={e => updateStudent(index, 'nome', e.target.value)}
                    onFocus={() => {
                      if(student.nome) setActiveStudentIndex(index);
                    }}
                    placeholder="Nome"
                    autoComplete="off"
                  />
                  
                  {/* Menu Suggerimenti specifico per questo input */}
                  {activeStudentIndex === index && suggestions.length > 0 && (
                    <ul className="suggestions-dropdown">
                      {suggestions.map((sugg, i) => (
                        <li 
                          key={i} 
                          onClick={() => selectSuggestion(index, sugg)}
                          className="suggestion-item"
                        >
                          <span className="sugg-name">{sugg.nome}</span> 
                          <span className="sugg-surname">{sugg.cognome}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="input-group">
                  <label>Cognome *</label>
                  <input 
                    type="text" 
                    required 
                    value={student.cognome} 
                    onChange={e => updateStudent(index, 'cognome', e.target.value)} 
                    placeholder="Cognome"
                  />
                </div>
              </div>

              {/* VOTO */}
              <div className="input-group">
                <div className="slider-header">
                  <label>Obiettivi (0-10)</label>
                  <span className="badge-voto">{student.voto}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={student.voto} 
                  onChange={e => updateStudent(index, 'voto', parseInt(e.target.value))} 
                  className="slider"
                />
              </div>

              {/* NOTE */}
              <div className="input-group">
                <input 
                  type="text"
                  placeholder="Note rapide per questo atleta..."
                  value={student.note} 
                  onChange={e => updateStudent(index, 'note', e.target.value)} 
                  className="simple-input"
                />
              </div>

            </div>
          ))}

          {/* BOTTONE AGGIUNGI ATLETA */}
          <button 
            type="button" 
            className="add-student-btn"
            onClick={addStudent}
          >
            + Aggiungi un altro atleta
          </button>

          <hr className="divider" />

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Salvataggio...' : `Salva Lezione (${students.length} atleti)`}
          </button>
        </form>
      </div>
    </div>
  );
}