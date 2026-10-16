import React from 'react';

interface SeasonStatisticsTeaserProps {
  onOpen: () => void;
}

const SeasonStatisticsTeaser: React.FC<SeasonStatisticsTeaserProps> = ({ onOpen }) => (
  <section className="season-stats-teaser" aria-labelledby="season-stats-teaser-title">
    <div className="sst-grid" aria-hidden="true" />
    <div className="sst-copy">
      <span className="sst-kicker"><i /> Data lab · 1950—present</span>
      <h2 id="season-stats-teaser-title">Every finish.<br /><em>A story in data.</em></h2>
      <p>Explore classified finishes, retirements, incidents and mechanical failures across all of Formula 1 history.</p>
      <button className="nr-view-results-btn nr-all-results-btn" type="button" onClick={onOpen}>
        Explore statistics <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </button>
    </div>
    <div className="sst-visual" aria-hidden="true">
      <div className="sst-archive-year">1950<span>Where the story begins.</span></div>
      <div className="sst-dossier">
        <div className="sst-dossier-head"><span><i /> The finish line</span><span>Archive / 01</span></div>
        <div className="sst-matrix">
          {Array.from({ length: 72 }, (_, i) => (
            <i key={i} className={i % 13 === 0 ? 'sst-cell-incident' : i % 7 === 0 ? 'sst-cell-retired' : i % 5 === 0 ? 'sst-cell-muted' : ''} style={{ '--cell-delay': `${i * 17}ms` } as React.CSSProperties} />
          ))}
        </div>
        <div className="sst-matrix-caption"><span>Every start has an outcome.</span><span>Illustrative data</span></div>
        <div className="sst-outcomes">
          <div><span>01</span><strong>Classified</strong><i /><small>Across the line</small></div>
          <div><span>02</span><strong>Retirements</strong><i /><small>End of the road</small></div>
          <div><span>03</span><strong>Incidents</strong><i /><small>The turning point</small></div>
          <div><span>04</span><strong>Mechanical</strong><i /><small>At the limit</small></div>
        </div>
      </div>
      <div className="sst-era-strip"><span>1950</span><i /><span>1980</span><i /><span>2000</span><i /><span>Today <b /> </span></div>
    </div>
  </section>
);

export default SeasonStatisticsTeaser;
