// Auto-generated F1 trivia derived from recent activity (last completed race +
// current standings). Used as the ticker's fallback when no trivia has been set
// in the admin portal, and to seed "suggested" lines in the admin Trivia editor.
import { RACES, fetchRaces, type Race } from '../data/races';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

interface RaceResult {
  id: string;
  position: string;
  points: string;
  given_name: string;
  family_name: string;
  team_name: string;
}

interface DriverRanking {
  given_name: string;
  family_name: string;
  points: string;
  position: string;
  wins: string;
  constructor_name: string;
}

interface ConstructorRanking {
  name: string;
  points: number;
  wins: number;
}

const fullName = (g: string, f: string) => `${g} ${f}`.toUpperCase();

// Build a handful of trivia sentences from the most recent race + standings.
const buildTrivia = (
  race: Race | undefined,
  results: RaceResult[],
  drivers: DriverRanking[],
  constructors: ConstructorRanking[]
): string[] => {
  const facts: string[] = [];
  const raceName = race?.raceName?.toUpperCase();
  const circuit = race?.Circuit?.circuitName?.toUpperCase();

  const sorted = [...results].sort(
    (a, b) => parseInt(a.position) - parseInt(b.position)
  );
  const winner = sorted[0];
  const p2 = sorted[1];
  const p3 = sorted[2];

  if (winner) {
    facts.push(
      `${fullName(winner.given_name, winner.family_name)} WON THE ${raceName || 'LAST ROUND'}${circuit ? ` AT ${circuit}` : ''} FOR ${winner.team_name.toUpperCase()}.`
    );
  }
  if (p2 && p3) {
    facts.push(
      `${fullName(p2.given_name, p2.family_name)} AND ${fullName(p3.given_name, p3.family_name)} COMPLETED THE PODIUM.`
    );
  }

  // Best-scoring team of the weekend (sum across both cars).
  const teamPoints = new Map<string, number>();
  results.forEach((r) => {
    teamPoints.set(
      r.team_name,
      (teamPoints.get(r.team_name) || 0) + parseFloat(r.points || '0')
    );
  });
  const topTeam = [...teamPoints.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTeam && topTeam[1] > 0) {
    facts.push(
      `${topTeam[0].toUpperCase()} BANKED ${topTeam[1]} POINTS — THE BIGGEST HAUL OF THE WEEKEND.`
    );
  }

  // Championship picture.
  const leader = drivers[0];
  if (leader) {
    const gap =
      drivers[1] != null
        ? parseFloat(leader.points) - parseFloat(drivers[1].points)
        : 0;
    facts.push(
      `${fullName(leader.given_name, leader.family_name)} LEADS THE TITLE RACE ON ${leader.points} POINTS` +
        (gap > 0
          ? `, ${gap} CLEAR OF ${fullName(drivers[1].given_name, drivers[1].family_name)}.`
          : '.')
    );
    if (parseInt(leader.wins) > 0) {
      facts.push(
        `${fullName(leader.given_name, leader.family_name)} HAS ${leader.wins} WIN${parseInt(leader.wins) === 1 ? '' : 'S'} THIS SEASON DRIVING FOR ${leader.constructor_name.toUpperCase()}.`
      );
    }
  }

  const conLeader = constructors[0];
  if (conLeader) {
    facts.push(
      `${conLeader.name.toUpperCase()} TOP THE CONSTRUCTORS' STANDINGS WITH ${conLeader.points} POINTS.`
    );
  }

  return facts;
};

/**
 * Fetch the latest race results + standings and return auto-generated trivia
 * sentences. Resolves to an empty array on failure (callers fall back).
 */
export const generateTriviaFacts = async (): Promise<string[]> => {
  try {
    const races = await fetchRaces();
    const today = new Date();
    const prevRace =
      races.filter((r) => new Date(r.date) < today).pop() ||
      races[0] ||
      RACES[0];

    const [resultsRes, driversRes, constructorsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/results/get-all-results/${prevRace.season}/${prevRace.round}`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${BACKEND_URL}/drivers/get-all-drivers-season-rankings`)
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${BACKEND_URL}/constructors/get-all-constructors-season-rankings`)
        .then((r) => r.json())
        .catch(() => []),
    ]);

    const drivers: DriverRanking[] = Array.isArray(driversRes)
      ? [...driversRes].sort((a, b) => parseInt(a.position) - parseInt(b.position))
      : [];
    const constructors: ConstructorRanking[] = Array.isArray(constructorsRes)
      ? [...constructorsRes].sort((a, b) => b.points - a.points)
      : [];

    return buildTrivia(
      prevRace,
      Array.isArray(resultsRes) ? resultsRes : [],
      drivers,
      constructors
    );
  } catch (e) {
    console.error('Failed to build trivia facts', e);
    return [];
  }
};
