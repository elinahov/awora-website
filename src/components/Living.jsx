import { useEffect, useRef } from 'react';
import { clamp, isMobile, reducedMotion } from '../lib/motion.js';

/* Scroll-driven living layer, ported from the Eleene engine and restyled for Awora:
   - flights: large flat brand shapes that drift along a path while their anchor section scrolls by
     (pts = [progress, x vw%, y vh%]; mpts = mobile path)
   - motes: a few small flat shapes spawned only while scrolling, mostly in the side margins.
   Solid fills only, no shadows or sparkles (brand book: no generic stars, flowers or confetti). */

const INK = ['#641C35', '#EF704F', '#F3BDD0', '#B9C8EE', '#F5D47E'];
const SHAPES = {
  blobA: 'M8 60C2 36 22 12 48 18c14 3 18 18 32 16 18-3 30 8 26 26-5 22-30 22-46 30-18 9-46 0-52-30Z',
  blobB: 'M10 40C14 14 46 4 62 20c8 8 6 22 18 30 14 10 10 34-8 38-24 6-40-10-54-20C8 62 8 52 10 40Z',
  swoosh: 'M6 70C20 30 50 10 80 14c16 2 22 14 14 24-6 8-20 6-26 16-8 14 6 30 24 34-30 8-70 2-86-18Z',
  half: 'M10 60A40 40 0 0 1 90 60Z',
  pill: 'M30 20h40a20 20 0 0 1 0 40H30a20 20 0 0 1 0-40Z',
  dot: 'M50 15a35 35 0 1 1 0 70a35 35 0 1 1 0-70Z'
};

export const HOME_FLIGHTS = [
  { anchor: '#hero', img: '/brand/shape-coral.png', w: 150, ar: 350 / 229, pts: [[.38, -12, 72], [.55, 8, 56], [.75, 4, 30], [.98, -14, 6]] },
  { anchor: '#featured', shape: 'swoosh', fill: '#EF704F', w: 110, pts: [[0, -12, 84], [.35, 4, 56], [.7, 3, 26], [1, -14, 0]] },
  { anchor: '#colors', img: '/brand/shape-petal.png', w: 140, ar: 296 / 156, pts: [[0, 112, 70], [.35, 93, 46], [.7, 96, 18], [1, 114, -8]] },
  { anchor: '#how', shape: 'half', fill: '#B9C8EE', w: 80, pts: [[0, -10, 88], [.4, 4, 58], [.75, 2, 30], [1, -12, 4]] },
  { anchor: '#faq', img: '/brand/shape-coral.png', w: 110, ar: 350 / 229, pts: [[0, 110, 92], [.4, 95, 60], [.8, 97, 24], [1, 112, -6]] }
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

    const svg = (d, fill) => `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path d="${d}" fill="${fill}"/></svg>`;
    const flies = flights.map(f => {
      const host = document.querySelector(f.anchor); if (!host) return null;
      const el = document.createElement('div'); el.className = 'floater';
      const w = f.w * (isMobile() ? .7 : 1), h = f.img ? w / f.ar : w;
      Object.assign(el.style, { width: w + 'px', height: h + 'px', left: -w / 2 + 'px', top: -h / 2 + 'px' });
      el.innerHTML = f.img ? `<img src="${f.img}" alt="">` : svg(SHAPES[f.shape], f.fill);
      root.appendChild(el);
      return { ...f, el, host, x: 0, y: 0, init: false, seed: Math.random() * 10 };
    }).filter(Boolean);
    const prog = el => { const r = el.getBoundingClientRect(); return clamp((vh - r.top) / (vh + r.height)); };

    const quietEls = quiet ? [...document.querySelectorAll(quiet)] : [];
    const quietAt = y => quietEls.some(z => { const r = z.getBoundingClientRect(); return r.top < y && r.bottom > y; });
    const motes = []; let energy = 0, lastY = scrollY, dir = 1;
    const spawn = () => {
      if (motes.length >= (isMobile() ? 6 : 10) || quietAt(vh * .5)) return;
      const keys = Object.keys(SHAPES), el = document.createElement('span');
      el.className = 'mote';
      el.innerHTML = svg(SHAPES[keys[Math.floor(Math.random() * keys.length)]], INK[Math.floor(Math.random() * INK.length)]);
      el.style.setProperty('--sz', (10 + Math.random() * 12) * (isMobile() ? .85 : 1) + 'px');
      const edge = Math.random() < (isMobile() ? .85 : .75);
      const x = edge ? (Math.random() < .5 ? Math.random() * .1 : .9 + Math.random() * .1) * vw : (.15 + Math.random() * .7) * vw;
      const y = dir > 0 ? vh * (.55 + Math.random() * .45) : vh * Math.random() * .45;
      root.appendChild(el);
      motes.push({ el, x, y, vx: (Math.random() - .5) * .35, vy: -dir * (.25 + Math.random() * .45), r: Math.random() * 360, vr: (Math.random() - .5) * 1.6,
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
        m.el.style.transform = `translate3d(${m.x}px,${m.y}px,0) rotate(${m.r}deg)`;
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
        f.el.style.transform = `translate3d(${f.x}px,${f.y}px,0) rotate(${Math.sin(t / 2200 + f.seed) * 10 + p * 40}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', onResize); root.innerHTML = ''; };
  }, [flights, quiet]);
  return <div className="living" ref={layer} aria-hidden="true" />;
}
