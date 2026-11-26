import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { useCart } from '../cart.jsx';
import { configCode, fieldFor, formatAMD, initialConfig, keysIn, normLevers, priceOf } from '../lib/config.js';
import { COVER_SHAPES, DECOR_SHAPES, DECOR_SIZES, LEVER_SHAPES, PATTERNS, SECTION_TYPES } from '../data/seed.js';
import ProductPreview, { LeverIcon } from '../components/ProductPreview.jsx';
import { Opts, Swatches } from '../components/Options.jsx';

export default function Product() {
  const t = useT();
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { products, combos, colors, pricing } = useCatalog();
  const cart = useCart();
  const product = products.find(p => p.slug === slug);
  const comboParam = params.get('combo');
  const shapeParam = params.get('shape');
  const start = useMemo(() => {
    if (!product) return null;
    const c = initialConfig(product, combos, comboParam);
    return c.kind === 'cover' && COVER_SHAPES.some(s => s.id === shapeParam) ? { ...c, shape: shapeParam } : c;
  }, [product, combos, comboParam, shapeParam]);
  const [cfg, setCfg] = useState(start);
  const [tab, setTab] = useState('shape');
  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => { setCfg(start); setTab('shape'); setQty(1); }, [start]);

  if (!product || !cfg) return <section className="page-pad wrap"><h1 className="h1">{t('p.notFound')}</h1><Link className="btn btn--ink" to={t.path('/catalog')}>{t('p.back')}</Link></section>;

  const cover = cfg.kind === 'cover';
  const set = patch => setCfg(c => ({ ...c, ...patch }));
  const setColor = (k, v) => setCfg(c => ({ ...c, colors: { ...c.colors, [k]: v } }));
  const price = priceOf(cfg, pricing), code = configCode(cfg);
  const activeCombo = combos.find(c => c.base === cfg.colors.base && c.pattern === cfg.colors.pattern && c.accent === cfg.colors.accent);
  const hex = id => colors.find(c => c.id === id)?.hex;
  const mini = shape => <ProductPreview className="opt__icon" config={{ kind: 'cover', sections: 1, slots: ['blank'], shape, orientation: 'h', pattern: 'plain', colors: { ...cfg.colors, base: cfg.colors.base === 'ivory' ? 'mulberry' : cfg.colors.base } }} />;
  const decorMini = shape => <ProductPreview className="opt__icon" config={{ kind: cfg.kind, shape, pattern: 'plain', colors: cfg.colors }} />;

  const add = () => {
    cart.add({ slug: product.slug, config: cfg, code, price, qty });
    setAdded(true); setTimeout(() => setAdded(false), 1800);
    cart.setOpen(true);
  };
  const copy = async () => {
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
            <div className={`stage field--${fieldFor(cfg.colors.base, 'periwinkle')}`}>
              <ProductPreview config={cfg} className="stage__img" title={t.pick(product.name)} />
            </div>
            <div className="combos">
              <span className="field__label">{t('p.combos')}</span>
              <div className="combos__row">
                {combos.map(c => (
                  <button key={c.id} className={`combo${activeCombo?.id === c.id ? ' on' : ''}`} title={t.pick(c.name)} aria-label={t.pick(c.name)} aria-pressed={activeCombo?.id === c.id}
                    onClick={() => set({ colors: { base: c.base, pattern: c.pattern, accent: c.accent } })}>
                    <span style={{ '--a': hex(c.base), '--b': hex(c.pattern), '--c': hex(c.accent) }} />
                  </button>
                ))}
              </div>
              {activeCombo && <span className="combos__name">{t.pick(activeCombo.name)}</span>}
            </div>
          </div>

          <div className="product__side">
            <h1 className="h1 product__title">{t.pick(product.name)}</h1>
            <p className="lede">{t.pick(product.blurb)}</p>

            <div className="panel">
              <div className="tabs" role="tablist">
                {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={`tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}>{label}</button>)}
              </div>

              {tab === 'shape' && cover && <div className="tabpanel">
                <div className="field"><span className="field__label">{t('p.sections')}</span>
                  <Opts label={t('p.sections')} value={cfg.sections} onChange={n => set({ sections: n })}
                    options={[1, 2, 3, 4].map(n => ({ id: n, label: n === 1 ? t('p.section1') : t('p.sectionN', { n }) }))} /></div>
                <div className="field"><span className="field__label">{t('p.shape')}</span>
                  <Opts className="opts--tiles" label={t('p.shape')} value={cfg.shape} onChange={s => set({ shape: s })}
                    options={COVER_SHAPES.map(s => ({ id: s.id, label: t.pick(s.name), icon: mini(s.id) }))} /></div>
                {Array.from({ length: cfg.sections }, (_, i) => (
                  <div className="field" key={i}><span className="field__label">{t('p.sectionLabel', { n: i + 1 })}</span>
                    <Opts label={t('p.sectionLabel', { n: i + 1 })} value={cfg.slots[i]} onChange={v => set({ slots: cfg.slots.map((s, j) => j === i ? v : s) })}
                      options={SECTION_TYPES.map(s => ({ id: s.id, label: t.pick(s.name) }))} /></div>
                ))}
                {cfg.sections > 1 && <div className="seg" role="radiogroup" aria-label="Orientation">
                  {[['h', t('p.h')], ['v', t('p.v')]].map(([id, label]) => <button key={id} role="radio" aria-checked={cfg.orientation === id} className={cfg.orientation === id ? 'on' : ''} onClick={() => set({ orientation: id })}>{label}</button>)}
                </div>}
              </div>}

              {tab === 'shape' && !cover && <div className="tabpanel">
                <div className="field"><span className="field__label">{t('p.shape')}</span>
                  <Opts className="opts--tiles" label={t('p.shape')} value={cfg.shape} onChange={s => set({ shape: s })}
                    options={(DECOR_SHAPES[cfg.kind] || []).map(s => ({ id: s.id, label: t.pick(s.name), icon: decorMini(s.id) }))} /></div>
                <div className="field"><span className="field__label">{t('p.size')}</span>
                  <Opts label={t('p.size')} value={cfg.size} onChange={s => set({ size: s })}
                    options={(DECOR_SIZES[cfg.kind] || []).map(s => ({ id: s.id, label: `${s.id.toUpperCase()} · ${s.dims}` }))} /></div>
              </div>}

              {tab === 'pattern' && <div className="tabpanel">
                <div className="field"><span className="field__label">{t('p.pattern')}</span>
                  <Opts className="opts--tiles" label={t('p.pattern')} value={cfg.pattern} onChange={p => set({ pattern: p })}
                    options={PATTERNS.map(p => ({ id: p.id, label: t.pick(p.name), icon: <ProductPreview className="opt__icon" config={{ ...cfg, ...(cover ? { sections: 1, slots: ['blank'], shape: 'square' } : {}), pattern: p.id }} /> }))} /></div>
              </div>}

              {tab === 'colors' && <div className="tabpanel">
                <Swatches label={t('p.base')} value={cfg.colors.base} onChange={v => setColor('base', v)} />
                {cfg.pattern !== 'plain' && <Swatches label={t('p.patColor')} value={cfg.colors.pattern} onChange={v => setColor('pattern', v)} />}
                <Swatches label={t(`p.accent.${cfg.kind}`)} value={cfg.colors.accent} onChange={v => setColor('accent', v)} />
              </div>}

              {tab === 'levers' && cover && <div className="tabpanel">
                <p className="small">{t('p.leversNote', { price: formatAMD(pricing.lever || 0, t.lang) })}</p>
                {!keyList.length && <p className="small">{t('p.leversNone')}</p>}
                {keyList.map(([i, j], idx) => (
                  <div className="field" key={`${i}-${j}`}><span className="field__label">{t('p.leverLabel', { s: i + 1, k: j + 1 })}</span>
                    <Opts className="opts--tiles opts--levers" label={t('p.leverLabel', { s: i + 1, k: j + 1 })} value={normLevers(cfg.levers)[i][j]}
                      onChange={v => setLevers((a, b, old) => a === i && b === j ? v : old)} options={leverOpts} />
                    {idx === 0 && keyList.length > 1 && <button type="button" className="lever-all" onClick={() => { const v = normLevers(cfg.levers)[i][j]; setLevers(() => v); }}>{t('p.leverAll')}</button>}
                  </div>
                ))}
              </div>}

              <button className="reset" onClick={() => setCfg(start)}>{t('p.reset')}</button>
            </div>

            <div className="buy">
              <div className="buy__price"><b>{formatAMD(price, t.lang)}</b><span>{t('p.perItem')}</span></div>
              <div className="buy__row">
                <div className="qty qty--lg" aria-label={t('cart.qty')}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="−">−</button><span>{qty}</span><button onClick={() => setQty(q => q + 1)} aria-label="+">+</button>
                </div>
                <button className="btn btn--ink btn--wide" onClick={add}>{added ? t('p.added') : `${t('p.add')} · ${formatAMD(price * qty, t.lang)}`}</button>
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
