// Post-build SEO page generator.
//
// Runs after `vite build` (see the `build` script in package.json) and emits:
//   - dist/race/<season>/<slug>/index.html — one crawlable page per Grand Prix
//     with its own title/description/canonical and SportsEvent structured data.
//     Vercel serves these ahead of the SPA catch-all rewrite (filesystem wins),
//     while the URL stays `/race/:season/:slug` so the React app boots into
//     the matching race view.
//   - dist/sitemap.xml — the full sitemap (static pages + every race page).
//
// The calendar comes from the backend's `GET /races` (the admin-editable
// source of truth); if that's unreachable at build time it falls back to the
// bundled snapshot in src/data/races.ts so the build never blocks on a
// cold-starting backend.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://www.mypitwall.in';
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'https://pitwall-backend-dq9r.onrender.com';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Race-name slug for `/race/:season/:slug` URLs. Must stay in sync with
// `raceSlug` in src/data/races.ts, which the app uses to build the same URLs.
const raceSlug = (race) =>
  race.raceName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const loadRacesFromSnapshot = () => {
  const src = readFileSync(resolve(ROOT, 'src/data/races.ts'), 'utf8');
  const m = src.match(/export const RACES: Race\[\] = \[([\s\S]*?)\n\];/);
  if (!m) throw new Error('Could not extract RACES snapshot from src/data/races.ts');
  return JSON.parse(`[${m[1]}]`);
};

const loadRaces = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/races`, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[seo] calendar: ${data.length} races from ${BACKEND_URL}/races`);
        return [...data].sort((a, b) => Number(a.round) - Number(b.round));
      }
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    const races = loadRacesFromSnapshot();
    console.log(`[seo] calendar: backend unavailable (${e.message}), using bundled snapshot (${races.length} races)`);
    return races;
  }
};

// "2026-08-23" + "13:00:00Z" -> ISO 8601 for schema.org startDate.
const isoDate = (date, time) => (time ? `${date}T${time}` : date);

const fmtDay = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const fmtTime = (time) => (time ? ` · ${time.replace(/:00Z$/, '')} UTC` : '');

const sessionRows = (race) => {
  const rows = [
    ['FP1', race.FirstPractice],
    ['FP2', race.SecondPractice],
    ['FP3', race.ThirdPractice],
    ['Sprint Qualifying', race.SprintQualifying],
    ['Sprint', race.Sprint],
    ['Qualifying', race.Qualifying],
    ['Race', { date: race.date, time: race.time }],
  ];
  return rows
    .filter(([, s]) => s?.date)
    .map(
      ([label, s]) =>
        `<li><strong>${esc(label)}</strong> — ${esc(fmtDay(s.date))}${esc(fmtTime(s.time))}</li>`
    )
    .join('\n        ');
};

const raceJsonLd = (race) => {
  const loc = race.Circuit.Location;
  const path = `/race/${race.season}/${raceSlug(race)}`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: `${race.raceName} ${race.season}`, item: `${SITE}${path}` },
        ],
      },
      {
        '@type': 'SportsEvent',
        name: `${race.season} ${race.raceName}`,
        sport: 'Motorsport',
        startDate: isoDate(race.FirstPractice?.date || race.date, race.FirstPractice?.time),
        endDate: isoDate(race.date, race.time),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: race.Circuit.circuitName,
          address: { '@type': 'PostalAddress', addressLocality: loc.locality, addressCountry: loc.country },
          ...(loc.lat && loc.long
            ? { geo: { '@type': 'GeoCoordinates', latitude: Number(loc.lat), longitude: Number(loc.long) } }
            : {}),
        },
        superEvent: {
          '@type': 'SportsEvent',
          name: `${race.season} FIA Formula One World Championship`,
        },
        organizer: { '@type': 'Organization', name: 'Formula 1', url: 'https://www.formula1.com/' },
        image: `${SITE}/screenshot-desktop.png`,
        url: `${SITE}${path}`,
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE}${path}#webpage`,
        url: `${SITE}${path}`,
        name: `${race.raceName} ${race.season} — Schedule, Qualifying & Race Results`,
        isPartOf: { '@id': `${SITE}/#website` },
        publisher: { '@id': `${SITE}/#organization` },
      },
    ],
  };
  return JSON.stringify(graph, null, 2);
};

// Replace `pattern` (which must match) in `html` — throws if the template
// drifted so a broken build fails loudly instead of shipping stale meta.
const mustReplace = (html, pattern, replacement, what) => {
  if (!pattern.test(html)) throw new Error(`Template marker not found: ${what}`);
  return html.replace(pattern, replacement);
};

