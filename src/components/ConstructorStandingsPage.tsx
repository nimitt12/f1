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
}

interface SessionResult {
  team_name?: string;
  constructor_name?: string;
  position?: string;
  points?: string;
  status?: string;
}

interface ConstructorStandingsPageProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  onBack: () => void;
  onOpenSettings: () => void;
  onHomeNavigate: (hash: string) => void;
}

type HistoryPoint = { round: number; points: number; rank: number };
type RoundData = { race: SessionResult[]; sprint: SessionResult[]; qualifying: SessionResult[] };
type ConstructorSeries = ConstructorStanding & { history: HistoryPoint[]; color: string; key: string };
type ChartMode = 'points' | 'rank';

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#27e5cf', ferrari: '#ff173d', mclaren: '#ff8700', redbull: '#6378ff',
  williams: '#2496ff', aston: '#18b89f', alpine: '#1d9ee0', haas: '#d5d9df',
  audi: '#f12c4c', cadillac: '#aab4c4', racingbulls: '#6c9cff', sauber: '#52e252',
};

const TEAM_CODES: Record<string, string> = {
  mercedes: 'MER', ferrari: 'FER', mclaren: 'MCL', redbull: 'RBR', williams: 'WIL',
  aston: 'AMR', alpine: 'ALP', haas: 'HAS', audi: 'AUD', cadillac: 'CAD', racingbulls: 'RB', sauber: 'SAU',
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

const resultTeam = (result: SessionResult) => teamKey(result.team_name || result.constructor_name || '');

const flagEmoji = (country: string) => {
  const code = COUNTRY_FLAGS[country];
  if (!code) return '🏁';
  return code.toUpperCase().replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
};

const downloadIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/></svg>;

const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const ConstructorEvolutionChart: React.FC<{
  mode: ChartMode;
  teams: ConstructorSeries[];
  races: Race[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}> = ({ mode, teams, races, selected, onSelect }) => {
  const width = 1120;
  const height = 430;
  const pad = { left: 62, right: 34, top: 28, bottom: 58 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const roundCount = Math.max(2, races.length);
  const maxPoints = Math.max(50, ...teams.flatMap((team) => team.history.map((point) => point.points)));
  const roundedMax = Math.ceil(maxPoints / 50) * 50;
  const maxRank = Math.max(2, teams.length);
  const x = (round: number) => pad.left + ((round - 1) / (roundCount - 1)) * chartWidth;
  const y = (value: number) => mode === 'points' ? pad.top + chartHeight - (value / roundedMax) * chartHeight : pad.top + ((value - 1) / (maxRank - 1)) * chartHeight;
  const ticks = mode === 'points' ? Array.from({ length: 6 }, (_, index) => roundedMax / 5 * index) : Array.from({ length: maxRank }, (_, index) => index + 1);
  const pathFor = (history: HistoryPoint[]) => history.map((point, index) => `${index ? 'L' : 'M'} ${x(point.round).toFixed(1)} ${y(mode === 'points' ? point.points : point.rank).toFixed(1)}`).join(' ');

  return <div className="dsp-chart-scroll"><svg className="dsp-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Constructor ${mode} evolution by round`}>
    {ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="dsp-gridline"/><text x={pad.left - 15} y={y(tick) + 4} textAnchor="end" className="dsp-axis-label">{mode === 'rank' ? `P${tick}` : tick}</text></g>)}
    {races.map((race, index) => {
      const round = Number(race.round);
      const show = races.length <= 12 || index % 2 === 0 || index === races.length - 1;
      return <g key={race.round}>{show && <line x1={x(round)} x2={x(round)} y1={pad.top} y2={height - pad.bottom} className="dsp-gridline dsp-gridline-vertical"/>}<text x={x(round)} y={height - 24} textAnchor="middle" className="dsp-race-label">{show ? flagEmoji(race.Circuit.Location.country) : '·'}</text>{show && <text x={x(round)} y={height - 7} textAnchor="middle" className="dsp-round-label">R{round}</text>}</g>;
    })}
    {teams.map((team) => <g key={team.key} className={`dsp-series ${!selected || selected === team.key ? 'active' : 'muted'}`} onClick={() => onSelect(selected === team.key ? null : team.key)}>
      <path d={pathFor(team.history)} stroke={team.color} className="dsp-series-line dsp-series-hit"/><path d={pathFor(team.history)} stroke={team.color} className="dsp-series-line"/>
      {team.history.map((point) => <circle key={point.round} cx={x(point.round)} cy={y(mode === 'points' ? point.points : point.rank)} r={selected === team.key ? 4.2 : 2.8} fill={team.color}/>)}</g>)}
  </svg></div>;
};

const ConstructorStatsChart: React.FC<{
  teams: ConstructorSeries[];
  rounds: Record<string, RoundData>;
  selected: string | null;
  onSelect: (key: string | null) => void;
  season: string;
}> = ({ teams, rounds, selected, onSelect, season }) => {
  const stats = useMemo(() => teams.map((team) => {
    let wins = 0, podiums = 0, pointsFinishes = 0, poles = 0, retirements = 0;
    Object.values(rounds).forEach((round) => {
      round.race.filter((result) => resultTeam(result) === team.key).forEach((result) => {
        const position = Number(result.position);
        if (position === 1) wins += 1;
        if (position > 0 && position <= 3) podiums += 1;
        if ((Number(result.points) || 0) > 0) pointsFinishes += 1;
        const status = result.status?.toLowerCase() || '';
        if (status && !/finished|lap|running/.test(status)) retirements += 1;
      });
      if (round.qualifying.some((result) => resultTeam(result) === team.key && Number(result.position) === 1)) poles += 1;
    });
    return { key: team.key, name: team.name, code: TEAM_CODES[team.key] || team.name.slice(0, 3).toUpperCase(), wins, podiums, pointsFinishes, poles, retirements };
  }), [rounds, teams]);
  const metrics = [
    { key: 'wins', label: 'Wins', color: '#ffd34e' }, { key: 'podiums', label: 'Podiums', color: '#287be0' },
    { key: 'pointsFinishes', label: 'Points finishes', color: '#cbd0d7' }, { key: 'poles', label: 'Pole positions', color: '#bd2bd4' },
  ] as const;
  const width = Math.max(1120, stats.length * 86 + 100), height = 500, baseline = 365;
  const pad = { left: 52, right: 24, top: 72, bottom: 72 };
  const positiveMax = Math.max(5, ...stats.flatMap((stat) => metrics.map((metric) => stat[metric.key])));
  const positiveTop = Math.ceil(positiveMax / 5) * 5;
  const negativeBottom = Math.max(2, Math.ceil(Math.max(...stats.map((stat) => stat.retirements)) / 2) * 2);
  const groupWidth = (width - pad.left - pad.right) / Math.max(1, stats.length), barWidth = Math.min(13, groupWidth / 6);
  const yPositive = (value: number) => baseline - value / positiveTop * (baseline - pad.top);
  const yNegative = (value: number) => baseline + value / negativeBottom * (height - pad.bottom - baseline);
  const ticks = [...Array.from({ length: Math.floor(positiveTop / 2) + 1 }, (_, index) => index * 2), ...Array.from({ length: negativeBottom / 2 }, (_, index) => -(index + 1) * 2)];

  return <section className="dsp-chart-panel dsp-wide-panel" aria-labelledby="csp-stats-title">
    <header className="dsp-panel-head"><div><span>04 / Performance</span><h2 id="csp-stats-title">Constructor season stats</h2></div><button className="dsp-download" onClick={() => downloadCsv(`pitwall-${season}-constructor-stats.csv`, [['Constructor','Wins','Podiums','Points finishes','Poles','DNF/DNS/DSQ'], ...stats.map((stat) => [stat.name,stat.wins,stat.podiums,stat.pointsFinishes,stat.poles,stat.retirements])])} aria-label="Download constructor statistics as CSV">{downloadIcon}</button></header>
    <div className="dsp-stat-legend">{metrics.map((metric) => <span key={metric.key}><i style={{ background: metric.color }}/>{metric.label}</span>)}<span><i style={{ background: '#ef1818' }}/>DNF / DNS / DSQ</span></div>
    <div className="dsp-chart-scroll dsp-stat-scroll"><svg className="dsp-chart dsp-stat-chart csp-stat-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Constructor season performance statistics">
      {ticks.map((tick) => { const y = tick >= 0 ? yPositive(tick) : yNegative(Math.abs(tick)); return <g key={tick}><line x1={pad.left} x2={width-pad.right} y1={y} y2={y} className={`dsp-gridline ${tick === 0 ? 'dsp-zero-line' : ''}`}/><text x={pad.left-12} y={y+4} textAnchor="end" className="dsp-axis-label">{tick}</text></g>; })}
      {stats.map((stat, index) => { const center = pad.left + groupWidth * index + groupWidth / 2; return <g key={stat.key} className={`dsp-stat-group ${!selected || selected === stat.key ? '' : 'muted'}`} onClick={() => onSelect(selected === stat.key ? null : stat.key)}>
        {metrics.map((metric, metricIndex) => { const value = stat[metric.key], x = center + (metricIndex - 2) * (barWidth + 2); return <rect key={metric.key} x={x} y={yPositive(value)} width={barWidth} height={baseline-yPositive(value)} fill={metric.color}><title>{stat.name} · {metric.label}: {value}</title></rect>; })}
        <rect x={center + 2*(barWidth+2)} y={baseline} width={barWidth} height={yNegative(stat.retirements)-baseline} fill="#ef1818"><title>{stat.name} · DNF/DNS/DSQ: {stat.retirements}</title></rect>
        <text x={center+7} y={height-35} transform={`rotate(-35 ${center+7} ${height-35})`} textAnchor="end" className="dsp-stat-code">{stat.code}</text>
      </g>; })}
    </svg></div>
  </section>;
};

const ConstructorRacePoints: React.FC<{ teams: ConstructorSeries[]; races: Race[]; rounds: Record<string, RoundData>; season: string }> = ({ teams, races, rounds, season }) => {
  const rows = useMemo(() => races.filter((race) => rounds[race.round]).map((race) => {
    const totals = new Map<string, number>();
    [...rounds[race.round].race, ...rounds[race.round].sprint].forEach((result) => { const key = resultTeam(result); totals.set(key, (totals.get(key) || 0) + (Number(result.points) || 0)); });
    const segments = teams.map((team) => ({ team, points: totals.get(team.key) || 0 })).filter((item) => item.points > 0);
    return { race, segments, total: segments.reduce((sum, item) => sum + item.points, 0) };
  }), [races, rounds, teams]);
  const maxTotal = Math.max(1, ...rows.map((row) => row.total));
  return <section className="dsp-chart-panel dsp-wide-panel" aria-labelledby="csp-race-title">
    <header className="dsp-panel-head"><div><span>05 / Race distribution</span><h2 id="csp-race-title">Constructor points by race</h2></div><button className="dsp-download" onClick={() => downloadCsv(`pitwall-${season}-constructor-points-by-race.csv`, [['Round','Grand Prix',...teams.map((team)=>TEAM_CODES[team.key]||team.name),'Total'],...rows.map((row)=>[row.race.round,row.race.raceName,...teams.map((team)=>row.segments.find((segment)=>segment.team.key===team.key)?.points||0),row.total])])} disabled={!rows.length} aria-label="Download constructor points by race as CSV">{downloadIcon}</button></header>
    <div className="dsp-race-bars"><div className="dsp-race-axis" aria-hidden="true">{Array.from({length:8},(_,index)=><span key={index} style={{left:`${index*100/7}%`}}>{Math.round(maxTotal*index/7)}</span>)}</div>
      {rows.map(({ race, segments, total }) => <div className="dsp-race-bar-row" key={race.round}><div className="dsp-race-identity" title={`${race.raceName} · Round ${race.round}`}><span>{flagEmoji(race.Circuit.Location.country)}</span><small>R{race.round}</small></div><div className="dsp-race-track"><div className="dsp-race-stack" style={{width:`${total/maxTotal*100}%`}}>{segments.map(({team,points})=><div key={team.key} className="dsp-race-segment" style={{width:`${points/total*100}%`,background:team.color}}><span>{points>=10?points:''}</span><div className="dsp-race-tooltip"><strong>{race.raceName} · R{race.round}</strong><span>{team.name}: <b>{points} pts</b></span></div></div>)}</div></div><strong className="dsp-race-total">{total}</strong></div>)}
      {!rows.length && <div className="dsp-chart-empty">Race points will appear after the first completed round.</div>}
    </div><div className="dsp-race-key">{teams.map((team)=><span key={team.key}><i style={{background:team.color}}/>{TEAM_CODES[team.key]||team.name.slice(0,3).toUpperCase()}</span>)}</div>
  </section>;
};

const ConstructorStandingsPage: React.FC<ConstructorStandingsPageProps> = ({ user, setUser, onBack, onOpenSettings, onHomeNavigate }) => {
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryPoint[]>>({});
  const [roundData, setRoundData] = useState<Record<string, RoundData>>({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadSession = async (endpoint: string, race: Race) => {
      try { const response = await fetch(`${BACKEND_URL}/results/${endpoint}/${race.season}/${race.round}`, { signal: controller.signal }); const data = response.ok ? await response.json() : []; return Array.isArray(data) ? data as SessionResult[] : []; }
      catch (requestError) { if (requestError instanceof DOMException && requestError.name === 'AbortError') throw requestError; return []; }
    };
    const load = async () => {
      try {
        const [response, raceList] = await Promise.all([fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`, { signal: controller.signal }), fetchRaces()]);
        if (!response.ok) throw new Error('Constructor standings request failed');
        const payload = await response.json();
        if (!Array.isArray(payload)) throw new Error('Invalid constructor standings response');
        const sorted = (payload as ConstructorStanding[]).sort((a,b) => b.points-a.points);
        if (controller.signal.aborted) return;
        setStandings(sorted); setRaces(raceList); setLoading(false);
        const completed = raceList.filter((race) => Date.now() > new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime() + 2.75*60*60*1000);
        const loaded = await Promise.all(completed.map(async (race) => { const [raceRows,sprintRows,qualifyingRows] = await Promise.all([loadSession('get-all-results',race),race.Sprint?loadSession('get-all-sprint-results',race):Promise.resolve([]),loadSession('get-all-qualifying-results',race)]); return {race,data:{race:raceRows,sprint:sprintRows,qualifying:qualifyingRows} as RoundData}; }));
        const cumulative = new Map(sorted.map((team) => [teamKey(team.name),0]));
        const nextHistory: Record<string,HistoryPoint[]> = Object.fromEntries(sorted.map((team)=>[teamKey(team.name),[]]));
        const nextRoundData: Record<string,RoundData> = {};
        loaded.forEach(({race,data}) => {
          nextRoundData[race.round]=data;
          [...data.race,...data.sprint].forEach((result)=>{ const key=resultTeam(result); cumulative.set(key,(cumulative.get(key)||0)+(Number(result.points)||0)); });
          [...sorted].sort((a,b)=>(cumulative.get(teamKey(b.name))||0)-(cumulative.get(teamKey(a.name))||0)||b.points-a.points).forEach((team,index)=>{ const key=teamKey(team.name); nextHistory[key].push({round:Number(race.round),points:cumulative.get(key)||0,rank:index+1}); });
        });
        if (!controller.signal.aborted) { setHistory(nextHistory); setRoundData(nextRoundData); }
      } catch (loadError) { if (!(loadError instanceof DOMException && loadError.name === 'AbortError')) setError(true); }
      finally { if (!controller.signal.aborted) { setLoading(false); setHistoryLoading(false); } }
    };
    load(); return () => controller.abort();
  }, []);

  const teams = useMemo<ConstructorSeries[]>(() => standings.map((team)=>{ const key=teamKey(team.name); return {...team,key,color:TEAM_COLORS[key]||'#9aa8bd',history:history[key]||[]}; }),[history,standings]);
  const season = String(standings[0]?.season || races[0]?.season || new Date().getFullYear());
  const roundsComplete = Math.max(0,...teams.flatMap((team)=>team.history.map((point)=>point.round)));
  const leaderPoints = standings[0]?.points || 0;
  const selectedConstructor = teams.find((team) => team.key === selectedTeam);

  return <div className="dsp-page csp-page"><div className="dsp-page-header"><SiteHeader user={user} setUser={setUser} onOpenSettings={onOpenSettings} onHomeNavigate={onHomeNavigate} leftSlot={<button className="rd-back-btn dsp-back" onClick={onBack}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Dashboard</button>}/></div>
    <main className="dsp-main"><section className="dsp-hero"><div><span className="dsp-kicker"><i/>Constructor telemetry · {season}</span><h1>Constructor <em>Standings</em></h1><p>Track every team’s championship campaign, race-by-race scoring and performance across the season.</p></div><div className="dsp-meta"><span><small>Season</small><strong>{season}</strong></span><i/><span><small>Rounds</small><strong>{String(roundsComplete).padStart(2,'0')}<b> / {String(races.length).padStart(2,'0')}</b></strong></span><i/><span><small>Teams</small><strong>{String(standings.length).padStart(2,'0')}</strong></span></div></section>
      {error&&<div className="dsp-alert" role="status">Some constructor data could not be loaded. Try refreshing the page.</div>}
      <div className="dsp-layout"><section className="dsp-standings" aria-labelledby="csp-table-title"><header className="dsp-panel-head"><div><span>01 / Classification</span><h2 id="csp-table-title">{season} constructors</h2></div><button className="dsp-download" disabled={!standings.length} onClick={()=>downloadCsv(`pitwall-${season}-constructor-standings.csv`,[['Position','Constructor','Points','Wins'],...standings.map((team,index)=>[index+1,team.name,team.points,team.wins])])} aria-label="Download constructor standings as CSV">{downloadIcon}</button></header><div className="dsp-table-head"><span>Pos.</span><span>Constructor</span><span>Points</span></div><div className="dsp-table-body">
        {loading?Array.from({length:10}).map((_,index)=><div className="dsp-row dsp-row-skeleton" key={index}><i/><span/><b/></div>):teams.map((team,index)=><button key={team.key} className={`dsp-row ${selectedTeam===team.key?'selected':''}`} style={{'--driver-color':team.color} as React.CSSProperties} onClick={()=>setSelectedTeam(selectedTeam===team.key?null:team.key)}><span className="dsp-position">{String(index+1).padStart(2,'0')}</span><span className="dsp-driver"><i>{TEAM_CODES[team.key]||team.name.slice(0,3).toUpperCase()}</i><span><strong><b>{team.name}</b></strong><small>{team.wins} wins</small></span></span><span className="dsp-points"><strong>{team.points}</strong><small>{index?`−${leaderPoints-team.points}`:'Leader'}</small></span></button>)}
      </div></section><div className="dsp-visuals"><header className="dsp-visual-tools"><div><span className="dsp-live-dot"/> {historyLoading?'Building race history':'Constructor progression'}</div><div className="dsp-visual-actions">{selectedConstructor&&<a className="dsp-profile-cta" href={`/constructor/${season}/${selectedConstructor.key}`} onClick={(event)=>{event.preventDefault();window.history.pushState({},'',event.currentTarget.href);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo(0,0);}}>View {TEAM_CODES[selectedConstructor.key]||selectedConstructor.name} profile <span>↗</span></a>}<div className="csp-team-count">{teams.length} teams</div></div></header>
        {(['points','rank'] as ChartMode[]).map((mode,index)=><section className="dsp-chart-panel" key={mode}><header className="dsp-panel-head"><div><span>0{index+2} / Evolution</span><h2>Constructor {mode==='points'?'points':'ranking'} evolution</h2></div><small>{selectedTeam?'Focused team':`${teams.length} teams shown`}</small></header>{historyLoading?<div className="dsp-chart-loading"><span/>Loading round data…</div>:roundsComplete===0?<div className="dsp-chart-empty">Evolution data will appear after the first completed round.</div>:<ConstructorEvolutionChart mode={mode} teams={teams} races={races.filter((race)=>Number(race.round)<=roundsComplete)} selected={selectedTeam} onSelect={setSelectedTeam}/>}</section>)}
        <div className="dsp-legend">{teams.map((team)=><button key={team.key} className={selectedTeam&&selectedTeam!==team.key?'muted':''} onClick={()=>setSelectedTeam(selectedTeam===team.key?null:team.key)}><i style={{background:team.color}}/>{TEAM_CODES[team.key]||team.name.slice(0,3).toUpperCase()}</button>)}<span>Tap a team to isolate</span></div>
      </div></div>
      <div className="dsp-secondary-charts">{historyLoading?<div className="dsp-chart-panel dsp-wide-panel"><div className="dsp-chart-loading"><span/>Loading performance data…</div></div>:<><ConstructorStatsChart teams={teams} rounds={roundData} selected={selectedTeam} onSelect={setSelectedTeam} season={season}/><ConstructorRacePoints teams={teams} races={races} rounds={roundData} season={season}/></>}</div>
    </main><Footer/></div>;
};

export default ConstructorStandingsPage;
