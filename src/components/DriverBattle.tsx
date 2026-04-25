import React, { useEffect, useState } from 'react';
import antonelliImg from '../assets/ant.png';
import russellImg from '../assets/rus.png';

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
  id: string;
  number: string;
  name: string;
  team: string;
  pts: number;
  wins: number;
  podiums: number;
  color: string;
  image: string;
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
  audi: '#000000',
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

const DriverBattle: React.FC = () => {
  const [drivers, setDrivers] = useState<BattleDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBattleData = async () => {
      try {
        const response = await fetch('https://pitwall-backend-dq9r.onrender.com/drivers/get-all-drivers-season-rankings');
        const data: ApiDriverRanking[] = await response.json();
        
        const top2 = data.slice(0, 2).map((d, idx) => {
          const teamId = NAME_TO_SLUG[d.constructor_name] || d.constructor_name.toLowerCase().replace(/ /g, '_');
          return {
            id: `P${idx + 1}`,
            number: d.number,
            name: `${d.given_name} ${d.family_name}`,
            team: d.constructor_name.toUpperCase(),
            pts: parseInt(d.points),
            wins: parseInt(d.wins),
            podiums: parseInt(d.wins) + 1, // Mocking podiums as wins + 1 for visual flair
            color: TEAM_COLORS[teamId] || '#ffffff',
            image: DRIVER_IMAGES[d.code] || (idx === 0 ? antonelliImg : russellImg) // Fallback to current assets
          };
        });
        setDrivers(top2);
      } catch (err) {
        console.error('Battle data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBattleData();
  }, []);

  if (loading || drivers.length < 2) {
    return <div className="driver-battle-section" style={{ opacity: 0.5 }}>Loading Clash...</div>;
  }

  const stats = [
    { label: 'Championship Points', key: 'pts' },
    { label: 'Grand Prix Wins', key: 'wins' },
    { label: 'Podiums', key: 'podiums' }
  ];

  return (
    <section className="driver-battle-section">
      <div className="battle-header">
        <h2 className="battle-title">Driver's <em>Clash</em></h2>
      </div>

      <div className="battle-container">
        {/* Driver 1 */}
        <div className="battle-card p1" style={{ '--team-color': drivers[0].color } as React.CSSProperties}>
          <div className="battle-image-wrap">
             <div className="battle-bg-name">{drivers[0].id.toUpperCase()}</div>
             <img src={drivers[0].image} alt={drivers[0].name} className="battle-driver-img" />
          </div>
          <div className="battle-info">
            <div className="battle-pos">{drivers[0].number}</div>
            <h3 className="battle-name">{drivers[0].name}</h3>
            <span className="battle-team">{drivers[0].team}</span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="battle-vs">
           <div className="vs-circle">VS</div>
        </div>

        {/* Driver 2 */}
        <div className="battle-card p2" style={{ '--team-color': drivers[1].color } as React.CSSProperties}>
          <div className="battle-image-wrap">
             <div className="battle-bg-name">{drivers[1].id.toUpperCase()}</div>
             <img src={drivers[1].image} alt={drivers[1].name} className="battle-driver-img" />
          </div>
          <div className="battle-info">
            <div className="battle-pos">{drivers[1].number}</div>
            <h3 className="battle-name">{drivers[1].name}</h3>
            <span className="battle-team">{drivers[1].team}</span>
          </div>
        </div>

        {/* Stats Overlay */}
        <div className="battle-stats-overlay">
          {stats.map((stat, idx) => (
            <div key={idx} className="battle-stat-row">
              <div className="stat-val v1">{drivers[0][stat.key as keyof typeof drivers[0]]}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-val v2">{drivers[1][stat.key as keyof typeof drivers[1]]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DriverBattle;
