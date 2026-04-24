import React, { useEffect, useRef, useState } from 'react';

// Define types for Ergast Race data
interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
  date: string;
  FirstPractice?: {
    date: string;
  };
}

const COUNTRY_FLAGS: Record<string, string> = {
  Australia: 'au',
  China: 'cn',
  Japan: 'jp',
  USA: 'us',
  Canada: 'ca',
  Monaco: 'mc',
  Spain: 'es',
  Austria: 'at',
  UK: 'gb',
  Belgium: 'be',
  Hungary: 'hu',
  Netherlands: 'nl',
  Italy: 'it',
  Azerbaijan: 'az',
  Singapore: 'sg',
  Mexico: 'mx',
  Brazil: 'br',
  Qatar: 'qa',
  UAE: 'ae',
};

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

const Calendar: React.FC = () => {
  const stripRef = useRef<HTMLDivElement>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const dummyData = {
          "MRData": {
            "RaceTable": {
              "Races": [
                {"season":"2026","round":"1","url":"https://en.wikipedia.org/wiki/2026_Australian_Grand_Prix","raceName":"Australian Grand Prix","Circuit":{"circuitId":"albert_park","url":"https://en.wikipedia.org/wiki/Albert_Park_Circuit","circuitName":"Albert Park Grand Prix Circuit","Location":{"lat":"-37.8497","long":"144.968","locality":"Melbourne","country":"Australia"}},"date":"2026-03-08","time":"04:00:00Z","FirstPractice":{"date":"2026-03-06","time":"01:30:00Z"},"SecondPractice":{"date":"2026-03-06","time":"05:00:00Z"},"ThirdPractice":{"date":"2026-03-07","time":"01:30:00Z"},"Qualifying":{"date":"2026-03-07","time":"05:00:00Z"}},
                {"season":"2026","round":"2","url":"https://en.wikipedia.org/wiki/2026_Chinese_Grand_Prix","raceName":"Chinese Grand Prix","Circuit":{"circuitId":"shanghai","url":"https://en.wikipedia.org/wiki/Shanghai_International_Circuit","circuitName":"Shanghai International Circuit","Location":{"lat":"31.3389","long":"121.22","locality":"Shanghai","country":"China"}},"date":"2026-03-15","time":"07:00:00Z","FirstPractice":{"date":"2026-03-13","time":"03:30:00Z"},"Qualifying":{"date":"2026-03-14","time":"07:00:00Z"},"Sprint":{"date":"2026-03-14","time":"03:00:00Z"},"SprintQualifying":{"date":"2026-03-13","time":"07:30:00Z"}},
                {"season":"2026","round":"3","url":"https://en.wikipedia.org/wiki/2026_Japanese_Grand_Prix","raceName":"Japanese Grand Prix","Circuit":{"circuitId":"suzuka","url":"https://en.wikipedia.org/wiki/Suzuka_International_Racing_Course","circuitName":"Suzuka Circuit","Location":{"lat":"34.8431","long":"136.541","locality":"Suzuka","country":"Japan"}},"date":"2026-03-29","time":"05:00:00Z","FirstPractice":{"date":"2026-03-27","time":"02:30:00Z"},"SecondPractice":{"date":"2026-03-27","time":"06:00:00Z"},"ThirdPractice":{"date":"2026-03-28","time":"02:30:00Z"},"Qualifying":{"date":"2026-03-28","time":"06:00:00Z"}},
                {"season":"2026","round":"4","url":"https://en.wikipedia.org/wiki/2026_Miami_Grand_Prix","raceName":"Miami Grand Prix","Circuit":{"circuitId":"miami","url":"https://en.wikipedia.org/wiki/Miami_International_Autodrome","circuitName":"Miami International Autodrome","Location":{"lat":"25.9581","long":"-80.2389","locality":"Miami","country":"USA"}},"date":"2026-05-03","time":"20:00:00Z","FirstPractice":{"date":"2026-05-01","time":"16:30:00Z"},"Qualifying":{"date":"2026-05-02","time":"20:00:00Z"},"Sprint":{"date":"2026-05-02","time":"16:00:00Z"},"SprintQualifying":{"date":"2026-05-01","time":"20:30:00Z"}},
                {"season":"2026","round":"5","url":"https://en.wikipedia.org/wiki/2026_Canadian_Grand_Prix","raceName":"Canadian Grand Prix","Circuit":{"circuitId":"villeneuve","url":"https://en.wikipedia.org/wiki/Circuit_Gilles_Villeneuve","circuitName":"Circuit Gilles Villeneuve","Location":{"lat":"45.5","long":"-73.5228","locality":"Montreal","country":"Canada"}},"date":"2026-05-24","time":"20:00:00Z","FirstPractice":{"date":"2026-05-22","time":"16:30:00Z"},"Qualifying":{"date":"2026-05-23","time":"20:00:00Z"},"Sprint":{"date":"2026-05-23","time":"16:00:00Z"},"SprintQualifying":{"date":"2026-05-22","time":"20:30:00Z"}},
                {"season":"2026","round":"6","url":"https://en.wikipedia.org/wiki/2026_Monaco_Grand_Prix","raceName":"Monaco Grand Prix","Circuit":{"circuitId":"monaco","url":"https://en.wikipedia.org/wiki/Circuit_de_Monaco","circuitName":"Circuit de Monaco","Location":{"lat":"43.7347","long":"7.42056","locality":"Monte Carlo","country":"Monaco"}},"date":"2026-06-07","time":"13:00:00Z","FirstPractice":{"date":"2026-06-05","time":"11:30:00Z"},"SecondPractice":{"date":"2026-06-05","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-06-06","time":"10:30:00Z"},"Qualifying":{"date":"2026-06-06","time":"14:00:00Z"}},
                {"season":"2026","round":"7","url":"https://en.wikipedia.org/wiki/2026_Barcelona-Catalunya","raceName":"Barcelona Grand Prix","Circuit":{"circuitId":"catalunya","url":"https://en.wikipedia.org/wiki/Circuit_de_Barcelona-Catalunya","circuitName":"Circuit de Barcelona-Catalunya","Location":{"lat":"41.57","long":"2.26111","locality":"Barcelona","country":"Spain"}},"date":"2026-06-14","time":"13:00:00Z","FirstPractice":{"date":"2026-06-12","time":"11:30:00Z"},"SecondPractice":{"date":"2026-06-12","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-06-13","time":"10:30:00Z"},"Qualifying":{"date":"2026-06-13","time":"14:00:00Z"}},
                {"season":"2026","round":"8","url":"https://en.wikipedia.org/wiki/2026_Austrian_Grand_Prix","raceName":"Austrian Grand Prix","Circuit":{"circuitId":"red_bull_ring","url":"https://en.wikipedia.org/wiki/Red_Bull_Ring","circuitName":"Red Bull Ring","Location":{"lat":"47.2197","long":"14.7647","locality":"Spielberg","country":"Austria"}},"date":"2026-06-28","time":"13:00:00Z","FirstPractice":{"date":"2026-06-26","time":"11:30:00Z"},"SecondPractice":{"date":"2026-06-26","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-06-27","time":"10:30:00Z"},"Qualifying":{"date":"2026-06-27","time":"14:00:00Z"}},
                {"season":"2026","round":"9","url":"https://en.wikipedia.org/wiki/2026_British_Grand_Prix","raceName":"British Grand Prix","Circuit":{"circuitId":"silverstone","url":"https://en.wikipedia.org/wiki/Silverstone_Circuit","circuitName":"Silverstone Circuit","Location":{"lat":"52.0786","long":"-1.01694","locality":"Silverstone","country":"UK"}},"date":"2026-07-05","time":"14:00:00Z","FirstPractice":{"date":"2026-07-03","time":"11:30:00Z"},"Qualifying":{"date":"2026-07-04","time":"15:00:00Z"},"Sprint":{"date":"2026-07-04","time":"11:00:00Z"},"SprintQualifying":{"date":"2026-07-03","time":"15:30:00Z"}},
                {"season":"2026","round":"10","url":"https://en.wikipedia.org/wiki/2026_Belgian_Grand_Prix","raceName":"Belgian Grand Prix","Circuit":{"circuitId":"spa","url":"https://en.wikipedia.org/wiki/Circuit_de_Spa-Francorchamps","circuitName":"Circuit de Spa-Francorchamps","Location":{"lat":"50.4372","long":"5.97139","locality":"Spa","country":"Belgium"}},"date":"2026-07-19","time":"13:00:00Z","FirstPractice":{"date":"2026-07-17","time":"11:30:00Z"},"SecondPractice":{"date":"2026-07-17","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-07-18","time":"10:30:00Z"},"Qualifying":{"date":"2026-07-18","time":"14:00:00Z"}},
                {"season":"2026","round":"11","url":"https://en.wikipedia.org/wiki/2026_Hungarian_Grand_Prix","raceName":"Hungarian Grand Prix","Circuit":{"circuitId":"hungaroring","url":"https://en.wikipedia.org/wiki/Hungaroring","circuitName":"Hungaroring","Location":{"lat":"47.5789","long":"19.2486","locality":"Budapest","country":"Hungary"}},"date":"2026-07-26","time":"13:00:00Z","FirstPractice":{"date":"2026-07-24","time":"11:30:00Z"},"SecondPractice":{"date":"2026-07-24","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-07-25","time":"10:30:00Z"},"Qualifying":{"date":"2026-07-25","time":"14:00:00Z"}},
                {"season":"2026","round":"12","url":"https://en.wikipedia.org/wiki/2026_Dutch_Grand_Prix","raceName":"Dutch Grand Prix","Circuit":{"circuitId":"zandvoort","url":"https://en.wikipedia.org/wiki/Circuit_Zandvoort","circuitName":"Circuit Park Zandvoort","Location":{"lat":"52.3888","long":"4.54092","locality":"Zandvoort","country":"Netherlands"}},"date":"2026-08-23","time":"13:00:00Z","FirstPractice":{"date":"2026-08-21","time":"10:30:00Z"},"Qualifying":{"date":"2026-08-22","time":"14:00:00Z"},"Sprint":{"date":"2026-08-22","time":"10:00:00Z"},"SprintQualifying":{"date":"2026-08-21","time":"14:30:00Z"}},
                {"season":"2026","round":"13","url":"https://en.wikipedia.org/wiki/2026_Italian_Grand_Prix","raceName":"Italian Grand Prix","Circuit":{"circuitId":"monza","url":"https://en.wikipedia.org/wiki/Monza_Circuit","circuitName":"Autodromo Nazionale di Monza","Location":{"lat":"45.6156","long":"9.28111","locality":"Monza","country":"Italy"}},"date":"2026-09-06","time":"13:00:00Z","FirstPractice":{"date":"2026-09-04","time":"10:30:00Z"},"SecondPractice":{"date":"2026-09-04","time":"14:00:00Z"},"ThirdPractice":{"date":"2026-09-05","time":"10:30:00Z"},"Qualifying":{"date":"2026-09-05","time":"14:00:00Z"}},
                {"season":"2026","round":"14","url":"https://en.wikipedia.org/wiki/2026_Spanish_Grand_Prix","raceName":"Spanish Grand Prix","Circuit":{"circuitId":"madring","url":"https://en.wikipedia.org/wiki/Madring","circuitName":"Madring","Location":{"lat":"40.46528","long":"-3.61528","locality":"Madrid","country":"Spain"}},"date":"2026-09-13","time":"13:00:00Z","FirstPractice":{"date":"2026-09-11","time":"11:30:00Z"},"SecondPractice":{"date":"2026-09-11","time":"15:00:00Z"},"ThirdPractice":{"date":"2026-09-12","time":"10:30:00Z"},"Qualifying":{"date":"2026-09-12","time":"14:00:00Z"}},
                {"season":"2026","round":"15","url":"https://en.wikipedia.org/wiki/2026_Azerbaijan_Grand_Prix","raceName":"Azerbaijan Grand Prix","Circuit":{"circuitId":"baku","url":"https://en.wikipedia.org/wiki/Baku_City_Circuit","circuitName":"Baku City Circuit","Location":{"lat":"40.3725","long":"49.8533","locality":"Baku","country":"Azerbaijan"}},"date":"2026-09-26","time":"11:00:00Z","FirstPractice":{"date":"2026-09-24","time":"08:30:00Z"},"SecondPractice":{"date":"2026-09-24","time":"12:00:00Z"},"ThirdPractice":{"date":"2026-09-25","time":"08:30:00Z"},"Qualifying":{"date":"2026-09-25","time":"12:00:00Z"}},
                {"season":"2026","round":"16","url":"https://en.wikipedia.org/wiki/2026_Singapore_Grand_Prix","raceName":"Singapore Grand Prix","Circuit":{"circuitId":"marina_bay","url":"https://en.wikipedia.org/wiki/Marina_Bay_Street_Circuit","circuitName":"Marina Bay Street Circuit","Location":{"lat":"1.2914","long":"103.864","locality":"Marina Bay","country":"Singapore"}},"date":"2026-10-11","time":"12:00:00Z","FirstPractice":{"date":"2026-10-09","time":"08:30:00Z"},"Qualifying":{"date":"2026-10-10","time":"13:00:00Z"},"Sprint":{"date":"2026-10-10","time":"09:00:00Z"},"SprintQualifying":{"date":"2026-10-09","time":"12:30:00Z"}},
                {"season":"2026","round":"17","url":"https://en.wikipedia.org/wiki/2026_United_States_Grand_Prix","raceName":"United States Grand Prix","Circuit":{"circuitId":"americas","url":"https://en.wikipedia.org/wiki/Circuit_of_the_Americas","circuitName":"Circuit of the Americas","Location":{"lat":"30.1328","long":"-97.6411","locality":"Austin","country":"USA"}},"date":"2026-10-25","time":"20:00:00Z","FirstPractice":{"date":"2026-10-23","time":"17:30:00Z"},"SecondPractice":{"date":"2026-10-23","time":"21:00:00Z"},"ThirdPractice":{"date":"2026-10-24","time":"17:30:00Z"},"Qualifying":{"date":"2026-10-24","time":"21:00:00Z"}},
                {"season":"2026","round":"18","url":"https://en.wikipedia.org/wiki/2026_Mexico_City_Grand_Prix","raceName":"Mexico City Grand Prix","Circuit":{"circuitId":"rodriguez","url":"https://en.wikipedia.org/wiki/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez","circuitName":"Autódromo Hermanos Rodríguez","Location":{"lat":"19.4042","long":"-99.0907","locality":"Mexico City","country":"Mexico"}},"date":"2026-11-01","time":"20:00:00Z","FirstPractice":{"date":"2026-10-30","time":"18:30:00Z"},"SecondPractice":{"date":"2026-10-30","time":"22:00:00Z"},"ThirdPractice":{"date":"2026-10-31","time":"17:30:00Z"},"Qualifying":{"date":"2026-10-31","time":"21:00:00Z"}},
                {"season":"2026","round":"19","url":"https://en.wikipedia.org/wiki/2026_Brazilian_Grand_Prix","raceName":"Brazilian Grand Prix","Circuit":{"circuitId":"interlagos","url":"https://en.wikipedia.org/wiki/Interlagos_Circuit","circuitName":"Autódromo José Carlos Pace","Location":{"lat":"-23.7036","long":"-46.6997","locality":"São Paulo","country":"Brazil"}},"date":"2026-11-08","time":"17:00:00Z","FirstPractice":{"date":"2026-11-06","time":"15:30:00Z"},"SecondPractice":{"date":"2026-11-06","time":"19:00:00Z"},"ThirdPractice":{"date":"2026-11-07","time":"14:30:00Z"},"Qualifying":{"date":"2026-11-07","time":"18:00:00Z"}},
                {"season":"2026","round":"20","url":"https://en.wikipedia.org/wiki/2026_Las_Vegas_Grand_Prix","raceName":"Las Vegas Grand Prix","Circuit":{"circuitId":"vegas","url":"https://en.wikipedia.org/wiki/Las_Vegas_Grand_Prix#Circuit","circuitName":"Las Vegas Strip Street Circuit","Location":{"lat":"36.1147","long":"-115.173","locality":"Las Vegas","country":"USA"}},"date":"2026-11-22","time":"04:00:00Z","FirstPractice":{"date":"2026-11-20","time":"00:30:00Z"},"SecondPractice":{"date":"2026-11-20","time":"04:00:00Z"},"ThirdPractice":{"date":"2026-11-21","time":"00:30:00Z"},"Qualifying":{"date":"2026-11-21","time":"04:00:00Z"}},
                {"season":"2026","round":"21","url":"https://en.wikipedia.org/wiki/2026_Qatar_Grand_Prix","raceName":"Qatar Grand Prix","Circuit":{"circuitId":"losail","url":"https://en.wikipedia.org/wiki/Lusail_International_Circuit","circuitName":"Losail International Circuit","Location":{"lat":"25.49","long":"51.4542","locality":"Lusail","country":"Qatar"}},"date":"2026-11-29","time":"16:00:00Z","FirstPractice":{"date":"2026-11-27","time":"13:30:00Z"},"SecondPractice":{"date":"2026-11-27","time":"17:00:00Z"},"ThirdPractice":{"date":"2026-11-28","time":"14:30:00Z"},"Qualifying":{"date":"2026-11-28","time":"18:00:00Z"}},
                {"season":"2026","round":"22","url":"https://en.wikipedia.org/wiki/2026_Abu_Dhabi_Grand_Prix","raceName":"Abu Dhabi Grand Prix","Circuit":{"circuitId":"yas_marina","url":"https://en.wikipedia.org/wiki/Yas_Marina_Circuit","circuitName":"Yas Marina Circuit","Location":{"lat":"24.4672","long":"54.6031","locality":"Abu Dhabi","country":"UAE"}},"date":"2026-12-06","time":"13:00:00Z","FirstPractice":{"date":"2026-12-04","time":"09:30:00Z"},"SecondPractice":{"date":"2026-12-04","time":"13:00:00Z"},"ThirdPractice":{"date":"2026-12-05","time":"10:30:00Z"},"Qualifying":{"date":"2026-12-05","time":"14:00:00Z"}}
              ]
            }
          }
        };
        
        setRaces(dummyData.MRData.RaceTable.Races);
      } catch (err) {
        console.error('Failed to parse races', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStandings();
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
          <div className="cal-progress-fill" style={{ width: '13.6%' }}></div>
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

              return (
                <div key={race.round} className={`cal-round ${isDone && !isNext ? 'done' : ''} ${isNext ? 'next' : ''}`}>
                  <div className="cal-rnum">
                    {isNext ? `R#${displayRound} · NEXT` : `R#${displayRound}`}<span className="cal-status-dot"></span>
                  </div>
                  <div className="cal-flag-emoji">{countryEmoji}</div>
                  <div className="cal-country">{`${race.Circuit.Location.locality}, ${race.Circuit.Location.country}`}</div>
                  <div className="cal-flag-name">{race.Circuit.circuitName}</div>
                  <div className="cal-date">{formatDateRange(race.date, race.FirstPractice?.date)}</div>
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
