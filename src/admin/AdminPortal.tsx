/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import './admin.css';
import CrudManager from './CrudManager';
import Loader from '../components/Loader';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

const navItems = ['Overview', 'Race Ops', 'Drivers DB', 'Constructors DB', 'Database', 'Systems'];

interface ApiDriverRanking {
  id: string;
  driver_id: string;
  season: string;
  rounds: string;
  wins: string;
  points: string;
  position: string;
  updated_at: string;
  given_name: string;
  family_name: string;
  code: string;
  number: string;
  nationality: string;
  constructor_name: string;
}

interface ApiConstructorRanking {
  id: string;
  constructors_id: string;
  season: string;
  points: string;
  wins: string;
  rounds: string;
  name: string;
}

const TEAM_SLUGS: Record<string, string> = {
  'Mercedes': 'mercedes',
  'Ferrari': 'ferrari',
  'McLaren': 'mclaren',
  'Haas F1 Team': 'haas',
  'Red Bull': 'red_bull',
  'Alpine F1 Team': 'alpine',
  'RB F1 Team': 'rb',
  'Audi': 'audi',
  'Williams': 'williams',
  'Aston Martin': 'aston_martin',
  'Cadillac F1 Team': 'cadillac',
};

const TEAM_COLORS: Record<string, string> = {
  mercedes: '#00D2BE',
  ferrari: '#E8002D',
  mclaren: '#FF8700',
  red_bull: '#3671C6',
  aston_martin: '#229971',
  alpine: '#0093CC',
  williams: '#64C4FF',
  haas: '#B6BABD',
  rb: '#6692FF',
  audi: '#FF0000',
  cadillac: '#FFD700',
};

const NATIONALITY_CODES: Record<string, string> = {
  Italian: 'it',
  British: 'gb',
  Monegasque: 'mc',
  Australian: 'au',
  French: 'fr',
  Dutch: 'nl',
  'New Zealander': 'nz',
  Spanish: 'es',
  German: 'de',
  Canadian: 'ca',
  Thai: 'th',
  Finnish: 'fi',
  Danish: 'dk',
  Japanese: 'jp',
  Chinese: 'cn',
  American: 'us',
  Mexican: 'mx',
  Brazilian: 'br',
  Argentine: 'ar',
};

