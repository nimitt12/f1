import React, { useEffect, useState } from 'react';

// Interfaces for Ergast API
interface Constructor {
  constructorId: string;
  url: string;
  name: string;
  nationality: string;
}

interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: Constructor;
  rounds?: string;
}

interface ApiConstructorRanking {
  id: string;
  constructors_id: number;
  season: number;
  rounds: number;
  wins: number;
  points: number;
  updated_at: string;
  name: string;
}

const NAME_TO_SLUG: Record<string, string> = {
  'Mercedes': 'mercedes',
  'Ferrari': 'ferrari',
  'McLaren': 'mclaren',
  'Haas F1 Team': 'haas',
  'Alpine F1 Team': 'alpine',
  'Red Bull': 'red_bull',
  'RB F1 Team': 'rb',
  'Audi': 'audi',
  'Williams': 'williams',
  'Cadillac F1 Team': 'cadillac',
  'Aston Martin': 'aston_martin',
};

const NAME_TO_NAT: Record<string, string> = {
  'Mercedes': 'German',
  'Ferrari': 'Italian',
  'McLaren': 'British',
  'Haas F1 Team': 'American',
  'Alpine F1 Team': 'French',
  'Red Bull': 'Austrian',
  'RB F1 Team': 'Italian',
  'Audi': 'German',
  'Williams': 'British',
  'Cadillac F1 Team': 'American',
  'Aston Martin': 'British',
};

const teamColors: Record<string, string> = {
  mercedes: 'var(--mercedes)',
  ferrari: 'var(--ferrari)',
  mclaren: 'var(--mclaren)',
  haas: 'var(--haas)',
  red_bull: 'var(--redbull)',
  alpine: 'var(--alpine)',
  rb: 'var(--racingbulls)',
  audi: 'var(--audi)',
  williams: 'var(--williams)',
  aston_martin: 'var(--aston)',
  cadillac: 'var(--cadillac)',
};

const NATIONALITY_ISO: Record<string, string> = {
  German: 'de',
  Italian: 'it',
  British: 'gb',
  American: 'us',
  French: 'fr',
  Austrian: 'at',
  Swiss: 'ch',
};

const Flag: React.FC<{ code: string | undefined }> = ({ code }) => {
  if (!code || code.length !== 2) {
    return <span style={{ fontSize: '16px', filter: 'grayscale(1)' }}>🏁</span>;
  }
  const lowerCode = code.toLowerCase();
  return (
    <img 
      src={`https://flagcdn.com/w40/${lowerCode}.png`} 
      srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
      width="18" 
      alt={code}
      style={{ 
        verticalAlign: 'text-bottom', 
        borderRadius: '1px',
        display: 'inline-block',
        marginRight: '6px',
        opacity: '0.9' 
      }}
    />
  );
};

const ConstructorSkeleton: React.FC = () => (
  <div className="con-row skeleton" style={{ borderLeft: '3px solid rgba(255,255,255,0.05)' }}>
    <div className="con-top">
      <div className="con-pos skeleton-box" style={{ width: '28px', height: '24px' }}></div>
      <div style={{ flex: 1, paddingLeft: '12px' }}>
        <div className="skeleton-box" style={{ width: '140px', height: '18px', marginBottom: '8px' }}></div>
        <div className="skeleton-box" style={{ width: '90px', height: '12px' }}></div>
      </div>
      <div className="skeleton-box" style={{ width: '45px', height: '24px' }}></div>
    </div>
    <div className="con-bar skeleton-box" style={{ height: '4px', marginTop: '14px', width: '100%', opacity: 0.3 }}></div>
  </div>
);

const ConstructorsStandings: React.FC = () => {
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [round, setRound] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch('https://pitwall-backend-dq9r.onrender.com/constructors/get-all-constructors-season-rankings');
        const data: ApiConstructorRanking[] = await response.json();
        
        // Map the flat API response to the nested structure the component expects
        const mappedStandings: ConstructorStanding[] = data.map((item: ApiConstructorRanking, index: number) => ({
          position: (index + 1).toString(),
          points: item.points.toString(),
          wins: item.wins.toString(),
          rounds: item.rounds.toString(),
          Constructor: {
            constructorId: NAME_TO_SLUG[item.name] || 'unknown',
            name: item.name,
            nationality: NAME_TO_NAT[item.name] || 'Unknown',
            url: ''
          }
        }));

        setStandings(mappedStandings);
        if (data.length > 0) {
          setRound(data[0].rounds.toString());
        }
      } catch (err) {
        console.error('Failed to parse standings', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStandings();
  }, []);

  const maxPoints = standings.length > 0 ? parseFloat(standings[0].points) : 1;

  return (
    <div id="constructors" className="col">
      <div className="col-head">
        <div className="col-name">
          Constructors' <em>Cup</em>
        </div>
        <div className="col-sub">All {standings.length} Teams · After {round} Rounds</div>
      </div>

      {loading && (
        <div className="standings-list">
          {[...Array(10)].map((_, i) => (
            <ConstructorSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="standings-list">
          {standings.map((item, index) => {
        const isLeader = index === 0;
        const teamColor = teamColors[item.Constructor.constructorId] || 'var(--ink-3)';
        const percentage = (parseFloat(item.points) / maxPoints) * 100;
        const delay = 4.5 + index * 0.08;
        const barDelay = 5.5 + index * 0.05;

        return (
          <div 
            key={item.Constructor.constructorId}
            className={`con-row ${isLeader ? 'leader' : ''}`}
            style={{ 
              '--team-color': teamColor, 
              animationDelay: `${delay}s` 
            } as React.CSSProperties}
          >
            <div className="con-top">
              <div className="con-pos">{item.position.padStart(2, '0')}</div>
              <div>
                <div className="con-name">{item.Constructor.name}</div>
                <div className="con-engine" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flag code={NATIONALITY_ISO[item.Constructor.nationality]} />
                  <span className="con-nat">{item.Constructor.nationality.toUpperCase()}</span>
                  {parseInt(item.wins) > 0 && (
                    <>
                      <span className="con-divider">|</span>
                      <span className="wins-count">WINS: {item.wins}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="con-pts">{item.points}</div>
            </div>
            <div className="con-bar">
              <div 
                className="con-bar-fill" 
                style={{ 
                  width: `${percentage}%`, 
                  animationDelay: `${barDelay}s` 
                }}
              ></div>
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
};

export default ConstructorsStandings;
