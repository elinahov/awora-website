import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from '../lib/motion.js';

/* Awora shape kit: thick flat ribbons that draw themselves in, draggable sticker pills,
   an arched text badge, half-moons and count-up numbers. Solid fills only (brand book). */

const C = { mulberry: '#641C35', persimmon: '#EF704F', petal: '#F3BDD0', periwinkle: '#B9C8EE', ivory: '#FFF9EF', butter: '#F5D47E', mint: '#BFE0CB', lilac: '#CDBDEB' };

// smooth open curve through points (Catmull-Rom → cubic Bézier)
export function smoothOpen(pts) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}
// a sine ribbon from (x0,y0) to (x1,y1)
export function wave(x0, y0, x1, y1, waves = 3, amp = 40, n = 12) {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, steps = waves * n;
  return smoothOpen(Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps, o = Math.sin(t * waves * Math.PI * 2) * amp;
    return [+(x0 + (x1 - x0) * t - uy * o).toFixed(1), +(y0 + (y1 - y0) * t + ux * o).toFixed(1)];
  }));
}

const SETS = {
  // soft loops around the hero edges, kept clear of the headline
  hero: { vb: '0 0 1440 900', w: 30, paths: [
    { c: 'periwinkle', d: smoothOpen([[-60, 640], [120, 560], [210, 700], [120, 790], [40, 700], [180, 620], [330, 760], [430, 960]]) },
    { c: 'butter', d: smoothOpen([[1500, 560], [1360, 600], [1300, 720], [1380, 800], [1450, 720], [1360, 650], [1240, 760], [1180, 960]]) },
    { c: 'petal', d: smoothOpen([[1180, -40], [1220, 90], [1330, 120], [1360, 40], [1280, 20], [1250, 150], [1400, 230], [1520, 200]]) },
    { c: 'mint', d: smoothOpen([[-40, 120], [90, 70], [170, 150], [110, 230], [40, 170], [150, 110], [260, 60], [300, -40]]) }
  ] },
  // the poster: four ribbons crossing a colored panel
  art: { vb: '0 0 600 700', w: 36, paths: [
    { c: 'periwinkle', d: smoothOpen([[120, -30], [110, 140], [210, 260], [420, 300], [540, 430], [500, 610], [620, 720]]) },
    { c: 'petal', d: smoothOpen([[390, -30], [300, 70], [330, 250], [250, 390], [90, 420], [-30, 540]]) },
    { c: 'butter', d: smoothOpen([[640, -20], [630, 90], [520, 160], [450, 290], [520, 390], [380, 440], [300, 360], [190, 480], [70, 500], [60, 400], [-20, 390]]) },
    { c: 'persimmon', d: wave(120, 760, 700, 470, 3, 46) }
  ] },
  band: { vb: '0 0 1200 300', w: 26, paths: [{ c: 'ivory', o: .55, d: wave(-40, 150, 1240, 150, 4, 105) }] },
  panel: { vb: '0 0 1200 500', w: 34, paths: [{ c: 'ivory', o: .45, d: wave(-60, 300, 1260, 200, 3, 170) }, { c: 'persimmon', d: smoothOpen([[1000, 560], [1080, 420], [1180, 430], [1150, 330], [1060, 360], [1120, 250], [1260, 200]]) }] },
  walk: { vb: '0 0 3000 400', w: 26, paths: [{ c: 'petal', d: wave(0, 220, 3000, 200, 7, 120, 10) }] }
};

/* Ribbons draw in when they enter the viewport (via the global reveal observer: .in), then drift. */
export function Ribbons({ set, className = '', stroke, par }) {
  const s = SETS[set];
  return (
    <svg className={`ribbons ribbons--${set} ${className}`} viewBox={s.vb} preserveAspectRatio={set === 'walk' ? 'none' : 'xMidYMid slice'} aria-hidden="true" data-fade data-par={par}>
      {s.paths.map((p, i) => (
        <path key={i} className="ribbon" d={p.d} pathLength="1" fill="none" stroke={C[p.c]} strokeOpacity={p.o ?? 1}
          strokeWidth={stroke || s.w} strokeLinecap="round" strokeLinejoin="round" style={{ '--i': i }}
          vectorEffect={set === 'walk' ? 'non-scaling-stroke' : undefined} />
      ))}
    </svg>
  );
}

