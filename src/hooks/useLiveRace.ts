import { useEffect, useMemo, useState } from 'react';
import { RACES as RACES_FALLBACK, fetchRaces, raceWeekendWindow, type Race } from '../data/races';

export interface LiveRaceState {
  /** Full calendar (admin-managed backend, falling back to the bundled snapshot). */
  races: Race[];
  /** The race currently inside its weekend window, or null. */
  liveRace: Race | null;
}

/**
 * Loads the calendar and tells callers whether one of its races is inside its
 * "race weekend" window right now — from its earliest scheduled session
 * (first practice, or sprint quali on sprint weekends) through a few hours
 * after the Grand Prix itself finishes. Shared by {@link RaceLive} and the
 * dashboard layout so "race day mode" is decided in exactly one place.
 */
export const useLiveRace = (): LiveRaceState => {
  const [races, setRaces] = useState<Race[]>(RACES_FALLBACK);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    let active = true;
    fetchRaces().then((data) => {
      if (active) setRaces(data);
    });
    return () => {
      active = false;
    };
  }, []);

  // The weekend window can start/end mid-day, so re-check periodically
  // instead of only reacting to a calendar-date flip.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const liveRace = useMemo(
    () =>
      races.find((r) => {
        const { start, end } = raceWeekendWindow(r);
        return now >= start && now <= end;
      }) || null,
    [races, now],
  );

  return { races, liveRace };
};
