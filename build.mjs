// Builds the installable web app in docs/ from turbo-track.html (the single source file).
// Run: node build.mjs   — then commit and push; GitHub Pages serves docs/.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const src = readFileSync('turbo-track.html', 'utf8');
const split = src.indexOf('<div id="app">');
if (split < 0) throw new Error('Could not find <div id="app"> in turbo-track.html');
const headPart = src.slice(0, split);
const bodyPart = src.slice(split);

const INK = '#4A1F73';
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${INK}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="A racing game: pick a car, paint it, choose a track and dodge the bombs and cracks.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<style>
/* Full-bleed: the race runs under the notch; the HUD, buttons and menus keep clear of it themselves. */
html{padding:0}
body{margin:0}
</style>
${headPart.trim()}
</head>
<body>
${bodyPart.trim()}
<script>
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
</script>
</body>
</html>
`;

const version = createHash('sha1').update(html).digest('hex').slice(0, 10);

const manifest = {
  name: 'Turbo Track',
  short_name: 'Turbo Track',
  id: './',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'landscape',
  background_color: INK,
  theme_color: INK,
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const sw = `// Offline support. The version changes on every build so phones pick up updates.
const CACHE = 'turbo-track-${version}';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The page itself: try the network first so updates arrive, fall back to the cached copy offline.
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Fonts and icons: serve from cache, fill the cache on first use.
  if (url.origin === location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque'){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
`;

mkdirSync('docs/icons', { recursive: true });
writeFileSync('docs/index.html', html);
writeFileSync('docs/manifest.webmanifest', JSON.stringify(manifest, null, 2) + '\n');
writeFileSync('docs/sw.js', sw);
writeFileSync('docs/.nojekyll', '');
for (const f of ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'])
  if (!existsSync('docs/icons/' + f)) console.warn('Missing docs/icons/' + f);
console.log('Built docs/ (version ' + version + ')');