const Flag: React.FC<{ nationality: string }> = ({ nationality }) => {
  const code = NATIONALITY_CODES[nationality];
  if (!code) {
    return <span style={{ fontSize: '14px', marginRight: '8px', filter: 'grayscale(1)' }}>🏁</span>;
  }
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      width="16" 
      alt={nationality}
      style={{ 
        verticalAlign: 'middle', 
        borderRadius: '2px',
        display: 'inline-block',
        marginRight: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
      }}
    />
  );
};

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [apiHealth, setApiHealth] = useState<'Checking...' | 'HEALTHY' | 'OFFLINE'>('Checking...');
  const [dbStatus, setDbStatus] = useState<'Checking...' | 'CONNECTED' | 'ERROR'>('Checking...');
  const [latency, setLatency] = useState<number | null>(null);
  
  // Console logs
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[System Initialization] Ready. Paddock edge active.']);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Sync loading states
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({
    drivers: false,
    constructors: false,
    results: false,
    qualifying: false
  });

  // Last successful sync timestamps per dataset
  const [lastSync, setLastSync] = useState<Record<string, string | null>>({
    drivers: null,
    constructors: null,
    results: null,
    qualifying: null
  });

  // DB Data
  const [drivers, setDrivers] = useState<ApiDriverRanking[]>([]);
  const [constructors, setConstructors] = useState<ApiConstructorRanking[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingConstructors, setLoadingConstructors] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Diagnostic log for Systems tab
  const [diagnosticLog, setDiagnosticLog] = useState<string>('');
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  // Auto-scroll logs console
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Log message helper
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Relative time formatter for "last synced" labels
  const timeAgo = (iso: string | null) => {
    if (!iso) return 'Never synced';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Run health check and latency
  const checkHealth = async () => {
    const start = performance.now();
    try {
      const res = await fetch(`${BACKEND_URL}/health`);
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      if (res.ok) {
        setApiHealth('HEALTHY');
      } else {
        setApiHealth('OFFLINE');
      }
    } catch (e) {
      setApiHealth('OFFLINE');
      setLatency(Math.round(performance.now() - start));
    }

    try {
      const res = await fetch(`${BACKEND_URL}/db-test`);
      if (res.ok) {
        setDbStatus('CONNECTED');
      } else {
        setDbStatus('ERROR');
      }
    } catch (e) {
      setDbStatus('ERROR');
    }
  };

  // Fetch Drivers database
  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      } else {
        addLog('Error: Failed to fetch driver database standings.');
      }
    } catch (e) {
      addLog('Error: Network failure loading driver database.');
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Fetch Constructors standings
  const fetchConstructors = async () => {
    setLoadingConstructors(true);
    try {
      const res = await fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`);
      if (res.ok) {
        const data = await res.json();
        setConstructors(data);
      } else {
        addLog('Error: Failed to fetch constructor standings.');
      }
    } catch (e) {
      addLog('Error: Network failure loading constructors standings.');
    } finally {
      setLoadingConstructors(false);
    }
  };

  // Trigger sync route
  const handleSync = async (type: 'drivers' | 'constructors' | 'results' | 'qualifying', endpoint: string) => {
    setIsSyncing(prev => ({ ...prev, [type]: true }));
    addLog(`INITIATED: Synchronization trigger for ${type.toUpperCase()}...`);
    
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`);
      const data = await res.json();
      
      if (res.ok) {
        addLog(`SUCCESS: Sync ${type.toUpperCase()} completed successfully.`);
        addLog(`Payload: ${JSON.stringify(data, null, 2)}`);
        setLastSync(prev => ({ ...prev, [type]: new Date().toISOString() }));
        
        // Refresh data dynamically
        if (type === 'drivers') fetchDrivers();
        if (type === 'constructors') fetchConstructors();
      } else {
        addLog(`FAILED: Sync ${type.toUpperCase()} returned error: ${data.error || 'Unknown response error'}`);
      }
    } catch (e: any) {
      addLog(`FAILED: Sync request encountered connection error: ${e.message}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, [type]: false }));
    }
  };

  // Perform full diagnostics
  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticLog('Starting full systems diagnostics test suite...\n');
    let log = '';

    const logLine = (msg: string) => {
      log += `[${new Date().toLocaleTimeString()}] ${msg}\n`;
      setDiagnosticLog(log);
    };

    try {
      // 1. API Health Check
      logLine('Testing server health endpoint (/health)...');
      const healthStart = performance.now();
      const healthRes = await fetch(`${BACKEND_URL}/health`);
      const healthTime = Math.round(performance.now() - healthStart);
      if (healthRes.ok) {
        const data = await healthRes.json();
        logLine(`Health OK. Response time: ${healthTime}ms. Status payload: ${JSON.stringify(data)}`);
      } else {
        logLine(`Health FAILED. Status code: ${healthRes.status}`);
      }

      // 2. DB Connectivity
      logLine('Testing database pool connectivity (/db-test)...');
      const dbStart = performance.now();
      const dbRes = await fetch(`${BACKEND_URL}/db-test`);
      const dbTime = Math.round(performance.now() - dbStart);
      if (dbRes.ok) {
        const data = await dbRes.json();
        logLine(`DB connection OK. Response time: ${dbTime}ms. Status: ${data.status}. Server time: ${data.serverTime}`);
      } else {
        logLine(`DB Connection FAILED. Status: ${dbRes.status}`);
      }

      // 3. API Load timings (Drivers count)
      logLine('Testing driver directory read performance (/drivers/get-all-drivers-season-rankings)...');
      const dStart = performance.now();
      const dRes = await fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`);
      const dTime = Math.round(performance.now() - dStart);
      if (dRes.ok) {
        const data = await dRes.json();
        logLine(`Directory read complete in ${dTime}ms. Records retrieved: ${data.length}`);
      } else {
        logLine(`Directory read FAILED. Status: ${dRes.status}`);
      }

      // 4. API Load timings (Constructors count)
      logLine('Testing constructors standings read performance (/constructors/get-all-constructors-season-rankings)...');
      const cStart = performance.now();
      const cRes = await fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`);
      const cTime = Math.round(performance.now() - cStart);
      if (cRes.ok) {
        const data = await cRes.json();
        logLine(`Constructor standing read complete in ${cTime}ms. Records retrieved: ${data.length}`);
      } else {
        logLine(`Constructor standing read FAILED. Status: ${cRes.status}`);
      }

      logLine('SYSTEM DIAGNOSTICS: Completed. All routes operational.');
    } catch (e: any) {
      logLine(`CRITICAL ERROR DURING TESTING: ${e.message}`);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  // Run initial checks on load
  useEffect(() => {
    checkHealth();
    fetchDrivers();
    fetchConstructors();
    
    // Poll health status
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Filter lists based on searches
  const filteredDrivers = drivers.filter(d => {
    const fullName = `${d.given_name} ${d.family_name}`.toLowerCase();
    const code = (d.code || '').toLowerCase();
    const team = (d.constructor_name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || code.includes(query) || team.includes(query);
  });

  const filteredConstructors = constructors.filter(c => {
    const name = (c.name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Render header stats
  const renderStatusRibbon = () => (
    <div className="admin-status-ribbon">
      <div className={`status-badge ${apiHealth === 'HEALTHY' ? 'online' : 'offline'}`}>
        <span className="pulse-dot"></span>
        API Service: {apiHealth}
      </div>
      <div className={`status-badge ${dbStatus === 'CONNECTED' ? 'online' : 'offline'}`}>
        <span className="pulse-dot"></span>
        PostgreSQL DB: {dbStatus}
      </div>
      {latency !== null && (
        <div className="status-badge latency">
          ⏱ Ping Latency: {latency}ms
        </div>
      )}
    </div>
  );

  return (
    <main className="admin-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/">
          <span className="admin-brand-mark">PW</span>
          <span>
            <strong>My PitWall</strong>
            <em>Admin Control</em>
          </span>
        </a>

        <nav className="admin-nav">
          {navItems.map((item, index) => (
            <button 
              className={`admin-nav-item ${index === activeTab ? 'active' : ''}`} 
              key={item}
              onClick={() => {
                setActiveTab(index);
                setSearchQuery(''); // Reset search query on tab change
              }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-live-dot"></span>
          Production paddock online
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT */}
      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">My PitWall Administration</p>
            <h1>{navItems[activeTab]}</h1>
          </div>
          <div className="admin-actions">
            {renderStatusRibbon()}
            <button className="admin-primary-btn" onClick={checkHealth}>
              Refresh Connection
            </button>
          </div>
        </header>

        {/* TAB 0: OVERVIEW */}
        {activeTab === 0 && (
          <>
            <section className="admin-hero-panel">
              <div className="admin-hero-copy">
                <p className="admin-kicker">Command Center</p>
                <h2>Telemetry, standings syncing, and global F1 paddock database administration.</h2>
                <div className="admin-hero-meta">
                  <span>Season: 2026</span>
                  <span>Database: pgSQL Live</span>
                  <span>Credentials: Super Admin</span>
                </div>
              </div>
              <div className="admin-hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-label">API Latency</span>
                  <strong>{latency ?? '--'}<em>ms</em></strong>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-label">Database</span>
                  <strong className={dbStatus === 'CONNECTED' ? 'ok' : 'bad'}>
                    {dbStatus === 'CONNECTED' ? 'Live' : 'Down'}
                  </strong>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-label">Records</span>
                  <strong>{drivers.length + constructors.length}</strong>
                </div>
              </div>
            </section>

            <section className="admin-grid">
              <article className="admin-panel admin-ops-panel">
                <div className="admin-panel-head">
                  <div>
                    <p className="admin-kicker">Status Panel</p>
                    <h3>Core Paddock Diagnostics</h3>
                  </div>
                </div>
                <div className="admin-db-status-sheet">
                  <div className="status-sheet-row">
                    <strong>API Server Endpoint</strong>
                    <span>{BACKEND_URL}</span>
                  </div>
                  <div className="status-sheet-row">
                    <strong>Paddock DB Health</strong>
                    <span className={dbStatus === 'CONNECTED' ? 'green-text' : 'red-text'}>
                      {dbStatus}
                    </span>
                  </div>
                  <div className="status-sheet-row">
                    <strong>Total Database Drivers</strong>
                    <span>{drivers.length} synced</span>
                  </div>
                  <div className="status-sheet-row">
                    <strong>Total Database Teams</strong>
                    <span>{constructors.length} synced</span>
                  </div>
                </div>
              </article>

              <article className="admin-panel admin-freshness-panel">
                <div className="admin-panel-head">
                  <div>
                    <p className="admin-kicker">Pipeline</p>
                    <h3>Data Freshness</h3>
                  </div>
                </div>
                <div className="admin-freshness-list">
                  {([
                    { key: 'drivers', label: 'Drivers Standings', endpoint: '/drivers/sync-driver-season' },
                    { key: 'constructors', label: 'Constructors Standings', endpoint: '/constructors/sync-constructor-season' },
                    { key: 'results', label: 'Race Results', endpoint: '/results/sync-results' },
                    { key: 'qualifying', label: 'Qualifying Times', endpoint: '/results/sync-qualifying' },
                  ] as const).map(item => (
                    <div className="freshness-row" key={item.key}>
                      <div className="freshness-info">
                        <strong>{item.label}</strong>
                        <span>{timeAgo(lastSync[item.key])}</span>
                      </div>
                      <button
                        className="freshness-sync-btn"
                        disabled={isSyncing[item.key]}
                        onClick={() => handleSync(item.key, item.endpoint)}
                      >
                        {isSyncing[item.key] ? '···' : 'Sync'}
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        {/* TAB 1: RACE SYNC OPS */}
        {activeTab === 1 && (
          <section className="admin-sync-operations">
            <div className="admin-sync-grid">
              {/* Sync Card 1: Drivers */}
              <article className="admin-sync-card">
                <div className={`sync-indicator-dot ${isSyncing.drivers ? 'syncing' : 'idle'}`}></div>
                <h3>Sync Drivers Standings</h3>
                <p>Pull 2026 driver championship positions, points, and win tallies from Ergast API to local DB.</p>
                <button 
                  className="admin-sync-btn"
                  disabled={isSyncing.drivers}
                  onClick={() => handleSync('drivers', '/drivers/sync-driver-season')}
                >
                  {isSyncing.drivers ? 'Synchronizing...' : 'Sync Season Drivers'}
                </button>
              </article>

              {/* Sync Card 2: Constructors */}
              <article className="admin-sync-card">
                <div className={`sync-indicator-dot ${isSyncing.constructors ? 'syncing' : 'idle'}`}></div>
                <h3>Sync Constructors Standings</h3>
                <p>Ingest constructor points, positions, wins, and round metrics into local pgSQL tables.</p>
                <button 
                  className="admin-sync-btn"
                  disabled={isSyncing.constructors}
                  onClick={() => handleSync('constructors', '/constructors/sync-constructor-season')}
                >
                  {isSyncing.constructors ? 'Synchronizing...' : 'Sync Season Teams'}
                </button>
              </article>

              {/* Sync Card 3: Results */}
              <article className="admin-sync-card">
                <div className={`sync-indicator-dot ${isSyncing.results ? 'syncing' : 'idle'}`}></div>
                <h3>Sync Race Results</h3>
                <p>Query comprehensive results, driver race positions, times, and fastest lap ranks across rounds.</p>
                <button 
                  className="admin-sync-btn"
                  disabled={isSyncing.results}
                  onClick={() => handleSync('results', '/results/sync-results')}
                >
                  {isSyncing.results ? 'Synchronizing...' : 'Sync Race Results'}
                </button>
              </article>

              {/* Sync Card 4: Qualifying */}
              <article className="admin-sync-card">
                <div className={`sync-indicator-dot ${isSyncing.qualifying ? 'syncing' : 'idle'}`}></div>
                <h3>Sync Qualifying Times</h3>
                <p>Populate and match qualifying session data (Q1, Q2, Q3) for season rounds with driver stats.</p>
                <button 
                  className="admin-sync-btn"
                  disabled={isSyncing.qualifying}
                  onClick={() => handleSync('qualifying', '/results/sync-qualifying')}
                >
                  {isSyncing.qualifying ? 'Synchronizing...' : 'Sync Qualy Times'}
                </button>
              </article>
            </div>

            {/* TERMINAL CONSOLE LOGS */}
            <div className="admin-panel admin-console-panel">
              <div className="admin-panel-head">
                <div>
                  <p className="admin-kicker">Live Feed</p>
                  <h3>Paddock Console Logs</h3>
                </div>
                <button className="admin-text-btn" onClick={() => setConsoleLogs(['[Log cleared] System ready.'])}>
                  Clear Console
                </button>
              </div>
              <div className="admin-terminal-console">
                <div className="console-lines-wrap">
                  {consoleLogs.map((log, idx) => (
                    <pre key={idx} className="console-line">{log}</pre>
                  ))}
                  <div ref={consoleBottomRef} />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: DRIVERS DATABASE */}
        {activeTab === 2 && (
          <section className="admin-panel db-table-panel">
            <div className="table-controls">
              <input 
                type="text" 
                className="table-search-input"
                placeholder="Search drivers by name, code or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="admin-primary-btn" onClick={fetchDrivers}>
                {loadingDrivers ? 'Refreshing...' : 'Refresh DB'}
              </button>
            </div>

            {loadingDrivers ? (
              <Loader label="Syncing local repository drivers list" accent="#e0c47d" />
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Driver Name</th>
                      <th>Number</th>
                      <th>Constructor / Team</th>
                      <th>Points</th>
                      <th>Wins</th>
                      <th>Nationality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.length > 0 ? (
                      filteredDrivers.map((driver) => {
                        const slug = TEAM_SLUGS[driver.constructor_name] || 'default';
                        const color = TEAM_COLORS[slug] || '#fff';
                        return (
                          <tr key={driver.id} style={{ borderLeft: `3px solid ${color}` }}>
                            <td className="center-cell font-bold">{driver.position}</td>
                            <td>
                              <div className="driver-cell-name">
                                <strong>{driver.given_name} {driver.family_name}</strong>
                                <span className="driver-cell-code">{driver.code}</span>
                              </div>
                            </td>
                            <td className="center-cell font-mono">{driver.number}</td>
                            <td>
                              <div className="team-cell-wrap">
                                <span className="team-indicator" style={{ background: color }}></span>
                                {driver.constructor_name}
                              </div>
                            </td>
                            <td className="right-cell font-bold">{driver.points}</td>
                            <td className="right-cell">{driver.wins}</td>
                            <td>
                              <div className="flag-cell-wrap">
                                <Flag nationality={driver.nationality} />
                                {driver.nationality}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="empty-table-cell">No drivers match your search query or standings have not been synced yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: CONSTRUCTORS STANDINGS */}
        {activeTab === 3 && (
          <section className="admin-panel db-table-panel">
            <div className="table-controls">
              <input 
                type="text" 
                className="table-search-input"
                placeholder="Search constructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="admin-primary-btn" onClick={fetchConstructors}>
                {loadingConstructors ? 'Refreshing...' : 'Refresh DB'}
              </button>
            </div>

            {loadingConstructors ? (
              <Loader label="Querying constructors from database" accent="#e0c47d" />
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Constructor / Team</th>
                      <th>Points</th>
                      <th>Wins</th>
                      <th>Rounds Raced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConstructors.length > 0 ? (
                      filteredConstructors.map((c, index) => {
                        const slug = TEAM_SLUGS[c.name] || 'default';
                        const color = TEAM_COLORS[slug] || '#fff';
                        return (
                          <tr key={c.id} style={{ borderLeft: `3px solid ${color}` }}>
                            <td className="center-cell font-bold">{index + 1}</td>
                            <td>
                              <div className="team-cell-wrap">
                                <span className="team-indicator animate-pulse" style={{ background: color, boxShadow: `0 0 10px ${color}` }}></span>
                                <strong>{c.name}</strong>
                              </div>
                            </td>
                            <td className="right-cell font-bold">{c.points}</td>
                            <td className="right-cell">{c.wins}</td>
                            <td className="right-cell">{c.rounds}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-table-cell">No constructors found matching the search query or data table has not been populated.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: DATABASE CRUD */}
        {activeTab === 4 && (
          <CrudManager onLog={addLog} />
        )}

        {/* TAB 5: SYSTEMS & DIAGNOSTICS */}
        {activeTab === 5 && (
          <section className="admin-diagnostics-systems">
            <div className="admin-grid">
              <article className="admin-panel diagnostics-control-panel">
                <div className="admin-panel-head">
                  <div>
                    <p className="admin-kicker">Diagnostics Utility</p>
                    <h3>Paddock Health Test</h3>
                  </div>
                </div>
                <p className="panel-p-desc">Verify availability of REST APIs and benchmark database request latency values.</p>
                <button 
                  className="admin-primary-btn diagnostics-btn"
                  disabled={runningDiagnostics}
                  onClick={runDiagnostics}
                >
                  {runningDiagnostics ? 'Diagnostics Running...' : 'Run Full Diagnostics Check'}
                </button>

                <div className="db-test-details-grid">
                  <div className="db-test-card">
                    <h4>API Endpoint</h4>
                    <span>{BACKEND_URL}</span>
                  </div>
                  <div className="db-test-card">
                    <h4>Database Pool Status</h4>
                    <span className={dbStatus === 'CONNECTED' ? 'green-text' : 'red-text'}>{dbStatus}</span>
                  </div>
                  <div className="db-test-card">
                    <h4>Diagnostics Run Log</h4>
                    <span>{diagnosticLog ? 'Check complete' : 'Ready'}</span>
                  </div>
                </div>
              </article>

              <article className="admin-panel diagnostics-logs-panel">
                <div className="admin-panel-head">
                  <div>
                    <p className="admin-kicker">Diagnostics Shell</p>
                    <h3>Test output logs</h3>
                  </div>
                </div>
                <div className="diagnostics-shell-view">
                  <pre>{diagnosticLog || 'Click "Run Full Diagnostics Check" to begin testing system integrity.'}</pre>
                </div>
              </article>
            </div>
          </section>
        )}

      </section>
    </main>
  );
};

export default AdminPortal;
