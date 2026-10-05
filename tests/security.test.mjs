import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { deepMerge, LiveQueue, parseLiveMessage, validateLiveValue } from '../src/lib/liveData.ts';
import { safeArticleUrl, safeImageUrl } from '../src/lib/newsUrls.ts';
import { racePage, loadRacesFromSnapshot, validateRaces } from '../scripts/generate-seo-pages.mjs';

test('feed URLs reject executable schemes, deceptive hosts and unexpected paths', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'https://formula1.com.evil.test/en/latest/test',
    'https://www.formula1.com@evil.test/en/latest/test', 'http://www.formula1.com/en/latest/test',
    'https://www.formula1.com/en/latest/../../admin', 'https://www.formula1.com:444/en/latest/test']) {
    assert.equal(safeArticleUrl(url), undefined);
  }
  assert.equal(safeArticleUrl('https://www.formula1.com/en/latest/article.test'), 'https://www.formula1.com/en/latest/article.test');
  assert.equal(safeImageUrl('javascript:alert(1)'), undefined);
  assert.equal(safeImageUrl('https://images.example.com/a.png'), 'https://images.example.com/a.png');
});

test('live parser rejects unsafe keys, malformed JSON, excessive size and nesting', () => {
  for (const text of ['{', '{"__proto__":{"polluted":true}}', '{"a":{"constructor":{}}}',
    '['.repeat(40) + '0' + ']'.repeat(40), ' '.repeat(8_000_001)]) {
    assert.throws(() => parseLiveMessage(text));
  }
  assert.deepEqual(parseLiveMessage('{"topic":"TimingData","data":{"Lines":{}}}').data, { Lines: {} });
});

test('live merge preserves indexed deltas without prototype writes or oversized arrays', () => {
  const base = { Lines: [{ time: 10, laps: 1 }] };
  assert.deepEqual(deepMerge(base, { Lines: { 0: { laps: 2 } } }), { Lines: [{ time: 10, laps: 2 }] });
  assert.equal(base.Lines[0].laps, 1);
  const result = deepMerge({}, JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"ok":1}'));
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(result, { ok: 1 });
  assert.deepEqual(deepMerge([], { '-1': 1, '4294967294': 2, '01': 3 }), []);
});

test('retained live state cannot grow without bounds across deltas', () => {
  let state = { message: 'a'.repeat(4_000_000) };
  state = deepMerge(state, { second: 'b'.repeat(4_000_001) });
  assert.throws(() => validateLiveValue(state));
});

test('live buffer enforces byte/count limits and releases space after draining', () => {
  const queue = new LiveQueue();
  const update = { receivedAt: 100, topic: 'TimingData', data: {}, bytes: 8_000_000 };
  queue.push(update); queue.push({ ...update, receivedAt: 200 });
  assert.throws(() => queue.push({ ...update, bytes: 1 }));
  assert.equal(queue.drain(99).length, 0);
  assert.equal(queue.drain(100).length, 1);
  queue.push(update);
  queue.clear();
  for (let i = 0; i < 10_000; i++) queue.push({ ...update, bytes: 1 });
  assert.throws(() => queue.push({ ...update, bytes: 1 }));
  assert.equal(queue.drain(100).length, 10_000);
});

test('SEO generator confines paths and escapes closing script tags and replacement tokens', () => {
  const race = structuredClone(loadRacesFromSnapshot()[0]);
  for (const season of ['../../outside', '/tmp', '2026"><script>']) {
    assert.throws(() => validateRaces([{ ...race, season }]));
  }
  race.raceName = 'Test $& </script><script>alert(1)</script>';
  const html = racePage(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), race);
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('Test $&amp;'));
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.ok(json.includes('\\u003c/script>'));
  assert.ok(JSON.parse(json)['@graph'][1].name.includes(race.raceName));
});

function authHarness() {
  const source = readFileSync(new URL('../src/lib/auth.ts', import.meta.url), 'utf8')
    .replaceAll('import.meta.env.VITE_BACKEND_URL', JSON.stringify('https://api.example.com'))
    .replaceAll('import.meta.env.PROD', 'true');
  const storage = () => {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  };
  const calls = [];
  const context = { exports: {}, URL, Headers, AbortSignal, Event,
    localStorage: storage(), sessionStorage: storage(), window: new EventTarget(),
    fetch: async (...args) => { calls.push(args); return new Response('{}'); } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 } }).outputText, context);
  return { ...context, auth: context.exports, calls, context };
}

