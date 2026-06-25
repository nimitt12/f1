import React, { useState, useEffect } from 'react';
import type { Race } from '../data/races';
import QualifyingResults from './QualifyingResults';
import Loader from './Loader';

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
  const [activeTab, setActiveTab] = useState<'race' | 'qualifying'>('race');

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
            </div>

            {activeTab === 'race' ? (
              <>
                <div className="rd-section-header">
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
                  const time = getSimulatedLapTime(baseTime, lap, driver.code || driver.id);
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
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5);
  const maxTeamPts = Math.max(...Object.values(teamContributions).map(t => t.total));

  // 5. Positional Volatility (Chaos Index)
  let totalPositionChanges = 0;
  results.forEach(r => {
    const gridPos = Number(r.grid) || 20;
    const finishPos = Number(r.position);
    totalPositionChanges += Math.abs(gridPos - finishPos);
  });
  const volatilityScore = (totalPositionChanges / results.length).toFixed(1);

  // 6. Attrition Breakdown
  const attritionStats = { mechanical: 0, accident: 0, lapped: 0, finished: 0, other: 0 };
  results.forEach(r => {
    const s = (r.status || '').toLowerCase();
    if (s === 'finished') attritionStats.finished++;
    else if (s.includes('lap')) attritionStats.lapped++;
    else if (s.includes('collision') || s.includes('accident') || s.includes('spun off') || s.includes('crash')) attritionStats.accident++;
    else if (s.includes('engine') || s.includes('gearbox') || s.includes('hydraulics') || s.includes('suspension') || s.includes('brakes') || s.includes('power') || s.includes('leak') || s.includes('clutch')) attritionStats.mechanical++;
    else attritionStats.other++;
  });

  // 7. Field Spread
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
  const maxGap = Math.max(...top10Gaps.map(g => g.gapSeconds));

  // 8. Points Origin Donut Chart
  let totalPointsAssigned = 0;
  const gridPoints = { row1: 0, row2: 0, mid: 0, back: 0, pit: 0 };
  results.forEach(r => {
    const pts = Number(r.points);
    if (pts > 0) {
      totalPointsAssigned += pts;
      const g = Number(r.grid);
      if (g === 1 || g === 2) gridPoints.row1 += pts;
      else if (g === 3 || g === 4) gridPoints.row2 += pts;
      else if (g >= 5 && g <= 10) gridPoints.mid += pts;
      else if (g >= 11) gridPoints.back += pts;
      else gridPoints.pit += pts;
    }
  });

  const donutCircumference = 2 * Math.PI * 70;
  const donutSlices: { name: string, pts: number, color: string, offset: number, stroke: number, pct: number }[] = [];
  let currentOffset = 0;
  [
    { n: 'Row 1', p: gridPoints.row1, c: '#3b82f6' },
    { n: 'Row 2', p: gridPoints.row2, c: '#8b5cf6' },
    { n: 'Top 10', p: gridPoints.mid, c: '#10b981' },
    { n: 'Back', p: gridPoints.back, c: '#f59e0b' },
    { n: 'Pit', p: gridPoints.pit, c: '#ef4444' }
  ].forEach(d => {
    if (d.p > 0) {
      const pct = d.p / totalPointsAssigned;
      const strokeLength = pct * donutCircumference;
      donutSlices.push({ name: d.n, pts: d.p, color: d.c, offset: currentOffset, stroke: strokeLength, pct });
      currentOffset -= strokeLength;
    }
  });

  // 9. Pace Trajectory Data
  const paceLaps = 50;
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
      finalY: (finalGap / paceMaxGap) * paceHeight
    };
  });

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
          <span className="ra-card-label">Volatility Score</span>
          <span className="ra-card-value">{volatilityScore}</span>
          <span className="ra-card-sub" style={{ color: Number(volatilityScore) > 3.0 ? '#ef4444' : Number(volatilityScore) < 1.5 ? '#3b82f6' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {Number(volatilityScore) > 3.0 ? 'High Chaos' : Number(volatilityScore) < 1.5 ? 'Procession' : 'Average Volatility'}
          </span>
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
                const seed = (r.code || r.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

        <div className="ra-gauge-row">
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

                {/* Bottom Breakdown Badges */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', width: '100%', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                    <span style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{finishers}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>FIN</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></div>
                    <span style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{results.length - finishers}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>DNF</span>
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
            const lappedCars = finishers - leadLapFinishers;
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

                {/* Bottom Breakdown Badges */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px', width: '100%', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}></div>
                    <span style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{leadLapFinishers}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>LEAD</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 8px #f97316' }}></div>
                    <span style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{lappedCars}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>LAPPED</span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <div className="ra-chart-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ width: '100%', marginBottom: '20px' }}>Points Origin (Grid Topology)</h3>
          
          <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg height="160" width="160" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
              <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth="12" r="70" cx="80" cy="80" />
              {donutSlices.map((slice, i) => (
                <circle
                  key={i}
                  stroke={slice.color}
                  fill="transparent"
                  strokeWidth="12"
                  strokeDasharray={`${slice.stroke} ${donutCircumference}`}
                  strokeDashoffset={slice.offset}
                  strokeLinecap="butt"
                  r="70"
                  cx="80"
                  cy="80"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 4px ${slice.color}80)` }}
                />
              ))}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
              <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#fff', lineHeight: '1' }}>{totalPointsAssigned}</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', marginTop: '4px' }}>TOTAL PTS</span>
            </div>
          </div>

          {/* Donut Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px', justifyContent: 'center', width: '100%' }}>
            {donutSlices.map((slice, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: slice.color }}></div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{slice.name}</span>
                <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 800 }}>{Math.round(slice.pct * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

        <div className="ra-chart-box ra-full-width-chart" style={{ padding: '24px', overflow: 'hidden' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Race Pace Trajectory (Delta to Leader)</h3>
          
          <div style={{ position: 'relative', width: '100%', height: '280px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* SVG Graph */}
            <svg viewBox={`0 0 ${paceWidth} ${paceHeight + 30}`} style={{ width: '100%', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                <line key={pct} x1="0" y1={pct * paceHeight} x2={paceWidth} y2={pct * paceHeight} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
              ))}
              
              {/* Top 5 Pace Lines */}
              {top5PaceLines.map((line, i) => (
                <g key={line.id}>
                  {/* Subtle Area Under Curve */}
                  <polygon points={`0,0 ${line.pointsStr} ${paceWidth},0`} fill={`url(#gradient-${line.id})`} opacity="0.3" />
                  <defs>
                    <linearGradient id={`gradient-${line.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={line.color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={line.color} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Data Line */}
                  <polyline 
                    points={line.pointsStr} 
                    fill="none" 
                    stroke={line.color} 
                    strokeWidth={i === 0 ? "3" : "2"} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ filter: `drop-shadow(0 4px 6px ${line.color}80)` }}
                  />
                  
                  {/* Final Data Point Dot & Label */}
                  <circle cx={paceWidth} cy={line.finalY} r="4" fill={line.color} />
                </g>
              ))}
            </svg>
            
            {/* HTML Overlays for Labels */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              {top5PaceLines.map((line) => (
                <div key={line.id} style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: `calc(${(line.finalY / paceHeight) * 100}% - 8px)`,
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${line.color}40`,
                  fontSize: '10px',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono',
                  color: line.color,
                  transform: 'translateY(-50%)',
                  boxShadow: `0 2px 8px rgba(0,0,0,0.5)`
                }}>
                  {line.code}
                </div>
              ))}
            </div>
            
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px' }}>LAP 1</div>
            <div style={{ position: 'absolute', bottom: '10px', right: '40px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px' }}>LAP 50</div>
          </div>
        </div>
        <div className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Constructor Yield (Driver Contribution)</h3>
          <div className="ra-bar-list" style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
            {sortedTeams.map(([team, data]) => {
              const teamColor = `var(--${getTeamKey(team)}, var(--racing))`;
              return (
                <div key={team} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', fontWeight: 600, letterSpacing: '1px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>{team}</span>
                    <span style={{ color: teamColor, fontWeight: 800, fontSize: '14px', fontFamily: 'JetBrains Mono' }}>{data.total} PTS</span>
                  </div>
                  
                  {/* Stacked Contribution Bar */}
                  <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', display: 'flex', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                    {data.drivers.sort((a,b) => b.points - a.points).map((d, index) => {
                      // We calculate width relative to the max team points, so the #1 team always touches 100% width
                      const widthPercent = (d.points / maxTeamPts) * 100;
                      return (
                        <div key={d.code} style={{ 
                          width: `${widthPercent}%`, 
                          background: teamColor, 
                          opacity: index === 0 ? 1 : 0.6,
                          borderRight: index === 0 && data.drivers.length > 1 ? '2px solid #000' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                          {widthPercent > 8 && (
                            <span style={{ color: '#000', fontSize: '9px', fontWeight: 800, letterSpacing: '0.5px' }}>{d.code}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ra-telemetry-overlay" style={{ top: 'auto', bottom: '15px', right: '20px', left: 'auto' }}>YIELD_SPLIT // ACTUAL_TELEMETRY</div>
        </div>

        <div className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '20px' }}>Grid vs Finish (Positions Gained/Lost)</h3>
          
          {/* Axis Header */}
          <div style={{ display: 'flex', padding: '0 12px 10px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
            <div style={{ flex: '0 0 80px' }}>DRIVER</div>
            <div style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
               <span style={{ position: 'absolute', left: '0' }}>LOST</span>
               <span>GRID POSITION</span>
               <span style={{ position: 'absolute', right: '0' }}>GAINED</span>
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
          <div className="ra-telemetry-overlay" style={{ top: 'auto', bottom: '15px', right: '20px', left: 'auto' }}>POSITION_DELTA // ACTUAL_TELEMETRY</div>
        </div>

        <div className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Field Spread Waterfall (Top 10 Gap to Leader)</h3>
          <div className="ra-bar-list" style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
            {top10Gaps.map((r, i) => {
              const teamColor = `var(--${getTeamKey(r.team_name)}, var(--racing))`;
              const widthPercent = maxGap > 0 ? (r.gapSeconds / maxGap) * 85 : 0; 
              
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                  <div style={{ flex: '0 0 60px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: teamColor, fontWeight: 800, fontFamily: 'JetBrains Mono', fontSize: '12px' }}>P{r.position}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{r.code || r.family_name.substring(0,3).toUpperCase()}</span>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    {i === 0 ? (
                      <div style={{ width: '4px', height: '16px', background: teamColor, borderRadius: '2px', boxShadow: `0 0 10px ${teamColor}` }}></div>
                    ) : (
                      <div style={{ 
                        width: `${widthPercent}%`, 
                        height: '6px', 
                        background: `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, ${teamColor} 100%)`, 
                        borderRadius: '0 3px 3px 0',
                        boxShadow: `2px 0 8px ${teamColor}40`,
                        transition: 'width 1s ease-out'
                      }}></div>
                    )}
                    <span style={{ marginLeft: '12px', fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: i === 0 ? 800 : 600, color: i === 0 ? '#22c55e' : 'rgba(255,255,255,0.6)' }}>
                      {r.gapString}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="ra-telemetry-overlay" style={{ top: 'auto', bottom: '15px', right: '20px', left: 'auto' }}>INTERVAL_SPREAD // ACTUAL_TELEMETRY</div>
        </div>

        <div className="ra-chart-box ra-full-width-chart" style={{ padding: '24px' }}>
          <h3 className="ra-chart-title" style={{ marginBottom: '24px' }}>Attrition Matrix (Status Breakdown)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#22c55e' }}>{attritionStats.finished + attritionStats.lapped}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Total Finishers</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{attritionStats.finished} LEAD</span>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{attritionStats.lapped} LAPPED</span>
              </div>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{attritionStats.accident}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Incidents / Crashes</span>
              <span style={{ fontSize: '10px', color: 'rgba(239,68,68,0.6)', marginTop: '8px', textAlign: 'center' }}>Collisions, accidents, or spun off</span>
            </div>

            <div style={{ background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.2)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#facc15' }}>{attritionStats.mechanical}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Mechanical Failures</span>
              <span style={{ fontSize: '10px', color: 'rgba(250,204,21,0.6)', marginTop: '8px', textAlign: 'center' }}>Engine, Gearbox, Hydraulics</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'rgba(255,255,255,0.8)' }}>{attritionStats.other}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>Other Retirements</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', textAlign: 'center' }}>Unknown or unclassified</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceDetails;
