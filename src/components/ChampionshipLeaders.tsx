import React, { useEffect, useRef, useState } from 'react';

// ─── Shared lookups (kept local, mirrors the standings components) ──────────
const DRIVER_NAME_TO_SLUG: Record<string, string> = {
  'Mercedes': 'mercedes',
  'Ferrari': 'ferrari',
  'McLaren': 'mclaren',
  'Haas F1 Team': 'haas',
  'Red Bull': 'red_bull',
  'Alpine F1 Team': 'alpine',
  'RB F1 Team': 'rb',
  'Audi': 'audi',
  'Williams': 'williams',
  'Aston Martin': 'aston_martin',
  'Cadillac F1 Team': 'cadillac',
};

const teamColors: Record<string, string> = {
  mercedes: 'var(--mercedes)',
  ferrari: 'var(--ferrari)',
  mclaren: 'var(--mclaren)',
  haas: 'var(--haas)',
  red_bull: 'var(--redbull)',
  alpine: 'var(--alpine)',
  rb: 'var(--racingbulls)',
  audi: 'var(--audi)',
  williams: 'var(--williams)',
  aston_martin: 'var(--aston)',
  cadillac: 'var(--cadillac)',
};

const NATIONALITY_ISO: Record<string, string> = {
  Italian: 'it', British: 'gb', Monegasque: 'mc', Australian: 'au', French: 'fr',
  Dutch: 'nl', 'New Zealander': 'nz', Spanish: 'es', German: 'de', Canadian: 'ca',
  Thai: 'th', Finnish: 'fi', Danish: 'dk', Japanese: 'jp', Chinese: 'cn',
  American: 'us', Mexican: 'mx', Brazilian: 'br', Argentine: 'ar', Austrian: 'at',
};

const NAT_CODE: Record<string, string> = {
  Italian: 'ITA', British: 'GBR', Monegasque: 'MON', Australian: 'AUS', French: 'FRA',
  Dutch: 'NED', 'New Zealander': 'NZL', Spanish: 'ESP', German: 'GER', Canadian: 'CAN',
  Thai: 'THA', Finnish: 'FIN', Danish: 'DEN', Japanese: 'JPN', Chinese: 'CHN',
  American: 'USA', Mexican: 'MEX', Brazilian: 'BRA', Argentine: 'ARG', Austrian: 'AUT',
};

const CONS_NAME_TO_SLUG: Record<string, string> = {
  'Mercedes': 'mercedes', 'Ferrari': 'ferrari', 'McLaren': 'mclaren', 'Haas F1 Team': 'haas',
  'Alpine F1 Team': 'alpine', 'Red Bull': 'red_bull', 'RB F1 Team': 'rb', 'Audi': 'audi',
  'Williams': 'williams', 'Cadillac F1 Team': 'cadillac', 'Aston Martin': 'aston_martin',
};

const CONS_NAME_TO_NAT: Record<string, string> = {
  'Mercedes': 'German', 'Ferrari': 'Italian', 'McLaren': 'British', 'Haas F1 Team': 'American',
  'Alpine F1 Team': 'French', 'Red Bull': 'Austrian', 'RB F1 Team': 'Italian', 'Audi': 'German',
  'Williams': 'British', 'Cadillac F1 Team': 'American', 'Aston Martin': 'British',
};

const BACKEND = 'https://pitwall-backend-dq9r.onrender.com';

// ─── API shapes ─────────────────────────────────────────────────────────────
interface ApiDriverRanking {
  driver_id: string; rounds: string; wins: string; points: string; position: string;
  given_name: string; family_name: string; code: string; number: string;
  nationality: string; constructor_name: string;
}

interface ApiConstructorRanking {
  rounds: number; wins: number; points: number; name: string;
}

// ─── Leader models ──────────────────────────────────────────────────────────
interface DriverLeader {
  firstName: string; lastName: string; code: string; number: string;
  team: string; teamColor: string; nationality: string;
  points: number; wins: number; gap: number; rounds: string;
}