test('authenticated fetch fails closed and never sends credentials to a foreign origin', async () => {
  const h = authHarness();
  await assert.rejects(h.auth.authFetch('https://api.example.com/profile/1'));
  h.sessionStorage.setItem('f1_token', 'test-token');
  for (const url of ['https://evil.test/admin', 'http://api.example.com/admin', 'https://api.example.com.evil.test/admin']) {
    await assert.rejects(h.auth.authFetch(url));
  }
  assert.equal(h.calls.length, 0);
  await h.auth.authFetch('https://api.example.com/profile/1');
  const init = h.calls[0][1];
  assert.equal(init.headers.get('Authorization'), 'Bearer test-token');
  assert.equal(init.redirect, 'error');
  assert.equal(init.cache, 'no-store');
  assert.ok(init.signal);
});

test('legacy persistent credentials are removed and expired sessions are cleared', async () => {
  const h = authHarness();
  h.localStorage.setItem('f1_token', 'legacy');
  assert.equal(h.auth.getToken(), null);
  assert.equal(h.localStorage.getItem('f1_token'), null);
  h.sessionStorage.setItem('f1_token', 'expired');
  h.localStorage.setItem('f1_user', '{}');
  h.context.fetch = async () => new Response('{}', { status: 401 });
  await h.auth.authFetch('https://api.example.com/admin/verify');
  assert.equal(h.sessionStorage.getItem('f1_token'), null);
  assert.equal(h.localStorage.getItem('f1_user'), null);
});

function workerHarness() {
  const listeners = new Map();
  const context = { self: { location: { origin: 'https://www.mypitwall.in' }, addEventListener: (name, fn) => listeners.set(name, fn) }, URL };
  vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
  return listeners.get('fetch');
}

test('service worker bypasses private, proxy, cross-origin, authenticated and mutation requests', () => {
  const handle = workerHarness();
  for (const [path, init] of [
    ['/admin-portal', {}], ['/account-deletion', {}], ['/profile/1', {}], ['/f1-news', {}],
    ['/f1-article/en/latest/test', {}], ['/assets/test.js?token=x', {}],
    ['/assets/test.js', { method: 'POST' }], ['/assets/test.js', { headers: { Authorization: 'Bearer test' } }],
    ['https://www.mypitwall.in.evil.test/assets/test.js', {}],
  ]) {
    let intercepted = false;
    handle({ request: new Request(new URL(path, 'https://www.mypitwall.in'), init), respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false, path);
  }
});

test('deployment policy blocks inline scripts and framing while retaining Google sign-in', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
  const csp = headers['Content-Security-Policy'];
  assert.ok(csp.includes("frame-ancestors 'none'"));
  assert.ok(csp.includes("object-src 'none'"));
  const scripts = csp.split('; ').find(directive => directive.startsWith('script-src '));
  assert.ok(!scripts.includes('unsafe-inline') && !scripts.includes('unsafe-eval'));
  assert.ok(scripts.includes('https://accounts.google.com/gsi/client'));
  for (const name of ['index.html', 'live.html', 'privacy.html']) {
    const html = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
    for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      assert.ok(attrs.includes('application/ld+json') || !body.trim(), `${name} has executable inline code`);
    }
  }
});


test('article proxy is scoped to news paths and upstream documents are sandboxed', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const proxy = config.rewrites.find(rule => rule.source.startsWith('/f1-article'));
  assert.equal(proxy.source, '/f1-article/en/latest/:path*');
  assert.equal(proxy.destination, 'https://www.formula1.com/en/latest/:path*');
  for (const source of ['/f1-news', '/f1-article/:path*']) {
    const policy = config.headers.find(rule => rule.source === source).headers.find(header => header.key === 'Content-Security-Policy');
    assert.ok(policy.value.startsWith("sandbox; default-src 'none'"));
  }
  assert.ok(readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8').includes("'/f1-article/en/latest/':"));
});
