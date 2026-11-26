import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCart } from '../cart.jsx';
import { useAuth } from '../lib/auth.jsx';
import { Wordmark } from './Logo.jsx';

export default function Nav() {
  const t = useT();
  const { count, setOpen } = useCart();
  const auth = useAuth();
  const { pathname, search, hash } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(scrollY > 24);
    on(); addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  useEffect(() => setMenu(false), [pathname, hash]);
  useEffect(() => { document.body.classList.toggle('menu-open', menu); }, [menu]);

  const other = t.lang === 'hy' ? 'en' : 'hy';
  const swap = pathname.replace(/^\/(hy|en)/, `/${other}`) + search + hash;
  const home = `/${t.lang}`;
  const links = [
    { to: t.path('/catalog'), label: t('nav.catalog'), nav: true },
    { to: { pathname: home, hash: '#colors' }, label: t('nav.colors') },
    { to: t.path('/guide'), label: t('nav.guide'), nav: true },
    { to: { pathname: home, hash: '#faq' }, label: t('nav.faq') }
  ];

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${menu ? ' is-open' : ''}`}>
      <div className="announce" aria-label="Announcements">
        <div className="announce__track">
          {[0, 1].map(k => <span key={k} aria-hidden={k > 0 || undefined}>{[1, 2, 3].map(i => <span key={i}>{t(`bar.${i}`)}</span>)}</span>)}
        </div>
      </div>
      <div className="nav__in">
        <Link to={home} className="nav__logo" aria-label="Awora home"><Wordmark /></Link>
        <nav className="nav__links" aria-label="Main">
          {links.map(l => l.nav
            ? <NavLink key={l.label} to={l.to}>{l.label}</NavLink>
            : <Link key={l.label} to={l.to}>{l.label}</Link>)}
        </nav>
        <div className="nav__right">
          <Link className="nav__lang" to={swap} hrefLang={other} lang={other}>{other.toUpperCase()}</Link>
          {auth.available && (
            <Link className="nav__cart nav__acc" to={t.path(auth.isAdmin ? '/admin' : '/account')} aria-label={auth.isAdmin ? t('nav.admin') : t('nav.account')} title={auth.isAdmin ? t('nav.admin') : t('nav.account')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.9-3.6 3.7-5.6 7.2-5.6s6.3 2 7.2 5.6" /></svg>
              {auth.user && <i className={auth.isAdmin ? 'is-admin' : ''} />}
            </Link>
          )}
          <button className="nav__cart" onClick={() => setOpen(true)} aria-label={`${t('nav.cart')} (${count})`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
            {count > 0 && <b>{count}</b>}
          </button>
          <Link className="btn btn--ink nav__cta magnet" to={t.path('/product/clover-duo')}>{t('nav.build')}</Link>
          <button className="nav__burger" onClick={() => setMenu(m => !m)} aria-expanded={menu} aria-label={menu ? t('nav.close') : t('nav.menu')}><i /><i /></button>
        </div>
      </div>
      <div className="nav__sheet" hidden={!menu}>
        {links.map(l => <Link key={l.label} to={l.to}>{l.label}</Link>)}
        <Link to={t.path('/product/clover-duo')}>{t('nav.build')}</Link>
        {auth.available && <Link to={t.path('/account')}>{t('nav.account')}</Link>}
        {auth.isAdmin && <Link to={t.path('/admin')}>{t('nav.admin')}</Link>}
        <Link to={swap} className="nav__sheet-lang">{t('nav.lang')}</Link>
      </div>
    </header>
  );
}
