# Pitwall security and scalability review

Reviewed 2026-10-05. Scope: this frontend repository, its npm dependency graph, build-time SEO generation, and Vercel configuration. The hosted backend, database, cloud account settings, and production traffic were not audited. This is a source review with targeted regression tests, not a penetration test or a capacity certification.

## Findings addressed

| Finding | Change |
| --- | --- |
| npm reported 8 vulnerable packages: 6 high, 1 moderate, 1 low | Updated compatible dependencies in the lockfile, without running install scripts. Final online audit: 0 known vulnerabilities across the full graph, including development dependencies. These findings were in development/build tooling; they do not establish that the deployed static app was exploitable. |
| RSS HTML parsed in a live-document element; unvalidated outbound links | Parse descriptions inside an inert template, restrict article links to HTTPS Formula 1 news URLs, restrict image schemes to HTTPS, and open stories with `noopener,noreferrer`. React renders extracted text. |
| SEO JSON-LD could be terminated with an API-provided `</script>`; seasons controlled output paths | Escape `<` in JSON-LD, validate calendar entries and path components, and use literal replacement callbacks so `$&` cannot alter generated markup. |
| No configured browser security response headers | Added CSP without executable inline scripts or `eval`, anti-framing, MIME-sniffing protection, referrer/permission policies and HSTS. Analytics initialization moved into a same-origin file. Google sign-in popup compatibility retained. |
| Broad same-origin upstream article proxy | Restricted production and development proxies to `/en/latest/` and sandboxed production proxy documents with a restrictive CSP. |
| Profile and account-deletion calls omitted the existing session token | Shared authenticated fetch now attaches the bearer token, rejects missing credentials and foreign API origins, disables redirects/caching, and applies a 20-second deadline. This does not implement server authorization. |
| Persistent login JWT; duplicated login handling | Shared login exchange validates required response fields. Token and cached user are now tab-scoped. Legacy persistent credentials/user caches are removed, and 401 responses clear the active session. Admin gate reacts to sign-out. |
| Service worker cached arbitrary same-origin successful responses | GET-only, exact-origin, explicit static-asset caching; excludes authenticated requests, query strings, APIs, proxies and private routes. Cache has a 100-entry cap. Public navigation uses network first with an offline shell fallback. Worker version bumped to remove old Pitwall caches. |
| Live feed accepted arbitrary JSON keys, recursive merges and unbounded queues | Added parser/merge guards, depth/node/string budgets, array-index limits, a 10,000-update / 16 MB serialized-buffer budget, a retained-state budget and a topic cap. Invalid/overflowed streams reconnect after five seconds for a fresh snapshot. Queue drains in batches. Limits are defensive application budgets, not exact JS heap limits. |
| Every dashboard visit loaded administration and full live/race views | Added lazy-loaded admin, live timing and race-detail bundles. News image lookup runs at most three requests concurrently, with cancellation and a shared deadline. |
| Weak future regression coverage | Added a Node security regression suite, weekly audit/build workflow, Dependabot configuration, `.nvmrc` (Node 24), broader environment/key-file ignores and a public configuration example. |

## Required backend follow-up

These are requirements to verify, not confirmed server vulnerabilities:

