import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useCatalog } from '../lib/catalog.jsx';
import { fieldFor, initialConfig } from '../lib/config.js';
import { COVER_SHAPES, PATTERNS, SECTION_TYPES } from '../data/seed.js';
import { formatAMD } from '../lib/config.js';
import { clamp, isMobile, lerp, reducedMotion, useReveal } from '../lib/motion.js';
import { contactLinks } from '../site.js';
import ProductPreview from '../components/ProductPreview.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Living, { HOME_FLIGHTS } from '../components/Living.jsx';
import { AWMark } from '../components/Logo.jsx';
import { ArcBadge, ArrowDot, Count, HalfMoons, Ribbons, Sticker } from '../components/Decor.jsx';

const HERO_SLUGS = ['clover-duo', 'bean-tray', 'dotty-socket', 'wavy-frame', 'wavy-trio', 'puddle-mirror'];
const WALK_PRODUCT = 'clover-duo';

/* ---------- hero tile: one product cycling through three color pairs ---------- */
function HeroTile({ product, i, comboIds }) {
  const t = useT();
  const { combos } = useCatalog();
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return;
    let iv; const start = setTimeout(() => { iv = setInterval(() => setOn(n => (n + 1) % comboIds.length), 4200); }, 1200 + i * 650);
    return () => { clearTimeout(start); clearInterval(iv); };
  }, [comboIds.length, i]);
  return (
    <Link data-orbit to={t.path(`/product/${product.slug}`)} className={`tile t-${i}`} aria-label={`${t('hero.tile')}: ${t.pick(product.name)}`}>
      <div className="tile__in">
        {comboIds.map((c, k) => <ProductPreview key={c} className={`tile__img${k === on ? ' on' : ''}`} config={initialConfig(product, combos, c)} />)}
        <span className="tile__label">{t.pick(product.name)} <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  );
}

/* headline: line one ends on a tilted pill, line two's letters bounce one after another */
function Headline({ l1, l2 }) {
  const words = l1.split(' '), [, last, punct] = words.pop().match(/^(.*?)([,.։՝]*)$/);
  let n = 0;
  const l2words = l2.split(' ');
  return (
    <h1 id="hero-title" className="hl" aria-label={`${l1} ${l2}`}>
      <span aria-hidden="true">
        <span className="w"><span>{words.join(' ')}</span></span>{' '}
        <span className="w w--pill"><span>{last}</span></span><span className="w w--punct"><span>{punct}</span></span>
        <br />
        <span className="w w--accent"><span>{l2words.map((wd, k) => <span key={k}>
          <span className="hl__word">{Array.from(wd).map((c, j) => <span className="ch" key={j} style={{ '--i': n++ }}>{c}</span>)}</span>{k < l2words.length - 1 ? ' ' : ''}
        </span>)}</span></span>
      </span>
    </h1>
  );
}

