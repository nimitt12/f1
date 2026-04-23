/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import antonelliImg from '../assets/ant.png';
import russellImg from '../assets/rus.png';

const DriverBattle: React.FC = () => {
  const drivers = [
    {
      id: 'P1',
      name: 'Andrea Kimi Antonelli',
      team: 'Mercedes-AMG',
      pts: 72,
      wins: 2,
      podiums: 3,
      fastestLaps: 1,
      color: '#00D2BE',
      image: antonelliImg
    },
    {
      id: 'P2',
      name: 'George Russell',
      team: 'Mercedes-AMG',
      pts: 62,
      wins: 1,
      podiums: 2,
      fastestLaps: 1,
      color: '#00D2BE',
      image: russellImg
    }
  ];

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
        <div className="battle-card p1" style={{ '--team-color': drivers[0].color } as any}>
          <div className="battle-image-wrap">
             <div className="battle-bg-name">{drivers[0].id.toUpperCase()}</div>
             <img src={drivers[0].image} alt={drivers[0].name} className="battle-driver-img" />
          </div>
          <div className="battle-info">
            <div className="battle-pos">12</div>
            <h3 className="battle-name">{drivers[0].name}</h3>
            <span className="battle-team">{drivers[0].team}</span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="battle-vs">
           <div className="vs-circle">VS</div>
        </div>

        {/* Driver 2 */}
        <div className="battle-card p2" style={{ '--team-color': drivers[1].color } as any}>
          <div className="battle-image-wrap">
             <div className="battle-bg-name">{drivers[1].id.toUpperCase()}</div>
             <img src={drivers[1].image} alt={drivers[1].name} className="battle-driver-img" />
          </div>
          <div className="battle-info">
            <div className="battle-pos">63</div>
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
