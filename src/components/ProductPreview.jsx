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


// Shapes for the patterns, drawn around (0, 0).
// Daisy: five round petals; the centre shows the main color.
const daisy = (r, base, color) => <g>
  {Array.from({ length: 5 }, (_, i) => { const t = -Math.PI / 2 + i * 2 * Math.PI / 5; return <circle key={i} cx={f(.55 * r * Math.cos(t))} cy={f(.55 * r * Math.sin(t))} r={f(.45 * r)} fill={color} />; })}
  <circle r={f(.22 * r)} fill={base} />
</g>;
// Four-point sparkle with curved sides.
const sparkle = r => { const k = r * .18; return `M0 ${-r}Q${k} ${-k} ${r} 0Q${k} ${k} 0 ${r}Q${-k} ${k} ${-r} 0Q${-k} ${-k} 0 ${-r}Z`; };

function PatternFill({ id, kind, w, h, color, base }) {
  switch (kind) {
    case 'waves': { // even, smooth wavy stripes at a fixed size, so long covers look the same as short ones
      const per = 68, amp = 7, gap = 38, sw = 12;
      const x0 = -BLEED - per, n = Math.ceil((w + 2 * BLEED + 2 * per) / per);
      const wave = y => `M${x0} ${y}q${per / 4} ${-2 * amp} ${per / 2} 0` + `t${per / 2} 0`.repeat(n * 2 - 1);
      const rows = Array.from({ length: Math.ceil((h + 2 * BLEED) / gap) + 1 }, (_, i) => -BLEED + i * gap);
      return <g fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
        {rows.map(y => <path key={y} d={wave(y)} />)}
      </g>;
    }
    case 'flowers': // daisies on a staggered grid, slightly turned
      return <><defs><pattern id={id} width="58" height="58" patternUnits="userSpaceOnUse" patternTransform="translate(6 4)">
        <g transform="translate(14 14) rotate(8)">{daisy(13, base, color)}</g>
        <g transform="translate(43 43) rotate(-14)">{daisy(13, base, color)}</g>
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'grid': // thin lines, like a notebook grid
      return <><defs><pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="translate(9 9)">
        <path d="M0 0H34M0 0V34" stroke={color} strokeWidth="2.4" fill="none" />
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'sparkles': // scattered four-point sparkles in two sizes
      return <><defs><pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
        <path d={sparkle(11)} transform="translate(16 18)" fill={color} />
        <path d={sparkle(6)} transform="translate(46 12)" fill={color} />
        <path d={sparkle(8)} transform="translate(44 46)" fill={color} />
        <path d={sparkle(4.5)} transform="translate(14 50)" fill={color} />
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
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
        <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} base={base} /></g>
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
        ? <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} base={base} /></g> : null}
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
