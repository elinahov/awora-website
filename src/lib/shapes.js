/* Switch-cover outlines, shared by the live preview (ProductPreview.jsx) and the SVG export
   (scripts/build-shapes.mjs). Plain JS, no React.

   A cover with n sections is drawn in a horizontal l × s frame: s = CELL + 2M,
   l = n·CELL + 2M, and section i is centred at x = M + CELL·(i + .5), y = s / 2.
   Every outline is smooth: lobes are circle arcs joined by small concave fillets,
   and the wavy edge is a sine offset traced with a smooth spline. */

// Real sizes: a one-section cover sits on an 87 mm square frame (confirmed by the owner for
// Armenian square plates; the first Cloud STL used 90 mm, with a 106.2 mm outline, 2 mm face,
// 2 mm walls, 20 mm deep), and sections sit 71 mm apart, the standard centre distance of
// ganged flush boxes (DIN 49073 / Ø68 mm boxes). Shape outlines scale with the frame.
export const FRAME_MM = 87, PITCH_MM = 71;
export const CELL = 92, M = +(CELL * (FRAME_MM / PITCH_MM - 1) / 2).toFixed(3);
export const frame = n => ({ l: n * CELL + 2 * M, s: CELL + 2 * M });
export const MM = PITCH_MM / CELL; // millimetres per drawing unit
// How far each shape may spill past its frame (used for the viewBox).
export const PAD = { square: 4, circle: 20, clover: 14, cloud: 14, wavy: 6, flower: 28 };

export const f = n => +n.toFixed(2);