function Hero() {
  const t = useT();
  const { products, combos, pricing } = useCatalog();
  const heroRef = useRef(null), copyRef = useRef(null);
  const tiles = HERO_SLUGS.map(s => products.find(p => p.slug === s)).filter(Boolean);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setLoaded(true)); return () => cancelAnimationFrame(r); }, []);

  // pieces slowly orbit the headline on an ellipse; scroll spins and widens it; the mouse adds a little parallax
  useEffect(() => {
    const hero = heroRef.current, copy = copyRef.current;
    const orbit = [...hero.querySelectorAll('[data-orbit]')].map((el, i, all) => ({ el, base: -Math.PI / 2 + i * 2 * Math.PI / all.length + .35, w: 0, h: 0 }));
    const RM = reducedMotion();
    let ocx = 0, ocy = 0, orx = 0, ory = 0, vh = innerHeight, pmx = 0, pmy = 0, smx = 0, smy = 0, raf = 0, still = false;
    const size = () => {
      vh = innerHeight;
      // phones: no orbit, the tiles sit in a strip under the buttons (see .hero__tiles)
      still = isMobile();
      if (still) { orbit.forEach(o => { o.el.style.transform = ''; o.el.style.zIndex = ''; o.el.style.opacity = ''; o.el.style.pointerEvents = ''; }); return; }
      orbit.forEach(o => { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; });
      const H = hero.offsetHeight, W = hero.offsetWidth, top = isMobile() ? 110 : 130;
      ocx = W / 2; ocy = copy.offsetTop + copy.offsetHeight / 2;
      const th = Math.max(...orbit.map(o => o.h));
      orx = W * (isMobile() ? .6 : .41);
      ory = Math.max(copy.offsetHeight / 2 + th * .55, Math.min(ocy - top - th * .2, H - ocy - th * .25));
      ory = Math.min(ory, ocy - top - th * .4); // keep the top of the orbit below the header
    };
    const step = time => {
      const sy = scrollY;
      if (!still && sy < vh * 1.6) {
        smx = lerp(smx, pmx, .06); smy = lerp(smy, pmy, .06);
        const spin = RM ? 0 : time * (2 * Math.PI / 80000) + sy * .0016;
        const k = 1 + sy / vh * .35;
        orbit.forEach(o => {
          const a = o.base + spin, sn = Math.sin(a), sc = .84 + .16 * (sn + 1) / 2, d = 30 * sc;
          const x = ocx + Math.cos(a) * orx * k - o.w / 2 - smx * d;
          const y = ocy + sn * ory * k - o.h / 2 - smy * d;
          o.el.style.transform = `translate3d(${x}px,${y}px,0) scale(${sc})`;
          o.el.style.zIndex = sn > 0 ? 3 : 2;
          // fade out while passing above/below the headline so the copy and buttons stay readable
          const vis = clamp((Math.abs(Math.cos(a)) - .22) / .26);
          o.el.style.opacity = vis; o.el.style.pointerEvents = vis < .4 ? 'none' : '';
        });
      }
      if (!RM) raf = requestAnimationFrame(step);
    };
    const onMove = e => { pmx = e.clientX / innerWidth - .5; pmy = e.clientY / innerHeight - .5; };
    size(); step(0);
    const ro = new ResizeObserver(size); ro.observe(hero);
    if (matchMedia('(pointer:fine)').matches) addEventListener('mousemove', onMove);
    if (document.fonts) document.fonts.ready.then(size);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('mousemove', onMove); };
  }, [tiles.length]);

  const comboSets = [['classic', 'night', 'garden'], ['sunny', 'sea', 'wine'], ['garden', 'classic', 'sea'],
    ['poppy', 'mist', 'sunny'], ['sunny', 'ink', 'night'], ['sea', 'poppy', 'mist']];

  return (
    <section className={`hero${loaded ? ' loaded' : ''}`} id="hero" ref={heroRef} aria-labelledby="hero-title">
      <Ribbons set="hero" className="hero__ribbons" par="0.15" />
      <HalfMoons className="hero__moons" color="mint" />
      <div className="hero__tiles">
        {tiles.map((p, i) => <HeroTile key={p.slug} product={p} i={i} comboIds={comboSets[i].filter(c => combos.some(x => x.id === c))} />)}
      </div>
      <div data-orbit className="seal" aria-hidden="true">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="58" className="seal__disc" />
          <defs><path id="sealRing" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
          <text><textPath href="#sealRing" textLength="270" lengthAdjust="spacing">{t('seal.text')}</textPath></text></svg>
        <AWMark className="seal__aw" />
      </div>
      <div className="hero__copy" ref={copyRef}>
        <span className="eyebrow hero__eyebrow fade-in">{t('hero.eyebrow')}</span>
        <Headline l1={t('hero.l1')} l2={t('hero.l2')} />
        <p className="hero__sub fade-in">{t('hero.sub')}</p>
        <div className="hero__ctas fade-in">
          <Link className="btn btn--ink magnet" to={t.path('/product/clover-duo')}>{t('hero.cta1')} <span aria-hidden="true">→</span></Link>
          <Link className="btn btn--line magnet" to={t.path('/catalog')}>{t('hero.cta2')}</Link>
        </div>
        <ul className="hero__facts fade-in">
          <li>{t('hero.fact1', { p: formatAMD(pricing.coverFirst, t.lang) })}</li><li>{t('hero.fact2')}</li><li>{t('hero.fact3')}</li>
        </ul>
      </div>
      <div className="hero__stickers fade-in">
        <Sticker color="butter" rotate={-8} className="st-a">{t('stick.colors')}</Sticker>
        <Sticker color="periwinkle" rotate={6} className="st-b">{t('stick.sections')}</Sticker>
        <Sticker color="petal" rotate={-4} className="st-c">{t('stick.measure')} <i>✎ {t('stick.drag')}</i></Sticker>
      </div>
      <div className="scroll-cue" aria-hidden="true"><span>{t('hero.scroll')}</span><i /></div>
    </section>
  );
}

