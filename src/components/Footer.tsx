import React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="footer-wrap">
      <footer className="footer">
        <div className="footer-main">
          <div className="f-col about">
            <div className="f-logo">
              PIT<span>WALL</span>
            </div>
            <p className="f-desc">
              The ultimate high-performance telemetry dashboard for Formula 1 enthusiasts. 
              Real-time data, deep analytics, and the pulse of the paddock, delivered with precision.
            </p>
          </div>
          
          <div className="f-col links">
            <h4 className="f-h">NAVIGATE</h4>
            <ul>
              <li><a href="#drivers">Drivers</a></li>
              <li><a href="#constructors">Constructors</a></li>
              <li><a href="#calendar">Calendar</a></li>
              <li><a href="#paddock">Paddock Intel</a></li>
            </ul>
          </div>

          <div className="f-col data">
            <h4 className="f-h">ENGINE ROOM</h4>
            <div className="data-source">
              <span className="source-label">Source</span>
              <span className="source-val">Official FIA Feed</span>
            </div>
            <div className="data-source">
              <span className="source-label">API</span>
              <span className="source-val">PitWall Internal</span>
            </div>
            <div className="data-source">
              <span className="source-label">Refresh</span>
              <span className="source-val">Live Sync 2026</span>
            </div>
          </div>

          <div className="f-col legal">
            <h4 className="f-h">PIT STOP</h4>
            <p className="f-legal-text">
              Not affiliated with the Formula One group of companies. 
              F1, FORMULA ONE, and related marks are trademarks of Formula One Licensing BV.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="f-note">
            <span className="f-dot"></span>Lights out and away we go<span className="f-dot"></span>
          </div>
          <div className="f-copyright">
            © 2026 THE PIT WALL <em>•</em> OPTIMIZED FOR PERFORMANCE
          </div>
          <div className="f-brand">
            The <em>Pit Wall</em>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
