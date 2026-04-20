import React from 'react';

const Ticker: React.FC = () => {
  const items = [
    { id: 1, sym: 'WDC', val: 'ANTONELLI', pts: '72 pts' },
    { id: 2, sym: 'WCC', val: 'MERCEDES', pts: '135 pts' },
    { id: 3, sym: 'NEXT', val: 'MIAMI GP', pts: 'MAY 3' },
    { id: 4, sym: 'WINNER', val: 'ANTONELLI', pts: 'JAPAN' },
    { id: 5, sym: 'FL', val: 'RUSSELL', pts: '1:28.411' },
    { id: 6, sym: 'FAST PIT', val: 'MCLAREN', pts: '1.94s' },
    { id: 7, sym: 'VER', val: '−60', pts: 'P9' },
    { id: 8, sym: 'ROOKIE', val: 'LINDBLAD', pts: '4 pts' },
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
        {/* Double the items for seamless loop */}
        {renderItems()}
        {renderItems()}
      </div>
    </div>
  );
};

export default Ticker;
