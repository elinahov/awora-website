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
// Hand-placed sparkles [x, y, radius, rotation] on one tile; ones that cross an edge are wrapped so the tile is seamless.
const SPARK_TILE = 140;
const SPARKS = [
  [18, 22, 12, 0], [74, 12, 8, 16], [118, 42, 10, -12], [46, 64, 9, 22],
  [96, 90, 12, 6], [18, 106, 8, -18], [62, 118, 10, 10], [128, 128, 8, -6],
];
// Blobs: hand-drawn worm strokes and drops on one tile.
const BLOB_TILE = 150;
const BLOB_WORMS = [
  'M12 22C30 4 58 34 48 58C40 76 18 70 22 94',
  'M82 12C102 18 96 44 120 46C136 47 142 30 134 16',
  'M76 84C92 70 114 80 106 102C100 120 124 130 142 118',
  'M18 124C34 112 56 128 50 150',
];
const BLOB_DROPS = [[84, 52, 9, 7, 20], [56, 104, 8, 8, 0], [136, 80, 7, 10, -15], [110, 140, 10, 7, 10]];

// Cherries: a pair on curved stems with one leaf, drawn around the stem joint (0, 0); about 21 × 25 units.
const CHERRY = 'M0 0C1.8 -.8 4.4 -1 5.4 .6C6.6 2.6 6.4 6.4 4.4 8.4C2.6 10.2 -1.6 10.6 -4.2 9C-6.4 7.6 -7 4.4 -5.8 2C-4.8 .2 -2.2 .4 0 0Z';
const cherries = color => <g>
  <path d={`${CHERRY}`} transform="translate(-6.5 13.4)" fill={color} />
  <path d={`${CHERRY}`} transform="translate(7 13.4) scale(-1 1)" fill={color} />
  <path d="M0 0C-2 3 -3 6 -4.8 8.2C-5.8 10 -6.3 11.6 -6.6 13.4M0 0C1 4 2.2 7 4.6 9.6C5.8 11 6.6 12.2 7 13.4M0 0C.7 -1.2 1.3 -2 2.2 -2.3M.3 .1L4.4 1.4"
    fill="none" stroke={color} strokeWidth=".9" strokeLinecap="round" />
  <circle cx="2.3" cy="-2.3" r=".8" fill={color} />
  <path d="M4.4 1.4C5.2 0 6.8 -.6 8 .4C9.2 1.2 10.2 2.6 13.2 4.6C12 5.6 11 6.2 9 5.8C6.6 5.2 4.6 3.4 4.4 1.4Z" fill={color} />
</g>;
const CHERRY_TILE = 54, CHERRY_SCALE = .7;

