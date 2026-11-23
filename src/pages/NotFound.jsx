import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';

export default function NotFound() {
  const t = useT();
  return (
    <section className="page-pad wrap nf">
      <h1 className="h1">{t('nf.title')}</h1>
      <Link className="btn btn--ink" to={t.path('/')}>{t('nf.cta')}</Link>
    </section>
  );
}
