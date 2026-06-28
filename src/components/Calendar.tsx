import React, { useEffect, useRef, useState } from 'react';
import { COUNTRY_FLAGS, fetchRaces, type Race } from '../data/races';
import { TRACK_PATHS, TRACK_VIEWBOX } from '../data/trackPaths';

// Re-exported so existing consumers (App, RaceDetails) can keep importing the
// canonical Race type from here; the definition now lives in src/data/races.ts.
export type { Race } from '../data/races';

interface CalendarProps {
  onRaceSelect?: (race: Race) => void;
}

const formatDateRange = (raceDateStr: string, fpDateStr?: string) => {
  if (!fpDateStr) {
    const d = new Date(raceDateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  }

  const raceDate = new Date(raceDateStr);
  const fpDate = new Date(fpDateStr);

  const startMonth = fpDate.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = raceDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = fpDate.toLocaleDateString('en-US', { day: '2-digit' });
  const endDay = raceDate.toLocaleDateString('en-US', { day: '2-digit' });

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  } else {
    return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
  }
};

const Flag: React.FC<{ code: string | undefined }> = ({ code }) => {
  if (!code || code.length !== 2) {
    return <span style={{ fontSize: '20px', lineHeight: '1' }}>🏁</span>;
  }
  const lowerCode = code.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${lowerCode}.png`}
      srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
      width="32"
      alt={code}
      style={{
        verticalAlign: 'middle',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        borderRadius: '2px',
        display: 'inline-block'
      }}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        // If image fails, show fallback
        const parent = e.currentTarget.parentElement;
        if (parent && !parent.querySelector('.flag-fallback')) {
          const span = document.createElement('span');
          span.className = 'flag-fallback';
          span.innerText = '🏁';
          span.style.fontSize = '20px';
          parent.appendChild(span);
        }
      }}
    />
  );
};

const Calendar: React.FC<CalendarProps> = ({ onRaceSelect }) => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchRaces()
      .then((data) => {
        if (active) setRaces(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const strip = stripRef.current;
      if (strip && !loading) {
        const next = strip.querySelector('.cal-round.next') as HTMLElement;
        if (next) {
          strip.scrollTo({ left: next.offsetLeft - 60, behavior: 'smooth' });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [loading]);

  const scrollLeft = () => {
    if (stripRef.current) {
      stripRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (stripRef.current) {
      stripRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section id="calendar" className="cal-section">
      <div className="cal-head">
        <div className="cal-title">
          Season <em>Calendar</em>
        </div>
        <div className="cal-head-right">
          <div className="cal-meta">22 Rounds · Mar → Dec 2026</div>
          <div className="cal-nav">
            <button onClick={scrollLeft} className="cal-nav-btn" aria-label="Scroll Left">&#8592;</button>
            <button onClick={scrollRight} className="cal-nav-btn" aria-label="Scroll Right">&#8594;</button>
          </div>
        </div>
      </div>

      <div className="cal-strip-wrap">
        <div className="cal-progress-track">
          <div
            className="cal-progress-fill"
            style={{
              width: races.length
                ? `${(races.filter((r) => new Date(r.date) < new Date()).length / races.length) * 100}%`
                : '0%',
            }}
          ></div>
        </div>
        <div className="cal-strip" id="calStrip" ref={stripRef}>
          {(() => {
            const today = new Date();
            const nextRace = races.find(r => new Date(r.date) >= today);
            const nextRound = nextRace?.round;

            return races.map((race) => {
              const raceDate = new Date(race.date);
              const isDone = raceDate < today;
              const isNext = race.round === nextRound;
              const displayRound = Number(race.round).toString().padStart(2, '0');
              const countryName = race.Circuit.Location.country.trim();
              const countryCode = COUNTRY_FLAGS[countryName];
              const countryEmoji = <Flag code={countryCode} />;
              const trackPath = TRACK_PATHS[race.Circuit.circuitId || ''];

              return (
                <div key={race.round} data-round={displayRound} className={`cal-round ${isDone && !isNext ? 'done' : ''} ${isNext ? 'next' : ''}`}>
                  {trackPath && (
                    <svg
                      className="cal-track"
                      viewBox={TRACK_VIEWBOX}
                      fill="none"
                      preserveAspectRatio="xMidYMid meet"
                      aria-hidden="true"
                    >
                      <path d={trackPath} vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  <div className="cal-rnum">
                    <span className="cal-rnum-id">
                      R#{displayRound}
                      {isNext && <span className="cal-next-pill">Up Next</span>}
                    </span>
                    <span className="cal-status-dot"></span>
                  </div>
                  <div className="cal-flag-emoji">{countryEmoji}</div>
                  <div className="cal-country">{`${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`}</div>
                  <div className="cal-flag-name">{race.Circuit.circuitName}</div>
                  <div className="cal-date">{formatDateRange(race.date, race.FirstPractice?.date)}</div>
                  {onRaceSelect && (
                    <button 
                      className="cal-details-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onRaceSelect(race);
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </section>
  );
};

export default Calendar;
