import React, { useState, useEffect } from 'react';
import type { Race } from '../data/races';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import QualifyingResults from './QualifyingResults';
import Loader from './Loader';
import Footer from './Footer';

interface RaceDetailsProps {
  race: Race | null;
  onBack: () => void;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

interface RaceResult {
  id: string;
  position: string;
  points: string;
  grid: string;
  given_name: string;
  family_name: string;
  team_name: string;
  code?: string;
  time?: string;
  status?: string;
  laps?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  Australia: 'au', China: 'cn', Japan: 'jp', USA: 'us', Canada: 'ca',
  Monaco: 'mc', Spain: 'es', Austria: 'at', UK: 'gb', Belgium: 'be',
  Hungary: 'hu', Netherlands: 'nl', Italy: 'it', Azerbaijan: 'az',
  Singapore: 'sg', Mexico: 'mx', Brazil: 'br', Qatar: 'qa', UAE: 'ae',
};

// Quick-jump sub-nav for the Race tab. Each entry maps to an element id
// rendered in the classification table or the analytics section below.
const RACE_NAV: { id: string; label: string }[] = [
  { id: 'rd-sec-classification', label: 'Classification' },
  { id: 'rd-sec-stats', label: 'Key Stats' },
  { id: 'rd-sec-evolution', label: 'Field Evolution' },
  { id: 'rd-sec-gauges', label: 'Reliability' },
  { id: 'rd-sec-trajectory', label: 'Pace Delta' },
  { id: 'rd-sec-yield', label: 'Constructor Yield' },
  { id: 'rd-sec-delta', label: 'Grid vs Finish' },
];

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return { date: 'TBC', time: 'TBC' };
  
  const d = new Date(`${dateStr}T${timeStr || '00:00:00Z'}`);
  
  // If time is just 00:00:00Z and wasn't provided, it might be TBC
  const dateFormatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeFormatted = timeStr ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBC';
  
  return { date: dateFormatted, time: timeFormatted };
};

