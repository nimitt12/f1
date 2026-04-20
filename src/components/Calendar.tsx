import React, { useEffect, useRef } from 'react';

const Calendar: React.FC = () => {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const strip = stripRef.current;
      if (strip) {
        const next = strip.querySelector('.cal-round.next') as HTMLElement;
        if (next) {
          strip.scrollTo({ left: next.offsetLeft - 60, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="cal-section">
      <div className="cal-head">
        <div className="cal-title">
          Season <em>Calendar</em>
        </div>
        <div className="cal-meta">23 Rounds · Mar → Dec 2026</div>
      </div>

      <div className="cal-strip-wrap">
        <div className="cal-progress-track">
          <div className="cal-progress-fill" style={{ width: '13.6%' }}></div>
        </div>
        <div className="cal-strip" id="calStrip" ref={stripRef}>
          <div className="cal-round done">
            <div className="cal-rnum">
              R01<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇦🇺</div>
            <div className="cal-country">Australia</div>
            <div className="cal-flag-name">Albert Park</div>
            <div className="cal-date">Mar 06–08</div>
            <div className="cal-winner">G. Russell</div>
          </div>
          <div className="cal-round done">
            <div className="cal-rnum">
              R02<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇨🇳</div>
            <div className="cal-country">China</div>
            <div className="cal-flag-name">Shanghai</div>
            <div className="cal-date">Mar 13–15</div>
            <div className="cal-winner">K. Antonelli</div>
          </div>
          <div className="cal-round done">
            <div className="cal-rnum">
              R03<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇯🇵</div>
            <div className="cal-country">Japan</div>
            <div className="cal-flag-name">Suzuka</div>
            <div className="cal-date">Mar 27–29</div>
            <div className="cal-winner">K. Antonelli</div>
          </div>
          <div className="cal-round next">
            <div className="cal-rnum">
              R04 · NEXT<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇺🇸</div>
            <div className="cal-country">USA</div>
            <div className="cal-flag-name">Miami</div>
            <div className="cal-date">May 01–03</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R05<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇨🇦</div>
            <div className="cal-country">Canada</div>
            <div className="cal-flag-name">Montreal</div>
            <div className="cal-date">May 22–24</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R06<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇲🇨</div>
            <div className="cal-country">Monaco</div>
            <div className="cal-flag-name">Monte Carlo</div>
            <div className="cal-date">Jun 05–07</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R07<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇪🇸</div>
            <div className="cal-country">Spain</div>
            <div className="cal-flag-name">Barcelona</div>
            <div className="cal-date">Jun 12–14</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R08<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇦🇹</div>
            <div className="cal-country">Austria</div>
            <div className="cal-flag-name">Red Bull Ring</div>
            <div className="cal-date">Jun 26–28</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R09<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇬🇧</div>
            <div className="cal-country">UK</div>
            <div className="cal-flag-name">Silverstone</div>
            <div className="cal-date">Jul 03–05</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R10<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇧🇪</div>
            <div className="cal-country">Belgium</div>
            <div className="cal-flag-name">Spa</div>
            <div className="cal-date">Jul 24–26</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R11<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇭🇺</div>
            <div className="cal-country">Hungary</div>
            <div className="cal-flag-name">Hungaroring</div>
            <div className="cal-date">Jul 31–Aug 2</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R12<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇳🇱</div>
            <div className="cal-country">Netherlands</div>
            <div className="cal-flag-name">Zandvoort</div>
            <div className="cal-date">Aug 21–23</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R13<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇮🇹</div>
            <div className="cal-country">Italy</div>
            <div className="cal-flag-name">Monza</div>
            <div className="cal-date">Sep 04–06</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R14<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇪🇸</div>
            <div className="cal-country">Spain</div>
            <div className="cal-flag-name">Madrid</div>
            <div className="cal-date">Sep 11–13</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R15<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇦🇿</div>
            <div className="cal-country">Azerbaijan</div>
            <div className="cal-flag-name">Baku</div>
            <div className="cal-date">Sep 26 · Sat</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R16<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇸🇬</div>
            <div className="cal-country">Singapore</div>
            <div className="cal-flag-name">Marina Bay</div>
            <div className="cal-date">Oct 09–11</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R17<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇺🇸</div>
            <div className="cal-country">USA</div>
            <div className="cal-flag-name">Austin</div>
            <div className="cal-date">Oct 23–25</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R18<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇲🇽</div>
            <div className="cal-country">Mexico</div>
            <div className="cal-flag-name">Mexico City</div>
            <div className="cal-date">Oct 30–Nov 1</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R19<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇧🇷</div>
            <div className="cal-country">Brazil</div>
            <div className="cal-flag-name">São Paulo</div>
            <div className="cal-date">Nov 06–08</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R20<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇺🇸</div>
            <div className="cal-country">USA</div>
            <div className="cal-flag-name">Las Vegas</div>
            <div className="cal-date">Nov 19–21</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R21<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇶🇦</div>
            <div className="cal-country">Qatar</div>
            <div className="cal-flag-name">Lusail</div>
            <div className="cal-date">Nov 27–29</div>
          </div>
          <div className="cal-round">
            <div className="cal-rnum">
              R22<span className="cal-status-dot"></span>
            </div>
            <div className="cal-flag-emoji">🇦🇪</div>
            <div className="cal-country">UAE</div>
            <div className="cal-flag-name">Yas Marina</div>
            <div className="cal-date">Dec 04–06</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Calendar;
