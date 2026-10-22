import React, { useEffect, useRef, useState } from 'react';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';
import type { Race } from '../data/races';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';
import { TRACK_DETAILS } from '../data/trackDetails';

interface Props {
  race: Race;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenRace: (race: Race) => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

const fmtSession = (session: { date: string; time?: string }) => {
  const date = new Date(`${session.date}T${session.time || '12:00:00'}`);
  return {
    date: date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
    time: session.time ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'TBC',
  };
};

const FACT_ICONS = [
  'M4 7h16M4 17h16M7 4v6m10-6v6M7 14v6m10-6v6',
  'M4 18 9 6l6 12 5-12M4 18h16',
  'M5 20V4m0 1h14l-3 4 3 4H5',
  'M4 19V9a5 5 0 0 1 10 0v6a3 3 0 0 0 6 0V5',
  'M4 11a8 8 0 1 1 2 7M4 4v7h7',
  'M4 20V9l8-5 8 5v11M8 20v-6h8v6M3 20h18',
];

const TrackDetailsPage: React.FC<Props> = ({ race, user, setUser, onBack, onOpenRace, onOpenSettings, onHomeNavigate }) => {
  const id = race.Circuit.circuitId || '';
  const path = TRACK_PATHS[id];
  const details = TRACK_DETAILS[id];
  const [scrolled, setScrolled] = useState(false);
  const [rotation, setRotation] = useState(-12);
  const [tilt, setTilt] = useState(58);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; rotation: number } | null>(null);

