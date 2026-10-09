import React, { useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, fetchRaces, type Race } from '../data/races';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface DriverStanding {
  driver_id: string;
  given_name: string;
  family_name: string;
  code: string;
  number: string;
  nationality: string;
  constructor_name: string;
  position: string;
  points: string;
  wins: string;
  rounds: string;
  season: string;
}

interface SessionResult {
  driver_id?: string;
  given_name?: string;
  family_name?: string;
  constructor_name?: string;
  team_name?: string;
  position?: string;
  points?: string;
  status?: string;
  grid?: string;
  laps?: string;
}

interface LapPositionsData {
  totalLaps: number;
  drivers: Record<string, Array<{ lap: number; position: number }>>;
}

type Weekend = {
  race: Race;
  result?: SessionResult;
  sprint?: SessionResult;
  qualifying?: SessionResult;
  lapsLed?: number;
  totalLaps?: number;
};

interface DriverDetailPageProps {
  season: string;
  driverId: string;
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27e5cf', ferrari: '#ff173d', mclaren: '#ff8700', redbull: '#6378ff',
  williams: '#2496ff', aston: '#18b89f', alpine: '#1d9ee0', haas: '#d5d9df',
  audi: '#f12c4c', cadillac: '#aab4c4', racingbulls: '#6c9cff', sauber: '#52e252',
};

const NATIONALITY_FLAGS: Record<string, string> = {
  American: 'us', Argentine: 'ar', Australian: 'au', Brazilian: 'br', British: 'gb',
  Canadian: 'ca', Chinese: 'cn', Danish: 'dk', Dutch: 'nl', Finnish: 'fi', French: 'fr',
  German: 'de', Italian: 'it', Japanese: 'jp', Mexican: 'mx', Monegasque: 'mc',
  'New Zealander': 'nz', Spanish: 'es', Thai: 'th',
};

const teamKey = (team: string) => {
  const name = team.toLowerCase();
  if (name.includes('mercedes')) return 'mercedes';
  if (name.includes('ferrari')) return 'ferrari';
  if (name.includes('mclaren')) return 'mclaren';
  if (name.includes('red bull')) return 'redbull';
  if (name.includes('williams')) return 'williams';
  if (name.includes('aston')) return 'aston';
  if (name.includes('alpine')) return 'alpine';
  if (name.includes('haas')) return 'haas';
  if (name.includes('audi')) return 'audi';
  if (name.includes('cadillac')) return 'cadillac';
  if (name.includes('racing bulls') || name === 'rb') return 'racingbulls';
  if (name.includes('sauber')) return 'sauber';
  return 'racing';
};

const flagEmoji = (nationality: string) => {
  const code = COUNTRY_FLAGS[nationality] || NATIONALITY_FLAGS[nationality];
  if (!code) return '🏁';
  return code.toUpperCase().replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
};

