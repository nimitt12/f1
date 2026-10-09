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
  points?: string;
  position?: string;
  status?: string;
}

interface DriverStandingsPageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

type HistoryPoint = { round: number; points: number; rank: number };
type DriverSeries = DriverStanding & { history: HistoryPoint[]; color: string };
type RoundData = { race: SessionResult[]; sprint: SessionResult[]; qualifying: SessionResult[] };
type ChartMode = 'points' | 'rank';
type DriverCount = 5 | 10 | 99;

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27e5cf', ferrari: '#ff173d', mclaren: '#ff8700', redbull: '#6378ff',
  williams: '#2496ff', aston: '#18b89f', alpine: '#1d9ee0', haas: '#d5d9df',
  audi: '#f12c4c', cadillac: '#aab4c4', racingbulls: '#6c9cff', sauber: '#52e252',
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
  return 'williams';
};

const driverIdentity = (row: Pick<SessionResult, 'driver_id' | 'given_name' | 'family_name'>) =>
  row.driver_id || `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase();

const flagEmoji = (country: string) => {
  const code = COUNTRY_FLAGS[country];
  if (!code) return '🏁';
  return code.toUpperCase().replace(/./g, (character) =>
    String.fromCodePoint(127397 + character.charCodeAt(0)));
};

const downloadIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/>
  </svg>
);

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const SeasonChart: React.FC<{
  mode: ChartMode;
  drivers: DriverSeries[];
  races: Race[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}> = ({ mode, drivers, races, selected, onSelect }) => {
  const width = 1120;
  const height = 430;
  const pad = { left: 62, right: 34, top: 28, bottom: 58 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const roundCount = Math.max(2, races.length);
  const maxPoints = Math.max(50, ...drivers.flatMap((driver) => driver.history.map((point) => point.points)));
  const roundedMax = Math.ceil(maxPoints / 50) * 50;
  const maxRank = Math.max(2, drivers.length);
  const x = (round: number) => pad.left + ((round - 1) / (roundCount - 1)) * chartWidth;
  const y = (value: number) => mode === 'points'
    ? pad.top + chartHeight - (value / roundedMax) * chartHeight
    : pad.top + ((value - 1) / (maxRank - 1)) * chartHeight;
  const ticks = mode === 'points'
    ? Array.from({ length: 6 }, (_, index) => (roundedMax / 5) * index)
    : Array.from(new Set([1, 5, 10, 15, maxRank].filter((value) => value <= maxRank)));

  const pathFor = (history: HistoryPoint[]) => history
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.round).toFixed(1)} ${y(mode === 'points' ? point.points : point.rank).toFixed(1)}`)
    .join(' ');

  return (
    <div className="dsp-chart-scroll">
      <svg className="dsp-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Driver ${mode} evolution by championship round`}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="dsp-gridline" />
            <text x={pad.left - 15} y={y(tick) + 4} textAnchor="end" className="dsp-axis-label">{mode === 'rank' ? `P${tick}` : tick}</text>
          </g>
        ))}
        {races.map((race, index) => {
          const round = Number(race.round);
          const showLabel = races.length <= 12 || index % 2 === 0 || index === races.length - 1;
          return (
            <g key={race.round}>
              {showLabel && <line x1={x(round)} x2={x(round)} y1={pad.top} y2={height - pad.bottom} className="dsp-gridline dsp-gridline-vertical" />}
              <text x={x(round)} y={height - 24} textAnchor="middle" className="dsp-race-label">
                {showLabel ? flagEmoji(race.Circuit.Location.country) : '·'}
              </text>
              {showLabel && <text x={x(round)} y={height - 7} textAnchor="middle" className="dsp-round-label">R{round}</text>}
            </g>
          );
        })}
        {drivers.map((driver) => {
          const id = driverIdentity(driver);
          const active = !selected || selected === id;
          return (
            <g key={id} className={`dsp-series ${active ? 'active' : 'muted'}`} onClick={() => onSelect(selected === id ? null : id)}>
              <path d={pathFor(driver.history)} stroke={driver.color} className="dsp-series-line dsp-series-hit" />
              <path d={pathFor(driver.history)} stroke={driver.color} className="dsp-series-line" />
              {driver.history.map((point) => (
                <circle key={point.round} cx={x(point.round)} cy={y(mode === 'points' ? point.points : point.rank)} r={selected === id ? 4.2 : 2.6} fill={driver.color} />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const DriverSeasonStatsChart: React.FC<{
  drivers: DriverSeries[];
  rounds: Record<string, RoundData>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  season: string;
}> = ({ drivers, rounds, selected, onSelect, season }) => {
  const stats = useMemo(() => drivers.map((driver) => {
    const id = driverIdentity(driver);
    let wins = 0;
    let podiums = 0;
    let pointsFinishes = 0;
    let poles = 0;
    let retirements = 0;
    Object.values(rounds).forEach((round) => {
      const race = round.race.find((row) => driverIdentity(row) === id || `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase() === `${driver.given_name}|${driver.family_name}`.toLowerCase());
      const qualifying = round.qualifying.find((row) => driverIdentity(row) === id || `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase() === `${driver.given_name}|${driver.family_name}`.toLowerCase());
      const position = Number(race?.position);
      if (position === 1) wins += 1;
      if (position > 0 && position <= 3) podiums += 1;
      if ((Number(race?.points) || 0) > 0) pointsFinishes += 1;
      if (Number(qualifying?.position) === 1) poles += 1;
      const status = race?.status?.toLowerCase() || '';
      if (race && status && !/finished|lap|running/.test(status)) retirements += 1;
    });
    return { id, code: driver.code || driver.family_name.slice(0, 3).toUpperCase(), name: `${driver.given_name} ${driver.family_name}`, wins, podiums, pointsFinishes, poles, retirements };
  }), [drivers, rounds]);

  const metrics = [
    { key: 'wins', label: 'Wins', color: '#ffd34e' },
    { key: 'podiums', label: 'Podiums', color: '#287be0' },
    { key: 'pointsFinishes', label: 'Finishes in points', color: '#cbd0d7' },
    { key: 'poles', label: 'Pole positions', color: '#bd2bd4' },
  ] as const;
  const width = Math.max(1160, stats.length * 53 + 100);
  const height = 520;
  const pad = { left: 52, right: 24, top: 82, bottom: 72 };
  const baseline = 385;
  const positiveHeight = baseline - pad.top;
  const negativeHeight = height - pad.bottom - baseline;
  const positiveMax = Math.max(5, ...stats.flatMap((stat) => metrics.map((metric) => stat[metric.key])));
  const negativeMax = Math.max(2, ...stats.map((stat) => stat.retirements));
  const positiveTop = Math.ceil(positiveMax / 5) * 5;
  const negativeBottom = Math.ceil(negativeMax / 2) * 2;
  const yPositive = (value: number) => baseline - (value / positiveTop) * positiveHeight;
  const yNegative = (value: number) => baseline + (value / negativeBottom) * negativeHeight;
  const groupWidth = (width - pad.left - pad.right) / Math.max(1, stats.length);
  const barWidth = Math.min(8, groupWidth / 6);
  const gridTicks = Array.from({ length: positiveTop / 2 + 1 }, (_, index) => index * 2).filter((tick) => tick <= positiveTop);
  const negativeTicks = Array.from({ length: negativeBottom / 2 }, (_, index) => (index + 1) * 2);

  const exportStats = () => downloadCsv(`pitwall-${season}-driver-season-stats.csv`, [
    ['Driver', 'Wins', 'Podiums', 'Points finishes', 'Pole positions', 'DNF/DNS/DSQ'],
    ...stats.map((stat) => [stat.name, stat.wins, stat.podiums, stat.pointsFinishes, stat.poles, stat.retirements]),
  ]);

  return (
    <section className="dsp-chart-panel dsp-wide-panel" aria-labelledby="dsp-stats-title">
      <header className="dsp-panel-head">
        <div><span>04 / Performance</span><h2 id="dsp-stats-title">Driver season stats</h2></div>
        <button className="dsp-download" type="button" onClick={exportStats} disabled={!stats.length} title="Download stats CSV" aria-label="Download driver season statistics as CSV">{downloadIcon}</button>
      </header>
      <div className="dsp-stat-legend">
        {metrics.map((metric) => <span key={metric.key}><i style={{ background: metric.color }} />{metric.label}</span>)}
        <span><i style={{ background: '#ef1818' }} />DNF / DNS / DSQ</span>
      </div>
      <div className="dsp-chart-scroll dsp-stat-scroll">
        <svg className="dsp-chart dsp-stat-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Driver wins, podiums, points finishes, poles and retirements">
          {[...gridTicks, ...negativeTicks.map((tick) => -tick)].map((tick) => {
            const y = tick >= 0 ? yPositive(tick) : yNegative(Math.abs(tick));
            return <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y} y2={y} className={`dsp-gridline ${tick === 0 ? 'dsp-zero-line' : ''}`} /><text x={pad.left - 12} y={y + 4} textAnchor="end" className="dsp-axis-label">{tick}</text></g>;
          })}
          {stats.map((stat, index) => {
            const center = pad.left + groupWidth * index + groupWidth / 2;
            const isActive = !selected || selected === stat.id;
            return (
              <g key={stat.id} className={`dsp-stat-group ${isActive ? '' : 'muted'}`} onClick={() => onSelect(selected === stat.id ? null : stat.id)}>
                {metrics.map((metric, metricIndex) => {
                  const value = stat[metric.key];
                  const x = center + (metricIndex - 2) * (barWidth + 1);
                  return <rect key={metric.key} x={x} y={yPositive(value)} width={barWidth} height={baseline - yPositive(value)} fill={metric.color}><title>{stat.name} · {metric.label}: {value}</title></rect>;
                })}
                <rect x={center + 2 * (barWidth + 1)} y={baseline} width={barWidth} height={yNegative(stat.retirements) - baseline} fill="#ef1818"><title>{stat.name} · DNF/DNS/DSQ: {stat.retirements}</title></rect>
                <text x={center + 5} y={height - 42} transform={`rotate(-45 ${center + 5} ${height - 42})`} textAnchor="end" className="dsp-stat-code">{stat.code}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};

const PointsByRaceChart: React.FC<{
  races: Race[];
  rounds: Record<string, RoundData>;
  drivers: DriverSeries[];
  season: string;
}> = ({ races, rounds, drivers, season }) => {
  const driverMap = useMemo(() => {
    const map = new Map<string, DriverSeries>();
    drivers.forEach((driver) => {
      map.set(driverIdentity(driver), driver);
      map.set(`${driver.given_name}|${driver.family_name}`.toLowerCase(), driver);
    });
    return map;
  }, [drivers]);
  const rows = useMemo(() => races.filter((race) => rounds[race.round]).map((race) => {
    const pointMap = new Map<string, number>();
    [...rounds[race.round].race, ...rounds[race.round].sprint].forEach((result) => {
      const driver = driverMap.get(driverIdentity(result)) || driverMap.get(`${result.given_name || ''}|${result.family_name || ''}`.toLowerCase());
      if (!driver) return;
      const id = driverIdentity(driver);
      pointMap.set(id, (pointMap.get(id) || 0) + (Number(result.points) || 0));
    });
    const segments = drivers.map((driver) => ({ driver, points: pointMap.get(driverIdentity(driver)) || 0 })).filter((segment) => segment.points > 0);
    return { race, segments, total: segments.reduce((sum, segment) => sum + segment.points, 0) };
  }), [driverMap, drivers, races, rounds]);
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));

  const exportPoints = () => downloadCsv(`pitwall-${season}-points-by-race.csv`, [
    ['Round', 'Grand Prix', ...drivers.map((driver) => driver.code || driver.family_name), 'Total'],
    ...rows.map((row) => [row.race.round, row.race.raceName, ...drivers.map((driver) => row.segments.find((segment) => driverIdentity(segment.driver) === driverIdentity(driver))?.points || 0), row.total]),
  ]);

  return (
    <section className="dsp-chart-panel dsp-wide-panel" aria-labelledby="dsp-race-points-title">
      <header className="dsp-panel-head">
        <div><span>05 / Race distribution</span><h2 id="dsp-race-points-title">Driver points by race</h2></div>
        <button className="dsp-download" type="button" onClick={exportPoints} disabled={!rows.length} title="Download race points CSV" aria-label="Download driver points by race as CSV">{downloadIcon}</button>
      </header>
      <div className="dsp-race-bars" style={{ '--race-max': maxTotal } as React.CSSProperties}>
        <div className="dsp-race-axis" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} style={{ left: `${index * (100 / 7)}%` }}>{Math.round(maxTotal * index / 7)}</span>)}</div>
        {rows.map(({ race, segments, total }) => (
          <div className="dsp-race-bar-row" key={race.round}>
            <div className="dsp-race-identity" title={`${race.raceName} · Round ${race.round}`}><span>{flagEmoji(race.Circuit.Location.country)}</span><small>R{race.round}</small></div>
            <div className="dsp-race-track">
              <div className="dsp-race-stack" style={{ width: `${(total / maxTotal) * 100}%` }}>
                {segments.map(({ driver, points }) => <div key={driverIdentity(driver)} className="dsp-race-segment" style={{ width: `${(points / total) * 100}%`, background: driver.color }}><span>{points >= 10 ? points : ''}</span><div className="dsp-race-tooltip"><strong>{race.raceName} · R{race.round}</strong><span>{driver.code || driver.family_name}: <b>{points} pts</b></span></div></div>)}
              </div>
            </div>
            <strong className="dsp-race-total">{total}</strong>
          </div>
        ))}
        {!rows.length && <div className="dsp-chart-empty">Race points will appear after the first completed round.</div>}
      </div>
      <div className="dsp-race-key">{drivers.map((driver) => <span key={driverIdentity(driver)}><i style={{ background: driver.color }} />{driver.code || driver.family_name.slice(0, 3).toUpperCase()}</span>)}</div>
    </section>
  );
};

const DriverStandingsPage: React.FC<DriverStandingsPageProps> = ({
  user, setUser, onBack, onOpenSettings, onHomeNavigate,
}) => {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryPoint[]>>({});
  const [roundData, setRoundData] = useState<Record<string, RoundData>>({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [driverCount, setDriverCount] = useState<DriverCount>(10);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [standingResponse, raceList] = await Promise.all([
          fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`, { signal: controller.signal }),
          fetchRaces(),
        ]);
        if (!standingResponse.ok) throw new Error('Standings request failed');
        const rankingData = await standingResponse.json();
        if (!Array.isArray(rankingData)) throw new Error('Invalid standings response');
        if (controller.signal.aborted) return;
        const sortedStandings = (rankingData as DriverStanding[]).sort((a, b) => Number(a.position) - Number(b.position));
        setStandings(sortedStandings);
        setRaces(raceList);
        setLoading(false);

        const completedRaces = raceList.filter((race) =>
          Date.now() > new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime() + 2.75 * 60 * 60 * 1000);
        const cumulative = new Map<string, number>();
        const nextHistory: Record<string, HistoryPoint[]> = {};
        const driverAliases = new Map<string, string>();
        const nextRoundData: Record<string, RoundData> = {};
        sortedStandings.forEach((driver) => {
          const id = driverIdentity(driver);
          cumulative.set(id, 0);
          nextHistory[id] = [];
          driverAliases.set(id, id);
          driverAliases.set(`${driver.given_name}|${driver.family_name}`.toLowerCase(), id);
        });

        const loadSession = async (endpoint: string, race: Race) => {
          try {
            const response = await fetch(`${BACKEND_URL}/results/${endpoint}/${race.season}/${race.round}`, { signal: controller.signal });
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data as SessionResult[] : [];
          } catch (sessionError) {
            if (sessionError instanceof DOMException && sessionError.name === 'AbortError') throw sessionError;
            return [];
          }
        };
        const loadedRounds = await Promise.all(completedRaces.map(async (race) => {
          const [raceRows, sprintRows, qualifyingRows] = await Promise.all([
            loadSession('get-all-results', race),
            race.Sprint ? loadSession('get-all-sprint-results', race) : Promise.resolve([]),
            loadSession('get-all-qualifying-results', race),
          ]);
          return { race, data: { race: raceRows, sprint: sprintRows, qualifying: qualifyingRows } as RoundData };
        }));

        for (const loaded of loadedRounds) {
          const { race, data } = loaded;
          nextRoundData[race.round] = data;
          [...data.race, ...data.sprint].forEach((row) => {
            const id = driverAliases.get(driverIdentity(row))
              || driverAliases.get(`${row.given_name || ''}|${row.family_name || ''}`.toLowerCase())
              || driverIdentity(row);
            cumulative.set(id, (cumulative.get(id) || 0) + (Number(row.points) || 0));
          });
          const order = [...sortedStandings].sort((a, b) => {
            const difference = (cumulative.get(driverIdentity(b)) || 0) - (cumulative.get(driverIdentity(a)) || 0);
            return difference || Number(a.position) - Number(b.position);
          });
          order.forEach((driver, index) => {
            const id = driverIdentity(driver);
            nextHistory[id]?.push({ round: Number(race.round), points: cumulative.get(id) || 0, rank: index + 1 });
          });
        }
        if (!controller.signal.aborted) {
          setHistory(nextHistory);
          setRoundData(nextRoundData);
        }
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(true);
      } finally {
        if (!controller.signal.aborted) { setLoading(false); setHistoryLoading(false); }
      }
    };
    load();
    return () => controller.abort();
  }, []);

  const series = useMemo<DriverSeries[]>(() => standings.map((driver) => ({
    ...driver,
    history: history[driverIdentity(driver)] || [],
    color: TEAM_COLORS[teamKey(driver.constructor_name)] || '#9aa8bd',
  })), [history, standings]);
  const visibleSeries = useMemo(() => {
    const visible = series.slice(0, driverCount);
    if (!selectedDriver || visible.some((driver) => driverIdentity(driver) === selectedDriver)) return visible;
    const selected = series.find((driver) => driverIdentity(driver) === selectedDriver);
    return selected ? [...visible, selected] : visible;
  }, [driverCount, selectedDriver, series]);
  const season = standings[0]?.season || races[0]?.season || new Date().getFullYear().toString();
  const roundsComplete = Math.max(0, ...series.flatMap((driver) => driver.history.map((point) => point.round)));
  const leaderPoints = Number(standings[0]?.points) || 0;
  const selectedStanding = series.find((driver) => driverIdentity(driver) === selectedDriver);

  const exportCsv = () => {
    downloadCsv(`pitwall-${season}-driver-standings.csv`, [
      ['Position', 'Driver', 'Team', 'Points', 'Wins'],
      ...standings.map((driver) => [driver.position, `${driver.given_name} ${driver.family_name}`, driver.constructor_name, driver.points, driver.wins]),
    ]);
  };

  return (
    <div className="dsp-page">
      <div className="dsp-page-header">
        <SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate}
          leftSlot={<button className="rd-back-btn dsp-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Dashboard</button>} />
      </div>

      <main className="dsp-main">
        <section className="dsp-hero">
          <div>
            <span className="dsp-kicker"><i /> Championship telemetry · {season}</span>
            <h1>Driver <em>Standings</em></h1>
            <p>Follow every point scored and every position gained across the Formula 1 season.</p>
          </div>
          <div className="dsp-meta">
            <span><small>Season</small><strong>{season}</strong></span><i />
            <span><small>Rounds</small><strong>{String(roundsComplete).padStart(2, '0')}<b> / {String(races.length).padStart(2, '0')}</b></strong></span><i />
            <span><small>Drivers</small><strong>{String(standings.length).padStart(2, '0')}</strong></span>
          </div>
        </section>

        {error && <div className="dsp-alert" role="status">Some championship data could not be loaded. Try refreshing the page.</div>}

        <div className="dsp-layout">
          <section className="dsp-standings" aria-labelledby="dsp-table-title">
            <header className="dsp-panel-head">
              <div><span>01 / Classification</span><h2 id="dsp-table-title">{season} standings</h2></div>
              <button className="dsp-download" type="button" onClick={exportCsv} disabled={!standings.length} title="Download CSV" aria-label="Download driver standings as CSV">{downloadIcon}</button>
            </header>
            <div className="dsp-table-head"><span>Pos.</span><span>Driver</span><span>Points</span></div>
            <div className="dsp-table-body">
              {loading ? Array.from({ length: 10 }).map((_, index) => <div className="dsp-row dsp-row-skeleton" key={index}><i /><span /><b /></div>) : standings.map((driver) => {
                const id = driverIdentity(driver);
                const difference = leaderPoints - Number(driver.points);
                const color = TEAM_COLORS[teamKey(driver.constructor_name)] || '#9aa8bd';
                return (
                  <button key={id} type="button" className={`dsp-row ${selectedDriver === id ? 'selected' : ''}`} style={{ '--driver-color': color } as React.CSSProperties}
                    onClick={() => setSelectedDriver(selectedDriver === id ? null : id)}>
                    <span className="dsp-position">{String(driver.position).padStart(2, '0')}</span>
                    <span className="dsp-driver"><i>{driver.code || driver.family_name.slice(0, 3).toUpperCase()}</i><span><strong>{driver.given_name} <b>{driver.family_name}</b></strong><small>{driver.constructor_name}</small></span></span>
                    <span className="dsp-points"><strong>{driver.points}</strong><small>{difference ? `−${difference}` : `${driver.wins} wins`}</small></span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="dsp-visuals">
            <header className="dsp-visual-tools">
              <div><span className="dsp-live-dot" /> {historyLoading ? 'Building race history' : 'Season progression'}</div>
              <div className="dsp-visual-actions">
                {selectedStanding && <a className="dsp-profile-cta" href={`/driver/${season}/${encodeURIComponent(selectedStanding.driver_id)}`} onClick={(event) => { event.preventDefault(); window.history.pushState({}, '', event.currentTarget.href); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); }}>View {selectedStanding.code || selectedStanding.family_name} profile <span>↗</span></a>}
                <div className="dsp-count-control" aria-label="Number of drivers shown">
                  {([5, 10, 99] as DriverCount[]).map((count) => <button key={count} className={driverCount === count ? 'active' : ''} onClick={() => setDriverCount(count)}>{count === 99 ? 'All' : `Top ${count}`}</button>)}
                </div>
              </div>
            </header>
            {(['points', 'rank'] as ChartMode[]).map((mode, index) => (
              <section className="dsp-chart-panel" key={mode} aria-labelledby={`dsp-${mode}-title`}>
                <header className="dsp-panel-head">
                  <div><span>0{index + 2} / Evolution</span><h2 id={`dsp-${mode}-title`}>Driver {mode === 'points' ? 'points' : 'ranking'} evolution</h2></div>
                  <small>{selectedDriver ? 'Focused driver' : `${visibleSeries.length} drivers shown`}</small>
                </header>
                {historyLoading ? <div className="dsp-chart-loading"><span />Loading round data…</div> : roundsComplete === 0 ? <div className="dsp-chart-empty">Evolution data will appear after the first completed round.</div> : <SeasonChart mode={mode} drivers={visibleSeries} races={races.filter((race) => Number(race.round) <= roundsComplete)} selected={selectedDriver} onSelect={setSelectedDriver} />}
              </section>
            ))}
            <div className="dsp-legend">
              {visibleSeries.map((driver) => { const id = driverIdentity(driver); return <button key={id} className={selectedDriver && selectedDriver !== id ? 'muted' : ''} onClick={() => setSelectedDriver(selectedDriver === id ? null : id)}><i style={{ background: driver.color }} />{driver.code || driver.family_name.slice(0, 3).toUpperCase()}</button>; })}
              <span>Tap a driver to isolate</span>
            </div>
          </div>
        </div>
        <div className="dsp-secondary-charts">
          {historyLoading ? <div className="dsp-chart-panel dsp-wide-panel"><div className="dsp-chart-loading"><span />Loading performance data…</div></div> : (
            <>
              <DriverSeasonStatsChart drivers={series} rounds={roundData} selected={selectedDriver} onSelect={setSelectedDriver} season={season} />
              <PointsByRaceChart races={races} rounds={roundData} drivers={series} season={season} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DriverStandingsPage;