// Confetti: short rounded strokes at random angles, scattered with a minimum gap. A fixed seed keeps
// every render (and the prerendered pages) identical; distances wrap around the tile so it repeats seamlessly.
const CONFETTI_TILE = 64;
const CONFETTI = (() => {
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const T = CONFETTI_TILE, pts = [];
  for (let tries = 0; tries < 4000 && pts.length < 16; tries++) {
    const x = rnd() * T, y = rnd() * T;
    const near = pts.some(p => { const dx = Math.min(Math.abs(p[0] - x), T - Math.abs(p[0] - x)), dy = Math.min(Math.abs(p[1] - y), T - Math.abs(p[1] - y)); return dx * dx + dy * dy < 13.5 ** 2; });
    if (!near) pts.push([f(x), f(y), Math.round(rnd() * 180)]);
  }
  return pts;
})();

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
    case 'sparkles': // loosely scattered, slightly turned sparkles on a large tile so the repeat doesn't read as a grid
      return <><defs><pattern id={id} width={SPARK_TILE} height={SPARK_TILE} patternUnits="userSpaceOnUse">
        {SPARKS.flatMap(([x, y, r, rot], i) => [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => {
          const X = x + dx * SPARK_TILE, Y = y + dy * SPARK_TILE;
          if (X + r < 0 || X - r > SPARK_TILE || Y + r < 0 || Y - r > SPARK_TILE) return null;
          return <path key={`${i}${dx}${dy}`} d={sparkle(r)} transform={`translate(${X} ${Y}) rotate(${rot})`} fill={color} />;
        })))}
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'blobs': // soft wiggly worms and drops, drawn as thick round strokes; copies around the tile keep it seamless
      return <><defs><pattern id={id} width={BLOB_TILE} height={BLOB_TILE} patternUnits="userSpaceOnUse" patternTransform="scale(.72) rotate(-8)">
        {[-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => <g key={`${dx}${dy}`} transform={`translate(${dx * BLOB_TILE} ${dy * BLOB_TILE})`}>
          <g fill="none" stroke={color} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round">
            {BLOB_WORMS.map(d => <path key={d} d={d} />)}
          </g>
          {BLOB_DROPS.map(([x, y, rx, ry, rot]) => <ellipse key={`${x}${y}`} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} fill={color} />)}
        </g>))}
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'halves': { // mid-century half circles: cells alternate between a left/right pair and a top/bottom pair, every other column shifted half a cell
      const C = 46, r = C / 2;
      const cell = (x, y, horiz) => horiz
        ? `M${x + C} ${y}A${r} ${r} 0 0 1 ${x} ${y}ZM${x} ${y + C}A${r} ${r} 0 0 1 ${x + C} ${y + C}Z`
        : `M${x} ${y}A${r} ${r} 0 0 1 ${x} ${y + C}ZM${x + C} ${y + C}A${r} ${r} 0 0 1 ${x + C} ${y}Z`;
      const d = [cell(0, 0, false), cell(0, C, true), cell(C, -r, true), cell(C, r, false), cell(C, C + r, true)].join('');
      return <><defs><pattern id={id} width={2 * C} height={2 * C} patternUnits="userSpaceOnUse" patternTransform="translate(-4 -6)"><path d={d} fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    }
    case 'cherries': // cherry pairs on a staggered grid, copies around the tile keep it seamless
      return <><defs><pattern id={id} width={CHERRY_TILE} height={CHERRY_TILE} patternUnits="userSpaceOnUse">
        {[-1, 0, 1].flatMap(dx => [-1, 0, 1].flatMap(dy => [[14, 12], [41, 39]].map(([x, y]) =>
          <g key={`${dx}${dy}${x}`} transform={`translate(${x + dx * CHERRY_TILE} ${y + dy * CHERRY_TILE}) scale(${CHERRY_SCALE})`}>{cherries(color)}</g>)))}
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'tiles': { // retro tiles: rounded squares in the main color; where four corners meet, a pointed star in the pattern color
      const C = 26, k = 11, q = 3.4, g = .12; // cell, corner length, how far the curve's handles stop short of the corner, hairline gap
      const a = g, b = C - g;
      const d = `M${a + k} ${a}H${b - k}C${b - q} ${a} ${b} ${a + q} ${b} ${a + k}V${b - k}C${b} ${b - q} ${b - q} ${b} ${b - k} ${b}`
        + `H${a + k}C${a + q} ${b} ${a} ${b - q} ${a} ${b - k}V${a + k}C${a} ${a + q} ${a + q} ${a} ${a + k} ${a}Z`;
      return <><defs><pattern id={id} width={C} height={C} patternUnits="userSpaceOnUse" patternTransform="translate(-3 -5)">
        <rect width={C} height={C} fill={color} /><path d={d} fill={base} />
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    }
    case 'confetti': // light confetti: short rounded strokes, copies around the tile keep it seamless
      return <><defs><pattern id={id} width={CONFETTI_TILE} height={CONFETTI_TILE} patternUnits="userSpaceOnUse">
        <g stroke={color} strokeWidth="2.4" strokeLinecap="round">
          {[-1, 0, 1].flatMap(dx => [-1, 0, 1].flatMap(dy => CONFETTI.map(([x, y, a]) =>
            <path key={`${dx}${dy}${x}`} d="M-2.6 0H2.6" transform={`translate(${x + dx * CONFETTI_TILE} ${y + dy * CONFETTI_TILE}) rotate(${a})`} />)))}
        </g>
      </pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'stripes':
      return <><defs><pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="9" height="20" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'dots': // polka dots on a diagonal (staggered) grid: every other row shifts by half a step
      return <><defs><pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="4.4" fill={color} /><circle cx="21" cy="21" r="4.4" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    case 'checks':
      return <><defs><pattern id={id} width="32" height="32" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill={color} /><rect x="16" y="16" width="16" height="16" fill={color} /></pattern></defs><rect x={-BLEED} y={-BLEED} width={w + 2 * BLEED} height={h + 2 * BLEED} fill={`url(#${id})`} /></>;
    default: return null;
  }
}

