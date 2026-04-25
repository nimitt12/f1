import React, { useEffect, useState } from 'react';

// Interfaces for Ergast API
interface Driver {
  driverId: string;
  code: string;
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber: string;
}

interface Constructor {
  constructorId: string;
  name: string;
}

interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: Driver;
  Constructors: Constructor[];
}

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

const getCountryCode = (nationality: string): string => {
  const map: Record<string, string> = {
    Italian: 'ITA',
    British: 'GBR',
    Monegasque: 'MON',
    Australian: 'AUS',
    French: 'FRA',
    Dutch: 'NED',
    'New Zealander': 'NZL',
    Spanish: 'ESP',
    German: 'GER',
    Canadian: 'CAN',
    Thai: 'THA',
    Finnish: 'FIN',
    Danish: 'DEN',
    Japanese: 'JPN',
    Chinese: 'CHN',
    American: 'USA',
    Mexican: 'MEX',
    Brazilian: 'BRA',
    Argentine: 'ARG',
  };
  return map[nationality] || nationality.substring(0, 3).toUpperCase();
};

const Flag: React.FC<{ code: string | undefined }> = ({ code }) => {
  if (!code || code.length !== 2) {
    return <span style={{ fontSize: '14px', marginRight: '6px', filter: 'grayscale(1)' }}>🏁</span>;
  }
  const lowerCode = code.toLowerCase();
  return (
    <img 
      src={`https://flagcdn.com/w40/${lowerCode}.png`} 
      srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
      width="16" 
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

const DriverSkeleton: React.FC = () => (
  <div className="driver-row skeleton" style={{ borderLeft: '3px solid rgba(255,255,255,0.05)' }}>
    <div className="driver-pos skeleton-box" style={{ width: '28px', height: '24px' }}></div>
    <div className="driver-info" style={{ flex: 1, paddingLeft: '12px' }}>
      <div className="driver-line" style={{ marginBottom: '8px' }}>
        <div className="skeleton-box" style={{ width: '150px', height: '20px' }}></div>
        <div className="skeleton-box" style={{ width: '40px', height: '18px' }}></div>
      </div>
      <div className="driver-team">
        <div className="skeleton-box" style={{ width: '100px', height: '10px' }}></div>
      </div>
    </div>
    <div className="driver-pts-wrap">
      <div className="skeleton-box" style={{ width: '40px', height: '28px' }}></div>
    </div>
  </div>
);

const DriversStandings: React.FC = () => {
  const [standings, setStandings] = useState<DriverStanding[]>([]);
  const [round, setRound] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch('https://pitwall-backend-dq9r.onrender.com/drivers/get-all-drivers-season-rankings');
        const data: ApiDriverRanking[] = await response.json();
        
        const mappedStandings: DriverStanding[] = data.map((item) => {
          const constructorId = NAME_TO_SLUG[item.constructor_name] || item.constructor_name.toLowerCase().replace(/ /g, '_');
          return {
            position: item.position,
            points: item.points,
            wins: item.wins,
            Driver: {
              driverId: item.driver_id,
              code: item.code,
              givenName: item.given_name,
              familyName: item.family_name,
              nationality: item.nationality,
              permanentNumber: item.number
            },
            Constructors: [{
              constructorId: constructorId,
              name: item.constructor_name
            }]
          };
        });

        setStandings(mappedStandings);
        if (data.length > 0) {
          setRound(data[0].rounds);
        }
      } catch (err) {
        console.error('Failed to parse standings', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStandings();
  }, []);

  const leaderPoints = standings.length > 0 ? parseFloat(standings[0].points) : 0;

  return (
    <div id="drivers" className="col">
      <div className="col-head">
        <div className="col-name">
          Drivers' <em>Championship</em>
        </div>
        <div className="col-sub">After {round} Rounds</div>
      </div>

      {loading && (
        <div className="standings-list">
          {[...Array(12)].map((_, i) => (
            <DriverSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="standings-list">
          {standings.map((item, index) => {
            const isLeader = index === 0;
            const constructorId = item.Constructors[0]?.constructorId || 'unknown';
            const teamColor = teamColors[constructorId] || 'var(--ink-3)';
            const delay = 4.5 + index * 0.08;
            
            const driverName = `${item.Driver.givenName} ${item.Driver.familyName}`;
            const ptsDiff = leaderPoints - parseFloat(item.points);

            return (
              <div 
                key={item.Driver.driverId}
                className={`driver-row ${isLeader ? 'leader' : ''}`} 
                style={{ '--team-color': teamColor, animationDelay: `${delay}s` } as React.CSSProperties}
              >
                <div className="driver-pos">{item.position.padStart(2, '0')}</div>
                <div className="driver-info">
                  <div className="driver-line">
                    <span className="driver-name">{driverName}</span>
                    <span 
                      className="driver-code" 
                      style={{ 
                        background: teamColor, 
                        color: constructorId === 'mercedes' ? '#000' : '#fff' 
                      }}
                    >
                      {item.Driver.code || item.Driver.familyName.substring(0, 3).toUpperCase()}/{item.Driver.permanentNumber}
                    </span>
                  </div>
                  <div className="driver-team">
                    <span className="team-name">{item.Constructors[0]?.name.toUpperCase()}</span>
                    <span className="driver-divider">|</span>
                    <span className="driver-nat">
                      <Flag code={NATIONALITY_ISO[item.Driver.nationality]} />
                      {getCountryCode(item.Driver.nationality)}
                    </span>
                    {parseInt(item.wins) > 0 && (
                      <>
                        <span className="driver-divider">|</span>
                        <span className="wins-count">WINS: {item.wins}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="driver-pts-wrap">
                  <div className="driver-pts">{item.points}</div>
                  <div className="driver-pts-sub" style={{ color: 'var(--paper)' }}>pts</div>
                  {ptsDiff > 0 && <div className="driver-pts-sub">-{ptsDiff}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DriversStandings;