/* ---------- two crossing tilted bands moving in opposite directions ---------- */
function Bands() {
  const t = useT();
  const { collections } = useCatalog();
  const words = [1, 2, 3, 4].map(i => t(`band.${i}`));
  const rowA = k => <span className="band__set" key={k} aria-hidden={k > 0 || undefined}>
    {collections.map(c => <Link key={c.id} tabIndex={k > 0 ? -1 : undefined} to={t.path(`/catalog?collection=${c.id}`)}>{t.pick(c.name)}</Link>)}
  </span>;
  const rowB = k => <span className="band__set" key={k} aria-hidden="true">{words.map(w => <span key={w}>{w}</span>)}</span>;
  return (
    <div className="bands">
      <nav className="band band--a" aria-label={t('cat.collection')}><div className="band__track">{[0, 1, 2, 3].map(rowA)}</div></nav>
      <div className="band band--b" aria-hidden="true"><div className="band__track band__track--rev">{[0, 1, 2, 3].map(rowB)}</div></div>
    </div>
  );
}

/* ---------- bento: routes + a live mini studio ---------- */
function MiniStudio() {
  const t = useT();
  const { products, combos, colors } = useCatalog();
  const product = products.find(p => p.slug === WALK_PRODUCT);
  const [combo, setCombo] = useState('classic');
  const [shape, setShape] = useState('clover');
  if (!product) return null;
  const cfg = { ...initialConfig(product, combos, combo), shape };
  const hex = id => colors.find(c => c.id === id)?.hex;
  return (
    <div className="bento__card bento__studio reveal" style={{ '--d': '160ms' }}>
      <div className="studio__copy">
        <h3>{t('try.t')}</h3>
        <p>{t('try.d')}</p>
      </div>
      <div className={`studio__stage field--${fieldFor(cfg.colors.base, 'ivory')}`}>
        <ProductPreview config={cfg} className="studio__img" title={t.pick(product.name)} />
      </div>
      <div className="studio__ctrl">
        <span className="studio__label">{t('try.pairs')}</span>
        <div className="studio__row">
          {combos.map(c => (
            <button key={c.id} className={`combo${combo === c.id ? ' on' : ''}`} aria-pressed={combo === c.id} title={t.pick(c.name)} aria-label={t.pick(c.name)} onClick={() => setCombo(c.id)}>
              <span style={{ '--a': hex(c.base), '--b': hex(c.pattern), '--c': hex(c.accent) }} />
            </button>
          ))}
        </div>
        <span className="studio__label">{t('try.shapes')}</span>
        <div className="studio__row">
          {COVER_SHAPES.map(s => <button key={s.id} className={`pill${shape === s.id ? ' on' : ''}`} aria-pressed={shape === s.id} onClick={() => setShape(s.id)}>{t.pick(s.name)}</button>)}
        </div>
        <Link className="btn btn--cream magnet" to={t.path(`/product/${WALK_PRODUCT}?combo=${combo}&shape=${shape}`)}>{t('try.cta')} <span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}

function Bento() {
  const t = useT();
  const { products, combos } = useCatalog();
  const pick = s => products.find(p => p.slug === s);
  const card = (k, to, slug, cls, shape) => {
    const p = pick(slug); if (!p) return null;
    return (
      <Link to={to} className={`bento__card bento__route ${cls} reveal`}>
        <div className="bento__head"><h3>{t(`routes.${k}.t`)}</h3><ArrowDot /></div>
        <p>{t(`routes.${k}.d`)}</p>
        <ProductPreview config={initialConfig(p, combos)} className="bento__img" />
        {shape}
      </Link>
    );
  };
  return (
    <section className="bento sec-pad" id="routes">
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow reveal">{t('routes.eyebrow')}</p><h2 className="h2 reveal">{t('bento.title')}</h2></div>
          <div className="tags reveal" aria-hidden="true">
            <span className="tag tag--ink">{t('stick.colors')}</span><span className="tag tag--petal">{t('stick.measure')}</span><span className="tag tag--line">{t('stick.sections')}</span>
          </div>
        </div>
        <div className="bento__grid">
          {card('covers', t.path('/catalog?category=cover'), 'wave-switch', 'bento--peri', <span className="bento__blob" />)}
          {card('objects', t.path('/catalog?category=decor'), 'cloud-tray', 'bento--butter', <span className="bento__moon" />)}
          <MiniStudio />
        </div>
      </div>
    </section>
  );
}

/* ---------- Room I: pinned horizontal walk through color pairs ---------- */
function Walk() {
  const t = useT();
  const { products, combos } = useCatalog();
  const product = products.find(p => p.slug === WALK_PRODUCT);
  const secRef = useRef(null), trackRef = useRef(null), barRef = useRef(null);
  const [n, setN] = useState(1);
  useEffect(() => {
    const sec = secRef.current, track = trackRef.current, bar = barRef.current;
    let dist = 0, raf = 0, last = -1;
    const size = () => { dist = Math.max(0, track.scrollWidth - innerWidth); sec.style.height = (dist + innerHeight) + 'px'; };
    const step = () => {
      const r = sec.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, dist));
      if (p !== last) {
        last = p;
        track.style.transform = `translate3d(${-p * dist}px,0,0)`;
        bar.style.transform = `scaleX(${p})`;
        setN(Math.min(combos.length, 1 + Math.floor(p * combos.length)));
      }
      raf = requestAnimationFrame(step);
    };
    size(); raf = requestAnimationFrame(step);
    const ro = new ResizeObserver(size); ro.observe(track); addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('resize', size); };
  }, [combos.length]);
  if (!product) return null;
  const fields = ['ivory', 'periwinkle', 'petal', 'butter', 'lilac', 'mint', 'ivory', 'petal'];
  return (
    <section className="walk" id="walk" ref={secRef} aria-labelledby="walk-title">
      <div className="walk__stick">
        <div className="walk__track" ref={trackRef}>
          <Ribbons set="walk" className="walk__ribbon" />
          <div className="walk__intro">
            <p className="eyebrow">{t('walk.eyebrow')}</p>
            <h2 id="walk-title" className="display">{t('walk.title')}</h2>
            <p className="lede">{t('walk.lede')}</p>
          </div>
          {combos.map((c, i) => (
            <Link key={c.id} to={t.path(`/product/${WALK_PRODUCT}?combo=${c.id}`)} className={`piece reveal piece--${['tall', 'low', 'high'][i % 3]}`} style={{ '--r': `${[-3, 2, -1.5, 3][i % 4]}deg` }}>
              <div className={`piece__frame field--${fieldFor(c.base, fields[i % fields.length])}`}>
                <ProductPreview config={initialConfig(product, combos, c.id)} className="piece__img" title={t.pick(c.name)} />
                <span className="piece__no">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="placard"><b>{t.pick(c.name)}</b><span>{t('walk.open')} →</span></div>
            </Link>
          ))}
          <div className="walk__end">
            <p>{t('walk.end')}</p>
            <Link className="btn btn--ink magnet" to={t.path(`/product/${WALK_PRODUCT}`)}>{t('walk.endCta')} <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="walk__meta" aria-hidden="true"><span>{String(n).padStart(2, '0')} / {String(combos.length).padStart(2, '0')}</span><div className="walk__bar"><i ref={barRef} /></div><span>{t('walk.eyebrow')}</span></div>
      </div>
    </section>
  );
}

