/** Pure maths behind the lesson mechanics and arcade games, kept apart so it can be tested. */

/** Balance after `years` of yearly compounding. */
export const grow = (p: number, rate: number, years: number): number => p * Math.pow(1 + rate, years);

/** What `amount` buys in today's money after `years` of `inflation`. */
export const realValue = (amount: number, inflation: number, years: number): number => amount / Math.pow(1 + inflation, years);

/** Months and total interest to clear `balance` at `apr`, paying `pay` a month. Infinity when the payment never beats the interest. */
export function payoff(balance: number, apr: number, pay: number): { months: number; interest: number } {
  const r = apr / 12;
  let b = balance;
  let interest = 0;
  let months = 0;
  while (b > 0.005) {
    const i = b * r;
    if (pay <= i || months >= 1200) return { months: Infinity, interest: Infinity };
    interest += i;
    b = b + i - pay;
    months++;
  }
  return { months, interest };
}

export interface Debt {
  name: string;
  balance: number;
  apr: number;
  min: number;
}

export interface RaceMonth {
  balances: number[];
  interest: number;
}

/**
 * Pays `budget` a month across `debts`: the minimum on each, every spare pound to the target.
 * Avalanche targets the highest APR, Snowball the smallest balance. Freed-up minimums roll into the target.
 */
export function race(debts: Debt[], budget: number, method: 'avalanche' | 'snowball'): { months: RaceMonth[]; interest: number; firstClear: number } {
  const b = debts.map((d) => d.balance);
  const months: RaceMonth[] = [];
  let interest = 0;
  let firstClear = 0;
  while (b.some((x) => x > 0.005) && months.length < 600) {
    let mi = 0;
    b.forEach((x, k) => {
      if (x <= 0) return;
      const i = (x * debts[k].apr) / 12;
      b[k] += i;
      mi += i;
    });
    let left = budget;
    b.forEach((x, k) => {
      if (x <= 0) return;
      const p = Math.min(x, debts[k].min, left);
      b[k] -= p;
      left -= p;
    });
    const open = b.map((x, k) => [x, k] as const).filter(([x]) => x > 0.005);
    open.sort((p, q) => (method === 'avalanche' ? debts[q[1]].apr - debts[p[1]].apr : p[0] - q[0]));
    for (const [, k] of open) {
      if (left <= 0) break;
      const p = Math.min(b[k], left);
      b[k] -= p;
      left -= p;
    }
    for (let k = 0; k < b.length; k++) if (b[k] < 0.005) b[k] = 0;
    interest += mi;
    months.push({ balances: b.slice(), interest });
    if (!firstClear && b.some((x, k) => x === 0 && debts[k].balance > 0)) firstClear = months.length;
  }
  return { months, interest, firstClear };
}

/** Price of a bond paying `coupon` (a rate) on `face` yearly for `years`, when new bonds yield `rate`. */
export function bondPrice(face: number, coupon: number, rate: number, years: number): number {
  let pv = 0;
  for (let t = 1; t <= years; t++) pv += (face * coupon) / Math.pow(1 + rate, t);
  return pv + face / Math.pow(1 + rate, years);
}

/** Pot after `years` at `gross` growth, with a yearly fee `fee` taken from the balance. */
export const afterFees = (p: number, gross: number, fee: number, years: number): number => p * Math.pow((1 + gross) * (1 - fee), years);

/** Pot left each year when withdrawing `first` (raised by `inflation` yearly) before each year's return. Stops at 0. */
export function drawdown(pot: number, first: number, inflation: number, rets: number[]): number[] {
  const out = [pot];
  let wd = first;
  for (const r of rets) {
    pot = Math.max(0, (pot - wd) * (1 + r));
    wd *= 1 + inflation;
    out.push(pot);
  }
  return out;
}

/** Return, volatility and Sharpe ratio of a mix, given each asset's return, volatility and pairwise correlations. */
export function mixStats(w: number[], r: number[], v: number[], corr: number[][], rf: number): { ret: number; vol: number; sharpe: number } {
  const ret = w.reduce((a, wi, i) => a + wi * r[i], 0);
  let varc = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) varc += w[i] * w[j] * v[i] * v[j] * corr[i][j];
  const vol = Math.sqrt(varc);
  return { ret, vol, sharpe: (ret - rf) / vol };
}
