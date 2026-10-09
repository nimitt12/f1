import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, fetchRaces, raceSlug, type Race } from '../data/races';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface SessionResult {
  position?: string;
  points?: string;
  code?: string;
  driver_number?: string;
  given_name?: string;
  family_name?: string;
  team_name?: string;
  constructor_name?: string;
}

interface Winner {
  name: string;
  fullName: string;
  team: string;
}

interface RaceWinners {
  qualifying?: Winner;
  race?: Winner;
  sprintQualifying?: Winner;
  sprint?: Winner;
}

type SessionKey = keyof RaceWinners;
type RoundSessions = Partial<Record<SessionKey, SessionResult[]>>;
type RaceFilter = 'all' | 'race' | 'sprint';
type QualifyingFilter = 'all' | 'qualifying' | 'sprintQualifying';
type MatrixMetric = 'points' | 'position';

interface ResultsPageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onRaceSelect: (race: Race) => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

const ENDPOINTS = {
  qualifying: 'get-all-qualifying-results',
  race: 'get-all-results',
  sprintQualifying: 'get-all-sprint-qualifying-results',
  sprint: 'get-all-sprint-results',
} as const;

const raceStart = (race: Race) => new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime();

const sessionHasFinished = (session?: { date: string; time?: string }, hours = 1.5) => {
  if (!session) return false;
  const start = new Date(`${session.date}T${session.time || '12:00:00Z'}`).getTime();
  return Date.now() > start + hours * 60 * 60 * 1000;
};

const winnerFrom = (data: unknown): Winner | undefined => {
  if (!Array.isArray(data) || data.length === 0) return undefined;
  const rows = data as SessionResult[];
  const result = rows.find((row) => Number(row.position) === 1) || rows[0];
  const familyName = result.family_name?.trim();
  const givenName = result.given_name?.trim();
  if (!familyName && !givenName) return undefined;
  return {
    name: familyName || givenName || 'Winner',
    fullName: [givenName, familyName].filter(Boolean).join(' '),
    team: result.team_name || result.constructor_name || 'Formula 1',
  };
};

const teamKey = (team: string) => {
  const value = team.toLowerCase();
  if (value.includes('mercedes')) return 'mercedes';
  if (value.includes('ferrari')) return 'ferrari';
  if (value.includes('mclaren')) return 'mclaren';
  if (value.includes('red bull')) return 'redbull';
  if (value.includes('williams')) return 'williams';
  if (value.includes('aston')) return 'aston';
  if (value.includes('alpine')) return 'alpine';
  if (value.includes('haas')) return 'haas';
  if (value.includes('audi')) return 'audi';
  if (value.includes('cadillac')) return 'cadillac';
  if (value.includes('racing bulls') || value === 'rb') return 'racingbulls';
  if (value.includes('sauber')) return 'sauber';
  return 'racing';
};

const teamCode = (team: string) => {
  const key = teamKey(team);
  const codes: Record<string, string> = {
    mercedes: 'M', ferrari: 'F', mclaren: 'M', redbull: 'R', williams: 'W',
    aston: 'A', alpine: 'A', haas: 'H', audi: 'A', cadillac: 'C',
    racingbulls: 'RB', sauber: 'S', racing: 'F1',
  };
  return codes[key];
};

const raceLabel = (race: Race) => {
  const labels: Record<string, string> = {
    Australian: 'Australia', Chinese: 'China', Japanese: 'Japan', Canadian: 'Canada',
    Austrian: 'Austria', British: 'Great Britain', Belgian: 'Belgium', Hungarian: 'Hungary',
    Dutch: 'Netherlands', Italian: 'Italy', Spanish: 'Spain', Brazilian: 'Brazil',
  };
  const base = race.raceName.replace(/ Grand Prix$/i, '');
  return labels[base] || base;
};

