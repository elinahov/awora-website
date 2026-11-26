// Per-page SEO: title, description, canonical + hreflang, social tags and schema.org JSON-LD.
// Used at build time by scripts/prerender.mjs (baked into each page's HTML) and in the browser by
// App.jsx (kept in sync while navigating). Pure functions: pass the catalog in.
import { DEFAULT_LANG, LANGS, translate } from '../i18n.jsx';
import { SITE, SITE_URL } from '../site.js';
import { formatAMD, fromPrice, initialConfig, priceOf } from './config.js';
import { COLORS, COVER_SHAPES, PATTERNS } from '../data/seed.js';

export const OG_IMAGE = `${SITE_URL}/brand/Awora_Profile.png`;
const LOCALE = { hy: 'hy_AM', en: 'en_US' };
const PRIVATE = ['account', 'checkout', 'admin'];

const t = (lang, key, vars = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), translate(lang, key));
const pick = (obj, lang) => (obj && (obj[lang] || obj.en)) || '';
const abs = p => SITE_URL + p;

// Paths worth indexing (one per language): home, catalog, guide, every published product.
export function indexablePaths(catalog) {
  return LANGS.flatMap(l => [`/${l}`, `/${l}/catalog`, `/${l}/guide`, ...catalog.products.map(p => `/${l}/product/${p.slug}`)]);
}

const coverType = p => {
  const s = (p.defaults?.slots || []).slice(0, p.defaults?.sections || 1);
  const sockets = s.filter(x => x === 'socket').length;
  return sockets === 0 ? 'switch' : sockets === s.length ? 'socket' : 'mixed';
};
const kindLabel = (p, lang) => t(lang, `seo.kind.${p.kind === 'cover' ? coverType(p) : p.kind}`);

const organization = () => ({
  '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: 'Awora', url: SITE_URL,
  logo: OG_IMAGE, slogan: 'Objects for happy spaces',
  areaServed: { '@type': 'Country', name: 'Armenia' },
  ...(SITE.email ? { email: SITE.email } : {}),
  sameAs: [SITE.instagram, SITE.telegram].filter(Boolean)
});
const crumbs = (lang, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) }))
});

