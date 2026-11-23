import { useId } from 'react';
import { useCatalog } from '../lib/catalog.jsx';

/* Flat SVG renderings of every product. They double as catalog images and as the
   live configurator preview, so they redraw from a config object:
   cover: { sections, slots[], shape, orientation, pattern, colors{base,pattern,accent} }
   tray|frame|mirror: { shape, pattern, colors } */

const CELL = 92, M = 16, P = 20;
const f = n => +n.toFixed(2);

/* ---------- path helpers ---------- */
function smoothClosed(pts) {
  const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}
const polar = (cx, cy, rx, ry, n, mod = () => 1, exp = 1) => Array.from({ length: n }, (_, i) => {
  const t = i / n * Math.PI * 2 - Math.PI / 2, c = Math.cos(t), s = Math.sin(t), k = mod(t);
  return [cx + rx * k * Math.sign(c) * Math.abs(c) ** exp, cy + ry * k * Math.sign(s) * Math.abs(s) ** exp];
});
function lobed(pts, bulge = .62) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]; const r = Math.hypot(q[0] - p[0], q[1] - p[1]) * bulge;
    d += `A${f(r)} ${f(r)} 0 0 1 ${f(q[0])} ${f(q[1])}`;
  });
  return d + 'Z';
}
function arcs(x0, y0, x1, y1, n, rx, ry) {
  let d = ''; for (let i = 1; i <= n; i++) d += `A${f(rx)} ${f(ry)} 0 0 1 ${f(x0 + (x1 - x0) * i / n)} ${f(y0 + (y1 - y0) * i / n)}`;
  return d;
}

/* ---------- switch-cover plate outlines, drawn in a horizontal l × s frame ---------- */
function plate(shape, l, s, n) {
  switch (shape) {
    case 'oval': { const b = s * .11; return `M0 ${b}Q${l / 2} ${-b} ${l} ${b}L${l} ${s - b}Q${l / 2} ${s + b} 0 ${s - b}Z`; }
    case 'cookie': {
      const k = n * 2 + 1, w = l / k, b = 10;
      return `M0 0${arcs(0, 0, l, 0, k, w / 2, b)}L${l} ${s}${arcs(l, s, 0, s, k, w / 2, b)}Z`;
    }
    case 'cracker': {
      const step = 11, nt = Math.round(l / step), ns = Math.round(s / step), r1 = l / nt / 2, r2 = s / ns / 2;
      return `M0 0${arcs(0, 0, l, 0, nt, r1, r1)}${arcs(l, 0, l, s, ns, r2, r2)}${arcs(l, s, 0, s, nt, r1, r1)}${arcs(0, s, 0, 0, ns, r2, r2)}Z`;
    }
    case 'cartouche': {
      const c = s * .17, L = s * .19, t = s * .075, m = l / 2;
      return `M${c} 0L${m - 2.4 * t} 0Q${m} ${-2.4 * t} ${m + 2.4 * t} 0L${l - c} 0A${c} ${c} 0 0 0 ${l} ${c}` +
        `C${l + L} ${c} ${l + L} ${s - c} ${l} ${s - c}A${c} ${c} 0 0 0 ${l - c} ${s}` +
        `L${m + 2.4 * t} ${s}Q${m} ${s + 2.4 * t} ${m - 2.4 * t} ${s}L${c} ${s}A${c} ${c} 0 0 0 0 ${s - c}` +
        `C${-L} ${s - c} ${-L} ${c} 0 ${c}A${c} ${c} 0 0 0 ${c} 0Z`;
    }
    default: { const r = 10; return `M${r} 0H${l - r}Q${l} 0 ${l} ${r}V${s - r}Q${l} ${s} ${l - r} ${s}H${r}Q0 ${s} 0 ${s - r}V${r}Q0 0 ${r} 0Z`; }
  }
}

/* ---------- decor outlines in a 200 × 170 box ---------- */
const DECOR = {
  bean: () => smoothClosed([[28, 78], [52, 36], [104, 30], [152, 38], [178, 76], [166, 122], [122, 140], [98, 118], [70, 138], [34, 124]]),
  cloud: () => lobed(polar(100, 88, 78, 58, 9, t => 1 + .05 * Math.sin(3 * t)), .66),
  flower: () => lobed(polar(100, 85, 72, 72, 7), .7),
  wavy: () => smoothClosed(polar(100, 85, 72, 82, 56, t => 1 + .035 * Math.sin(12 * t), .55)),
  scallop: () => lobed(polar(100, 85, 72, 82, 22, () => 1, .55), .6),
  blob: () => smoothClosed(polar(100, 85, 76, 80, 14, t => 1 + .08 * Math.sin(3 * t + 1) + .05 * Math.sin(2 * t))),
  arch: () => 'M38 160V82A62 62 0 0 1 162 82V160Q162 166 156 166H44Q38 166 38 160Z'
};

const BLOB_A = 'M8 60C2 36 22 12 48 18c14 3 18 18 32 16 18-3 30 8 26 26-5 22-30 22-46 30-18 9-46 0-52-30Z';
const BLOB_B = 'M10 40C14 14 46 4 62 20c8 8 6 22 18 30 14 10 10 34-8 38-24 6-40-10-54-20C8 62 8 52 10 40Z';