interface ConstructorLeader {
  name: string; teamColor: string; nationality: string;
  points: number; wins: number; gap: number; rounds: string;
}

// ─── Count-up animation ─────────────────────────────────────────────────────
const useCountUp = (target: number, active: boolean, duration = 1100): number => {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo for a confident, settling finish
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, active, duration]);

  return value;
};

const Flag: React.FC<{ code?: string; size?: number }> = ({ code, size = 20 }) => {
  if (!code || code.length !== 2) return <span className="cl-flag-fallback">🏁</span>;
  const lc = code.toLowerCase();
  return (
    <img
      className="cl-flag"
      src={`https://flagcdn.com/w40/${lc}.png`}
      srcSet={`https://flagcdn.com/w80/${lc}.png 2x`}
      width={size}
      alt={code}
    />
  );
};

const CrownIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 8l3.5 3L12 4l5.5 7L21 8l-1.6 10H4.6L3 8z" fill="currentColor" />
    <rect x="4.6" y="18" width="14.8" height="2.4" rx="0.6" fill="currentColor" />
  </svg>
);

const WreathIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l2.2 4.6L19 8.4l-3.5 3.3.9 4.9L12 14.2 7.6 16.6l.9-4.9L5 8.4l4.8-.8L12 3z" fill="currentColor" />
  </svg>
);

