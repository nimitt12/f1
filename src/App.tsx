import { getToken } from './lib/auth';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { lazy, Suspense, useState, useEffect } from 'react';
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
import AccountPage from './components/AccountPage';
import LoginModal from './components/LoginModal';
import BootLoader from './components/BootLoader';
import PrivacyPolicy from './components/PrivacyPolicy';
import AccountDeletionRequest from './components/AccountDeletionRequest';
import ScrollProgress from './components/ScrollProgress';
import { raceSlug, type Race } from './data/races';

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

const App: React.FC = () => {
  const isAdminPortal = window.location.pathname === '/admin-portal';
  const initialRacePath = parseRacePath(window.location.pathname);
  const initialDriverPath = parseDriverPath(window.location.pathname);
  const initialConstructorPath = parseConstructorPath(window.location.pathname);
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
    localStorage.removeItem('f1_user');
    if (!getToken()) return null;
    const savedUser = sessionStorage.getItem('f1_user');
    if (!savedUser) return null;
    try {
      const parsed = JSON.parse(savedUser);
      // If legacy session missing ID, clear it
      if (!parsed.id) {
        sessionStorage.removeItem('f1_user');
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
      sessionStorage.removeItem('f1_user');
      return null;
    }
  });
  const [view, setView] = useState<'dashboard' | 'account' | 'race_details' | 'driver_details' | 'constructor_details' | 'live' | 'schedule' | 'results' | 'standings' | 'constructor_standings' | 'statistics' | 'clash' | 'privacy' | 'account_deletion'>(() => {
    // The URL is the source of truth for race details, live timing and the
    // privacy policy; only fall back to the persisted view (account/dashboard)
    // otherwise.
    if (initialRacePath) return 'race_details';
    if (initialDriverPath) return 'driver_details';
    if (initialConstructorPath) return 'constructor_details';
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

  const goToDashboard = () => {
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
    setView('statistics');
    window.history.pushState({}, '', '/statistics');
    window.scrollTo(0, 0);
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

  // Keep the view in sync with browser back/forward navigation.
  useEffect(() => {
    const onPopState = () => {
      const target = parseRacePath(window.location.pathname);
      const driverTarget = parseDriverPath(window.location.pathname);
      const constructorTarget = parseConstructorPath(window.location.pathname);
      if (target) {
        setView('race_details');
        const found = races.find((r) => matchesRacePath(r, target));
        setSelectedRace(found ?? null);
      } else if (driverTarget) {
        setView('driver_details');
      } else if (constructorTarget) {
        setView('constructor_details');
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
      sessionStorage.setItem('f1_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('f1_user');
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
                  onOpenLiveTiming={openLiveTiming}
                />
              ) : (
                <NextRace onRaceSelect={openRaceDetails} onViewAllResults={openResults} />
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
            onClose={() => setView('dashboard')}
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
              onBack={goToDashboard}
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
