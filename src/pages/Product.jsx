import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { useCart } from '../cart.jsx';
import { configCode, configFromQuery, configToQuery, formatAMD, initialConfig, keysIn, normLevers, priceOf } from '../lib/config.js';
import { COVER_SHAPES, DECOR_SHAPES, DECOR_SIZES, LEVER_SHAPES, PATTERNS, SECTION_TYPES } from '../data/seed.js';
import ProductPreview, { LeverIcon } from '../components/ProductPreview.jsx';
import { Opts, Swatches } from '../components/Options.jsx';
import Palette from '../components/Palette.jsx';
import { track } from '../lib/analytics.js';

// Line icons for the configurator headings (stroke = currentColor).
const ICONS = {
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 12.5l9 5 9-5M3 16.5l9 5 9-5',
  shape: 'M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4L12 2.8ZM4 7.4l8 4.6 8-4.6M12 12v9.2',
  sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  turn: 'M3 8h9v9H3zM12 12h9v9h-9zM8 3h9v5',
  pattern: 'M4 4h6v6H4zM14 14h6v6h-6zM14 4h6v6h-6zM4 14h6v6H4z',
  drop: 'M12 3s7 7.2 7 12a7 7 0 0 1-14 0c0-4.8 7-12 7-12Z',
  lever: 'M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5ZM10.5 7.5h3v9h-3z',
  reset: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5'
};
const Icon = ({ name }) => <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[name]} /></svg>;
const Head = ({ icon, children }) => <span className="field__label field__label--head"><Icon name={icon} />{children}</span>;

