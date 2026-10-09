import React, { useEffect, useMemo, useState } from 'react';
import { COUNTRY_FLAGS, fetchRaces, type Race } from '../data/races';
import type { AuthUser } from './Hero';
import SiteHeader from './SiteHeader';
import Footer from './Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ConstructorStanding {
  id: string;
  constructors_id: number;
  season: number;
  rounds: number;
  wins: number;
  points: number;
  name: string;
  position?: number;
}

interface SessionResult {
  driver_id?: string;
  given_name?: string;
  family_name?: string;
  code?: string;
  team_name?: string;
  constructor_name?: string;
  position?: string;
  points?: string;
  status?: string;
  grid?: string;
}

interface LapPositionsData {
  totalLaps: number;
  drivers: Record<string, Array<{ lap: number; position: number }>>;
}

type Weekend = {
  race: Race;
  results: SessionResult[];
  sprint: SessionResult[];
  qualifying: SessionResult[];
  lapsLed?: number;
  totalLaps?: number;
};

interface ConstructorDetailPageProps {
  season: string;
  constructorId: string;
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

const TEAM_CODES: Record<string, string> = {
  mercedes: 'MER', ferrari: 'FER', mclaren: 'MCL', redbull: 'RBR', williams: 'WIL',
  aston: 'AMR', alpine: 'ALP', haas: 'HAS', audi: 'AUD', cadillac: 'CAD', racingbulls: 'RB', sauber: 'SAU',
};

const TEAM_COUNTRIES: Record<string, string> = {
  mercedes: 'Germany', ferrari: 'Italy', mclaren: 'UK', redbull: 'Austria', williams: 'UK',
  aston: 'UK', alpine: 'France', haas: 'USA', audi: 'Germany', cadillac: 'USA', racingbulls: 'Italy', sauber: 'Switzerland',
};

const teamKey = (team = '') => {
  const compact = team.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
  if (compact.includes('mercedes')) return 'mercedes';
  if (compact.includes('ferrari')) return 'ferrari';
  if (compact.includes('mclaren')) return 'mclaren';
  if (compact.includes('redbull')) return 'redbull';
  if (compact.includes('williams')) return 'williams';
  if (compact.includes('astonmartin') || compact === 'aston') return 'aston';
  if (compact.includes('alpine')) return 'alpine';
  if (compact.includes('haas')) return 'haas';
  if (compact.includes('audi')) return 'audi';
  if (compact.includes('cadillac')) return 'cadillac';
  if (compact === 'rb' || compact.includes('rbf1team') || compact.includes('racingbulls') || compact.includes('visacashapp')) return 'racingbulls';
  if (compact.includes('sauber')) return 'sauber';
  return compact || 'team';
};

const routeTeamKey = (value: string) => teamKey(value);
const resultTeam = (result: SessionResult) => teamKey(result.team_name || result.constructor_name || '');
const compactRaceName = (race: Race) => race.raceName.replace(/ Grand Prix$/i, '');

const flagEmoji = (country: string) => {
  const extra: Record<string, string> = { Germany: 'de', Italy: 'it', France: 'fr', Switzerland: 'ch' };
  const code = COUNTRY_FLAGS[country] || extra[country];
  return code ? code.toUpperCase().replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0))) : '🏁';
};

const downloadIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/></svg>;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
};

