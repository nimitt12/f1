import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import Tilt from './Tilt';
import { COUNTRY_FLAGS, RACES as RACES_FALLBACK, fetchRaces, type Race } from '../data/races';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';

// Dots that lap the circuit, each at its own pace and start offset so they keep
// drifting apart and bunching up — a continuous, random-looking loop. Two theme
// tones (core + bright accent) keep it cohesive and premium across themes.
const TRACK_DOTS = [
  { color: 'var(--racing-hot-ticker)', dur: 6.2, delay: 0 },
  { color: 'var(--racing)', dur: 7.8, delay: -1.1 },
  { color: 'var(--racing-hot-ticker)', dur: 5.6, delay: -2.4 },
  { color: 'var(--racing)', dur: 8.4, delay: -3.0 },
  { color: 'var(--racing-hot-ticker)', dur: 6.9, delay: -4.3 },
  { color: 'var(--racing)', dur: 7.2, delay: -5.1 },
];

const TrackSilhouette: React.FC<{ circuitId?: string; live?: boolean }> = ({ circuitId, live }) => {
  const path = TRACK_PATHS[circuitId || ''];
  if (!path) return null;
  return (
    <svg
      className={`race-track-bg ${live ? 'is-live' : ''}`}
      viewBox={TRACK_VIEWBOX}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Faint circuit outline */}
      <path className="track-base" d={path} pathLength={100} vectorEffect="non-scaling-stroke" />
      {live &&
        TRACK_DOTS.map((dot, i) => (
          <path
            key={i}
            className="track-dot"
            d={path}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
            style={{
              ['--dot-color' as string]: dot.color,
              animationDuration: `${dot.dur}s`,
              animationDelay: `${dot.delay}s`,
            }}
          />
        ))}
    </svg>
  );
};

