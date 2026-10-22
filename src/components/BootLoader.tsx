import React, { useEffect, useEffectEvent, useState } from 'react';
import LogoMark from './LogoMark';

interface BootLoaderProps {
  onComplete: () => void;
}

const BootLoader: React.FC<BootLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const complete = useEffectEvent(onComplete);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      const timeout = setTimeout(() => complete(), 500);
      return () => clearTimeout(timeout);
    }

    // Keep the launch sequence independent of parent component re-renders.
    const timeouts = [350, 620, 890, 1160, 1430, 1850, 2100].map((delay, index) =>
      setTimeout(() => setPhase(index + 1), delay),
    );
    timeouts.push(setTimeout(() => complete(), 2800));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const ready = phase >= 6;

  return (
    <div className={`boot-loader ${phase >= 7 ? 'fade-out' : ''} ${ready ? 'go' : ''}`} role="status" aria-label="Loading My PitWall">
      <div className="boot-frame" aria-hidden="true" />
      <header className="boot-masthead" aria-hidden="true">
        <span className="boot-brand"><LogoMark /> MY PITWALL</span>
        <span className="boot-edition">THE RACE, REFINED.</span>
      </header>

      <div className="boot-content" aria-hidden="true">
        <div className="boot-instrument">
          <svg className="boot-dial" viewBox="0 0 280 280" fill="none">
            <circle className="boot-dial-track" cx="140" cy="140" r="123" />
            <circle className="boot-dial-ticks" cx="140" cy="140" r="113" />
            <circle className="boot-dial-inner" cx="140" cy="140" r="96" />
            <circle className="boot-dial-sweep" cx="140" cy="140" r="123" pathLength="100" />
            <path className="boot-dial-cross" d="M140 6v12M140 262v12M6 140h12M262 140h12" />
          </svg>
          <span className="boot-dial-label">P / W</span>
          <LogoMark className="boot-logo" />
          <span className="boot-dial-caption">RACE SYSTEMS</span>
          <span className="boot-instrument-index">01 — 05</span>
        </div>

        <p className="boot-eyebrow">YOUR FRONT ROW TO FORMULA 1</p>
        <h1 className="boot-title"><span className="boot-my">My </span><span className="boot-pit">Pit</span>Wall<span className="boot-dot">.</span></h1>
        <p className="boot-subtitle">Every fraction. Every finish.</p>

        <div className="boot-launch">
          <div className="boot-sequence-heading"><span>START SEQUENCE</span><span>{ready ? 'GO' : `${String(Math.min(phase, 5)).padStart(2, '0')} / 05`}</span></div>
          <div className="boot-lights">
            {[1, 2, 3, 4, 5].map((light) => (
              <div key={light} className={`boot-light-bank ${phase >= light && !ready ? 'is-lit' : ''}`}>
                <span className="boot-lamp" /><span className="boot-lamp" />
                <span className="boot-bank-number">0{light}</span>
              </div>
            ))}
          </div>
          <div className="boot-progress"><span /></div>
          <div className="boot-status"><span className="boot-status-dot" />{ready ? 'Lights out. You’re on the wall.' : 'Preparing your pit wall'}</div>
        </div>
      </div>

      <footer className="boot-footer" aria-hidden="true"><span>BUILT FOR THE OBSESSION.</span><span className="boot-footer-mark">///</span><span>PRECISION IN EVERY SECOND</span></footer>
    </div>
  );
};

export default BootLoader;
