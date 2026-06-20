# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Pitwall" — a Formula 1 stats/dashboard PWA (React 19 + TypeScript + Vite). No backend code lives in this repo; the app is a pure frontend client of a separate hosted API (`pitwall-backend-dq9r.onrender.com`).

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) then build for production
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

**FIA news proxy.** `/fia-news` is rewritten to `https://www.fia.com/rss/press-release` both in dev (`vite.config.ts` server proxy) and in production (`vercel.json` rewrites) to avoid CORS — keep these two in sync if the upstream URL changes. [src/components/NewsIntel.tsx](src/components/NewsIntel.tsx) fetches the rewritten path.

**Theming.** A season/team color theme (`default`, plus each constructor) is applied as a `theme-<id>` class on `document.body` and persisted to `localStorage` (`f1_theme`) via the `ThemeSwitcher` defined inline in [src/App.tsx](src/App.tsx). Theme colors are CSS custom properties (`--<team>`), not JS constants — see [src/index.css](src/index.css).

**PWA / service worker.** [public/sw.js](public/sw.js) precaches a fixed asset list under a versioned cache name (`pitwall-v3`); bump that name when changing the precache list so old caches get cleared on activate. Registered from [src/main.tsx](src/main.tsx).

**Deployment.** Deployed on Vercel; `vercel.json` rewrites all non-matched paths to `/` (client-side routing fallback) in addition to the FIA news proxy rewrite above.
