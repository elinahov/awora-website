// Cloudflare Worker entry (wrangler.jsonc). Static files in dist/ are served by the assets
// binding before this runs; only /api/* reaches the Worker (assets.run_worker_first).
import { handleOrder } from '../api/_cf.js';

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/order') return handleOrder(request, env);
    if (pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 });
    return env.ASSETS.fetch(request);
  }
};
