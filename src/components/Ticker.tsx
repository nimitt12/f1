import React, { useEffect, useState } from 'react';
import { RACES, fetchRaces } from '../data/races';

interface RaceResult {
  id: string;
  position: string;
  points: string;
  given_name: string;
  family_name: string;
  team_name: string;
}

const Ticker: React.FC = () => {
  const [results, setResults] = useState<RaceResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const races = await fetchRaces();
        const today = new Date();
        const prevRace = races.filter(r => new Date(r.date) < today).pop() || races[0] || RACES[0];

        const res = await fetch(`https://pitwall-backend-dq9r.onrender.com/results/get-all-results/${prevRace.season}/${prevRace.round}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error("Failed to fetch ticker results", e);
      }
    };
    fetchResults();
  }, []);

  const renderItems = () => (
    <>
      {results.map((r) => (
        <React.Fragment key={r.id}>
          <span className="tick">
            <span className="sym">P{r.position}</span>
            <span className="val">{`${r.given_name} ${r.family_name}`.toUpperCase()}</span>
            <span className="pts"><span className="pts-num">{r.points}</span><span className="pts-unit">PTS</span></span>
          </span>
          <span className="tick tick-dot">◆</span>
        </React.Fragment>
      ))}
      {results.length === 0 && (
        <span className="tick">LOADING LATEST RACE RESULTS...</span>
      )}
    </>
  );

  return (
    <div className="ticker-wrap">
      <div className="ticker-fade-l" />
      <div className="ticker-track">
        {renderItems()}
        {renderItems()}
      </div>
      <div className="ticker-fade-r" />
    </div>
  );
};

export default Ticker;
