// Google Analytics events (GA4 tag in index.html). Safe to call anywhere: it does nothing
// when gtag isn't loaded. On localhost the tag isn't loaded; events are logged to the console instead.
export function track(name, params = {}) {
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { console.debug('[analytics]', name, params); return; }
    window.gtag?.('event', name, params);
  } catch { /* analytics must never break the page */ }
}