/* seoFor({ path, catalog }) → { lang, title, description, canonical, alternates, robots, image, type, jsonLd } */
export function seoFor({ path, catalog }) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  const [, lang0, section, slug] = clean.split('/');
  const lang = LANGS.includes(lang0) ? lang0 : DEFAULT_LANG;
  const rest = clean.slice(lang0 ? lang0.length + 1 : 0); // path after the language
  const alternates = [...LANGS.map(l => ({ lang: l, href: abs(`/${l}${rest}`) })), { lang: 'x-default', href: abs(`/${DEFAULT_LANG}${rest}`) }];
  const base = { lang, canonical: abs(`/${lang}${rest}`), alternates, image: OG_IMAGE, type: 'website', robots: 'index,follow' };
  const from = formatAMD(Math.min(...catalog.products.filter(p => p.kind === 'cover').map(p => priceOf({ ...initialConfig(p, catalog.combos), sections: 1, levers: undefined }, catalog.pricing))), lang);
  const home = [t(lang, 'seo.crumb.home'), `/${lang}`];

  if (!section) {
    const faq = [1, 2, 3, 4, 5, 6].map(i => ({ '@type': 'Question', name: t(lang, `faq.q${i}`), acceptedAnswer: { '@type': 'Answer', text: t(lang, `faq.a${i}`) } }));
    return { ...base,
      title: t(lang, 'seo.home.title'),
      description: t(lang, 'seo.home.desc', { shapes: COVER_SHAPES.length, patterns: PATTERNS.length, colors: (catalog.colors || COLORS).length, price: from }),
      jsonLd: [organization(),
        { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: 'Awora', url: SITE_URL, inLanguage: LANGS, publisher: { '@id': `${SITE_URL}/#org` } },
        { '@type': 'FAQPage', inLanguage: lang, mainEntity: faq }] };
  }
  if (section === 'catalog') {
    return { ...base,
      title: t(lang, 'seo.catalog.title'),
      description: t(lang, 'seo.catalog.desc', { n: catalog.products.length }),
      jsonLd: [{ '@type': 'CollectionPage', name: t(lang, 'cat.title'), url: base.canonical, inLanguage: lang,
        mainEntity: { '@type': 'ItemList', itemListElement: catalog.products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${lang}/product/${p.slug}`), name: pick(p.name, lang) })) } },
        crumbs(lang, [home, [t(lang, 'cat.title'), `/${lang}/catalog`]])] };
  }
  if (section === 'guide') {
    return { ...base,
      title: t(lang, 'seo.guide.title'), description: t(lang, 'seo.guide.desc'),
      jsonLd: [crumbs(lang, [home, [t(lang, 'nav.guide'), `/${lang}/guide`]])] };
  }
  if (section === 'product') {
    const p = catalog.products.find(x => x.slug === slug);
    if (!p) return { ...base, title: 'Awora', description: t(lang, 'meta.desc'), robots: 'noindex,follow', jsonLd: [] };
    const name = pick(p.name, lang), price = fromPrice(p, catalog.combos, catalog.pricing);
    const img = abs(`/img/products/${p.slug}.svg`);
    return { ...base, type: 'product',
      title: t(lang, 'seo.product.title', { name, kind: kindLabel(p, lang) }),
      description: t(lang, 'seo.product.desc', { blurb: pick(p.blurb, lang), price: formatAMD(price, lang) }),
      price,
      jsonLd: [{
        '@type': 'Product', '@id': `${base.canonical}#product`, name, description: pick(p.blurb, lang), sku: p.slug,
        image: [img, OG_IMAGE], url: base.canonical, inLanguage: lang,
        brand: { '@type': 'Brand', name: 'Awora' }, category: kindLabel(p, lang),
        offers: { '@type': 'Offer', url: base.canonical, priceCurrency: 'AMD', price, availability: 'https://schema.org/MadeToOrder',
          itemCondition: 'https://schema.org/NewCondition', seller: { '@id': `${SITE_URL}/#org` } }
      }, crumbs(lang, [home, [t(lang, 'cat.title'), `/${lang}/catalog`], [name, `/${lang}/product/${p.slug}`]])] };
  }
  // account, checkout, admin and unknown pages stay out of search results
  return { ...base, title: t(lang, 'meta.title'), description: t(lang, 'meta.desc'), robots: PRIVATE.includes(section) ? 'noindex,nofollow' : 'noindex,follow', jsonLd: [] };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The <head> tags for a page, as HTML (prerender).
export function headHtml(seo) {
  const ld = seo.jsonLd.length ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': seo.jsonLd }).replace(/</g, '\\u003c')}</script>` : '';
  return [
    `<title>${esc(seo.title)}</title>`,
    `<meta name="description" content="${esc(seo.description)}">`,
    `<meta name="robots" content="${seo.robots}">`,
    `<link rel="canonical" href="${seo.canonical}">`,
    ...seo.alternates.map(a => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`),
    `<meta property="og:site_name" content="Awora">`,
    `<meta property="og:type" content="${seo.type}">`,
    `<meta property="og:title" content="${esc(seo.title)}">`,
    `<meta property="og:description" content="${esc(seo.description)}">`,
    `<meta property="og:url" content="${seo.canonical}">`,
    `<meta property="og:image" content="${seo.image}">`,
    `<meta property="og:locale" content="${LOCALE[seo.lang]}">`,
    ...LANGS.filter(l => l !== seo.lang).map(l => `<meta property="og:locale:alternate" content="${LOCALE[l]}">`),
    `<meta name="twitter:card" content="summary_large_image">`,
    ld
  ].filter(Boolean).join('\n');
}

// Keep the live document's head in sync while navigating in the browser.
export function applySeo(seo) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = seo.lang;
  document.title = seo.title;
  const meta = (attr, key, value) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', value);
  };
  meta('name', 'description', seo.description);
  meta('name', 'robots', seo.robots);
  meta('property', 'og:title', seo.title);
  meta('property', 'og:description', seo.description);
  meta('property', 'og:url', seo.canonical);
  let canon = document.head.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
  canon.href = seo.canonical;
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  seo.alternates.forEach(a => { const el = document.createElement('link'); el.rel = 'alternate'; el.hreflang = a.lang; el.href = a.href; document.head.appendChild(el); });
}
