// Exports every switch-cover shape as SVG (1–4 sections, solid and frame) into design/shapes/,
// plus playground.html: a self-contained page for trying the shapes in the filament colors.
// Run: npm run shapes
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MM, PAD, frame, openings, plate, sizeMM } from '../src/lib/shapes.js';
import { COLORS, COVER_SHAPES } from '../src/data/seed.js';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'design', 'shapes');
mkdirSync(out, { recursive: true });
for (const f of readdirSync(out)) if (f.endsWith('.svg')) unlinkSync(join(out, f));

const SECTIONS = [1, 2, 3, 4];

const DEFAULT = COLORS.find(c => c.id === 'burgundy')?.hex || '#641C35';

const data = {};
for (const { id, name } of COVER_SHAPES) {
  data[id] = { name: name.en, sizes: {} };
  for (const n of SECTIONS) {
    const { l, s } = frame(n), p = PAD[id] ?? 20;
    const box = [-p, -p, l + 2 * p, s + 2 * p];
    const outline = plate(id, l, s), holes = openings(n);
    const size = sizeMM(id, n);
    data[id].sizes[n] = { box, outline, holes, mm: size };
    // width/height in millimetres, so the file opens at true size
    const svg = (d, label) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}" width="${+(box[2] * MM).toFixed(2)}mm" height="${+(box[3] * MM).toFixed(2)}mm">
  <title>Awora cover: ${name.en}, ${n} section${n > 1 ? 's' : ''}${label}, ${size[0]} × ${size[1]} mm</title>
  <path id="cover" fill="${DEFAULT}" fill-rule="evenodd" d="${d}"/>
</svg>
`;
    writeFileSync(join(out, `${id}-${n}.svg`), svg(outline, ''));
    writeFileSync(join(out, `${id}-${n}-frame.svg`), svg(outline + holes, ', frame'));
  }
}

const filaments = COLORS.map(c => ({ id: c.id, hex: c.hex, name: c.name.en }));
const walls = [['Ivory', '#FFF9EF'], ['White', '#FFFFFF'], ['Petal', '#F3BDD0'], ['Periwinkle', '#B9C8EE'], ['Butter', '#F5D47E'], ['Mint', '#BFE0CB'], ['Grey', '#D9D6D2'], ['Mulberry', '#641C35']];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cover Shape Playground</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
  :root { --ink: #641C35; --paper: #FFF9EF; --line: rgba(100, 28, 53, .16); --wall: #FFF9EF; --cover: ${DEFAULT}; --hole: transparent; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.45 'Noto Sans', system-ui, sans-serif; }
  header { padding: 28px 24px 8px; max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 28px; margin: 0 0 4px; }
  header p { margin: 0; opacity: .75; }
  .controls { position: sticky; top: 0; z-index: 2; background: var(--paper); border-bottom: 1px solid var(--line); }
  .controls__in { max-width: 1200px; margin: 0 auto; padding: 14px 24px; display: grid; gap: 12px; }
  .ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .ctl > b { width: 110px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  .seg { display: inline-flex; border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
  .seg button { border: 0; background: none; color: inherit; font: inherit; padding: 6px 14px; cursor: pointer; }
  .seg button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
  .sw { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--line); cursor: pointer; padding: 0; position: relative; }
  .sw[aria-pressed="true"] { outline: 2px solid var(--ink); outline-offset: 2px; }
  .sw:focus-visible, .seg button:focus-visible, .dl:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  input[type=color] { width: 34px; height: 30px; border: 1px solid var(--line); border-radius: 8px; background: none; padding: 2px; cursor: pointer; }
  .name { font-size: 13px; min-width: 140px; opacity: .8; }
  main { max-width: 1200px; margin: 0 auto; padding: 20px 24px 60px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
  .card { border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: #fff; }
  .stage { background: var(--wall); aspect-ratio: 4 / 3; display: grid; place-items: center; padding: 18px; transition: background .2s; }
  .stage svg { width: 100%; height: 100%; }
  .stage path.cover { fill: var(--cover); transition: fill .2s; }
  .stage path.hole { fill: var(--hole); }
  .meta { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; }
  .dl { font: inherit; font-size: 13px; color: var(--ink); background: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .vert .stage svg { transform: rotate(90deg); }
  @media (max-width: 600px) { .ctl > b { width: 100%; } header, .controls__in, main { padding-left: 16px; padding-right: 16px; } main { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<header>
  <h1>Cover shape playground</h1>
  <p>Every Awora switch-cover shape at real size (one section sits on an 87 mm frame). Pick a filament and a wall color, then download the SVG you like.</p>
</header>
<div class="controls"><div class="controls__in">
  <div class="ctl"><b>Sections</b><div class="seg" id="sections"></div>
    <b style="width:auto;margin-left:12px">Style</b><div class="seg" id="style"></div>
    <b style="width:auto;margin-left:12px">Turn</b><div class="seg" id="turn"></div></div>
  <div class="ctl"><b>Cover</b><span id="covers"></span><input type="color" id="coverPick" aria-label="Custom cover color"><span class="name" id="coverName"></span></div>
  <div class="ctl"><b>Wall</b><span id="walls"></span><input type="color" id="wallPick" aria-label="Custom wall color"><span class="name" id="wallName"></span></div>
</div></div>
<main id="grid"></main>
<script>
const DATA = ${JSON.stringify(data)};
const MM = ${MM};
const FILAMENTS = ${JSON.stringify(filaments)};
const WALLS = ${JSON.stringify(walls)};
const state = { n: 1, style: 'solid', vert: false, cover: '${DEFAULT}', wall: '#FFF9EF' };
const root = document.documentElement, $ = id => document.getElementById(id);

function seg(el, opts, key) {
  el.innerHTML = opts.map(([v, label]) => '<button type="button" data-v="' + v + '">' + label + '</button>').join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; const v = b.dataset.v; state[key] = key === 'n' ? +v : key === 'vert' ? v === '1' : v; render(); };
}
seg($('sections'), [[1, '1'], [2, '2'], [3, '3'], [4, '4']], 'n');
seg($('style'), [['solid', 'Solid'], ['frame', 'Frame']], 'style');
seg($('turn'), [['0', 'Horizontal'], ['1', 'Vertical']], 'vert');

function swatches(el, list, key, nameEl) {
  el.innerHTML = list.map(([name, hex]) => '<button type="button" class="sw" style="background:' + hex + '" data-hex="' + hex + '" data-name="' + name + '" aria-label="' + name + '" title="' + name + '"></button> ').join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; state[key] = b.dataset.hex; render(); };
}
swatches($('covers'), FILAMENTS.map(c => [c.name, c.hex]), 'cover');
swatches($('walls'), WALLS, 'wall');
$('coverPick').oninput = e => { state.cover = e.target.value; render(); };
$('wallPick').oninput = e => { state.wall = e.target.value; render(); };

function svgFor(id, forDownload) {
  const { box, outline, holes } = DATA[id].sizes[state.n], frame = state.style === 'frame';
  let [x, y, w, h] = box, tf = '';
  if (forDownload && state.vert) { tf = ' transform="rotate(90 ' + (x + w / 2) + ' ' + (y + h / 2) + ')"'; const cx = x + w / 2, cy = y + h / 2; [x, y, w, h] = [cx - h / 2, cy - w / 2, h, w]; }
  const fill = forDownload ? ' fill="' + state.cover + '"' : ' class="cover"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + [x, y, w, h].join(' ') + '"' + (forDownload ? ' width="' + (w * MM).toFixed(2) + 'mm" height="' + (h * MM).toFixed(2) + 'mm"' : '') + ' role="img" aria-label="' + DATA[id].name + ' cover">' +
    '<path' + fill + tf + ' fill-rule="evenodd" d="' + outline + (frame ? holes : '') + '"/></svg>';
}

function mmLabel(id) { const [w, h] = DATA[id].sizes[state.n].mm; return (state.vert ? h + ' × ' + w : w + ' × ' + h) + ' mm'; }
function render() {
  root.style.setProperty('--cover', state.cover); root.style.setProperty('--wall', state.wall);
  document.body.classList.toggle('vert', state.vert);
  for (const [el, v] of [[$('sections'), state.n], [$('style'), state.style], [$('turn'), state.vert ? '1' : '0']])
    el.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v == v)));
  for (const [el, v, nameEl, pick] of [[$('covers'), state.cover, $('coverName'), $('coverPick')], [$('walls'), state.wall, $('wallName'), $('wallPick')]]) {
    let name = 'Custom ' + v.toUpperCase();
    el.querySelectorAll('button').forEach(b => { const on = b.dataset.hex.toLowerCase() === v.toLowerCase(); b.setAttribute('aria-pressed', String(on)); if (on) name = b.dataset.name + ' ' + v.toUpperCase(); });
    nameEl.textContent = name; pick.value = v;
  }
  $('grid').innerHTML = Object.keys(DATA).map(id =>
    '<figure class="card" style="margin:0"><div class="stage">' + svgFor(id) + '</div>' +
    '<figcaption class="meta"><span>' + DATA[id].name + ' <small style="opacity:.65">' + mmLabel(id) + '</small></span><button type="button" class="dl" data-id="' + id + '">Download SVG</button></figcaption></figure>').join('');
}
$('grid').onclick = e => {
  const b = e.target.closest('.dl'); if (!b) return;
  const id = b.dataset.id, blob = new Blob([svgFor(id, true)], { type: 'image/svg+xml' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'awora-' + id + '-' + state.n + (state.style === 'frame' ? '-frame' : '') + (state.vert ? '-vertical' : '') + '.svg';
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
render();
</script>
</body>
</html>
`;
writeFileSync(join(out, 'playground.html'), html);
console.log(`wrote ${COVER_SHAPES.length * SECTIONS.length * 2} SVGs and playground.html to design/shapes/`);