const EDGE = 'rgba(100,28,53,.22)';
// The darker side of an extruded part.
const sideOf = c => `color-mix(in srgb, ${c} 74%, #3A2430)`;

/* Toggle switch keys: each key is a slot in the cover with a lever (or a topper on it).
   Sizes in drawing units (1 unit ≈ 0.77 mm): slot 12 × 22 mm, toppers about 23 / 20 / 16 mm. */
const KEY_GAP = { 1: 0, 2: 30, 3: 24 }, TOPPER = { 1: 30, 2: 26, 3: 21 };
export function Lever({ id = 'none', cx, cy, size, fill, shadow }) {
  if (!id || id === 'none') return <Rocker cx={cx} cy={cy} size={size} fill={fill} shadow={shadow} />;
  const shape = (f, extra = {}) => <path d={leverPath(id, cx, cy, size)} fill={f} strokeLinejoin="round" {...extra} />;
  return <g>
    {shadow && <>
      <g transform="translate(3.5 5)" filter={`url(#${shadow})`} opacity=".38">{shape('#2A1A22')}</g>
      <g transform="translate(1.4 2)">{shape(sideOf(fill))}</g>
    </>}
    {shape(fill, { stroke: EDGE, strokeWidth: 1.2 })}
  </g>;
}

/* The plain key with no topper: the switch base sits under the cover and shows through a
   rounded opening (the cover's wall shades its top-left edge); a short rocker bar sticks up
   through it, flush with the opening's left side. */
function Rocker({ cx, cy, size = 30, fill, shadow }) {
  const cid = 'r' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const bw = f(size * .8), bh = f(bw * 1.27), x = cx - bw / 2, y = cy - bh / 2, th = f(bh * .32), rx = f(bw * .3);
  const hole = (dx = 0, dy = 0) => `M${f(x + dx + rx)} ${f(y + dy)}h${f(bw - 2 * rx)}a${rx} ${rx} 0 0 1 ${rx} ${rx}v${f(bh - 2 * rx)}a${rx} ${rx} 0 0 1 ${-rx} ${rx}h${f(2 * rx - bw)}a${rx} ${rx} 0 0 1 ${-rx} ${-rx}v${f(2 * rx - bh)}a${rx} ${rx} 0 0 1 ${rx} ${-rx}Z`;
  const bar = (c, extra = {}) => <rect x={x} y={cy - th / 2} width={f(bw * .85)} height={th} rx={th / 2} fill={c} {...extra} />;
  const wall = shadow ? [2.6, 3.6] : [1.6, 2.2];
  return <g>
    <defs><clipPath id={cid}><path d={hole()} /></clipPath></defs>
    <path d={hole()} fill={fill} />
    <g clipPath={`url(#${cid})`}>
      {/* everything outside the opening, nudged down-right: the cover's inner wall and its shadow */}
      <path d={`M${x - 20} ${y - 20}h${bw + 40}v${bh + 40}h${-bw - 40}Z${hole(...wall)}`} fillRule="evenodd" fill={sideOf(fill)} />
      {shadow && <path d={`M${x - 20} ${y - 20}h${bw + 40}v${bh + 40}h${-bw - 40}Z${hole(wall[0] + 2, wall[1] + 3)}`} fillRule="evenodd" fill="#2A1A22" opacity=".3" filter={`url(#${shadow})`} />}
      {shadow && <g transform="translate(2.6 3.6)" filter={`url(#${shadow})`} opacity=".45">{bar('#2A1A22')}</g>}
    </g>
    <path d={hole()} fill="none" stroke={EDGE} strokeWidth="1.2" />
    <g transform={shadow ? 'translate(1.6 2.2)' : 'translate(.8 1.1)'}>{bar(sideOf(fill))}</g>
    {bar(fill, { stroke: EDGE, strokeWidth: 1 })}
  </g>;
}

