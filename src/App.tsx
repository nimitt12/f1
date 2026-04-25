import React, { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import NextRace from './components/NextRace';
import Calendar from './components/Calendar';
import DriversStandings from './components/DriversStandings';
import ConstructorsStandings from './components/ConstructorsStandings';
import NewsIntel from './components/NewsIntel';
import StatsRibbon from './components/StatsRibbon';
import Footer from './components/Footer';
import DriverBattle from './components/DriverBattle';
import AccountPage from './components/AccountPage';
import { supabase } from './supabaseClient';

const themes = [
  { id: 'default', label: 'Default' },
  { id: 'mercedes', label: 'Mercedes' },
  { id: 'ferrari', label: 'Ferrari' },
  { id: 'mclaren', label: 'McLaren' },
  { id: 'redbull', label: 'Red Bull' },
  { id: 'williams', label: 'Williams' },
  { id: 'haas', label: 'Haas' },
  { id: 'alpine', label: 'Alpine' },
  { id: 'audi', label: 'Audi' },
  { id: 'racingbulls', label: 'Racing Bulls' },
  { id: 'aston', label: 'Aston Martin' },
  { id: 'cadillac', label: 'Cadillac' },
];

const ThemeSwitcher: React.FC = () => {
  const [theme, setTheme] = React.useState(() => {
    return localStorage.getItem('f1_theme') || 'default';
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('f1_theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentTheme = themes.find(t => t.id === theme);

  return (
    <div 
      className="theme-switcher" 
      onClick={() => setIsOpen(!isOpen)} 
      ref={containerRef}
    >
      <div className="ts-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.906c3.106 0 5.64-2.534 5.64-5.64 0-4.75-4.03-8.72-8.703-8.72Z"/>
        </svg>
      </div>
      <span className="ts-label">{currentTheme?.label}</span>
      
      {isOpen && (
        <div className="ts-menu">
          {themes.map(t => (
            <div 
              key={t.id} 
              className={`ts-item ${theme === t.id ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setTheme(t.id);
                setIsOpen(false);
              }}
            >
              <span>{t.label}</span>
              <div 
                className="ts-color-dot" 
                style={{ background: `var(--${t.id === 'default' ? 'racing' : t.id})` }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<{id: string, email: string, name: string, picture: string} | null>(() => {
    const savedUser = localStorage.getItem('f1_user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser);
      // If legacy session missing ID, clear it
      if (!parsed.id) {
        localStorage.removeItem('f1_user');
        return null;
      }
      return parsed;
    } catch (e) {
      console.error("Error parsing user data:", e);
      localStorage.removeItem('f1_user');
      return null;
    }
  });
  const [view, setView] = useState<'dashboard' | 'account'>('dashboard');

  // Performant scroll tracking for parallax background
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Set initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      localStorage.setItem('f1_user', JSON.stringify(user));
      // Sync with Supabase
      const syncProfile = async () => {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.name,
            avatar_url: user.picture,
            updated_at: new Date().toISOString()
          });
        if (error) console.error('Error syncing profile:', error);
      };
      syncProfile();
    } else {
      localStorage.removeItem('f1_user');
    }
  }, [user]);

  return (
    <>
      <div className="app-bg">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>
        
        <div className="racing-ribbon-container">
          <div className="speed-line main"></div>
          <div className="speed-line sec"></div>
          <div className="speed-line ter"></div>
        </div>
      </div>
      
      {view === 'dashboard' ? (
        <>
          <ThemeSwitcher />
          <Ticker />
          <Hero 
            user={user} 
            setUser={setUser} 
            onOpenSettings={() => setView('account')} 
          />
          <NextRace />
          <Calendar />
          <DriverBattle user={user} />

          <section className="main-section">
            <div className="main-grid">
              <DriversStandings />
              <ConstructorsStandings />
            </div>
          </section>

          <section id="paddock" className="intel-section">
            <NewsIntel />
          </section>

          <StatsRibbon />
          <Footer />
        </>
      ) : (
        <AccountPage 
          user={user} 
          onClose={() => setView('dashboard')} 
        />
      )}
    </>
  );
};

export default App;
