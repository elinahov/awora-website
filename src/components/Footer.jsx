import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { contactLinks } from '../site.js';
import { AWMark } from './Logo.jsx';
import { wave } from './Decor.jsx';

export default function Footer() {
  const t = useT();
  const links = contactLinks();
  const ribbon = wave(10, 70, 590, 70, 2, 26, 16);
  return (
    <footer className="footer">
      <div className="wrap footer__in">
        <div className="footer__brand">
          <AWMark className="footer__aw" />
          <svg className="footer__ribbon" viewBox="0 0 600 140" aria-hidden="true">
            <path d={ribbon} fill="none" stroke="#F3BDD0" strokeWidth="58" strokeLinecap="round" />
            <defs><path id="footRibbon" d={ribbon} /></defs>
            <text><textPath href="#footRibbon" startOffset="50%" textAnchor="middle" dominantBaseline="central">OBJECTS FOR HAPPY SPACES</textPath></text>
          </svg>
        </div>
        <nav className="footer__col" aria-label={t('footer.shop')}>
          <h3>{t('footer.shop')}</h3>
          <Link to={t.path('/catalog?category=cover')}>{t('cat.covers')}</Link>
          <Link to={t.path('/catalog?category=decor')}>{t('cat.decor')}</Link>
          <Link to={t.path('/product/cookie-duo')}>{t('nav.build')}</Link>
        </nav>
        <nav className="footer__col" aria-label={t('footer.info')}>
          <h3>{t('footer.info')}</h3>
          <Link to={t.path('/guide')}>{t('nav.guide')}</Link>
          <Link to={{ pathname: `/${t.lang}`, hash: '#colors' }}>{t('nav.colors')}</Link>
          <Link to={{ pathname: `/${t.lang}`, hash: '#faq' }}>{t('nav.faq')}</Link>
        </nav>
        <div className="footer__col">
          <h3>{t('footer.connect')}</h3>
          {links.length ? links.map(c => <a key={c.id} href={c.href} target={c.id === 'email' ? undefined : '_blank'} rel="noreferrer">{c.label}</a>) : <span>{t('footer.soon')}</span>}
        </div>
        <p className="footer__small">© {new Date().getFullYear()} Awora · {t('footer.tag')} · {t('footer.rights')}</p>
      </div>
    </footer>
  );
}
