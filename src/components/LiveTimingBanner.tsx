import React from 'react';

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
            The race. Every detail.
          </div>
          <h2 className="ltb-title">
            Your seat on<br />the <span>pit wall.</span>
          </h2>
          <p className="ltb-sub">
            Live timing, team radio, and every move on track. Get closer to the
            action — or relive a classic with session replays from 2018.
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
            <span>Enter Live Timing</span>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="ltb-visual" aria-hidden="true">
          <div className="ltb-visual-header">
            <span><i /> Live timing console</span>
            <span>Telemetry preview</span>
          </div>
          <div className="ltb-circuit">
            <span className="ltb-orbit ltb-orbit-one" />
            <span className="ltb-orbit ltb-orbit-two" />
            <svg className="ltb-track" viewBox="0 0 600 380" fill="none">
              <path className="ltb-track-guide" d="M30 190H570M300 30V350" />
              <g className="ltb-track-shape">
                <path className="ltb-track-shadow" d="M135 282 L80 218 Q69 203 86 190 L208 104 Q224 93 240 103 L280 128 Q292 136 306 120 L342 75 Q354 60 372 73 L493 153 Q510 164 494 180 L455 218 Q443 230 425 220 L386 198 Q371 190 357 206 L304 272 Q294 285 275 279 L234 264 Q218 259 205 274 L182 302 Q167 320 151 301 Z" />
                <path className="ltb-track-base" d="M135 282 L80 218 Q69 203 86 190 L208 104 Q224 93 240 103 L280 128 Q292 136 306 120 L342 75 Q354 60 372 73 L493 153 Q510 164 494 180 L455 218 Q443 230 425 220 L386 198 Q371 190 357 206 L304 272 Q294 285 275 279 L234 264 Q218 259 205 274 L182 302 Q167 320 151 301 Z" />
                <path className="ltb-track-trace" pathLength="100" d="M135 282 L80 218 Q69 203 86 190 L208 104 Q224 93 240 103 L280 128 Q292 136 306 120 L342 75 Q354 60 372 73 L493 153 Q510 164 494 180 L455 218 Q443 230 425 220 L386 198 Q371 190 357 206 L304 272 Q294 285 275 279 L234 264 Q218 259 205 274 L182 302 Q167 320 151 301 Z" />
              </g>
              <g className="ltb-track-labels">
                <text x="151" y="133">S1</text><text x="423" y="105">S2</text><text x="328" y="295">S3</text>
              </g>
              <circle className="ltb-car-halo" cx="399" cy="91" r="14" />
              <circle className="ltb-car" cx="399" cy="91" r="4" />
              <path className="ltb-callout-line" d="M399 91V42H450" />
              <text className="ltb-car-label" x="458" y="46">01 / LEADER</text>
              <path className="ltb-finish" d="m102 254 15-13m-11 18 15-13" />
            </svg>
            <div className="ltb-lap-card">
              <span className="ltb-data-label">Personal best</span>
              <strong>1:24<span>.083</span></strong>
              <div className="ltb-sectors"><i /><i /><i /></div>
              <span className="ltb-lap-delta">−0.218 <span>DELTA</span></span>
            </div>
            <div className="ltb-signal-card">
              <span className="ltb-data-label">Team radio</span>
              <div className="ltb-waveform">
                {[12, 24, 16, 32, 42, 21, 34, 16, 28, 40, 22, 14, 30, 18, 10].map((height, i) => (
                  <i key={i} style={{ height, animationDelay: `${i * -0.13}s` }} />
                ))}
              </div>
              <span className="ltb-radio-caption">Inside the conversation.</span>
            </div>
          </div>
          <div className="ltb-visual-footer">
            <span><b>01</b> Every sector.</span>
            <span><b>02</b> Every signal.</span>
            <span><b>03</b> Every second.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveTimingBanner;
