import React, { useEffect, useMemo, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type AnalyticsTab = 'championship' | 'circuits' | 'qualifying' | 'speed';

interface Point { round: number; points: number; rank: number }
interface Series { driverNumber?: string; code?: string; name?: string; team: string; points: Point[] }
interface ChampionshipData {
  season: string;
  rounds: Array<{ round: number; raceName: string }>;
  drivers: Series[];
  constructors: Series[];
}
interface CircuitDirectory { circuits: Array<{ id: string; name: string; locality: string; country: string }> }
interface CircuitData {
  circuit: { id: string; name: string; locality: string; country: string };
  summary: { races: number; firstSeason: number; latestSeason: number; poleConversion: number; averageGridMovement: number; dnfRate: number };
  topDrivers: Array<{ name: string; count: number }>;
  topConstructors: Array<{ name: string; count: number }>;
  recentWinners: Array<{ season: number; driver: string; team: string }>;
  fastestLaps: Array<{ season: number; driver: string; team: string; time: string | null; speedKph: number | null }>;
}
interface QualifyingData {
  rounds: Array<{
    round: number;
    raceName: string;
    drivers: Array<{ driverNumber: string; code: string; name: string; team: string; position: number; sessions: Array<{ time: string | null; deltaMs: number | null }> }>;
  }>;
}
interface SpeedData {
  entries: Array<{ round: number; raceName: string; circuitName: string; code: string; name: string; team: string; lap: number | null; rank: number | null; time: string | null; speedKph: number | null }>;
}

const TEAM_COLORS = ['#ff4d67', '#53e0c1', '#ff9f1a', '#6e82ff', '#b77cff', '#27a8ff', '#f4d35e', '#79d45e'];
const colorFor = (value: string) => {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TEAM_COLORS[hash % TEAM_COLORS.length];
};

const useJson = <T,>(url: string | null) => {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: string }>({ url: null, data: null, error: '' });
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Analytics feed unavailable');
        return response.json() as Promise<T>;
      })
      .then((payload) => { if (!controller.signal.aborted) setState({ url, data: payload, error: '' }); })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setState({ url, data: null, error: requestError instanceof Error ? requestError.message : 'Analytics feed unavailable' });
      });
    return () => controller.abort();
  }, [url]);
  return {
    data: state.url === url ? state.data : null,
    error: state.url === url ? state.error : '',
    loading: !!url && state.url !== url,
  };
};

const Loading: React.FC = () => <div className="analytics-loading"><i />Loading analysis…</div>;
const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="analytics-empty">{children}</div>;

const ChampionshipPanel: React.FC<{ season: string }> = ({ season }) => {
  const { data, error, loading } = useJson<ChampionshipData>(`${BACKEND_URL}/statistics/championship/${season}`);
  const [mode, setMode] = useState<'drivers' | 'constructors'>('drivers');
  const width = 1000;
  const height = 390;
  const series = useMemo(() => (mode === 'drivers' ? data?.drivers : data?.constructors)?.slice(0, 7) || [], [data, mode]);
  const maxRound = Math.max(1, ...(data?.rounds.map((round) => round.round) || []));
  const maxPoints = Math.max(1, ...series.flatMap((item) => item.points.map((point) => point.points))) * 1.08;
  if (loading) return <Loading />;
  if (error) return <Empty>{error}</Empty>;
  if (!data?.rounds.length) return <Empty>Championship data will appear after synced race results are available.</Empty>;
  return (
    <div className="analytics-panel-body">
      <div className="analytics-toolbar">
        <div><span>Title race</span><h3>Championship momentum</h3></div>
        <div className="analytics-toggle"><button className={mode === 'drivers' ? 'active' : ''} onClick={() => setMode('drivers')}>Drivers</button><button className={mode === 'constructors' ? 'active' : ''} onClick={() => setMode('constructors')}>Teams</button></div>
      </div>
      <div className="analytics-line-chart">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={`${season} championship points progression`}>
          {[0, .25, .5, .75, 1].map((tick) => <line key={tick} x1="45" x2={width - 20} y1={20 + tick * 330} y2={20 + tick * 330} />)}
          {series.map((item) => {
            const color = colorFor(item.team || item.name || 'team');
            const points = item.points.map((point) => `${45 + (point.round - 1) / Math.max(1, maxRound - 1) * (width - 75)},${350 - point.points / maxPoints * 320}`).join(' ');
            return <polyline key={item.driverNumber || item.team} points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><title>{item.name || item.team}</title></polyline>;
          })}
        </svg>
        <div className="analytics-axis"><span>R1</span><span>Round {maxRound}</span></div>
      </div>
      <div className="analytics-legend">{series.map((item) => <div key={item.driverNumber || item.team}><i style={{ background: colorFor(item.team || item.name || 'team') }} /><span>{item.code || item.team}</span><strong>{item.points.at(-1)?.points ?? 0}</strong></div>)}</div>
    </div>
  );
};

