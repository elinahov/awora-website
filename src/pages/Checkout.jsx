import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCart } from '../cart.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { formatAMD, priceOf } from '../lib/config.js';
import { Input, Msg } from '../components/Form.jsx';
import ProductPreview from '../components/ProductPreview.jsx';

const EMPTY = { name: '', phone: '', email: '', city: '', address: '', note: '' };

export default function Checkout() {
  const t = useT();
  const cart = useCart();
  const auth = useAuth();
  const { products, pricing } = useCatalog();
  const [f, setF] = useState(EMPTY);
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  // prefill from the account
  useEffect(() => {
    if (!auth?.user) return;
    const p = auth.profile || {};
    setF(v => ({
      ...v, email: v.email || auth.user.email || '',
      name: v.name || p.name || '', phone: v.phone || p.phone || '', city: v.city || p.city || '', address: v.address || p.address || ''
    }));
  }, [auth?.user, auth?.profile]);

  const bind = k => ({ value: f[k], onChange: e => setF(v => ({ ...v, [k]: e.target.value })) });
  // show current prices (the server recomputes them anyway)
  const lines = cart.items.map(i => ({ ...i, price: priceOf(i.config, pricing), product: products.find(p => p.slug === i.slug) }));
  const total = lines.reduce((n, l) => n + l.price * l.qty, 0);

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth?.session?.access_token) headers.Authorization = `Bearer ${auth.session.access_token}`;
      const r = await fetch('/api/order', {
        method: 'POST', headers,
        body: JSON.stringify({ customer: f, lang: t.lang, website: hp, items: cart.items.map(i => ({ slug: i.slug, config: i.config, qty: i.qty })) })
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(r.status === 503 ? t('co.unavailable') : body.error || t('auth.err.generic'));
      setDone(body.number);
      cart.clear();
      scrollTo(0, 0);
    } catch (e2) {
      setErr(e2.message === 'Failed to fetch' ? t('auth.err.generic') : e2.message);
    } finally { setBusy(false); }
  };

  if (done !== null) return (
    <section className="page-pad">
      <div className="wrap narrow thanks">
        <h1 className="h1">{t('co.thanks', { n: done })}</h1>
        <p className="lede">{t('co.thanksText')}</p>
        <div className="acc__actions">
          {auth?.user && <Link className="btn btn--ink" to={t.path('/account')}>{t('co.track')}</Link>}
          <Link className="btn btn--line" to={t.path('/catalog')}>{t('co.more')}</Link>
        </div>
      </div>
    </section>
  );

  return (
    <section className="page-pad checkout">
      <div className="wrap">
        <h1 className="h1">{t('co.title')}</h1>
        <p className="lede">{t('co.lede')}</p>
        {cart.items.length === 0
          ? <div className="checkout__empty"><p>{t('cart.empty')}</p><Link className="btn btn--ink" to={t.path('/catalog')}>{t('nav.catalog')}</Link></div>
          : <div className="checkout__grid">
            <form className="form" onSubmit={submit}>
              {auth?.available && !auth.user && <p className="small">{t('co.signin')} <Link to={t.path('/account')}>{t('co.signinLink')}</Link></p>}
              <fieldset><legend className="h3">{t('co.contact')}</legend>
                <div className="form__grid">
                  <Input label={t('f.name')} required autoComplete="name" maxLength={120} {...bind('name')} />
                  <Input label={t('f.phone')} required type="tel" autoComplete="tel" maxLength={40} placeholder="+374" {...bind('phone')} />
                  <Input className="span2" label={t('f.email')} required type="email" autoComplete="email" maxLength={160} {...bind('email')} />
                </div>
              </fieldset>
              <fieldset><legend className="h3">{t('co.delivery')}</legend>
                <div className="form__grid">
                  <Input label={t('f.city')} required autoComplete="address-level2" maxLength={80} {...bind('city')} />
                  <Input label={t('f.address')} required autoComplete="street-address" maxLength={300} {...bind('address')} />
                  <Input className="span2" label={t('f.note')} textarea rows={3} maxLength={1000} {...bind('note')} />
                </div>
              </fieldset>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={hp} onChange={e => setHp(e.target.value)} />
              <Msg kind="error">{err}</Msg>
              <button className="btn btn--ink" disabled={busy}>{busy ? t('co.sending') : `${t('co.place')} · ${formatAMD(total, t.lang)}`}</button>
            </form>

            <aside className="card-box summary">
              <h2 className="h3">{t('co.summary')}</h2>
              <ul className="summary__list">
                {lines.map(l => (
                  <li key={l.id}>
                    <div className="line__img"><ProductPreview config={l.config} /></div>
                    <div><b>{l.product ? t.pick(l.product.name) : l.slug}</b><code>{l.code}</code><span className="small">× {l.qty}</span></div>
                    <span>{formatAMD(l.price * l.qty, t.lang)}</span>
                  </li>
                ))}
              </ul>
              <div className="drawer__total"><span>{t('cart.total')}</span><b>{formatAMD(total, t.lang)}</b></div>
            </aside>
          </div>}
      </div>
    </section>
  );
}
