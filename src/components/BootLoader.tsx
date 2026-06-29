import React, { useEffect, useState } from 'react';
import LogoMark from './LogoMark';

interface BootLoaderProps {
  onComplete: () => void;
}

const BootLoader: React.FC<BootLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Sequence the F1 starting lights
    const timeouts = [
      setTimeout(() => setPhase(1), 350),
      setTimeout(() => setPhase(2), 620),
      setTimeout(() => setPhase(3), 890),
      setTimeout(() => setPhase(4), 1160),
      setTimeout(() => setPhase(5), 1430), // 5th light on
      setTimeout(() => setPhase(6), 1850), // Lights out
      setTimeout(() => setPhase(7), 2100), // Fade out loader
      setTimeout(() => onComplete(), 2800), // Remove from DOM
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  if (phase >= 8) return null;

  const litCount = Math.min(phase, 5);
  const progress = phase >= 6 ? 100 : (litCount / 5) * 100;

  return (
    <div className={`boot-loader ${phase >= 7 ? 'fade-out' : ''} ${phase >= 6 ? 'go' : ''}`}>
      <div className="boot-aura boot-aura-a" />
      <div className="boot-aura boot-aura-b" />
      <div className="boot-grid" />
      <div className="boot-vignette" />
      <div className="boot-flash" />

      <div className="boot-content">
        <div className="boot-logo-wrap">
          <span className="boot-logo-ring" aria-hidden="true" />
          <span className="boot-logo-ring boot-logo-ring-2" aria-hidden="true" />
          <LogoMark className="boot-logo" role="img" aria-label="My PitWall" />
        </div>
        <h1 className="boot-title">
          <span className="boot-my">My</span><span className="boot-word"><span className="boot-pit">Pit</span>Wall<span className="dot">.</span></span>
        </h1>

        <div className="starting-lights">
          <div className="lights-gantry">
            {[1, 2, 3, 4, 5].map((light) => {
              const on = phase >= light && phase < 6;
              return (
                <div key={light} className="light-pod">
                  <span className="light-hood" />
                  <span className={`light ${on ? 'on' : ''}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="boot-progress">
          <div className="boot-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className={`boot-status ${phase >= 6 ? 'go-text' : ''}`}>
          {phase < 6 ? (
            <>
              ESTABLISHING TELEMETRY LINK<span className="boot-caret">_</span>
            </>
          ) : (
            'LIGHTS OUT'
          )}
        </div>
      </div>
    </div>
  );
};

export default BootLoader;