const CircuitPanel: React.FC = () => {
  const directory = useJson<CircuitDirectory>(`${BACKEND_URL}/statistics/circuits`);
  const [circuitId, setCircuitId] = useState('');
  const defaultCircuit = directory.data?.circuits.find((circuit) => circuit.id === 'monza') || directory.data?.circuits[0];
  const selectedCircuitId = circuitId || defaultCircuit?.id || '';
  const insight = useJson<CircuitData>(selectedCircuitId ? `${BACKEND_URL}/statistics/circuits/${encodeURIComponent(selectedCircuitId)}` : null);
  if (directory.loading) return <Loading />;
  if (directory.error) return <Empty>{directory.error}</Empty>;
  return (
    <div className="analytics-panel-body">
      <div className="analytics-toolbar">
        <div><span>Venue archive</span><h3>Circuit intelligence</h3></div>
        <label className="analytics-select"><span>Circuit</span><select value={selectedCircuitId} onChange={(event) => setCircuitId(event.target.value)}>{directory.data?.circuits.map((circuit) => <option key={circuit.id} value={circuit.id}>{circuit.name} · {circuit.country}</option>)}</select></label>
      </div>
      {insight.loading ? <Loading /> : insight.error ? <Empty>{insight.error}</Empty> : insight.data && <>
        <div className="analytics-circuit-title"><div><strong>{insight.data.circuit.name}</strong><span>{insight.data.circuit.locality}, {insight.data.circuit.country}</span></div><small>{insight.data.summary.firstSeason}—{insight.data.summary.latestSeason}</small></div>
        <div className="analytics-kpis">
          <article><span>Grands Prix</span><strong>{insight.data.summary.races}</strong></article>
          <article><span>Pole conversion</span><strong>{insight.data.summary.poleConversion}<small>%</small></strong></article>
          <article><span>Grid movement</span><strong>{insight.data.summary.averageGridMovement}</strong></article>
          <article><span>DNF rate</span><strong>{insight.data.summary.dnfRate}<small>%</small></strong></article>
        </div>
        <div className="analytics-split">
          <article><header>Most successful drivers</header>{insight.data.topDrivers.slice(0, 6).map((item, index) => <div className="analytics-ranking" key={item.name}><b>{index + 1}</b><span>{item.name}</span><strong>{item.count} wins</strong></div>)}</article>
          <article><header>Most successful constructors</header>{insight.data.topConstructors.slice(0, 6).map((item, index) => <div className="analytics-ranking" key={item.name}><b>{index + 1}</b><span>{item.name}</span><strong>{item.count} wins</strong></div>)}</article>
        </div>
        <div className="analytics-history"><header>Recent winners and circuit records</header><div>{insight.data.recentWinners.slice(0, 8).map((winner) => <span key={`${winner.season}-${winner.driver}`}><b>{winner.season}</b>{winner.driver}<small>{winner.team}</small></span>)}</div></div>
      </>}
    </div>
  );
};

