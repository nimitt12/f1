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

const Ticker: React.FC = () => {
  const [stats, setStats] = useState<TickerStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://pitwall-backend-dq9r.onrender.com/results/get-stats-overall/2026');
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch ticker stats", e);
      }
    };
    fetchStats();
  }, []);

  const items = stats ? [
    { id: 1, sym: 'WDC', val: stats.topDriver.toUpperCase(), pts: `${stats.topDriverPoints} PTS` },
    { id: 2, sym: 'WCC', val: stats.topConstructor.toUpperCase(), pts: `${stats.topConstructorPoints} PTS` },
    { id: 3, sym: 'MAX POLES', val: stats.maxPoles.toUpperCase(), pts: `${stats.maxPolesCount}` },
    { id: 4, sym: 'ROOKIE', val: stats.youngestDriver.toUpperCase(), pts: `${stats.youngestDriverPoints} PTS` },
    // Keep some placeholders or derive these if possible, but user specifically gave one API
    { id: 5, sym: 'NEXT', val: 'MIAMI GP', pts: 'MAY 3' },
    { id: 6, sym: 'FASTEST PIT', val: 'MCLAREN', pts: '1.94S' },
  ] : [
    { id: 1, sym: 'WDC', val: 'ANTONELLI', pts: '72 PTS' },
    { id: 2, sym: 'WCC', val: 'MERCEDES', pts: '135 PTS' },
    { id: 3, sym: 'NEXT', val: 'MIAMI GP', pts: 'MAY 3' },
    { id: 4, sym: 'LAST RACE WINNER', val: 'ANTONELLI', pts: 'JAPAN' },
    { id: 6, sym: 'FASTEST PIT', val: 'MCLAREN', pts: '1.94S' },
    { id: 8, sym: 'ROOKIE', val: 'LINDBLAD', pts: '4 PTS' },
  ];

  const renderItems = () => (
    <>
      {items.map((it) => (
        <React.Fragment key={it.id}>
          <span className="tick">
            <span className="sym">{it.sym}</span> <span className="val">{it.val}</span>{' '}
            <span className="pts">{it.pts}</span>
          </span>
          <span className="tick tick-dot">◆</span>
        </React.Fragment>
      ))}
    </>
  );

  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  );
};

export default Ticker;