const ChampionshipLeaders: React.FC = () => {
  const [driver, setDriver] = useState<DriverLeader | null>(null);
  const [constructor, setConstructor] = useState<ConstructorLeader | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Reveal (and trigger count-ups) when scrolled into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, cRes] = await Promise.all([
          fetch(`${BACKEND}/drivers/get-all-drivers-season-rankings`),
          fetch(`${BACKEND}/constructors/get-all-constructors-season-rankings`),
        ]);
        const dData: ApiDriverRanking[] = await dRes.json();
        const cData: ApiConstructorRanking[] = await cRes.json();

        if (dData.length > 0) {
          const d = dData[0];
          const slug = DRIVER_NAME_TO_SLUG[d.constructor_name] || d.constructor_name.toLowerCase().replace(/ /g, '_');
          setDriver({
            firstName: d.given_name,
            lastName: d.family_name,
            code: d.code || d.family_name.substring(0, 3).toUpperCase(),
            number: d.number,
            team: d.constructor_name,
            teamColor: teamColors[slug] || 'var(--racing)',
            nationality: d.nationality,
            points: parseFloat(d.points),
            wins: parseInt(d.wins) || 0,
            gap: dData.length > 1 ? parseFloat(d.points) - parseFloat(dData[1].points) : 0,
            rounds: d.rounds,
          });
        }

        if (cData.length > 0) {
          const c = cData[0];
          const slug = CONS_NAME_TO_SLUG[c.name] || 'unknown';
          setConstructor({
            name: c.name,
            teamColor: teamColors[slug] || 'var(--racing)',
            nationality: CONS_NAME_TO_NAT[c.name] || 'Unknown',
            points: c.points,
            wins: c.wins || 0,
            gap: cData.length > 1 ? c.points - cData[1].points : 0,
            rounds: c.rounds.toString(),
          });
        }
      } catch (err) {
        console.error('Failed to load championship leaders', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const animate = visible && !loading;
  const driverPts = useCountUp(driver?.points ?? 0, animate);
  const consPts = useCountUp(constructor?.points ?? 0, animate);

  const rounds = driver?.rounds || constructor?.rounds || '0';

  return (
    <section ref={sectionRef} id="leaders" className={`cl-section ${visible ? 'is-visible' : ''}`}>
      <div className="cl-head">
        <div className="cl-eyebrow">
          <span className="cl-eyebrow-dot" />
          Championship Leaders
        </div>
        <div className="cl-title">
          Who's <em>In Front</em>
        </div>
        <div className="cl-meta">2026 · After {rounds} Rounds</div>
      </div>

      <div className="cl-grid">
        {/* ── Driver leader ─────────────────────────────────────────────── */}
        <article
          className={`cl-card ${loading ? 'is-loading' : ''}`}
          style={{ '--team-color': driver?.teamColor || 'var(--racing)' } as React.CSSProperties}
        >
          <div className="cl-card-glow" />
          <div className="cl-card-sheen" />
          <header className="cl-card-head">
            <div className="cl-badge">
              <span className="cl-badge-icon"><CrownIcon /></span>
              Drivers' Championship
            </div>
            <div className="cl-p1">P1</div>
          </header>

          {driver && (
            <>
              <div className="cl-name-wrap">
                <div className="cl-firstname">{driver.firstName}</div>
                <div className="cl-lastname">{driver.lastName}</div>
              </div>

              <div className="cl-subline">
                <span className="cl-code" style={{ color: driver.teamColor }}>{driver.code}</span>
                <span className="cl-num">#{driver.number}</span>
                <span className="cl-dot-sep" />
                <Flag code={NATIONALITY_ISO[driver.nationality]} />
                <span className="cl-nat">{NAT_CODE[driver.nationality] || driver.nationality}</span>
              </div>

              <div className="cl-team-tag">{driver.team}</div>

              <div className="cl-stats">
                <div className="cl-stat cl-stat-main">
                  <div className="cl-stat-val">{animate ? driverPts : Math.round(driver.points)}</div>
                  <div className="cl-stat-lbl">Points</div>
                </div>
                <div className="cl-stat">
                  <div className="cl-stat-val">{driver.wins}</div>
                  <div className="cl-stat-lbl">Wins</div>
                </div>
                <div className="cl-stat">
                  <div className="cl-stat-val">{driver.gap > 0 ? `+${driver.gap}` : '—'}</div>
                  <div className="cl-stat-lbl">Lead</div>
                </div>
              </div>
            </>
          )}
          <div className="cl-watermark">{driver?.number ? driver.number : ''}</div>
        </article>

        {/* ── Constructor leader ────────────────────────────────────────── */}
        <article
          className={`cl-card ${loading ? 'is-loading' : ''}`}
          style={{ '--team-color': constructor?.teamColor || 'var(--racing)' } as React.CSSProperties}
        >
          <div className="cl-card-glow" />
          <div className="cl-card-sheen" />
          <header className="cl-card-head">
            <div className="cl-badge">
              <span className="cl-badge-icon"><WreathIcon /></span>
              Constructors' Championship
            </div>
            <div className="cl-p1">P1</div>
          </header>

          {constructor && (
            <>
              <div className="cl-name-wrap">
                <div className="cl-lastname cl-cons-name">{constructor.name}</div>
              </div>

              <div className="cl-subline">
                <Flag code={NATIONALITY_ISO[constructor.nationality]} />
                <span className="cl-nat">{NAT_CODE[constructor.nationality] || constructor.nationality}</span>
                <span className="cl-dot-sep" />
                <span className="cl-team-pill" style={{ background: constructor.teamColor }} />
                <span className="cl-nat">Works Team</span>
              </div>

              <div className="cl-team-tag">Leading the Constructors' Cup</div>

              <div className="cl-stats">
                <div className="cl-stat cl-stat-main">
                  <div className="cl-stat-val">{animate ? consPts : Math.round(constructor.points)}</div>
                  <div className="cl-stat-lbl">Points</div>
                </div>
                <div className="cl-stat">
                  <div className="cl-stat-val">{constructor.wins}</div>
                  <div className="cl-stat-lbl">Wins</div>
                </div>
                <div className="cl-stat">
                  <div className="cl-stat-val">{constructor.gap > 0 ? `+${constructor.gap}` : '—'}</div>
                  <div className="cl-stat-lbl">Lead</div>
                </div>
              </div>
            </>
          )}
          <div className="cl-watermark cl-watermark-text">{constructor?.name?.substring(0, 3).toUpperCase() || ''}</div>
        </article>
      </div>
    </section>
  );
};

export default ChampionshipLeaders;
