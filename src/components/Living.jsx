import { useEffect, useRef } from 'react';
import { clamp, isMobile, reducedMotion } from '../lib/motion.js';

/* Scroll-driven living layer, ported from the Eleene engine and restyled for Awora:
   - flights: cute flat objects (balloon, butterfly, hot-air balloon, flower) that drift along a path
     while their anchor section scrolls by (pts = [progress, x vw%, y vh%]; mpts = mobile path)
   - motes: a few small objects spawned only while scrolling, mostly in the side margins.
   Solid fills only, no shadows, outlines or sparkles. */

const C = { mulberry: '#641C35', persimmon: '#EF704F', petal: '#F3BDD0', periwinkle: '#B9C8EE', ivory: '#FFF9EF', butter: '#F5D47E', mint: '#BFE0CB', lilac: '#CDBDEB' };

// each object is drawn in a 100x100 box from a main color (a) and a second color (b)
const OBJECTS = {
  balloon: (a, b) => `<path d="M50 70c-2 8 6 12 2 18s-6 8-2 12" fill="none" stroke="${C.mulberry}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M46 71h8l-4-6z" fill="${a}"/><ellipse cx="50" cy="38" rx="25" ry="30" fill="${a}"/>
    <ellipse cx="40" cy="26" rx="5" ry="8" fill="${C.ivory}" opacity=".55" transform="rotate(-24 40 26)"/>`,
  butterfly: (a, b) => `<g class="wing wing--l"><path d="M48 46C38 22 12 14 10 32c-2 14 14 20 38 16Z" fill="${a}"/><path d="M48 52C30 54 18 66 26 78c8 10 20-2 22-24Z" fill="${b}"/></g>
    <g class="wing wing--r"><path d="M52 46C62 22 88 14 90 32c2 14-14 20-38 16Z" fill="${a}"/><path d="M52 52C70 54 82 66 74 78c-8 10-20-2-22-24Z" fill="${b}"/></g>
    <rect x="46.5" y="34" width="7" height="36" rx="3.5" fill="${C.mulberry}"/>
    <path d="M48 36c-2-8-6-12-10-14M52 36c2-8 6-12 10-14" fill="none" stroke="${C.mulberry}" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="38" cy="22" r="2.4" fill="${C.mulberry}"/><circle cx="62" cy="22" r="2.4" fill="${C.mulberry}"/>`,
  airballoon: (a, b) => `<path d="M42 74l2 12M58 74l-2 12" stroke="${C.mulberry}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M50 4C26 4 14 22 16 40c2 16 16 26 24 34h20c8-8 22-18 24-34C86 22 74 4 50 4Z" fill="${a}"/>
    <path d="M50 4C40 4 34 22 35 40c1 16 5 26 7 34h16c2-8 6-18 7-34C66 22 60 4 50 4Z" fill="${b}"/>
    <path d="M50 4C47 4 45 22 45.5 40c.5 16 1.5 26 2 34h5c.5-8 1.5-18 2-34C55 22 53 4 50 4Z" fill="${a}"/>
    <rect x="41" y="85" width="18" height="12" rx="3" fill="${C.mulberry}"/>`,
  flower: (a, b) => `<path d="M50 60c0 14-2 24-8 36" fill="none" stroke="#7FB894" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M47 84c-12-2-18-10-18-16 8 0 16 6 18 16Z" fill="#7FB894"/>
    ${[0, 60, 120, 180, 240, 300].map(r => `<ellipse cx="50" cy="18" rx="11" ry="15" fill="${a}" transform="rotate(${r} 50 38)"/>`).join('')}
    <circle cx="50" cy="38" r="11" fill="${b}"/><circle cx="46" cy="36" r="1.8" fill="${C.mulberry}"/><circle cx="54" cy="36" r="1.8" fill="${C.mulberry}"/>
    <path d="M46 41c2 2.4 6 2.4 8 0" fill="none" stroke="${C.mulberry}" stroke-width="1.6" stroke-linecap="round"/>`
};
// color pairs that read well on ivory
const PAIRS = [[C.persimmon, C.butter], [C.periwinkle, C.petal], [C.petal, C.persimmon], [C.butter, C.persimmon], [C.lilac, C.mint], [C.mint, C.periwinkle]];
const draw = (kind, [a, b]) => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="obj obj--${kind}">${OBJECTS[kind](a, b)}</svg>`;

export const HOME_FLIGHTS = [
  { anchor: '#hero', obj: 'balloon', pair: [C.persimmon], w: 110, pts: [[.38, -8, 78], [.55, 8, 56], [.75, 5, 30], [.98, -10, 4]] },
  { anchor: '#featured', obj: 'butterfly', pair: [C.periwinkle, C.petal], w: 96, pts: [[0, -10, 84], [.35, 5, 56], [.7, 3, 26], [1, -12, 0]] },
  { anchor: '#colors', obj: 'airballoon', pair: [C.persimmon, C.butter], w: 120, pts: [[0, 110, 80], [.35, 93, 50], [.7, 95, 20], [1, 110, -10]] },
  { anchor: '#how', obj: 'flower', pair: [C.petal, C.butter], w: 90, pts: [[0, -10, 88], [.4, 5, 58], [.75, 3, 30], [1, -12, 4]] },
  { anchor: '#faq', obj: 'balloon', pair: [C.periwinkle], w: 96, pts: [[0, 108, 92], [.4, 95, 60], [.8, 96, 24], [1, 110, -6]] }
];

const catmull = (p0, p1, p2, p3, t) => {
  const t2 = t * t, t3 = t2 * t;
  return .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
};
const pathAt = (pts, p) => {
  if (p <= pts[0][0]) return [pts[0][1], pts[0][2]];
  const L = pts.length - 1; if (p >= pts[L][0]) return [pts[L][1], pts[L][2]];
  let i = 0; while (i < L && pts[i + 1][0] < p) i++;
  const t = (p - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
  const g = j => pts[clamp(j, 0, L)];
  return [1, 2].map(k => catmull(g(i - 1)[k], g(i)[k], g(i + 1)[k], g(i + 2)[k], t));
};

export default function Living({ flights = [], quiet = '' }) {
  const layer = useRef(null);
  useEffect(() => {
    if (reducedMotion()) return;
    const root = layer.current;
    let vw = innerWidth, vh = innerHeight, raf = 0;
    const onResize = () => { vw = innerWidth; vh = innerHeight; };
    addEventListener('resize', onResize);

    const flies = flights.map(f => {
      const host = document.querySelector(f.anchor); if (!host) return null;
      const el = document.createElement('div'); el.className = 'floater';
      const w = f.w * (isMobile() ? .7 : 1), h = w;
      Object.assign(el.style, { width: w + 'px', height: h + 'px', left: -w / 2 + 'px', top: -h / 2 + 'px' });
      el.innerHTML = draw(f.obj, f.pair);
      root.appendChild(el);
      return { ...f, el, host, x: 0, y: 0, init: false, seed: Math.random() * 10 };
    }).filter(Boolean);
    const prog = el => { const r = el.getBoundingClientRect(); return clamp((vh - r.top) / (vh + r.height)); };

    const quietEls = quiet ? [...document.querySelectorAll(quiet)] : [];
    const quietAt = y => quietEls.some(z => { const r = z.getBoundingClientRect(); return r.top < y && r.bottom > y; });
    const motes = []; let energy = 0, lastY = scrollY, dir = 1;
    const spawn = () => {
      if (motes.length >= (isMobile() ? 6 : 10) || quietAt(vh * .5)) return;
      const keys = Object.keys(OBJECTS), el = document.createElement('span');
      el.className = 'mote';
      el.innerHTML = draw(keys[Math.floor(Math.random() * keys.length)], PAIRS[Math.floor(Math.random() * PAIRS.length)]);
      el.style.setProperty('--sz', (22 + Math.random() * 14) * (isMobile() ? .85 : 1) + 'px');
      const edge = Math.random() < (isMobile() ? .85 : .75);
      const x = edge ? (Math.random() < .5 ? Math.random() * .1 : .9 + Math.random() * .1) * vw : (.15 + Math.random() * .7) * vw;
      const y = dir > 0 ? vh * (.55 + Math.random() * .45) : vh * Math.random() * .45;
      root.appendChild(el);
      motes.push({ el, x, y, vx: (Math.random() - .5) * .35, vy: -dir * (.25 + Math.random() * .45), r: 0, vr: 0,
        born: performance.now(), life: 0, max: 2600 + Math.random() * 1600, peak: edge ? .9 : .55, ph: Math.random() * 6.28 });
    };

    const pars = [...document.querySelectorAll('[data-par]')].map(el => ({ el, k: +el.dataset.par || 0 }));
    const tick = t => {
      const sy = scrollY, dy = sy - lastY; lastY = sy;
      for (const p of pars) {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        p.el.style.translate = `0 ${((r.top + r.height / 2 - vh / 2) * p.k).toFixed(1)}px`;
      }
      if (Math.abs(dy) > .5) { dir = dy > 0 ? 1 : -1; energy += Math.min(Math.abs(dy), 60); }
      while (energy > 140) { energy -= 140; spawn(); }
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i]; m.life++;
        const k = Math.min(1, (performance.now() - m.born) / m.max);
        m.x += m.vx + Math.sin(m.life / 40 + m.ph) * .35; m.y += m.vy - dy * .12; m.r += m.vr;
        const o = k < .08 ? k / .08 : k > .7 ? (1 - k) / .3 : 1;
        m.el.style.opacity = (o * m.peak).toFixed(3);
        m.el.style.transform = `translate3d(${m.x}px,${m.y}px,0) rotate(${(Math.sin(m.life / 30 + m.ph) * 12).toFixed(1)}deg)`;
        if (k >= 1 || m.y < -40 || m.y > vh + 40) { m.el.remove(); motes.splice(i, 1); }
      }
      for (const f of flies) {
        const p = prog(f.host), pts = (isMobile() && f.mpts) || f.pts;
        const vis = p > pts[0][0] && p < pts[pts.length - 1][0];
        let [tx, ty] = pathAt(pts, p);
        tx = tx * vw / 100 + Math.cos(t / 1100 + f.seed) * 8; ty = ty * vh / 100 + Math.sin(t / 900 + f.seed) * 10;
        if (!f.init) { f.x = tx; f.y = ty; f.init = true; }
        f.x += (tx - f.x) * .08; f.y += (ty - f.y) * .08;
        f.el.style.opacity = vis ? 1 : 0;
        f.el.style.transform = `translate3d(${f.x}px,${f.y}px,0) rotate(${(Math.sin(t / 1400 + f.seed) * 7).toFixed(1)}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); root.innerHTML = ''; };
  }, [flights, quiet]);
  return <div className="living" ref={layer} aria-hidden="true" />;
}
