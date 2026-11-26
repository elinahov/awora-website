// Runs the Node-style /api/order handler on Cloudflare (Workers or Pages Functions).
// Dashboard variables arrive on `env`; they're copied onto process.env, which api/_lib.js reads.
import orderHandler from './order.js';

export async function handleOrder(request, env) {
  const pe = (globalThis.process ??= { env: {} });
  pe.env ??= {};
  for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') pe.env[k] = v;

  const headers = Object.fromEntries(request.headers); // keys are already lower-case
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers['x-forwarded-for'] = ip; // the real client IP, used by the rate limit

  let body = {};
  if (request.method === 'POST') {
    const raw = await request.text();
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = raw; }
  }
  const req = { method: request.method, headers, body };

  let status = 200, payload = null;
  const out = new Headers();
  const res = {
    status(code) { status = code; return res; },
    setHeader(k, v) { out.set(k, String(v)); return res; },
    json(obj) { out.set('Content-Type', 'application/json'); payload = JSON.stringify(obj); return res; },
    end(text) { payload = text ?? ''; return res; }
  };

  await orderHandler(req, res);
  return new Response(payload, { status, headers: out });
}
