import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { fieldFor, formatAMD, fromPrice, initialConfig } from '../lib/config.js';
import ProductPreview from './ProductPreview.jsx';
import { ArrowDot } from './Decor.jsx';

const FRAMES = ['mint', 'petal', 'periwinkle', 'butter', 'lilac', 'petal'];
const MARKS = ['moon', 'blob', 'pill', 'ring'];

export default function ProductCard({ product, index = 0 }) {
  const t = useT();
  const { combos, pricing } = useCatalog();
  const cfg = initialConfig(product, combos);
  const frame = fieldFor(cfg.colors.base, FRAMES[index % FRAMES.length]);
  return (
    <Link to={t.path(`/product/${product.slug}`)} className="card reveal" style={{ '--d': `${(index % 4) * 70}ms` }}>
      <div className={`card__stage field--${frame}`}>
        <span className={`card__mark card__mark--${MARKS[index % MARKS.length]}`} aria-hidden="true" />
        <div className="card__inner"><ProductPreview config={cfg} className="card__img" title={t.pick(product.name)} /></div>
        <ArrowDot />
      </div>
      <div className="card__body">
        <h3>{t.pick(product.name)}</h3>
        <p className="card__price">{t('card.from', { p: formatAMD(fromPrice(product, combos, pricing), t.lang) })}</p>
      </div>
    </Link>
  );
}
