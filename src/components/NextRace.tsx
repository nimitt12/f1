import React, { useState, useEffect } from 'react';
import Loader from './Loader';
import Tilt from './Tilt';
import { COUNTRY_FLAGS, RACES as RACES_FALLBACK, fetchRaces, raceSlug, type Race } from '../data/races';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';

const getTeamColor = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('mercedes')) return 'var(--mercedes)';
  if (lower.includes('ferrari')) return 'var(--ferrari)';
  if (lower.includes('mclaren')) return 'var(--mclaren)';
  if (lower.includes('red bull')) return 'var(--redbull)';
  if (lower.includes('williams')) return 'var(--williams)';
  if (lower.includes('haas')) return 'var(--haas)';
  if (lower.includes('alpine')) return 'var(--alpine)';
  if (lower.includes('audi')) return 'var(--audi)';
  if (lower.includes('rb')) return 'var(--racingbulls)';
  if (lower.includes('aston')) return 'var(--aston)';
  if (lower.includes('cadillac')) return 'var(--cadillac)';
  return 'var(--racing)';
};

// A single glowing comet that races the circuit: a bright head trailed by a soft
// fading tail. The tail is built from graduated layers — each a short lit arc that
// lags a little further behind the head (via animation-delay) with lower opacity,
// thinner stroke and softer glow — so together they read as one streak of light
// chasing around the lap. All share one duration so the comet stays rigid in shape.
const COMET_DUR = 5.6; // seconds per lap
const COMET_ARC = 3.5; // arc length (of 100) each layer lights up
// lag = how far (in path units) a layer sits behind the head; converted to a
// positive animation-delay so it trails rather than leads.
const COMET_TAIL = [
  { w: 3.4, op: 1, blur: 13, lag: 0 }, // head
  { w: 2.9, op: 0.6, blur: 10, lag: 1.0 },
  { w: 2.4, op: 0.4, blur: 8, lag: 2.2 },
  { w: 1.9, op: 0.26, blur: 6, lag: 3.6 },
  { w: 1.5, op: 0.16, blur: 4, lag: 5.2 },
  { w: 1.1, op: 0.08, blur: 0, lag: 7.0 },
];
const COMET_BASE_DELAY = -2.4; // pre-advance so the comet is mid-lap on mount

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
        COMET_TAIL.map((seg, i) => (
          <path
            key={i}
            className="track-comet"
            d={path}
            pathLength={100}
            vectorEffect="non-scaling-stroke"
            style={{
              strokeWidth: seg.w,
              strokeDasharray: `${COMET_ARC} ${100 - COMET_ARC}`,
              opacity: seg.op,
              filter: seg.blur
                ? `drop-shadow(0 0 ${seg.blur}px var(--racing-hot-ticker))`
                : 'none',
              animationDuration: `${COMET_DUR}s`,
              animationDelay: `${COMET_BASE_DELAY + (seg.lag / 100) * COMET_DUR}s`,
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
  const [loadingResults, setLoadingResults] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const countryCode = COUNTRY_FLAGS[nextRace.Circuit.Location.country] || '🏁';

  useEffect(() => {
    let active = true;
    const fetchResults = async () => {
      setLoadingResults(true);
      try {
        const res = await fetch(`https://pitwall-backend-dq9r.onrender.com/results/get-all-results/${prevRace.season}/${prevRace.round}`);
        const data = await res.json();
        if (active) setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to fetch results", e);
        if (active) setResults([]);
      } finally {
        if (active) setLoadingResults(false);
      }
    };
    fetchResults();
    return () => {
      active = false;
    };
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

            {onRaceSelect && results.length > 0 && (
              <a
                className="nr-view-results-btn"
                href={`/race/${prevRace.season}/${raceSlug(prevRace)}`}
                onClick={(e) => {
                  e.preventDefault();
                  onRaceSelect(prevRace);
                }}
              >
                <span>View Full Results</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            )}
          </div>

          {results.length > 0 ? (
            <div className="rostrum">
              {results.slice(0, 3).map((r, idx) => {
                const pos = idx + 1;
                const isWinner = pos === 1;
                return (
                  <article
                    key={r.id}
                    className={`rostrum-card pos-${pos}`}
                    style={{ '--team-color': getTeamColor(r.team_name) } as React.CSSProperties}
                  >
                    <span className="rc-aura" aria-hidden="true" />
                    {isWinner && <span className="rc-winner-tag">◆ Race Winner</span>}

                    <div className={`rc-medal metal-${pos}`}>
                      <span className="rc-medal-num">{pos}</span>
                      <span className="rc-medal-ring" aria-hidden="true" />
                    </div>

                    <div className="rc-body">
                      <h3 className="rc-name">
                        <span className="rc-given">{r.given_name}</span>
                        <span className="rc-family">{r.family_name}</span>
                      </h3>
                      <div className="rc-team">
                        <span className="rc-team-dot" aria-hidden="true" />
                        {r.team_name}
                      </div>
                    </div>

                    <div className="rc-stats">
                      <div className="rc-stat">
                        <span className="rc-stat-k">{isWinner ? 'Race Time' : 'Gap'}</span>
                        <span className="rc-stat-v">{r.time || '—'}</span>
                      </div>
                      <div className="rc-stat rc-stat-pts">
                        <span className="rc-stat-k">Points</span>
                        <span className="rc-stat-v">+{r.points}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : loadingResults ? (
            <div className="rostrum rostrum-loading">
              <Loader label="Loading results" size={32} />
            </div>
          ) : (
            <div className="rostrum rostrum-pending">
              <div className="rp-podium" aria-hidden="true">
                <span className="rp-bar rp-bar-2" />
                <span className="rp-bar rp-bar-1" />
                <span className="rp-bar rp-bar-3" />
                <span className="rp-flag" />
              </div>
              <div className="rp-copy">
                <span className="rp-badge">◆ Race Completed</span>
                <h3 className="rp-title">Awaiting Official Results</h3>
                <p className="rp-sub">
                  The {prevRace.raceName.replace(' Grand Prix', '')} Grand Prix has finished —
                  the podium and classification will appear here once results are confirmed.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NextRace;
