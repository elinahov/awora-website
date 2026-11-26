// POST /api/order — validates a checkout, recomputes prices on the server, saves the order
// with the service role and emails the shop (ORDER_NOTIFY_EMAIL, default eleenehovak@gmail.com).
import { clientIp, config, esc, sendEmail, serviceClient } from './_lib.js';
import { configCode, formatAMD, mergePricing, normLevers, priceOf } from '../src/lib/config.js';
import { COVER_SHAPES, DECOR_SHAPES, DECOR_SIZES, PATTERNS, SECTION_TYPES } from '../src/data/seed.js';

const MAX_ITEMS = 50, MAX_QTY = 20, RATE_WINDOW_MIN = 10, RATE_MAX = 5;
const ids = list => list.map(o => o.id);
const str = (v, max) => typeof v === 'string' ? v.trim().slice(0, max) : '';

class Bad extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

// Rebuild a configuration from allowed values only. Throws on anything unknown.
function cleanConfig(raw, product, colorIds) {
  if (!raw || typeof raw !== 'object') throw new Bad('Invalid configuration');
  const pick = (v, allowed, what) => { if (!allowed.includes(v)) throw new Bad(`Invalid ${what}`); return v; };
  const c = raw.colors || {};
  const colors = { base: pick(c.base, colorIds, 'color'), pattern: pick(c.pattern, colorIds, 'color'), accent: pick(c.accent, colorIds, 'color') };
  const pattern = pick(raw.pattern, ids(PATTERNS), 'pattern');
  if (product.kind === 'cover') {
    const sections = pick(Number(raw.sections), [1, 2, 3, 4], 'sections');
    const slotIds = ids(SECTION_TYPES);
    const slots = Array.from({ length: 4 }, (_, i) => slotIds.includes(raw.slots?.[i]) ? raw.slots[i] : 'k1');
    for (let i = 0; i < sections; i++) pick(raw.slots?.[i], slotIds, 'section');
    const levers = normLevers(raw.levers); // unknown topper ids fall back to 'none'
    return { kind: 'cover', sections, slots, levers, shape: pick(raw.shape, ids(COVER_SHAPES), 'shape'), orientation: pick(raw.orientation, ['h', 'v'], 'orientation'), pattern, colors };
  }
  return {
    kind: product.kind,
    shape: pick(raw.shape, ids(DECOR_SHAPES[product.kind] || []), 'shape'),
    size: pick(raw.size, ids(DECOR_SIZES[product.kind] || []), 'size'),
    pattern, colors
  };
}

