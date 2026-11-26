import { useId } from 'react';
import { useCatalog } from '../lib/catalog.jsx';
import { CELL, M, PAD, f, leverPath, plate, smoothClosed } from '../lib/shapes.js';

/* Flat SVG renderings of every product. They double as catalog images and as the
   live configurator preview, so they redraw from a config object:
   cover: { sections, slots[], shape, orientation, pattern, colors{base,pattern,accent} }
   tray|frame|mirror: { shape, pattern, colors } */

const P = 20, BLEED = 40;

/* ---------- path helpers ---------- */
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
      return <><defs><pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="9" height="20" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'dots':
      return <><defs><pattern id={id} width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="9.5" cy="9.5" r="4" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'checks':
      return <><defs><pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill={color} /><rect x="16" y="16" width="16" height="16" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    default: return null;
  }
}

const EDGE = 'rgba(100,28,53,.22)';

/* Toggle switch keys: each key is a slot in the cover with a lever (or a topper on it).
   Sizes in drawing units (1 unit ≈ 0.77 mm): slot 12 × 22 mm, toppers about 23 / 20 / 16 mm. */
const KEY_GAP = { 1: 0, 2: 30, 3: 24 }, TOPPER = { 1: 30, 2: 26, 3: 21 };
export function Lever({ id = 'none', cx, cy, size, fill }) {
  if (id && id !== 'none') return <path d={leverPath(id, cx, cy, size)} fill={fill} stroke={EDGE} strokeWidth="1.2" strokeLinejoin="round" />;
  return <g>
    <rect x={cx - 5} y={cy - 9} width="10" height="18" rx="2.5" fill={fill} stroke={EDGE} strokeWidth="1.2" />
    <rect x={cx - 5} y={cy - 9} width="10" height="6" rx="2.5" fill="#fff" opacity=".35" />
  </g>;
}

function Insert({ type, cx, cy, fill, levers = [] }) {
  if (type === 'blank') return null;
  if (type === 'socket') return <g>
    <circle cx={cx} cy={cy} r="30" fill={fill} stroke={EDGE} strokeWidth="1.2" />
    <rect x={cx - 5} y={cy - 29} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <rect x={cx - 5} y={cy + 24} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <circle cx={cx - 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
    <circle cx={cx + 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
  </g>;
  const n = +type.slice(1), gap = KEY_GAP[n], xs = Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * gap);
  return <g>
    {xs.map((x, i) => <rect key={`s${i}`} x={x - 7.75} y={cy - 14.25} width="15.5" height="28.5" rx="7.75" fill="rgba(58,36,48,.45)" />)}
    {xs.map((x, i) => <Lever key={`l${i}`} id={levers[i]} cx={x} cy={cy} size={TOPPER[n]} fill={fill} />)}
  </g>;
}

// A topper on its own, for option tiles.
export function LeverIcon({ id, fill, className }) {
  return <svg className={className} viewBox="-20 -20 40 40" aria-hidden="true">
    {id === 'none'
      ? <><rect x="-7.75" y="-14.25" width="15.5" height="28.5" rx="7.75" fill="rgba(58,36,48,.35)" /><Lever cx={0} cy={0} fill={fill} /></>
      : <Lever id={id} cx={0} cy={0} size={34} fill={fill} />}
  </svg>;
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
    const d = plate(config.shape, l, s);
    const tf = v ? `translate(${s} 0) rotate(90)` : undefined, pad = Math.max(P, PAD[config.shape] || 0);
    return (
      <svg className={className} viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}`} role="img" aria-label={title}>
        <defs><clipPath id={`c${uid}`}><path d={d} transform={tf} /></clipPath></defs>
        <path d={d} transform={tf} fill={base} stroke={EDGE} strokeWidth="1" />
        <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} /></g>
        {config.slots.slice(0, n).map((t, i) => {
          const cx = v ? M + CELL / 2 : M + CELL * (i + .5), cy = v ? M + CELL * (i + .5) : M + CELL / 2;
          return <Insert key={i} type={t} cx={cx} cy={cy} fill={acc} levers={config.levers?.[i]} />;
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