const racePage = (template, race) => {
  const path = `/race/${race.season}/${raceSlug(race)}`;
  const url = `${SITE}${path}`;
  const loc = race.Circuit.Location;
  const hasSprint = Boolean(race.Sprint?.date);
  const title = `${race.raceName} ${race.season} — Schedule, Qualifying & Race Results | My PitWall`;
  const description =
    `${race.raceName} ${race.season} at ${race.Circuit.circuitName}, ${loc.locality}, ${loc.country} — ` +
    `round ${race.round} of the ${race.season} F1 season on ${fmtDay(race.date)}. ` +
    `Full weekend schedule${hasSprint ? ' including the sprint' : ''}, free live timing and telemetry ` +
    `during every session, and complete qualifying and race results on My PitWall.`;

  let html = template;
  html = mustReplace(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, '<title>');
  html = mustReplace(
    html,
    /<meta name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(description)}" />`,
    'meta description'
  );
  html = mustReplace(
    html,
    /<meta name="keywords"[\s\S]*?\/>/,
    `<meta name="keywords" content="${esc(
      `${race.raceName} ${race.season}, F1 ${loc.country} ${race.season}, ${race.Circuit.circuitName}, F1 round ${race.round} ${race.season}, ${race.raceName} schedule, ${race.raceName} results, ${race.raceName} qualifying, F1 live timing`
    )}" />`,
    'meta keywords'
  );
  html = mustReplace(
    html,
    /<link rel="canonical"[^>]*\/>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical'
  );
  html = mustReplace(
    html,
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${esc(`${race.raceName} ${race.season} — Schedule & Results`)}" />`,
    'og:title'
  );
  html = mustReplace(
    html,
    /<meta property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${esc(description)}" />`,
    'og:description'
  );
  html = mustReplace(
    html,
    /<meta property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url'
  );
  html = mustReplace(
    html,
    /<meta name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${esc(`${race.raceName} ${race.season} — Schedule & Results`)}" />`,
    'twitter:title'
  );
  html = mustReplace(
    html,
    /<meta name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    'twitter:description'
  );
  html = mustReplace(
    html,
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">\n  ${raceJsonLd(race)}\n  </script>`,
    'JSON-LD'
  );

  const main = `<main style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:2rem;background:#0a0a0a;color:#f5f5f5;font-family:'Inter',system-ui,sans-serif;text-align:center">
      <img src="/logo.svg" alt="My PitWall logo" width="96" height="96" style="width:96px;height:96px;object-fit:contain;margin-bottom:.5rem" />
      <h1 style="font-family:'Orbitron',sans-serif;font-size:clamp(1.5rem,4.5vw,2.5rem);margin:0;letter-spacing:.04em">
        ${esc(race.raceName)} ${esc(race.season)}
      </h1>
      <p style="max-width:46rem;font-size:1.05rem;line-height:1.6;color:#cfcfcf;margin:0">
        Round ${esc(race.round)} of the ${esc(race.season)} Formula 1 season at
        ${esc(race.Circuit.circuitName)} in ${esc(loc.locality)}, ${esc(loc.country)}.
        Follow every session with free live timing and telemetry, then browse the
        full qualifying${hasSprint ? ', sprint' : ''} and race results on My PitWall.
      </p>
      <h2 style="font-family:'Orbitron',sans-serif;font-size:1rem;letter-spacing:.1em;text-transform:uppercase;margin:.75rem 0 0;color:#e5e5e5">Race weekend schedule (UTC)</h2>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:.4rem;padding:0;margin:0;font-size:.95rem;color:#bdbdbd">
        ${sessionRows(race)}
      </ul>
      <nav aria-label="Main sections" style="display:flex;flex-wrap:wrap;gap:1.25rem;justify-content:center;margin-top:.75rem;font-size:.95rem">
        <a href="/" style="color:#f87171;text-decoration:none">My PitWall dashboard</a>
        <a href="/live" style="color:#f87171;text-decoration:none">F1 Live Timing &amp; Telemetry</a>
      </nav>
      <p style="font-size:.85rem;color:#7a7a7a;margin-top:1rem">Loading race details…</p>
    </main>`;
  html = mustReplace(html, /<main[\s\S]*?<\/main>/, main, '<main> fallback');

  return html;
};

export const buildSitemap = (races) => {
  const today = new Date().toISOString().slice(0, 10);
  const entry = (loc, lastmod, changefreq, priority) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const entries = [
    entry(`${SITE}/`, today, 'daily', '1.0'),
    entry(`${SITE}/live`, today, 'daily', '0.9'),
    ...races.map((r) => entry(`${SITE}/race/${r.season}/${raceSlug(r)}`, today, 'weekly', '0.7')),
    entry(`${SITE}/privacy`, today, 'yearly', '0.3'),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
};

// Only run the generation when executed directly (`node scripts/generate-seo-pages.mjs`);
// vite.config.ts imports the exports above to serve the sitemap in dev.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const races = await loadRaces();
  const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');

  for (const race of races) {
    const dir = resolve(DIST, 'race', String(race.season), raceSlug(race));
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'index.html'), racePage(template, race));
  }
  console.log(`[seo] wrote ${races.length} race pages to dist/race/`);

  writeFileSync(resolve(DIST, 'sitemap.xml'), buildSitemap(races));
  console.log(`[seo] wrote dist/sitemap.xml (${races.length + 3} URLs)`);
}
