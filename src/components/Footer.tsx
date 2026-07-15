import React from 'react';
import LogoMark from './LogoMark';

const Footer: React.FC = () => {
  return (
    <div className="footer-wrap">
      <footer className="footer">
        <div className="footer-main">
          <div className="f-col about">
            <div className="f-logo">
              <LogoMark className="f-logo-mark" aria-hidden="true" />
              <span className="f-logo-text">MY <span>PITWALL</span></span>
            </div>
            <p className="f-desc">
              The ultimate high-performance telemetry dashboard for Formula 1 enthusiasts.
              Real-time data, deep analytics, and the pulse of the paddock, delivered with precision.
            </p>
            <div className="f-socials">
              <a href="https://x.com/mypitwallin" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com/mypitwall.in" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              <a href="https://facebook.com/mypitwallin" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
              </a>
              <a href="mailto:mypitwall@gmail.com" aria-label="Email">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 12.713L.015 4.5A2 2 0 0 1 2 3h20a2 2 0 0 1 1.985 1.5L12 12.713zM12 15.147L0 6.925V19a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6.925l-12 8.222z" />
                </svg>
              </a>
            </div>
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

        <div className="footer-wordmark" aria-hidden="true">
          MY <span>PITWALL</span>
        </div>

        <div className="footer-bottom">
          <div className="f-note">
            <span className="f-dot"></span>Lights out and away we go<span className="f-dot"></span>
          </div>
          <div className="f-copyright">
            © 2026 MY PITWALL <em>•</em> OPTIMIZED FOR PERFORMANCE
          </div>
          <div className="f-brand">
            My <em>PitWall</em>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