1. **Account authorization — high priority.** Authenticate every `/profile/:id` read/write and `/account/delete-request`. Derive the user from the verified token and enforce ownership; never trust the submitted `userId`, email, or cached browser profile. Reject absent/expired/forged tokens. Allow the frontend's `Authorization` header in the backend CORS policy. Test that user A cannot read, change, or request deletion of user B.
2. **Admin authorization — high priority.** Enforce server-side roles on every CRUD, sync and diagnostic operation. `/admin/verify` and the React gate are only UI affordances. Audit public `/db-test` and any sync routes for information disclosure or mutations. The backend implementation is absent here.
3. **Simulation/replay isolation — high priority.** The client calls `/live/simulate/*` and `/live/replay/*` without credentials. Determine whether these mutate a global stream; isolate replay state per user/session or require appropriate privileges. Validate archive paths against the archive index, clamp speed/seek values, and restrict upstream fetch destinations. Client-side controls cannot provide isolation.
4. **Session lifecycle.** Verify Google ID-token signatures, issuer, audience and expiry; sign and validate application JWTs; enforce expiry and revocation. Prefer short-lived sessions in `Secure`, `HttpOnly` cookies through a same-site API/BFF, with appropriate SameSite/CSRF and CORS controls. Tab storage reduces persistence but remains readable by JavaScript, including allowed third-party scripts. Logout currently clears the browser session; server revocation needs a backend endpoint.
5. **Resource and abuse controls.** Rate-limit login, mutations, archive access, scraping and live connections at the backend/edge. Bound body sizes, upstream timeouts, SSE queues and connections per principal/IP. Add backpressure and disconnect slow clients. Share upstream F1 subscriptions across viewers and use cross-instance pub/sub when horizontally scaling. Cache public standings/calendar data at the API/CDN; never publicly cache authenticated responses.
6. **Database and operations.** Review parameterized queries, allowlisted admin tables/fields, least-privilege credentials, indexes/pagination, connection pooling, backups/restore tests, audit logs, alerting and hosting firewall/DDoS controls. None can be established from this frontend repository.

## Deployment and compatibility notes

- No deployment was performed. Headers become effective only after Vercel deploys these changes. `vite preview` does not automatically emulate Vercel headers.
- Existing users must sign in again. Token and cached profile now live in `sessionStorage`; independent new tabs may require sign-in. Backend ownership checks remain mandatory even with tab-scoped state.
- CSP `connect-src` includes the current production API. If `VITE_BACKEND_URL` changes for a deployment, update that origin in `vercel.json`. The production authentication client requires HTTPS.
- The CSP permits inline styles because the app uses React style props and inline fallback layouts. HTTPS images remain broadly allowed for existing remote artwork. Google and existing analytics scripts remain trusted third parties; this is not a nonce-based strict CSP.
- Verify Google sign-in (including popup mode), news thumbnails, analytics, radio playback, offline navigation and live/archive streaming on a deployment preview. No browser integration tests or real-account login were run in this environment. Oversized real sessions may need measured adjustments to the live-data budgets; overflow deliberately reconnects rather than silently losing deltas.
- The service worker caps cached assets; an offline route whose lazy chunk has not previously loaded is not guaranteed to work. Public navigation is refreshed from the network when online.
- The workflow uses Node 24 and `npm ci --ignore-scripts`, and fails on any reported npm advisory. GitHub Actions and Dependabot only take effect after the configuration is committed/pushed and enabled on the repository. No remote configuration was changed.

## Verification evidence

- `npm audit --json`: 0 vulnerabilities after updates (baseline 8).
- `npm run lint`: passes without warnings after fixes.
- `npm run test:security`: 11 passing tests exercise URL validation, prototype/key attacks, indexed merge compatibility, retained-state and queue limits, SEO injection/path handling, credential origin restrictions, expired sessions, cache exclusions, CSP and proxy restrictions.
- `npm run build`: TypeScript and Vite production build pass; 22 race pages and 25 sitemap URLs generated using the bundled calendar because the build environment could not reach the API. Vite prints a pre-existing `__dirname` configuration deprecation warning; it is not a build failure.
- `git diff --check`: passes.
- A limited credential-pattern scan of 87 tracked files found no private-key blocks or known GitHub/AWS/Google OAuth client-secret/Stripe-secret patterns. `.env` is untracked; only its variable names were inspected for reporting. This is not an exhaustive secret scan and does not cover git history. All `VITE_` configuration is public in a browser build; never place privileged credentials there.
- Production bundles separate the dashboard entry (~332 kB before gzip), admin (~38 kB), live (~24 kB) and race details (~41 kB). These measurements show code splitting, not a tested concurrency limit. No backend load test was run.

## References

- [Google Identity Services CSP and popup setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid): basis for Google-specific CSP sources and `same-origin-allow-popups`.
- [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html): browser storage is JavaScript-readable; secure server-managed sessions remain a backend task.