function PatternFill({ id, kind, w, h, color }) {
  switch (kind) {
    case 'waves': {
      const sw = Math.max(h, w) * .075, per = 64;
      const wave = y0 => { let d = `M${-per} ${y0}`; for (let x = -per; x < w + per; x += per) d += `q${per / 4} -10 ${per / 2} 0t${per / 2} 0`; return d; };
      return <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
        {[.28, .58, .88].map((k, i) => <path key={i} d={wave(h * k)} transform={`translate(${i * 14} 0)`} />)}
      </g>;
    }
    case 'blobs':
      return <g fill={color}>
        <path d={BLOB_A} transform={`translate(${-w * .08} ${h * .42}) scale(${Math.min(w, h) * .0085})`} />
        <path d={BLOB_B} transform={`translate(${w * .62} ${-h * .12}) scale(${Math.min(w, h) * .0062})`} />
      </g>;
    case 'stripes':
      return <><defs><pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="9" height="20" fill={color} /></pattern></defs><rect x={-P} y={-P} width={w + 2 * P} height={h + 2 * P} fill={`url(#${id})`} /></>;
    case 'dots':
      return <><defs><pattern id={id} width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="9.5" cy="9.5" r="4" fill={color} /></pattern></defs><rect x={-P} y={-P} width={w + 2 * P} height={h + 2 * P} fill={`url(#${id})`} /></>;
    case 'checks':
      return <><defs><pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill={color} /><rect x="16" y="16" width="16" height="16" fill={color} /></pattern></defs><rect x={-P} y={-P} width={w + 2 * P} height={h + 2 * P} fill={`url(#${id})`} /></>;
    default: return null;
  }
}

const EDGE = 'rgba(100,28,53,.22)';

function Insert({ type, cx, cy, fill }) {
  if (type === 'blank') return null;
  if (type === 'socket') return <g>
    <circle cx={cx} cy={cy} r="30" fill={fill} stroke={EDGE} strokeWidth="1.2" />
    <rect x={cx - 5} y={cy - 29} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <rect x={cx - 5} y={cy + 24} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <circle cx={cx - 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
    <circle cx={cx + 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
  </g>;
  const n = +type.slice(1), gap = 4, H = 58, W = n === 1 ? 46 : (50 - gap * (n - 1)) / n;
  const x0 = cx - (n * W + (n - 1) * gap) / 2;
  return <g>{Array.from({ length: n }, (_, i) => {
    const x = x0 + i * (W + gap);
    return <g key={i}><rect x={x} y={cy - H / 2} width={W} height={H} rx={Math.min(7, W / 3)} fill={fill} stroke={EDGE} strokeWidth="1.2" />
      <line x1={x + 3} x2={x + W - 3} y1={cy - 7} y2={cy - 7} stroke={EDGE} strokeWidth="1.2" /></g>;
  })}</g>;
}

export default function ProductPreview({ config, className, title }) {
  const { colors } = useCatalog();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hex = id => colors.find(c => c.id === id)?.hex || id;
  const base = hex(config.colors.base), pat = hex(config.colors.pattern), acc = hex(config.colors.accent);

  if (config.kind === 'cover') {
    const n = config.sections, v = config.orientation === 'v';
    const l = n * CELL + 2 * M, s = CELL + 2 * M;
    const W = v ? s : l, H = v ? l : s;
    const d = plate(config.shape, l, s, n);
    const tf = v ? `translate(${s} 0) rotate(90)` : undefined;
    return (
      <svg className={className} viewBox={`${-P} ${-P} ${W + 2 * P} ${H + 2 * P}`} role="img" aria-label={title}>
        <defs><clipPath id={`c${uid}`}><path d={d} transform={tf} /></clipPath></defs>
        <path d={d} transform={tf} fill={base} stroke={EDGE} strokeWidth="1" />
        <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} /></g>
        {config.slots.slice(0, n).map((t, i) => {
          const cx = v ? M + CELL / 2 : M + CELL * (i + .5), cy = v ? M + CELL * (i + .5) : M + CELL / 2;
          return <Insert key={i} type={t} cx={cx} cy={cy} fill={acc} />;
        })}
      </svg>
    );
  }

  const outer = (DECOR[config.shape] || DECOR.bean)();
  const W = 200, H = 170;
  const side = `color-mix(in srgb, ${base} 78%, #3A2430)`;
  const inner = config.kind === 'tray' ? .74 : config.kind === 'frame' ? .56 : .8;
  const innerT = `translate(${100 * (1 - inner)} ${85 * (1 - inner)}) scale(${inner})`;
  return (
    <svg className={className} viewBox={`-6 -6 ${W + 12} ${H + 20}`} role="img" aria-label={title}>
      <defs>
        <clipPath id={`c${uid}`}><path d={outer} /></clipPath>
        <clipPath id={`i${uid}`}><path d={outer} transform={innerT} /></clipPath>
      </defs>
      <path d={outer} fill={side} transform="translate(0 7)" />
      <path d={outer} fill={base} />
      {config.kind !== 'mirror' || config.pattern !== 'plain'
        ? <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} /></g> : null}
      {config.kind === 'tray' && <>
        <path d={outer} transform={innerT} fill={acc} />
        <path d={outer} transform={innerT} fill="none" stroke={side} strokeWidth="5" opacity=".35" />
      </>}
      {config.kind === 'frame' && <>
        <path d={outer} transform={innerT} fill={acc} stroke={side} strokeWidth="4" />
        <g clipPath={`url(#i${uid})`}>
          <circle cx="122" cy="66" r="11" fill={pat} />
          <path d="M40 140Q80 80 112 112T170 100V180H40Z" fill={base} opacity=".55" />
        </g>
      </>}
      {config.kind === 'mirror' && <>
        <path d={outer} transform={innerT} fill="#E6ECF5" stroke={acc} strokeWidth="6" />
        <g clipPath={`url(#i${uid})`} fill="#fff" opacity=".7">
          <path d="M40 120L120 20H140L60 130Z" /><path d="M80 140L150 50H158L88 146Z" />
        </g>
      </>}
    </svg>
  );
}
