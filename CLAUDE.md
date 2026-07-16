# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Pitwall" — a Formula 1 stats/dashboard PWA (React 19 + TypeScript + Vite). No backend code lives in this repo; the app is a pure frontend client of a separate hosted API (`pitwall-backend-dq9r.onrender.com`).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`), build for production, then generate per-race SEO pages + sitemap (`scripts/generate-seo-pages.mjs`)
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally

There is no test suite/runner configured in this project.

## Environment

Requires a `.env` with:
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth client ID, used by `GoogleOAuthProvider` in [src/main.tsx](src/main.tsx)
- `VITE_BACKEND_URL` — base URL of the hosted backend API

Several components hardcode the production backend URL (`https://pitwall-backend-dq9r.onrender.com`) as a fallback or directly instead of reading `VITE_BACKEND_URL` — be consistent with whichever pattern the surrounding file already uses when touching API calls.

## Architecture

**Single-page app with manual view routing.** [src/App.tsx](src/App.tsx) holds top-level state (`user`, `view`, `selectedRace`) and switches between three views (`dashboard`, `account`, `race_details`) without a router. View and selected race are persisted to `localStorage` (`f1_view`, `f1_selected_race`) so a refresh resumes where the user left off.

**Admin portal is a separate root.** Visiting `/admin-portal` short-circuits `App` to render [src/admin/AdminPortal.tsx](src/admin/AdminPortal.tsx) instead of the public site — a self-contained ops dashboard (API health, DB status, driver/constructor sync, diagnostics) that talks directly to the backend's `/health`, `/db-test`, `/results`, `/drivers`, `/constructors` endpoints.

**Auth model.** Google Sign-In (`@react-oauth/google`) produces a credential that's exchanged with the backend at `POST /auth/google`; the backend's returned user object is normalized (handles legacy `full_name`/`avatar_url` field names) and cached in `localStorage` under `f1_user`. There is no client-side session/token refresh — the user object itself is the persisted session. This pattern is duplicated in both [src/components/LoginModal.tsx](src/components/LoginModal.tsx) and [src/components/Hero.tsx](src/components/Hero.tsx); keep them consistent if changing the auth flow.

**Data fetching.** No data-fetching library or shared API client — every component calls `fetch` directly against backend REST endpoints (`/drivers/get-all-drivers-season-rankings`, `/constructors/get-all-constructors-season-rankings`, `/results/get-all-results/:season/:round`, `/results/get-all-qualifying-results/:season/:round`, `/profile/:id`, etc.) inside its own `useEffect`. Each component owns its own loading/error state; there is no shared cache or query layer.

**SEO pages.** `/live` and `/privacy` have their own HTML entry points ([live.html](live.html), [privacy.html](privacy.html)) built via Vite multi-page `rollupOptions.input` and served through `vercel.json` rewrites, each with route-specific title/canonical/JSON-LD. After `vite build`, [scripts/generate-seo-pages.mjs](scripts/generate-seo-pages.mjs) emits `dist/race/<season>/<slug>/index.html` for every race (race URLs use name slugs, e.g. `/race/2026/belgian-grand-prix` — built by `raceSlug`, defined in both `src/data/races.ts` and the script, which must stay in sync; legacy `/race/:season/:round` numeric URLs still resolve client-side) (SportsEvent + BreadcrumbList structured data, weekend schedule as crawlable fallback content) and the full `dist/sitemap.xml` — the calendar comes from `GET /races` with the bundled snapshot in [src/data/races.ts](src/data/races.ts) as fallback. The script derives race pages from `dist/index.html` via marker replacements that throw if the template drifts. There is no `public/sitemap.xml`; it's generated. In-app navigation to these routes must stay as real `<a href>` anchors (with `preventDefault` + `pushState` handlers) so crawlers can discover them.

**F1 news proxy.** `/f1-news` is rewritten to `https://www.formula1.com/en/latest/all.xml` both in dev (`vite.config.ts` server proxy) and in production (`vercel.json` rewrites) to avoid CORS — keep these two in sync if the upstream URL changes. [src/components/NewsIntel.tsx](src/components/NewsIntel.tsx) fetches the rewritten path, parses the RSS, and extracts per-item images (enclosure / `media:*` / inline `<img>`) with the channel `<image>` as a fallback.

**Theming.** A season/team color theme (`default`, plus each constructor) is applied as a `theme-<id>` class on `document.body` and persisted to `localStorage` (`f1_theme`) via the `ThemeSwitcher` defined inline in [src/App.tsx](src/App.tsx). Theme colors are CSS custom properties (`--<team>`), not JS constants — see [src/index.css](src/index.css).

**PWA / service worker.** [public/sw.js](public/sw.js) precaches a fixed asset list under a versioned cache name (`pitwall-v3`); bump that name when changing the precache list so old caches get cleared on activate. Registered from [src/main.tsx](src/main.tsx).

**Deployment.** Deployed on Vercel; `vercel.json` rewrites all non-matched paths to `/` (client-side routing fallback) in addition to the FIA news proxy rewrite above.

**Live timing.** `/live` renders [src/components/LiveTiming.tsx](src/components/LiveTiming.tsx) — a pit-wall console (timing tower with sectors/mini-sectors, tyres, car telemetry, live track map traced from positional data, race control feed, team radio) fed by [src/hooks/useLiveTiming.ts](src/hooks/useLiveTiming.ts), which subscribes to the backend's `/live/stream` SSE endpoint and deep-merges topic deltas client-side (mirroring the backend's merge semantics). It supports a broadcast-sync delay (updates buffered client-side) and a demo mode that triggers the backend's session simulator (`POST /live/simulate/start`). Entry points: the fixed `lt-entry-pill` on the dashboard and the race-day CTA in `RaceLive`. Styles use the `lt-` prefix in [src/index.css](src/index.css).

**Session archive replay.** The live timing view's "Archive" button opens a season browser (2018→current, from `GET /live/archive/:year`) and any picked session replays through the same SSE stream — the view gains a transport bar (play/pause, 1–30× speed, seek scrubber, exit) driven by `replay` SSE events and the `replayControl`/`fetchArchiveIndex` helpers in [src/hooks/useLiveTiming.ts](src/hooks/useLiveTiming.ts). The track map is keyed by replay path so its traced outline resets per session, and trail segments are dropped across seek teleports.
