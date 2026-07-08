import React from 'react';
import previewImg from '../assets/live-timing-preview.jpg';

interface LiveTimingBannerProps {
  onOpenLiveTiming: () => void;
}

const FEATURES = [
  'Timing Tower',
  'Live Track Map',
  'Car Telemetry',
  'Race Control',
  'Team Radio',
  'Archive Replay',
];

const LiveTimingBanner: React.FC<LiveTimingBannerProps> = ({ onOpenLiveTiming }) => {
  return (
    <section className="ltb-banner" aria-label="Live timing feature">
      <div className="ltb-inner">
        <span className="ltb-glow" aria-hidden="true" />
        <span className="ltb-grid-lines" aria-hidden="true" />

        <div className="ltb-copy">
          <div className="ltb-eyebrow">
            <span className="ltb-live-dot" aria-hidden="true" />
            New · Now Live
          </div>
          <h2 className="ltb-title">
            Live Timing <span>Console</span>
          </h2>
          <p className="ltb-sub">
            Follow every session in real time — a full pit-wall console with the timing
            tower, live track map, car telemetry, race control and team radio. Or dive
            into the archive and replay any Grand Prix since 2018.
          </p>

          <ul className="ltb-features">
            {FEATURES.map((f) => (
              <li key={f} className="ltb-feature">
                <span className="ltb-feature-mark" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <button className="ltb-cta" onClick={onOpenLiveTiming}>
            <span className="ltb-cta-dot" aria-hidden="true" />
            <span>Enter Live Timing</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="ltb-shot">
          <img src={previewImg} alt="Pitwall live timing console — leaderboard, track map and race control" loading="lazy" />
        </div>
      </div>
    </section>
  );
};

export default LiveTimingBanner;