const weekendDate = (race: Race) => {
  const start = race.FirstPractice || race.SprintQualifying || { date: race.date };
  return new Date(`${start.date}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', timeZone: 'UTC',
  });
};

const WinnerCell: React.FC<{ winner?: Winner; loading: boolean; unavailable?: boolean }> = ({ winner, loading, unavailable }) => {
  if (loading) return <div className="results-cell-loading" aria-label="Loading result"><span /></div>;
  if (!winner) return <span className={`results-empty ${unavailable ? 'not-applicable' : ''}`}>—</span>;
  const key = teamKey(winner.team);
  return (
    <div className={`results-winner team-${key}`} title={`${winner.fullName} · ${winner.team}`}>
      <span className="results-team-mark" aria-hidden="true">{teamCode(winner.team)}</span>
      <span className="results-winner-name">{winner.name}</span>
      <span className="results-team-name">{winner.team}</span>
    </div>
  );
};

const driverId = (result: SessionResult) =>
  `${result.given_name || ''}|${result.family_name || ''}`.toLowerCase();

const matrixCellClass = (value: number, metric: MatrixMetric) => {
  if (metric === 'position') {
    if (value === 1) return 'elite';
    if (value === 2) return 'silver';
    if (value === 3) return 'bronze';
    if (value <= 5) return 'strong';
    if (value <= 10) return 'mid';
    return 'low';
  }
  if (value >= 25) return 'elite';
  if (value >= 15) return 'strong';
  if (value >= 10) return 'mid';
  if (value >= 4) return 'low';
  if (value > 0) return 'trace';
  return 'zero';
};

const SegmentedControl = <T extends string>({
  value, options, onChange, label,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label: string;
}) => (
  <div className="matrix-filter">
    <span>{label}</span>
    <div className="matrix-segments">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'active' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const StatDriverIdentity: React.FC<{
  driver?: { name: string; fullName: string; team: string };
}> = ({ driver }) => driver ? (
  <div className="season-stat-driver" title={`${driver.fullName} · ${driver.team}`}>
    <span className={`season-stat-team team-${teamKey(driver.team)}`}>{teamCode(driver.team)}</span>
    <div><strong>{driver.name}</strong><small>{driver.team}</small></div>
  </div>
) : <span className="season-stat-awaiting">Awaiting data</span>;

const SeasonStatCards: React.FC<{
  races: Race[];
  sessions: Record<string, RoundSessions>;
  loading: boolean;
}> = ({ races, sessions, loading }) => {
  const stats = useMemo(() => {
    type DriverStat = { id: string; name: string; fullName: string; team: string; points: number; wins: number; poles: number; sprintWins: number };
    const drivers = new Map<string, DriverStat>();
    const ensureDriver = (result: SessionResult) => {
      const id = driverId(result);
      if (!drivers.has(id)) {
        drivers.set(id, {
          id,
          name: result.family_name || result.given_name || 'Driver',
          fullName: [result.given_name, result.family_name].filter(Boolean).join(' '),
          team: result.team_name || result.constructor_name || 'Formula 1',
          points: 0,
          wins: 0,
          poles: 0,
          sprintWins: 0,
        });
      }
      const driver = drivers.get(id)!;
      driver.team = result.team_name || result.constructor_name || driver.team;
      return driver;
    };

    Object.values(sessions).forEach((round) => {
      round.race?.forEach((result) => {
        const driver = ensureDriver(result);
        driver.points += Number(result.points) || 0;
        if (Number(result.position) === 1) driver.wins += 1;
      });
      round.sprint?.forEach((result) => {
        const driver = ensureDriver(result);
        driver.points += Number(result.points) || 0;
        if (Number(result.position) === 1) driver.sprintWins += 1;
      });
      round.qualifying?.forEach((result) => {
        const driver = ensureDriver(result);
        if (Number(result.position) === 1) driver.poles += 1;
      });
    });

    const all = Array.from(drivers.values());
    const leaderBoard = [...all].sort((a, b) => b.points - a.points);
    const topBy = (key: 'wins' | 'poles' | 'sprintWins') => {
      const candidate = [...all].sort((a, b) => b[key] - a[key] || b.points - a.points)[0];
      return candidate && candidate[key] > 0 ? candidate : undefined;
    };
    const completed = Object.values(sessions).filter((round) => (round.race?.length || 0) > 0).length;
    return {
      leader: leaderBoard[0],
      lead: Math.max(0, (leaderBoard[0]?.points || 0) - (leaderBoard[1]?.points || 0)),
      winsLeader: topBy('wins'),
      polesLeader: topBy('poles'),
      sprintLeader: topBy('sprintWins'),
      completed,
      progress: races.length ? Math.round((completed / races.length) * 100) : 0,
    };
  }, [races, sessions]);

  if (loading && !stats.leader) {
    return (
      <section className="season-stats-grid" aria-label="Loading season insights">
        {Array.from({ length: 5 }).map((_, index) => <div className="season-stat-card season-stat-skeleton" key={index}><span /><i /><b /></div>)}
      </section>
    );
  }

  return (
    <section className="season-stats-section" aria-labelledby="season-insights-title">
      <div className="season-stats-heading">
        <div><span className="results-board-index">Live championship pulse</span><h2 id="season-insights-title">Season at a glance</h2></div>
        <span>Updated from official classifications</span>
      </div>
      <div className="season-stats-grid">
        <article className={`season-stat-card leader team-${teamKey(stats.leader?.team || '')}`}>
          <span className="season-stat-label">Championship leader</span>
          <StatDriverIdentity driver={stats.leader} />
          <div className="season-stat-figure"><strong>{stats.leader?.points ?? '—'}</strong><span>PTS</span></div>
          <p>{stats.leader ? stats.lead > 0 ? `+${stats.lead} points clear` : 'Championship tied' : 'No classification yet'}</p>
        </article>
        <article className={`season-stat-card wins team-${teamKey(stats.winsLeader?.team || '')}`}>
          <span className="season-stat-label">Most race wins</span>
          <StatDriverIdentity driver={stats.winsLeader} />
          <div className="season-stat-figure"><strong>{stats.winsLeader?.wins ?? '—'}</strong><span>WINS</span></div>
          <p>Sunday conversion</p>
        </article>
        <article className={`season-stat-card poles team-${teamKey(stats.polesLeader?.team || '')}`}>
          <span className="season-stat-label">Qualifying benchmark</span>
          <StatDriverIdentity driver={stats.polesLeader} />
          <div className="season-stat-figure"><strong>{stats.polesLeader?.poles ?? '—'}</strong><span>POLES</span></div>
          <p>Fastest over one lap</p>
        </article>
        <article className={`season-stat-card sprint team-${teamKey(stats.sprintLeader?.team || '')}`}>
          <span className="season-stat-label">Sprint specialist</span>
          <StatDriverIdentity driver={stats.sprintLeader} />
          <div className="season-stat-figure"><strong>{stats.sprintLeader?.sprintWins ?? '—'}</strong><span>WINS</span></div>
          <p>Saturday attack</p>
        </article>
        <article className="season-stat-card progress">
          <span className="season-stat-label">Season progress</span>
          <div className="season-progress-orbit"><strong>{stats.progress}</strong><span>%</span></div>
          <div className="season-stat-progress"><span style={{ width: `${stats.progress}%` }} /></div>
          <p><b>{stats.completed}</b> of {races.length || '—'} rounds classified</p>
        </article>
      </div>
    </section>
  );
};

const DriverRoundMatrix: React.FC<{
  races: Race[];
  sessions: Record<string, RoundSessions>;
  loading: boolean;
}> = ({ races, sessions, loading }) => {
  const [raceFilter, setRaceFilter] = useState<RaceFilter>('all');
  const [qualifyingFilter, setQualifyingFilter] = useState<QualifyingFilter>('all');
  const [metric, setMetric] = useState<MatrixMetric>('points');

  const drivers = useMemo(() => {
    const driverMap = new Map<string, { id: string; name: string; fullName: string; code: string; team: string }>();
    Object.values(sessions).forEach((round) => {
      Object.values(round).forEach((results) => {
        results?.forEach((result) => {
          const id = driverId(result);
          if (id === '|') return;
          driverMap.set(id, {
            id,
            name: result.family_name || result.given_name || 'Driver',
            fullName: [result.given_name, result.family_name].filter(Boolean).join(' '),
            code: result.code || result.family_name?.slice(0, 3).toUpperCase() || 'DRV',
            team: result.team_name || result.constructor_name || 'Formula 1',
          });
        });
      });
    });

    const pointsForRound = (round: RoundSessions, id: string) => {
      const keys: SessionKey[] = raceFilter === 'race' ? ['race'] : raceFilter === 'sprint' ? ['sprint'] : ['race', 'sprint'];
      return keys.reduce((total, key) => {
        const result = round[key]?.find((row) => driverId(row) === id);
        return total + (Number(result?.points) || 0);
      }, 0);
    };

    const positionForRound = (round: RoundSessions, id: string) => {
      const key: SessionKey = qualifyingFilter === 'qualifying'
        ? 'qualifying'
        : qualifyingFilter === 'sprintQualifying'
          ? 'sprintQualifying'
          : raceFilter === 'sprint'
            ? 'sprint'
            : 'race';
      const result = round[key]?.find((row) => driverId(row) === id);
      return result ? Number(result.position) || undefined : undefined;
    };

    return Array.from(driverMap.values())
      .map((driver) => {
        const roundValues = races.map((race) => {
          const round = sessions[race.round] || {};
          if (metric === 'position') return positionForRound(round, driver.id);
          const keys: SessionKey[] = raceFilter === 'race' ? ['race'] : raceFilter === 'sprint' ? ['sprint'] : ['race', 'sprint'];
          const participated = keys.some((key) => round[key]?.some((row) => driverId(row) === driver.id));
          return participated ? pointsForRound(round, driver.id) : undefined;
        });
        const total = races.reduce((sum, race) => sum + pointsForRound(sessions[race.round] || {}, driver.id), 0);
        return { ...driver, roundValues, total };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [metric, qualifyingFilter, raceFilter, races, sessions]);

  const exportCsv = () => {
    const header = ['Position', 'Driver', 'Team', 'Points', ...races.map((race) => `R${race.round}`)];
    const lines = drivers.map((driver, index) => [
      index + 1,
      driver.fullName,
      driver.team,
      driver.total,
      ...driver.roundValues.map((value) => value ?? ''),
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pitwall-${races[0]?.season || 'season'}-${metric}-by-round.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="driver-matrix" aria-labelledby="driver-matrix-title">
      <header className="driver-matrix-head">
        <div>
          <span className="results-board-index">02 / Season progression</span>
          <h2 id="driver-matrix-title">Driver points and positions <em>by round</em></h2>
        </div>
        <div className="driver-matrix-controls">
          <SegmentedControl<RaceFilter>
            label="Races"
            value={raceFilter}
            onChange={setRaceFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'race', label: 'Grand Prix' }, { value: 'sprint', label: 'Sprint' }]}
          />
          <SegmentedControl<QualifyingFilter>
            label="Quali"
            value={qualifyingFilter}
            onChange={(value) => { setQualifyingFilter(value); setMetric('position'); }}
            options={[{ value: 'all', label: 'Race result' }, { value: 'qualifying', label: 'Quali' }, { value: 'sprintQualifying', label: 'Sprint qualifying' }]}
          />
          <SegmentedControl<MatrixMetric>
            label="Display"
            value={metric}
            onChange={(value) => { setMetric(value); if (value === 'points') setQualifyingFilter('all'); }}
            options={[{ value: 'points', label: 'Points' }, { value: 'position', label: 'Position' }]}
          />
          <button type="button" className="matrix-download" onClick={exportCsv} disabled={!drivers.length} aria-label="Download matrix as CSV" title="Download CSV">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/></svg>
          </button>
        </div>
      </header>

      <div className="driver-matrix-caption">
        <span><i className="matrix-legend-best" /> Best performance</span>
        <span><i className="matrix-legend-points" /> Points finish</span>
        <span><i className="matrix-legend-zero" /> No points</span>
        <p>{metric === 'points' ? 'Points earned in the selected race sessions' : qualifyingFilter === 'all' ? 'Finishing position in the selected race session' : 'Starting position from the selected qualifying session'}</p>
      </div>

      <div className="driver-matrix-scroll">
        <table className="driver-matrix-table">
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Driver</th>
              <th>Points</th>
              {races.map((race) => <th key={race.round} title={race.raceName}>R{race.round}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading && drivers.length === 0 ? Array.from({ length: 10 }).map((_, index) => (
              <tr className="matrix-skeleton" key={index} aria-hidden="true"><td /><td><span /></td><td><span /></td>{races.map((race) => <td key={race.round}><span /></td>)}</tr>
            )) : drivers.map((driver, index) => (
              <tr key={driver.id}>
                <td className="matrix-rank">{index + 1}</td>
                <td className="matrix-driver">
                  <span className={`matrix-team-mark team-${teamKey(driver.team)}`}>{teamCode(driver.team)}</span>
                  <span><strong>{driver.name}</strong><small>{driver.team}</small></span>
                </td>
                <td className="matrix-total">{driver.total}</td>
                {driver.roundValues.map((value, roundIndex) => (
                  <td key={races[roundIndex]?.round || roundIndex} className="matrix-value-cell">
                    {value == null ? <span className="matrix-no-result">—</span> : <span className={`matrix-value ${matrixCellClass(value, metric)}`}>{value}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="results-mobile-hint matrix-mobile-hint"><span>←</span> Swipe across championship rounds <span>→</span></div>
    </section>
  );
};

const ResultsPage: React.FC<ResultsPageProps> = ({
  user, setUser, onBack, onRaceSelect, onOpenSettings, onHomeNavigate,
}) => {
  const [races, setRaces] = useState<Race[]>([]);
  const [winners, setWinners] = useState<Record<string, RaceWinners>>({});
  const [sessionResults, setSessionResults] = useState<Record<string, RoundSessions>>({});
  const [loading, setLoading] = useState(true);
  const [loadingRounds, setLoadingRounds] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState(false);
  const [now] = useState(() => Date.now());

  const loadResults = useCallback(async (raceList: Race[], signal?: AbortSignal) => {
    const eligible = raceList.filter((race) =>
      sessionHasFinished({ date: race.date, time: race.time }, 2.75)
      || sessionHasFinished(race.Qualifying)
      || sessionHasFinished(race.Sprint)
      || sessionHasFinished(race.SprintQualifying),
    );
    setLoadingRounds(new Set(eligible.map((race) => race.round)));
    setLoadError(false);

    let failures = 0;
    await Promise.all(eligible.map(async (race) => {
      const requests: Array<Promise<[SessionKey, SessionResult[]]>> = [];
      const request = async (key: SessionKey, endpoint: string) => {
        try {
          const response = await fetch(`${BACKEND_URL}/results/${endpoint}/${race.season}/${race.round}`, { signal });
          if (!response.ok) {
            failures += 1;
            return [key, []] as [SessionKey, SessionResult[]];
          }
          const data = await response.json();
          return [key, Array.isArray(data) ? data : []] as [SessionKey, SessionResult[]];
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) failures += 1;
          return [key, []] as [SessionKey, SessionResult[]];
        }
      };

      if (sessionHasFinished(race.Qualifying)) requests.push(request('qualifying', ENDPOINTS.qualifying));
      if (sessionHasFinished({ date: race.date, time: race.time }, 2.75)) requests.push(request('race', ENDPOINTS.race));
      if (race.SprintQualifying && sessionHasFinished(race.SprintQualifying)) {
        requests.push(request('sprintQualifying', ENDPOINTS.sprintQualifying));
      }
      if (race.Sprint && sessionHasFinished(race.Sprint)) requests.push(request('sprint', ENDPOINTS.sprint));

      const settled = await Promise.all(requests);
      if (signal?.aborted) return;
      const roundSessions = Object.fromEntries(settled) as RoundSessions;
      setSessionResults((current) => ({ ...current, [race.round]: roundSessions }));
      setWinners((current) => ({
        ...current,
        [race.round]: Object.fromEntries(settled.map(([key, rows]) => [key, winnerFrom(rows)])),
      }));
      setLoadingRounds((current) => {
        const next = new Set(current);
        next.delete(race.round);
        return next;
      });
    }));
    if (!signal?.aborted) setLoadError(failures > 0);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchRaces()
      .then((data) => {
        if (controller.signal.aborted) return;
        setRaces(data);
        return loadResults(data, controller.signal);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadResults]);

  const completed = useMemo(
    () => races.filter((race) => now > raceStart(race) + 2.75 * 60 * 60 * 1000).length,
    [races, now],
  );
  const season = races[0]?.season || new Date(now).getFullYear().toString();

  const openRace = (race: Race) => onRaceSelect(race);

  return (
    <div className="results-page">
      <div className="results-page-header">
        <SiteHeader
          user={user}
          setUser={setUser}
          onOpenSettings={onOpenSettings}
          onHomeNavigate={onHomeNavigate}
          leftSlot={
            <button className="rd-back-btn results-back" onClick={onBack}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              Dashboard
            </button>
          }
        />
      </div>

      <main className="results-main">
        <section className="results-hero">
          <div className="results-hero-copy">
            <div className="results-kicker"><span /> Season intelligence · {season}</div>
            <h1>Grand Prix <em>Results</em></h1>
            <p>Every pole sitter and winner across the championship, from sprint shootout to Sunday’s chequered flag.</p>
          </div>
          <div className="results-summary" aria-label={`${season} results summary`}>
            <div><strong>{String(completed).padStart(2, '0')}</strong><span>Rounds complete</span></div>
            <i />
            <div><strong>{String(races.length).padStart(2, '0')}</strong><span>Season total</span></div>
          </div>
        </section>

        <SeasonStatCards races={races} sessions={sessionResults} loading={loading || loadingRounds.size > 0} />

        <section className="results-board" aria-labelledby="results-board-title">
          <header className="results-board-head">
            <div>
              <span className="results-board-index">01 / Classification</span>
              <h2 id="results-board-title">Grand Prix Results</h2>
            </div>
            <div className="results-board-tools">
              {loadError && (
                <button onClick={() => loadResults(races)} className="results-retry">Retry missing data</button>
              )}
              <span className="results-live-key"><i /> Official session data</span>
            </div>
          </header>

          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Grand Prix</th>
                  <th>Date</th>
                  <th>Sprint pole</th>
                  <th>Sprint winner</th>
                  <th>Pole position</th>
                  <th>Race winner</th>
                  <th><span className="sr-only">Open race</span></th>
                </tr>
              </thead>
              <tbody>
                {loading && races.length === 0 ? (
                  Array.from({ length: 8 }).map((_, index) => (
                    <tr className="results-row-skeleton" key={index} aria-hidden="true">
                      <td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td><span /></td><td />
                    </tr>
                  ))
                ) : races.map((race) => {
                  const raceWinners = winners[race.round] || {};
                  const code = COUNTRY_FLAGS[race.Circuit.Location.country.trim()];
                  const rowLoading = loadingRounds.has(race.round);
                  const isFuture = now < raceStart(race);
                  return (
                    <tr
                      key={`${race.season}-${race.round}`}
                      className={isFuture ? 'is-upcoming' : ''}
                      onClick={() => openRace(race)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openRace(race);
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`Open ${race.raceName}`}
                    >
                      <td className="results-round">R{String(race.round).padStart(2, '0')}</td>
                      <td className="results-race-cell">
                        {code ? <img src={`https://flagcdn.com/w40/${code}.png`} width="28" height="19" loading="lazy" alt="" /> : <span>🏁</span>}
                        <div><strong>{raceLabel(race)}</strong><small>{race.Circuit.Location.locality}</small></div>
                      </td>
                      <td className="results-date">{weekendDate(race)}</td>
                      <td><WinnerCell winner={raceWinners.sprintQualifying} loading={rowLoading && !!race.SprintQualifying} unavailable={!race.SprintQualifying} /></td>
                      <td><WinnerCell winner={raceWinners.sprint} loading={rowLoading && !!race.Sprint} unavailable={!race.Sprint} /></td>
                      <td><WinnerCell winner={raceWinners.qualifying} loading={rowLoading} /></td>
                      <td><WinnerCell winner={raceWinners.race} loading={rowLoading} /></td>
                      <td className="results-row-arrow">
                        <a href={`/race/${race.season}/${raceSlug(race)}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); openRace(race); }} aria-label={`Open ${race.raceName}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="results-mobile-hint"><span>←</span> Swipe to explore every session <span>→</span></div>
        </section>

        <DriverRoundMatrix races={races} sessions={sessionResults} loading={loading || loadingRounds.size > 0} />
      </main>

      <Footer />
    </div>
  );
};

export default ResultsPage;
