import './AppDownloadBanner.css';

export default function AppDownloadBanner() {
  return (
    <section className="app-download" aria-labelledby="app-download-title">
      <div className="app-download-card">
        <div className="app-download-copy">
          <span className="app-download-eyebrow"><span /> PITWALL FOR ANDROID</span>
          <h2 id="app-download-title">Your pit wall.<br /><em>Now in your pocket.</em></h2>
          <p>Take your race weekend with you. Get the Pitwall app and keep the grid within reach.</p>
          <a className="app-download-link" href="https://play.google.com/store/apps/details?id=com.mypitwall.app" target="_blank" rel="noopener noreferrer" aria-label="Download Pitwall on Google Play (opens in a new tab)">
            <svg viewBox="0 0 32 36" width="29" height="33" aria-hidden="true">
              <path fill="#4285f4" d="M2 2 18 18 2 34Z" />
              <path fill="#34a853" d="m2 2 20 11-4 5Z" />
              <path fill="#fbbc04" d="m22 13 8 4.4q1 .6 0 1.2L22 23l-5-5Z" />
              <path fill="#ea4335" d="m2 34 16-16 4 5Z" />
            </svg>
            <span><small>GET IT ON</small><strong>Google Play</strong></span>
            <span className="app-download-arrow" aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="app-download-art">
          <div className="app-download-telemetry" aria-hidden="true">
            <svg className="app-download-circuit" viewBox="0 0 600 480" fill="none">
              <circle cx="300" cy="240" r="190" />
              <circle cx="300" cy="240" r="150" />
              <path className="app-download-crosshair" d="M30 240H570M300 30V450" />
              <path className="app-download-circuit-line" d="M82 300 180 195Q194 180 216 190L264 212Q280 220 292 198L330 122Q341 102 361 112L508 184Q530 194 516 215L478 267Q467 283 447 276L392 254Q372 246 360 268L304 366Q294 384 272 380L216 369Q194 364 182 385L159 420Q147 437 129 420L72 365Q50 344 82 300Z" />
              <path className="app-download-circuit-highlight" d="M72 365Q50 344 82 300L180 195Q194 180 216 190L264 212" />
              <circle className="app-download-signal-halo" cx="490" cy="175" r="15" />
              <circle className="app-download-signal" cx="490" cy="175" r="4" />
              <path className="app-download-leader-line" d="M490 175V116H544" />
              <text x="492" y="102">S2 / LEADER</text>
              <text x="188" y="414">S3</text>
            </svg>
            <div className="app-download-team-widget">
              <span className="app-download-widget-watermark">MC</span>
              <strong className="app-download-widget-title">MCLAREN</strong>
              <span className="app-download-widget-subtitle">NOR · PIA</span>
              <div className="app-download-widget-position"><strong>P03</strong><span><b>179</b><small>POINTS</small></span></div>
              <div className="app-download-widget-stats"><span><b>0</b>WINS</span><span><b>4</b>PODIUMS</span><span><b>−153</b>LEADER</span></div>
            </div>
            <div className="app-download-race-widget">
              <span className="app-download-widget-tag">● NEXT RACE</span>
              <span className="app-download-widget-round">R10</span>
              <strong className="app-download-widget-title">BELGIAN<br />GRAND PRIX</strong>
              <span className="app-download-widget-subtitle">SPA · BELGIUM</span>
              <div className="app-download-widget-countdown"><span>LIGHTS OUT IN</span><strong>05 <small>DAYS</small> 20 <small>HRS</small></strong></div>
            </div>
          </div>
          <img
            className="app-download-preview"
            src="/pitwall-phone.png"
            alt="Pitwall Android app showing the race weekend dashboard"
            width="1024"
            height="1536"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