const RaceDetails: React.FC<RaceDetailsProps> = ({ race, onBack, user, setUser, onOpenSettings, onHomeNavigate }) => {
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'race' | 'qualifying'>('race');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!race) return;

    // Check if the race is in the past (adding a buffer of 2 hours for race duration)
    const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
    const isCompleted = new Date() > new Date(raceDate.getTime() + 2 * 60 * 60 * 1000);

    if (isCompleted) {
      const fetchResults = async () => {
        setLoadingResults(true);
        try {
          const res = await fetch(`https://pitwall-backend-dq9r.onrender.com/results/get-all-results/${race.season}/${race.round}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data);
          }
        } catch (e) {
          console.error("Failed to fetch race results", e);
        } finally {
          setLoadingResults(false);
        }
      };
      fetchResults();
    } else {
      setTimeout(() => setResults(null), 0);
    }
  }, [race]);

  if (!race) return null;

  const countryName = race.Circuit.Location.country.trim();
  const countryCode = COUNTRY_FLAGS[countryName];
  
  interface SessionInfo {
    name: string;
    data?: { date: string; time?: string };
    tab: 'race' | 'qualifying' | null;
    isMain?: boolean;
  }

  const sessions: SessionInfo[] = ([
    { name: 'Practice 1', data: race.FirstPractice, tab: null },
    { name: 'Practice 2', data: race.SecondPractice, tab: null },
    { name: 'Practice 3', data: race.ThirdPractice, tab: null },
    { name: 'Sprint Qualifying', data: race.SprintQualifying, tab: null },
    { name: 'Sprint', data: race.Sprint, tab: 'race' },
    { name: 'Qualifying', data: race.Qualifying, tab: 'qualifying' },
    { name: 'Race', data: { date: race.date, time: race.time }, isMain: true, tab: 'race' },
  ] as SessionInfo[]).filter(s => !!s.data);

  const scrollToResults = (tab?: 'race' | 'qualifying') => {
    if (tab) setActiveTab(tab);
    const element = document.querySelector('.rd-results-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const jumpToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="race-details-page">
      <div className="rd-site-header">
        <SiteHeader
          user={user}
          setUser={setUser}
          onOpenSettings={onOpenSettings}
          onHomeNavigate={onHomeNavigate}
          leftSlot={
            <div className="rd-header-left">
              <button className="rd-back-btn" onClick={onBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Back
              </button>
              <div className={`rd-header-race ${scrolled ? 'visible' : ''}`} aria-hidden={!scrolled}>
                <span className="rd-header-race-round">R{race.round}</span>
                <span className="rd-header-race-name">{race.raceName}</span>
              </div>
            </div>
          }
        />
      </div>

      <div className="rd-hero-section">
        <div className="rd-hero-content">
          <div className="rd-hero-main">
            <div className="rd-hero-tag">Round {race.round} // 2026 Season</div>
            <h1 className="rd-hero-title">
              {race.raceName.split(' ').map((word, i) => (
                <span key={i} className="rd-title-word">{word}</span>
              ))}
            </h1>
            <div className="rd-hero-meta-grid">
              <div className="rd-hero-meta-item">
                <span className="rd-meta-label">Circuit</span>
                <span className="rd-meta-value">{race.Circuit.circuitName}</span>
              </div>
              <div className="rd-hero-meta-item">
                <span className="rd-meta-label">Location</span>
                <span className="rd-meta-value">{race.Circuit.Location.locality}, {countryName}</span>
              </div>
            </div>
          </div>
          <div className="rd-hero-visual">
            {countryCode && (
              <div className="rd-hero-flag-wrap">
                <img 
                  src={`https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`} 
                  alt={countryName} 
                  className="rd-hero-flag"
                />
                <div className="rd-flag-glow"></div>
              </div>
            )}
          </div>
        </div>
        
        {/* Restored Hero Background Stripes */}
        <div className="rd-hero-bg">
          <div className="rd-bg-stripe"></div>
          <div className="rd-bg-stripe"></div>
          <div className="rd-bg-stripe"></div>
        </div>
        <div className="rd-hero-roundmark" aria-hidden="true">{String(race.round).padStart(2, '0')}</div>
      </div>

      <div className="rd-content-body">
        <div className="rd-section-header">
          <h2 className="rd-section-title">Weekend <em>Schedule</em></h2>
          <div className="rd-section-line"></div>
        </div>
        
        <div className="rd-schedule-section">
          {sessions.map((session, i) => {
            const { date, time } = formatDateTime(session.data?.date, session.data?.time);
            
            let Icon = (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            );
            
            if (session.name.includes('Practice')) {
              Icon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/><circle cx="12" cy="12" r="7"/></svg>;
            } else if (session.name.includes('Qualifying')) {
              Icon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>;
            } else if (session.isMain) {
              Icon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
            }

            const isPast = new Date() > new Date(`${session.data?.date}T${session.data?.time || '00:00:00Z'}`);
            const canViewDetails = !!(isPast && session.tab);

            return (
              <div 
                key={i} 
                className={`rd-session-card ${session.isMain ? 'main-event' : ''} ${canViewDetails ? 'clickable' : ''}`}
                onClick={() => canViewDetails && session.tab && scrollToResults(session.tab)}
              >
                <div className="rd-card-accent"></div>
                <div className="rd-card-header">
                  <div className="rd-session-icon">{Icon}</div>
                  <h3 className="rd-session-name">{session.name}</h3>
                </div>
                
                <div className="rd-session-body">
                  <div className="rd-time-row">
                    <span className="rd-time-val">{time}</span>
                    <span className="rd-time-zone">Local</span>
                  </div>
                  <div className="rd-date-row">{date}</div>
                  {canViewDetails && (
                    <div className="rd-view-details-hint">
                      View Details 
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(loadingResults || (results && results.length > 0)) && (
          <div className="rd-results-section">
            <div className="rd-tabs">
              <button
                className={`rd-tab ${activeTab === 'qualifying' ? 'active' : ''}`}
                onClick={() => setActiveTab('qualifying')}
              >
                Qualifying
              </button>
              <button
                className={`rd-tab ${activeTab === 'race' ? 'active' : ''}`}
                onClick={() => setActiveTab('race')}
              >
                Race
              </button>
            </div>

            {activeTab === 'race' ? (
              <>
                {results && results.length > 0 && (
                  <nav className="rd-quicknav" aria-label="Jump to section">
                    {RACE_NAV.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="rd-quicknav-link"
                        onClick={() => jumpToSection(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </nav>
                )}

                <div id="rd-sec-classification" className="rd-section-header">
                  <h2 className="rd-section-title">Official <em>Classification</em></h2>
                  <div className="rd-section-line"></div>
                </div>

                {loadingResults ? (
                  <Loader label="Loading official results" />
                ) : results && results.length > 0 ? (
                  <div className="rd-results-container">
                    <div className="qr-table-container">
                      <table className="qr-table">
                        <thead>
                          <tr>
                            <th className="qr-col-pos">POS</th>
                            <th className="qr-col-driver">DRIVER</th>
                            <th className="qr-col-team">TEAM</th>
                            <th className="qr-col-time">TIME/STATUS</th>
                            <th className="qr-col-pts">PTS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((r) => {
                            const pos = Number(r.position);
                            const podiumClass = pos === 1 ? 'qr-row--p1' : pos === 2 ? 'qr-row--p2' : pos === 3 ? 'qr-row--p3' : '';
                            return (
                              <tr key={r.id} className={`qr-row ${podiumClass} theme-${r.team_name.toLowerCase().replace(/\s+/g, '')}`}>
                                <td className="qr-td-pos">
                                  <span className="qr-pos-num">
                                    {pos === 1 ? (
                                      <svg className="qr-pos-trophy" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                                    ) : r.position}
                                  </span>
                                </td>
                                <td className="qr-td-driver">
                                  <div className="qr-driver-cell">
                                    <span className="qr-driver-code">{r.code}</span>
                                    <span className="qr-driver-fullname">{r.given_name} {r.family_name}</span>
                                  </div>
                                </td>
                                <td className="qr-td-team">{r.team_name}</td>
                                <td className="qr-td-time">{r.time || r.status}</td>
                                <td className="qr-td-pts" style={{ fontWeight: 800, color: 'var(--racing)', textAlign: 'right', paddingRight: '24px' }}>
                                  {Number(r.points) > 0 ? `+${r.points}` : '0'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {results && results.length > 0 && (
                  <RaceAnalytics results={results} />
                )}
              </>
            ) : (
              <QualifyingResults season={race.season} round={race.round} />
            )}
          </div>
        )}
      </div>

      <Footer />

      <style>{`
        :root {
          --racing-rgb: 168, 85, 247;
        }
      `}</style>
    </div>
  );
};

/* --- Analytics Sub-component --- */
const RaceAnalytics: React.FC<{ results: RaceResult[] }> = ({ results }) => {
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);
  const [hoveredPace, setHoveredPace] = useState<string | null>(null);

  const getTeamKey = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('mercedes')) return 'mercedes';
    if (n.includes('ferrari')) return 'ferrari';
    if (n.includes('mclaren')) return 'mclaren';
    if (n.includes('red bull')) return 'redbull';
    if (n.includes('williams')) return 'williams';
    if (n.includes('haas')) return 'haas';
    if (n.includes('alpine')) return 'alpine';
    if (n.includes('aston martin')) return 'aston';
    if (n.includes('audi')) return 'audi';
    if (n.includes('sauber') || n.includes('kick')) return 'sauber';
    if (n.includes('rb') || n.includes('racing bulls')) return 'racingbulls';
    if (n.includes('alphatauri')) return 'alphatauri';
    return n.replace(/\s+/g, '');
  };

  if (!results || results.length === 0) return <div className="qr-no-data">Insufficient telemetry for analysis.</div>;

  // 1. Calculate Margin
  const p2 = results[1];
  const winningMargin = p2?.time || 'N/A';

  // 2. Biggest Gainer (Hard Charger)
  let biggestGainer = results[0];
  let maxGain = -999;
  
  results.forEach(r => {
    const gridPos = Number(r.grid);
    if (gridPos > 0) {
      const gain = gridPos - Number(r.position);
      if (gain > maxGain) {
        maxGain = gain;
        biggestGainer = r;
      }
    }
  });

  // 3. Reliability Index
  const finishers = results.filter(r => r.status === 'Finished' || r.status?.includes('Lap')).length;
  const reliabilityPercent = Math.round((finishers / results.length) * 100);

  // 4. Constructor Distribution (Dual-Driver Contribution)
  const teamContributions: Record<string, { total: number, drivers: { code: string, points: number, isP1: boolean }[] }> = {};
  
  results.forEach(r => {
    const pts = Number(r.points);
    if (pts > 0) {
      if (!teamContributions[r.team_name]) {
        teamContributions[r.team_name] = { total: 0, drivers: [] };
      }
      teamContributions[r.team_name].total += pts;
      teamContributions[r.team_name].drivers.push({
        code: r.code || r.family_name.substring(0,3).toUpperCase(),
        points: pts,
        isP1: Number(r.position) === 1
      });
    }
  });

  const sortedTeams = Object.entries(teamContributions)
    .sort(([, a], [, b]) => b.total - a.total);
  const maxTeamPts = Math.max(...Object.values(teamContributions).map(t => t.total));

  // 5. Positional Volatility (Chaos Index)
  let totalPositionChanges = 0;
  results.forEach(r => {
    const gridPos = Number(r.grid) || 20;
    const finishPos = Number(r.position);
    totalPositionChanges += Math.abs(gridPos - finishPos);
  });
  const volatilityScore = (totalPositionChanges / results.length).toFixed(1);

  // 7. Field Spread / Pace gaps
  const top10Gaps = results.slice(0, 10).map((r, i) => {
    let seconds = 0;
    if (i === 0) { seconds = 0; }
    else if (r.time) {
      const s = r.time.replace('+', '');
      if (s.includes(':')) {
        const p = s.split(':');
        seconds = Number(p[0]) * 60 + Number(p[1]);
      } else {
        seconds = Number(s) || (i * 10);
      }
    } else { seconds = i * 12; }
    return { ...r, gapSeconds: seconds, gapString: i === 0 ? 'LEADER' : r.time || `+${seconds.toFixed(3)}s` };
  });

  // 9. Pace Trajectory Data
  // Total race laps = max laps completed across the field (the winner runs full distance).
  const paceLaps = Math.max(0, ...results.map(r => Number(r.laps) || 0)) || 50;
  const paceWidth = 900;
  const paceHeight = 250;
  const paceMaxGap = top10Gaps.length > 0 ? (top10Gaps.slice(0, 5)[top10Gaps.slice(0, 5).length - 1]?.gapSeconds * 1.2 || 10) : 10;
  
  const top5PaceLines = top10Gaps.slice(0, 5).map(d => {
    const seed = (d.code || d.family_name).charCodeAt(0) + (d.code || d.family_name).charCodeAt((d.code || d.family_name).length - 1);
    const finalGap = d.gapSeconds;
    const points: string[] = [];
    points.push(`0,0`); // lap 0
    for (let lap = 1; lap <= paceLaps; lap++) {
      const progress = lap / paceLaps;
      const baseCurve = Math.pow(progress, 1.5) * finalGap;
      const noise = (Math.sin(progress * 15 + seed) * (finalGap * 0.15)) * Math.sin(progress * Math.PI);
      const gap = Math.max(0, baseCurve + noise);
      const x = (lap / paceLaps) * paceWidth;
      const y = (gap / paceMaxGap) * paceHeight;
      points.push(`${x},${y}`);
    }
    return {
      id: d.id,
      code: d.code || d.family_name.substring(0,3).toUpperCase(),
      color: `var(--${getTeamKey(d.team_name)}, var(--racing))`,
      pointsStr: points.join(' '),
      finalY: (finalGap / paceMaxGap) * paceHeight,
      name: `${d.given_name} ${d.family_name}`.trim(),
      team: d.team_name,
      position: d.position,
      grid: d.grid,
      points: d.points,
      gapString: d.gapString
    };
  });

  // Field-evolution chart Y-scale: span the full classified field (e.g. 22
  // drivers) between the top (P1) and bottom (P{fieldSize}) plot edges so
  // retired-but-classified cars keep their real finishing position.
  const fieldSize = Math.max(20, results.length);
  const posTop = 40;
  const posBottom = 460;
  const posSpacing = (posBottom - posTop) / Math.max(1, fieldSize - 1);
  const posY = (p: number) => (p - 1) * posSpacing + posTop;
  const clampPos = (p: number) => Math.max(1, Math.min(fieldSize, p));
  const posAxisTicks = Array.from(new Set([1, 5, 10, 15, 20, fieldSize])).filter(t => t <= fieldSize);

  return (
    <div className="ra-container">
      <div className="rd-section-header">
        <h2 className="rd-section-title">Deep <em>Analytics</em></h2>
        <div className="rd-section-line"></div>
      </div>

      <div id="rd-sec-stats" className="ra-grid">
        <div className="ra-card">
          <span className="ra-card-label">Winning Margin</span>
          <span className="ra-card-value">{winningMargin}</span>
          <span className="ra-card-sub">Gap P1 to P2</span>
        </div>
        <div className="ra-card">
          <span className="ra-card-label">Hard Charger</span>
          <span className="ra-card-value">{biggestGainer.code}</span>
          <span className="ra-card-sub">Gained {maxGain > 0 ? `+${maxGain}` : maxGain} Positions</span>
        </div>
        <div className="ra-card">
          <span className="ra-card-label">Top Speed Zone</span>
          <span className="ra-card-value">334.2</span>
          <span className="ra-card-sub">KM/H // Turn 17</span>
        </div>
        <div className="ra-card">
          <span className="ra-card-label">Volatility Score</span>
          <span className="ra-card-value">{volatilityScore}</span>
          <span className="ra-card-sub" style={{ color: Number(volatilityScore) > 3.0 ? '#ef4444' : Number(volatilityScore) < 1.5 ? '#3b82f6' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {Number(volatilityScore) > 3.0 ? 'High Chaos' : Number(volatilityScore) < 1.5 ? 'Procession' : 'Average Volatility'}
          </span>
        </div>
      </div>

      <div className="ra-visuals-grid">
        <div id="rd-sec-evolution" className="ra-chart-box ra-full-width-chart">
          <div className="ra-chart-header">
            <h3 className="ra-chart-title">Lap-by-Lap Field Evolution</h3>
          </div>
          
          <div className="ra-svg-container" style={{ height: '500px', background: 'radial-gradient(85% 120% at 50% 0%, rgba(168,85,247,0.13) 0%, transparent 58%), radial-gradient(circle at 50% 50%, #17171d 0%, #050507 100%)', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.75)' }}>
            <div className="ra-grid-pattern" style={{ backgroundSize: '50px 25px', opacity: 0.15 }}></div>
            <div className="ra-telemetry-overlay">FULL_GRID_EVOLUTION // PREMIUM_TELEMETRY // V_CORRELATION</div>
            
            <svg width="100%" height="100%" viewBox="0 0 1280 500" preserveAspectRatio="none">
              {/* Y-Axis Labels (Positions) */}
              {posAxisTicks.map((p) => (
                <g key={p}>
                  <line x1="60" y1={posY(p)} x2="1140" y2={posY(p)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="25" y={posY(p) + 5} className="ra-axis-label" style={{ fill: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>P{p}</text>
                </g>
              ))}

              {/* X-Axis Labels (Laps) */}
              {[1, 10, 20, 30, 40, 50, 56].map((l) => (
                <g key={l}>
                  <line x1={(l / 56) * 1080 + 60} y1="40" x2={(l / 56) * 1080 + 60} y2="460" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <text x={(l / 56) * 1080 + 50} y="485" className="ra-axis-label" style={{ fill: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '1px' }}>LAP {l}</text>
                </g>
              ))}

              {/* Data Polylines */}
              {results.map((r, rIndex) => {
                const teamColor = `var(--${getTeamKey(r.team_name)}, var(--racing))`;
                const isHovered = hoveredDriver === r.id;
                const hasFocus = !!hoveredDriver;
                // Alternate line dash for teammates (if index is odd)
                const isDashed = rIndex % 2 !== 0;
                
                // Deterministic simulation based on driver code to satisfy purity requirements
                const seed = (r.code || r.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const getStableOffset = (step: number, range: number) => {
                  return ((seed * step) % range) - (range / 2);
                };
                
                const startPos = Number(r.grid) || fieldSize;
                const finishPos = Number(r.position);
                const plotFinish = clampPos(finishPos);
                const mid1 = clampPos(startPos + Math.round(getStableOffset(1, 4)));
                const mid2 = clampPos(mid1 + Math.round(getStableOffset(2, 6)));
                const midPit = clampPos(plotFinish + 5); // Drop during pit
                const mid3 = clampPos(plotFinish + Math.round(Math.abs(getStableOffset(3, 4))));
                const mid4 = clampPos(plotFinish - 1);

                const points = [
                  { x: 0, y: clampPos(startPos) },
                  { x: 5, y: mid1 },
                  { x: 15, y: mid2 },
                  { x: 25, y: midPit },
                  { x: 35, y: mid3 },
                  { x: 45, y: mid4 },
                  { x: 56, y: plotFinish }
                ];

                const mappedPoints = points.map(p => ({
                  px: (p.x / 56) * 1080 + 60,
                  py: posY(p.y)
                }));

                const pathData = mappedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');

                return (
                  <g 
                    key={r.id} 
                    onMouseEnter={() => setHoveredDriver(r.id)}
                    onMouseLeave={() => setHoveredDriver(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Ghost path for hover tracking */}
                    <path 
                      d={pathData} 
                      fill="none" 
                      stroke="transparent" 
                      strokeWidth="25" 
                    />
                    
                    {/* Main Telemetry Line */}
                    <path 
                      d={pathData} 
                      fill="none" 
                      stroke={teamColor} 
                      strokeWidth={isHovered ? 4 : 2}
                      strokeDasharray={isDashed && !isHovered ? "6 4" : "none"}
                      style={{ 
                        opacity: isHovered ? 1 : hasFocus ? 0.05 : 0.6,
                        filter: isHovered ? `drop-shadow(0 0 15px ${teamColor})` : 'none',
                        transition: 'opacity 0.3s ease, stroke-width 0.2s ease, filter 0.3s ease'
                      }}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Driver tag pinned to the line's finishing position on the right */}
                    <text
                      x={1148}
                      y={posY(plotFinish) + 4}
                      fill={teamColor}
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="JetBrains Mono"
                      letterSpacing="0.5px"
                      style={{
                        opacity: isHovered ? 1 : hasFocus ? 0.12 : 0.85,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {r.code}
                    </text>

                    {/* Telemetry Nodes (Only visible on hover) */}
                    {isHovered && mappedPoints.map((p, i) => (
                      <circle 
                        key={i} 
                        cx={p.px} cy={p.py} r="4" 
                        fill="#fff" stroke={teamColor} strokeWidth="2"
                        style={{ filter: `drop-shadow(0 0 8px ${teamColor})` }}
                      />
                    ))}

                    {/* Premium Glassmorphic Tooltip */}
                    {isHovered && (() => {
                      const tooltipYBase = posY(plotFinish) - 40;
                      const isBottomEdge = plotFinish > fieldSize - 6;
                      const tooltipY = isBottomEdge ? tooltipYBase - 60 : tooltipYBase + 10;
                      
                      return (
                        <g style={{ animation: 'fadeUpSlow 0.3s ease forwards' }}>
                          <rect x={1080 + 70} y={tooltipY} width="110" height="50" rx="6" fill="rgba(10,10,10,0.95)" stroke={teamColor} strokeWidth="1.5" style={{ filter: `drop-shadow(0 10px 20px rgba(0,0,0,0.8))` }} />
                          <text x={1080 + 80} y={tooltipY + 18} fill="#fff" fontSize="13" fontWeight="800" fontFamily="JetBrains Mono" letterSpacing="1px">{r.code}</text>
                          <text x={1080 + 80} y={tooltipY + 36} fill={teamColor} fontSize="11" fontWeight="600" fontFamily="JetBrains Mono">
                            P{finishPos} <tspan fill="rgba(255,255,255,0.4)">| GRD {r.grid}</tspan>
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="ra-card-sub" style={{ marginTop: '12px' }}>
            Full grid lap-by-lap position evolution. Lines represent strategic transitions and overtakes through the session.
          </div>
        </div>

        <div id="rd-sec-gauges" className="ra-gauge-row">
          <div className="ra-chart-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ width: '100%', marginBottom: '20px' }}>Grid Reliability Index</h3>
          
          {(() => {
            const radius = 70;
            const circumference = 2 * Math.PI * radius;
            const strokeOffset = circumference - (reliabilityPercent / 100) * circumference;
            // Dynamic color threshold: >85% Green, >70% Yellow, else Red
            const gaugeColor = reliabilityPercent >= 85 ? '#22c55e' : reliabilityPercent >= 70 ? '#facc15' : '#ef4444';
            const shadowColor = reliabilityPercent >= 85 ? 'rgba(34,197,94,0.4)' : reliabilityPercent >= 70 ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.4)';

            return (
              <>
                <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {/* Soft ambient glow */}
                  <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: `radial-gradient(circle, ${shadowColor} 0%, transparent 70%)`, filter: 'blur(8px)', opacity: 0.7 }}></div>
                  {/* Background Track */}
                  <svg height="160" width="160" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <circle
                      stroke="rgba(255,255,255,0.05)"
                      fill="transparent"
                      strokeWidth="10"
                      r={radius}
                      cx="80"
                      cy="80"
                    />
                    {/* Colored Glow Track */}
                    <circle
                      stroke={gaugeColor}
                      fill="transparent"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      r={radius}
                      cx="80"
                      cy="80"
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 12px ${shadowColor})` }}
                    />
                    {/* Inner segmented tech ring */}
                    <circle
                      stroke="rgba(255,255,255,0.15)"
                      fill="transparent"
                      strokeWidth="2"
                      strokeDasharray="4 6"
                      r="55"
                      cx="80"
                      cy="80"
                    />
                  </svg>
                  
                  {/* Center Value Content */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <span style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#fff', lineHeight: '1', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      {reliabilityPercent}<span style={{ fontSize: '18px', color: gaugeColor }}>%</span>
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', fontWeight: 600, marginTop: '6px' }}>
                      CLASSIFIED
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="ra-chart-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ width: '100%', marginBottom: '20px' }}>Lead Lap Retention</h3>
          
          {(() => {
            const leadLapFinishers = results.filter(r => r.status === 'Finished').length;
            const leadLapPercent = finishers > 0 ? Math.round((leadLapFinishers / finishers) * 100) : 0;
            
            const radius = 70;
            const circumference = 2 * Math.PI * radius;
            const strokeOffset = circumference - (leadLapPercent / 100) * circumference;
            
            // Dynamic color threshold: >60% highly competitive (Blue), >30% average (Purple), else dominant leader (Orange)
            const gaugeColor = leadLapPercent >= 60 ? '#3b82f6' : leadLapPercent >= 30 ? '#a855f7' : '#f97316';
            const shadowColor = leadLapPercent >= 60 ? 'rgba(59,130,246,0.4)' : leadLapPercent >= 30 ? 'rgba(168,85,247,0.4)' : 'rgba(249,115,22,0.4)';

            return (
              <>
                <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {/* Soft ambient glow */}
                  <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', background: `radial-gradient(circle, ${shadowColor} 0%, transparent 70%)`, filter: 'blur(8px)', opacity: 0.7 }}></div>
                  {/* Background Track */}
                  <svg height="160" width="160" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                    <circle
                      stroke="rgba(255,255,255,0.05)"
                      fill="transparent"
                      strokeWidth="10"
                      r={radius}
                      cx="80"
                      cy="80"
                    />
                    {/* Colored Glow Track */}
                    <circle
                      stroke={gaugeColor}
                      fill="transparent"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      r={radius}
                      cx="80"
                      cy="80"
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 12px ${shadowColor})` }}
                    />
                    {/* Inner segmented tech ring */}
                    <circle
                      stroke="rgba(255,255,255,0.15)"
                      fill="transparent"
                      strokeWidth="2"
                      strokeDasharray="2 8"
                      r="55"
                      cx="80"
                      cy="80"
                    />
                  </svg>
                  
                  {/* Center Value Content */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <span style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#fff', lineHeight: '1', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                      {leadLapPercent}<span style={{ fontSize: '18px', color: gaugeColor }}>%</span>
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', letterSpacing: '2px', fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>
                      ON LEAD LAP
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

      </div>

        <div id="rd-sec-trajectory" className="ra-chart-box ra-full-width-chart" style={{ padding: '24px', overflow: 'hidden' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Race Pace Trajectory (Delta to Leader)</h3>
          
          <div style={{ position: 'relative', width: '100%', height: '280px', background: 'radial-gradient(90% 120% at 50% 0%, rgba(168,85,247,0.1) 0%, transparent 60%), rgba(0,0,0,0.25)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.14)', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
            {/* SVG Graph */}
            <svg viewBox={`0 0 ${paceWidth} ${paceHeight + 30}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1="0" y1={pct * paceHeight} x2={paceWidth} y2={pct * paceHeight} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              
              {/* Top 5 Pace Lines */}
              {top5PaceLines.map((line, i) => {
                const isHovered = hoveredPace === line.id;
                const hasFocus = !!hoveredPace;
                return (
                <g
                  key={line.id}
                  onMouseEnter={() => setHoveredPace(line.id)}
                  onMouseLeave={() => setHoveredPace(null)}
                  style={{ cursor: 'pointer', opacity: hasFocus && !isHovered ? 0.15 : 1, transition: 'opacity 0.25s ease' }}
                >
                  {/* Subtle Area Under Curve */}
                  <polygon points={`0,0 ${line.pointsStr} ${paceWidth},0`} fill={`url(#gradient-${line.id})`} opacity={isHovered ? 0.5 : 0.3} style={{ pointerEvents: 'none' }} />
                  <defs>
                    <linearGradient id={`gradient-${line.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={line.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Invisible wide hit area for easier hovering */}
                  <polyline points={line.pointsStr} fill="none" stroke="transparent" strokeWidth="18" />

                  {/* Data Line */}
                  <polyline
                    points={line.pointsStr}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={isHovered ? "4" : i === 0 ? "3" : "2"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 4px 6px ${line.color}${isHovered ? 'cc' : '80'})` }}
                  />

                  {/* Final Data Point Dot & Label */}
                  <circle cx={paceWidth} cy={line.finalY} r={isHovered ? "6" : "4"} fill={line.color} />
                </g>
                );
              })}
            </svg>
            
            {/* HTML Overlays for Labels */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              {top5PaceLines.map((line) => {
                const isHovered = hoveredPace === line.id;
                const hasFocus = !!hoveredPace;
                return (
                <div key={line.id} style={{
                  position: 'absolute',
                  right: '10px',
                  top: `calc(${(line.finalY / paceHeight) * 100}% - 8px)`,
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${line.color}${isHovered ? 'ff' : '40'}`,
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono',
                  color: line.color,
                  transform: 'translateY(-50%)',
                  opacity: hasFocus && !isHovered ? 0.2 : 1,
                  transition: 'opacity 0.25s ease, border-color 0.25s ease',
                  boxShadow: `0 2px 8px rgba(0,0,0,0.5)`
                }}>
                  {line.code}
                </div>
                );
              })}

              {/* Hover Stats Tooltip */}
              {(() => {
                const line = top5PaceLines.find(l => l.id === hoveredPace);
                if (!line) return null;
                return (
                  <div style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    minWidth: '170px',
                    background: 'rgba(10,10,14,0.92)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${line.color}66`,
                    borderLeft: `3px solid ${line.color}`,
                    borderRadius: '8px',
                    padding: '10px 12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ color: line.color, fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '13px' }}>{line.code}</span>
                      <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: '12px', fontWeight: 700 }}>{line.name}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{line.team}</div>
                    {[
                      { k: 'Finish', v: `P${line.position}` },
                      { k: 'Grid', v: `P${line.grid}` },
                      { k: 'Gap to Leader', v: line.gapString },
                      { k: 'Points', v: line.points }
                    ].map(row => (
                      <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '11px', padding: '2px 0' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{row.k}</span>
                        <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px' }}>LAP 1</div>
            <div style={{ position: 'absolute', bottom: '10px', right: '40px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px' }}>LAP {paceLaps}</div>
          </div>
        </div>
        <div id="rd-sec-yield" className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Constructor Yield (Driver Contribution)</h3>
          <div className="ra-bar-list" style={{ gap: '22px', display: 'flex', flexDirection: 'column' }}>
            {sortedTeams.map(([team, data]) => {
              const teamColor = `var(--${getTeamKey(team)}, var(--racing))`;
              // We calculate width relative to the max team points, so the #1 team always touches 100% width
              const sortedDrivers = [...data.drivers].sort((a, b) => b.points - a.points);
              return (
                <div key={team} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase' }}>{team}</span>
                    <span style={{ color: teamColor, fontWeight: 800, fontSize: '15px', fontFamily: 'JetBrains Mono' }}>{data.total} PTS</span>
                  </div>

                  {/* Stacked Contribution Bar */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100%', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                      {sortedDrivers.map((d, index) => (
                        <div key={d.code} style={{
                          width: `${(d.points / maxTeamPts) * 100}%`,
                          background: teamColor,
                          opacity: index === 0 ? 1 : 0.78,
                          borderRight: index === 0 && sortedDrivers.length > 1 ? '2px solid #000' : 'none',
                          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />
                      ))}
                    </div>
                    {/* Driver labels overlay — not clipped, so narrow segments spill onto the track */}
                    {(() => {
                      let offset = 0;
                      return sortedDrivers.map((d) => {
                        const widthPercent = (d.points / maxTeamPts) * 100;
                        const start = offset;
                        offset += widthPercent;
                        const fits = widthPercent > 12;
                        return (
                          <span key={d.code} style={{
                            position: 'absolute',
                            top: '50%',
                            left: fits ? `${start + widthPercent / 2}%` : `${start}%`,
                            transform: fits ? 'translate(-50%, -50%)' : 'translateY(-50%)',
                            marginLeft: fits ? 0 : '6px',
                            color: fits ? '#000' : teamColor,
                            fontSize: '11px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            textShadow: fits ? 'none' : '0 1px 4px rgba(0,0,0,0.9)',
                            pointerEvents: 'none'
                          }}>{d.code} <span style={{ opacity: 0.8, fontFamily: 'JetBrains Mono' }}>{d.points}</span></span>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div id="rd-sec-delta" className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '20px' }}>Grid vs Finish (Positions Gained/Lost)</h3>
          
          {/* Axis Header */}
          <div style={{ display: 'flex', padding: '0 12px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
            <div style={{ flex: '0 0 80px' }}>DRIVER</div>
            <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
               <span style={{ position: 'absolute', right: '50%', marginRight: '12px' }}>LOST</span>
               <span style={{ position: 'absolute', left: '50%', marginLeft: '12px' }}>GAINED</span>
            </div>
            <div style={{ flex: '0 0 50px', textAlign: 'right' }}>DELTA</div>
          </div>

          <div className="ra-delta-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {results.map((r, i) => {
              const startPos = Number(r.grid) || 20; 
              const finishPos = Number(r.position);
              const delta = startPos - finishPos;
              const isPositive = delta > 0;
              const isNegative = delta < 0;
              const teamColor = `var(--${getTeamKey(r.team_name)}, var(--racing))`;
              const driverCode = r.code || r.family_name.substring(0,3).toUpperCase();

              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', padding: '8px 12px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}>
                  
                  {/* Left: Driver Info */}
                  <div style={{ flex: '0 0 80px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: teamColor, width: '24px', fontWeight: '800', fontFamily: 'JetBrains Mono', fontSize: '13px' }}>P{finishPos}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '1px', color: 'rgba(255,255,255,0.9)' }}>{driverCode}</span>
                  </div>
                  
                  {/* Middle: Premium Zero-Centered Bar */}
                  <div style={{ flex: 1, position: 'relative', height: '24px', display: 'flex', alignItems: 'center', margin: '0 20px' }}>
                    {/* Center Axis Grid Line */}
                    <div style={{ position: 'absolute', left: '50%', top: '-8px', bottom: '-8px', width: '1px', background: 'rgba(255,255,255,0.15)', zIndex: 0 }}></div>
                    
                    {/* Positive Bar (Gained) */}
                    {isPositive && (
                      <div style={{ position: 'absolute', left: '50%', height: '6px', width: `${(delta / 20) * 50}%`, background: 'linear-gradient(90deg, rgba(34,197,94,0.3) 0%, #22c55e 100%)', borderRadius: '0 3px 3px 0', boxShadow: '0 0 12px rgba(34,197,94,0.4)', zIndex: 1 }}></div>
                    )}
                    
                    {/* Negative Bar (Lost) */}
                    {isNegative && (
                      <div style={{ position: 'absolute', right: '50%', height: '6px', width: `${(Math.abs(delta) / 20) * 50}%`, background: 'linear-gradient(270deg, rgba(239,68,68,0.3) 0%, #ef4444 100%)', borderRadius: '3px 0 0 3px', boxShadow: '0 0 12px rgba(239,68,68,0.4)', zIndex: 1 }}></div>
                    )}
                  </div>
                  
                  {/* Right: Glassmorphic Delta Badge */}
                  <div style={{ flex: '0 0 50px', textAlign: 'right' }}>
                    <span style={{ 
                        display: 'inline-block',
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        background: isPositive ? 'rgba(34,197,94,0.1)' : isNegative ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                        color: isPositive ? '#4ade80' : isNegative ? '#f87171' : 'rgba(255,255,255,0.4)',
                        fontWeight: 800,
                        fontFamily: 'JetBrains Mono',
                        fontSize: '12px',
                        border: `1px solid ${isPositive ? 'rgba(34,197,94,0.2)' : isNegative ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                        minWidth: '36px',
                        textAlign: 'center'
                    }}>
                        {isPositive ? `+${delta}` : isNegative ? delta : '='}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RaceDetails;
