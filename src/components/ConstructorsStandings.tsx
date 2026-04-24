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
}

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

const ConstructorsStandings: React.FC = () => {
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [round, setRound] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        // Mock data from user request
        const data = {"MRData":{"xmlns":"","series":"f1","url":"https://api.jolpi.ca/ergast/f1/2026/constructorstandings/","limit":"30","offset":"0","total":"11","StandingsTable":{"season":"2026","round":"3","StandingsLists":[{"season":"2026","round":"3","ConstructorStandings":[{"position":"1","positionText":"1","points":"135","wins":"3","Constructor":{"constructorId":"mercedes","url":"https://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One","name":"Mercedes","nationality":"German"}},{"position":"2","positionText":"2","points":"90","wins":"0","Constructor":{"constructorId":"ferrari","url":"https://en.wikipedia.org/wiki/Scuderia_Ferrari","name":"Ferrari","nationality":"Italian"}},{"position":"3","positionText":"3","points":"46","wins":"0","Constructor":{"constructorId":"mclaren","url":"https://en.wikipedia.org/wiki/McLaren","name":"McLaren","nationality":"British"}},{"position":"4","positionText":"4","points":"18","wins":"0","Constructor":{"constructorId":"haas","url":"https://en.wikipedia.org/wiki/Haas_F1_Team","name":"Haas F1 Team","nationality":"American"}},{"position":"5","positionText":"5","points":"16","wins":"0","Constructor":{"constructorId":"alpine","url":"https://en.wikipedia.org/wiki/Alpine_F1_Team","name":"Alpine F1 Team","nationality":"French"}},{"position":"6","positionText":"6","points":"16","wins":"0","Constructor":{"constructorId":"red_bull","url":"https://en.wikipedia.org/wiki/Red_Bull_Racing","name":"Red Bull","nationality":"Austrian"}},{"position":"7","positionText":"7","points":"14","wins":"0","Constructor":{"constructorId":"rb","url":"https://en.wikipedia.org/wiki/Racing_Bulls","name":"RB F1 Team","nationality":"Italian"}},{"position":"8","positionText":"8","points":"2","wins":"0","Constructor":{"constructorId":"audi","url":"https://en.wikipedia.org/wiki/Audi_in_Formula_One","name":"Audi","nationality":"German"}},{"position":"9","positionText":"9","points":"2","wins":"0","Constructor":{"constructorId":"williams","url":"https://en.wikipedia.org/wiki/Williams_Racing","name":"Williams","nationality":"British"}},{"position":"10","positionText":"10","points":"0","wins":"0","Constructor":{"constructorId":"cadillac","url":"https://en.wikipedia.org/wiki/Cadillac_in_Formula_One","name":"Cadillac F1 Team","nationality":"American"}},{"position":"11","positionText":"11","points":"0","wins":"0","Constructor":{"constructorId":"aston_martin","url":"https://en.wikipedia.org/wiki/Aston_Martin_in_Formula_One","name":"Aston Martin","nationality":"British"}}]}]}}};
        
        const list = data.MRData.StandingsTable.StandingsLists[0];
        if (list) {
          setRound(list.round);
          setStandings(list.ConstructorStandings);
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

      {loading && <div style={{ padding: '24px' }}>Loading team standings...</div>}

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
