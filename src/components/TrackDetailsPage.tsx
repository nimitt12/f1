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

const fmtSession = (session?: { date: string; time?: string }) => {
  if (!session) return 'TBC';
  return new Date(`${session.date}T${session.time || '12:00:00Z'}`).toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

const TrackDetailsPage: React.FC<Props> = ({ race, user, setUser, onBack, onOpenRace, onOpenSettings, onHomeNavigate }) => {
  const id = race.Circuit.circuitId || '';
  const path = TRACK_PATHS[id];
  const details = TRACK_DETAILS[id];
  const [rotation, setRotation] = useState(-12);
  const [tilt, setTilt] = useState(58);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; rotation: number } | null>(null);

  useEffect(() => {
    document.title = `${race.Circuit.circuitName} — Track Guide | Pitwall`;
    return () => { document.title = 'Pitwall — Formula 1 Dashboard'; };
  }, [race]);

  const sessions = [
    ['Practice 1', race.FirstPractice], ['Practice 2', race.SecondPractice],
    ['Practice 3', race.ThirdPractice], ['Sprint Qualifying', race.SprintQualifying],
    ['Sprint', race.Sprint], ['Qualifying', race.Qualifying],
    ['Race', { date: race.date, time: race.time }],
  ].filter((entry) => entry[1]) as Array<[string, { date: string; time?: string }]>;

  return (
    <div className="track-page">
      <header className="track-site-header">
        <SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate}
          leftSlot={<button className="track-back" type="button" onClick={onBack}>← Back</button>} />
      </header>

      <main>
        <section className="track-hero">
          <div className="track-hero-copy">
            <span className="track-kicker">Circuit dossier · Round {String(race.round).padStart(2, '0')}</span>
            <h1>{race.Circuit.circuitName}</h1>
            <p className="track-location">{race.Circuit.Location.locality} · {race.Circuit.Location.country}</p>
            <p className="track-intro">{details?.character || `Explore the full ${race.Circuit.circuitName} layout, race weekend and circuit location.`}</p>
            <div className="track-hero-actions">
              <button type="button" onClick={() => onOpenRace(race)}>Open race weekend <span>↗</span></button>
              {race.Circuit.url && <a href={race.Circuit.url} target="_blank" rel="noreferrer">Circuit history ↗</a>}
            </div>
          </div>

          <div className="track-model-panel">
            <div className="track-model-toolbar"><span><i /> Interactive 3D circuit</span><small>Drag to rotate</small></div>
            <div className="track-model-stage"
              onPointerDown={(e) => { drag.current = { x: e.clientX, rotation }; e.currentTarget.setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => { if (drag.current) setRotation(drag.current.rotation + (e.clientX - drag.current.x) * .45); }}
              onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
              <div className="track-grid-floor" />
              {path ? <svg className="track-model" viewBox={TRACK_VIEWBOX} style={{ transform: `translate(-50%,-50%) perspective(900px) rotateX(${tilt}deg) rotateZ(${rotation}deg) scale(${zoom})` }} aria-label={`3D model of ${race.Circuit.circuitName}`}>
                <defs><filter id="track-glow"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                {Array.from({ length: 9 }).map((_, index) => <path key={index} d={path} className="track-model-depth" style={{ transform: `translateY(${9 - index}px)` }} />)}
                <path d={path} className="track-model-edge" />
                <path d={path} className="track-model-road" pathLength={100} />
                <path d={path} className="track-model-racing-line" pathLength={100} />
              </svg> : <p className="track-model-empty">Circuit geometry unavailable</p>}
              <span className="track-axis track-axis-n">N</span><span className="track-axis track-axis-s">S</span>
            </div>
            <div className="track-model-controls">
              <label>Rotation <input aria-label="Circuit rotation" type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(Number(e.target.value))}/></label>
              <label>Tilt <input aria-label="Circuit tilt" type="range" min="25" max="75" value={tilt} onChange={(e) => setTilt(Number(e.target.value))}/></label>
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
          ].map(([label, value], index) => <article key={String(label)}><small>0{index + 1}</small><span>{label}</span><strong>{value}</strong></article>)}
        </section>

        <section className="track-dashboard">
          <article className="track-info-card">
            <header><span>01 / Track identity</span><h2>What makes it different</h2></header>
            <div className="track-chip-row">{details?.highlights.map((item) => <span key={item}>{item}</span>)}</div>
            <dl>
              <div><dt>Venue type</dt><dd>{details?.type || '—'}</dd></div>
              <div><dt>First Grand Prix</dt><dd>{details?.firstGrandPrix || '—'}</dd></div>
              <div><dt>Coordinates</dt><dd>{race.Circuit.Location.lat && race.Circuit.Location.long ? `${Number(race.Circuit.Location.lat).toFixed(4)}, ${Number(race.Circuit.Location.long).toFixed(4)}` : '—'}</dd></div>
              <div><dt>Official race lap record</dt><dd>{details?.lapRecord ? <>{details.lapRecord}<small>{details.lapRecordDriver}</small></> : 'No race record yet'}</dd></div>
            </dl>
          </article>

          <article className="track-info-card track-weekend-card">
            <header><span>02 / {race.season} weekend</span><h2>Session schedule</h2></header>
            <div>{sessions.map(([name, session], index) => <div className={name === 'Race' ? 'main' : ''} key={name}><b>{String(index + 1).padStart(2, '0')}</b><span>{name}</span><time>{fmtSession(session)}</time></div>)}</div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackDetailsPage;
