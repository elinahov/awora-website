// Build step (runs after `vite build` and the SSR build, see package.json "build"):
// renders every public page to real HTML with its own <head> (title, description, canonical,
// hreflang, social tags, JSON-LD), and writes sitemap.xml, robots.txt, llms.txt and product SVGs.
// Search engines and AI assistants then read full content without running JavaScript.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssr = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href);
const { render, productSvg, seoFor, indexablePaths, headHtml, seed, mergePricing } = ssr;
const { SITE_URL, SITE } = await import(pathToFileURL(join(root, 'src', 'site.js')).href);
const { FRAME_MM, PITCH_MM } = await import(pathToFileURL(join(root, 'src', 'lib', 'shapes.js')).href);

// Catalog: live data from Supabase when the build has its keys, otherwise the bundled seed.
const env = { ...loadEnv('production', root, ''), ...process.env };
let catalog = { colors: seed.COLORS, combos: seed.COMBOS, collections: seed.COLLECTIONS, products: seed.PRODUCTS, pricing: mergePricing(null), source: 'seed' };
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const [c, k, l, p, s] = await Promise.all([
      db.from('colors').select('*').order('sort'), db.from('combos').select('*').order('sort'),
      db.from('collections').select('*').order('sort'), db.from('products').select('*').eq('published', true).order('sort'),
      db.from('settings').select('value').eq('key', 'pricing').maybeSingle()
    ]);
    const err = [c, k, l, p].find(r => r.error);
    if (err) throw err.error;
    if (p.data.length) catalog = { colors: c.data, combos: k.data, collections: l.data, products: p.data, pricing: mergePricing(s.data?.value), source: 'supabase' };
  } catch (e) { console.warn('[prerender] Supabase unavailable, using the bundled catalog:', e.message || e); }
}

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const write = (rel, text) => { const f = join(dist, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text); };

// 1. pages: /hy → dist/hy.html, /hy/product/x → dist/hy/product/x.html (served at the clean URL)
const paths = indexablePaths(catalog);
for (const path of paths) {
  const seo = seoFor({ path, catalog });
  const body = render(path, catalog);
  const html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${seo.lang}">`)
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `${headHtml(seo)}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  write(`${path.slice(1)}.html`, html);
}

// 2. product images (the default design), referenced from Product structured data
for (const p of catalog.products) write(`img/products/${p.slug}.svg`, productSvg(p, catalog));

// 3. sitemap with hreflang alternates
const today = new Date().toISOString().slice(0, 10);
const groups = [...new Set(paths.map(p => p.replace(/^\/[a-z]{2}/, '')))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${groups.flatMap(rest => ['hy', 'en'].map(l => `  <url>
    <loc>${SITE_URL}/${l}${rest}</loc>
    <lastmod>${today}</lastmod>
    <xhtml:link rel="alternate" hreflang="hy" href="${SITE_URL}/hy${rest}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/en${rest}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/hy${rest}"/>
  </url>`)).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);

// 4. robots.txt: everyone (search engines and AI assistants) may read the public pages
const rules = 'Allow: /\nDisallow: /*/admin\nDisallow: /*/checkout\nDisallow: /*/account\nDisallow: /api/\n';
const bots = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'YandexBot'];
write('robots.txt', bots.map(b => `User-agent: ${b}\n${rules}`).join('\n') + `\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// 5. llms.txt: a plain summary for AI assistants (https://llmstxt.org)
const en = o => (o && (o.en || o.hy)) || '';
const amd = n => `${Number(n).toLocaleString('en-US')} AMD`;
const { fromPrice } = await import(pathToFileURL(join(root, 'src', 'lib', 'config.js')).href);
const enDict = (await import(pathToFileURL(join(root, 'src', 'locales', 'en.js')).href)).default;
const faq = [1, 2, 3, 4, 5, 6].map(i => `- **${enDict[`faq.q${i}`]}** ${enDict[`faq.a${i}`]}`).join('\n');
const contact = [SITE.instagram && `Instagram: ${SITE.instagram}`, SITE.telegram && `Telegram: ${SITE.telegram}`, SITE.email && `Email: ${SITE.email}`].filter(Boolean);
const llms = `# Awora

> Awora ("Objects for happy spaces") makes colorful, customizable 3D-printed light-switch covers, socket covers and small home objects (trays, photo frames, a mirror) for homes in Armenia. Customers design their own piece online (shape, pattern, colors, lever toppers), order it, and Awora prints it to their measurements. The site is in Armenian (default) and English.

## Key facts
- Switch and socket covers slide over the existing switch or socket frame; no electrician needed.
- One-section covers start at ${amd(catalog.pricing.coverFirst)}; each extra section (up to 4) adds ${amd(catalog.pricing.coverExtra)}; each lever topper adds ${amd(catalog.pricing.lever || 0)}. Shapes and patterns are free.
- A one-section cover is built on an ${FRAME_MM} mm square frame; sections are ${PITCH_MM} mm apart (the standard spacing of ganged wall boxes).
- Cover shapes: ${seed.COVER_SHAPES.map(s => s.name.en).join(', ')}.
- Patterns: ${seed.PATTERNS.map(s => s.name.en).join(', ')}.
- Colors (filament): ${catalog.colors.map(c => en(c.name)).join(', ')}.
- Lever toppers for toggle switches: ${seed.LEVER_SHAPES.filter(l => l.id !== 'none').map(l => l.name.en).join(', ')}.
- Ordering: add designs to the cart and check out on the site. There is no online payment; Awora contacts the customer to confirm measurements, delivery and payment.
- Prices are in Armenian dram (AMD).${contact.length ? `\n- Contact: ${contact.join(' · ')}` : ''}

## Pages
- [Home (English)](${SITE_URL}/en): what Awora makes and how ordering works
- [Catalog (English)](${SITE_URL}/en/catalog): every design, filterable by type and sections
- [Measuring & delivery guide (English)](${SITE_URL}/en/guide): how to measure a switch or socket frame
- [Armenian version](${SITE_URL}/hy)

## Products
${catalog.products.map(p => `- [${en(p.name)}](${SITE_URL}/en/product/${p.slug}): ${en(p.blurb)} From ${amd(fromPrice(p, catalog.combos, catalog.pricing))}.`).join('\n')}

## FAQ
${faq}
`;
write('llms.txt', llms);

rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`[prerender] ${paths.length} pages, ${catalog.products.length} product images, sitemap, robots.txt, llms.txt (catalog: ${catalog.source})`);
