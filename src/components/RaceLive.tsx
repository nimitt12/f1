import React, { useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, RACE_DURATION_MS, SESSION_DURATION_MS, type Race } from '../data/races';

const Flag: React.FC<{ code: string }> = ({ code }) => {
  if (!code || code.length !== 2) return <span className="rl-flag-fallback">🏁</span>;
  const lower = code.toLowerCase();
  return (
    <img
      className="rl-flag"
      src={`https://flagcdn.com/w80/${lower}.png`}
      srcSet={`https://flagcdn.com/w160/${lower}.png 2x`}
      width="44"
      alt={code}
    />
  );
};

const StatIcon: React.FC<{ kind: 'clock' | 'stopwatch' | 'flag' }> = ({ kind }) => {
  if (kind === 'clock') {
    return (
      <svg className="rl-stat-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }
  if (kind === 'stopwatch') {
    return (
      <svg className="rl-stat-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 13v-4M9 3h6M18.5 6.5l1-1" />
      </svg>
    );
  }
  return (
    <svg className="rl-stat-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h9l-1.5 3L14 10H5" />
    </svg>
  );
};

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

type Phase = 'pre' | 'underway' | 'finished';
type SessionStatus = 'done' | 'live' | 'next' | 'upcoming';

interface RaceLiveProps {
  /** The race happening today. */
  race: Race;
  /** Full calendar, for season-progress context. */
  races: Race[];
  onRaceSelect?: (race: Race) => void;
  /** Opens the live timing console (pit-wall view). */
  onOpenLiveTiming?: () => void;
}

const fmtTime = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

const RaceLive: React.FC<RaceLiveProps> = ({ race, races, onRaceSelect, onOpenLiveTiming }) => {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = useMemo(
    () => new Date(`${race.date}T${race.time || '15:00:00Z'}`).getTime(),
    [race.date, race.time],
  );

  const phase: Phase = useMemo(() => {
    const diff = start - now;
    if (diff > 0) return 'pre';
    if (now - start < RACE_DURATION_MS) return 'underway';
    return 'finished';
  }, [start, now]);

  const clock = useMemo(() => {
    const span = phase === 'pre' ? start - now : now - start;
    return {
      h: pad(Math.floor(span / 3_600_000)),
      m: pad(Math.floor((span % 3_600_000) / 60_000)),
      s: pad(Math.floor((span % 60_000) / 1000)),
    };
  }, [phase, start, now]);

  // Race completion, 0 → 1 — drives the broadcast-style progress rail/bar.
  const raceProgress = useMemo(() => {
    if (phase === 'pre') return 0;
    if (phase === 'finished') return 1;
    return Math.min(1, Math.max(0, (now - start) / RACE_DURATION_MS));
  }, [phase, now, start]);

  const total = races.length;
  const completed = races.filter((r) => r.date < race.date).length;
  const localStart = fmtTime(start);

  // Full weekend timeline — every scheduled session, ordered chronologically.
  const sessions = useMemo(() => {
    const defs: Array<[string, { date: string; time?: string } | undefined]> = [
      ['Practice 1', race.FirstPractice],
      ['Practice 2', race.SecondPractice],
      ['Practice 3', race.ThirdPractice],
      ['Sprint Quali', race.SprintQualifying],
      ['Sprint', race.Sprint],
      ['Qualifying', race.Qualifying],
      ['Grand Prix', { date: race.date, time: race.time }],
    ];

    const list = defs
      .filter(([, s]) => s && s.date)
      .map(([label, s]) => {
        const ts = new Date(`${s!.date}T${s!.time || '12:00:00Z'}`).getTime();
        const isRace = label === 'Grand Prix';
        const icon: 'clock' | 'stopwatch' | 'flag' = isRace ? 'flag' : label.includes('Quali') ? 'stopwatch' : 'clock';
        return { label, ts, isRace, icon };
      })
      .sort((a, b) => a.ts - b.ts);

    const withStatus = list.map((s): { label: string; ts: number; isRace: boolean; icon: 'clock' | 'stopwatch' | 'flag'; status: SessionStatus; frac: number } => {
      const dur = s.isRace ? RACE_DURATION_MS : SESSION_DURATION_MS;
      const status: SessionStatus =
        now >= s.ts && now < s.ts + dur ? 'live' : now >= s.ts + dur ? 'done' : 'upcoming';
      const frac = status === 'done' ? 1 : status === 'live' ? Math.min(1, Math.max(0, (now - s.ts) / dur)) : 0;
      return { ...s, status, frac };
    });

    // Promote the first still-upcoming session to "next".
    const firstUpcoming = withStatus.findIndex((s) => s.status === 'upcoming');
    if (firstUpcoming !== -1) withStatus[firstUpcoming].status = 'next';
    return withStatus;
  }, [race, now]);

  const country = race.Circuit.Location.country;
  const code = COUNTRY_FLAGS[country] || '';

  const phaseCopy =
    phase === 'pre'
      ? { status: 'Race Day', headline: 'Lights Out In', lights: 'Formation Lap', timerClass: 'rl-timer-pre' }
      : phase === 'underway'
        ? { status: 'Race Is Live', headline: 'Race Time Elapsed', lights: 'Lights Out — Go!', timerClass: 'rl-timer-live' }
        : { status: 'Race Complete', headline: 'Time Since Lights Out', lights: 'Chequered Flag', timerClass: 'rl-timer-done' };

  return (
    <section className="rl-section">
      <div className={`rl-banner rl-phase-${phase}`} role="region" aria-label="Race day live">
        {phase !== 'pre' && (
          <div className="rl-progress-rail" aria-hidden="true">
            <div className="rl-progress-rail-fill" style={{ width: `${raceProgress * 100}%` }} />
          </div>
        )}
        <div className="rl-sheen" aria-hidden="true" />

        <div className="rl-grid">
          <div className="rl-left">
            <div className="rl-status">
              <span className="rl-pulse" aria-hidden="true" />
              <span className="rl-status-text">{phaseCopy.status}</span>
              <span className="rl-status-tag">Round {String(race.round).padStart(2, '0')} / {total}</span>
            </div>

            <div className="rl-headline">
              <div className="rl-flag-frame">
                <Flag code={code} />
              </div>
              <h2 className="rl-race-name">
                {race.raceName.replace(' Grand Prix', '')}
                <span> Grand Prix</span>
              </h2>
            </div>

            <div className="rl-circuit">
              <strong>{race.Circuit.circuitName}</strong>
              <span className="rl-dot">•</span>
              {race.Circuit.Location.locality}, {country}
            </div>

            <div className="rl-stats">
              <div className="rl-stat">
                <span className="rl-stat-label">
                  <StatIcon kind="clock" />
                  Lights Out
                </span>
                <span className="rl-stat-val">{localStart}</span>
              </div>
              <div className="rl-stat">
                <span className="rl-stat-label">
                  <StatIcon kind="stopwatch" />
                  Circuit Time
                </span>
                <span className="rl-stat-val">
                  {race.time ? race.time.replace(':00Z', '') : 'TBC'}
                  <em>local</em>
                </span>
              </div>
              <div className="rl-stat">
                <span className="rl-stat-label">
                  <StatIcon kind="flag" />
                  Season
                </span>
                <span className="rl-stat-val">
                  {completed}
                  <em>/ {total} done</em>
                </span>
                <span className="rl-stat-bar" aria-hidden="true">
                  <span className="rl-stat-bar-fill" style={{ width: `${(completed / total) * 100}%` }} />
                </span>
              </div>
            </div>

            <div className="rl-cta-row">
              {onOpenLiveTiming && (
                <button className="rl-cta rl-cta-timing" onClick={onOpenLiveTiming}>
                  <span className="rl-cta-dot" aria-hidden="true" />
                  <span>Live Timing</span>
                </button>
              )}
              {onRaceSelect && (
                <button className="rl-cta rl-cta-ghost" onClick={() => onRaceSelect(race)}>
                  <span>Open Race Center</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="rl-right">
            {/* F1 start-lights gantry */}
            <div className={`rl-lights rl-lights-${phase}`} aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="rl-light" style={{ animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
            <div className="rl-lights-caption">
              {phase === 'underway' && <span className="rl-live-dot" aria-hidden="true" />}
              {phaseCopy.lights}
            </div>

            <div className="rl-timer-label">{phaseCopy.headline}</div>
            <div className={`rl-timer ${phaseCopy.timerClass}`}>
              <div className="rl-cell">
                <span className="rl-cell-num">{clock.h}</span>
                <span className="rl-cell-unit">Hrs</span>
              </div>
              <span className="rl-colon">:</span>
              <div className="rl-cell">
                <span className="rl-cell-num">{clock.m}</span>
                <span className="rl-cell-unit">Min</span>
              </div>
              <span className="rl-colon">:</span>
              <div className="rl-cell">
                <span className="rl-cell-num">{clock.s}</span>
                <span className="rl-cell-unit">Sec</span>
              </div>
            </div>

            {phase !== 'pre' && (
              <div className="rl-progress-track" aria-hidden="true">
                <span className="rl-progress-fill" style={{ width: `${raceProgress * 100}%` }} />
              </div>
            )}
          </div>
        </div>

        {/* Weekend session timeline */}
        <div className="rl-sessions" role="list" aria-label="Race weekend schedule">
          {sessions.map((s) => (
            <div key={s.label} className={`rl-session rl-session-${s.status} ${s.isRace ? 'rl-session-race' : ''}`} role="listitem">
              <div className="rl-session-top">
                <span className="rl-session-label">
                  <StatIcon kind={s.icon} />
                  <span className="rl-session-name">{s.label}</span>
                </span>
                {s.status === 'live' && <span className="rl-badge-live">● Live</span>}
                {s.status === 'next' && <span className="rl-badge-next">Up Next</span>}
                {s.status === 'done' && <span className="rl-badge-check">✓</span>}
              </div>
              <div className="rl-session-time">
                {fmtDay(s.ts)} · {fmtTime(s.ts)}
              </div>
              {s.status === 'live' && (
                <span className="rl-session-progress" aria-hidden="true">
                  <span className="rl-session-progress-fill" style={{ width: `${s.frac * 100}%` }} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RaceLive;
