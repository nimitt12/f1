import React, { useState, useEffect } from 'react';

const Flag: React.FC<{ code: string }> = ({ code }) => {
  if (!code || code.length !== 2) return null;
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

const NextRace: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });
  const countryCode = 'us'; // Dynamically changeable country code

  useEffect(() => {
    const target = new Date('2026-05-03T20:00:00Z').getTime();
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
  }, []);

  return (
    <section className="race-hero">
      <div className="race-block">
        <div className="race-grid">
          <div className="race-left">
            <div className="race-meta-row">
              <span className="race-round">◆ Round 04 · Up Next</span>
              <span className="race-flag-big"><Flag code={countryCode} /></span>
            </div>
            <h2 className="race-name">
              Miami <em>Grand Prix</em>
            </h2>
            <div className="race-circuit">
              <strong>Miami International Autodrome</strong> · Hard Rock Stadium
            </div>
            <div className="race-circuit">Round 4 of 23 · 57 laps · 308.326 km</div>

            <div className="race-stats">
              <div className="race-stat">
                <div className="race-stat-label">Lap Record</div>
                <div className="race-stat-val">1:29.708</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Pole 2025</div>
                <div className="race-stat-val">M. Verstappen</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Dates</div>
                <div className="race-stat-val">May 1 – 3</div>
              </div>
            </div>
          </div>

          <div className="race-right">
            <div className="countdown-label">Lights Out In</div>
            <div className="countdown">
              <div className="cd-cell">
                <div className="cd-num">{timeLeft.d}</div>
                <div className="cd-label">Days</div>
              </div>
              <div className="cd-cell">
                <div className="cd-num">{timeLeft.h}</div>
                <div className="cd-label">Hours</div>
              </div>
              <div className="cd-cell">
                <div className="cd-num">{timeLeft.m}</div>
                <div className="cd-label">Mins</div>
              </div>
              <div className="cd-cell">
                <div className="cd-num">{timeLeft.s}</div>
                <div className="cd-label">Secs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="race-block previous">
        <div className="race-grid">
          <div className="race-left">
            <div className="race-meta-row">
              <span className="race-round">◆ Round 03 · Completed</span>
              <span className="race-flag-big"><Flag code="jp" /></span>
            </div>
            <h2 className="race-name-previous">
              Japanese <em>Grand Prix</em>
            </h2>
            <div className="race-circuit">
              <strong>Suzuka International Racing Course</strong> · Suzuka
            </div>
            <div className="race-circuit">Round 3 of 23 · 53 laps · 307.471 km</div>

            <div className="race-stats">
              <div className="race-stat">
                <div className="race-stat-label">Fastest Lap</div>
                <div className="race-stat-val">1:31.540 (K. Antonelli)</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Weather</div>
                <div className="race-stat-val">Dry · 22°C</div>
              </div>
              <div className="race-stat">
                <div className="race-stat-label">Attendance</div>
                <div className="race-stat-val">222,000</div>
              </div>
            </div>
          </div>

          <div className="race-right winner-showcase">
            <div className="winner-label">Podium Results</div>
            <div className="podium-cards">
              <div className="winner-card p1-featured">
                <div className="winner-badge">P1</div>
                <div className="winner-info">
                  <div className="winner-name">Andrea Kimi Antonelli</div>
                  <div className="winner-team">Mercedes-AMG</div>
                </div>
                <div className="winner-stats-mini">
                  <span className="ws-val">1:28:14.802</span>
                  <span className="ws-pts">+25</span>
                </div>
              </div>
              
              <div className="podium-sub-grid">
                <div className="podium-mini-card p2">
                  <span className="pm-pos">P2</span>
                  <div className="pm-info">
                    <span className="pm-name">George Russell</span>
                    <span className="pm-team">Mercedes</span>
                  </div>
                  <span className="pm-time">+3.441</span>
                </div>
                <div className="podium-mini-card p3">
                  <span className="pm-pos">P3</span>
                  <div className="pm-info">
                    <span className="pm-name">Charles Leclerc</span>
                    <span className="pm-team">Ferrari</span>
                  </div>
                  <span className="pm-time">+9.127</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NextRace;
