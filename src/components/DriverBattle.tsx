import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Loader from './Loader';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

interface ApiDriverRanking {
  id: string;
  driver_id: string;
  season: string;
  rounds: string;
  wins: string;
  points: string;
  position: string;
  given_name: string;
  family_name: string;
  code: string;
  number: string;
  nationality: string;
  constructor_name: string;
  podiums: string;
}

interface LastRaceResult {
  round: string;
  position: string;
  status: string;
  points: string;
  race_name: string;
}

interface ComparisonDriver {
  driver_id: string;
  number: string;
  code: string;
  given_name: string;
  family_name: string;
  nationality: string;
  constructor_name: string;
  points: string;
  wins: string;
  position: string;
  podiums: string;
  poles: string;
  fastest_laps: string;
  points_finishes: string;
  last5: LastRaceResult[];
}

interface ComparisonResponse {
  season: string;
  drivers: [ComparisonDriver, ComparisonDriver];
  h2h: {
    quali: { driver1: number; driver2: number };
    race: { driver1: number; driver2: number };
  };
}

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
  audi: '#F50537',
  cadillac: '#FFD700',
};

const NAME_TO_SLUG: Record<string, string> = {
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

const NATIONALITY_TO_CODE: Record<string, string> = {
  'Italian': 'ITA', 'British': 'GBR', 'Dutch': 'NED', 'Spanish': 'ESP',
  'French': 'FRA', 'German': 'GER', 'Monegasque': 'MON', 'Australian': 'AUS',
  'Canadian': 'CAN', 'Japanese': 'JPN', 'Thai': 'THA', 'Danish': 'DEN',
  'Finnish': 'FIN', 'American': 'USA', 'Brazilian': 'BRA', 'Chinese': 'CHN',
  'New Zealander': 'NZL', 'Argentine': 'ARG', 'Mexican': 'MEX', 'Austrian': 'AUT',
  'Belgian': 'BEL', 'Swiss': 'SUI', 'Swedish': 'SWE', 'Polish': 'POL',
  'Russian': 'RUS', 'Indonesian': 'INA', 'Indian': 'IND',
};

const teamSlug = (constructorName: string) =>
  NAME_TO_SLUG[constructorName] || constructorName.toLowerCase().replace(/ /g, '_');

const nationalityCode = (nationality: string) =>
  NATIONALITY_TO_CODE[nationality] || nationality.slice(0, 3).toUpperCase();

const teamColor = (constructorName: string) =>
  TEAM_COLORS[teamSlug(constructorName)] || '#ffffff';

// Result rows carry the running-order position even for retirees; a driver
// only reads as "classified" when status is Finished or a lapped-behind status.
const isClassified = (status: string) => status === 'Finished' || status.startsWith('+');

const formChipInfo = (r: LastRaceResult): { label: string; cls: string } => {
  if (!isClassified(r.status)) return { label: 'DNF', cls: 'dnf' };
  const pos = parseInt(r.position, 10);
  if (pos === 1) return { label: '1', cls: 'win' };
  if (pos <= 3) return { label: String(pos), cls: 'podium' };
  return { label: String(pos), cls: 'other' };
};

const COMPARE_ROWS: { label: string; key: keyof ComparisonDriver }[] = [
  { label: 'Championship Points', key: 'points' },
  { label: 'Grand Prix Wins', key: 'wins' },
  { label: 'Podiums', key: 'podiums' },
  { label: 'Pole Positions', key: 'poles' },
  { label: 'Fastest Laps', key: 'fastest_laps' },
  { label: 'Points Finishes', key: 'points_finishes' },
];

const DriverBattle: React.FC = () => {
  const [allDrivers, setAllDrivers] = useState<ApiDriverRanking[]>([]);
  const [season, setSeason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<[string, string] | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`);
        const data: ApiDriverRanking[] = await response.json();
        setAllDrivers(data);
        if (data.length >= 2) {
          setSeason(data[0].season);
          setSelected([data[0].driver_id, data[1].driver_id]);
        }
      } catch (err) {
        console.error('Battle data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (!season || !selected) return;
    const fetchComparison = async () => {
      setComparisonLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/drivers/compare/${season}/${selected[0]}/${selected[1]}`);
        if (!response.ok) throw new Error('Comparison fetch failed');
        const data: ComparisonResponse = await response.json();
        setComparison(data);
      } catch (err) {
        console.error('Driver comparison fetch failed', err);
        setComparison(null);
      } finally {
        setComparisonLoading(false);
      }
    };
    fetchComparison();
  }, [season, selected]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const seasonDrivers = useMemo(
    () => allDrivers.filter((d) => d.season === season),
    [allDrivers, season]
  );

  const openPicker = () => {
    setDraft(selected ? [...selected] : []);
    setPickerOpen(true);
  };

  // Toggle a driver in the draft; cap at 2 with FIFO replacement.
  const toggleDraft = (driverId: string) => {
    setDraft((prev) => {
      if (prev.includes(driverId)) return prev.filter((id) => id !== driverId);
      if (prev.length < 2) return [...prev, driverId];
      return [prev[1], driverId];
    });
  };

  const applyDraft = () => {
    if (draft.length === 2) {
      setSelected([draft[0], draft[1]]);
      setPickerOpen(false);
    }
  };

  if (loading || comparisonLoading || !comparison) {
    return (
      <section className="driver-battle-section">
        <div className="battle-header">
          <div>
            <span className="battle-eyebrow">Head to Head{season ? ` · ${season}` : ''}</span>
            <h2 className="battle-title">Driver's <em>Clash</em></h2>
          </div>
        </div>
        <div className="battle-container" style={{ opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader label="Synchronizing data" />
        </div>
      </section>
    );
  }

  const [d1, d2] = comparison.drivers;
  const color1 = teamColor(d1.constructor_name);
  const color2 = teamColor(d2.constructor_name);
  const pts1 = parseInt(d1.points, 10) || 0;
  const pts2 = parseInt(d2.points, 10) || 0;
  const gap = Math.abs(pts1 - pts2);
  const gapLeader = pts1 === pts2 ? null : pts1 > pts2 ? 0 : 1;

  return (
    <section className="driver-battle-section">
      <div className="battle-header">
        <div>
          <span className="battle-eyebrow">Head to Head · {comparison.season}</span>
          <h2 className="battle-title">Driver's <em>Clash</em></h2>
        </div>

        <button className="battle-pick-btn" onClick={openPicker}>
          <span className="battle-pick-icon" aria-hidden="true">⇄</span>
          Select Drivers
        </button>
      </div>

      <div className="battle-container">
        {/* Driver 1 */}
        <div className="battle-card p1" style={{ '--team-color': color1 } as React.CSSProperties}>
          <div className="battle-card-top">
            <button className="battle-rank" onClick={openPicker} aria-label="Change driver 1">
              <span className="battle-rank-label">Position</span>
              <span className="battle-rank-value">P{d1.position}</span>
            </button>
            <div className="battle-card-info">
              <div className="battle-tags">
                <span className="battle-meta">#{d1.number} · {nationalityCode(d1.nationality)}</span>
              </div>
              <h3 className="battle-name">{d1.given_name} {d1.family_name}</h3>
              <span className="battle-team">{d1.constructor_name}</span>
            </div>
          </div>
          <div className="battle-quickstats">
            <div className="battle-qstat"><strong>{d1.points}</strong><span>Points</span></div>
            <div className="battle-qstat"><strong>{d1.wins}</strong><span>Wins</span></div>
            <div className="battle-qstat"><strong>{d1.podiums}</strong><span>Podiums</span></div>
          </div>
          <div className="battle-form">
            <span className="battle-form-label">Last 5 Races</span>
            <div className="battle-form-chips">
              {d1.last5.map((r, i) => {
                const chip = formChipInfo(r);
                return <span key={i} className={`battle-chip ${chip.cls}`} title={r.race_name}>{chip.label}</span>;
              })}
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="battle-vs">
          <div className="vs-circle">VS</div>
          {gapLeader !== null && (
            <div className="vs-gap">
              <span>Gap</span>
              <strong style={{ color: gapLeader === 0 ? color1 : color2 }}>+{gap}</strong>
              <span>Pts</span>
            </div>
          )}
        </div>

        {/* Driver 2 */}
        <div className="battle-card p2" style={{ '--team-color': color2 } as React.CSSProperties}>
          <div className="battle-card-top">
            <div className="battle-card-info">
              <div className="battle-tags">
                <span className="battle-meta">{nationalityCode(d2.nationality)} · #{d2.number}</span>
              </div>
              <h3 className="battle-name">{d2.given_name} {d2.family_name}</h3>
              <span className="battle-team">{d2.constructor_name}</span>
            </div>
            <button className="battle-rank" onClick={openPicker} aria-label="Change driver 2">
              <span className="battle-rank-label">Position</span>
              <span className="battle-rank-value">P{d2.position}</span>
            </button>
          </div>
          <div className="battle-quickstats">
            <div className="battle-qstat"><strong>{d2.points}</strong><span>Points</span></div>
            <div className="battle-qstat"><strong>{d2.wins}</strong><span>Wins</span></div>
            <div className="battle-qstat"><strong>{d2.podiums}</strong><span>Podiums</span></div>
          </div>
          <div className="battle-form">
            <span className="battle-form-label">Last 5 Races</span>
            <div className="battle-form-chips">
              {d2.last5.map((r, i) => {
                const chip = formChipInfo(r);
                return <span key={i} className={`battle-chip ${chip.cls}`} title={r.race_name}>{chip.label}</span>;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Season comparison panel */}
      <div className="battle-compare" style={{ '--p1-color': color1, '--p2-color': color2 } as React.CSSProperties}>
        <div className="compare-head">
          <h3 className="compare-title">Season Comparison</h3>
          <div className="compare-badges">
            <span className="compare-badge">Quali H2H <strong>{comparison.h2h.quali.driver1}-{comparison.h2h.quali.driver2}</strong></span>
            <span className="compare-badge">Race H2H <strong>{comparison.h2h.race.driver1}-{comparison.h2h.race.driver2}</strong></span>
          </div>
        </div>

        <div className="compare-rows">
          {COMPARE_ROWS.map((row) => {
            const v1 = parseInt(d1[row.key] as string, 10) || 0;
            const v2 = parseInt(d2[row.key] as string, 10) || 0;
            const max = Math.max(v1, v2, 1);
            const w1 = (v1 / max) * 100;
            const w2 = (v2 / max) * 100;
            return (
              <div key={row.label} className="compare-row">
                <span className="compare-val left">{v1}</span>
                <div className="compare-bar left">
                  <div className={`compare-fill ${v1 >= v2 ? 'leading' : 'trailing'}`} style={{ width: `${w1}%` }} />
                </div>
                <span className="compare-label">{row.label}</span>
                <div className="compare-bar right">
                  <div className={`compare-fill ${v2 >= v1 ? 'leading' : 'trailing'}`} style={{ width: `${w2}%` }} />
                </div>
                <span className="compare-val right">{v2}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Driver picker popup */}
      {pickerOpen && createPortal(
        <div className="dpick-overlay" onClick={() => setPickerOpen(false)}>
          <div className="dpick-window" onClick={(e) => e.stopPropagation()}>
            <button className="dpick-close" onClick={() => setPickerOpen(false)}>×</button>

            <div className="dpick-head">
              <h3 className="dpick-title">Pick Two Drivers</h3>
              <p className="dpick-sub">Choose the two drivers you want to compare</p>
            </div>

            <div className="dpick-slots">
              {[0, 1].map((i) => {
                const id = draft[i];
                const d = id ? seasonDrivers.find((x) => x.driver_id === id) : null;
                const color = d ? teamColor(d.constructor_name) : '#666';
                return (
                  <div
                    key={i}
                    className={`dpick-slot ${d ? 'filled' : ''}`}
                    style={{ '--team-color': color } as React.CSSProperties}
                    onClick={() => id && toggleDraft(id)}
                  >
                    {d ? (
                      <>
                        <span className="dpick-slot-tag">{d.number}</span>
                        <span className="dpick-slot-name">{d.given_name} {d.family_name}</span>
                      </>
                    ) : (
                      <span className="dpick-slot-empty">Tap a driver below</span>
                    )}
                  </div>
                );
              })}
              <div className="dpick-vs">VS</div>
            </div>

            <div className="dpick-grid">
              {[...seasonDrivers]
                .sort((a, b) => {
                  const ca = a.constructor_name || '';
                  const cb = b.constructor_name || '';
                  if (ca !== cb) return ca.localeCompare(cb);
                  return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
                })
                .map((d) => {
                const color = teamColor(d.constructor_name);
                const isSel = draft.includes(d.driver_id);
                return (
                  <button
                    key={d.driver_id}
                    className={`dpick-driver ${isSel ? 'selected' : ''}`}
                    style={{ '--team-color': color } as React.CSSProperties}
                    onClick={() => toggleDraft(d.driver_id)}
                  >
                    {isSel && <span className="dpick-driver-badge">✓</span>}
                    <span className="dpick-driver-num">{d.number}</span>
                    <span className="dpick-driver-info">
                      <span className="dpick-driver-name">{d.given_name} {d.family_name}</span>
                      <span className="dpick-driver-team">{d.constructor_name}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="dpick-footer">
              <span className="dpick-count">{draft.length}/2 selected</span>
              <button
                className="dpick-compare"
                disabled={draft.length !== 2}
                onClick={applyDraft}
              >
                Compare →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};

export default DriverBattle;
