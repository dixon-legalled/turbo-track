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

// Opened in a browser tab (not from the home screen) the site shows an install page instead of the game.
const GATE = `<script>
(function(){
  var installed = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
  window.TT_GATE = !installed;
  if (!installed) document.documentElement.classList.add('gate');
})();
</script>`;

const LANDING_CSS = `<style>
/* Install page: a single deliberate party look, matching the game's Birthday mode */
#landing{display:none}
html.gate,html.gate body{height:auto;min-height:100%;overflow:auto;background:#4A1F73}
html.gate body{-webkit-user-select:auto;user-select:auto}
html.gate #app{display:none}
html.gate #landing{display:flex;min-height:100vh;min-height:100dvh;color:#FFF2FA;font-family:var(--body);
  padding:max(28px,env(safe-area-inset-top,0px)) max(20px,env(safe-area-inset-right,0px)) max(28px,env(safe-area-inset-bottom,0px)) max(20px,env(safe-area-inset-left,0px));
  background:
    radial-gradient(circle at 12% 18%,#FF4FA3 0 5px,transparent 6px),radial-gradient(circle at 86% 12%,#FFD23F 0 4px,transparent 5px),
    radial-gradient(circle at 78% 72%,#3ED6C1 0 5px,transparent 6px),radial-gradient(circle at 18% 82%,#8E6CFF 0 4px,transparent 5px),
    radial-gradient(circle at 50% 6%,#FF8A3D 0 3px,transparent 4px),radial-gradient(circle at 94% 46%,#FF4FA3 0 3px,transparent 4px),
    radial-gradient(circle at 6% 52%,#FFD23F 0 3px,transparent 4px),
    radial-gradient(ellipse at 50% 0%,#6B33A3 0%,#4A1F73 60%)}
.lp{margin:auto;width:100%;max-width:440px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.lp-icon{width:116px;height:116px;border-radius:26px;box-shadow:0 8px 0 rgba(0,0,0,.3);transform:rotate(-4deg)}
.lp-logo{margin:4px 0 0;font-family:var(--display);font-weight:400;text-transform:uppercase;line-height:.86;transform:skew(-9deg)}
.lp-logo span{display:block;font-size:clamp(56px,17vw,96px)}
.lp-logo span:first-child{color:#FFD84D;text-shadow:0 6px 0 #FF3E9A,0 12px 0 rgba(0,0,0,.35)}
.lp-logo span:last-child{color:#FFF2FA;text-shadow:0 6px 0 #6B33A3,0 12px 0 rgba(0,0,0,.35)}
.lp-checker{height:16px;width:220px;max-width:70%;transform:skew(-9deg);border-radius:3px;background:repeating-conic-gradient(#fff 0 25%,#16161c 0 50%) 0 0/16px 16px}
.lp-tag{margin:0;font-size:18px;line-height:1.4;max-width:32ch;text-wrap:balance}
.lp-credit{margin:-4px 0 4px;font-size:16px;letter-spacing:.02em;opacity:.92}
.lp-credit b{font-family:var(--display);font-weight:400;font-size:19px;color:#FFD84D;letter-spacing:.01em}
.lp-steps{list-style:none;margin:0;padding:16px 18px;display:flex;flex-direction:column;gap:12px;text-align:left;width:100%;background:#6B33A3;border-radius:20px;box-shadow:0 8px 0 rgba(0,0,0,.28)}
.lp-steps li{display:flex;gap:12px;align-items:center;line-height:1.3;font-size:18px}
.lp-n{flex:none;width:30px;height:30px;border-radius:50%;background:#FFD84D;color:#4A1F73;font-family:var(--display);display:flex;align-items:center;justify-content:center;font-size:17px}
.lp-steps svg{width:22px;height:22px;vertical-align:-5px;margin-left:4px}
@media (orientation:landscape) and (max-height:520px){
  html.gate #landing{padding-top:max(14px,env(safe-area-inset-top,0px));padding-bottom:max(14px,env(safe-area-inset-bottom,0px))}
  .lp{max-width:800px;display:grid;grid-template-columns:1fr 1fr;column-gap:28px;row-gap:10px;justify-items:center;align-items:center;
    grid-template-areas:"icon tag" "logo credit" "check steps"}
  .lp-icon{grid-area:icon;width:84px;height:84px}
  .lp-logo{grid-area:logo}
  .lp-logo span{font-size:48px}
  .lp-checker{grid-area:check;align-self:start}
  .lp-tag{grid-area:tag;font-size:16px}
  .lp-credit{grid-area:credit;margin:0}
  .lp-steps{grid-area:steps;padding:12px 16px;gap:8px}
  .lp-steps li{font-size:16px}
}
</style>`;

const SHARE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2"/></svg>';
const ADD_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>';

const LANDING = `<main id="landing">
  <div class="lp">
    <img class="lp-icon" src="icons/icon-512.png" alt="Turbo Track icon" width="116" height="116">
    <h1 class="lp-logo"><span>Turbo</span><span>Track</span></h1>
    <div class="lp-checker"></div>
    <p class="lp-tag">A racing game for iPhone and iPad. Pick a big or small car, paint it, choose a track and dodge the bombs and cracks.</p>
    <p class="lp-credit">Designed by <b>Christopher Yong</b></p>
    <ol class="lp-steps" aria-label="How to install">
      <li><span class="lp-n">1</span><span>Tap <b>Share</b>${SHARE_SVG}</span></li>
      <li><span class="lp-n">2</span><span>Tap <b>Add to Home Screen</b>${ADD_SVG}</span></li>
      <li><span class="lp-n">3</span><span>Open <b>Turbo Track</b> from your home screen</span></li>
    </ol>
  </div>
</main>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${INK}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="description" content="Turbo Track, a racing game for iPhone and iPad, designed by Christopher Yong.">
${GATE}
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<style>
/* Full-bleed: the race runs under the notch; the HUD, buttons and menus keep clear of it themselves. */
html{padding:0}
body{margin:0}
</style>
${headPart.trim()}
${LANDING_CSS}
</head>
<body>
${LANDING}
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
