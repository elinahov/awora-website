import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { useReveal } from '../lib/motion.js';
import ProductCard from '../components/ProductCard.jsx';
import { isPlate } from '../lib/config.js';
import Living from '../components/Living.jsx';

const coverType = p => {
  const s = p.defaults.slots || [];
  const sockets = s.filter(x => x === 'socket').length;
  return sockets === 0 ? 'switch' : sockets === s.length ? 'socket' : 'mixed';
};

const CAT_FLIGHTS = [
  { anchor: '.catalog', obj: 'airballoon', pair: ['#A9B5CD', '#DDA9AE'], w: 110, pts: [[0, 108, 70], [.3, 95, 40], [.7, 97, 20], [1, 110, -10]] },
  { anchor: '.catalog', obj: 'butterfly', pair: ['#B9C6A2', '#526B9B'], w: 80, pts: [[.2, -10, 90], [.5, 3, 60], [.85, 2, 26], [1, -12, 6]] }
];

// Tiny flat icons for the filter chips (currentColor).
const Ico = {
  all: <svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="3" /><circle cx="12" cy="12" r="3" /><circle cx="18" cy="12" r="3" /></svg>,
  cover: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5" /><rect x="10.3" y="8" width="3.4" height="8" rx="1.7" fill="var(--chip-bg)" /></svg>,
  decor: <svg viewBox="0 0 24 24"><path d="M4 13C3 7 9 3 13 5s7 1 7 6-4 9-9 8-6-3-7-6Z" /></svg>,
  outline: <svg viewBox="0 0 24 24"><path fillRule="evenodd" d="M8 2.5h8A5.5 5.5 0 0 1 21.5 8v8a5.5 5.5 0 0 1-5.5 5.5H8A5.5 5.5 0 0 1 2.5 16V8A5.5 5.5 0 0 1 8 2.5ZM8.5 7.5h7a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" /></svg>,
  switch: <svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18" rx="4" /><rect x="10" y="6" width="4" height="6" rx="2" fill="var(--chip-bg)" /></svg>,
  socket: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><circle cx="8.5" cy="12" r="1.8" fill="var(--chip-bg)" /><circle cx="15.5" cy="12" r="1.8" fill="var(--chip-bg)" /></svg>,
  mixed: <svg viewBox="0 0 24 24"><rect x="2" y="6" width="7" height="12" rx="3.5" /><circle cx="16.5" cy="12" r="5.5" /></svg>
};
const Dots = ({ n }) => <span className="chip__dots" aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} />)}</span>;

function Chips({ label, value, options, onChange, tone, className = '' }) {
  return (
    <div className={`filter filter--${tone} ${className}`}>
      <span className="filter__label">{label}</span>
      <div className="chips" role="group" aria-label={label}>
        {options.map(o => (
          <button key={o.id} className={`chip${value === o.id ? ' on' : ''}`} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.icon && <span className="chip__icon" aria-hidden="true">{o.icon}</span>}<span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Catalog() {
  const t = useT();
  const { products, collections } = useCatalog();
  const [params, setParams] = useSearchParams();
  const f = { category: params.get('category') || 'all', collection: params.get('collection') || 'all', sections: params.get('sections') || 'any', type: params.get('type') || 'any' };
  const set = (k, v) => {
    const next = new URLSearchParams(params);
    if (v === 'all' || v === 'any') next.delete(k); else next.set(k, v);
    if (k === 'category' && v === 'decor') { next.delete('sections'); next.delete('type'); }
    setParams(next, { replace: true });
  };

  const list = useMemo(() => products.filter(p =>
    (f.category === 'all' || p.category === f.category) &&
    (f.collection === 'all' || p.collection === f.collection) &&
    (f.sections === 'any' || (isPlate(p.kind) && String(p.defaults.sections) === f.sections)) &&
    (f.type === 'any' || (isPlate(p.kind) && coverType(p) === f.type))
  ), [products, f.category, f.collection, f.sections, f.type]);

  useReveal([t.lang, list.length, f.category, f.collection, f.sections, f.type]);
  const showCoverFilters = f.category !== 'decor';

  return (
    <section className="catalog page-pad">
      <div className="wrap">
        <header className="page-head">
          <h1 className="h1">{t('cat.title')}</h1>
          <p className="lede">{t('cat.lede')}</p>
        </header>
        <div className={`filters${showCoverFilters ? '' : ' filters--decor'}`}>
          <Chips tone="petal" className="filter--category" label={t('cat.category')} value={f.category} onChange={v => set('category', v)}
            options={[{ id: 'all', label: t('cat.all'), icon: Ico.all }, { id: 'cover', label: t('cat.covers'), icon: Ico.cover }, { id: 'outline', label: t('cat.outlines'), icon: Ico.outline }, { id: 'decor', label: t('cat.decor'), icon: Ico.decor }]} />
          {showCoverFilters && <Chips tone="butter" className="filter--sections" label={t('cat.sections')} value={f.sections} onChange={v => set('sections', v)}
            options={[{ id: 'any', label: t('cat.any') }, ...['1', '2', '3', '4'].map(n => ({ id: n, label: n, icon: <Dots n={+n} /> }))]} />}
          {showCoverFilters && <Chips tone="mint" className="filter--type" label={t('cat.type')} value={f.type} onChange={v => set('type', v)}
            options={[{ id: 'any', label: t('cat.any') }, { id: 'switch', label: t('cat.type.switch'), icon: Ico.switch }, { id: 'socket', label: t('cat.type.socket'), icon: Ico.socket }, { id: 'mixed', label: t('cat.type.mixed'), icon: Ico.mixed }]} />}
          <Chips tone="periwinkle" className="filter--collection" label={t('cat.collection')} value={f.collection} onChange={v => set('collection', v)}
            options={[{ id: 'all', label: t('cat.all'), icon: Ico.all }, ...collections.map(c => ({ id: c.id, label: t.pick(c.name), icon: <i className="chip__swatch" style={{ background: `var(--${c.color})` }} /> }))]} />
          {list.length !== products.length && <button className="filters__clear" onClick={() => setParams({}, { replace: true })}>{t('cat.reset')}</button>}
        </div>
        <p className="count">{t('cat.count', { n: list.length })}</p>
        {list.length
          ? <div className="grid">{list.map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}</div>
          : <div className="empty"><p>{t('cat.empty')}</p><button className="btn btn--line" onClick={() => setParams({}, { replace: true })}>{t('cat.reset')}</button></div>}
      </div>
      <Living flights={CAT_FLIGHTS} quiet=".grid, .filters" />
    </section>
  );
}