/* ---------- letter + ribbon poster (split) ---------- */
function Manifesto() {
  const t = useT();
  return (
    <section className="manifesto" id="manifesto">
      <div className="manifesto__text">
        <svg className="manifesto__pen" viewBox="0 0 120 120" aria-hidden="true" data-fade>
          <path className="ribbon" pathLength="1" d="M20 96c20-30 50-18 30 4s10 14 40-30" fill="none" stroke="#641C35" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="eyebrow reveal">{t('man.eyebrow')}</p>
        <h2 className="h2 reveal">{t('man.title')}</h2>
        <p className="lede reveal">{t('man.text')}</p>
        <p className="manifesto__sign reveal">{t('man.sign')}</p>
        <Link className="btn btn--petal magnet reveal" to={t.path('/catalog')}>{t('man.cta')}</Link>
      </div>
      <div className="manifesto__art"><Ribbons set="art" /></div>
    </section>
  );
}

function Featured() {
  const t = useT();
  const { products } = useCatalog();
  return (
    <section className="featured sec-pad" id="featured">
      <div className="wrap">
        <ArcBadge text={t('feat.badge')} className="featured__badge" />
        <div className="sec-head sec-head--center">
          <h2 className="h2 reveal">{t('feat.title')}</h2>
        </div>
        <div className="grid">{products.slice(0, 8).map((p, i) => <ProductCard key={p.slug} product={p} index={i} />)}</div>
        <div className="center"><Link className="btn btn--line magnet" to={t.path('/catalog')}>{t('feat.all')} <span aria-hidden="true">→</span></Link></div>
      </div>
    </section>
  );
}

