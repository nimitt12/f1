import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRaces, type Race } from '../data/races';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';
import DriverBattle from './DriverBattle';
import Loader from './Loader';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ClashPageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
  initialDriverIds?: [string, string] | null;
}

interface ConstructorRanking {
  id: string;
  constructors_id: number;
  season: number;
  rounds: number;
  wins: number;
  points: number;
  name: string;
}

interface DriverRanking {
  driver_id: string;
  given_name: string;
  family_name: string;
  constructor_name: string;
  podiums: string;
  points: string;
  code?: string;
  season?: string;
}

interface SessionResult {
  driver_id?: string;
  given_name?: string;
  family_name?: string;
  points?: string;
  position?: string;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
}

interface GapPoint {
  round: number;
  race: string;
  firstPoints: number;
  secondPoints: number;
  firstTotal: number;
  secondTotal: number;
  cumulativeGap: number;
  roundGap: number;
  firstSps: number;
  secondSps: number;
  firstTms: number;
  secondTms: number;
}

interface QualifyingDelta {
  round: number;
  race: string;
  delta: number;
}

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27e5cf', ferrari: '#ff173d', mclaren: '#ff8700', redbull: '#6378ff',
  williams: '#2496ff', aston: '#18b89f', alpine: '#1d9ee0', haas: '#d5d9df',
  audi: '#f12c4c', cadillac: '#aab4c4', racingbulls: '#6c9cff', sauber: '#52e252',
};

const teamKey = (team = '') => {
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
  if (name.includes('racing bulls') || name === 'rb' || name.includes('visa cash')) return 'racingbulls';
  if (name.includes('sauber')) return 'sauber';
  return name.replace(/[^a-z0-9]+/g, '') || 'team';
};

