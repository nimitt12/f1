import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Loader from './Loader';
import antonelliImg from '../assets/ant.png';
import russellImg from '../assets/rus.png';

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
}

interface BattleDriver {
  driverId: string;
  slot: string;
  number: string;
  name: string;
  team: string;
  pts: number;
  wins: number;
  podiums: number;
  color: string;
  image: string | null;
}

const DRIVER_IMAGES: Record<string, string> = {
  ANT: antonelliImg,
  RUS: russellImg,
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

const teamSlug = (constructorName: string) =>
  NAME_TO_SLUG[constructorName] || constructorName.toLowerCase().replace(/ /g, '_');

const toBattleDriver = (d: ApiDriverRanking): BattleDriver => ({
  driverId: d.driver_id,
  slot: `P${d.position}`,
  number: d.number,
  name: `${d.given_name} ${d.family_name}`,
  team: d.constructor_name.toUpperCase(),
  pts: parseInt(d.points) || 0,
  wins: parseInt(d.wins) || 0,
  podiums: parseInt(d.wins) || 0, // Using wins as podiums until API provides it
  color: TEAM_COLORS[teamSlug(d.constructor_name)] || '#ffffff',
  image: DRIVER_IMAGES[d.code] || null,
});

const initials = (name: string) => name.split(' ').map((n) => n[0]).join('');

const DriverBattle: React.FC = () => {
  const [allDrivers, setAllDrivers] = useState<ApiDriverRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<[string, string] | null>(null);
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
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const drivers = useMemo<BattleDriver[]>(() => {
    if (!selected) return [];
    return selected
      .map((id) => {
        const found = allDrivers.find((d) => d.driver_id === id);
        return found ? toBattleDriver(found) : null;
      })
      .filter(Boolean) as BattleDriver[];
  }, [selected, allDrivers]);

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

  if (loading || drivers.length < 2) {
    return (
      <section className="driver-battle-section">
        <div className="battle-header">
          <h2 className="battle-title">Driver's <em>Clash</em></h2>
        </div>
        <div className="battle-container" style={{ opacity: 0.5, height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader label="Synchronizing data" />
        </div>
      </section>
    );
  }

  const stats = [
    { label: 'Championship Points', key: 'pts' },
    { label: 'Grand Prix Wins', key: 'wins' },
    { label: 'Podiums', key: 'podiums' },
  ];

  return (
    <section className="driver-battle-section">
      <div className="battle-header">
        <h2 className="battle-title">Driver's <em>Clash</em></h2>

        <button className="battle-pick-btn" onClick={openPicker}>
          <span className="battle-pick-icon" aria-hidden="true">⇄</span>
          Select Drivers
        </button>
      </div>

      <div className="battle-container">
        {/* Driver 1 */}
        <button
          className="battle-card p1"
          onClick={openPicker}
          style={{ '--team-color': drivers[0].color } as React.CSSProperties}
        >
          <div className="battle-image-wrap">
            <div className="battle-bg-name">{drivers[0].slot}</div>
            {drivers[0].image ? (
              <img src={drivers[0].image} alt={drivers[0].name} className="battle-driver-img" />
            ) : (
              <div className="driver-placeholder">{initials(drivers[0].name)}</div>
            )}
          </div>
          <div className="battle-info">
            <div className="battle-pos">{drivers[0].number}</div>
            <h3 className="battle-name">{drivers[0].name}</h3>
            <span className="battle-team">{drivers[0].team}</span>
          </div>
        </button>

        {/* VS Divider */}
        <div className="battle-vs">
          <div className="vs-circle">VS</div>
        </div>

        {/* Driver 2 */}
        <button
          className="battle-card p2"
          onClick={openPicker}
          style={{ '--team-color': drivers[1].color } as React.CSSProperties}
        >
          <div className="battle-image-wrap">
            <div className="battle-bg-name">{drivers[1].slot}</div>
            {drivers[1].image ? (
              <img src={drivers[1].image} alt={drivers[1].name} className="battle-driver-img" />
            ) : (
              <div className="driver-placeholder">{initials(drivers[1].name)}</div>
            )}
          </div>
          <div className="battle-info">
            <div className="battle-pos">{drivers[1].number}</div>
            <h3 className="battle-name">{drivers[1].name}</h3>
            <span className="battle-team">{drivers[1].team}</span>
          </div>
        </button>

        {/* Stats Overlay */}
        <div
          className="battle-stats-overlay"
          style={{ '--p1-color': drivers[0].color, '--p2-color': drivers[1].color } as React.CSSProperties}
        >
          {stats.map((stat, idx) => {
            const v1 = drivers[0][stat.key as keyof BattleDriver] as number;
            const v2 = drivers[1][stat.key as keyof BattleDriver] as number;
            return (
              <div key={idx} className="battle-stat-row">
                <div className={`stat-val v1 ${v1 >= v2 ? 'leading' : ''}`}>{v1}</div>
                <div className="stat-label">{stat.label}</div>
                <div className={`stat-val v2 ${v2 >= v1 ? 'leading' : ''}`}>{v2}</div>
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
                const d = id ? allDrivers.find((x) => x.driver_id === id) : null;
                const color = d ? (TEAM_COLORS[teamSlug(d.constructor_name)] || '#fff') : '#666';
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
              {[...allDrivers]
                .sort((a, b) => {
                  const ca = a.constructor_name || '';
                  const cb = b.constructor_name || '';
                  if (ca !== cb) return ca.localeCompare(cb);
                  return (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
                })
                .map((d) => {
                const color = TEAM_COLORS[teamSlug(d.constructor_name)] || '#fff';
                const order = draft.indexOf(d.driver_id);
                const isSel = order !== -1;
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