const rowMatches = (row: SessionResult, driver: DriverStanding) =>
  row.driver_id === driver.driver_id ||
  `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase() === `${driver.given_name}|${driver.family_name}`.toLowerCase();

const compactRaceName = (race: Race) => race.raceName.replace(/ Grand Prix$/i, '');

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/>
  </svg>
);

const DriverDetailPage: React.FC<DriverDetailPageProps> = ({
  season, driverId, user, setUser, onBack, onOpenSettings, onHomeNavigate,
}) => {
  const [driver, setDriver] = useState<DriverStanding | null>(null);
  const [weekends, setWeekends] = useState<Weekend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [standingsResponse, allRaces] = await Promise.all([
          fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`, { signal: controller.signal }),
          fetchRaces(),
        ]);
        if (!standingsResponse.ok) throw new Error('Driver standings request failed');
        const standings = await standingsResponse.json() as DriverStanding[];
        const match = standings.find((candidate) => candidate.driver_id === driverId)
          || standings.find((candidate) => candidate.code.toLowerCase() === driverId.toLowerCase());
        if (!match) throw new Error('Driver not found');
        if (controller.signal.aborted) return;
        setDriver(match);

        const completedRounds = Number(match.rounds) || 0;
        const seasonRaces = allRaces.filter((race) =>
          String(race.season) === season && Number(race.round) <= completedRounds);
        const request = async (endpoint: string, race: Race) => {
          try {
            const response = await fetch(`${BACKEND_URL}/results/${endpoint}/${season}/${race.round}`, { signal: controller.signal });
            if (!response.ok) return [] as SessionResult[];
            const data = await response.json();
            return Array.isArray(data) ? data as SessionResult[] : [];
          } catch (requestError) {
            if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError;
            return [] as SessionResult[];
          }
        };

        const requestLapPositions = async (race: Race) => {
          try {
            const response = await fetch(`${BACKEND_URL}/results/get-lap-positions/${season}/${race.round}`, { signal: controller.signal });
            if (!response.ok) return undefined;
            const data = await response.json() as LapPositionsData;
            return data?.drivers && Number(data.totalLaps) > 0 ? data : undefined;
          } catch (requestError) {
            if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError;
            return undefined;
          }
        };

        const loaded = await Promise.all(seasonRaces.map(async (race) => {
          const [raceRows, sprintRows, qualifyingRows, lapPositions] = await Promise.all([
            request('get-all-results', race),
            race.Sprint ? request('get-all-sprint-results', race) : Promise.resolve([]),
            request('get-all-qualifying-results', race),
            requestLapPositions(race),
          ]);
          const driverLaps = lapPositions
            ? Object.entries(lapPositions.drivers).find(([id]) =>
              id === match.driver_id || id.endsWith(`_${match.driver_id}`))?.[1]
            : undefined;
          return {
            race,
            result: raceRows.find((row) => rowMatches(row, match)),
            sprint: sprintRows.find((row) => rowMatches(row, match)),
            qualifying: qualifyingRows.find((row) => rowMatches(row, match)),
            lapsLed: lapPositions ? (driverLaps?.filter((point) => Number(point.position) === 1).length || 0) : undefined,
            totalLaps: lapPositions?.totalLaps,
          };
        }));
        if (!controller.signal.aborted) setWeekends(loaded);
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [driverId, season]);

  const stats = useMemo(() => {
    let raceWins = 0;
    let sprintWins = 0;
    let podiums = 0;
    let poles = 0;
    let pointsFinishes = 0;
    let retirements = 0;
    let positionsGained = 0;
    let classified = 0;
    const distribution = new Map<number, number>();
    const progress: Array<{ round: number; points: number; label: string }> = [];
    const lapLeadership: Array<{ round: number; race: Race; lapsLed?: number; totalLaps?: number }> = [];
    let totalLapsLed = 0;
    let cumulative = 0;

    weekends.forEach(({ race, result, sprint, qualifying, lapsLed, totalLaps }) => {
      const finish = Number(result?.position);
      const sprintFinish = Number(sprint?.position);
      const grid = Number(result?.grid);
      const racePoints = Number(result?.points) || 0;
      const sprintPoints = Number(sprint?.points) || 0;
      cumulative += racePoints + sprintPoints;
      progress.push({ round: Number(race.round), points: cumulative, label: compactRaceName(race) });
      lapLeadership.push({ round: Number(race.round), race, lapsLed, totalLaps });
      totalLapsLed += lapsLed || 0;
      if (finish > 0) {
        distribution.set(finish, (distribution.get(finish) || 0) + 1);
        classified += 1;
        if (finish === 1) raceWins += 1;
        if (finish <= 3) podiums += 1;
        if (racePoints > 0) pointsFinishes += 1;
        if (grid > 0) positionsGained += grid - finish;
      }
      if (sprintFinish === 1) sprintWins += 1;
      if (Number(qualifying?.position) === 1) poles += 1;
      const status = result?.status?.toLowerCase() || '';
      if (result && status && !/finished|lap|running/.test(status)) retirements += 1;
    });
    return { raceWins, sprintWins, podiums, poles, pointsFinishes, retirements, positionsGained, classified, distribution, progress, lapLeadership, totalLapsLed };
  }, [weekends]);

  const accent = TEAM_COLORS[teamKey(driver?.constructor_name || '')] || '#e10600';
  const maxDistribution = Math.max(1, ...stats.distribution.values());
  const chartWidth = 900;
  const chartHeight = 265;
  const chartPad = { left: 42, right: 24, top: 22, bottom: 38 };
  const maxPoints = Math.max(50, Number(driver?.points) || 0, ...stats.progress.map((point) => point.points));
  const linePoints = stats.progress.map((point, index) => {
    const x = chartPad.left + (index / Math.max(1, stats.progress.length - 1)) * (chartWidth - chartPad.left - chartPad.right);
    const y = chartPad.top + (1 - point.points / maxPoints) * (chartHeight - chartPad.top - chartPad.bottom);
    return `${x},${y}`;
  }).join(' ');
  const maxRaceLaps = Math.max(1, ...stats.lapLeadership.map((round) => round.totalLaps || 0));
  const lapDataAvailable = stats.lapLeadership.some((round) => round.lapsLed !== undefined);

  const exportLapsLed = () => downloadCsv(`pitwall-${season}-${driver?.code || driverId}-laps-led.csv`, [
    ['Round', 'Grand Prix', 'Laps led', 'Race laps'],
    ...stats.lapLeadership.map((round) => [round.round, round.race.raceName, round.lapsLed ?? 'Unavailable', round.totalLaps ?? 'Unavailable']),
  ]);

  return (
    <div className="ddp-page" style={{ '--driver-accent': accent } as React.CSSProperties}>
      <div className="ddp-page-header">
        <SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate}
          leftSlot={<button className="rd-back-btn dsp-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Standings</button>} />
      </div>

      <main className="ddp-main">
        {loading ? <div className="ddp-loading"><span />Building driver telemetry…</div> : error || !driver ? (
          <section className="ddp-error"><span>Driver unavailable</span><h1>We couldn't load this profile.</h1><button onClick={onBack}>Return to standings</button></section>
        ) : (
          <>
            <section className="ddp-hero">
              <div className="ddp-hero-copy">
                <span className="ddp-kicker"><i /> {season} driver intelligence</span>
                <div className="ddp-identity">
                  <span className="ddp-number">{driver.number || String(driver.position).padStart(2, '0')}</span>
                  <div><p>{driver.given_name}</p><h1>{driver.family_name}</h1></div>
                </div>
                <div className="ddp-driver-meta">
                  <strong>{driver.code}</strong><span>{flagEmoji(driver.nationality)} {driver.nationality}</span><span>{driver.constructor_name}</span>
                </div>
              </div>
              <div className="ddp-rank-card">
                <span>Championship position</span><strong>P{driver.position}</strong><p>{driver.points} <small>PTS</small></p><i>{driver.wins} season wins</i>
              </div>
            </section>

            <section className="ddp-stat-grid" aria-label={`${driver.given_name} ${driver.family_name} season totals`}>
              {[
                ['Race wins', stats.raceWins || Number(driver.wins), stats.sprintWins ? `${stats.sprintWins} sprint win${stats.sprintWins === 1 ? '' : 's'}` : 'Grand Prix victories'],
                ['Podiums', stats.podiums, `${stats.pointsFinishes} points finishes`],
                ['Season points', driver.points, stats.classified ? `${(Number(driver.points) / stats.classified).toFixed(1)} per classified race` : 'Current total'],
                ['Pole positions', stats.poles, stats.retirements ? `${stats.retirements} retirement${stats.retirements === 1 ? '' : 's'}` : 'No retirements'],
              ].map(([label, value, detail]) => (
                <article className="ddp-stat-card" key={label}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>
              ))}
            </section>

            <div className="ddp-dashboard">
              <section className="ddp-panel ddp-progress-panel">
                <header><div><span>01 / Momentum</span><h2>Points progression</h2></div><small>{stats.progress.length} rounds tracked</small></header>
                {stats.progress.length ? (
                  <div className="ddp-line-wrap">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Cumulative season points by round">
                      {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1={chartPad.left} x2={chartWidth - chartPad.right} y1={chartPad.top + ratio * (chartHeight - chartPad.top - chartPad.bottom)} y2={chartPad.top + ratio * (chartHeight - chartPad.top - chartPad.bottom)} />)}
                      <polyline points={linePoints} />
                      {stats.progress.map((point, index) => {
                        const [cx, cy] = linePoints.split(' ')[index].split(',');
                        return <circle key={point.round} cx={cx} cy={cy} r="4"><title>{point.label}: {point.points} points</title></circle>;
                      })}
                    </svg>
                    <div className="ddp-chart-foot"><span>Round 01</span><span>Round {String(stats.progress.at(-1)?.round || 0).padStart(2, '0')}</span></div>
                  </div>
                ) : <p className="ddp-empty">Race data will appear after the first completed round.</p>}
              </section>

              <section className="ddp-panel ddp-distribution">
                <header><div><span>02 / Consistency</span><h2>Finish distribution</h2></div><small>Grand Prix only</small></header>
                <div className="ddp-position-bars">
                  {Array.from({ length: 20 }, (_, index) => index + 1).map((position) => {
                    const count = stats.distribution.get(position) || 0;
                    return <div className="ddp-position-row" key={position}><span>P{position}</span><i><b style={{ width: `${(count / maxDistribution) * 100}%` }} /></i><strong>{count || '—'}</strong></div>;
                  })}
                </div>
              </section>
            </div>

            <section className="ddp-panel ddp-laps-led">
              <header>
                <div><span>03 / Track position</span><h2>Laps led per race</h2></div>
                <div className="ddp-laps-summary"><span><b>{stats.totalLapsLed}</b> laps led</span><button type="button" onClick={exportLapsLed} disabled={!lapDataAvailable} title="Download laps led CSV" aria-label="Download laps led as CSV">{downloadIcon}</button></div>
              </header>
              {lapDataAvailable ? (
                <div className="ddp-lap-bars">
                  {stats.lapLeadership.map((round) => {
                    const led = round.lapsLed || 0;
                    const total = round.totalLaps || 0;
                    return (
                      <div className="ddp-lap-row" key={round.round}>
                        <span className="ddp-lap-round">{String(round.round).padStart(2, '0')}</span>
                        <span className="ddp-lap-flag" title={round.race.Circuit.Location.country}>{flagEmoji(round.race.Circuit.Location.country)}</span>
                        <span className="ddp-lap-race">{compactRaceName(round.race)}</span>
                        <div className="ddp-lap-track" title={`${compactRaceName(round.race)}: ${led} of ${total} laps led`}>
                          <i style={{ width: `${(total / maxRaceLaps) * 100}%` }} />
                          <b className={led === 0 ? 'zero' : ''} style={{ width: `${(led / maxRaceLaps) * 100}%` }}>{led > 0 && <em>{led}</em>}</b>
                        </div>
                        <strong>{round.lapsLed === undefined ? 'N/A' : led}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="ddp-empty">Lap-by-lap telemetry is not available for this season yet.</p>}
            </section>

            <section className="ddp-panel ddp-weekends">
              <header><div><span>04 / Race log</span><h2>Weekend by weekend</h2></div><small>{stats.positionsGained >= 0 ? '+' : ''}{stats.positionsGained} net places raced</small></header>
              <div className="ddp-weekend-table">
                <div className="ddp-weekend-head"><span>Rnd</span><span>Grand Prix</span><span>Grid</span><span>Finish</span><span>Points</span><span>Status</span></div>
                {[...weekends].reverse().map(({ race, result, sprint }) => (
                  <div className="ddp-weekend-row" key={race.round}>
                    <span>{String(race.round).padStart(2, '0')}</span><strong>{flagEmoji(race.Circuit?.Location?.country || '')} {compactRaceName(race)}</strong>
                    <span>{result?.grid && Number(result.grid) > 0 ? `P${result.grid}` : '—'}</span><span className={Number(result?.position) <= 3 ? 'ddp-top-finish' : ''}>{result?.position ? `P${result.position}` : '—'}</span>
                    <span>{(Number(result?.points) || 0) + (Number(sprint?.points) || 0)}</span><small>{result?.status || 'Awaiting result'}</small>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DriverDetailPage;
