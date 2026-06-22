import { useEffect, useState } from 'react';
import { RACES as RACES_FALLBACK, fetchRaces, type Race } from '../data/races';

// Local calendar date (YYYY-MM-DD) for the viewer.
export const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export interface LiveRaceState {
  /** Full calendar (admin-managed backend, falling back to the bundled snapshot). */
  races: Race[];
  /** The race whose date is today, or null when it isn't a race day. */
  liveRace: Race | null;
}

/**
 * Loads the calendar and tells callers whether one of its races falls on
 * today's local date. Shared by {@link RaceLive} and the dashboard layout so
 * "race day mode" is decided in exactly one place.
 */
export const useLiveRace = (): LiveRaceState => {
  const [races, setRaces] = useState<Race[]>(RACES_FALLBACK);

  useEffect(() => {
    let active = true;
    fetchRaces().then((data) => {
      if (active) setRaces(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const todayYMD = toLocalYMD(new Date());
  const liveRace = races.find((r) => r.date === todayYMD) || null;

  return { races, liveRace };
};
