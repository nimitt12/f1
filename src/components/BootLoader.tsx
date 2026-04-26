import React, { useEffect, useState } from 'react';

interface BootLoaderProps {
  onComplete: () => void;
}

const BootLoader: React.FC<BootLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Sequence the F1 starting lights
    const timeouts = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 2000), // 5th light on
      setTimeout(() => setPhase(6), 2400), // Lights out
      setTimeout(() => setPhase(7), 2700), // Fade out loader
      setTimeout(() => onComplete(), 3200), // Remove from DOM
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  if (phase >= 8) return null;

  return (
    <div className={`boot-loader ${phase >= 7 ? 'fade-out' : ''}`}>
      <div className="boot-content">
        <h1 className="boot-title">
          <span>Pit</span>Wall<span className="dot">.</span>
        </h1>
        
        <div className="starting-lights">
          {[1, 2, 3, 4, 5].map((light) => (
            <div key={light} className="light-box">
              <div className={`light ${phase >= light && phase < 6 ? 'on' : ''}`}></div>
            </div>
          ))}
        </div>
        
        <div className="boot-status">
          {phase < 6 ? 'ESTABLISHING TELEMETRY LINK...' : 'LIGHTS OUT!'}
        </div>
      </div>
    </div>
  );
};

export default BootLoader;
