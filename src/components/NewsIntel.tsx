import React from 'react';

const NewsIntel: React.FC = () => {
  return (
    <div className="col">
      <div className="col-head">
        <div className="col-num">§ 03</div>
        <div className="col-name">
          Paddock <em>Intel</em>
        </div>
        <div className="col-sub">Last Race · Top Stories</div>
      </div>

      <div className="podium-block">
        <div className="podium-head">Japanese GP · Suzuka · Result</div>
        <div className="podium-list">
          <div className="pod-row p1">
            <div className="pod-badge">P1</div>
            <div>
              <div className="pod-driver-name">Kimi Antonelli</div>
              <div className="pod-driver-team">Mercedes · #12</div>
            </div>
            <div className="pod-time">1:28:14.802</div>
          </div>
          <div className="pod-row p2">
            <div className="pod-badge">P2</div>
            <div>
              <div className="pod-driver-name">George Russell</div>
              <div className="pod-driver-team">Mercedes · #63</div>
            </div>
            <div className="pod-time">+3.441</div>
          </div>
          <div className="pod-row p3">
            <div className="pod-badge">P3</div>
            <div>
              <div className="pod-driver-name">Charles Leclerc</div>
              <div className="pod-driver-team">Ferrari · #16</div>
            </div>
            <div className="pod-time">+9.127</div>
          </div>
        </div>
      </div>

      <div className="news-block">
        <article className="news-item lead">
          <div className="news-meta">
            <span className="news-kicker">The Story</span>
            <span className="news-num">01</span>
          </div>
          <h3 className="news-headline">Antonelli's rookie surge rewrites Mercedes' championship math</h3>
          <p className="news-body">
            Three rounds in, the 19-year-old Italian has back-to-back wins and sits atop the
            drivers' table. Wolff has already shifted team orders mid-weekend. Russell now races his own teammate for
            the title.
          </p>
        </article>
        <article className="news-item neutral">
          <div className="news-meta">
            <span className="news-kicker">Engine Wars</span>
            <span className="news-num">02</span>
          </div>
          <h3 className="news-headline">Red Bull's new PU is down 15hp to Mercedes, paddock sources say</h3>
          <p className="news-body">
            Despite the full Ford works programme, Red Bull's 2026 power unit appears weakest on
            the grid. Verstappen's P5 in Japan came from chassis, not pace.
          </p>
        </article>
        <article className="news-item neutral">
          <div className="news-meta">
            <span className="news-kicker">Debut</span>
            <span className="news-num">03</span>
          </div>
          <h3 className="news-headline">Cadillac goal is simple: finish races, learn fast, build for 2029</h3>
          <p className="news-body">
            GM's eleventh team runs Ferrari PUs until its in-house unit is ready. Herta confirmed
            for four FP1 outings this year.
          </p>
        </article>
        <article className="news-item">
          <div className="news-meta">
            <span className="news-kicker">Calendar</span>
            <span className="news-num">04</span>
          </div>
          <h3 className="news-headline">FIA confirms Bahrain and Saudi cancellations, no replacements</h3>
          <p className="news-body">
            Iran war fallout leaves the season at 23 rounds, Australia to Abu Dhabi. Feeder series
            affected too.
          </p>
        </article>
      </div>
    </div>
  );
};

export default NewsIntel;
