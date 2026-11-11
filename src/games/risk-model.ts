export type Strat = 'fund' | 'share' | 'lev';
export type Rnd = () => number;

export const STRAT: Record<Strat, { name: string; sub: string; tone: 'good' | 'coin' | 'bad' }> = {
  fund: { name: 'Global index fund', sub: 'Thousands of companies. Dull on purpose.', tone: 'good' },
  share: { name: 'One hot share', sub: 'Everything on a single company.', tone: 'coin' },
  lev: { name: '5× leveraged day trading', sub: 'Borrowed money, fast bets, high costs.', tone: 'bad' },
};

export function randn(rnd: Rnd): number {
  let u = 0;
  let v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * One year's return. These are made-up teaching odds, not market data:
 *  - fund: around +6% with moderate swings
 *  - share: a wide spread with a slightly negative typical outcome
 *  - lev: mostly big losses, occasionally a big win
 */
export function ret(k: Strat, rnd: Rnd = Math.random): number {
  if (k === 'fund') return Math.max(-0.4, Math.min(0.5, 0.06 + 0.15 * randn(rnd)));
  if (k === 'share') return Math.exp(-0.022 + 0.4 * randn(rnd)) - 1;
  const u = rnd();
  return u < 0.65 ? -(0.35 + 0.6 * rnd()) : u < 0.9 ? -0.15 + 0.4 * rnd() : 0.6 + 1.9 * rnd();
}

export interface SimRow {
  s: Strat;
  /** Median ending balance. */
  med: number;
  /** % of runs that ended below the start. */
  below: number;
  /** % of runs wiped out. */
  wiped: number;
}

export interface Run {
  start: number;
  years: number;
  bal: number;
  /** What the same money would be if the fund had been held every year. */
  ghost: number;
  hist: number[];
  gh: number[];
  log: { y: number; k: Strat; r: number; fr: number }[];
  over: boolean;
  wiped: boolean;
  sim: SimRow[] | null;
}

export const newRun = (start: number, years: number): Run => ({
  start, years, bal: start, ghost: start, hist: [start], gh: [start], log: [], over: false, wiped: false, sim: null,
});

export function simulate(years: number, start: number, rnd: Rnd = Math.random, n = 1000): SimRow[] {
  return (Object.keys(STRAT) as Strat[]).map((s) => {
    const f: number[] = [];
    for (let i = 0; i < n; i++) {
      let b = 1;
      for (let y = 0; y < years; y++) {
        b *= 1 + ret(s, rnd);
        if (b < 0.01) {
          b = 0;
          break;
        }
      }
      f.push(b);
    }
    f.sort((a, b) => a - b);
    return {
      s,
      med: f[Math.floor(n / 2)] * start,
      below: (f.filter((v) => v < 1).length / n) * 100,
      wiped: (f.filter((v) => v === 0).length / n) * 100,
    };
  });
}

/** Play one year. Returns a new run; the old one is not mutated. */
export function choose(run: Run, k: Strat, rnd: Rnd = Math.random): Run {
  if (run.over) return run;
  const fr = ret('fund', rnd);
  const r = k === 'fund' ? fr : ret(k, rnd);
  const next: Run = { ...run, hist: [...run.hist], gh: [...run.gh], log: [...run.log] };
  next.bal = run.bal * (1 + r);
  next.ghost = run.ghost * (1 + fr);
  if (next.bal < run.start * 0.01) next.bal = 0;
  next.hist.push(next.bal);
  next.gh.push(next.ghost);
  next.log.push({ y: next.log.length + 1, k, r, fr });
  if (next.bal === 0) {
    next.wiped = true;
    // Show what the fund would have done for the years that are left.
    while (next.gh.length < run.years + 1) {
      next.ghost *= 1 + ret('fund', rnd);
      next.gh.push(next.ghost);
    }
  }
  if (next.log.length >= run.years || next.wiped) {
    next.over = true;
    next.sim = simulate(run.years, run.start, rnd);
  }
  return next;
}
