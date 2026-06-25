/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import RaceLive from './components/RaceLive';
import NextRace from './components/NextRace';
import Parallax from './components/Parallax';
import { useLiveRace } from './hooks/useLiveRace';
import Calendar from './components/Calendar';
import ChampionshipLeaders from './components/ChampionshipLeaders';
import DriversStandings from './components/DriversStandings';
import ConstructorsStandings from './components/ConstructorsStandings';
import NewsIntel from './components/NewsIntel';
import StatsRibbon from './components/StatsRibbon';
import Footer from './components/Footer';
import DriverBattle from './components/DriverBattle';
import AccountPage from './components/AccountPage';
import LoginModal from './components/LoginModal';
import BootLoader from './components/BootLoader';
import RaceDetails from './components/RaceDetails';
import AdminGate from './admin/AdminGate';
import type { Race } from './data/races';

const themes = [
  { id: 'default', label: 'Default' },
  { id: 'alpine', label: 'Alpine' },
  { id: 'aston', label: 'Aston Martin' },
  { id: 'audi', label: 'Audi' },
  { id: 'cadillac', label: 'Cadillac' },
  { id: 'ferrari', label: 'Ferrari' },
  { id: 'haas', label: 'Haas' },
  { id: 'mclaren', label: 'McLaren' },
  { id: 'mercedes', label: 'Mercedes' },
  { id: 'racingbulls', label: 'Racing Bulls' },
  { id: 'redbull', label: 'Red Bull' },
  { id: 'williams', label: 'Williams' },
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

  // The "default" theme has no single livery colour, so we render it as a
  // multi-colour spectrum chip; every team maps to its own CSS custom prop.
  const chipFor = (id: string) =>
    id === 'default'
      ? 'conic-gradient(from 140deg, #a855f7, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7)'
      : `var(--${id})`;
  const accentFor = (id: string) => (id === 'default' ? '#a855f7' : `var(--${id})`);

  return (
    <div
      className={`theme-switcher ${isOpen ? 'open' : ''}`}
      onClick={() => setIsOpen(!isOpen)}
      ref={containerRef}
    >
      <div
        className="ts-trigger-swatch"
        style={{ background: chipFor(theme), '--ts-active': accentFor(theme) } as React.CSSProperties}
      ></div>
      <span className="ts-label">{currentTheme?.label}</span>
      <div className="ts-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.906c3.106 0 5.64-2.534 5.64-5.64 0-4.75-4.03-8.72-8.703-8.72Z"/>
        </svg>
      </div>

      {isOpen && (
        <div className="ts-menu" onClick={(e) => e.stopPropagation()}>
          <div className="ts-menu-head">Season Palette</div>
          <div className="ts-swatch-grid">
            {themes.map(t => (
              <button
                key={t.id}
                type="button"
                className={`ts-swatch ${theme === t.id ? 'active' : ''}`}
                style={{ '--sw': accentFor(t.id), '--chip': chipFor(t.id) } as React.CSSProperties}
                onClick={(e) => {
                  e.stopPropagation();
                  setTheme(t.id);
                  setIsOpen(false);
                }}
              >
                <span className="ts-swatch-chip"></span>
                <span className="ts-swatch-name">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Race details live at `/race/:season/:round` so the view is shareable and
// survives a refresh. Parse that shape out of the current path; null otherwise.
const parseRacePath = (path: string): { season: string; round: string } | null => {
  const m = path.match(/^\/race\/([^/]+)\/([^/]+)\/?$/);
  return m ? { season: m[1], round: m[2] } : null;
};

const App: React.FC = () => {
  const isAdminPortal = window.location.pathname === '/admin-portal';
  const initialRacePath = parseRacePath(window.location.pathname);
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
      // Standardize the user object for existing sessions
      return {
        ...parsed,
        name: parsed.name || parsed.full_name || 'User',
        picture: parsed.picture || parsed.avatar_url || parsed.picture_url || ''
      };
    } catch (e) {
      console.error("Error parsing user data:", e);
      localStorage.removeItem('f1_user');
      return null;
    }
  });
  const [view, setView] = useState<'dashboard' | 'account' | 'race_details'>(() => {
    // The URL is the source of truth for race details; only fall back to the
    // persisted view (account/dashboard) when the path isn't a race route.
    if (initialRacePath) return 'race_details';
    const saved = localStorage.getItem('f1_view') as any;
    return saved === 'race_details' ? 'dashboard' : saved || 'dashboard';
  });
  const [selectedRace, setSelectedRace] = useState<Race | null>(() => {
    const saved = localStorage.getItem('f1_selected_race');
    const parsed: Race | null = saved ? JSON.parse(saved) : null;
    // On a deep link / refresh, only trust the cached race if it matches the
    // path; otherwise it'll be resolved from the calendar once it loads.
    if (initialRacePath) {
      return parsed && String(parsed.season) === initialRacePath.season && String(parsed.round) === initialRacePath.round
        ? parsed
        : null;
    }
    return parsed;
  });
  const [showGlobalLogin, setShowGlobalLogin] = useState(!user);
  const [showBoot, setShowBoot] = useState(true);

  // When a calendar race falls on today's date we switch the dashboard into a
  // focused "race day" takeover (just the live section) instead of the full grid.
  const { races, liveRace } = useLiveRace();

  // Persist view and selected race
  useEffect(() => {
    localStorage.setItem('f1_view', view);
    if (selectedRace) {
      localStorage.setItem('f1_selected_race', JSON.stringify(selectedRace));
    } else {
      localStorage.removeItem('f1_selected_race');
    }
  }, [view, selectedRace]);

  // Open a race's details and reflect it in the URL (`/race/:season/:round`).
  const openRaceDetails = (race: Race) => {
    setSelectedRace(race);
    setView('race_details');
    window.history.pushState({}, '', `/race/${race.season}/${race.round}`);
    window.scrollTo(0, 0);
  };

  // Leave race details, returning to the dashboard at the root URL.
  const closeRaceDetails = () => {
    setView('dashboard');
    setSelectedRace(null);
    window.history.pushState({}, '', '/');
  };

  // When deep-linked to `/race/:season/:round` (refresh / shared link) the
  // selected race isn't in memory yet — resolve it from the calendar once it
  // loads. If the round doesn't exist, fall back to the dashboard.
  useEffect(() => {
    if (view !== 'race_details' || selectedRace || races.length === 0) return;
    const target = parseRacePath(window.location.pathname);
    if (!target) return;
    const found = races.find(
      (r) => String(r.season) === target.season && String(r.round) === target.round
    );
    if (found) {
      setSelectedRace(found);
    } else {
      setView('dashboard');
      window.history.replaceState({}, '', '/');
    }
  }, [races, view, selectedRace]);

  // Keep the view in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      const target = parseRacePath(window.location.pathname);
      if (target) {
        setView('race_details');
        const found = races.find(
          (r) => String(r.season) === target.season && String(r.round) === target.round
        );
        setSelectedRace(found ?? null);
      } else {
        setView('dashboard');
        setSelectedRace(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [races]);

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

  // Pointer-driven parallax: feeds normalized cursor offset (-0.5..0.5) into CSS
  // so the background orbs/ribbons drift with the mouse for a sense of depth.
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return; // skip on touch
    let ticking = false;
    let mx = 0;
    let my = 0;
    const handleMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mx', mx.toFixed(4));
          document.documentElement.style.setProperty('--my', my.toFixed(4));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  useEffect(() => {
    setShowGlobalLogin(!user);
    if (user && user.id) {
      localStorage.setItem('f1_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('f1_user');
    }
  }, [user]);

  if (isAdminPortal) {
    return (
      <AdminGate />
    );
  }

  return (
    <>
      {showBoot && <BootLoader onComplete={() => setShowBoot(false)} />}
      
      <LoginModal 
        isOpen={showGlobalLogin && !user && !showBoot} 
        onClose={() => setShowGlobalLogin(false)}
        onLoginSuccess={(u) => {
          setUser(u as any);
          setShowGlobalLogin(false);
        }}
        title="Welcome to Pitwall"
        subtitle="Sign in to unlock personalized race times, favorite driver tracking, and exclusive paddock insights."
      />

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
      
      <div className="public-site-shell">
        {view === 'dashboard' ? (
          <>
            <ThemeSwitcher />
            <Ticker />
            <Hero
              user={user}
              setUser={setUser}
              onOpenSettings={() => setView('account')}
            />
            {/* On race day, the live takeover replaces the next/previous race header. */}
            <Parallax speed={0.05}>
              {liveRace ? (
                <RaceLive
                  race={liveRace}
                  races={races}
                  onRaceSelect={openRaceDetails}
                />
              ) : (
                <NextRace onRaceSelect={openRaceDetails} />
              )}
            </Parallax>
            <Parallax speed={0.04} delay={40}>
              <ChampionshipLeaders />
            </Parallax>
            <Parallax speed={0.035} delay={60}>
              <Calendar onRaceSelect={openRaceDetails} />
            </Parallax>
            <Parallax speed={0.04}>
              <StatsRibbon />
            </Parallax>
            <Parallax speed={0.05}>
              <DriverBattle />
            </Parallax>

            <Parallax speed={0.03} delay={80}>
              <section className="main-section">
                <div className="main-grid">
                  <DriversStandings />
                  <ConstructorsStandings />
                </div>
              </section>
            </Parallax>

            <Parallax speed={0.045}>
              <section id="paddock" className="intel-section">
                <NewsIntel />
              </section>
            </Parallax>

            <Footer />
          </>
        ) : view === 'account' ? (
          <AccountPage 
            user={user} 
            onClose={() => setView('dashboard')} 
          />
        ) : (
          <RaceDetails
            race={selectedRace}
            onBack={closeRaceDetails}
            user={user as any}
            setUser={setUser as any}
            onOpenSettings={() => setView('account')}
            onHomeNavigate={(hash) => {
              closeRaceDetails();
              // Defer until the dashboard has mounted, then scroll to the section.
              setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          />
        )}
      </div>
    </>
  );
};

export default App;
