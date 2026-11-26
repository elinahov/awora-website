/* A painter's palette holding one color pair: three paint dabs (main color, pattern, accent)
   on a cream board with a thumb hole. Flat fills, no shadows (brand book). */
const BOARD = 'M32 3C48 3 61 12 61 25C61 36 52 41 45 40C40 39 38 42 39 45C40 49 36 50 31 49C14 48 3 39 3 26C3 12 16 3 32 3Z' +
  'M24.5 34A4.5 4.5 0 1 0 15.5 34A4.5 4.5 0 1 0 24.5 34Z';

// Round paint dabs: main color (largest), pattern, accent.
const DABS = [[19, 17, 7.5], [35, 12.5, 6.2], [47.5, 23, 5.6]];

export default function Palette({ colors }) {
  return (
    <svg className="palette" viewBox="0 0 64 52" aria-hidden="true">
      <path className="palette__board" d={BOARD} fillRule="evenodd" />
      {colors.map((c, i) => <circle key={i} cx={DABS[i][0]} cy={DABS[i][1]} r={DABS[i][2]} fill={c} className="palette__dab" />)}
    </svg>
  );
}
