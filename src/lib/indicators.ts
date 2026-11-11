/** Technical indicators. Each returns an array aligned with the input, NaN where not enough data yet. */

export function sma(xs: number[], n: number): number[] {
  const out = new Array<number>(xs.length).fill(NaN);
  let sum = 0;
  for (let i = 0; i < xs.length; i++) {
    sum += xs[i];
    if (i >= n) sum -= xs[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

export function ema(xs: number[], n: number): number[] {
  const out = new Array<number>(xs.length).fill(NaN);
  const k = 2 / (n + 1);
  let prev = NaN;
  for (let i = 0; i < xs.length; i++) {
    if (i === n - 1) {
      let s = 0;
      for (let j = 0; j < n; j++) s += xs[j];
      prev = s / n;
    } else if (i >= n) prev = xs[i] * k + prev * (1 - k);
    if (i >= n - 1) out[i] = prev;
  }
  return out;
}

export function bollinger(xs: number[], n = 20, mult = 2): { mid: number[]; up: number[]; lo: number[] } {
  const mid = sma(xs, n);
  const up = mid.slice();
  const lo = mid.slice();
  for (let i = n - 1; i < xs.length; i++) {
    let v = 0;
    for (let j = i - n + 1; j <= i; j++) v += (xs[j] - mid[i]) ** 2;
    const sd = Math.sqrt(v / n);
    up[i] = mid[i] + mult * sd;
    lo[i] = mid[i] - mult * sd;
  }
  return { mid, up, lo };
}

/** Wilder's RSI, 0 to 100. */
export function rsi(xs: number[], n = 14): number[] {
  const out = new Array<number>(xs.length).fill(NaN);
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1];
    const g = Math.max(0, d);
    const l = Math.max(0, -d);
    if (i <= n) {
      gain += g / n;
      loss += l / n;
    } else {
      gain = (gain * (n - 1) + g) / n;
      loss = (loss * (n - 1) + l) / n;
    }
    if (i >= n) out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function macd(xs: number[], fast = 12, slow = 26, signal = 9): { line: number[]; signal: number[]; hist: number[] } {
  const f = ema(xs, fast);
  const s = ema(xs, slow);
  const line = xs.map((_, i) => f[i] - s[i]);
  const start = line.findIndex((v) => !Number.isNaN(v));
  const sig = new Array<number>(xs.length).fill(NaN);
  if (start >= 0) {
    const e = ema(line.slice(start), signal);
    for (let i = 0; i < e.length; i++) sig[start + i] = e[i];
  }
  return { line, signal: sig, hist: line.map((v, i) => v - sig[i]) };
}

/** Average true range: typical size of a candle including gaps. */
export function atr(h: number[], l: number[], c: number[], n = 14): number[] {
  const tr = h.map((hi, i) => (i === 0 ? hi - l[i] : Math.max(hi - l[i], Math.abs(hi - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
  return ema(tr, n);
}

/** Volume-weighted average price, cumulative over the data shown. */
export function vwap(h: number[], l: number[], c: number[], v: number[]): number[] {
  let pv = 0;
  let vv = 0;
  return c.map((ci, i) => {
    pv += ((h[i] + l[i] + ci) / 3) * v[i];
    vv += v[i];
    return vv ? pv / vv : NaN;
  });
}

/** Heikin Ashi candles smooth the noise to make trends easier to see. */
export function heikinAshi<T extends { o: number; h: number; l: number; c: number }>(cs: T[]): T[] {
  const out: T[] = [];
  cs.forEach((k, i) => {
    const c = (k.o + k.h + k.l + k.c) / 4;
    const o = i === 0 ? (k.o + k.c) / 2 : (out[i - 1].o + out[i - 1].c) / 2;
    out.push({ ...k, o, c, h: Math.max(k.h, o, c), l: Math.min(k.l, o, c) });
  });
  return out;
}