const ConstructorDetailPage: React.FC<ConstructorDetailPageProps> = ({ season, constructorId, user, setUser, onBack, onOpenSettings, onHomeNavigate }) => {
  const [team, setTeam] = useState<ConstructorStanding | null>(null);
  const [weekends, setWeekends] = useState<Weekend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [response, allRaces] = await Promise.all([
          fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`, { signal: controller.signal }),
          fetchRaces(),
        ]);
        if (!response.ok) throw new Error('Constructor standings request failed');
        const standings = (await response.json() as ConstructorStanding[]).sort((a, b) => Number(b.points) - Number(a.points));
        const targetKey = routeTeamKey(constructorId);
        const match = standings.find((candidate) => teamKey(candidate.name) === targetKey)
          || standings.find((candidate) => String(candidate.constructors_id) === constructorId || candidate.id === constructorId);
        if (!match) throw new Error('Constructor not found');
        if (controller.signal.aborted) return;
        setTeam({ ...match, position: standings.indexOf(match) + 1 });
        setError(false);

        const races = allRaces.filter((race) => String(race.season) === season && Number(race.round) <= Number(match.rounds));
        const request = async (endpoint: string, race: Race) => {
          try {
            const result = await fetch(`${BACKEND_URL}/results/${endpoint}/${season}/${race.round}`, { signal: controller.signal });
            const payload = result.ok ? await result.json() : [];
            return Array.isArray(payload) ? payload as SessionResult[] : [];
          } catch (requestError) {
            if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError;
            return [];
          }
        };
        const requestLaps = async (race: Race) => {
          try {
            const result = await fetch(`${BACKEND_URL}/results/get-lap-positions/${season}/${race.round}`, { signal: controller.signal });
            if (!result.ok) return undefined;
            const payload = await result.json() as LapPositionsData;
            return payload?.drivers && payload.totalLaps > 0 ? payload : undefined;
          } catch (requestError) {
            if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError;
            return undefined;
          }
        };

        const loaded = await Promise.all(races.map(async (race) => {
          const [raceRows, sprintRows, qualifyingRows, lapData] = await Promise.all([
            request('get-all-results', race), request('get-all-sprint-results', race), request('get-all-qualifying-results', race), requestLaps(race),
          ]);
          const results = raceRows.filter((row) => resultTeam(row) === targetKey);
          const sprint = sprintRows.filter((row) => resultTeam(row) === targetKey);
          const qualifying = qualifyingRows.filter((row) => resultTeam(row) === targetKey);
          const driverIds = results.map((row) => row.driver_id).filter((id): id is string => !!id);
          const lapsLed = lapData ? driverIds.reduce((total, id) => {
            const laps = lapData.drivers[id] || Object.entries(lapData.drivers).find(([key]) => key.endsWith(`_${id}`))?.[1] || [];
            return total + laps.filter((point) => Number(point.position) === 1).length;
          }, 0) : undefined;
          return { race, results, sprint, qualifying, lapsLed, totalLaps: lapData?.totalLaps };
        }));
        if (!controller.signal.aborted) setWeekends(loaded);
      } catch (loadError) {
        if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) {
          console.error('Failed to load constructor profile', loadError);
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load(); return () => controller.abort();
  }, [constructorId, season]);

  const stats = useMemo(() => {
    let wins = 0, podiums = 0, poles = 0, retirements = 0, totalLapsLed = 0, cumulative = 0;
    const distribution = new Map<number, number>();
    const drivers = new Map<string, { id: string; name: string; code: string; points: number; wins: number; podiums: number }>();
    const progress: Array<{ round: number; points: number; label: string }> = [];
    weekends.forEach((weekend) => {
      [...weekend.results, ...weekend.sprint].forEach((row) => {
        const id = row.driver_id || `${row.given_name}|${row.family_name}`;
        const driver = drivers.get(id) || { id, name: [row.given_name, row.family_name].filter(Boolean).join(' '), code: row.code || row.family_name?.slice(0, 3).toUpperCase() || 'DRV', points: 0, wins: 0, podiums: 0 };
        driver.points += Number(row.points) || 0;
        if (weekend.results.includes(row)) {
          const position = Number(row.position);
          if (position > 0) distribution.set(position, (distribution.get(position) || 0) + 1);
          if (position === 1) { wins += 1; driver.wins += 1; }
          if (position > 0 && position <= 3) { podiums += 1; driver.podiums += 1; }
          const status = row.status?.toLowerCase() || '';
          if (status && !/finished|lap|running/.test(status)) retirements += 1;
        }
        drivers.set(id, driver);
      });
      cumulative += [...weekend.results, ...weekend.sprint].reduce((sum, row) => sum + (Number(row.points) || 0), 0);
      progress.push({ round: Number(weekend.race.round), points: cumulative, label: compactRaceName(weekend.race) });
      if (weekend.qualifying.some((row) => Number(row.position) === 1)) poles += 1;
      totalLapsLed += weekend.lapsLed || 0;
    });
    return { wins, podiums, poles, retirements, totalLapsLed, distribution, progress, drivers: [...drivers.values()].sort((a, b) => b.points - a.points) };
  }, [weekends]);

  const key = teamKey(team?.name || constructorId);
  const accent = TEAM_COLORS[key] || '#a855f7';
  const code = TEAM_CODES[key] || team?.name.slice(0, 3).toUpperCase() || 'F1';
  const maxPoints = Math.max(50, Number(team?.points) || 0, ...stats.progress.map((point) => point.points));
  const chartWidth = 900, chartHeight = 265, pad = { left: 42, right: 24, top: 22, bottom: 38 };
  const linePoints = stats.progress.map((point, index) => `${pad.left + index / Math.max(1, stats.progress.length - 1) * (chartWidth - pad.left - pad.right)},${pad.top + (1 - point.points / maxPoints) * (chartHeight - pad.top - pad.bottom)}`).join(' ');
  const maxDistribution = Math.max(1, ...stats.distribution.values());
  const maxRaceLaps = Math.max(1, ...weekends.map((weekend) => weekend.totalLaps || 0));
  const lapDataAvailable = weekends.some((weekend) => weekend.lapsLed !== undefined);

  return <div className="ddp-page cdp-page" style={{ '--driver-accent': accent } as React.CSSProperties}>
    <div className="ddp-page-header"><SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate} leftSlot={<button className="rd-back-btn dsp-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Constructors</button>}/></div>
    <main className="ddp-main">
      {loading ? <div className="ddp-loading"><span/>Building constructor telemetry…</div> : !team ? <section className="ddp-error"><span>Constructor unavailable</span><h1>{error ? "We couldn't load this profile." : 'Constructor not found.'}</h1><button onClick={onBack}>Return to standings</button></section> : <>
        <section className="ddp-hero cdp-hero"><div className="ddp-hero-copy"><span className="ddp-kicker"><i/> {season} constructor intelligence</span><div className="cdp-identity"><span>{code}</span><h1>{team.name}</h1></div><div className="ddp-driver-meta"><strong>{code}</strong><span>{flagEmoji(TEAM_COUNTRIES[key] || '')} {TEAM_COUNTRIES[key] || 'Formula 1'}</span><span>{stats.drivers.map((driver) => driver.code).join(' · ') || 'Driver lineup'}</span></div></div><div className="ddp-rank-card"><span>Championship position</span><strong>P{team.position}</strong><p>{team.points} <small>PTS</small></p><i>{team.wins} season wins</i></div></section>
        <section className="ddp-stat-grid">{[['Race wins', stats.wins || team.wins, 'Grand Prix victories'],['Podiums',stats.podiums,'Across both cars'],['Season points',team.points,`${stats.drivers.length} scoring drivers`],['Pole positions',stats.poles,stats.retirements?`${stats.retirements} retirements`:'No retirements']].map(([label,value,detail])=><article className="ddp-stat-card" key={label}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>)}</section>
        <div className="ddp-dashboard"><section className="ddp-panel ddp-progress-panel"><header><div><span>01 / Momentum</span><h2>Team points progression</h2></div><small>{stats.progress.length} rounds tracked</small></header>{stats.progress.length?<div className="ddp-line-wrap"><svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Constructor cumulative points by round">{[0,.25,.5,.75,1].map((ratio)=><line key={ratio} x1={pad.left} x2={chartWidth-pad.right} y1={pad.top+ratio*(chartHeight-pad.top-pad.bottom)} y2={pad.top+ratio*(chartHeight-pad.top-pad.bottom)}/>) }<polyline points={linePoints}/>{stats.progress.map((point,index)=>{const [cx,cy]=linePoints.split(' ')[index].split(',');return <circle key={point.round} cx={cx} cy={cy} r="4"><title>{point.label}: {point.points} points</title></circle>;})}</svg><div className="ddp-chart-foot"><span>Round 01</span><span>Round {String(stats.progress.at(-1)?.round||0).padStart(2,'0')}</span></div></div>:<p className="ddp-empty">Race data will appear after the first completed round.</p>}</section>
          <section className="ddp-panel ddp-distribution"><header><div><span>02 / Consistency</span><h2>Combined finishes</h2></div><small>Both cars</small></header><div className="ddp-position-bars">{Array.from({length:20},(_,index)=>index+1).map((position)=>{const count=stats.distribution.get(position)||0;return <div className="ddp-position-row" key={position}><span>P{position}</span><i><b style={{width:`${count/maxDistribution*100}%`}}/></i><strong>{count||'—'}</strong></div>;})}</div></section></div>
        <section className="ddp-panel cdp-drivers"><header><div><span>03 / Garage</span><h2>Driver contribution</h2></div><small>{stats.drivers.length} drivers</small></header><div className="cdp-driver-grid">{stats.drivers.map((driver)=><article key={driver.id}><span>{driver.code}</span><div><strong>{driver.name}</strong><small>{driver.wins} wins · {driver.podiums} podiums</small></div><b>{driver.points}<small> pts</small></b><i><em style={{width:`${team.points?driver.points/team.points*100:0}%`}}/></i></article>)}</div></section>
        <section className="ddp-panel ddp-laps-led"><header><div><span>04 / Track position</span><h2>Team laps led per race</h2></div><div className="ddp-laps-summary"><span><b>{stats.totalLapsLed}</b> laps led</span><button type="button" disabled={!lapDataAvailable} onClick={()=>downloadCsv(`pitwall-${season}-${code}-laps-led.csv`,[['Round','Grand Prix','Laps led','Race laps'],...weekends.map((weekend)=>[weekend.race.round,weekend.race.raceName,weekend.lapsLed??'Unavailable',weekend.totalLaps??'Unavailable'])])} aria-label="Download team laps led as CSV">{downloadIcon}</button></div></header>{lapDataAvailable?<div className="ddp-lap-bars">{weekends.map((weekend)=>{const led=weekend.lapsLed||0,total=weekend.totalLaps||0;return <div className="ddp-lap-row" key={weekend.race.round}><span className="ddp-lap-round">{String(weekend.race.round).padStart(2,'0')}</span><span className="ddp-lap-flag">{flagEmoji(weekend.race.Circuit.Location.country)}</span><span className="ddp-lap-race">{compactRaceName(weekend.race)}</span><div className="ddp-lap-track" title={`${compactRaceName(weekend.race)}: ${led} of ${total} laps led`}><i style={{width:`${total/maxRaceLaps*100}%`}}/><b className={led===0?'zero':''} style={{width:`${led/maxRaceLaps*100}%`}}>{led>0&&<em>{led}</em>}</b></div><strong>{weekend.lapsLed===undefined?'N/A':led}</strong></div>;})}</div>:<p className="ddp-empty">Lap-by-lap telemetry is not available for this season yet.</p>}</section>
        <section className="ddp-panel ddp-weekends"><header><div><span>05 / Race log</span><h2>Weekend by weekend</h2></div><small>Combined team result</small></header><div className="ddp-weekend-table cdp-weekend-table"><div className="ddp-weekend-head"><span>Rnd</span><span>Grand Prix</span><span>Best grid</span><span>Best finish</span><span>Points</span><span>Drivers</span></div>{[...weekends].reverse().map((weekend)=>{const rows=[...weekend.results,...weekend.sprint];const points=rows.reduce((sum,row)=>sum+(Number(row.points)||0),0);const bestFinish=Math.min(...weekend.results.map((row)=>Number(row.position)||99));const bestGrid=Math.min(...weekend.results.map((row)=>Number(row.grid)||99));return <div className="ddp-weekend-row" key={weekend.race.round}><span>{String(weekend.race.round).padStart(2,'0')}</span><strong>{flagEmoji(weekend.race.Circuit.Location.country)} {compactRaceName(weekend.race)}</strong><span>{bestGrid<99?`P${bestGrid}`:'—'}</span><span className={bestFinish<=3?'ddp-top-finish':''}>{bestFinish<99?`P${bestFinish}`:'—'}</span><span>{points}</span><small>{weekend.results.map((row)=>row.code||row.family_name).filter(Boolean).join(' · ')||'Awaiting result'}</small></div>;})}</div></section>
      </>}
    </main><Footer/>
  </div>;
};

export default ConstructorDetailPage;
