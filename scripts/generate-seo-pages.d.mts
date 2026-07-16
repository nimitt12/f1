// Hand-written declarations for generate-seo-pages.mjs so vite.config.ts can
// import its exports under strict TypeScript. Kept structural (no import from
// src/) so this stays out of the app's TS project graph.
interface RaceEntry {
  season: string;
  round: string;
  [key: string]: unknown;
}

export declare const loadRacesFromSnapshot: () => RaceEntry[];
export declare const buildSitemap: (races: RaceEntry[]) => string;
