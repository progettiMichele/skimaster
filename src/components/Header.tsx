import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import './Header.css';
import type { AppSession } from '../types';

interface HeaderProps {
  onLoginClick: () => void;
  onNavigate: (view: 'home' | 'clients') => void; // Removed 'skix'
  currentView: 'home' | 'clients' | 'add-lesson'; // Removed 'skix'
  session: AppSession;
  onOpenProfile: () => void; // <--- QUESTA È LA RIGA CHE MANCAVA
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, onNavigate, currentView, session, onOpenProfile }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (view: 'home' | 'clients') => { // Removed 'skix'
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const handleUserIconClick = () => {
    if (session) setIsUserMenuOpen(!isUserMenuOpen);
    else onLoginClick();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="header-container">
      <div className="glass-bar">
        
        {/* LOGO */}
        <div 
          className="logo" 
          onClick={() => handleNavClick('home')}
          style={{ cursor: 'pointer' }}
        >
          Masterski<span className="logo-dot">.</span>
        </div>

        {/* MENU DESKTOP */}
        <nav className="desktop-nav">
          <button 
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            Home
          </button>
          <button 
            className={`nav-link ${currentView === 'clients' ? 'active' : ''}`}
            onClick={() => handleNavClick('clients')}
          >
            Clienti
          </button>
          {/* SkiX button commented out */}
          {/*
          <button 
            className={`nav-link skix-link ${currentView === 'skix' ? 'active' : ''}`}
            onClick={() => handleNavClick('skix')}
          >
            Ski<span className="x-brand">𝕏</span>
          </button>
          */}
        </nav>

        {/* AZIONI DESTRA */}
        <div className="right-actions" ref={userMenuRef}>
          <button
            onClick={handleUserIconClick}
            className={`user-btn ${session ? 'logged-in' : ''}`}
          >
            {session ? (
              <div className="avatar-placeholder">
                {session.user.email?.charAt(0).toUpperCase()}
              </div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="user-icon">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.602-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {isUserMenuOpen && session && (
            <div className="user-dropdown-menu">
              <div className="dropdown-header">
                <span className="user-email">{session.user.email}</span>
              </div>
              <div className="dropdown-divider"></div>
              
              {/* Bottone Profilo Collegato Correttamente */}
              <button className="dropdown-item" onClick={() => {
                onOpenProfile();
                setIsUserMenuOpen(false);
              }}>
                ⚙️ Profilo & Social
              </button>
              
              <button className="dropdown-item">📷 Cambia Foto</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>Esci</button>
            </div>
          )}

          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          <button onClick={() => handleNavClick('home')}>Home</button>
          <button onClick={() => handleNavClick('clients')}>Clienti</button>
          {/* SkiX Social button commented out */}
          {/*
          <button onClick={() => handleNavClick('skix')}>Ski𝕏 Social</button>
          */}
        </div>
      )}
    </header>
  );
};

export default Header;