// Closed Catmull-Rom spline through pts, as cubic Béziers.
export function smoothClosed(pts) {
  const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

// Outer intersection of circles A and B ([x, y, r]), on the left of A→B (outside when the
// circles run clockwise on screen).
function meet(A, B) {
  const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
  const a = (d * d + A[2] * A[2] - B[2] * B[2]) / (2 * d), h = Math.sqrt(Math.max(0, A[2] * A[2] - a * a));
  return [A[0] + a * dx / d + h * dy / d, A[1] + a * dy / d - h * dx / d];
}
const toward = (C, P, r) => { const d = Math.hypot(P[0] - C[0], P[1] - C[1]); return [C[0] + (P[0] - C[0]) * r / d, C[1] + (P[1] - C[1]) * r / d]; };
const sweepOf = (C, p0, p1) => {
  const a = Math.atan2(p1[1] - C[1], p1[0] - C[0]) - Math.atan2(p0[1] - C[1], p0[0] - C[0]);
  return (a + 4 * Math.PI) % (2 * Math.PI);
};

/* Union of overlapping circles listed clockwise around the shape. The outline follows each
   circle's outer arc; where two neighbours meet, a concave fillet of radius rf rounds the notch. */
export function ring(cs, rf) {
  const n = cs.length;
  const joins = cs.map((A, i) => {
    const B = cs[(i + 1) % n], F = meet([A[0], A[1], A[2] + rf], [B[0], B[1], B[2] + rf]);
    return { a: toward(A, F, A[2]), b: toward(B, F, B[2]) }; // tangent points on A and on B
  });
  const start = joins[n - 1].b;
  let d = `M${f(start[0])} ${f(start[1])}`;
  cs.forEach((C, i) => {
    const p0 = joins[(i - 1 + n) % n].b, { a, b } = joins[i];
    d += `A${f(C[2])} ${f(C[2])} 0 ${sweepOf(C, p0, a) > Math.PI ? 1 : 0} 1 ${f(a[0])} ${f(a[1])}`;
    d += `A${f(rf)} ${f(rf)} 0 0 0 ${f(b[0])} ${f(b[1])}`;
  });
  return d + 'Z';
}

// k centres spread evenly from x0 to x1 at height y, radius r
const row = (x0, x1, y, k, r) => Array.from({ length: k }, (_, i) => [x0 + (x1 - x0) * (k > 1 ? i / (k - 1) : .5), y, r]);

/* Rounded rectangle [x0, y0]–[x1, y1] with corner radius r, walked clockwise from the middle
   of the top edge. at(t) gives the point and outward normal at distance t along the edge. */
function rrect(x0, y0, x1, y1, r) {
  const w = x1 - x0 - 2 * r, h = y1 - y0 - 2 * r, q = Math.PI * r / 2;
  const segs = [ // [length, fn(u) → [x, y, nx, ny]] starting at the top-left end of the top edge
    [w, u => [x0 + r + u, y0, 0, -1]],
    [q, u => { const a = -Math.PI / 2 + u / r; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [h, u => [x1, y0 + r + u, 1, 0]],
    [q, u => { const a = u / r; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [w, u => [x1 - r - u, y1, 0, 1]],
    [q, u => { const a = Math.PI / 2 + u / r; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }],
    [h, u => [x0, y1 - r - u, -1, 0]],
    [q, u => { const a = Math.PI + u / r; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; }]
  ];
  const per = segs.reduce((n, [len]) => n + len, 0);
  const at = t => {
    t = (((t + w / 2) % per) + per) % per; // t = 0 is the middle of the top edge
    for (const [len, fn] of segs) { if (t <= len) return fn(t); t -= len; }
    return segs[0][1](0);
  };
  return { per, at };
}

function petals(l, s) {
  const c = s / 2, e = l - s / 2, rho = s * .537, r = s * .167, { per, at } = rrect(c - rho, c - rho, e + rho, c + rho, rho);
  const k = Math.round(per / (2 * rho * Math.sin(Math.PI / 12)));
  return Array.from({ length: k }, (_, i) => { const [x, y] = at(i * per / k); return [x, y, r * (1 + .07 * Math.sin(i * 2.3))]; });
}

// Outer size of a shape in mm ([width, height], horizontal).
export function sizeMM(shape, n) {
  const { l, s } = frame(n), c = s / 2, e = l - s / 2;
  const [w, h] = {
    circle: () => [e - c + 2 * s * .636, 2 * s * .636],
    clover: () => [e - c + 2 * s * (.236 + .352), 2 * s * (.236 + .352)],
    cloud: () => [e - c + 2 * s * (.351 + .239), 2 * s * (.351 + .239)],
    flower: () => { const p = petals(l, s), xs = p.flatMap(([x, , r]) => [x - r, x + r]), ys = p.flatMap(([, y, r]) => [y - r, y + r]); return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; },
    wavy: () => [l + 2 * s * .019, s + 2 * s * .019]
  }[shape]?.() || [l, s];
  return [+(w * MM).toFixed(1), +(h * MM).toFixed(1)];
}

export function plate(shape, l, s) {
  const c = s / 2, e = l - s / 2; // centres of the first and last section
  switch (shape) {
    case 'circle': { // a circle round one section; a pill round several
      const R = s * .636;
      return `M${f(c)} ${f(c - R)}H${f(e)}A${f(R)} ${f(R)} 0 0 1 ${f(e)} ${f(c + R)}H${f(c)}A${f(R)} ${f(R)} 0 0 1 ${f(c)} ${f(c - R)}Z`;
    }
    case 'clover': { // two rows of big round lobes
      const dd = s * .236, R = s * .352, x0 = c - dd, x1 = e + dd, k = Math.round((x1 - x0) / (2 * dd)) + 1;
      return ring([...row(x0, x1, c - dd, k, R), ...row(x1, x0, c + dd, k, R)], s * .04);
    }
    case 'cloud': { // three lobes per side of a section; ratios measured from the STL
      const m = s * .351, R = s * .239, x0 = c - m, x1 = e + m, k = Math.round((x1 - x0) / m) + 1;
      return ring([...row(x0, x1, c - m, k, R), [x1, c, R], ...row(x1, x0, c + m, k, R), [x0, c, R]], s * .03);
    }
    case 'flower': return ring(petals(l, s), s * .022); // round petals on a circle or a pill
    case 'wavy': { // small even waves all round a rounded rectangle
      const amp = s * .019, { per, at } = rrect(0, 0, l, s, s * .07);
      const waves = Math.round(per / (s * .135)), N = waves * 8;
      return smoothClosed(Array.from({ length: N }, (_, i) => {
        const [x, y, nx, ny] = at(i * per / N), o = amp * Math.cos(2 * Math.PI * i / 8);
        return [x + nx * o, y + ny * o];
      }));
    }
    default: return `M0 0H${l}V${s}H0Z`; // square
  }
}

// Openings for the switch / socket of each section (frame-only exports).
export const OPENING = CELL - 10;
export const openings = n => {
  const { s } = frame(n), o = OPENING, y = (s - o) / 2;
  return Array.from({ length: n }, (_, i) => `M${f(M + CELL * (i + .5) - o / 2)} ${f(y)}h${o}v${o}h${-o}Z`).join('');
};

/* ---------- switch-lever toppers ----------
   A topper clips onto a toggle lever. leverPath gives its outline centred on (cx, cy),
   size = overall width. 'none' has no topper: the bare lever is drawn by the preview. */
export function leverPath(id, cx, cy, size) {
  const k = size / 2, P = (x, y) => [cx + x * k, cy + y * k];
  const C = (x, y, r) => [cx + x * k, cy + y * k, r * k];
  switch (id) {
    case 'circle': return `M${f(cx - k)} ${f(cy)}A${f(k)} ${f(k)} 0 1 0 ${f(cx + k)} ${f(cy)}A${f(k)} ${f(k)} 0 1 0 ${f(cx - k)} ${f(cy)}Z`;
    case 'heart': {
      const pts = [[0, .95], [-.35, .7, -1, .25, -1, -.3], [-1, -.72, -.68, -.95, -.38, -.95], [-.18, -.95, -.05, -.85, 0, -.7],
        [.05, -.85, .18, -.95, .38, -.95], [.68, -.95, 1, -.72, 1, -.3], [1, .25, .35, .7, 0, .95]];
      let d = `M${P(...pts[0]).map(f).join(' ')}`;
      for (const c of pts.slice(1)) d += `C${[P(c[0], c[1]), P(c[2], c[3]), P(c[4], c[5])].flat().map(f).join(' ')}`;
      return d + 'Z';
    }
    case 'cloud': return ring([C(-.56, .16, .4), C(-.2, -.24, .5), C(.3, -.17, .46), C(.6, .19, .37), C(.25, .4, .38), C(-.25, .4, .38)], k * .06);
    case 'clover': return ring([C(-.43, -.43, .56), C(.43, -.43, .56), C(.43, .43, .56), C(-.43, .43, .56)], k * .08);
    case 'flower': return ring(Array.from({ length: 12 }, (_, i) => { const t = -Math.PI / 2 + i * Math.PI / 6; return C(.76 * Math.cos(t), .76 * Math.sin(t), .25); }), k * .05);
    case 'sun': return 'M' + Array.from({ length: 24 }, (_, i) => {
      const t = -Math.PI / 2 + i * Math.PI / 12, r = i % 2 ? .68 : 1; return P(r * Math.cos(t), r * Math.sin(t)).map(f).join(' ');
    }).join('L') + 'Z';
    default: return '';
  }
}
