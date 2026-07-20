/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SiteHeader from './SiteHeader';
import type { AuthUser } from './Hero';
import { useLiveTiming, replayControl, fetchArchiveIndex } from '../hooks/useLiveTiming';

const F1_STATIC_BASE = 'https://livetiming.formula1.com/static/';

/* ------------------------------------------------------------------ */
/* Feed helpers                                                        */
/* ------------------------------------------------------------------ */

// After delta merges, feed arrays can arrive as objects keyed by stringified
// index — normalize either shape to a plain array.
const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => value[k]);
  }
  return [];
};

const TRACK_STATUS: Record<string, { label: string; tone: string }> = {
  '1': { label: 'Track Clear', tone: 'green' },
  '2': { label: 'Yellow Flag', tone: 'yellow' },
  '3': { label: 'Yellow Flag', tone: 'yellow' },
  '4': { label: 'Safety Car', tone: 'sc' },
  '5': { label: 'Red Flag', tone: 'red' },
  '6': { label: 'Virtual Safety Car', tone: 'sc' },
  '7': { label: 'VSC Ending', tone: 'sc' },
};

const TYRE_STYLE: Record<string, { letter: string; color: string }> = {
  SOFT: { letter: 'S', color: '#ef4444' },
  MEDIUM: { letter: 'M', color: '#fbbf24' },
  HARD: { letter: 'H', color: '#e5e7eb' },
  INTERMEDIATE: { letter: 'I', color: '#22c55e' },
  WET: { letter: 'W', color: '#3b82f6' },
  UNKNOWN: { letter: '?', color: '#9ca3af' },
  TEST_UNKNOWN: { letter: 'T', color: '#9ca3af' },
};

// Mini-sector status codes from the feed.
const segmentClass = (status: number): string => {
  if (status === 2051) return 'ob'; // overall best (purple)
  if (status === 2049 || status === 2052) return 'pb'; // personal best (green)
  if (status === 2064) return 'pit'; // in pitlane
  if (status > 0) return 'set'; // completed (yellow)
  return 'off';
};

const timeClass = (t: any): string =>
  t?.OverallFastest ? 'lt-t-ob' : t?.PersonalFastest ? 'lt-t-pb' : '';

/** Parse a lap-time string ("1:33.916" or "33.916") to milliseconds, or null.
 *  Used to find the session's fastest lap when the feed omits the
 *  OverallFastest flags (common during archive replays). */
const lapToMs = (v?: string): number | null => {
  const m = /^(?:(\d+):)?(\d+)\.(\d+)$/.exec((v || '').trim());
  if (!m) return null;
  const min = m[1] ? Number(m[1]) : 0;
  return (min * 60 + Number(m[2])) * 1000 + Number(m[3].padEnd(3, '0').slice(0, 3));
};

// Qualifying gap: the feed keeps one Stats entry per session part (Q1/Q2/Q3);
// show the diff from the latest part the driver actually set a time in.
const qualiGap = (line: any): string => {
  const stats = asArray(line.Stats);
  for (let i = stats.length - 1; i >= 0; i -= 1) {
    if (stats[i]?.TimeDiffToFastest) return stats[i].TimeDiffToFastest;
  }
  return line.TimeDiffToFastest || line.GapToLeader || '—';
};