function Insert({ type, cx, cy, fill, levers = [], shadow }) {
  if (type === 'blank') return null;
  if (type === 'socket') return <g>
    {shadow && <>
      <circle cx={cx + 3} cy={cy + 4.5} r="30" fill="#2A1A22" opacity=".3" filter={`url(#${shadow})`} />
      <circle cx={cx + 1.2} cy={cy + 1.8} r="30" fill={sideOf(fill)} />
    </>}
    <circle cx={cx} cy={cy} r="30" fill={fill} stroke={EDGE} strokeWidth="1.2" />
    <rect x={cx - 5} y={cy - 29} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <rect x={cx - 5} y={cy + 24} width="10" height="5" rx="1.5" fill="rgba(58,36,48,.25)" />
    <circle cx={cx - 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
    <circle cx={cx + 11} cy={cy} r="4.2" fill="#3A2430" opacity=".75" />
  </g>;
  const n = +type.slice(1), gap = KEY_GAP[n], xs = Array.from({ length: n }, (_, i) => cx + (i - (n - 1) / 2) * gap);
  return <g>
    {xs.map((x, i) => levers[i] && levers[i] !== 'none' && <rect key={`s${i}`} x={x - 7.75} y={cy - 14.25} width="15.5" height="28.5" rx="7.75" fill="rgba(58,36,48,.45)" />)}
    {xs.map((x, i) => <Lever key={`l${i}`} id={levers[i]} cx={x} cy={cy} size={TOPPER[n]} fill={fill} shadow={shadow} />)}
  </g>;
}

// A topper on its own, for option tiles.
export function LeverIcon({ id, fill, className }) {
  return <svg className={className} viewBox="-20 -20 40 40" aria-hidden="true">
    {id === 'none'
      ? <Lever cx={0} cy={0} fill={fill} />
      : <Lever id={id} cx={0} cy={0} size={34} fill={fill} />}
  </svg>;
}

export default function ProductPreview({ config, className, title, realistic = false }) {
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
    const inserts = sh => config.slots.slice(0, n).map((t, i) => {
      const cx = v ? M + CELL / 2 : M + CELL * (i + .5), cy = v ? M + CELL * (i + .5) : M + CELL / 2;
      return <Insert key={i} type={t} cx={cx} cy={cy} fill={acc} levers={config.levers?.[i]} shadow={sh} />;
    });
    if (!realistic) return (
      <svg className={className} viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}`} role="img" aria-label={title}>
        <defs><clipPath id={`c${uid}`}><path d={d} transform={tf} /></clipPath></defs>
        <path d={d} transform={tf} fill={base} stroke={EDGE} strokeWidth="1" />
        <g clipPath={`url(#c${uid})`}><PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} base={base} /></g>
        {inserts()}
      </svg>
    );
    // Realistic: a printed plate with thickness, a soft cast shadow, a fine print grain and raised keys.
    const DEPTH = 7, EXTRA = 16;
    return (
      <svg className={className} viewBox={`${-pad} ${-pad} ${W + 2 * pad + EXTRA} ${H + 2 * pad + EXTRA}`} role="img" aria-label={title}>
        <defs>
          <clipPath id={`c${uid}`}><path d={d} transform={tf} /></clipPath>
          <filter id={`b${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" /></filter>
          <filter id={`k${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
          <filter id={`g${uid}`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" />
            <feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .14  0 0 0 0 .16  0 0 0 -1.4 .9" />
          </filter>
          <linearGradient id={`l${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".16" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#2A1A22" stopOpacity=".08" />
          </linearGradient>
        </defs>
        <g transform={`translate(${DEPTH + 9} ${DEPTH + 12})`} filter={`url(#b${uid})`} opacity=".28"><path d={d} transform={tf} fill="#2A1A22" /></g>
        {Array.from({ length: DEPTH }, (_, k) => <g key={k} transform={`translate(${DEPTH - k} ${DEPTH - k})`}>
          <path d={d} transform={tf} fill={sideOf(base)} stroke={k === 0 ? EDGE : 'none'} strokeWidth="1" />
        </g>)}
        <path d={d} transform={tf} fill={base} />
        <g clipPath={`url(#c${uid})`}>
          <PatternFill id={`p${uid}`} kind={config.pattern} w={W} h={H} color={pat} base={base} />
          <rect x={-BLEED} y={-BLEED} width={W + 2 * BLEED} height={H + 2 * BLEED} filter={`url(#g${uid})`} opacity=".5" />
          <rect x={-BLEED} y={-BLEED} width={W + 2 * BLEED} height={H + 2 * BLEED} fill={`url(#l${uid})`} />
        </g>
        <path d={d} transform={tf} fill="none" stroke={EDGE} strokeWidth="1" />
        {inserts(`k${uid}`)}
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