const QualifyingPanel: React.FC<{ season: string }> = ({ season }) => {
  const { data, error, loading } = useJson<QualifyingData>(`${BACKEND_URL}/statistics/qualifying/${season}`);
  const [round, setRound] = useState(0);
  const selectedRound = round || data?.rounds.at(-1)?.round || 0;
  const selected = data?.rounds.find((item) => item.round === selectedRound) || data?.rounds.at(-1);
  if (loading) return <Loading />;
  if (error) return <Empty>{error}</Empty>;
  if (!selected) return <Empty>Qualifying deltas will appear after the first synced session.</Empty>;
  return (
    <div className="analytics-panel-body">
      <div className="analytics-toolbar"><div><span>One-lap performance</span><h3>Qualifying delta heatmap</h3></div><label className="analytics-select"><span>Round</span><select value={selected.round} onChange={(event) => setRound(Number(event.target.value))}>{data?.rounds.map((item) => <option key={item.round} value={item.round}>R{item.round} · {item.raceName}</option>)}</select></label></div>
      <div className="analytics-heatmap"><div className="analytics-heat-head"><span>Pos / driver</span><span>Q1 delta</span><span>Q2 delta</span><span>Q3 delta</span></div>{selected.drivers.map((driver) => <div className="analytics-heat-row" key={driver.driverNumber}><div><b>{driver.position}</b><span><strong>{driver.code}</strong><small>{driver.team}</small></span></div>{driver.sessions.map((session, index) => { const alpha = session.deltaMs === null ? 0 : Math.max(.08, 1 - Math.min(session.deltaMs, 2500) / 2800); return <span key={index} className={!session.time ? 'empty' : ''} style={session.time ? { background: `color-mix(in srgb, var(--racing-hot) ${Math.round(alpha * 70)}%, #101b29)` } : undefined}><b>{session.time || '—'}</b><small>{session.deltaMs === null ? '' : session.deltaMs === 0 ? 'FASTEST' : `+${(session.deltaMs / 1000).toFixed(3)}`}</small></span>; })}</div>)}</div>
    </div>
  );
};

const SpeedPanel: React.FC<{ season: string }> = ({ season }) => {
  const { data, error, loading } = useJson<SpeedData>(`${BACKEND_URL}/statistics/speed/${season}`);
  const winners = useMemo(() => data?.entries.filter((entry) => entry.rank === 1) || [], [data]);
  const maxSpeed = Math.max(1, ...winners.map((entry) => entry.speedKph || 0));
  if (loading) return <Loading />;
  if (error) return <Empty>{error}</Empty>;
  if (!winners.length) return <Empty>Fastest-lap data will appear after synced race results are available.</Empty>;
  return (
    <div className="analytics-panel-body">
      <div className="analytics-toolbar"><div><span>Peak race performance</span><h3>Season speed index</h3></div><small className="analytics-note">Fastest race lap at each round</small></div>
      <div className="analytics-speed-list">{winners.map((entry) => <div key={`${entry.round}-${entry.code}`}><span>R{entry.round}</span><div><strong>{entry.raceName}</strong><small>{entry.code} · Lap {entry.lap || '—'} · {entry.time || '—'}</small><i style={{ width: `${entry.speedKph ? entry.speedKph / maxSpeed * 100 : 12}%`, background: colorFor(entry.team) }} /></div><b>{entry.speedKph ? `${entry.speedKph.toFixed(1)} km/h` : entry.time || '—'}</b></div>)}</div>
    </div>
  );
};

const AnalyticsSuite: React.FC<{ season?: string }> = ({ season = '2026' }) => {
  const [tab, setTab] = useState<AnalyticsTab>('championship');
  const tabs: Array<[AnalyticsTab, string]> = [['championship', 'Championship'], ['circuits', 'Circuits'], ['qualifying', 'Qualifying'], ['speed', 'Speed index']];
  return (
    <section className="analytics-suite" aria-labelledby="analytics-suite-title">
      <header className="analytics-suite-head"><div><span>Jolpica intelligence · {season}</span><h2 id="analytics-suite-title">Performance analytics</h2><p>Official race, lap, qualifying and circuit records—turned into decision-ready signals.</p></div><nav>{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav></header>
      <div className="analytics-panel">
        {tab === 'championship' && <ChampionshipPanel season={season} />}
        {tab === 'circuits' && <CircuitPanel />}
        {tab === 'qualifying' && <QualifyingPanel season={season} />}
        {tab === 'speed' && <SpeedPanel season={season} />}
      </div>
    </section>
  );
};

export default AnalyticsSuite;
