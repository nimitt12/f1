import React, { useEffect, useState } from 'react';

interface TickerStats {
  topDriver: string;
  topDriverPoints: string;
  topConstructor: string;
  topConstructorPoints: number;
  youngestDriver: string;
  youngestDriverPoints: string;
  maxPoles: string;
  maxPolesCount: string;
}

const StatsRibbon: React.FC = () => {
  const [stats, setStats] = useState<TickerStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://pitwall-backend-dq9r.onrender.com/results/get-stats-overall/2026');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch ribbon stats", e);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return (
    <section className="stats-ribbon">
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat">
            <div className="stat-label">SYNCING...</div>
            <div className="stat-big">-</div>
            <div className="stat-sub">Awaiting live feed</div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <section className="stats-ribbon">
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-label">World Driver Lead</div>
          <div className="stat-big">
            <span>{stats.topDriverPoints}</span> PTS
          </div>
          <div className="stat-sub">{stats.topDriver.toUpperCase()} is leading</div>
        </div>
        <div className="stat">
          <div className="stat-label">Constructor Lead</div>
          <div className="stat-big">
            <span>{stats.topConstructorPoints}</span> PTS
          </div>
          <div className="stat-sub">{stats.topConstructor.toUpperCase()} dominant form</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pole Position King</div>
          <div className="stat-big">
            <span>{stats.maxPolesCount}</span> POLES
          </div>
          <div className="stat-sub">{stats.maxPoles.toUpperCase()} on Saturdays</div>
        </div>
        <div className="stat">
          <div className="stat-label">Rookie Standings</div>
          <div className="stat-big">
            <span>{stats.youngestDriverPoints}</span> PTS
          </div>
          <div className="stat-sub">{stats.youngestDriver.toUpperCase()} rising star</div>
        </div>
      </div>
    </section>
  );
};

export default StatsRibbon;
