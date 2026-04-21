import React from 'react';

const ConstructorsStandings: React.FC = () => {
  return (
    <div className="col">
      <div className="col-head">
        <div className="col-name">
          Constructors' <em>Cup</em>
        </div>
        <div className="col-sub">All 11 teams · 2026</div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--mercedes)', animationDelay: '4.5s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">01</div>
          <div>
            <div className="con-name">Mercedes-AMG</div>
            <div className="con-engine">Mercedes PU · DEU</div>
          </div>
          <div className="con-pts">135</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '100%', animationDelay: '5.5s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--ferrari)', animationDelay: '4.58s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">02</div>
          <div>
            <div className="con-name">Scuderia Ferrari</div>
            <div className="con-engine">Ferrari PU · ITA</div>
          </div>
          <div className="con-pts">90</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '66%', animationDelay: '5.55s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--mclaren)', animationDelay: '4.66s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">03</div>
          <div>
            <div className="con-name">McLaren</div>
            <div className="con-engine">Mercedes PU · GBR</div>
          </div>
          <div className="con-pts">46</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '34%', animationDelay: '5.6s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--haas)', animationDelay: '4.74s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">04</div>
          <div>
            <div className="con-name">Haas F1</div>
            <div className="con-engine">Ferrari PU · USA</div>
          </div>
          <div className="con-pts">18</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '13%', animationDelay: '5.65s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--redbull)', animationDelay: '4.82s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">05</div>
          <div>
            <div className="con-name">Red Bull Racing</div>
            <div className="con-engine">Red Bull Ford · AUT</div>
          </div>
          <div className="con-pts">16</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '12%', animationDelay: '5.7s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--alpine)', animationDelay: '4.90s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">06</div>
          <div>
            <div className="con-name">Alpine</div>
            <div className="con-engine">Mercedes PU · FRA</div>
          </div>
          <div className="con-pts">16</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '12%', animationDelay: '5.75s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--racingbulls)', animationDelay: '4.98s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">07</div>
          <div>
            <div className="con-name">Racing Bulls</div>
            <div className="con-engine">Red Bull Ford · ITA</div>
          </div>
          <div className="con-pts">14</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '10%', animationDelay: '5.8s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--audi)', animationDelay: '5.06s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">08</div>
          <div>
            <div className="con-name">Audi</div>
            <div className="con-engine">Audi PU · DEU</div>
          </div>
          <div className="con-pts">2</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '2%', animationDelay: '5.85s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--williams)', animationDelay: '5.14s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">09</div>
          <div>
            <div className="con-name">Williams</div>
            <div className="con-engine">Mercedes PU · GBR</div>
          </div>
          <div className="con-pts">2</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '2%', animationDelay: '5.9s' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--aston)', animationDelay: '5.22s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">10</div>
          <div>
            <div className="con-name">Aston Martin</div>
            <div className="con-engine">Honda PU · GBR</div>
          </div>
          <div className="con-pts">0</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '0%' }}></div>
        </div>
      </div>

      <div className="con-row" style={{ '--team-color': 'var(--cadillac)', animationDelay: '5.30s' } as React.CSSProperties}>
        <div className="con-top">
          <div className="con-pos">11</div>
          <div>
            <div className="con-name">Cadillac</div>
            <div className="con-engine">Ferrari PU · USA · NEW</div>
          </div>
          <div className="con-pts">0</div>
        </div>
        <div className="con-bar">
          <div className="con-bar-fill" style={{ width: '0%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ConstructorsStandings;
