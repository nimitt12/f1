import React from 'react';
import { flushSync } from 'react-dom';
import LogoMark from './LogoMark';
import { COMMUNITY_URL } from '../lib/links';

const Footer: React.FC = () => {
  const navigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.history.pushState({}, '', e.currentTarget.getAttribute('href')!);
    flushSync(() => window.dispatchEvent(new PopStateEvent('popstate')));
    const section = window.location.hash.slice(1);
    if (section) document.getElementById(section)?.scrollIntoView();
    else window.scrollTo(0, 0);
  };

  return (
    <div className="footer-wrap">
      <footer className="footer">
        <div className="footer-finale">
          <div>
            <span className="f-eyebrow"><span className="f-grid-mark" aria-hidden="true" /> THE RACE NEVER ENDS</span>
            <h2>Every second.<br /><span>Closer to the race.</span></h2>
          </div>
          <div className="f-finale-action">
            <p>Your seat on the pit wall. Every session,<br />every battle, every defining moment.</p>
            <a href="/live" onClick={navigate} className="f-live-link">Explore live timing <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="footer-main">
          <div className="f-col about">
            <a href="/" onClick={navigate} className="f-logo" aria-label="My Pitwall home">
              <LogoMark className="f-logo-mark" aria-hidden="true" />
              <span className="f-logo-text">MY <span>PITWALL</span></span>
            </a>
            <p className="f-desc">
              Built for those who feel every lap. Race timing, deep analytics, and stories from the paddock, all in one place.
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
          
          <nav className="f-col links" aria-label="Footer race navigation">
            <h3 className="f-h"><span>01</span> THE GRID</h3>
            <ul>
              <li><a href="/standings" onClick={navigate}>Driver standings <span aria-hidden="true">↗</span></a></li>
              <li><a href="/constructor-standings" onClick={navigate}>Constructors <span aria-hidden="true">↗</span></a></li>
              <li><a href="/schedule" onClick={navigate}>Race calendar <span aria-hidden="true">↗</span></a></li>
              <li><a href="/results" onClick={navigate}>Race results <span aria-hidden="true">↗</span></a></li>
              <li><a href="/statistics" onClick={navigate}>Season statistics <span aria-hidden="true">↗</span></a></li>
            </ul>
          </nav>

          <nav className="f-col links" aria-label="Footer explore navigation">
            <h3 className="f-h"><span>02</span> GO DEEPER</h3>
            <ul>
              <li><a href="/live" onClick={navigate}>Live timing <span aria-hidden="true">↗</span></a></li>
              <li><a href="/clash" onClick={navigate}>Driver comparison <span aria-hidden="true">↗</span></a></li>
              <li><a href="/#paddock" onClick={navigate}>Paddock intel <span aria-hidden="true">↗</span></a></li>
              <li><a href="mailto:mypitwall@gmail.com">Get in touch <span aria-hidden="true">↗</span></a></li>
            </ul>
          </nav>

          <div className="f-community">
            <span className="f-eyebrow">PADDOCK PASS / ALL ACCESS</span>
            <span className="f-community-icon" aria-hidden="true">↗</span>
            <h3>Better with<br />the whole grid.</h3>
            <p>Share your takes. Shape what’s next. There’s a place for you in our paddock.</p>
            <a href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Join the community <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </div>

        <div className="f-fineprint">
          <p>Independent by design. Driven by passion.<span>Not affiliated with the Formula One group of companies. F1, FORMULA ONE, and related marks are trademarks of Formula One Licensing BV.</span></p>
          <div><a href="/privacy" onClick={navigate}>Privacy policy</a><a href="/account-deletion" onClick={navigate}>Delete my account</a></div>
        </div>

        <div className="footer-wordmark" aria-hidden="true">
          MY<span>PITWALL</span>
        </div>

        <div className="footer-bottom">
          <div className="f-note">
            <span className="f-dot"></span>Lights out and away we go<span className="f-dot"></span>
          </div>
          <div className="f-copyright">
            © {new Date().getFullYear()} MY PITWALL <em> / </em> MADE FOR THE RACE
          </div>
          <button className="f-back-top" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Back to top <span aria-hidden="true">↑</span></button>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
