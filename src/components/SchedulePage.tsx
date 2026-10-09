import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { COUNTRY_FLAGS, fetchRaces, raceSlug, type Race } from '../data/races';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

type ScheduleFilter = 'all' | 'upcoming' | 'completed' | 'sprint';

setWorkerUrl(mapLibreWorkerUrl);

interface SchedulePageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onRaceSelect: (race: Race) => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

const raceStart = (race: Race) => new Date(`${race.date}T${race.time || '12:00:00Z'}`);
const firstSession = (race: Race) => race.FirstPractice || race.SprintQualifying || { date: race.date, time: race.time };

const dateRange = (race: Race) => {
  const start = new Date(`${firstSession(race).date}T12:00:00Z`);
  const end = new Date(`${race.date}T12:00:00Z`);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const startDay = start.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' });
  const endDay = end.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' });
  return startMonth === endMonth ? `${startDay}–${endDay} ${endMonth}` : `${startDay} ${startMonth}–${endDay} ${endMonth}`;
};

const localRaceTime = (race: Race) => {
  if (!race.time) return 'Time TBC';
  return raceStart(race).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
};

const CircuitMap: React.FC<{ race: Race }> = ({ race }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const lat = Number(race.Circuit.Location.lat) || 0;
  const lon = Number(race.Circuit.Location.long) || 0;
  const initialCenter = useRef<[number, number]>([lon, lat]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MapLibreMap({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/fiord',
      center: initialCenter.current,
      zoom: 13,
      interactive: false,
      attributionControl: false,
      fadeDuration: 180,
    });
    mapRef.current = map;
    map.on('error', (event) => {
      console.error('Schedule map failed to load', event.error);
    });
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []); // The map instance stays mounted; the effect below moves it between circuits.

  useEffect(() => {
    mapRef.current?.easeTo({ center: [lon, lat], zoom: 13, duration: 650 });
  }, [lat, lon]);

  return <div ref={containerRef} className="schedule-vector-map" aria-hidden="true" />;
};

