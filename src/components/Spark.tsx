import { useId } from 'react';

/** A small responsive line/area chart for price history. */
export function Spark({ pts, height = 160, labels }: { pts: { t: number; p: number }[]; height?: number; labels?: boolean }) {
  const id = useId();
  const W = 600;
  const H = height;
  const ps = pts.map((x) => x.p);
  const lo = Math.min(...ps);
  const hi = Math.max(...ps);
  const up = ps[ps.length - 1] >= ps[0];
  const col = up ? 'var(--up)' : 'var(--down)';
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (p: number) => 8 + ((hi - p) / (hi - lo || 1)) * (H - 16);
  const d = ps.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spark" preserveAspectRatio="none" role="img" aria-label={`Price ${up ? 'up' : 'down'} over the period`}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={col} stopOpacity="0.3" />
          <stop offset="1" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${W},${H}L0,${H}Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={col} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      {labels && (
        <>
          <text x={4} y={14}>{hi.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</text>
          <text x={4} y={H - 4}>{lo.toLocaleString('en-GB', { maximumFractionDigits: 2 })}</text>
        </>
      )}
    </svg>
  );
}
