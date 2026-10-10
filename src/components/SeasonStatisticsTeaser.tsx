import React from 'react';

interface SeasonStatisticsTeaserProps {
  onOpen: () => void;
}

const SeasonStatisticsTeaser: React.FC<SeasonStatisticsTeaserProps> = ({ onOpen }) => (
  <section className="season-stats-teaser" aria-labelledby="season-stats-teaser-title">
    <div className="sst-grid" aria-hidden="true" />
    <div className="sst-copy">
      <span className="sst-kicker"><i /> Data lab · 1950—present</span>
      <h2 id="season-stats-teaser-title">How did every car <em>finish?</em></h2>
      <p>Explore classified finishes, retirements, incidents and mechanical failures across all of Formula 1 history.</p>
      <button type="button" onClick={onOpen}>
        Explore all-time statistics <span aria-hidden="true">↗</span>
      </button>
    </div>
    <div className="sst-visual" aria-hidden="true">
      <div className="sst-orbit"><span>F1</span><small>all-time archive</small></div>
      <div className="sst-bars">
        <i style={{ '--bar': '92%' } as React.CSSProperties} />
        <i style={{ '--bar': '68%' } as React.CSSProperties} />
        <i style={{ '--bar': '43%' } as React.CSSProperties} />
        <i style={{ '--bar': '25%' } as React.CSSProperties} />
        <i style={{ '--bar': '12%' } as React.CSSProperties} />
      </div>
    </div>
  </section>
);

export default SeasonStatisticsTeaser;
