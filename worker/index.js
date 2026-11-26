// Cloudflare Worker entry (wrangler.jsonc). Static files in dist/ are served by the assets
// binding before this runs; only / and /api/* reach the Worker (assets.run_worker_first).
import { handleOrder } from '../api/_cf.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    // The bare domain: send people (and crawlers) to a language. English browsers without
    // Armenian/Russian get /en, everyone else the default Armenian site.
    if (pathname === '/') {
      const al = (request.headers.get('accept-language') || '').toLowerCase();
      const lang = /^en/.test(al) && !/\b(hy|ru)\b/.test(al) ? 'en' : 'hy';
      return Response.redirect(new URL(`/${lang}`, request.url), 302);
    }
    if (pathname === '/api/order') return handleOrder(request, env);
    if (pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 });
    return env.ASSETS.fetch(request);
  }
};
