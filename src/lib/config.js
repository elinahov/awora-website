import { COVER_SHAPES, PATTERNS, DECOR_SIZES, COVER_PRICING } from '../data/seed.js';

const KEY_SLOTS = ['k1', 'k2', 'k3'];

// Build a full, editable configuration from a product's defaults (+ an optional combo override).
export function initialConfig(product, combos, comboId) {
  const d = product.defaults;
  const combo = combos.find(c => c.id === (comboId || d.combo)) || combos[0];
  const colors = { base: combo.base, pattern: combo.pattern, accent: combo.accent };
  if (product.kind === 'cover') {
    const slots = Array.from({ length: 4 }, (_, i) => d.slots[i] || d.slots[d.slots.length - 1] || 'k1');
    return { kind: 'cover', sections: d.sections, slots, shape: d.shape, orientation: d.orientation || 'h', pattern: d.pattern, colors };
  }
  return { kind: product.kind, shape: d.shape, size: d.size, pattern: d.pattern, colors };
}

// Price table in AMD. Defaults come from seed.js; the admin can override it (Supabase `settings.pricing`).
export function pricingFromSeed() {
  const map = list => Object.fromEntries(list.map(o => [o.id, o.price || 0]));
  return {
    coverFirst: COVER_PRICING.firstSection,
    coverExtra: COVER_PRICING.extraSection,
    shapes: map(COVER_SHAPES),
    patterns: map(PATTERNS),
    sizes: Object.fromEntries(Object.entries(DECOR_SIZES).map(([k, list]) => [k, map(list)]))
  };
}

const SEED_PRICING = pricingFromSeed();

// Fill gaps in a stored price table with the seed values (new options added later still get a price).
export function mergePricing(p) {
  if (!p) return SEED_PRICING;
  const s = SEED_PRICING;
  return {
    coverFirst: p.coverFirst ?? s.coverFirst,
    coverExtra: p.coverExtra ?? s.coverExtra,
    shapes: { ...s.shapes, ...p.shapes },
    patterns: { ...s.patterns, ...p.patterns },
    sizes: Object.fromEntries(Object.keys(s.sizes).map(k => [k, { ...s.sizes[k], ...p.sizes?.[k] }]))
  };
}

export function priceOf(cfg, pricing = SEED_PRICING) {
  const n = v => Number(v) || 0;
  const pat = n(pricing.patterns?.[cfg.pattern]);
  if (cfg.kind === 'cover') {
    return n(pricing.coverFirst) + (cfg.sections - 1) * n(pricing.coverExtra) + n(pricing.shapes?.[cfg.shape]) + pat;
  }
  return n(pricing.sizes?.[cfg.kind]?.[cfg.size]) + pat;
}

export function fromPrice(product, combos, pricing) { return priceOf(initialConfig(product, combos), pricing); }

// Short human-readable code, like a label on the box. Used in the cart and for support requests.
export function configCode(cfg) {
  const c = cfg.colors;
  if (cfg.kind === 'cover') {
    const s = cfg.slots.slice(0, cfg.sections).join('+');
    return `COVER-${cfg.shape}-${cfg.sections}${cfg.orientation}-${s}-${cfg.pattern}-${c.base}/${c.pattern}/${c.accent}`.toUpperCase();
  }
  return `${cfg.kind}-${cfg.shape}-${cfg.size}-${cfg.pattern}-${c.base}/${c.pattern}/${c.accent}`.toUpperCase();
}

export const hasKeys = cfg => cfg.kind === 'cover' && cfg.slots.slice(0, cfg.sections).some(s => KEY_SLOTS.includes(s) || s === 'socket');

export const formatAMD = (n, lang) => `${n.toLocaleString(lang === 'hy' ? 'hy-AM' : 'en-US')} ֏`;

// Background field behind a product: never the same as the product's own base color.
const FIELDS = ['ivory', 'petal', 'periwinkle', 'butter', 'mint', 'lilac'];
export const fieldFor = (base, prefer) => {
  if (prefer && prefer !== base) return prefer;
  const list = FIELDS.filter(f => f !== base);
  return base === 'ivory' ? 'petal' : list[0];
};