const driverIdentity = (row: Pick<SessionResult, 'driver_id' | 'given_name' | 'family_name'>) =>
  row.driver_id || `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase();

const downloadIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/></svg>;

const lapSeconds = (time?: string | null) => {
  if (!time) return null;
  const parts = time.trim().split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0];
};

const DriverPointsGapGraph: React.FC<{ driverIds: [string, string] | null }> = ({ driverIds }) => {
  const [drivers, setDrivers] = useState<DriverRanking[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [points, setPoints] = useState<GapPoint[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingDelta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!driverIds) return;
    const controller = new AbortController();
    const loadResults = async (endpoint: string, race: Race) => {
      try {
        const response = await fetch(`${BACKEND_URL}/results/${endpoint}/${race.season}/${race.round}`, { signal: controller.signal });
        const data = response.ok ? await response.json() : [];
        return Array.isArray(data) ? data as SessionResult[] : [];
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError;
        return [];
      }
    };
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const [rankingResponse, raceList] = await Promise.all([
          fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`, { signal: controller.signal }),
          fetchRaces(),
        ]);
        if (!rankingResponse.ok) throw new Error('Driver rankings request failed');
        const rankingData = await rankingResponse.json();
        if (!Array.isArray(rankingData)) throw new Error('Invalid driver rankings response');
        const rankingDrivers = rankingData as DriverRanking[];
        const pair = driverIds.map((id) => rankingDrivers.find((driver) => driver.driver_id === id));
        if (!pair[0] || !pair[1]) throw new Error('Selected drivers unavailable');
        const selectedSeason = pair[0].season || String(raceList[0]?.season || new Date().getFullYear());
        const seasonRaces = raceList.filter((race) => String(race.season) === String(selectedSeason));
        const completed = seasonRaces.filter((race) => Date.now() > new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime() + 2.75 * 60 * 60 * 1000);
        const loaded = await Promise.all(completed.map(async (race) => {
          const [raceRows, sprintRows, qualifyingRows] = await Promise.all([
            loadResults('get-all-results', race),
            race.Sprint ? loadResults('get-all-sprint-results', race) : Promise.resolve([]),
            loadResults('get-all-qualifying-results', race),
          ]);
          return { race, raceRows, sprintRows, qualifyingRows };
        }));
        let firstTotal = 0;
        let secondTotal = 0;
        let firstScoreTotal = 0;
        let secondScoreTotal = 0;
        const aliases = pair.map((driver) => `${driver!.given_name}|${driver!.family_name}`.toLowerCase());
        const isDriver = (row: SessionResult, id: string, alias: string) => driverIdentity(row) === id || `${row.given_name || ''}|${row.family_name || ''}`.toLowerCase() === alias;
        const history = loaded.map(({ race, raceRows, sprintRows }, index) => {
          const rows = [...raceRows, ...sprintRows];
          const roundPoints = driverIds.map((id, index) => rows
            .filter((row) => isDriver(row, id, aliases[index]))
            .reduce((sum, row) => sum + (Number(row.points) || 0), 0));
          const positions = driverIds.map((id, driverIndex) => Number(raceRows.find((row) => isDriver(row, id, aliases[driverIndex]))?.position) || 20);
          firstTotal += roundPoints[0];
          secondTotal += roundPoints[1];
          firstScoreTotal += Math.max(0, 105 - positions[0] * 5) * .55 + Math.min(roundPoints[0] / 25, 1) * 45;
          secondScoreTotal += Math.max(0, 105 - positions[1] * 5) * .55 + Math.min(roundPoints[1] / 25, 1) * 45;
          const combined = firstTotal + secondTotal;
          return { round: Number(race.round), race: race.raceName, firstPoints: roundPoints[0], secondPoints: roundPoints[1], firstTotal, secondTotal, cumulativeGap: firstTotal - secondTotal, roundGap: roundPoints[0] - roundPoints[1], firstSps: firstScoreTotal / (index + 1), secondSps: secondScoreTotal / (index + 1), firstTms: combined ? firstTotal / combined * 100 : 50, secondTms: combined ? secondTotal / combined * 100 : 50 };
        });
        const qualifyingHistory = loaded.flatMap(({ race, qualifyingRows }) => {
          const rows = driverIds.map((id, index) => qualifyingRows.find((row) => isDriver(row, id, aliases[index])));
          if (!rows[0] || !rows[1]) return [];
          const phase = rows[0].q3 && rows[1].q3 ? 'q3' : rows[0].q2 && rows[1].q2 ? 'q2' : 'q1';
          const firstTime = lapSeconds(rows[0][phase]);
          const secondTime = lapSeconds(rows[1][phase]);
          return firstTime == null || secondTime == null ? [] : [{ round: Number(race.round), race: race.raceName, delta: firstTime - secondTime }];
        });
        if (!controller.signal.aborted) { setDrivers(pair as DriverRanking[]); setRaces(seasonRaces); setPoints(history); setQualifying(qualifyingHistory); }
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [driverIds]);

  if (!driverIds || loading) return <div className="clash-graph-state"><Loader label="Building points gap" /></div>;
  if (error || drivers.length < 2 || !points.length) return <div className="clash-graph-state clash-state-error">Points history will appear when completed-round data is available.</div>;

  const [first, second] = drivers;
  const firstColor = TEAM_COLORS[teamKey(first.constructor_name)] || '#2de2cd';
  const secondColor = TEAM_COLORS[teamKey(second.constructor_name)] || '#f3f5f8';
  const width = Math.max(1120, races.length * 48);
  const left = 62;
  const right = 26;
  const chartWidth = width - left - right;
  const roundCount = Math.max(2, races.length);
  const x = (round: number) => left + ((round - 1) / (roundCount - 1)) * chartWidth;
  const maxPoints = Math.max(50, ...points.flatMap((point) => [point.firstTotal, point.secondTotal]));
  const pointsTop = Math.ceil(maxPoints / 50) * 50;
  const lineHeight = 390;
  const lineTop = 24;
  const lineBottom = 48;
  const lineY = (value: number) => lineTop + (lineHeight - lineTop - lineBottom) * (1 - value / pointsTop);
  const lineTicks = Array.from({ length: 6 }, (_, index) => pointsTop * index / 5);
  const linePath = (key: 'firstTotal' | 'secondTotal') => points.map((point, index) => `${index ? 'L' : 'M'} ${x(point.round)} ${lineY(point[key])}`).join(' ');
  const gapLimit = Math.max(25, Math.ceil(Math.max(...points.flatMap((point) => [Math.abs(point.cumulativeGap), Math.abs(point.roundGap)])) / 25) * 25);

  const renderBars = (key: 'cumulativeGap' | 'roundGap', label: string, height: number) => {
    const top = 30;
    const bottom = 48;
    const plotHeight = height - top - bottom;
    const zeroY = top + plotHeight / 2;
    const barWidth = Math.min(36, chartWidth / roundCount * .72);
    const ticks = [-gapLimit, -gapLimit / 2, 0, gapLimit / 2, gapLimit];
    const barY = (value: number) => zeroY - value / gapLimit * plotHeight / 2;
    return <section className="clash-gap-subchart"><h3>{label}</h3><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {ticks.map((tick) => <g key={tick}><line x1={left} x2={width-right} y1={barY(tick)} y2={barY(tick)} className={tick === 0 ? 'gap-zero' : 'gap-grid'} /><text x={left-14} y={barY(tick)+4} textAnchor="end" className="gap-axis">{tick}</text></g>)}
      {races.map((race) => <text key={race.round} x={x(Number(race.round))} y={height-13} textAnchor="middle" className="gap-round">{race.round}</text>)}
      {points.map((point) => { const value = point[key]; const y = Math.min(zeroY, barY(value)); const barHeight = Math.abs(barY(value)-zeroY); return <g key={point.round}><rect x={x(point.round)-barWidth/2} y={y} width={barWidth} height={Math.max(2,barHeight)} fill={value >= 0 ? firstColor : secondColor}><title>{point.race}: {value > 0 ? '+' : ''}{value}</title></rect><text x={x(point.round)} y={value >= 0 ? y-8 : y+barHeight+16} textAnchor="middle" className="gap-value">{value > 0 ? '+' : ''}{value}</text></g>; })}
    </svg></section>;
  };

  const scorePath = (key: 'firstSps' | 'secondSps' | 'firstTms' | 'secondTms', scoreX: (round: number) => number, scoreY: (value: number) => number) =>
    points.map((point, index) => `${index ? 'L' : 'M'} ${scoreX(point.round)} ${scoreY(point[key])}`).join(' ');

  const renderScoreChart = (firstKey: 'firstSps' | 'firstTms', secondKey: 'secondSps' | 'secondTms', label: string) => {
    const height = 330;
    const top = 24;
    const bottom = 35;
    const plotHeight = height - top - bottom;
    const scoreX = (round: number) => left + ((round - 1) / (roundCount - 1)) * chartWidth;
    const scoreY = (value: number) => top + (100 - value) / 100 * plotHeight;
    const bands = [{ from: 90, to: 100, cls: 's' }, { from: 78, to: 90, cls: 'a' }, { from: 65, to: 78, cls: 'b' }, { from: 50, to: 65, cls: 'c' }, { from: 35, to: 50, cls: 'd' }, { from: 0, to: 35, cls: 'f' }];
    const ticks = [0, 35, 50, 65, 78, 90, 100];
    return <section className="clash-score-chart"><h3>{label}</h3><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      {bands.map((band) => <rect key={band.cls} x={left} y={scoreY(band.to)} width={chartWidth} height={scoreY(band.from)-scoreY(band.to)} className={`score-band score-band-${band.cls}`} />)}
      {ticks.map((tick) => <g key={tick}><line x1={left} x2={width-right} y1={scoreY(tick)} y2={scoreY(tick)} className="score-grid"/><text x={left-14} y={scoreY(tick)+4} textAnchor="end" className="gap-axis">{tick}</text></g>)}
      {bands.map((band) => <text key={band.cls} x={width-right+14} y={scoreY((band.from+band.to)/2)+4} className={`score-grade score-grade-${band.cls}`}>{band.cls.toUpperCase()}</text>)}
      <path d={scorePath(firstKey,scoreX,scoreY)} stroke={firstColor} className="gap-line"/><path d={scorePath(secondKey,scoreX,scoreY)} stroke={secondColor} className="gap-line"/>
      {points.map((point) => <g key={point.round}><circle cx={scoreX(point.round)} cy={scoreY(point[firstKey])} r="3.5" fill={firstColor}><title>{point.race}: {point[firstKey].toFixed(1)}</title></circle><circle cx={scoreX(point.round)} cy={scoreY(point[secondKey])} r="3.5" fill={secondColor}><title>{point.race}: {point[secondKey].toFixed(1)}</title></circle></g>)}
    </svg></section>;
  };

  const averageDelta = qualifying.length ? qualifying.reduce((sum, item) => sum + item.delta, 0) / qualifying.length : 0;
  const firstQualiWins = qualifying.filter((item) => item.delta < 0).length;
  const secondQualiWins = qualifying.filter((item) => item.delta > 0).length;
  const deltaLimit = Math.max(.5, Math.ceil(Math.max(.01, ...qualifying.map((item) => Math.abs(item.delta))) * 2) / 2);
  const qualiWidth = 1120;
  const qualiLeft = 80;
  const qualiRight = 80;
  const deltaX = (value: number) => qualiLeft + (value + deltaLimit) / (deltaLimit * 2) * (qualiWidth - qualiLeft - qualiRight);

  const downloadCsv = () => {
    const rows = [['Round','Grand Prix',`${first.family_name} points`,`${second.family_name} points`,`${first.family_name} total`,`${second.family_name} total`,'Cumulative gap','Round gap',`${first.family_name} SPS`,`${second.family_name} SPS`,`${first.family_name} TMS`,`${second.family_name} TMS`], ...points.map((point) => [point.round,point.race,point.firstPoints,point.secondPoints,point.firstTotal,point.secondTotal,point.cumulativeGap,point.roundGap,point.firstSps.toFixed(2),point.secondSps.toFixed(2),point.firstTms.toFixed(2),point.secondTms.toFixed(2)])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `pitwall-${first.family_name}-${second.family_name}-points-gap.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  return <div className="clash-analytics" style={{ '--gap-first': firstColor, '--gap-second': secondColor } as React.CSSProperties}><section className="clash-gap-panel">
    <header><div><span>Round-by-round telemetry</span><h2>{first.family_name} vs {second.family_name} points gap</h2></div><button onClick={downloadCsv} title="Download graph data" aria-label="Download points gap data as CSV">{downloadIcon}</button></header>
    <div className="clash-gap-legend"><span><i style={{ background: firstColor }} />{first.given_name} {first.family_name}</span><span><i style={{ background: secondColor }} />{second.given_name} {second.family_name}</span></div>
    <div className="clash-gap-scroll">
      <section className="clash-gap-line"><svg viewBox={`0 0 ${width} ${lineHeight}`} role="img" aria-label={`${first.family_name} and ${second.family_name} cumulative points`}>
        {lineTicks.map((tick) => <g key={tick}><line x1={left} x2={width-right} y1={lineY(tick)} y2={lineY(tick)} className="gap-grid"/><text x={left-14} y={lineY(tick)+4} textAnchor="end" className="gap-axis">{tick}</text></g>)}
        <path d={linePath('firstTotal')} stroke={firstColor} className="gap-line"/><path d={linePath('secondTotal')} stroke={secondColor} className="gap-line"/>
        {points.map((point) => <g key={point.round}><circle cx={x(point.round)} cy={lineY(point.firstTotal)} r="3.6" fill={firstColor}><title>{point.race}: {point.firstTotal}</title></circle><circle cx={x(point.round)} cy={lineY(point.secondTotal)} r="3.6" fill={secondColor}><title>{point.race}: {point.secondTotal}</title></circle></g>)}
      </svg></section>
      {renderBars('cumulativeGap', 'Cumulative gap', 290)}
      {renderBars('roundGap', 'Points gap per round', 300)}
      <div className="clash-gap-axis-title">Rounds</div>
    </div>
  </section>
  <section className="clash-score-panel">
    <header><div><span>Calculated form index</span><h2>{first.family_name} vs {second.family_name} score evolution</h2><p>Season Performance Score combines results and points; Teammate Score shows each driver's share of the selected head-to-head.</p></div><button onClick={downloadCsv} title="Download score data" aria-label="Download score evolution data as CSV">{downloadIcon}</button></header>
    <div className="clash-score-help"><span>?</span> Scores</div>
    <div className="clash-gap-legend"><span><i style={{ background: firstColor }}/>{first.code || first.family_name.slice(0,3)}</span><span><i style={{ background: secondColor }}/>{second.code || second.family_name.slice(0,3)}</span></div>
    <div className="clash-score-scroll">{renderScoreChart('firstSps','secondSps','Season Performance Score (SPS)')}{renderScoreChart('firstTms','secondTms','Teammate Score (TMS)')}</div>
  </section>
  <section className="clash-quali-panel">
    <header><div><span>Qualifying pace</span><h2>One-lap delta distribution</h2></div><strong>{qualifying.length} comparable sessions</strong></header>
    {qualifying.length ? <>
      <div className="quali-versus-head"><div><b>{firstQualiWins}</b><span style={{ color: firstColor }}>{first.code || first.family_name.slice(0,3).toUpperCase()}</span><small className={averageDelta <= 0 ? 'faster' : 'slower'}>{averageDelta > 0 ? '+' : ''}{averageDelta.toFixed(3)}s</small></div><em>VS</em><div><span style={{ color: secondColor }}>{second.code || second.family_name.slice(0,3).toUpperCase()}</span><b>{secondQualiWins}</b><small className={averageDelta >= 0 ? 'faster' : 'slower'}>{averageDelta < 0 ? '+' : ''}{(-averageDelta).toFixed(3)}s</small></div></div>
      <div className="quali-delta-scroll"><svg viewBox={`0 0 ${qualiWidth} 150`} role="img" aria-label="Qualifying time delta by round"><defs><pattern id="quali-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><line x1="0" y1="0" x2="0" y2="8" stroke="#34445a" strokeWidth="3"/></pattern></defs><rect x={qualiLeft} y="20" width={qualiWidth-qualiLeft-qualiRight} height="85" rx="10" className="quali-track"/><rect x={qualiLeft} y="20" width="90" height="85" rx="10" fill="url(#quali-hatch)"/><rect x={qualiWidth-qualiRight-90} y="20" width="90" height="85" rx="10" fill="url(#quali-hatch)"/><line x1={deltaX(0)} x2={deltaX(0)} y1="20" y2="105" className="quali-center"/>{[-deltaLimit,-deltaLimit/2,0,deltaLimit/2,deltaLimit].map((tick) => <g key={tick}><line x1={deltaX(tick)} x2={deltaX(tick)} y1="20" y2="105" className="quali-tick"/><text x={deltaX(tick)} y="132" textAnchor="middle" className="gap-axis">{Math.abs(tick).toFixed(1)}s</text></g>)}{qualifying.map((item,index) => <circle key={item.round} cx={deltaX(item.delta)} cy={47+(index%3)*15} r="9" fill={item.delta <= 0 ? firstColor : secondColor} className="quali-dot"><title>{item.race}: {item.delta > 0 ? '+' : ''}{item.delta.toFixed(3)}s</title></circle>)}</svg></div>
    </> : <p className="quali-empty">Comparable qualifying lap times are not available yet.</p>}
  </section></div>;
};

const ConstructorClash: React.FC = () => {
  const [constructors, setConstructors] = useState<ConstructorRanking[]>([]);
  const [drivers, setDrivers] = useState<DriverRanking[]>([]);
  const [selected, setSelected] = useState<[string, string] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`, { signal: controller.signal }),
      fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`, { signal: controller.signal }),
    ]).then(async ([constructorResponse, driverResponse]) => {
      if (!constructorResponse.ok || !driverResponse.ok) throw new Error('Clash data request failed');
      const [constructorData, driverData] = await Promise.all([constructorResponse.json(), driverResponse.json()]);
      if (!Array.isArray(constructorData) || !Array.isArray(driverData)) throw new Error('Invalid clash data');
      const sorted = [...constructorData].sort((a, b) => Number(b.points) - Number(a.points)) as ConstructorRanking[];
      setConstructors(sorted);
      setDrivers(driverData as DriverRanking[]);
      if (sorted.length >= 2) setSelected([String(sorted[0].constructors_id), String(sorted[1].constructors_id)]);
    }).catch((requestError) => {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  const [team1, team2] = useMemo(() => {
    if (!selected) return [undefined, undefined];
    return selected.map((id) => constructors.find((team) => String(team.constructors_id) === id));
  }, [constructors, selected]);

  const details = (team: ConstructorRanking | undefined) => {
    if (!team) return { color: '#fff', position: 0, podiums: 0, lineup: [] as DriverRanking[] };
    const lineup = drivers.filter((driver) => teamKey(driver.constructor_name) === teamKey(team.name));
    return {
      color: TEAM_COLORS[teamKey(team.name)] || '#aab4c4',
      position: constructors.findIndex((item) => item.constructors_id === team.constructors_id) + 1,
      podiums: lineup.reduce((total, driver) => total + (Number(driver.podiums) || 0), 0),
      lineup,
    };
  };

  if (loading) return <div className="clash-state"><Loader label="Loading constructor clash" /></div>;
  if (error || !team1 || !team2 || !selected) return <div className="clash-state clash-state-error">Constructor comparison is unavailable right now.</div>;

  const info1 = details(team1);
  const info2 = details(team2);
  const gap = Math.abs(Number(team1.points) - Number(team2.points));
  const metrics = [
    { label: 'Championship points', a: Number(team1.points), b: Number(team2.points) },
    { label: 'Grand Prix wins', a: Number(team1.wins), b: Number(team2.wins) },
    { label: 'Driver podiums', a: info1.podiums, b: info2.podiums },
    { label: 'Rounds contested', a: Number(team1.rounds), b: Number(team2.rounds) },
  ];

  const renderTeam = (team: ConstructorRanking, info: ReturnType<typeof details>, side: 'left' | 'right') => (
    <article className={`constructor-clash-card ${side}`} style={{ '--clash-color': info.color } as React.CSSProperties}>
      <div className="constructor-clash-rank"><small>Championship</small><strong>P{info.position}</strong></div>
      <div className="constructor-clash-identity"><span>{teamKey(team.name).slice(0, 3).toUpperCase()}</span><h2>{team.name}</h2><p>{team.season} constructor</p></div>
      <div className="constructor-clash-score"><strong>{team.points}</strong><span>Points</span></div>
      <div className="constructor-clash-lineup">
        <small>Driver lineup</small>
        {info.lineup.length ? info.lineup.map((driver) => <span key={driver.driver_id}>{driver.given_name} <b>{driver.family_name}</b></span>) : <span>Lineup unavailable</span>}
      </div>
    </article>
  );

  return <section className="constructor-clash" aria-label="Constructor comparison">
    <div className="constructor-clash-selectors">
      {[0, 1].map((side) => <label key={side}><span>Constructor {side + 1}</span><select value={selected[side]} onChange={(event) => setSelected((current) => current ? (side === 0 ? [event.target.value, current[1]] : [current[0], event.target.value]) : current)}>{constructors.map((team) => <option key={team.constructors_id} value={String(team.constructors_id)} disabled={selected[side === 0 ? 1 : 0] === String(team.constructors_id)}>{team.name}</option>)}</select></label>)}
    </div>
    <div className="constructor-clash-stage">
      {renderTeam(team1, info1, 'left')}
      <div className="constructor-clash-vs"><b>VS</b><span>{gap}</span><small>PTS GAP</small></div>
      {renderTeam(team2, info2, 'right')}
    </div>
    <div className="constructor-clash-metrics" style={{ '--team-a': info1.color, '--team-b': info2.color } as React.CSSProperties}>
      <header><span>Season comparison</span><strong>{team1.name} / {team2.name}</strong></header>
      {metrics.map((metric) => {
        const max = Math.max(metric.a, metric.b, 1);
        return <div className="constructor-metric" key={metric.label}><b>{metric.a}</b><div className="constructor-metric-bar left"><i style={{ width: `${metric.a / max * 100}%` }} /></div><span>{metric.label}</span><div className="constructor-metric-bar right"><i style={{ width: `${metric.b / max * 100}%` }} /></div><b>{metric.b}</b></div>;
      })}
    </div>
  </section>;
};

const ClashPage: React.FC<ClashPageProps> = ({ user, setUser, onBack, onOpenSettings, onHomeNavigate, initialDriverIds }) => {
  const [mode, setMode] = useState<'drivers' | 'constructors'>('drivers');
  const [driverIds, setDriverIds] = useState<[string, string] | null>(initialDriverIds || null);
  const handleDriverSelection = useCallback((ids: [string, string]) => {
    setDriverIds(ids);
    const params = new URLSearchParams({ driver1: ids[0], driver2: ids[1] });
    window.history.replaceState({}, '', `/clash?${params.toString()}`);
  }, []);
  return <div className="dsp-page clash-page">
    <div className="dsp-page-header"><SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate} leftSlot={<button className="rd-back-btn dsp-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>Dashboard</button>} /></div>
    <main className="clash-main">
      <header className="clash-hero"><div><span>Head-to-head laboratory</span><h1>Clash <em>Center</em></h1><p>Put the grid side by side. Compare championship form, wins, podiums and the numbers separating this season's fiercest rivals.</p></div><div className="clash-mode-switch" role="tablist" aria-label="Comparison type"><button className={mode === 'drivers' ? 'active' : ''} onClick={() => setMode('drivers')} role="tab" aria-selected={mode === 'drivers'}>Drivers</button><button className={mode === 'constructors' ? 'active' : ''} onClick={() => setMode('constructors')} role="tab" aria-selected={mode === 'constructors'}>Constructors</button></div></header>
      {mode === 'drivers' ? <><DriverBattle initialDriverIds={initialDriverIds} onSelectionChange={handleDriverSelection} showMoreButton={false} /><DriverPointsGapGraph driverIds={driverIds} /></> : <ConstructorClash />}
    </main>
    <Footer />
  </div>;
};

export default ClashPage;