export const HalfMoons = ({ className = '', color = 'mint' }) => (
  <svg className={`moons ${className}`} viewBox="0 0 200 110" aria-hidden="true" data-par="-0.12">
    <path d="M0 0A55 55 0 0 1 0 110Z" fill={C[color]} className="moon" />
    <path d="M90 0A55 55 0 0 1 90 110Z" fill={C[color]} className="moon" />
  </svg>
);

export const Squiggle = ({ className = '', color = 'petal' }) => (
  <svg className={`squig ${className}`} viewBox="0 0 120 420" aria-hidden="true" data-fade data-par="0.1">
    <path className="ribbon" pathLength="1" d={wave(60, -10, 60, 430, 3, 34)} fill="none" stroke={C[color]} strokeWidth="38" strokeLinecap="round" />
  </svg>
);

// hand-drawn underline that draws in under a word
export const Underline = ({ color = 'persimmon' }) => (
  <svg className="uline" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
    <path className="ribbon" pathLength="1" d="M4 16C60 4 110 22 160 12S260 4 296 14" fill="none" stroke={C[color]} strokeWidth="7" strokeLinecap="round" />
  </svg>
);

/* Circular rotating text badge, like a sticker on a box */
export function ArcBadge({ text, className = '', color = 'mulberry', fill = 'butter' }) {
  const id = useRef(`arc${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <div className={`arc ${className}`} aria-hidden="true">
      <svg viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="70" fill={C[fill]} />
        <defs><path id={id} d="M70 70m-50 0a50 50 0 1 1 100 0a50 50 0 1 1 -100 0" /></defs>
        <text fill={C[color]}><textPath href={`#${id}`}>{text}</textPath></text>
      </svg>
      <span className="arc__dot" />
    </div>
  );
}

/* Sticker pill you can pick up and move. Purely for delight; never blocks content. */
export function Sticker({ children, color = 'petal', rotate = -6, className = '', style }) {
  const ref = useRef(null);
  const st = useRef({ x: 0, y: 0, sx: 0, sy: 0, drag: false });
  const [grab, setGrab] = useState(false);
  const apply = (lift = 0) => { const s = st.current; ref.current.style.translate = `${s.x}px ${s.y}px`; ref.current.style.rotate = `${rotate + lift}deg`; };
  const down = e => {
    const s = st.current; s.drag = true; s.sx = e.clientX - s.x; s.sy = e.clientY - s.y;
    ref.current.setPointerCapture(e.pointerId); setGrab(true); apply(rotate > 0 ? -8 : 8);
  };
  const move = e => { const s = st.current; if (!s.drag) return; s.x = e.clientX - s.sx; s.y = e.clientY - s.sy; apply(rotate > 0 ? -8 : 8); };
  const up = () => { st.current.drag = false; setGrab(false); apply(); };
  return (
    <span ref={ref} className={`sticker sticker--${color}${grab ? ' is-grab' : ''} ${className}`} style={{ rotate: `${rotate}deg`, ...style }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>{children}</span>
  );
}

/* Counts up once it scrolls into view */
export function Count({ to, lang }) {
  const ref = useRef(null);
  const [n, setN] = useState(reducedMotion() ? to : 0);
  useEffect(() => {
    if (reducedMotion()) return;
    const el = ref.current; let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(), dur = 1400 + Math.min(1200, to / 40);
      const tick = t => { const k = Math.min(1, (t - t0) / dur); setN(Math.round(to * (1 - Math.pow(1 - k, 4)))); if (k < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, { threshold: .6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={ref}>{n.toLocaleString(lang === 'hy' ? 'hy-AM' : 'en-US')}</span>;
}

/* Arrow in a circle (Pulse-style card affordance) */
export const ArrowDot = () => (
  <span className="arrowdot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8" /></svg></span>
);