const Flag: React.FC<{ code: string }> = ({ code }) => {
  if (!code || code.length !== 2 || code === '🏁') return <span style={{ fontSize: '24px' }}>🏁</span>;
  const lowerCode = code.toLowerCase();
  return (
    <img 
      src={`https://flagcdn.com/w40/${lowerCode}.png`} 
      srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
      width="32" 
      alt={code}
      style={{ verticalAlign: 'baseline', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
    />
  );
};

interface RaceResult {
  id: string;
  position: string;
  points: string;
  time: string;
  given_name: string;
  family_name: string;
  team_name: string;
  fastest_lap_time: string;
  fastest_lap_rank: string;
}

interface NextRaceProps {
  onRaceSelect?: (race: Race) => void;
}

const NextRace: React.FC<NextRaceProps> = ({ onRaceSelect }) => {
  // Seed with the bundled calendar so the first paint has data, then refresh
  // from the admin-managed backend calendar.
  const [races, setRaces] = useState<Race[]>(RACES_FALLBACK);

  useEffect(() => {
    let active = true;
    fetchRaces().then((data) => {
      if (active) setRaces(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const today = new Date();
  const nextRace = races.find(r => new Date(r.date) >= today) || races[races.length - 1];
  const prevRace = races.filter(r => new Date(r.date) < today).pop() || races[0];

  const totalGPs = races.length;
  const completedGPs = races.filter(r => new Date(r.date) < today).length;
  const percentage = Math.round((completedGPs / totalGPs) * 100);

  const [results, setResults] = useState<RaceResult[]>([]);
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const countryCode = COUNTRY_FLAGS[nextRace.Circuit.Location.country] || '🏁';

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`https://pitwall-backend-dq9r.onrender.com/results/get-all-results/${prevRace.season}/${prevRace.round}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error("Failed to fetch results", e);
      }
    };
    fetchResults();
  }, [prevRace]);

  useEffect(() => {
    const target = new Date(`${nextRace.date}T${nextRace.time || '15:00:00Z'}`).getTime();
    const pad = (n: number) => String(n).padStart(2, '0');

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        return;
      }
      setTimeLeft({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff % 86400000) / 3600000)),
        m: pad(Math.floor((diff % 3600000) / 60000)),
        s: pad(Math.floor((diff % 60000) / 1000)),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextRace]);

  const formatDateRange = (race: Race) => {
    const d = new Date(race.date);
    const start = race.FirstPractice ? new Date(race.FirstPractice.date) : d;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${d.getDate()}`;
  };

  const getLocalTime = (race: Race) => {
    const date = new Date(`${race.date}T${race.time || '15:00:00Z'}`);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    const tzShort = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find(p => p.type === 'timeZoneName')?.value || '';
      
    return `${timeStr} (${tzShort})`;
  };

  return (
    <section className="race-hero">
      <div className="race-block upcoming">
        <TrackSilhouette circuitId={nextRace.Circuit.circuitId} live />
        <div className="race-grid">
          <div className="race-left">
            <div className="race-meta-row">
              <span className="race-round">◆ Round {nextRace.round.padStart(2, '0')} · Up Next</span>
              <span className="race-flag-big"><Flag code={countryCode} /></span>
            </div>
            <h2 className="race-name">
              {nextRace.raceName.replace(' Grand Prix', '')} <span>Grand Prix</span>
            </h2>
            <div className="race-circuit">
              <strong>{nextRace.Circuit.circuitName}</strong> · {nextRace.Circuit.Location.locality}
            </div>
            <div className="race-circuit">Round {nextRace.round} of {totalGPs} · 2026 Season</div>

            <div className="race-stats">
              <div className="race-stat">
                <div className="race-stat-label">Country</div>
                <div className="race-stat-val">{nextRace.Circuit.Location.country}</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Local</div>
                <div className="race-stat-val">{nextRace.time ? nextRace.time.replace(':00Z', '') : 'TBC'}</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">My Time</div>
                <div className="race-stat-val">{getLocalTime(nextRace)}</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Dates</div>
                <div className="race-stat-val">{formatDateRange(nextRace)}</div>
              </div>
            </div>
          </div>

          <div className="race-right">
            <div className="countdown-label">Lights Out In</div>
            <div className="countdown">
              <Tilt className="cd-cell">
                <div className="cd-num">{timeLeft.d}</div>
                <div className="cd-label">Days</div>
              </Tilt>
              <Tilt className="cd-cell">
                <div className="cd-num">{timeLeft.h}</div>
                <div className="cd-label">Hours</div>
              </Tilt>
              <Tilt className="cd-cell">
                <div className="cd-num">{timeLeft.m}</div>
                <div className="cd-label">Mins</div>
              </Tilt>
              <Tilt className="cd-cell">
                <div className="cd-num">{timeLeft.s}</div>
                <div className="cd-label">Secs</div>
              </Tilt>
            </div>
          </div>
        </div>
      </div>
      <div className="season-progress-container">
        <div className="sp-card">
          <div className="sp-percent">
            {percentage}<span>%</span>
          </div>
          <div className="sp-bar">
            {Array.from({ length: totalGPs }).map((_, i) => (
              <div
                key={i}
                className={`sp-tick ${i < completedGPs ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.05}s` }}
              ></div>
            ))}
          </div>
          <div className="sp-meta">
            <div className="sp-count">
              <strong>{completedGPs}</strong> / {totalGPs}
            </div>
            <div className="sp-label">Grand Prix Completed</div>
          </div>
        </div>
      </div>
      <div className="race-block previous">
        <TrackSilhouette circuitId={prevRace.Circuit.circuitId} />
        <div className="prev-inner">
          <div className="prev-header">
            <div className="prev-id">
              <div className="race-meta-row">
                <span className="race-round">◆ Round {prevRace.round.padStart(2, '0')} · Completed</span>
                <span className="race-flag-big"><Flag code={COUNTRY_FLAGS[prevRace.Circuit.Location.country] || '🏁'} /></span>
              </div>
              <h2 className="race-name-previous">
                {prevRace.raceName.replace(' Grand Prix', '')} <span>Grand Prix</span>
              </h2>
              <div className="prev-circuit">
                <strong>{prevRace.Circuit.circuitName}</strong> · {prevRace.Circuit.Location.locality} · Round {prevRace.round} of {totalGPs}
              </div>
            </div>

            {onRaceSelect && (
              <button
                className="nr-view-results-btn"
                onClick={() => onRaceSelect(prevRace)}
              >
                <span>View Full Results</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="podium-row">
              {/* P1 Winner */}
              {results.slice(0, 1).map(winner => (
                <div key={winner.id} className="winner-card p1-featured">
                  <div className="winner-badge">P1</div>
                  <div className="winner-info">
                    <div className="winner-name">{winner.given_name} {winner.family_name}</div>
                    <div className="winner-team">{winner.team_name}</div>
                  </div>
                  <div className="winner-stats-mini">
                    <span className="ws-val">{winner.time}</span>
                    <span className="ws-pts">+{winner.points}</span>
                  </div>
                </div>
              ))}

              {/* P2 & P3 */}
              {results.slice(1, 3).map((podium, idx) => (
                <div key={podium.id} className={`podium-mini-card p${idx + 2}`}>
                  <span className="pm-pos">P{idx + 2}</span>
                  <div className="pm-info">
                    <span className="pm-name">{podium.family_name}</span>
                    <span className="pm-team">{podium.team_name}</span>
                  </div>
                  <div className="pm-foot">
                    <span className="pm-time">{podium.time}</span>
                    <span className="pm-gap">+{podium.points} PTS</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="podium-row">
              <div className="winner-card p1-featured">
                <Loader label="Loading results" size={32} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NextRace;