  useEffect(() => {
    document.title = `${race.Circuit.circuitName} — Track Guide | Pitwall`;
    return () => { document.title = 'Pitwall — Formula 1 Dashboard'; };
  }, [race]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sessions = [
    ['Practice 1', race.FirstPractice], ['Practice 2', race.SecondPractice],
    ['Practice 3', race.ThirdPractice], ['Sprint Qualifying', race.SprintQualifying],
    ['Sprint', race.Sprint], ['Qualifying', race.Qualifying],
    ['Race', { date: race.date, time: race.time }],
  ].filter((entry) => entry[1]) as Array<[string, { date: string; time?: string }]>;

  return (
    <div className="track-page">
      <header className="rd-site-header">
        <SiteHeader pageTitle={race.Circuit.circuitName} user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate}
          leftSlot={
            <div className="rd-header-left">
              <button className="rd-back-btn" type="button" onClick={onBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                Back
              </button>
              <div className={`rd-header-race ${scrolled ? 'visible' : ''}`} aria-hidden={!scrolled}>
                <span className="rd-header-race-round">R{race.round}</span>
                <span className="rd-header-race-name">{race.Circuit.circuitName}</span>
              </div>
            </div>
          } />
      </header>

      <main>
        <section className="track-hero">
          <div className="track-hero-copy">
            <span className="track-kicker">Circuit dossier · Round {String(race.round).padStart(2, '0')}</span>
            <div className="track-venue-tags"><span>{race.season} season</span>{details && <span>{details.type}</span>}</div>
            <h1>{race.Circuit.circuitName}</h1>
            <p className="track-location">{race.Circuit.Location.locality} · {race.Circuit.Location.country}</p>
            <p className="track-intro">{details?.character || `Explore the full ${race.Circuit.circuitName} layout, race weekend and circuit location.`}</p>
            {details && <div className="track-heritage"><span>On the calendar since</span><strong>{details.firstGrandPrix}</strong><i aria-hidden="true" /></div>}
            <div className="track-hero-actions">
              <button type="button" onClick={() => onOpenRace(race)}>Open race weekend <span aria-hidden="true">↗</span></button>
              {race.Circuit.url && <a href={race.Circuit.url} target="_blank" rel="noreferrer">Circuit history ↗</a>}
            </div>
          </div>

          <div className="track-model-panel">
            <div className="track-model-toolbar"><span><i /> Circuit explorer</span><div className="track-view-switch" aria-label="Circuit view"><button type="button" aria-pressed={tilt !== 0} onClick={() => setTilt(58)}>3D view</button><button type="button" aria-pressed={tilt === 0} onClick={() => { setTilt(0); setRotation(0); }}>Top view</button></div></div>
            <div className="track-model-stage"
              onPointerDown={(e) => { drag.current = { x: e.clientX, rotation }; e.currentTarget.setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => { if (drag.current) setRotation(((drag.current.rotation + (e.clientX - drag.current.x) * .45 + 180) % 360 + 360) % 360 - 180); }}
              onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              <div className="track-grid-floor" />
              {path ? <svg className="track-model" viewBox={TRACK_VIEWBOX} style={{ transform: `translate(-50%,-50%) perspective(900px) rotateX(${tilt}deg) rotateZ(${rotation}deg) scale(${zoom})` }} aria-label={`3D model of ${race.Circuit.circuitName}`}>
                <defs><filter id="track-glow"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                {Array.from({ length: 9 }).map((_, index) => <path key={index} d={path} className="track-model-depth" style={{ transform: `translateY(${9 - index}px)` }} />)}
                <path d={path} className="track-model-edge" />
                <path d={path} className="track-model-road" pathLength={100} />
                <path d={path} className="track-model-racing-line" pathLength={100} />
              </svg> : <p className="track-model-empty">Circuit geometry unavailable</p>}
              <div className="track-stage-caption"><span>Layout study / {String(race.round).padStart(2, '0')}</span><span>Drag to rotate</span></div>
              {details && <div className="track-model-spec"><span><strong>{details.lengthKm.toFixed(3)}</strong> km</span><i /><span><strong>{details.corners}</strong> corners</span></div>}
              <span className="track-model-note">Schematic circuit layout</span>
            </div>
            <div className="track-model-controls">
              <label><span>Rotation <output>{Math.round(rotation)}°</output></span><input aria-label="Circuit rotation" type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))}/></label>
              <label><span>Tilt <output>{tilt}°</output></span><input aria-label="Circuit tilt" type="range" min="0" max="75" value={tilt} onChange={(e) => setTilt(Number(e.target.value))}/></label>
              <div><button type="button" onClick={() => setZoom((v) => Math.max(.75, v - .1))} aria-label="Zoom out">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((v) => Math.min(1.35, v + .1))} aria-label="Zoom in">+</button></div>
              <button type="button" onClick={() => { setRotation(-12); setTilt(58); setZoom(1); }}>Reset</button>
            </div>
          </div>
        </section>

        <section className="track-facts" aria-label="Circuit facts">
          {[
            ['Circuit length', details ? `${details.lengthKm.toFixed(3)} km` : '—'],
            ['Race distance', details ? `≈ ${(details.lengthKm * details.laps).toFixed(1)} km` : '—'],
            ['Race laps', details?.laps ?? '—'], ['Corners', details?.corners ?? '—'],
            ['Direction', details?.direction ?? '—'], ['Venue type', details?.type ?? '—'],
          ].map(([label, value], index) => <article key={String(label)}><div className="track-fact-top"><small>0{index + 1}</small><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d={FACT_ICONS[index]} /></svg></div><span>{label}</span><strong>{value}</strong></article>)}
        </section>

        <section className="track-dashboard">
          <article className="track-info-card">
            <header><span>01 / Track identity</span><h2>What makes it different</h2></header>
            <div className="track-signatures">{details?.highlights.map((item, index) => <div key={item}><span>0{index + 1}</span><strong>{item}</strong><i aria-hidden="true" /></div>)}</div>
            <dl>
              <div><dt>Venue type</dt><dd>{details?.type || '—'}</dd></div>
              <div><dt>First Grand Prix</dt><dd>{details?.firstGrandPrix || '—'}</dd></div>
              <div><dt>Coordinates</dt><dd>{race.Circuit.Location.lat && race.Circuit.Location.long ? `${Number(race.Circuit.Location.lat).toFixed(4)}, ${Number(race.Circuit.Location.long).toFixed(4)}` : '—'}</dd></div>
            </dl>
            <div className="track-record">
              <div><span>Official race lap record</span><strong>{details?.lapRecord || 'Not established'}</strong><small>{details?.lapRecordDriver || 'A benchmark waiting to be set.'}</small></div>
              <svg aria-hidden="true" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="44" r="25" /><circle cx="40" cy="44" r="19" strokeDasharray="1 5" /><path d="M40 44 52 30M40 19V9m-8 0h16M59 23l6-6m-3-3 6 6" /><circle cx="40" cy="44" r="3" /></svg>
            </div>
          </article>

          <article className="track-info-card track-weekend-card">
            <header><span>02 / {race.season} weekend</span><h2>Session schedule</h2><p className="track-timezone-note">Times shown in your local timezone</p></header>
            <div className="track-session-list">{sessions.map(([name, session], index) => {
              const formatted = fmtSession(session);
              return <div className={name === 'Race' ? 'main' : ''} key={name}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span className="track-session-name">{name}{name === 'Race' && <small>Grand Prix</small>}</span>
                <time dateTime={session.time ? `${session.date}T${session.time}` : session.date}><span>{formatted.date}</span><strong>{formatted.time}</strong></time>
              </div>;
            })}</div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackDetailsPage;
