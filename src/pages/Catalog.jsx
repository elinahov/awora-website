import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { useReveal } from '../lib/motion.js';
import ProductCard from '../components/ProductCard.jsx';
import Living from '../components/Living.jsx';

const coverType = p => {
  const s = p.defaults.slots || [];
  const sockets = s.filter(x => x === 'socket').length;
  return sockets === 0 ? 'switch' : sockets === s.length ? 'socket' : 'mixed';
};

const CAT_FLIGHTS = [
  { anchor: '.catalog', img: '/brand/shape-coral.png', w: 120, ar: 350 / 229, pts: [[0, 108, 70], [.3, 95, 40], [.7, 97, 20], [1, 110, -10]] },
  { anchor: '.catalog', shape: 'blobB', fill: '#B9C8EE', w: 80, pts: [[.2, -10, 90], [.5, 3, 60], [.85, 2, 26], [1, -12, 6]] }
];

function Chips({ label, value, options, onChange }) {
  return (
    <div className="filter">
      <span className="filter__label">{label}</span>
      <div className="chips" role="group" aria-label={label}>
        {options.map(o => (
          <button key={o.id} className={`chip${value === o.id ? ' on' : ''}`} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
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
    (f.sections === 'any' || (p.kind === 'cover' && String(p.defaults.sections) === f.sections)) &&
    (f.type === 'any' || (p.kind === 'cover' && coverType(p) === f.type))
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
        <div className="filters">
          <Chips label={t('cat.category')} value={f.category} onChange={v => set('category', v)}
            options={[{ id: 'all', label: t('cat.all') }, { id: 'cover', label: t('cat.covers') }, { id: 'decor', label: t('cat.decor') }]} />
          <Chips label={t('cat.collection')} value={f.collection} onChange={v => set('collection', v)}
            options={[{ id: 'all', label: t('cat.all') }, ...collections.map(c => ({ id: c.id, label: t.pick(c.name) }))]} />
          {showCoverFilters && <Chips label={t('cat.sections')} value={f.sections} onChange={v => set('sections', v)}
            options={[{ id: 'any', label: t('cat.any') }, ...['1', '2', '3', '4'].map(n => ({ id: n, label: n }))]} />}
          {showCoverFilters && <Chips label={t('cat.type')} value={f.type} onChange={v => set('type', v)}
            options={[{ id: 'any', label: t('cat.any') }, { id: 'switch', label: t('cat.type.switch') }, { id: 'socket', label: t('cat.type.socket') }, { id: 'mixed', label: t('cat.type.mixed') }]} />}
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
