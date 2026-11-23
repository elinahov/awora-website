import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCart } from '../cart.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { formatAMD, priceOf } from '../lib/config.js';
import ProductPreview from './ProductPreview.jsx';

export default function CartDrawer() {
  const t = useT();
  const { products, pricing } = useCatalog();
  const { items, setQty, remove, open, setOpen } = useCart();
  // live prices, in case the admin changed them since the item was added
  const priced = items.map(i => ({ ...i, price: priceOf(i.config, pricing) }));
  const total = priced.reduce((n, i) => n + i.qty * i.price, 0);
  const navigate = useNavigate();
  useEffect(() => {
    const on = e => { if (e.key === 'Escape') setOpen(false); };
    addEventListener('keydown', on); return () => removeEventListener('keydown', on);
  }, [setOpen]);
  useEffect(() => { document.body.classList.toggle('no-scroll', open); }, [open]);

  return (
    <>
      <div className={`scrim${open ? ' on' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`drawer${open ? ' on' : ''}`} aria-hidden={!open} aria-label={t('cart.title')}>
        <div className="drawer__head">
          <h2>{t('cart.title')}</h2>
          <button className="x" onClick={() => setOpen(false)} aria-label={t('nav.close')}>×</button>
        </div>
        {items.length === 0
          ? <div className="drawer__empty"><p>{t('cart.empty')}</p><Link className="btn btn--ink" to={t.path('/catalog')} onClick={() => setOpen(false)}>{t('nav.catalog')}</Link></div>
          : <>
            <ul className="drawer__list">
              {priced.map(i => {
                const p = products.find(x => x.slug === i.slug);
                return (
                  <li key={i.id} className="line">
                    <div className="line__img"><ProductPreview config={i.config} /></div>
                    <div className="line__body">
                      <Link to={t.path(`/product/${i.slug}`)} onClick={() => setOpen(false)}><b>{p ? t.pick(p.name) : i.slug}</b></Link>
                      <code>{i.code}</code>
                      <div className="line__row">
                        <div className="qty" aria-label={t('cart.qty')}>
                          <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="−">−</button><span>{i.qty}</span><button onClick={() => setQty(i.id, i.qty + 1)} aria-label="+">+</button>
                        </div>
                        <span>{formatAMD(i.price * i.qty, t.lang)}</span>
                      </div>
                      <button className="line__rm" onClick={() => remove(i.id)}>{t('cart.remove')}</button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__total"><span>{t('cart.total')}</span><b>{formatAMD(total, t.lang)}</b></div>
              <button className="btn btn--ink btn--wide" onClick={() => { setOpen(false); navigate(t.path('/checkout')); }}>{t('cart.checkout')}</button>
            </div>
          </>}
      </aside>

    </>
  );
}
