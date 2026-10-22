import { getToken } from './lib/auth';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Ticker from './components/Ticker';
import Hero from './components/Hero';
import RaceLive from './components/RaceLive';
import NextRace from './components/NextRace';
import LiveTimingBanner from './components/LiveTimingBanner';
import Parallax from './components/Parallax';
import { useLiveRace } from './hooks/useLiveRace';
import Calendar from './components/Calendar';
import ChampionshipLeaders from './components/ChampionshipLeaders';
import DriversStandings from './components/DriversStandings';
import ConstructorsStandings from './components/ConstructorsStandings';
import NewsIntel from './components/NewsIntel';
import Footer from './components/Footer';
import DriverBattle from './components/DriverBattle';
import AppDownloadBanner from './components/AppDownloadBanner';
import AccountPage from './components/AccountPage';
import LoginModal from './components/LoginModal';
import BootLoader from './components/BootLoader';
import PrivacyPolicy from './components/PrivacyPolicy';
import AccountDeletionRequest from './components/AccountDeletionRequest';
import ScrollProgress from './components/ScrollProgress';
import { RACES, raceSlug, type Race } from './data/races';

const RaceDetails = lazy(() => import('./components/RaceDetails'));
const LiveTiming = lazy(() => import('./components/LiveTiming'));
const SchedulePage = lazy(() => import('./components/SchedulePage'));
const ResultsPage = lazy(() => import('./components/ResultsPage'));
const DriverStandingsPage = lazy(() => import('./components/DriverStandingsPage'));
const DriverDetailPage = lazy(() => import('./components/DriverDetailPage'));
const ConstructorStandingsPage = lazy(() => import('./components/ConstructorStandingsPage'));
const ConstructorDetailPage = lazy(() => import('./components/ConstructorDetailPage'));
const ClashPage = lazy(() => import('./components/ClashPage'));
const SeasonStatisticsPage = lazy(() => import('./components/SeasonStatisticsPage'));
const TrackDetailsPage = lazy(() => import('./components/TrackDetailsPage'));
const AdminGate = lazy(() => import('./admin/AdminGate'));
const SeasonStatisticsTeaser = lazy(() => import('./components/SeasonStatisticsTeaser'));

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
    const saved = localStorage.getItem('f1_theme');
    return themes.some(t => t.id === saved) ? saved! : 'default';
  });
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelId = React.useId();
  const [revealTheme, setRevealTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!revealTheme) return;
    // Change the page while the full-screen panels cover it.
    const applyTimer = window.setTimeout(() => setTheme(revealTheme), 420);
    const finishTimer = window.setTimeout(() => setRevealTheme(null), 1400);
    return () => {
      window.clearTimeout(applyTimer);
      window.clearTimeout(finishTimer);
    };
  }, [revealTheme]);

  const selectTheme = (nextTheme: string) => {
    setIsOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
    if (nextTheme === theme || revealTheme) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTheme(nextTheme);
    } else {
      setRevealTheme(nextTheme);
    }
  };

  React.useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('f1_theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (!isOpen) return;
    containerRef.current?.querySelector<HTMLButtonElement>('.ts-swatch.active')?.focus();
    const handleClickOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  const currentTheme = themes.find(t => t.id === theme)!;
  const chipFor = (id: string) => id === 'default'
    ? 'linear-gradient(115deg, #ffbf69, #f46c89 30%, #b087ff 58%, #63c9ed 82%, #9cddbd)'
    : `var(--${id})`;
  const accentFor = (id: string) => id === 'default' ? '#bca0ff' : `var(--${id})`;

  return (
    <div
      className={`theme-switcher ${isOpen ? 'open' : ''}`}
      style={{ '--ts-active': accentFor(theme), '--ts-chip': chipFor(theme) } as React.CSSProperties}
      ref={containerRef}
      onKeyDown={event => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      {revealTheme && createPortal(
        <div className="livery-reveal" aria-hidden="true" style={{ '--reveal-colour': accentFor(revealTheme), '--reveal-paint': chipFor(revealTheme) } as React.CSSProperties}>
          <div className="livery-reveal-panel livery-reveal-panel-back" />
          <div className="livery-reveal-panel livery-reveal-panel-front" />
          <div className="livery-reveal-grain" />
          <div className="livery-reveal-title">
            <span className="livery-reveal-kicker">PITWALL / LIVERY STUDIO</span>
            <strong>{revealTheme === 'default' ? 'Signature' : themes.find(t => t.id === revealTheme)?.label}</strong>
            <span className="livery-reveal-caption"><i />Your colours. On track.</span>
          </div>
          <span className="livery-reveal-number">{String(themes.findIndex(t => t.id === revealTheme)).padStart(2, '0')}</span>
        </div>, document.body
      )}
      <button
        type="button"
        className="ts-trigger"
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`Choose appearance. Current theme: ${currentTheme.label}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="ts-trigger-swatch" aria-hidden="true" />
        <span className="ts-trigger-copy"><span className="ts-eyebrow">Your livery</span><span className="ts-label">{currentTheme.label}</span></span>
        <svg className="ts-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
      </button>

      {isOpen && (
        <section className="ts-menu" id={panelId} aria-labelledby={`${panelId}-title`}>
          <div className="ts-menu-head">
            <div><span className="ts-eyebrow">Pitwall / Personalise</span><h2 id={`${panelId}-title`}>Livery studio<span>.</span></h2></div>
            <span className="ts-studio-mark" aria-hidden="true">///</span>
          </div>
          <p className="ts-intro">Your team. Your colours. Your pitwall.</p>
          <div className="ts-swatch-grid" role="group" aria-label="Colour theme">
            {themes.map((t, index) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={theme === t.id}
                className={`ts-swatch ${t.id === 'default' ? 'ts-signature' : ''} ${theme === t.id ? 'active' : ''}`}
                style={{ '--sw': accentFor(t.id), '--chip': chipFor(t.id) } as React.CSSProperties}
                onClick={() => selectTheme(t.id)}
              >
                <span className="ts-swatch-chip" aria-hidden="true"><span className="ts-tile-number">{index === 0 ? 'PW' : String(index).padStart(2, '0')}</span></span>
                <span className="ts-swatch-copy"><span className="ts-swatch-name">{t.id === 'default' ? 'Pitwall signature' : t.label}</span><span className="ts-swatch-detail">{t.id === 'default' ? 'The full spectrum' : 'Team edition'}</span></span>
                <span className="ts-selection" aria-hidden="true">{theme === t.id ? '✓' : ''}</span>
              </button>
            ))}
          </div>
          <div className="ts-menu-footer"><span className="ts-status-dot" />{currentTheme.label} applied<span>Make it yours</span></div>
        </section>
      )}
    </div>
  );
};

// Race details live at `/race/:season/:round` so the view is shareable and
// survives a refresh. Parse that shape out of the current path; null otherwise.
// `raceId` is the race-name slug (canonical, e.g. "belgian-grand-prix") but
// legacy round numbers ("10") are still accepted.
const parseRacePath = (path: string): { season: string; raceId: string } | null => {
  const m = path.match(/^\/race\/([^/]+)\/([^/]+)\/?$/);
  try {
    return m ? { season: m[1], raceId: decodeURIComponent(m[2]) } : null;
  } catch { return null; }
};

const matchesRacePath = (race: Race, target: { season: string; raceId: string }): boolean =>
  String(race.season) === target.season &&
  (raceSlug(race) === target.raceId || String(race.round) === target.raceId);

const parseDriverPath = (path: string): { season: string; driverId: string } | null => {
  const match = path.match(/^\/driver\/([^/]+)\/([^/]+)\/?$/);
  try {
    return match ? { season: match[1], driverId: decodeURIComponent(match[2]) } : null;
  } catch { return null; }
};

const parseConstructorPath = (path: string): { season: string; constructorId: string } | null => {
  const match = path.match(/^\/constructor\/([^/]+)\/([^/]+)\/?$/);
  try {
    return match ? { season: match[1], constructorId: decodeURIComponent(match[2]) } : null;
  } catch { return null; }
};

const parseTrackPath = (path: string): string | null => {
  const match = path.match(/^\/track\/([^/]+)\/?$/);
  try { return match ? decodeURIComponent(match[1]) : null; } catch { return null; }
};

// Restore only after the dashboard's lazy content has mounted.
const DashboardScrollRestore: React.FC<{ top: number | null }> = ({ top }) => {
  React.useLayoutEffect(() => {
    if (top === null) return;
    const restore = () => window.scrollTo({ top, behavior: 'instant' });
    const observer = new ResizeObserver(restore);
    const stop = () => observer.disconnect();
    restore();
    observer.observe(document.body);
    const timeout = window.setTimeout(stop, 3000);
    // Stop correcting layout shifts as soon as the user starts navigating.
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stop);
    return () => {
      stop();
      window.clearTimeout(timeout);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stop);
    };
  }, [top]);
  return null;
};

const App: React.FC = () => {
  const statisticsReturnScroll = React.useRef(0);
  const [dashboardRestoreTop, setDashboardRestoreTop] = useState<number | null>(null);
  const isAdminPortal = window.location.pathname === '/admin-portal';
  const initialRacePath = parseRacePath(window.location.pathname);
  const initialDriverPath = parseDriverPath(window.location.pathname);
  const initialConstructorPath = parseConstructorPath(window.location.pathname);
  const initialTrackPath = parseTrackPath(window.location.pathname);
  const initialLivePath = window.location.pathname === '/live';
  const initialPrivacyPath = window.location.pathname === '/privacy';
  const initialDeletionPath = window.location.pathname === '/account-deletion';
  const initialSchedulePath = window.location.pathname === '/schedule' || window.location.pathname === '/schedule/';
  const initialResultsPath = window.location.pathname === '/results' || window.location.pathname === '/results/';
  const initialStandingsPath = window.location.pathname === '/standings' || window.location.pathname === '/standings/';
  const initialConstructorStandingsPath = window.location.pathname === '/constructor-standings' || window.location.pathname === '/constructor-standings/';
  const initialClashPath = window.location.pathname === '/clash' || window.location.pathname === '/clash/';
  const initialStatisticsPath = window.location.pathname === '/statistics' || window.location.pathname === '/statistics/';
  const [user, setUser] = useState<{id: string, email: string, name: string, picture: string} | null>(() => {
    if (!getToken()) return null;
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
  const [view, setView] = useState<'dashboard' | 'account' | 'race_details' | 'track_details' | 'driver_details' | 'constructor_details' | 'live' | 'schedule' | 'results' | 'standings' | 'constructor_standings' | 'statistics' | 'clash' | 'privacy' | 'account_deletion'>(() => {
    // The URL is the source of truth for race details, live timing and the
    // privacy policy; only fall back to the persisted view (account/dashboard)
    // otherwise.
    if (initialRacePath) return 'race_details';
    if (initialDriverPath) return 'driver_details';
    if (initialConstructorPath) return 'constructor_details';
    if (initialTrackPath) return 'track_details';
    if (initialLivePath) return 'live';
    if (initialSchedulePath) return 'schedule';
    if (initialResultsPath) return 'results';
    if (initialStandingsPath) return 'standings';
    if (initialConstructorStandingsPath) return 'constructor_standings';
    if (initialClashPath) return 'clash';
    if (initialStatisticsPath) return 'statistics';
    if (initialPrivacyPath) return 'privacy';
    if (initialDeletionPath) return 'account_deletion';
    const saved = localStorage.getItem('f1_view') as any;
    return saved === 'account' ? 'account' : 'dashboard';
  });
  const [selectedRace, setSelectedRace] = useState<Race | null>(() => {
    const saved = localStorage.getItem('f1_selected_race');
    let parsed: Race | null = null;
    try { parsed = saved ? JSON.parse(saved) : null; } catch { /* Ignore corrupt cache. */ }
    if (parsed && (typeof parsed.raceName !== 'string' || !parsed.Circuit)) parsed = null;
    // On a deep link / refresh, only trust the cached race if it matches the
    // path; otherwise it'll be resolved from the calendar once it loads.
    if (initialRacePath) {
      return parsed && matchesRacePath(parsed, initialRacePath) ? parsed : null;
    }
    return parsed;
  });
  const [raceReturnView, setRaceReturnView] = useState<'dashboard' | 'schedule' | 'results'>('dashboard');
  const [trackRace, setTrackRace] = useState<Race | null>(() =>
    initialTrackPath ? RACES.find((race) => race.Circuit.circuitId === initialTrackPath) ?? null : null
  );
  const [showGlobalLogin, setShowGlobalLogin] = useState(!user);
  const [showBoot, setShowBoot] = useState(true);

  // When a calendar race falls on today's date we switch the dashboard into a
  // focused "race day" takeover (just the live section) instead of the full grid.
  const { races, liveRace, upcomingRace } = useLiveRace();

  // Persist view and selected race
  useEffect(() => {
    localStorage.setItem('f1_view', view);
    if (selectedRace) {
      localStorage.setItem('f1_selected_race', JSON.stringify(selectedRace));
    } else {
      localStorage.removeItem('f1_selected_race');
    }
  }, [view, selectedRace]);

  // Open a race's details and reflect it in the URL (`/race/:season/:slug`).
  const openRaceDetails = (race: Race) => {
    setRaceReturnView(view === 'schedule' || view === 'results' ? view : 'dashboard');
    setSelectedRace(race);
    setView('race_details');
    window.history.pushState({}, '', `/race/${race.season}/${raceSlug(race)}`);
    window.scrollTo(0, 0);
  };

  // Leave race details, returning to the dashboard at the root URL.
  const closeRaceDetails = () => {
    setView(raceReturnView);
    setSelectedRace(null);
    window.history.pushState({}, '', raceReturnView === 'schedule' ? '/schedule' : raceReturnView === 'results' ? '/results' : '/');
    window.scrollTo(0, 0);
  };

  const openTrackDetails = (race: Race) => {
    setTrackRace(race);
    setView('track_details');
    window.history.pushState({}, '', `/track/${encodeURIComponent(race.Circuit.circuitId || raceSlug(race))}`);
    window.scrollTo(0, 0);
  };

  const closeTrackDetails = () => {
    setView('dashboard');
    setTrackRace(null);
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const goToDashboard = () => {
    setDashboardRestoreTop(null);
    setView('dashboard');
    setSelectedRace(null);
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  // Open the live timing console at `/live` so it's shareable and
  // survives a refresh, mirroring the race details pattern.
  const openLiveTiming = () => {
    setView('live');
    window.history.pushState({}, '', '/live');
    window.scrollTo(0, 0);
  };

  const closeLiveTiming = () => {
    setView('dashboard');
    window.history.pushState({}, '', '/');
  };

  const closeSchedule = () => {
    setView('dashboard');
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const openResults = () => {
    setView('results');
    window.history.pushState({}, '', '/results');
    window.scrollTo(0, 0);
  };

  const openStatistics = () => {
    statisticsReturnScroll.current = window.scrollY;
    setDashboardRestoreTop(null);
    setView('statistics');
    window.history.pushState({}, '', '/statistics');
    window.scrollTo(0, 0);
  };

  const returnFromStatistics = () => {
    setDashboardRestoreTop(statisticsReturnScroll.current);
    setView('dashboard');
    setSelectedRace(null);
    window.history.pushState({}, '', '/');
  };

  const openDriverProfile = (season: string, driverId: string) => {
    setView('driver_details');
    window.history.pushState({}, '', `/driver/${season}/${encodeURIComponent(driverId)}`);
    window.scrollTo(0, 0);
  };

  const closeDriverProfile = () => {
    setView('standings');
    window.history.pushState({}, '', '/standings');
    window.scrollTo(0, 0);
  };

  const openConstructorProfile = (season: string, constructorId: string) => {
    setView('constructor_details');
    window.history.pushState({}, '', `/constructor/${season}/${encodeURIComponent(constructorId)}`);
    window.scrollTo(0, 0);
  };

  const closeConstructorProfile = () => {
    setView('constructor_standings');
    window.history.pushState({}, '', '/constructor-standings');
    window.scrollTo(0, 0);
  };

  const closeResults = () => {
    setView('dashboard');
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const openClash = (driverIds: [string, string]) => {
    const params = new URLSearchParams({ driver1: driverIds[0], driver2: driverIds[1] });
    setView('clash');
    window.history.pushState({}, '', `/clash?${params.toString()}`);
    window.scrollTo(0, 0);
  };

  // When deep-linked to `/race/:season/:round` (refresh / shared link) the
  // selected race isn't in memory yet — resolve it from the calendar once it
  // loads. If the round doesn't exist, fall back to the dashboard.
  useEffect(() => {
    if (view !== 'race_details' || selectedRace || races.length === 0) return;
    const target = parseRacePath(window.location.pathname);
    if (!target) return;
    const found = races.find((r) => matchesRacePath(r, target));
    if (found) {
      setSelectedRace(found);
    } else {
      setView('dashboard');
      window.history.replaceState({}, '', '/');
    }
  }, [races, view, selectedRace]);

  useEffect(() => {
    if (view !== 'track_details' || trackRace || races.length === 0) return;
    const circuitId = parseTrackPath(window.location.pathname);
    const found = circuitId ? races.find((race) => race.Circuit.circuitId === circuitId) : undefined;
    if (found) setTrackRace(found);
    else { setView('dashboard'); window.history.replaceState({}, '', '/'); }
  }, [races, view, trackRace]);

  // Keep the view in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      const target = parseRacePath(window.location.pathname);
      const driverTarget = parseDriverPath(window.location.pathname);
      const constructorTarget = parseConstructorPath(window.location.pathname);
      const trackTarget = parseTrackPath(window.location.pathname);
      if (target) {
        setView('race_details');
        const found = races.find((r) => matchesRacePath(r, target));
        setSelectedRace(found ?? null);
      } else if (driverTarget) {
        setView('driver_details');
      } else if (constructorTarget) {
        setView('constructor_details');
      } else if (trackTarget) {
        setView('track_details');
        setTrackRace(races.find((race) => race.Circuit.circuitId === trackTarget) ?? null);
      } else if (window.location.pathname === '/live') {
        setView('live');
      } else if (window.location.pathname === '/schedule' || window.location.pathname === '/schedule/') {
        setView('schedule');
      } else if (window.location.pathname === '/results' || window.location.pathname === '/results/') {
        setView('results');
      } else if (window.location.pathname === '/standings' || window.location.pathname === '/standings/') {
        setView('standings');
      } else if (window.location.pathname === '/constructor-standings' || window.location.pathname === '/constructor-standings/') {
        setView('constructor_standings');
      } else if (window.location.pathname === '/clash' || window.location.pathname === '/clash/') {
        setView('clash');
      } else if (window.location.pathname === '/statistics' || window.location.pathname === '/statistics/') {
        setView('statistics');
      } else if (window.location.pathname === '/privacy') {
        setView('privacy');
      } else if (window.location.pathname === '/account-deletion') {
        setView('account_deletion');
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

  useEffect(() => {
    const signOut = () => setUser(null);
    window.addEventListener('pitwall:signout', signOut);
    return () => window.removeEventListener('pitwall:signout', signOut);
  }, []);

  if (isAdminPortal) {
    return <Suspense fallback={<p role="status">Loading admin portal…</p>}><AdminGate /></Suspense>;
  }

  return (
    <Suspense fallback={<p role="status">Loading Pitwall…</p>}>
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
        
        {/* F1 speed streaks — neon light trails firing across the dark backdrop */}
        <div className="speed-streaks">
          <div className="streak"></div>
          <div className="streak"></div>
          <div className="streak"></div>
          <div className="streak"></div>
          <div className="streak"></div>
          <div className="streak"></div>
        </div>
      </div>
      
      <ScrollProgress />

      <div className="public-site-shell">
        {view === 'dashboard' ? (
          <>
            <DashboardScrollRestore top={dashboardRestoreTop} />
            <ThemeSwitcher />
            <Ticker />
            <Hero
              upcomingRace={upcomingRace}
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
                  onOpenLiveTiming={openLiveTiming}
                />
              ) : (
                <NextRace onRaceSelect={openRaceDetails} onViewAllResults={openResults} onTrackSelect={openTrackDetails} />
              )}
            </Parallax>
            <Parallax speed={0.045} delay={20}>
              <LiveTimingBanner onOpenLiveTiming={openLiveTiming} />
            </Parallax>
            <Parallax speed={0.04} delay={40}>
              <ChampionshipLeaders />
            </Parallax>
            <Parallax speed={0.038} delay={50}>
              <SeasonStatisticsTeaser onOpen={openStatistics} />
            </Parallax>
            <Parallax speed={0.035} delay={60}>
              <Calendar onRaceSelect={openRaceDetails} />
            </Parallax>
            <Parallax speed={0.05}>
              <AppDownloadBanner />
              <DriverBattle onOpenClash={openClash} />
            </Parallax>

            <Parallax speed={0.03} delay={80}>
              <section className="main-section">
                <div className="main-grid">
                  <DriversStandings onDriverSelect={openDriverProfile} />
                  <ConstructorsStandings onConstructorSelect={openConstructorProfile} />
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
            setUser={setUser}
            onClose={goToDashboard}
            onHomeNavigate={(hash) => {
              goToDashboard();
              setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
            }}
          />
        ) : view === 'privacy' ? (
          <PrivacyPolicy
            onBack={() => {
              setView('dashboard');
              window.history.pushState({}, '', '/');
              window.scrollTo(0, 0);
            }}
          />
        ) : view === 'account_deletion' ? (
          <AccountDeletionRequest
            user={user}
            onBack={() => {
              setView('dashboard');
              window.history.pushState({}, '', '/');
              window.scrollTo(0, 0);
            }}
          />
        ) : view === 'live' ? (
          <LiveTiming
            onBack={closeLiveTiming}
            user={user as any}
            setUser={setUser as any}
            onOpenSettings={() => setView('account')}
          />
        ) : view === 'schedule' ? (
          <>
            <ThemeSwitcher />
            <SchedulePage
              user={user as any}
              setUser={setUser as any}
              onBack={closeSchedule}
              onRaceSelect={openRaceDetails}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                closeSchedule();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'results' ? (
          <>
            <ThemeSwitcher />
            <ResultsPage
              user={user as any}
              setUser={setUser as any}
              onBack={closeResults}
              onRaceSelect={openRaceDetails}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                closeResults();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'standings' ? (
          <>
            <ThemeSwitcher />
            <DriverStandingsPage
              user={user as any}
              setUser={setUser as any}
              onBack={goToDashboard}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'constructor_standings' ? (
          <>
            <ThemeSwitcher />
            <ConstructorStandingsPage
              user={user as any}
              setUser={setUser as any}
              onBack={goToDashboard}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'statistics' ? (
          <>
            <ThemeSwitcher />
            <SeasonStatisticsPage
              user={user as any}
              setUser={setUser as any}
              onBack={returnFromStatistics}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'clash' ? (
          <>
            <ThemeSwitcher />
            <ClashPage
              user={user as any}
              setUser={setUser as any}
              onBack={goToDashboard}
              onOpenSettings={() => setView('account')}
              initialDriverIds={(() => {
                const params = new URLSearchParams(window.location.search);
                const driver1 = params.get('driver1');
                const driver2 = params.get('driver2');
                return driver1 && driver2 ? [driver1, driver2] : null;
              })()}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'driver_details' && parseDriverPath(window.location.pathname) ? (
          <>
            <ThemeSwitcher />
            <DriverDetailPage
              {...parseDriverPath(window.location.pathname)!}
              user={user as any}
              setUser={setUser as any}
              onBack={closeDriverProfile}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'constructor_details' && parseConstructorPath(window.location.pathname) ? (
          <>
            <ThemeSwitcher />
            <ConstructorDetailPage
              {...parseConstructorPath(window.location.pathname)!}
              user={user as any}
              setUser={setUser as any}
              onBack={closeConstructorProfile}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : view === 'track_details' && trackRace ? (
          <>
            <ThemeSwitcher />
            <TrackDetailsPage
              race={trackRace}
              user={user as any}
              setUser={setUser as any}
              onBack={closeTrackDetails}
              onOpenRace={openRaceDetails}
              onOpenSettings={() => setView('account')}
              onHomeNavigate={(hash) => {
                goToDashboard();
                setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 80);
              }}
            />
          </>
        ) : (
          <RaceDetails
            race={selectedRace}
            onBack={closeRaceDetails}
            user={user as any}
            setUser={setUser as any}
            onOpenSettings={() => setView('account')}
            onHomeNavigate={(hash) => {
              goToDashboard();
              // Defer until the dashboard has mounted, then scroll to the section.
              setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
          />
        )}
      </div>
    </Suspense>
  );
};

export default App;
