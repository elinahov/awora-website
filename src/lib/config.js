import { COVER_SHAPES, PATTERNS, DECOR_SIZES, COVER_PRICING, LEVER_SHAPES } from '../data/seed.js';

const KEY_SLOTS = ['k1', 'k2', 'k3'];
// Number of switch keys (levers) in a section type: k1 → 1, k2 → 2, k3 → 3, socket/blank → 0.
export const keysIn = slot => KEY_SLOTS.includes(slot) ? +slot.slice(1) : 0;
// levers[section][key] = topper id. Always 4 × 3, missing or unknown entries become 'none'.
const LEVER_IDS = LEVER_SHAPES.map(l => l.id);
export const normLevers = raw => Array.from({ length: 4 }, (_, i) => Array.from({ length: 3 }, (_, j) => {
  const v = raw?.[i]?.[j]; return LEVER_IDS.includes(v) ? v : 'none';
}));
// Toppers actually on the cover (only keys of active sections count).
export const activeToppers = cfg => cfg.kind !== 'cover' ? [] :
  cfg.slots.slice(0, cfg.sections).flatMap((slot, i) => (cfg.levers?.[i] || []).slice(0, keysIn(slot))).filter(id => id && id !== 'none');

// Build a full, editable configuration from a product's defaults (+ an optional combo override).
export function initialConfig(product, combos, comboId) {
  const d = product.defaults;
  const combo = combos.find(c => c.id === (comboId || d.combo)) || combos[0];
  const colors = { base: combo.base, pattern: combo.pattern, accent: combo.accent };
  if (product.kind === 'cover') {
    const slots = Array.from({ length: 4 }, (_, i) => d.slots[i] || d.slots[d.slots.length - 1] || 'k1');
    return { kind: 'cover', sections: d.sections, slots, levers: normLevers(d.levers), shape: d.shape, orientation: d.orientation || 'h', pattern: d.pattern, colors };
  }
  return { kind: product.kind, shape: d.shape, size: d.size, pattern: d.pattern, colors };
}

// Price table in AMD. Defaults come from seed.js; the admin can override it (Supabase `settings.pricing`).
export function pricingFromSeed() {
  const map = list => Object.fromEntries(list.map(o => [o.id, o.price || 0]));
  return {
    coverFirst: COVER_PRICING.firstSection,
    coverExtra: COVER_PRICING.extraSection,
    lever: COVER_PRICING.lever,
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
    lever: p.lever ?? s.lever,
    shapes: { ...s.shapes, ...p.shapes },
    patterns: { ...s.patterns, ...p.patterns },
    sizes: Object.fromEntries(Object.keys(s.sizes).map(k => [k, { ...s.sizes[k], ...p.sizes?.[k] }]))
  };
}

export function priceOf(cfg, pricing = SEED_PRICING) {
  const n = v => Number(v) || 0;
  const pat = n(pricing.patterns?.[cfg.pattern]);
  if (cfg.kind === 'cover') {
    return n(pricing.coverFirst) + (cfg.sections - 1) * n(pricing.coverExtra) + n(pricing.shapes?.[cfg.shape]) + pat +
      activeToppers(cfg).length * n(pricing.lever);
  }
  return n(pricing.sizes?.[cfg.kind]?.[cfg.size]) + pat;
}

export function fromPrice(product, combos, pricing) { return priceOf(initialConfig(product, combos), pricing); }

// Short human-readable code, like a label on the box. Used in the cart and for support requests.
export function configCode(cfg) {
  const c = cfg.colors;
  if (cfg.kind === 'cover') {
    const s = cfg.slots.slice(0, cfg.sections).join('+');
    // levers, only when at least one topper is chosen: L-<section keys joined by .>+<next section>…
    const lv = activeToppers(cfg).length ? '-L-' + cfg.slots.slice(0, cfg.sections).map((slot, i) => (cfg.levers?.[i] || []).slice(0, keysIn(slot)).join('.') || '0').join('+') : '';
    return `COVER-${cfg.shape}-${cfg.sections}${cfg.orientation}-${s}-${cfg.pattern}-${c.base}/${c.pattern}/${c.accent}${lv}`.toUpperCase();
  }
  return `${cfg.kind}-${cfg.shape}-${cfg.size}-${cfg.pattern}-${c.base}/${c.pattern}/${c.accent}`.toUpperCase();
}

export const hasKeys = cfg => cfg.kind === 'cover' && cfg.slots.slice(0, cfg.sections).some(s => KEY_SLOTS.includes(s) || s === 'socket');

export const formatAMD = (n, lang) => `${n.toLocaleString(lang === 'hy' ? 'hy-AM' : 'en-US')} ֏`;

// Background field behind a product: never the same as the product's own base color.
// Fields are brand tints; NEAR lists the filament colors that would vanish against one.
const FIELDS = ['ivory', 'petal', 'periwinkle', 'butter', 'mint', 'lilac'];
const NEAR = { white: ['ivory'], sand: ['ivory', 'petal'], yellow: ['butter'], sunflower: ['butter'], misty: ['periwinkle'], blue: ['periwinkle'], green: ['mint'] };
export const fieldFor = (base, prefer) => {
  const clash = f => f === base || (NEAR[base] || []).includes(f);
  if (prefer && !clash(prefer)) return prefer;
  return FIELDS.find(f => !clash(f));
};
