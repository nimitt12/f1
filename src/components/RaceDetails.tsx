import React, { useState, useEffect } from 'react';
import type { Race } from './Calendar';
import QualifyingResults from './QualifyingResults';

interface RaceDetailsProps {
  race: Race | null;
  onBack: () => void;
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
}

const COUNTRY_FLAGS: Record<string, string> = {
  Australia: 'au', China: 'cn', Japan: 'jp', USA: 'us', Canada: 'ca',
  Monaco: 'mc', Spain: 'es', Austria: 'at', UK: 'gb', Belgium: 'be',
  Hungary: 'hu', Netherlands: 'nl', Italy: 'it', Azerbaijan: 'az',
  Singapore: 'sg', Mexico: 'mx', Brazil: 'br', Qatar: 'qa', UAE: 'ae',
};

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return { date: 'TBC', time: 'TBC' };
  
  const d = new Date(`${dateStr}T${timeStr || '00:00:00Z'}`);
  
  // If time is just 00:00:00Z and wasn't provided, it might be TBC
  const dateFormatted = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeFormatted = timeStr ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBC';
  
  return { date: dateFormatted, time: timeFormatted };
};

const RaceDetails: React.FC<RaceDetailsProps> = ({ race, onBack }) => {
  const [results, setResults] = useState<RaceResult[] | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'race' | 'qualifying' | 'analytics'>('race');

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

  const scrollToResults = (tab?: 'race' | 'qualifying' | 'analytics') => {
    if (tab) setActiveTab(tab);
    const element = document.querySelector('.rd-results-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="race-details-page">
      <nav className="rd-top-nav">
        <button className="rd-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back
        </button>
      </nav>

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
                className={`rd-tab ${activeTab === 'race' ? 'active' : ''}`}
                onClick={() => setActiveTab('race')}
              >
                Race
              </button>
              <button 
                className={`rd-tab ${activeTab === 'qualifying' ? 'active' : ''}`}
                onClick={() => setActiveTab('qualifying')}
              >
                Qualifying
              </button>
              <button 
                className={`rd-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics
              </button>
            </div>

            {activeTab === 'race' ? (
              <>
                <div className="rd-section-header">
                  <h2 className="rd-section-title">Official <em>Classification</em></h2>
                  <div className="rd-section-line"></div>
                </div>
                
                {loadingResults ? (
                  <div className="rd-loading">Loading official results...</div>
                ) : results && results.length > 0 ? (
                  <div className="rd-results-container">
                    <div className="rd-podium">
                      {results[1] && (
                        <div className={`rd-podium-spot rd-p2 theme-${results[1].team_name.toLowerCase().replace(/\s+/g, '')}`}>
                          <div className="rd-spot-glow"></div>
                          <span className="rd-podium-pos">P2</span>
                          <div className="rd-podium-info">
                            <span className="rd-podium-name">{results[1].given_name} <strong>{results[1].family_name}</strong></span>
                            <span className="rd-podium-team">{results[1].team_name}</span>
                          </div>
                          <div className="rd-podium-pts">+{results[1].points} <span>PTS</span></div>
                        </div>
                      )}
                      {results[0] && (
                        <div className={`rd-podium-spot rd-p1 theme-${results[0].team_name.toLowerCase().replace(/\s+/g, '')}`}>
                          <div className="rd-spot-glow"></div>
                          <div className="rd-winner-crown">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                          </div>
                          <span className="rd-podium-pos">P1</span>
                          <div className="rd-podium-info">
                            <span className="rd-podium-name">{results[0].given_name} <strong>{results[0].family_name}</strong></span>
                            <span className="rd-podium-team">{results[0].team_name}</span>
                          </div>
                          <div className="rd-podium-pts">+{results[0].points} <span>PTS</span></div>
                        </div>
                      )}
                      {results[2] && (
                        <div className={`rd-podium-spot rd-p3 theme-${results[2].team_name.toLowerCase().replace(/\s+/g, '')}`}>
                          <div className="rd-spot-glow"></div>
                          <span className="rd-podium-pos">P3</span>
                          <div className="rd-podium-info">
                            <span className="rd-podium-name">{results[2].given_name} <strong>{results[2].family_name}</strong></span>
                            <span className="rd-podium-team">{results[2].team_name}</span>
                          </div>
                          <div className="rd-podium-pts">+{results[2].points} <span>PTS</span></div>
                        </div>
                      )}
                    </div>

                    <div className="qr-table-container" style={{ marginTop: '40px' }}>
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
                          {results.slice(3).map((r) => (
                            <tr key={r.id} className={`qr-row theme-${r.team_name.toLowerCase().replace(/\s+/g, '')}`}>
                              <td className="qr-td-pos">
                                <span className="qr-pos-num">{r.position}</span>
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </>
            ) : activeTab === 'qualifying' ? (
              <QualifyingResults season={race.season} round={race.round} />
            ) : (
              <RaceAnalytics results={results || []} />
            )}
          </div>
        )}
      </div>

      <style>{`
        :root {
          --racing-rgb: 168, 85, 247;
        }
      `}</style>
    </div>
  );
};

/* --- Laptimes Scatterplot Sub-component --- */
const RaceLaptimeScatter: React.FC<{ results: RaceResult[] }> = ({ results }) => {
  const topDrivers = results.slice(0, 5);
  const laps = Array.from({ length: 50 }, (_, i) => i + 1);
  
  // Simulated pace variance helper
  const getSimulatedLapTime = (base: number, lap: number, seedStr: string) => {
    const seed = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const drift = Math.sin(lap / 10) * 0.15; // Fatigue/Fuel effect
    const noise = (((seed * lap) % 100) / 100 - 0.5) * 0.3; // Stable Traffic/Lockups
    return base + drift + noise;
  };

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

  return (
    <div className="ra-chart-box ra-full-width-chart">
      <div className="ra-chart-header">
        <h3 className="ra-chart-title">Race Pace // Laptimes Distribution</h3>
        <div className="ra-chart-legend">
          {topDrivers.map(d => (
            <div key={d.id} className="ra-legend-item">
              <div className="ra-legend-color" style={{ background: `var(--${getTeamKey(d.team_name)}, var(--racing))` }}></div>
              <span>{d.code}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="ra-scatterplot-container">
        <div className="ra-grid-pattern"></div>
        <div className="ra-telemetry-overlay">LAP_BY_LAP_PACE_STABILITY // INTEL_CORRELATION_V1</div>
        
        <svg width="100%" height="100%" viewBox="0 0 1000 350" preserveAspectRatio="none">
          {/* Y-Axis Grid Lines */}
          {[1.25, 1.27, 1.29, 1.31].map((val, i) => {
            const y = (i / 3) * 280 + 35;
            return (
              <g key={val}>
                <line x1="60" y1={y} x2="960" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x="15" y={y + 4} className="ra-axis-label" style={{ fontSize: '10px' }}>{val.toFixed(2)}s</text>
              </g>
            );
          })}

          {/* X-Axis Grid Lines */}
          {[1, 10, 20, 30, 40, 50].map((lap) => {
            const x = ((lap - 1) / 49) * 900 + 60;
            return (
              <g key={lap}>
                <line x1={x} y1="35" x2={x} y2="315" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={x - 10} y="340" className="ra-axis-label" style={{ fontSize: '10px' }}>L{lap}</text>
              </g>
            );
          })}

          {/* Scatter Data */}
          {topDrivers.map((driver, di) => {
            const teamColor = `var(--${getTeamKey(driver.team_name)}, var(--racing))`;
            const baseTime = 1.26 + di * 0.005;
            
            return (
              <g key={driver.id}>
                {laps.map((lap) => {
                  const time = getSimulatedLapTime(baseTime, lap, driver.code);
                  const x = ((lap - 1) / 49) * 900 + 60;
                  const y = ((time - 1.25) / 0.06) * 280 + 35;
                  
                  return (
                    <circle 
                      key={lap}
                      cx={x} 
                      cy={y} 
                      r="2.5" 
                      fill={teamColor} 
                      className="ra-scatter-dot"
                      style={{ opacity: 0.7 }}
                    >
                      <title>{driver.code} | Lap {lap}: {time.toFixed(3)}s</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="ra-card-sub" style={{ marginTop: '8px' }}>
        Scatter distribution of laptimes showing pace stability and tire degradation patterns over 50 laps.
      </div>
    </div>
  );
};

/* --- Analytics Sub-component --- */
const RaceAnalytics: React.FC<{ results: RaceResult[] }> = ({ results }) => {
  const [hoveredDriver, setHoveredDriver] = useState<string | null>(null);

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

  // 4. Constructor Distribution
  const teamPoints: Record<string, number> = {};
  results.forEach(r => {
    const pts = Number(r.points);
    if (pts > 0) {
      teamPoints[r.team_name] = (teamPoints[r.team_name] || 0) + pts;
    }
  });
  
  const sortedTeams = Object.entries(teamPoints)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxTeamPts = Math.max(...Object.values(teamPoints));

  return (
    <div className="ra-container">
      <div className="rd-section-header">
        <h2 className="rd-section-title">Deep <em>Analytics</em></h2>
        <div className="rd-section-line"></div>
      </div>

      <div className="ra-grid">
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
          <span className="ra-card-label">Points Scored</span>
          <span className="ra-card-value">{results.reduce((acc, r) => acc + Number(r.points), 0)}</span>
          <span className="ra-card-sub">Total Grid Points</span>
        </div>
      </div>

      <div className="ra-visuals-grid">
        <RaceLaptimeScatter results={results} />

        <div className="ra-chart-box ra-full-width-chart">
          <div className="ra-chart-header">
            <h3 className="ra-chart-title">Lap-by-Lap Field Evolution</h3>
            <div className="ra-chart-legend" style={{ flexWrap: 'wrap', gap: '10px' }}>
              {results.slice(0, 10).map(r => (
                <div key={r.id} className="ra-legend-item">
                  <div className="ra-legend-color" style={{ background: `var(--${getTeamKey(r.team_name)}, var(--racing))` }}></div>
                  <span>{r.code}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="ra-svg-container" style={{ height: '500px', background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%)', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)' }}>
            <div className="ra-grid-pattern" style={{ backgroundSize: '50px 25px', opacity: 0.15 }}></div>
            <div className="ra-telemetry-overlay">FULL_GRID_EVOLUTION // PREMIUM_TELEMETRY // V_CORRELATION</div>
            
            <svg width="100%" height="100%" viewBox="0 0 1280 500" preserveAspectRatio="none">
              {/* Y-Axis Labels (Positions) */}
              {[1, 5, 10, 15, 20].map((p) => (
                <g key={p}>
                  <line x1="60" y1={(p - 1) * 22 + 40} x2="1140" y2={(p - 1) * 22 + 40} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="25" y={(p - 1) * 22 + 45} className="ra-axis-label" style={{ fill: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>P{p}</text>
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
                const seed = r.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const getStableOffset = (step: number, range: number) => {
                  return ((seed * step) % range) - (range / 2);
                };
                
                const startPos = Number(r.grid) || 20;
                const finishPos = Number(r.position);
                const mid1 = Math.max(1, Math.min(20, startPos + Math.round(getStableOffset(1, 4))));
                const mid2 = Math.max(1, Math.min(20, mid1 + Math.round(getStableOffset(2, 6))));
                const midPit = Math.min(20, finishPos + 5); // Drop during pit
                const mid3 = Math.max(1, Math.min(20, finishPos + Math.round(Math.abs(getStableOffset(3, 4)))));
                const mid4 = Math.max(1, Math.min(20, finishPos - 1));

                const points = [
                  { x: 0, y: startPos },
                  { x: 5, y: mid1 },
                  { x: 15, y: mid2 },
                  { x: 25, y: midPit },
                  { x: 35, y: mid3 },
                  { x: 45, y: mid4 },
                  { x: 56, y: finishPos }
                ];

                const mappedPoints = points.map(p => ({
                  px: (p.x / 56) * 1080 + 60,
                  py: (p.y - 1) * 22 + 40
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

                    {/* Telemetry Nodes (Only visible on hover) */}
                    {isHovered && mappedPoints.map((p, i) => (
                      <circle 
                        key={i} 
                        cx={p.px} cy={p.py} r="4" 
                        fill="#fff" stroke={teamColor} strokeWidth="2"
                        style={{ filter: `drop-shadow(0 0 8px ${teamColor})` }}
                      />
                    ))}

                    {/* Final Position Label Background for readability */}
                    <rect x={1080 + 66} y={(finishPos - 1) * 22 + 30} width="60" height="20" fill="rgba(0,0,0,0.6)" rx="4" style={{ opacity: isHovered ? 0 : (hasFocus ? 0.05 : 1) }} />
                    <text x={1080 + 72} y={(finishPos - 1) * 22 + 44} fill={teamColor} fontSize="11" fontWeight="700" style={{ opacity: isHovered ? 0 : (hasFocus ? 0.05 : 1), transition: 'opacity 0.3s ease' }}>{r.code}</text>

                    {/* Premium Glassmorphic Tooltip */}
                    {isHovered && (() => {
                      const tooltipYBase = (finishPos - 1) * 22;
                      const isBottomEdge = finishPos > 16;
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

        <div className="ra-chart-box">
          <h3 className="ra-chart-title">Reliability Index</h3>
          <div className="ra-reliability-gauge">
            <div className="ra-gauge-circle" style={{ '--percent': `${reliabilityPercent}%` } as React.CSSProperties}>
              <div className="ra-gauge-inner">
                <span className="ra-gauge-val">{reliabilityPercent}%</span>
                <span className="ra-gauge-label">Finished</span>
              </div>
            </div>
            <div className="qr-subtitle" style={{ textAlign: 'center' }}>
              {finishers} / {results.length} Drivers classified in this session.
            </div>
          </div>
        </div>

        <div className="ra-chart-box ra-full-width-chart">
          <h3 className="ra-chart-title">Constructor Performance Heatmap</h3>
          <div className="ra-bar-list">
            {sortedTeams.map(([team, pts]) => (
              <div key={team} className="ra-bar-item">
                <div className="ra-bar-info">
                  <span>{team}</span>
                  <span>{pts} PTS</span>
                </div>
                <div className="ra-bar-wrap">
                  <div 
                    className="ra-bar-fill" 
                    style={{ 
                      width: `${(pts / maxTeamPts) * 100}%`,
                      background: `var(--${getTeamKey(team)}, var(--racing))`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ra-chart-box ra-full-width-chart">
          <h3 className="ra-chart-title">Strategic Stint Pattern</h3>
          <div className="ra-bar-list" style={{ gap: '12px' }}>
            {results.slice(0, 15).map((r, i) => (
              <div key={r.id} className="ra-bar-item">
                <div className="ra-bar-info" style={{ fontSize: '9px', marginBottom: '4px' }}>
                  <span>{r.family_name}</span>
                  <span style={{ opacity: 0.6 }}>STINT_01 // STINT_02</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="ra-bar-wrap" style={{ flex: i % 2 === 0 ? 0.6 : 0.4, height: '14px' }}>
                    <div className="ra-bar-fill" style={{ width: '100%', background: i % 3 === 0 ? '#ffea00' : '#f44336', opacity: 0.8 }}></div>
                  </div>
                  <div className="ra-bar-wrap" style={{ flex: i % 2 === 0 ? 0.4 : 0.6, height: '14px' }}>
                    <div className="ra-bar-fill" style={{ width: '100%', background: `var(--${getTeamKey(r.team_name)}, var(--racing))` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="ra-telemetry-overlay" style={{ top: 'auto', bottom: '10px', right: '10px', left: 'auto' }}>STRATEGY_ANALYSIS_MOCK // SESSION_2026</div>
        </div>
      </div>
    </div>
  );
};

export default RaceDetails;
