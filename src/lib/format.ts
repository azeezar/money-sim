/** Whole pounds, e.g. £1,250. Use for goals and pot totals. */
export const gbp = (n: number): string =>
  (n < 0 ? '−' : '') + '£' + Math.abs(Math.round(n)).toLocaleString('en-GB');

/** Pounds with pence only when needed, e.g. £3.50 or £12. Use for budget lines. */
export const money = (n: number): string => {
  const a = Math.abs(n);
  const whole = Math.abs(a - Math.round(a)) < 0.005;
  const body = whole
    ? Math.round(a).toLocaleString('en-GB')
    : a.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (n < 0 ? '−' : '') + '£' + body;
};

/** Compact axis labels: £950, £2.6k, £1.2m. */
export const short = (v: number): string =>
  v >= 1e6 ? '£' + (v / 1e6).toFixed(1) + 'm' : v >= 1e4 ? '£' + Math.round(v / 1e3) + 'k' : v >= 1e3 ? '£' + (v / 1e3).toFixed(1) + 'k' : '£' + Math.round(v);

export const pct = (r: number): string => (r >= 0 ? '+' : '−') + Math.abs(Math.round(r * 100)) + '%';

/** Local calendar day as YYYY-MM-DD. offset=1 is yesterday. */
export const dayKey = (offset = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function shuffle<T>(a: readonly T[], rnd: () => number = Math.random): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const uid = (): string => Math.random().toString(36).slice(2, 9);
export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
