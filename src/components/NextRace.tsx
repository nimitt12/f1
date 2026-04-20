import React, { useState, useEffect } from 'react';

const NextRace: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' });

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
              <span className="race-flag-big">🇺🇸</span>
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
    </section>
  );
};

export default NextRace;
