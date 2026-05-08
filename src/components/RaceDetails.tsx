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
                Race Results
              </button>
              <button 
                className={`rd-tab ${activeTab === 'qualifying' ? 'active' : ''}`}
                onClick={() => setActiveTab('qualifying')}
              >
                Qualifying Results
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
            ) : (
              <QualifyingResults season={race.season} round={race.round} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceDetails;