export default function Product() {
  const t = useT();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { products, combos, colors, pricing } = useCatalog();
  const cart = useCart();
  const product = products.find(p => p.slug === slug);
  // The design lives in the URL (see configToQuery), so a reload or a shared link opens the same design.
  // Read the URL only when the product or catalog changes; the config writes back to it below.
  const start = useMemo(() => {
    if (!product) return null;
    const c = initialConfig(product, combos, params.get('combo'));
    return configFromQuery(params, c, colors);
  }, [product, combos, colors]); // eslint-disable-line react-hooks/exhaustive-deps
  const [cfg, setCfg] = useState(start);
  const [tab, setTab] = useState('shape');
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => { setCfg(start); setTab('shape'); setQty(1); }, [start]);
  useEffect(() => {
    if (!cfg) return;
    const next = new URLSearchParams(configToQuery(cfg)).toString();
    if (next !== params.toString()) setParams(next, { replace: true, preventScrollReset: true });
  }, [cfg]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product || !cfg) return <section className="page-pad wrap"><h1 className="h1">{t('p.notFound')}</h1><Link className="btn btn--ink" to={t.path('/catalog')}>{t('p.back')}</Link></section>;

  const cover = cfg.kind === 'cover';
  const set = patch => setCfg(c => ({ ...c, ...patch }));
  // Every configurator click is sent to Google Analytics as `configurator_option` (option + value).
  const log = (option, value) => track('configurator_option', { option, value: String(value), product: product.slug, kind: cfg.kind });
  const setColor = (k, v) => setCfg(c => ({ ...c, colors: { ...c.colors, [k]: v } }));
  const price = priceOf(cfg, pricing), code = configCode(cfg);
  const activeCombo = combos.find(c => c.base === cfg.colors.base && c.pattern === cfg.colors.pattern && c.accent === cfg.colors.accent);
  const hex = id => colors.find(c => c.id === id)?.hex;
  const mini = shape => <ProductPreview className="opt__icon" config={{ kind: 'cover', sections: 1, slots: ['blank'], shape, orientation: 'h', pattern: 'plain', colors: { ...cfg.colors, base: light(hex(cfg.colors.base)) ? '#2D3A6A' : cfg.colors.base } }} />;
  const decorMini = shape => <ProductPreview className="opt__icon" config={{ kind: cfg.kind, shape, pattern: 'plain', colors: cfg.colors }} />;

  const add = () => {
    cart.add({ slug: product.slug, config: cfg, code, price, qty });
    track('add_to_cart', { currency: 'AMD', value: price * qty, items: [{ item_id: product.slug, item_name: product.name?.en || product.slug, item_variant: code, item_category: product.category, price, quantity: qty }] });
    setAdded(true); setTimeout(() => setAdded(false), 1800);
    cart.setOpen(true);
  };
  const copy = async () => {
    track('copy_design_code', { product: product.slug });
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  const tabs = [['shape', t('p.tab.shape')], ['pattern', t('p.tab.pattern')], ['colors', t('p.tab.colors')], ...(cover ? [['levers', t('p.tab.levers')]] : [])];
  // Topper icons use the key color, or the cover color when the key color is too pale to see on a tile.
  const light = h => { const n = parseInt((h || '#000').slice(1), 16); return (0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255)) > 200; };
  const leverInk = light(hex(cfg.colors.accent)) ? (light(hex(cfg.colors.base)) ? '#2D3A6A' : hex(cfg.colors.base)) : hex(cfg.colors.accent);
  // [section, key] for every switch key on the cover
  const keyList = cover ? cfg.slots.slice(0, cfg.sections).flatMap((slot, i) => Array.from({ length: keysIn(slot) }, (_, j) => [i, j])) : [];
  const setLevers = fn => setCfg(c => ({ ...c, levers: normLevers(c.levers).map((row, i) => row.map((v, j) => fn(i, j, v))) }));
  const leverOpts = LEVER_SHAPES.map(l => ({ id: l.id, label: t.pick(l.name), icon: <LeverIcon className="opt__icon" id={l.id} fill={leverInk} /> }));

  return (
    <section className="product page-pad">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to={t.path('/catalog')}>{t('p.back')}</Link><span aria-hidden="true">/</span><span>{t.pick(product.name)}</span></nav>
        <div className="product__grid">
          <div className="product__stage">
            <div className="stage stage--neutral">
              <ProductPreview config={cfg} className="stage__img" title={t.pick(product.name)} realistic />
            </div>
            <div className="combos">
              <span className="field__label">{t('p.combos')}</span>
              <div className="combos__row palettes">
                {combos.map(c => (
                  <button key={c.id} className={`pal${activeCombo?.id === c.id ? ' on' : ''}`} aria-pressed={activeCombo?.id === c.id}
                    onClick={() => { log('color_pair', c.id); set({ colors: { base: c.base, pattern: c.pattern, accent: c.accent } }); }}>
                    <Palette colors={[hex(c.base), hex(c.pattern), hex(c.accent)]} />
                    <span className="pal__name">{t.pick(c.name)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="product__side">
            <h1 className="h1 product__title">{t.pick(product.name)}</h1>
            <p className="lede">{t.pick(product.blurb)}</p>

            <div className="panel">
              <div className="tabs" role="tablist">
                {tabs.map(([id, label], i) => <button key={id} role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' on' : ''}`} onClick={() => { track('configurator_tab', { tab: id, product: product.slug }); setTab(id); }}><span className="tab__no" aria-hidden="true">{i + 1}</span>{label}</button>)}
              </div>

              {tab === 'shape' && cover && <div className="tabpanel">
                <div className="field"><Head icon="layers">{t('p.sections')}</Head>
                  <Opts className="opts--seg" label={t('p.sections')} value={cfg.sections} onChange={n => { log('sections', n); set({ sections: n }); }}
                    options={[1, 2, 3, 4].map(n => ({ id: n, label: n === 1 ? t('p.section1') : t('p.sectionN', { n }) }))} /></div>
                <div className="field"><Head icon="shape">{t('p.shape')}</Head>
                  <Opts className="opts--tiles" label={t('p.shape')} value={cfg.shape} onChange={s => { log('shape', s); set({ shape: s }); }}
                    options={COVER_SHAPES.map(s => ({ id: s.id, label: t.pick(s.name), icon: mini(s.id) }))} /></div>
                {Array.from({ length: cfg.sections }, (_, i) => (
                  <div className="field field--card" key={i}><Head icon="sliders">{t('p.sectionLabel', { n: i + 1 })}</Head>
                    <Opts className="opts--seg" label={t('p.sectionLabel', { n: i + 1 })} value={cfg.slots[i]} onChange={v => { log(`section_${i + 1}`, v); set({ slots: cfg.slots.map((s, j) => j === i ? v : s) }); }}
                      options={SECTION_TYPES.map(s => ({ id: s.id, label: t.pick(s.name) }))} /></div>
                ))}
                {cfg.sections > 1 && <div className="field"><Head icon="turn">{t('p.orientation')}</Head>
                  <Opts className="opts--seg opts--narrow" label={t('p.orientation')} value={cfg.orientation} onChange={v => { log('orientation', v); set({ orientation: v }); }}
                    options={[{ id: 'h', label: t('p.h'), icon: <span className="orient orient--h" aria-hidden="true"><i /><i /></span> }, { id: 'v', label: t('p.v'), icon: <span className="orient orient--v" aria-hidden="true"><i /><i /></span> }]} /></div>}
              </div>}

              {tab === 'shape' && !cover && <div className="tabpanel">
                <div className="field"><Head icon="shape">{t('p.shape')}</Head>
                  <Opts className="opts--tiles" label={t('p.shape')} value={cfg.shape} onChange={s => { log('shape', s); set({ shape: s }); }}
                    options={(DECOR_SHAPES[cfg.kind] || []).map(s => ({ id: s.id, label: t.pick(s.name), icon: decorMini(s.id) }))} /></div>
                <div className="field"><Head icon="layers">{t('p.size')}</Head>
                  <Opts className="opts--seg" label={t('p.size')} value={cfg.size} onChange={s => { log('size', s); set({ size: s }); }}
                    options={(DECOR_SIZES[cfg.kind] || []).map(s => ({ id: s.id, label: `${s.id.toUpperCase()} · ${s.dims}` }))} /></div>
              </div>}

              {tab === 'pattern' && <div className="tabpanel">
                <div className="field"><Head icon="pattern">{t('p.pattern')}</Head>
                  <Opts className="opts--tiles opts--grid4" label={t('p.pattern')} value={cfg.pattern} onChange={p => { log('pattern', p); set({ pattern: p }); }}
                    options={PATTERNS.map(p => ({ id: p.id, label: t.pick(p.name), icon: <ProductPreview className="opt__icon" config={{ ...cfg, ...(cover ? { sections: 1, slots: ['blank'], shape: 'square' } : {}), pattern: p.id }} /> }))} /></div>
              </div>}

              {tab === 'colors' && <div className="tabpanel">
                <Swatches label={t('p.base')} value={cfg.colors.base} onChange={v => { log('color_base', v); setColor('base', v); }} />
                {cfg.pattern !== 'plain' && <Swatches label={t('p.patColor')} value={cfg.colors.pattern} onChange={v => { log('color_pattern', v); setColor('pattern', v); }} />}
                <Swatches label={t(`p.accent.${cfg.kind}`)} value={cfg.colors.accent} onChange={v => { log('color_accent', v); setColor('accent', v); }} />
              </div>}

              {tab === 'levers' && cover && <div className="tabpanel">
                <p className="small">{t('p.leversNote', { price: formatAMD(pricing.lever || 0, t.lang) })}</p>
                {!keyList.length && <p className="small">{t('p.leversNone')}</p>}
                {keyList.map(([i, j], idx) => (
                  <div className="field field--card" key={`${i}-${j}`}><Head icon="lever">{t('p.leverLabel', { s: i + 1, k: j + 1 })}</Head>
                    <Opts className="opts--tiles opts--levers" label={t('p.leverLabel', { s: i + 1, k: j + 1 })} value={normLevers(cfg.levers)[i][j]}
                      onChange={v => { log(`lever_s${i + 1}_k${j + 1}`, v); setLevers((a, b, old) => a === i && b === j ? v : old); }} options={leverOpts} />
                    {idx === 0 && keyList.length > 1 && <button type="button" className="lever-all" onClick={() => { const v = normLevers(cfg.levers)[i][j]; log('lever_all', v); setLevers(() => v); }}>{t('p.leverAll')}</button>}
                  </div>
                ))}
              </div>}

              <div className="panel__foot">
                <div className="buy__price"><b>{formatAMD(price, t.lang)}</b><span>{t('p.perItem')}</span></div>
                <button className="reset" onClick={() => { track('configurator_reset', { product: product.slug }); setCfg(initialConfig(product, combos)); }}><Icon name="reset" />{t('p.reset')}</button>
              </div>
            </div>

            <div className="buy">
              <div className="buy__row">
                <div className="qty qty--lg" aria-label={t('cart.qty')}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="−">−</button><span>{qty}</span><button onClick={() => setQty(q => q + 1)} aria-label="+">+</button>
                </div>
                <button className="btn btn--ink btn--wide" onClick={add}>{added ? t('p.added') : t('p.add')}</button>
              </div>
              <div className="code"><span className="field__label">{t('p.code')}</span><code>{code}</code><button onClick={copy}>{copied ? t('p.copied') : t('p.copy')}</button></div>
              {cover && <p className="small">{t('p.measure')} <Link to={t.path('/guide')}>{t('p.measureLink')} →</Link></p>}
            </div>

            <div className="details">
              <details open><summary>{t('p.about')}<span aria-hidden="true" /></summary><p>{t.pick(product.blurb)}</p></details>
              <details><summary>{t('p.material')}<span aria-hidden="true" /></summary><p>{t('p.materialText')}</p></details>
              <details><summary>{cover ? t('p.install') : t('p.decorInstall')}<span aria-hidden="true" /></summary><p>{cover ? t('p.installText') : t('p.decorInstallText')}</p></details>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