const SchedulePage: React.FC<SchedulePageProps> = ({
  user,
  setUser,
  onBack,
  onRaceSelect,
  onOpenSettings,
  onHomeNavigate,
}) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [filter, setFilter] = useState<ScheduleFilter>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => new Date());
  const [activeRound, setActiveRound] = useState<string>('');
  const nextCardRef = useRef<HTMLElement>(null);
  const mapRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetchRaces().then((data) => {
      if (active) setRaces(data);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!races.length) return;
    const frame = window.requestAnimationFrame(() => {
      const rail = mapRailRef.current;
      const active = rail?.querySelector('.schedule-map-card.active') as HTMLElement | null;
      if (rail && active) rail.scrollTo({ left: Math.max(0, active.offsetLeft - 12) });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [races]);

  const nextRace = races.find((race) => raceStart(race).getTime() >= now.getTime());
  const completed = races.filter((race) => raceStart(race).getTime() < now.getTime()).length;
  const sprintCount = races.filter((race) => race.Sprint).length;
  const season = races[0]?.season || '2026';
  const activeRace = races.find((race) => race.round === activeRound) || nextRace || races[0];

  const visibleRaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return races.filter((race) => {
      const isPast = raceStart(race).getTime() < now.getTime();
      const matchesFilter = filter === 'all'
        || (filter === 'upcoming' && !isPast)
        || (filter === 'completed' && isPast)
        || (filter === 'sprint' && !!race.Sprint);
      const haystack = `${race.raceName} ${race.Circuit.circuitName} ${race.Circuit.Location.locality} ${race.Circuit.Location.country}`.toLowerCase();
      return matchesFilter && (!needle || haystack.includes(needle));
    });
  }, [races, filter, query, now]);

  const jumpToNext = () => {
    setFilter('all');
    setQuery('');
    window.requestAnimationFrame(() => nextCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const moveMapRail = (direction: -1 | 1) => {
    mapRailRef.current?.scrollBy({ left: direction * 360, behavior: 'smooth' });
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <SiteHeader
          user={user}
          setUser={setUser}
          onOpenSettings={onOpenSettings}
          onHomeNavigate={onHomeNavigate}
          leftSlot={
            <button className="rd-back-btn schedule-back" onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Dashboard
            </button>
          }
        />
      </div>

      <main>
        <section className="schedule-hero">
          <div className="schedule-hero-copy">
            <div className="schedule-kicker"><span /> Formula 1 · {season}</div>
            <h1>Every round.<br /><em>One pit wall.</em></h1>
            <p>Race weekends, sprint rounds and session start times—organized around what is next, shown in your local time.</p>
            {nextRace && (
              <button className="schedule-next-cta" onClick={jumpToNext}>
                Jump to round {String(nextRace.round).padStart(2, '0')}
                <span aria-hidden="true">↓</span>
              </button>
            )}
          </div>

          <div className="schedule-overview" aria-label={`${season} season overview`}>
            <div className="schedule-overview-top">
              <span>Season progress</span>
              <strong>{races.length ? Math.round((completed / races.length) * 100) : 0}%</strong>
            </div>
            <div className="schedule-progress"><span style={{ width: `${races.length ? (completed / races.length) * 100 : 0}%` }} /></div>
            <div className="schedule-stats">
              <div><strong>{races.length || '—'}</strong><span>Rounds</span></div>
              <div><strong>{sprintCount || '—'}</strong><span>Sprints</span></div>
              <div><strong>{Math.max(0, races.length - completed) || '—'}</strong><span>To go</span></div>
            </div>
            {nextRace && (
              <div className="schedule-next-mini">
                <span className="schedule-pulse" />
                <div><small>Up next</small><strong>{nextRace.Circuit.Location.locality}</strong></div>
                <span>{dateRange(nextRace)}</span>
              </div>
            )}
          </div>
        </section>

        {activeRace && (
          <section className="schedule-map" aria-labelledby="circuit-explorer-title">
            <div className="schedule-map-canvas">
              <CircuitMap race={activeRace} />
              <div className="schedule-map-shade" />
              <div className="schedule-map-heading">
                <div>
                  <span>Interactive circuit explorer</span>
                  <h2 id="circuit-explorer-title">{activeRace.Circuit.Location.locality}</h2>
                  <p>{activeRace.Circuit.circuitName} · {activeRace.Circuit.Location.country}</p>
                </div>
                <a href={`/race/${activeRace.season}/${raceSlug(activeRace)}`} onClick={(e) => { e.preventDefault(); onRaceSelect(activeRace); }}>
                  Explore race <span aria-hidden="true">↗</span>
                </a>
              </div>

              <div key={`track-${activeRace.season}-${activeRace.round}`} className="schedule-map-track" aria-hidden="true">
                {TRACK_PATHS[activeRace.Circuit.circuitId || ''] ? (
                  <svg viewBox={TRACK_VIEWBOX} fill="none" preserveAspectRatio="xMidYMid meet">
                    <path className="schedule-map-track-shadow" d={TRACK_PATHS[activeRace.Circuit.circuitId || '']} vectorEffect="non-scaling-stroke" />
                    <path className="schedule-map-track-line" d={TRACK_PATHS[activeRace.Circuit.circuitId || '']} vectorEffect="non-scaling-stroke" />
                  </svg>
                ) : null}
                <span className="schedule-map-pin"><i /></span>
              </div>

              <div className="schedule-map-coordinates">
                <span>{Math.abs(Number(activeRace.Circuit.Location.lat)).toFixed(4)}°{Number(activeRace.Circuit.Location.lat) >= 0 ? 'N' : 'S'}</span>
                <span>{Math.abs(Number(activeRace.Circuit.Location.long)).toFixed(4)}°{Number(activeRace.Circuit.Location.long) >= 0 ? 'E' : 'W'}</span>
              </div>

              <div className="schedule-map-controls">
                <button onClick={() => moveMapRail(-1)} aria-label="Previous races">←</button>
                <button onClick={() => moveMapRail(1)} aria-label="Next races">→</button>
              </div>

              <div className="schedule-map-rail" ref={mapRailRef}>
                {races.map((race) => {
                  const isPast = raceStart(race).getTime() < now.getTime();
                  const isNext = race.round === nextRace?.round;
                  const isActive = race.round === activeRace.round;
                  const code = COUNTRY_FLAGS[race.Circuit.Location.country.trim()];
                  const path = TRACK_PATHS[race.Circuit.circuitId || ''];
                  return (
                    <button
                      key={`map-${race.season}-${race.round}`}
                      className={`schedule-map-card ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setActiveRound(race.round)}
                      onFocus={() => setActiveRound(race.round)}
                      onClick={() => setActiveRound(race.round)}
                      aria-pressed={isActive}
                    >
                      <div className="schedule-map-card-copy">
                        <div className="schedule-map-card-meta">
                          <span>R{String(race.round).padStart(2, '0')}</span>
                          {race.Sprint && <em>Sprint</em>}
                          <i>{isPast ? 'Completed' : isNext ? 'Up next' : 'Upcoming'}</i>
                        </div>
                        <strong>
                          {code && <img src={`https://flagcdn.com/w40/${code}.png`} alt="" width="24" height="16" loading="lazy" />}
                          {race.Circuit.Location.locality}
                        </strong>
                        <small>{dateRange(race)}</small>
                      </div>
                      {path && <svg viewBox={TRACK_VIEWBOX} fill="none" aria-hidden="true"><path d={path} vectorEffect="non-scaling-stroke" /></svg>}
                    </button>
                  );
                })}
              </div>

              <div className="schedule-map-attribution">
                <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a>
                <span>©</span>
                <a href="https://openmaptiles.org" target="_blank" rel="noopener noreferrer">OpenMapTiles</a>
                <span>· Data from</span>
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
              </div>
            </div>
          </section>
        )}

        <section className="schedule-content" aria-labelledby="schedule-title">
          <div className="schedule-toolbar">
            <div>
              <span className="schedule-section-label">Championship itinerary</span>
              <h2 id="schedule-title">Season schedule</h2>
            </div>
            <label className="schedule-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <span className="sr-only">Search the schedule</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search race or circuit" />
            </label>
          </div>

          <div className="schedule-filters" role="group" aria-label="Filter races">
            {([
              ['all', 'All rounds'],
              ['upcoming', 'Upcoming'],
              ['completed', 'Completed'],
              ['sprint', 'Sprint weekends'],
            ] as [ScheduleFilter, string][]).map(([value, label]) => (
              <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>

          {loading ? (
            <div className="schedule-loading" role="status">Loading season calendar…</div>
          ) : visibleRaces.length === 0 ? (
            <div className="schedule-empty">
              <span>0 races found</span>
              <h3>No rounds match this view.</h3>
              <button onClick={() => { setFilter('all'); setQuery(''); }}>Reset filters</button>
            </div>
          ) : (
            <div className="schedule-grid">
              {visibleRaces.map((race) => {
                const start = raceStart(race);
                const isPast = start.getTime() < now.getTime();
                const isNext = race.round === nextRace?.round;
                const code = COUNTRY_FLAGS[race.Circuit.Location.country.trim()];
                const trackPath = TRACK_PATHS[race.Circuit.circuitId || ''];
                return (
                  <article
                    key={`${race.season}-${race.round}`}
                    ref={isNext ? nextCardRef : undefined}
                    className={`schedule-card ${isPast ? 'is-complete' : ''} ${isNext ? 'is-next' : ''}`}
                  >
                    <div className="schedule-card-head">
                      <span className="schedule-round">R{String(race.round).padStart(2, '0')}</span>
                      <div className="schedule-badges">
                        {race.Sprint && <span className="schedule-sprint-badge">Sprint</span>}
                        <span className={`schedule-status ${isPast ? 'complete' : isNext ? 'next' : 'upcoming'}`}>
                          {isPast ? 'Completed' : isNext ? 'Up next' : 'Upcoming'}
                        </span>
                      </div>
                    </div>

                    <div className="schedule-card-visual">
                      {trackPath ? (
                        <svg viewBox={TRACK_VIEWBOX} fill="none" preserveAspectRatio="xMidYMid meet" aria-label={`${race.Circuit.circuitName} circuit outline`}>
                          <path d={trackPath} vectorEffect="non-scaling-stroke" />
                        </svg>
                      ) : <span className="schedule-track-fallback">{String(race.round).padStart(2, '0')}</span>}
                    </div>

                    <div className="schedule-card-body">
                      <div className="schedule-country-line">
                        {code && <img src={`https://flagcdn.com/w40/${code}.png`} width="28" height="19" loading="lazy" alt={`${race.Circuit.Location.country} flag`} />}
                        <span>{race.Circuit.Location.country}</span>
                      </div>
                      <h3>{race.raceName.replace(' Grand Prix', '')}</h3>
                      <p>{race.Circuit.circuitName} · {race.Circuit.Location.locality}</p>
                    </div>

                    <div className="schedule-card-foot">
                      <div><span>{dateRange(race)}</span><small>Race · {localRaceTime(race)}</small></div>
                      <a href={`/race/${race.season}/${raceSlug(race)}`} onClick={(e) => { e.preventDefault(); onRaceSelect(race); }} aria-label={`View ${race.raceName} details`}>
                        <span>Details</span><span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SchedulePage;