function orderEmail(order, colorsById) {
  const sw = id => `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${esc(colorsById[id]?.hex || '#ccc')};border:1px solid #0002;vertical-align:-2px"></span> ${esc(colorsById[id]?.name?.en || id)}`;
  const rows = order.items.map(i => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee"><b>${esc(i.name?.en || i.slug)}</b><br>
        <code style="font-size:12px;color:#641C35">${esc(i.code)}</code><br>
        <span style="font-size:12px">${sw(i.config.colors.base)} &nbsp; ${sw(i.config.colors.pattern)} &nbsp; ${sw(i.config.colors.accent)}</span></td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${esc(formatAMD(i.price * i.qty, 'en'))}</td>
    </tr>`).join('');
  const site = config.site();
  const link = site ? `<p><a href="${esc(site)}/en/admin/orders/${esc(order.id)}" style="color:#641C35">Open in the admin panel →</a></p>` : '';
  const line = (k, v) => v ? `<tr><td style="padding:3px 12px 3px 0;color:#7a5a66">${k}</td><td style="padding:3px 0">${esc(v)}</td></tr>` : '';
  return `<div style="font-family:Arial,sans-serif;color:#641C35;max-width:620px">
    <h2 style="margin:0 0 4px">New order #${order.number}</h2>
    <p style="margin:0 0 18px;color:#7a5a66">${esc(new Date(order.created_at).toUTCString())} · ${order.user_id ? 'signed-in customer' : 'guest'} · site language: ${esc(order.lang)}</p>
    <table style="font-size:14px;margin-bottom:18px">
      ${line('Name', order.name)}${line('Phone', order.phone)}${line('Email', order.email)}${line('City', order.city)}${line('Address', order.address)}${line('Note', order.note)}
    </table>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="text-align:left;background:#F3EDE4"><th style="padding:8px">Item</th><th style="padding:8px">Qty</th><th style="padding:8px;text-align:right">Sum</th></tr>
      ${rows}
      <tr><td colspan="2" style="padding:12px 8px;text-align:right"><b>Total</b></td><td style="padding:12px 8px;text-align:right"><b>${esc(formatAMD(order.total, 'en'))}</b></td></tr>
    </table>
    ${link}
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const db = serviceClient();
  if (!db) return res.status(503).json({ error: 'Ordering is not configured yet' });

  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (b.website) return res.status(200).json({ ok: true, number: 0 }); // honeypot

    const c = b.customer || {};
    const customer = {
      name: str(c.name, 120), phone: str(c.phone, 40), email: str(c.email, 160).toLowerCase(),
      city: str(c.city, 80), address: str(c.address, 300), note: str(c.note, 1000) || null
    };
    if (!customer.name || !customer.phone || !customer.city || !customer.address) throw new Bad('Please fill in all required fields');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new Bad('Please enter a valid email');
    if (!/^[+\d][\d\s()-]{5,}$/.test(customer.phone)) throw new Bad('Please enter a valid phone number');
    const lang = b.lang === 'en' ? 'en' : 'hy';

    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) throw new Bad('Your cart is empty');
    if (items.length > MAX_ITEMS) throw new Bad('Too many items in one order');

    const ip = clientIp(req);
    if (ip) {
      const since = new Date(Date.now() - RATE_WINDOW_MIN * 60e3).toISOString();
      const { count } = await db.from('orders').select('id', { count: 'exact', head: true }).eq('ip', ip).gte('created_at', since);
      if ((count || 0) >= RATE_MAX) throw new Bad('Too many orders in a short time. Please try again later.', 429);
    }

    // Who is ordering (optional)
    let userId = null;
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
      const { data } = await db.auth.getUser(auth.slice(7));
      userId = data?.user?.id || null;
    }

    const slugs = [...new Set(items.map(i => String(i.slug || '')))];
    const [prods, cols, set] = await Promise.all([
      db.from('products').select('slug, kind, name, published').in('slug', slugs),
      db.from('colors').select('id, hex, name'),
      db.from('settings').select('value').eq('key', 'pricing').maybeSingle()
    ]);
    if (prods.error || cols.error) throw new Error((prods.error || cols.error).message);
    const pricing = mergePricing(set.data?.value);
    const colorIds = cols.data.map(c => c.id);
    const colorsById = Object.fromEntries(cols.data.map(c => [c.id, c]));

    const lines = items.map(i => {
      const product = prods.data.find(p => p.slug === i.slug && p.published);
      if (!product) throw new Bad('One of the items is no longer available. Please remove it from the cart.');
      const qty = Math.floor(Number(i.qty));
      if (!(qty >= 1 && qty <= MAX_QTY)) throw new Bad('Invalid quantity');
      const cfg = cleanConfig(i.config, product, colorIds);
      return { slug: product.slug, name: product.name, config: cfg, code: configCode(cfg), qty, price: priceOf(cfg, pricing) };
    });
    const total = lines.reduce((n, l) => n + l.price * l.qty, 0);

    const { data: order, error } = await db.from('orders')
      .insert({ ...customer, lang, items: lines, total, user_id: userId, ip })
      .select('*').single();
    if (error) throw new Error(error.message);

    // Keep the signed-in customer's details for next time.
    if (userId) {
      await db.from('profiles').upsert({ id: userId, name: customer.name, phone: customer.phone, city: customer.city, address: customer.address, updated_at: new Date().toISOString() });
    }

    try {
      await sendEmail({
        to: config.notify(),
        subject: `Awora order #${order.number} — ${customer.name}, ${formatAMD(total, 'en')}`,
        html: orderEmail(order, colorsById),
        replyTo: customer.email
      });
    } catch (e) {
      console.error('[awora] order email failed', order.number, e); // the order is saved; it shows in /admin anyway
    }

    return res.status(200).json({ ok: true, number: order.number, total });
  } catch (e) {
    if (e instanceof Bad) return res.status(e.status).json({ error: e.message });
    console.error('[awora] order failed', e);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
