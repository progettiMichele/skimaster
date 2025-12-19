import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import ModalLogin from './components/ModalLogin';
import AddLesson from './components/AddLesson';
import ClientsList from './components/ClientsList';
// import SkiXPage from './pages/SkiXPage';
import ProfileSettings from './components/ProfileSettings';
// import CompleteProfileModal from './components/CompleteProfileModal';
import './App.css';
import type { Lesson, AppSession } from './types';

interface Stats {
  totalHours: number;
  avgGoal: string;
  totalClients: number;
}

// Tipi di viste disponibili
type ViewType = 'home' | 'add-lesson' | 'clients';

function App() {
  // --- STATI DI NAVIGAZIONE E SESSIONE ---
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [session, setSession] = useState<AppSession>(null);
  // const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false); // Nuovo stato

  // --- STATI PER MODALI ---
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  // --- STATI DATI ---
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [tempRate, setTempRate] = useState('');
  
  const [stats, setStats] = useState<Stats>({
    totalHours: 0,
    avgGoal: '-',
    totalClients: 0
  });

  // Funzione per controllare e completare il profilo (commentata)
  /*
  const checkAndCompleteProfile = useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error fetching profile:', error);
      // Handle error, maybe show a generic error to user
    }

    if (!profile?.username) {
      setShowCompleteProfileModal(true);
    } else {
      setShowCompleteProfileModal(false);
    }
  }, []);
  */

  // --- EFFETTI (Caricamento Iniziale) ---
  useEffect(() => {
    // 1. Carica Tariffa dal telefono
    const savedRate = localStorage.getItem('skiHourlyRate');
    if (savedRate) setHourlyRate(parseFloat(savedRate));

    // 2. Controlla Sessione Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setIsLoginOpen(true);
      } else {
        fetchStats(session.user.id);
        // checkAndCompleteProfile(session.user.id); // Commented out
      }
    });

    // 3. Ascolta Login/Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        setIsLoginOpen(false);
        fetchStats(session.user.id);
        // await checkAndCompleteProfile(session.user.id); // Commented out
      } else {
        // Reset totale se logout
        setStats({ totalHours: 0, avgGoal: '-', totalClients: 0 });
        setCurrentView('home');
        // setShowCompleteProfileModal(false); // Commented out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FUNZIONI LOGICHE ---

  const fetchStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('lezioni_sci')
        .select('group_id, durata_ore, voto_obiettivi, nome_cliente, cognome_cliente')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) return;

      // Calcoli Statistici
      const lessonsByGroup = new Map<string, number>();
      let individualHours = 0;

      data.forEach((lesson: Partial<Lesson>) => {
        if (lesson.group_id) {
          if (!lessonsByGroup.has(lesson.group_id)) {
            lessonsByGroup.set(lesson.group_id, Number(lesson.durata_ore));
          }
        } else {
          // Per retrocompatibilità con lezioni non-gruppo
          individualHours += Number(lesson.durata_ore);
        }
      });

      const groupHours = Array.from(lessonsByGroup.values()).reduce((acc, curr) => acc + curr, 0);
      const hours = groupHours + individualHours;
      
      const votes = data.filter(d => d.voto_obiettivi !== null).map(d => d.voto_obiettivi);
      const avg = votes.length > 0 
        ? (votes.reduce((a, b) => a + b, 0) / votes.length).toFixed(1) 
        : '-';
      
      const uniqueClients = new Set(data.map(d => `${d.nome_cliente} ${d.cognome_cliente}`.toLowerCase()));

      setStats({
        totalHours: hours,
        avgGoal: avg,
        totalClients: uniqueClients.size
      });

    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    if (session) fetchStats(session.user.id);
  };

  const handleNavigation = (view: ViewType) => {
    if (!session) {
      setIsLoginOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  // const handleProfileCompleted = async () => { // Commented out
  //   setShowCompleteProfileModal(false);
  //   if (session) {
  //     await checkAndCompleteProfile(session.user.id); // Re-check profile after completion
  //     // Maybe re-fetch stats or refresh relevant components
  //   }
  // };

  // --- LOGICA SOLDI ---
  const openRateModal = () => {
    setTempRate(hourlyRate > 0 ? hourlyRate.toString() : '');
    setIsRateModalOpen(true);
  };

  const saveRate = () => {
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate >= 0) {
      setHourlyRate(rate);
      localStorage.setItem('skiHourlyRate', rate.toString());
      setIsRateModalOpen(false);
    }
  };

  const totalEarnings = (stats.totalHours * hourlyRate).toFixed(0);

  // --- RENDER ---
  return (
    <div className="app-container">
      
      {/* HEADER: Visibile su Home e Clienti */}
      {(currentView === 'home' || currentView === 'clients') && (
        <Header 
          session={session}
          onLoginClick={() => setIsLoginOpen(true)} 
          onNavigate={handleNavigation}
          currentView={currentView}
          // Passiamo la funzione per aprire il profilo
          onOpenProfile={() => setIsProfileSettingsOpen(true)}
        />
      )}

      <main>
        {/* --- VISTA HOME (DASHBOARD) --- */}
        {currentView === 'home' && (
          <>
            <div className="dashboard-container">
              <div className="stats-grid">
                
                {/* 1. ORE */}
                <div className="stat-circle">
                  <span className="stat-value">{stats.totalHours}</span>
                  <span className="stat-unit">ore</span>
                  <span className="stat-label">Svolte</span>
                </div>
                
                {/* 2. SOLDI (Cliccabile) */}
                <div className="stat-circle" onClick={openRateModal}>
                  <span className="stat-value money-value">
                    {hourlyRate === 0 ? '€?' : `€${totalEarnings}`}
                  </span>
                  <span className="stat-label">
                    {hourlyRate === 0 ? 'Tariffa' : 'Guadagno'}
                  </span>
                  {hourlyRate > 0 && <span className="stat-unit">(@ {hourlyRate}€/h)</span>}
                </div>

                {/* 3. CLIENTI (Cliccabile) */}
                <div className="stat-circle" onClick={() => handleNavigation('clients')}>
                  <span className="stat-value">{stats.totalClients}</span>
                  <span className="stat-label">Clienti</span>
                </div>
                
                {/* 4. MEDIA VOTO */}
                <div className="stat-circle">
                  <span className="stat-value" style={{ color: '#2563eb' }}>{stats.avgGoal}</span>
                  <span className="stat-unit">/10</span>
                  <span className="stat-label">Media Voto</span>
                </div>

              </div>
            </div>

            <div className="bottom-action-container">
              <button 
                onClick={() => handleNavigation('add-lesson')} 
                className="big-apple-btn"
              >
                <span className="plus-icon">+</span>
                <span>Aggiungi Lezione</span>
              </button>
            </div>
          </>
        )}

        {/* --- ALTRE VISTE --- */}
        {currentView === 'clients' && <ClientsList onBack={handleBackToHome} />}
        
        {/* {currentView === 'skix' && <SkiXPage />} */}

        {currentView === 'add-lesson' && <AddLesson onBack={handleBackToHome} />}
      </main>

      {/* --- MODALI --- */}
      
      {/* 1. Tariffa */}
      {isRateModalOpen && (
        <div className="rate-modal-overlay">
          <div className="rate-modal">
            <h3>Tariffa Oraria</h3>
            <p style={{color: '#64748b', fontSize: '0.9rem'}}>Quanto guadagni all'ora?</p>
            <input 
              type="number" 
              className="rate-input"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
              placeholder="Es. 40"
              autoFocus
            />
            <div className="rate-actions">
              <button onClick={() => setIsRateModalOpen(false)} className="btn-cancel">Annulla</button>
              <button onClick={saveRate} className="btn-confirm">Salva</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Login */}
      <ModalLogin 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      {/* 3. Impostazioni Profilo (NUOVO) */}
      <ProfileSettings 
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        session={session}
      />

      {/* 4. Modale Completa Profilo (commentata) */}
      {/*
      {session && (
        <CompleteProfileModal
          isOpen={showCompleteProfileModal}
          onClose={() => setShowCompleteProfileModal(false)}
          userId={session.user.id}
          onProfileCompleted={handleProfileCompleted}
        />
      )}
      */}
    
    </div>
  );
}

export default App;