const fmtClockUtc = (utc: string) => {
  try {
    return new Date(utc).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const fmtDuration = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Session clock — extrapolates the remaining time between feed ticks  */
/* ------------------------------------------------------------------ */

const useSessionClock = (clock: any): string => {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!clock?.Remaining) {
      setDisplay('');
      return;
    }
    const [h = 0, m = 0, s = 0] = String(clock.Remaining).split(':').map(Number);
    const base = h * 3600 + m * 60 + s;
    const anchoredAt = Date.now();
    const tick = () => {
      const remaining = clock.Extrapolating
        ? Math.max(0, base - (Date.now() - anchoredAt) / 1000)
        : base;
      const hh = Math.floor(remaining / 3600);
      const mm = Math.floor((remaining % 3600) / 60);
      const ss = Math.floor(remaining % 60);
      setDisplay(
        `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clock]);

  return display;
};

/* ------------------------------------------------------------------ */
/* Session archive browser                                             */
/* ------------------------------------------------------------------ */

const ARCHIVE_FIRST_YEAR = 2018;
const ARCHIVE_YEARS = Array.from(
  { length: new Date().getFullYear() - ARCHIVE_FIRST_YEAR + 1 },
  (_, i) => new Date().getFullYear() - i,
);

const ArchivePanel: React.FC<{
  onClose: () => void;
  onPick: (path: string, name: string) => void;
  busy: boolean;
}> = ({ onClose, onPick, busy }) => {
  const [year, setYear] = useState(ARCHIVE_YEARS[0]);
  const [index, setIndex] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchArchiveIndex(year)
      .then((data) => {
        if (active) setIndex(data);
      })
      .catch((err) => {
        if (active) {
          setIndex(null);
          setError(err.message || 'Failed to load season archive');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [year]);

  // Latest meeting first; skip meetings with no replayable sessions.
  const meetings = useMemo(
    () =>
      asArray(index?.Meetings)
        .filter((m: any) => asArray(m?.Sessions).some((s: any) => s?.Path))
        .reverse(),
    [index],
  );

  return (
    <div className="lt-archive-overlay" onClick={onClose}>
      <div className="lt-archive" onClick={(e) => e.stopPropagation()}>
        <div className="lt-archive-head">
          <div>
            <h2>Session Archive</h2>
            <p>Replay any recorded session — full timing, telemetry and radio.</p>
          </div>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {ARCHIVE_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="lt-archive-close" onClick={onClose} aria-label="Close archive">×</button>
        </div>

        <div className="lt-archive-body">
          {loading && <div className="lt-archive-note">Loading {year} season…</div>}
          {error && !loading && <div className="lt-archive-note">{error}</div>}
          {!loading && !error && meetings.length === 0 && (
            <div className="lt-archive-note">No recorded sessions for {year} yet.</div>
          )}
          {!loading && !error && meetings.map((m: any) => (
            <div key={m.Key} className="lt-archive-meeting">
              <div className="lt-archive-meeting-info">
                <span className="lt-archive-meeting-name">{m.Name}</span>
                <span className="lt-archive-meeting-loc">
                  {m.Location}{m.Country?.Name ? ` · ${m.Country.Name}` : ''}
                </span>
              </div>
              <div className="lt-archive-sessions">
                {asArray(m.Sessions).filter((s: any) => s?.Path).map((s: any) => (
                  <button
                    key={s.Key}
                    className={`lt-archive-session ${/race/i.test(s.Name) && !/sprint/i.test(s.Name) ? 'lt-archive-session-race' : ''}`}
                    disabled={busy}
                    onClick={() => onPick(s.Path, `${m.Name} — ${s.Name}`)}
                  >
                    {s.Name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Leaderboard row                                                     */
/* ------------------------------------------------------------------ */

const SectorCell: React.FC<{ sector: any }> = ({ sector }) => (
  <div className="lt-sector">
    <span className={`lt-sector-time ${timeClass(sector)}`}>{sector?.Value || '—'}</span>
    <span className="lt-segments">
      {asArray(sector?.Segments).map((seg, i) => (
        <i key={i} className={`lt-seg lt-seg-${segmentClass(seg?.Status ?? 0)}`} />
      ))}
    </span>
  </div>
);

interface RowProps {
  line: any;
  driver: any;
  stints: any[];
  car: any;
  isRace: boolean;
  /** Fastest lap in the session (ms), for highlighting the overall best. */
  sessionBestMs: number | null;
}

const DriverRow: React.FC<RowProps> = ({ line, driver, stints, car, isRace, sessionBestMs }) => {
  const color = driver?.TeamColour ? `#${driver.TeamColour}` : 'var(--racing)';
  const stint = stints.at(-1);
  const tyre = TYRE_STYLE[stint?.Compound || 'UNKNOWN'] || TYRE_STYLE.UNKNOWN;
  const channels = car?.Channels || {};
  const speed = channels['2'];
  const gear = channels['3'];
  const throttle = channels['4'] ?? 0;
  const brake = channels['5'] ?? 0;

  // Highlight the session's overall-fastest lap in violet in the BEST column.
  const bestIsOverallBest =
    sessionBestMs != null && lapToMs(line.BestLapTime?.Value) === sessionBestMs;

  const out = line.Retired || line.Stopped;
  const status = out
    ? 'OUT'
    : line.KnockedOut
      ? 'ELIMINATED'
      : line.InPit
        ? 'IN PIT'
        : line.PitOut
          ? 'PIT OUT'
          : null;

  return (
    <tr className={`lt-row ${out ? 'lt-row-out' : ''} ${line.KnockedOut ? 'lt-row-ko' : ''} ${line.InPit ? 'lt-row-pit' : ''}`}>
      <td className="lt-pos">
        <span className="lt-pos-num">{line.Position || '—'}</span>
      </td>
      <td className="lt-driver">
        <span className="lt-team-bar" style={{ background: color }} />
        <span className="lt-tla" style={{ color }}>{driver?.Tla || line.RacingNumber}</span>
        <span className="lt-flag-slot">
          {status && <span className={`lt-flag-chip lt-chip-${status.replace(' ', '').toLowerCase()}`}>{status}</span>}
        </span>
      </td>
      <td className="lt-int">
        <span className={line.IntervalToPositionAhead?.Catching ? 'lt-catching' : ''}>
          {line.Position === '1' ? '—' : line.IntervalToPositionAhead?.Value || '—'}
        </span>
      </td>
      <td className="lt-gap">
        {line.Position === '1' ? 'LEADER' : isRace ? line.GapToLeader || '—' : qualiGap(line)}
      </td>
      <td className="lt-tyre">
        <span className="lt-tyre-badge" style={{ borderColor: tyre.color, color: tyre.color }}>
          {tyre.letter}
        </span>
        <span className="lt-tyre-age">{stint?.TotalLaps ?? 0}L</span>
      </td>
      <td className="lt-s"><SectorCell sector={asArray(line.Sectors)[0]} /></td>
      <td className="lt-s"><SectorCell sector={asArray(line.Sectors)[1]} /></td>
      <td className="lt-s"><SectorCell sector={asArray(line.Sectors)[2]} /></td>
      <td className={`lt-last ${timeClass(line.LastLapTime)}`}>{line.LastLapTime?.Value || '—'}</td>
      <td className={`lt-best ${bestIsOverallBest ? 'lt-t-ob' : ''}`}>{line.BestLapTime?.Value || '—'}</td>
      <td className="lt-pits">{line.NumberOfPitStops ?? 0}</td>
      <td className="lt-telemetry">
        {speed !== undefined ? (
          <div className="lt-tele">
            <span className="lt-tele-speed">
              {speed}<em>km/h</em>
            </span>
            <span className="lt-tele-gear">{gear ?? '—'}</span>
            <span className="lt-tele-bars">
              <i className="lt-bar lt-bar-throttle" style={{ height: `${Math.min(100, throttle)}%` }} />
              <i className="lt-bar lt-bar-brake" style={{ height: `${Math.min(100, brake)}%` }} />
            </span>
          </div>
        ) : (
          <span className="lt-tele-none">—</span>
        )}
      </td>
    </tr>
  );
};

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */

const DELAY_OPTIONS = [0, 5, 10, 15, 30, 45, 60];

interface LiveTimingProps {
  onBack: () => void;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onOpenSettings: () => void;
}

const REPLAY_SPEEDS = [1, 2, 5, 10, 20, 30];

// Per-column placeholder widths, mirroring the real timing table's columns.
const SKELETON_COLS = [16, 96, 34, 46, 42, 74, 74, 74, 58, 58, 20, 56];

/** Shimmer placeholder shown while a session/replay is still warming up. */
const LiveSkeleton: React.FC = () => (
  <div className="lt-main" aria-hidden="true">
    <div className="lt-board-wrap">
      <table className="lt-board lt-board-skel">
        <thead>
          <tr>
            <th className="lt-pos">P</th>
            <th className="lt-driver-h">Driver</th>
            <th>Int</th>
            <th>Gap</th>
            <th>Tyre</th>
            <th>Sector 1</th>
            <th>Sector 2</th>
            <th>Sector 3</th>
            <th>Last Lap</th>
            <th>Best</th>
            <th>Pit</th>
            <th>Telemetry</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 14 }).map((_, r) => (
            <tr className="lt-row" key={r}>
              {SKELETON_COLS.map((w, c) => (
                <td key={c}>
                  <span className="lt-skel" style={{ width: w }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <aside className="lt-side">
      <div className="lt-panel">
        <div className="lt-panel-head">Race Control</div>
        <div className="lt-rc-feed">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="lt-skel lt-skel-block" />
          ))}
        </div>
      </div>
    </aside>
  </div>
);

const LiveTiming: React.FC<LiveTimingProps> = ({ onBack, user, setUser, onOpenSettings }) => {
  const [delay, setDelay] = useState(0);
  const [customDelay, setCustomDelay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const consoleRef = useRef<HTMLElement | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [replayStarting, setReplayStarting] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { topics, status, streamOpen, simulated, replay, startReplay } =
    useLiveTiming(delay * 1000);
  const inReplay = !!replay;
  // The recording includes a long pre-session lead-in that we auto-skip; anchor
  // the transport bar at that trim point so it reflects the session's own time.
  const trimMs = replay?.startOffsetMs ?? 0;

  useEffect(() => {
    // Reveal once the masthead title has passed under the sticky header —
    // the /live masthead is much shorter than the race details hero.
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      consoleRef.current?.requestFullscreen();
    }
  };

  const pickArchiveSession = async (path: string, name: string) => {
    setReplayStarting(true);
    try {
      await startReplay(path, name, 1);
      setArchiveOpen(false);
    } catch (err) {
      console.error('Failed to start replay:', err);
    } finally {
      setReplayStarting(false);
    }
  };

  const commitScrub = () => {
    if (scrub !== null) {
      replayControl('seek', { offsetMs: scrub });
      setScrub(null);
    }
  };

  const timing = topics.TimingData;
  const drivers: Record<string, any> = topics.DriverList || {};
  const appData = topics.TimingAppData;
  const carEntries = asArray(topics.CarData?.Entries).at(-1)?.Cars || {};

  const rows = useMemo(() => {
    const lines = timing?.Lines || {};
    return Object.entries<any>(lines)
      .map(([num, line]) => ({ num, line }))
      .sort((a, b) => {
        const pa = parseInt(a.line.Position, 10) || a.line.Line || 99;
        const pb = parseInt(b.line.Position, 10) || b.line.Line || 99;
        return pa - pb;
      });
  }, [timing]);

  // Fastest best-lap across the field — used to paint the overall best violet.
  const sessionBestMs = useMemo(() => {
    let best: number | null = null;
    for (const { line } of rows) {
      const ms = lapToMs(line.BestLapTime?.Value);
      if (ms != null && (best == null || ms < best)) best = ms;
    }
    return best;
  }, [rows]);

  const raceControl = useMemo(
    () => asArray(topics.RaceControlMessages?.Messages).slice(-30).reverse(),
    [topics.RaceControlMessages],
  );

  const radioCaptures = useMemo(
    () => asArray(topics.TeamRadio?.Captures).slice(-12).reverse(),
    [topics.TeamRadio],
  );

  const hasSession = rows.length > 0;

  // Outside a live session the F1 feed keeps serving the *last completed*
  // session's final standings — its `ArchiveStatus` flips to 'Complete' once a
  // session ends. Treat only a running (non-archived) session — or the demo /
  // an archive replay — as active, so we don't present a finished race as live.
  const rawSession = topics.SessionInfo;
  const sessionArchived = rawSession?.ArchiveStatus?.Status === 'Complete';
  const realActive = hasSession && !sessionArchived;
  const sessionActive = simulated || inReplay || realActive;
  const showBoard = hasSession && sessionActive;

  // A freshly-started session (or replay) streams for a moment before any real
  // timing lands — cars sit in the pit with empty laps/sectors. Treat that as a
  // loading state and show a shimmer skeleton instead of a wall of dashes.
  const boardHasData = useMemo(
    () =>
      rows.some(
        ({ line }) =>
          line.LastLapTime?.Value ||
          line.BestLapTime?.Value ||
          asArray(line.Sectors).some((s: any) => s?.Value),
      ),
    [rows],
  );
  const warmingUp = sessionActive && (!hasSession || !boardHasData || (inReplay && replay.loading));

  // Null out session-derived data when nothing is active so the masthead falls
  // back to its neutral "waiting for session" state instead of the stale race.
  const session = sessionActive ? rawSession : null;
  const weather = sessionActive ? topics.WeatherData : null;
  const trackStatus = sessionActive ? (TRACK_STATUS[topics.TrackStatus?.Status] || null) : null;
  const lapCount = sessionActive ? topics.LapCount : null;
  const clock = useSessionClock(sessionActive ? topics.ExtrapolatedClock : null);

  const isRace = session?.Type === 'Race';
  const isQuali = session?.Type === 'Qualifying';
  const sessionPart = timing?.SessionPart;

  const live = streamOpen && status === 'connected' && realActive;

  // Quali knockout cutoff: a divider under P15 in Q1 and P10 in Q2.
  const cutoffAfter = isQuali ? (sessionPart === 1 ? 15 : sessionPart === 2 ? 10 : null) : null;

  return (
    <div className="lt-page">
      <div className="lt-header-shell">
        <SiteHeader
          user={user}
          setUser={setUser}
          onOpenSettings={onOpenSettings}
          onHomeNavigate={() => onBack()}
          leftSlot={
            <div className="rd-header-left">
              <button className="rd-back-btn" onClick={onBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Back
              </button>
              <div className={`rd-header-race ${scrolled && session ? 'visible' : ''}`} aria-hidden={!(scrolled && session)}>
                <span className="rd-header-race-round">
                  {inReplay ? 'REPLAY' : isQuali && sessionPart ? `Q${sessionPart}` : session?.Name || 'LIVE'}
                </span>
                <span className="rd-header-race-name">{session?.Meeting?.Name || 'Live Timing'}</span>
              </div>
            </div>
          }
        />
      </div>

      <section className="lt-console" ref={consoleRef}>
        {/* ---------- status masthead ---------- */}
        <header className="lt-masthead">
          <div className="lt-mast-left">
            <div className="lt-live-row">
              <span className={`lt-live-pill ${live ? 'on' : ''} ${simulated || inReplay ? 'demo' : ''}`}>
                <i />
                {inReplay
                  ? replay.loading ? 'Loading Replay' : 'Replay'
                  : simulated ? 'Demo Session' : live ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
              {isQuali && sessionPart ? <span className="lt-part-badge">Q{sessionPart}</span> : null}
              {session?.Name && !isQuali && <span className="lt-part-badge lt-part-neutral">{session.Name}</span>}
            </div>
            <h1 className="lt-title">{session?.Meeting?.Name || 'Live Timing'}</h1>
            <div className="lt-subtitle">
              {session?.Meeting?.Circuit?.ShortName ? `${session.Meeting.Circuit.ShortName} · ` : ''}
              {session?.Meeting?.Country?.Name || 'Waiting for session information'}
            </div>
          </div>

          <div className="lt-mast-center">
            {trackStatus && (
              <div className={`lt-track-status lt-ts-${trackStatus.tone}`}>
                <span className="lt-ts-beacon" />
                {trackStatus.label}
              </div>
            )}
          </div>

          <div className="lt-mast-right">
            {isRace && lapCount?.CurrentLap ? (
              <div className="lt-clock">
                <span className="lt-clock-label">Lap</span>
                <span className="lt-clock-value">
                  {lapCount.CurrentLap}<em>/ {lapCount.TotalLaps}</em>
                </span>
              </div>
            ) : clock ? (
              <div className="lt-clock">
                <span className="lt-clock-label">Remaining</span>
                <span className="lt-clock-value lt-clock-mono">{clock}</span>
              </div>
            ) : null}

            <div className="lt-controls">
              {!inReplay && (
                <label className="lt-delay">
                  <span>Broadcast sync</span>
                  <select
                    value={customDelay ? 'custom' : delay}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setCustomDelay(true);
                      } else {
                        setCustomDelay(false);
                        setDelay(Number(e.target.value));
                      }
                    }}
                  >
                    {DELAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d === 0 ? 'Real time' : `+${d}s`}</option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                  {customDelay && (
                    <input
                      type="number"
                      className="lt-delay-custom"
                      min={0}
                      max={600}
                      step={1}
                      placeholder="Seconds"
                      value={delay === 0 ? '' : delay}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const clamped = Number.isFinite(raw) ? Math.min(600, Math.max(0, raw)) : 0;
                        setDelay(clamped);
                      }}
                    />
                  )}
                </label>
              )}
              <button className="lt-demo-btn" onClick={() => setArchiveOpen(true)}>
                Archive
              </button>
              <button
                className="lt-demo-btn lt-fullscreen-btn"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ---------- replay transport ---------- */}
        {inReplay && !replay.loading && (
          <div className="lt-transport">
            <button
              className="lt-transport-btn"
              onClick={() => replayControl(replay.paused ? 'resume' : 'pause')}
              aria-label={replay.paused ? 'Resume replay' : 'Pause replay'}
            >
              {replay.paused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              )}
            </button>
            <select
              className="lt-transport-speed"
              value={replay.speed}
              onChange={(e) => replayControl('speed', { speed: Number(e.target.value) })}
              aria-label="Replay speed"
            >
              {REPLAY_SPEEDS.map((s) => (
                <option key={s} value={s}>{s}×</option>
              ))}
            </select>
            <span className="lt-transport-time">{fmtDuration((scrub ?? replay.offsetMs) - trimMs)}</span>
            <input
              className="lt-transport-scrub"
              type="range"
              min={trimMs}
              max={replay.durationMs || 1}
              value={scrub ?? replay.offsetMs}
              onChange={(e) => setScrub(Number(e.target.value))}
              onPointerUp={commitScrub}
              onKeyUp={commitScrub}
              aria-label="Replay position"
            />
            <span className="lt-transport-time">{fmtDuration(replay.durationMs - trimMs)}</span>
            <span className="lt-transport-name">{replay.name}</span>
            <button className="lt-transport-exit" onClick={() => replayControl('stop')}>
              Exit Replay
            </button>
          </div>
        )}
        {inReplay && replay.loading && (
          <div className="lt-transport lt-transport-loading">
            Downloading session recording — {replay.name || 'archived session'}…
          </div>
        )}

        {/* ---------- weather strip ---------- */}
        {weather && (
          <div className="lt-weather">
            <span className="lt-wx"><em>Air</em>{weather.AirTemp}°C</span>
            <span className="lt-wx"><em>Track</em>{weather.TrackTemp}°C</span>
            <span className="lt-wx"><em>Humidity</em>{weather.Humidity}%</span>
            <span className="lt-wx"><em>Wind</em>{weather.WindSpeed} m/s</span>
            <span className="lt-wx"><em>Pressure</em>{weather.Pressure} mbar</span>
            <span className={`lt-wx ${Number(weather.Rainfall) > 0 ? 'lt-wx-rain' : ''}`}>
              <em>Rain</em>{Number(weather.Rainfall) > 0 ? 'Yes' : 'Dry'}
            </span>
          </div>
        )}

        {warmingUp ? (
          <LiveSkeleton />
        ) : !showBoard ? (
          <div className="lt-empty">
            <div className="lt-empty-flag">🏁</div>
            <h2>No live session right now</h2>
            <p>
              Timing goes live when cars are on track during a Grand Prix weekend —
              practice, qualifying, sprint and race. Meanwhile, dive into the archive
              and replay any session since 2018.
            </p>
            <div className="lt-empty-actions">
              <button className="lt-demo-btn lt-demo-cta" onClick={() => setArchiveOpen(true)}>
                Watch a Past Race
              </button>
            </div>
          </div>
        ) : (
          <div className="lt-main">
            {/* ---------- timing tower ---------- */}
            <div className="lt-board-wrap">
              <table className="lt-board">
                <thead>
                  <tr>
                    <th className="lt-pos">P</th>
                    <th className="lt-driver-h">Driver</th>
                    <th>Int</th>
                    <th>Gap</th>
                    <th>Tyre</th>
                    <th>Sector 1</th>
                    <th>Sector 2</th>
                    <th>Sector 3</th>
                    <th>Last Lap</th>
                    <th>Best</th>
                    <th>Pit</th>
                    <th>Telemetry</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ num, line }, idx) => (
                    <React.Fragment key={num}>
                      <DriverRow
                        line={line}
                        driver={drivers[num]}
                        stints={asArray(appData?.Lines?.[num]?.Stints)}
                        car={carEntries[num]}
                        isRace={isRace}
                        sessionBestMs={sessionBestMs}
                      />
                      {cutoffAfter === idx + 1 && (
                        <tr className="lt-cutoff" aria-hidden="true">
                          <td colSpan={12}><span>Elimination zone {timing?.CutOffTime ? `· cutoff ${timing.CutOffTime}` : ''}</span></td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---------- side column ---------- */}
            <aside className="lt-side">
              <div className="lt-panel">
                <div className="lt-panel-head">Race Control</div>
                <div className="lt-rc-feed">
                  {raceControl.length === 0 && <div className="lt-rc-empty">No messages yet.</div>}
                  {raceControl.map((m: any, i: number) => (
                    <div key={`${m?.Utc}-${i}`} className={`lt-rc-msg lt-rc-${(m?.Flag || m?.Category || '').toString().replace(/\s+/g, '-').toLowerCase()}`}>
                      <div className="lt-rc-meta">
                        <span>{m?.Utc ? fmtClockUtc(m.Utc) : ''}</span>
                        {m?.Lap ? <span>Lap {m.Lap}</span> : null}
                      </div>
                      <div className="lt-rc-text">{m?.Message}</div>
                    </div>
                  ))}
                </div>
              </div>

              {radioCaptures.length > 0 && session?.Path && (
                <div className="lt-panel">
                  <div className="lt-panel-head">Team Radio</div>
                  <div className="lt-radio-feed">
                    {radioCaptures.map((c: any, i: number) => {
                      const d = drivers[c?.RacingNumber];
                      return (
                        <div key={`${c?.Utc}-${i}`} className="lt-radio-item">
                          <span className="lt-radio-tla" style={{ color: d?.TeamColour ? `#${d.TeamColour}` : undefined }}>
                            {d?.Tla || c?.RacingNumber}
                          </span>
                          <span className="lt-radio-time">{c?.Utc ? fmtClockUtc(c.Utc) : ''}</span>
                          <audio controls preload="none" src={`${F1_STATIC_BASE}${session.Path}${c?.Path}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {archiveOpen && (
          <ArchivePanel
            onClose={() => setArchiveOpen(false)}
            onPick={pickArchiveSession}
            busy={replayStarting}
          />
        )}

        <footer className="lt-footnote">
          Timing data courtesy of the Formula 1 live timing feed · Pitwall is an unofficial fan project
          {delay > 0 && <span className="lt-footnote-delay"> · displaying with +{delay}s broadcast sync</span>}
        </footer>
      </section>
    </div>
  );
};

export default LiveTiming;