function Colors() {
  const t = useT();
  const { colors } = useCatalog();
  const nc = colors.length, pat = PATTERNS.length - 1;
  // one section: shape × insert × (plain: base + insert color | patterned: pattern × base × pattern color × insert color)
  const versions = COVER_SHAPES.length * SECTION_TYPES.length * (nc * nc + pat * nc * nc * nc);
  const stats = [[COVER_SHAPES.length, 'shapes'], [PATTERNS.length, 'patterns'], [versions, 'combos']];
  return (
    <section className="colors sec-pad" id="colors">
      <div className="wrap colors__in">
        <div className="colors__copy">
          <p className="eyebrow reveal">{t('colors.eyebrow')}</p>
          <h2 className="h2 reveal">{t('colors.title')}</h2>
          <p className="lede reveal">{t('colors.lede')}</p>
          <p className="small reveal">{t('colors.note')}</p>
          <ul className="colors__stats reveal" aria-label={t('stats.title')}>
            {stats.map(([v, k]) => <li key={k}><b><Count to={v} lang={t.lang} /></b><span>{t(`stats.${k}`)}</span></li>)}
          </ul>
        </div>
        <ul className="swatches">
          {colors.map((c, i) => (
            <li key={c.id} className="swatch reveal" style={{ '--c': c.hex, '--d': `${i * 40}ms`, '--r': `${(i % 3 - 1) * 6}deg` }}>
              <span className="swatch__chip" /><span>{t.pick(c.name)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function How() {
  const t = useT();
  const shapes = ['blob', 'moon', 'pill', 'ring'];
  return (
    <section className="how sec-pad" id="how">
      <div className="wrap">
        <p className="eyebrow reveal">{t('how.eyebrow')}</p>
        <h2 className="h2 reveal">{t('how.title')}</h2>
        <ol className="steps">
          {[1, 2, 3, 4].map(i => (
            <li key={i} className="step reveal" style={{ '--d': `${i * 80}ms` }}>
              <span className={`step__shape step__shape--${shapes[i - 1]}`} aria-hidden="true" />
              <span className="step__no">0{i}</span><h3>{t(`how.${i}.t`)}</h3><p>{t(`how.${i}.d`)}</p>
            </li>
          ))}
        </ol>
        <p className="note reveal">{t('how.soon')}</p>
      </div>
    </section>
  );
}

function Faq() {
  const t = useT();
  return (
    <section className="faq sec-pad" id="faq">
      <div className="wrap faq__in">
        <div><p className="eyebrow reveal">{t('faq.eyebrow')}</p><h2 className="h2 reveal">{t('faq.title')}</h2></div>
        <div className="faq__list">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <details key={i} className="qa reveal">
              <summary>{t(`faq.q${i}`)}<span aria-hidden="true" /></summary>
              <p>{t(`faq.a${i}`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const t = useT();
  const links = contactLinks();
  if (!links.length) return null; // nothing to contact yet: hide rather than show a dead button
  return (
    <section className="contact" id="contact">
      <div className="wrap">
        <div className="contact__card reveal">
          <Ribbons set="panel" className="contact__ribbon" />
          <div className="contact__in">
            <p className="eyebrow">{t('contact.eyebrow')}</p>
            <h2 className="h2">{t('contact.title')}</h2>
            <p className="lede">{t('contact.lede')}</p>
            <div className="contact__links">
              {links.map(c => <a key={c.id} className="btn btn--ink magnet" href={c.href} target={c.id === 'email' ? undefined : '_blank'} rel="noreferrer">{c.label}</a>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const t = useT();
  useReveal([t.lang]);
  const flights = useMemo(() => HOME_FLIGHTS, []);
  return (
    <>
      <Hero />
      <Bands />
      <Bento />
      <Featured />
      <Walk />
      <Manifesto />
      <Colors />
      <How />
      <Faq />
      <Contact />
      <Living flights={flights} quiet=".grid, .faq__list, .walk, .bento__grid, .manifesto" />
    </>
  );
}
