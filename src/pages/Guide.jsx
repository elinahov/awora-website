import { useT } from '../i18n.jsx';
import { useReveal } from '../lib/motion.js';

// Simple measuring diagram: outer frame (A × B), opening (C × D), depth (E).
function Diagram() {
  return (
    <svg className="guide__svg" viewBox="0 0 320 240" aria-hidden="true">
      <rect x="60" y="40" width="160" height="160" rx="14" fill="#F3BDD0" />
      <rect x="105" y="80" width="70" height="80" rx="8" fill="#FFF9EF" stroke="#2D3A6A" strokeWidth="2" />
      <g stroke="#2D3A6A" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M60 22H220M60 16v12M220 16v12" /><path d="M238 40V200M232 40h12M232 200h12" />
        <path d="M105 176H175M105 170v12M175 170v12" strokeDasharray="4 4" />
      </g>
      <rect x="262" y="60" width="16" height="140" rx="4" fill="#EF704F" />
      <g fill="#2D3A6A" fontFamily="Noto Sans, sans-serif" fontSize="14" fontWeight="700">
        <text x="140" y="14" textAnchor="middle">A</text><text x="252" y="125">B</text>
        <text x="140" y="198" textAnchor="middle">C</text><text x="290" y="135">E</text>
      </g>
    </svg>
  );
}

export default function Guide() {
  const t = useT();
  useReveal([t.lang]);
  return (
    <section className="guide page-pad">
      <div className="wrap">
        <header className="page-head">
          <p className="eyebrow">{t('guide.eyebrow')}</p>
          <h1 className="h1">{t('guide.title')}</h1>
          <p className="lede">{t('guide.lede')}</p>
        </header>
        <div className="guide__grid">
          <div className="guide__visual field--ivory reveal"><Diagram /></div>
          <ol className="steps steps--col">
            {[1, 2, 3, 4].map(i => (
              <li key={i} className="step reveal" style={{ '--d': `${i * 70}ms` }}><span className="step__no">0{i}</span><h3>{t(`guide.s${i}.t`)}</h3><p>{t(`guide.s${i}.d`)}</p></li>
            ))}
          </ol>
        </div>
        <p className="lede guide__photo reveal">{t('guide.photo')}</p>
        <div className="guide__info">
          <div className="info reveal"><h2 className="h3">{t('guide.prod.t')}</h2><p>{t('guide.prod.d')}</p></div>
          <div className="info reveal"><h2 className="h3">{t('guide.del.t')}</h2><p>{t('guide.del.d')}</p></div>
        </div>
      </div>
    </section>
  );
}
