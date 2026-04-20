import React, { useMemo } from 'react';

const Hero: React.FC = () => {
  const { greeting, dateline } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    
    const D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dl = `${D[now.getDay()]} · ${String(now.getDate()).padStart(2, '0')} ${M[now.getMonth()]} · ${now.getFullYear()}`;
    
    return { greeting: `${g}, Nimitt`, dateline: dl };
  }, []);

  return (
    <section className="hero">
      <span className="speed-line"></span>
      <span className="speed-line"></span>
      <span className="speed-line"></span>

      <div className="hero-top">
        <div className="brand-eyebrow">
          <span className="checker-flag"></span>
          <span className="live-badge">Live Edition</span>
          <span>F1 2026</span>
        </div>
        <div className="brand-right">
          <div className="greeting">{greeting}</div>
          <div className="dateline">{dateline}</div>
        </div>
      </div>

      <div className="title-wrap">
        <h1 className="hero-title">
          <span className="line1">
            <span>Nimitt's</span>
          </span>
          <span className="line2">
            <span>Pit Wall.</span>
          </span>
        </h1>
        <div className="title-underline"></div>
      </div>

      <div className="hero-sub">
        <span className="live-badge">Season 2026</span>
        <span>Drivers · Constructors · Paddock · Calendar</span>
      </div>
    </section>
  );
};

export default Hero;
