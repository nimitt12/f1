// Single source of truth for the F1 race calendar.
//
// This data used to be copy-pasted into Calendar.tsx, NextRace.tsx and
// Ticker.tsx. It now lives here and is editable from the admin portal:
// `fetchRaces()` pulls the live calendar from the backend (`GET /races`,
// backed by the `races` table the admin portal edits), and falls back to the
// bundled `RACES` snapshot below when the network/endpoint is unavailable so
// the UI always has something to render.

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

// Ergast/Jolpica-shaped race record. Superset of every field the public
// components read; nested objects are optional because not every round has a
// sprint / three practice sessions.
export interface Race {
  season: string;
  round: string;
  raceName: string;
  url?: string;
  Circuit: {
    circuitId?: string;
    url?: string;
    circuitName: string;
    Location: {
      lat?: string;
      long?: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
  FirstPractice?: { date: string; time?: string };
  SecondPractice?: { date: string; time?: string };
  ThirdPractice?: { date: string; time?: string };
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string };
  SprintQualifying?: { date: string; time?: string };
}

// ISO country name -> ISO 3166-1 alpha-2 code, used for flag rendering.
export const COUNTRY_FLAGS: Record<string, string> = {
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

// Bundled snapshot of the 2026 calendar. Used as the initial render value and
// as a fallback when the backend is unreachable.
export const RACES: Race[] = [
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
  {"season":"2026","round":"21","url":"https://en.wikipedia.org/wiki/2026_Qatar_Grand_Prix","raceName":"Qatar Grand Prix","Circuit":{"circuitId":"losail","url":"https://en.wikipedia.org/wiki/Lusail_International_Circuit","circuitName":"Lusail International Circuit","Location":{"lat":"25.49","long":"51.4542","locality":"Lusail","country":"Qatar"}},"date":"2026-11-29","time":"16:00:00Z","FirstPractice":{"date":"2026-11-27","time":"13:30:00Z"},"SecondPractice":{"date":"2026-11-27","time":"17:00:00Z"},"ThirdPractice":{"date":"2026-11-28","time":"14:30:00Z"},"Qualifying":{"date":"2026-11-28","time":"18:00:00Z"}},
  {"season":"2026","round":"22","url":"https://en.wikipedia.org/wiki/2026_Abu_Dhabi_Grand_Prix","raceName":"Abu Dhabi Grand Prix","Circuit":{"circuitId":"yas_marina","url":"https://en.wikipedia.org/wiki/Yas_Marina_Circuit","circuitName":"Yas Marina Circuit","Location":{"lat":"24.4672","long":"54.6031","locality":"Abu Dhabi","country":"UAE"}},"date":"2026-12-06","time":"13:00:00Z","FirstPractice":{"date":"2026-12-04","time":"09:30:00Z"},"SecondPractice":{"date":"2026-12-04","time":"13:00:00Z"},"ThirdPractice":{"date":"2026-12-05","time":"10:30:00Z"},"Qualifying":{"date":"2026-12-05","time":"14:00:00Z"}}
];

const loadRaces = async (): Promise<Race[]> => {
  try {
    const res = await fetch(`${BACKEND_URL}/races`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return [...data].sort((a, b) => Number(a.round) - Number(b.round));
    }
    return RACES;
  } catch (e) {
    console.error('Failed to fetch races, using bundled calendar', e);
    return RACES;
  }
};

// Several components (NextRace, Calendar, Ticker, the race-day hook) each request
// the calendar on first paint. Share a single in-flight request between them so
// the (cold-starting) backend isn't hit four times in parallel on load.
let racesPromise: Promise<Race[]> | null = null;

/**
 * Fetch the live race calendar from the backend, sorted by round. Falls back to
 * the bundled {@link RACES} snapshot if the request fails or returns nothing, so
 * callers can rely on always getting a non-empty list. The result is memoized
 * for the session so concurrent callers share one network request.
 */
export const fetchRaces = (): Promise<Race[]> => {
  if (!racesPromise) racesPromise = loadRaces();
  return racesPromise;
};
