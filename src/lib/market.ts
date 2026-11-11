/**
 * Simulated market. Every price is a pure function of (symbol, time), built from layered
 * smooth noise at time scales from 30 seconds to two years. That means:
 *  - prices "move live" while the app is open, with no server;
 *  - every screen, timeframe and device sees the same price at the same moment;
 *  - pending orders can be checked for any stretch of time, even while the app was closed.
 *
 * None of this is real market data. The companies and tickers are invented.
 */

import { VERMANY } from '../data/vermany';
import { effTimeUk, isOpenUk, lastCloseUk, nextOpenUk } from './session';

export type Kind = 'stock' | 'fund' | 'index' | 'crypto' | 'commodity';
/** '24h': prices move all day, every day. 'uk': shares and funds only move during London market hours. */
export type MarketMode = '24h' | 'uk';

export interface Instrument {
  sym: string;
  name: string;
  kind: Kind;
  sector: string;
  /** Rough price level, in virtual pounds. */
  base: number;
  /** Yearly volatility, e.g. 0.25 = 25%. */
  vol: number;
  /** Yearly drift (trend), e.g. 0.06 = +6% a year on average. */
  drift: number;
  /** Earnings per share over the last year. Missing for things with no earnings. */
  eps?: number;
  /** Dividend paid per share each year. */
  dps?: number;
  /** Shares in issue, in millions. Used for market cap. */
  shares?: number;
  /** Yearly ongoing charge for funds, e.g. 0.002 = 0.2%. */
  ocf?: number;
  desc: string;
}

export const INSTRUMENTS: Instrument[] = [
  { sym: 'MSX', name: 'Money Sim 100 Index', kind: 'index', sector: 'Index', base: 7800, vol: 0.15, drift: 0.05, desc: 'A made-up index of the 100 largest simulated companies. It cannot be bought directly; track it with MSXF.' },
  { sym: 'MSXF', name: 'MSX 100 Tracker Fund', kind: 'fund', sector: 'Index fund', base: 7.8, vol: 0.15, drift: 0.05, dps: 0.24, ocf: 0.0015, desc: 'A low-cost fund that copies the MSX 100 index. Broad, cheap and diversified.' },
  { sym: 'WRLD', name: 'Global All-World Fund', kind: 'fund', sector: 'Index fund', base: 112, vol: 0.14, drift: 0.06, dps: 2.0, ocf: 0.002, desc: 'Thousands of companies across developed and emerging markets, in one fund.' },
  { sym: 'BOND', name: 'Gilt and Bond Fund', kind: 'fund', sector: 'Bonds', base: 98, vol: 0.06, drift: 0.02, dps: 3.4, ocf: 0.001, desc: 'Government and company bonds. Lower swings than shares, lower expected growth.' },
  { sym: 'TECH', name: 'Global Tech Fund', kind: 'fund', sector: 'Sector fund', base: 54, vol: 0.26, drift: 0.07, dps: 0.2, ocf: 0.0045, desc: 'Concentrated in technology companies. More growth potential, bigger swings.' },
  { sym: 'GREN', name: 'Clean Energy Fund', kind: 'fund', sector: 'Sector fund', base: 21, vol: 0.3, drift: 0.04, dps: 0.3, ocf: 0.006, desc: 'Renewable energy companies. A narrow theme, so it can swing hard.' },
  { sym: 'NOVA', name: 'Nova Robotics plc', kind: 'stock', sector: 'Technology', base: 182, vol: 0.38, drift: 0.09, eps: 4.1, dps: 0, shares: 640, desc: 'Fast-growing maker of warehouse robots. No dividend; reinvests all profit.' },
  { sym: 'ORBT', name: 'Orbit Telecom plc', kind: 'stock', sector: 'Telecoms', base: 96, vol: 0.2, drift: 0.02, eps: 7.6, dps: 5.2, shares: 2100, desc: 'Mature mobile and broadband network. Slow growth, high dividend.' },
  { sym: 'GRNE', name: 'Greenleaf Grocers plc', kind: 'stock', sector: 'Consumer staples', base: 312, vol: 0.18, drift: 0.04, eps: 21, dps: 9.5, shares: 900, desc: 'Supermarket chain. People buy food in good times and bad, so earnings are steady.' },
  { sym: 'BRKS', name: 'Brookside Bank plc', kind: 'stock', sector: 'Financials', base: 48, vol: 0.28, drift: 0.03, eps: 6.2, dps: 2.6, shares: 15800, desc: 'High-street bank. Profits rise and fall with interest rates and the economy.' },
  { sym: 'LUMA', name: 'Luma Pharmaceuticals plc', kind: 'stock', sector: 'Healthcare', base: 1240, vol: 0.24, drift: 0.06, eps: 52, dps: 28, shares: 1550, desc: 'Drug maker. New medicines can move the price sharply, in either direction.' },
  { sym: 'VOLT', name: 'Voltway Motors plc', kind: 'stock', sector: 'Automotive', base: 27, vol: 0.55, drift: 0.05, eps: 0.3, dps: 0, shares: 3200, desc: 'Electric car start-up. Tiny earnings and a very high P/E: priced on hopes for the future.' },
  { sym: 'PIXL', name: 'Pixel Play Games plc', kind: 'stock', sector: 'Media', base: 64, vol: 0.42, drift: 0.04, eps: 2.9, dps: 0.4, shares: 410, desc: 'Video game studio. Results depend on a few big releases.' },
  { sym: 'HRBR', name: 'Harbour Shipping plc', kind: 'stock', sector: 'Industrials', base: 410, vol: 0.32, drift: 0.02, eps: 58, dps: 22, shares: 120, desc: 'Container shipping. Very cyclical: a low P/E can mean the market expects profits to fall.' },
  { sym: 'AERO', name: 'Skyline Aerospace plc', kind: 'stock', sector: 'Aerospace', base: 640, vol: 0.27, drift: 0.05, eps: 31, dps: 9, shares: 520, desc: 'Builds aircraft engines and defence systems. Long contracts, big orders, slow to change.' },
  { sym: 'PETR', name: 'Northsea Petroleum plc', kind: 'stock', sector: 'Energy', base: 455, vol: 0.3, drift: 0.02, eps: 48, dps: 24, shares: 1900, desc: 'Oil and gas producer. Profits swing with the oil price.' },
  { sym: 'WATR', name: 'Riverside Water plc', kind: 'stock', sector: 'Utilities', base: 1050, vol: 0.15, drift: 0.02, eps: 55, dps: 44, shares: 260, desc: 'Regulated water supplier. Dull, steady and dividend-focused.' },
  { sym: 'HOME', name: 'Hearthstone Homes plc', kind: 'stock', sector: 'Housebuilding', base: 1420, vol: 0.32, drift: 0.03, eps: 120, dps: 60, shares: 110, desc: 'Housebuilder. Very sensitive to mortgage rates and the housing market.' },
  { sym: 'RETL', name: 'Highstreet Fashion Group plc', kind: 'stock', sector: 'Retail', base: 88, vol: 0.36, drift: 0.01, eps: 6.5, dps: 2.1, shares: 1300, desc: 'Clothing shops and online fashion. Depends on shoppers feeling flush.' },
  { sym: 'BREW', name: 'Old Mill Brewing plc', kind: 'stock', sector: 'Beverages', base: 2950, vol: 0.17, drift: 0.04, eps: 140, dps: 78, shares: 2300, desc: 'Beers and spirits sold worldwide. Strong brands, steady demand.' },
  { sym: 'MINE', name: 'Granite Mining plc', kind: 'stock', sector: 'Mining', base: 3900, vol: 0.34, drift: 0.03, eps: 420, dps: 230, shares: 1250, desc: 'Digs iron ore and copper. Follows commodity prices and global growth.' },
  { sym: 'INSR', name: 'Shield Insurance plc', kind: 'stock', sector: 'Insurance', base: 510, vol: 0.2, drift: 0.04, eps: 44, dps: 33, shares: 2700, desc: 'Home, car and life insurer. Pays a high dividend; storms and floods dent profits.' },
  { sym: 'PAYZ', name: 'Paywave plc', kind: 'stock', sector: 'Fintech', base: 34, vol: 0.5, drift: 0.07, eps: 0.6, dps: 0, shares: 2900, desc: 'App-based payments and current accounts. Growing fast, barely profitable.' },
  { sym: 'CLDX', name: 'Cloudex Software plc', kind: 'stock', sector: 'Software', base: 1180, vol: 0.33, drift: 0.08, eps: 26, dps: 4, shares: 330, desc: 'Business software sold by subscription. High margins and a high P/E.' },
  { sym: 'CHIP', name: 'Silicon Forge plc', kind: 'stock', sector: 'Semiconductors', base: 2240, vol: 0.45, drift: 0.09, eps: 64, dps: 6, shares: 450, desc: 'Designs computer chips. Booms and busts with demand for electronics and AI.' },
  { sym: 'BIOM', name: 'BioMarrow Therapeutics plc', kind: 'stock', sector: 'Biotech', base: 12, vol: 0.65, drift: 0.03, dps: 0, shares: 780, desc: 'Early-stage drug developer with no profits yet. Trial results can double or halve the price.' },
  { sym: 'TRVL', name: 'Jetaway Holidays plc', kind: 'stock', sector: 'Travel', base: 640, vol: 0.38, drift: 0.03, eps: 52, dps: 12, shares: 600, desc: 'Package holidays and a budget airline. Hit hard by fuel costs and downturns.' },
  { sym: 'FOOD', name: 'Crumb and Co plc', kind: 'stock', sector: 'Food producers', base: 215, vol: 0.19, drift: 0.04, eps: 14, dps: 7.5, shares: 870, desc: 'Bakes bread, biscuits and snacks for supermarkets. Defensive and steady.' },
  { sym: 'PROP', name: 'Citadel Property REIT', kind: 'stock', sector: 'Real estate', base: 760, vol: 0.22, drift: 0.02, eps: 41, dps: 36, shares: 950, desc: 'Owns offices and warehouses and pays out most of its rent as dividends.' },
  { sym: 'AGRI', name: 'Golden Field Agriculture plc', kind: 'stock', sector: 'Agriculture', base: 145, vol: 0.27, drift: 0.03, eps: 11, dps: 4.4, shares: 640, desc: 'Fertiliser and farm supplies. Weather and crop prices drive results.' },
  { sym: 'LOGI', name: 'Swiftline Logistics plc', kind: 'stock', sector: 'Transport', base: 330, vol: 0.29, drift: 0.04, eps: 20, dps: 8, shares: 720, desc: 'Parcel delivery and warehouses. Grows with online shopping.' },
  { sym: VERMANY.sym, name: VERMANY.name, kind: 'stock', sector: VERMANY.sector, base: VERMANY.prices[0]?.price ?? 100, vol: VERMANY.vol, drift: 0, dps: 0, desc: VERMANY.desc },
  { sym: 'BTCX', name: 'Bitcoin (simulated)', kind: 'crypto', sector: 'Crypto', base: 52000, vol: 0.7, drift: 0.05, desc: 'A simulated cryptocurrency. No earnings or dividends, extremely volatile, trades all day every day.' },
  { sym: 'ETHX', name: 'Ether (simulated)', kind: 'crypto', sector: 'Crypto', base: 2600, vol: 0.85, drift: 0.05, desc: 'A simulated smart-contract cryptocurrency. No earnings, extreme swings, trades 24 hours a day.' },
  { sym: 'SOLX', name: 'Solaris (simulated)', kind: 'crypto', sector: 'Crypto', base: 120, vol: 1.0, drift: 0.04, desc: 'A simulated fast-payments coin. Even more volatile than the big two.' },
  { sym: 'DOGX', name: 'Doggo Coin (simulated)', kind: 'crypto', sector: 'Crypto', base: 0.14, vol: 1.0, drift: 0.0, desc: 'A simulated meme coin. Moves on hype alone. Prices can halve or double in days.' },
  { sym: 'GOLD', name: 'Gold (per ounce)', kind: 'commodity', sector: 'Commodities', base: 1900, vol: 0.15, drift: 0.03, desc: 'Gold pays no income. People hold it as a store of value, especially in uncertain times.' },
];

export const BY_SYM: Record<string, Instrument> = Object.fromEntries(INSTRUMENTS.map((i) => [i.sym, i]));
export const TRADABLE = INSTRUMENTS.filter((i) => i.kind !== 'index');
/** Crypto and gold trade around the clock in both market modes. */
export const is24h = (sym: string): boolean => BY_SYM[sym]?.kind === 'crypto' || BY_SYM[sym]?.kind === 'commodity';
/** What the long-term portfolio can hold: funds and shares. */
export const INVESTABLE = INSTRUMENTS.filter((i) => i.kind === 'fund' || i.kind === 'stock');

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
/** Day zero for the price model. Keeps numbers small. */
const EPOCH = Date.UTC(2020, 0, 1);

/* ------------------------------------------------------------------ noise */

function seedOf(sym: string): number {
  let h = 2166136261;
  for (let i = 0; i < sym.length; i++) h = Math.imul(h ^ sym.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic value in [-1, 1] for (seed, integer cell). */
function hash(seed: number, cell: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(cell | 0, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

function smooth(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash(seed, i) * (1 - u) + hash(seed, i + 1) * u;
}

/** Octave periods in days: 30 s up to ~2 years, doubling each time. */
const PERIODS: number[] = [];
for (let p = 30 / 86400; p < 800; p *= 2) PERIODS.push(p);

const cache = new Map<string, { seed: number; amps: number[]; base: number; drift: number }>();
function model(sym: string) {
  let m = cache.get(sym);
  if (!m) {
    const ins = BY_SYM[sym];
    const seed = seedOf(sym);
    // Amplitude grows with sqrt(period), like a random walk, so short and long charts both look plausible.
    const amps = PERIODS.map((p) => 0.75 * ins.vol * Math.sqrt(p / 365));
    m = { seed, amps, base: ins.base, drift: ins.drift };
    cache.set(sym, m);
  }
  return m;
}

/**
 * Simulated price of `sym` at time `t` (ms since 1970).
 * In 'uk' mode shares and funds freeze outside London market hours and gap to the new price at the open.
 */
export function priceAt(sym: string, t: number, mode: MarketMode = '24h'): number {
  if (mode === 'uk' && !is24h(sym)) t = effTimeUk(t);
  const m = model(sym);
  const d = (t - EPOCH) / DAY;
  // VRMNY only gets short wiggles (under 30 days) so the hand-set prices stay in charge.
  const vr = sym === VERMANY.sym;
  let n = 0;
  for (let i = 0; i < PERIODS.length; i++) if (!vr || PERIODS[i] < 30) n += m.amps[i] * smooth(m.seed + i * 7919, d / PERIODS[i]);
  if (vr) return round(vermanyPrice(t, n), m.base);
  const x = m.drift * (d / 365) + n + newsLog(sym, t);
  return round(m.base * Math.exp(x), m.base);
}

/* ------------------------------------------------------------------- news */

export interface NewsEvent {
  /** Move applied to the price on the following day, e.g. 0.03 = +3%. */
  impact: number;
  /** UTC hour the story breaks. */
  hour: number;
  /** 0..1 strength, and a stable random number for picking words. */
  u: number;
  pick: number;
}

/** Chance of a story per company per day. */
const NEWS_CHANCE = 0.3;
/** News starts here, so prices from before it (and positions bought then) are unchanged. A month back covers the longest replay. */
const NEWS_FROM = Date.UTC(2026, 9, 1);

/** At least this many stories across all companies and coins every day. */
export const MIN_NEWS_PER_DAY = 2;

function makeEvent(sym: string, day: number): NewsEvent {
  const ins = BY_SYM[sym];
  const seed = seedOf(sym);
  const h = hash(seed ^ 0x2b7e, day);
  const u = Math.abs(h);
  return {
    impact: Math.sign(h || 1) * ins.vol * (0.02 + 0.08 * u * u),
    hour: 6 + Math.floor(((hash(seed ^ 0x77, day) + 1) / 2) * 14),
    u,
    pick: (hash(seed ^ 0x99, day) + 1) / 2,
  };
}

const NEWSY = () => INSTRUMENTS.filter((i) => (i.kind === 'stock' || i.kind === 'crypto') && i.sym !== VERMANY.sym).map((i) => i.sym);
const dayCache = new Map<number, Map<string, NewsEvent>>();

/** Every random story on one day. Each company has a NEWS_CHANCE; if fewer than MIN_NEWS_PER_DAY come up, random extra companies get one. */
function dayNews(day: number): Map<string, NewsEvent> {
  let m = dayCache.get(day);
  if (m) return m;
  m = new Map();
  if (dayStart(day) >= NEWS_FROM) {
    const syms = NEWSY();
    for (const sym of syms) if ((hash(seedOf(sym) ^ 0x51ed, day) + 1) / 2 <= NEWS_CHANCE) m.set(sym, makeEvent(sym, day));
    const rest = syms.filter((x) => !m!.has(x)).sort((x, y) => hash(seedOf(x) ^ 0x3c1, day) - hash(seedOf(y) ^ 0x3c1, day));
    while (m.size < MIN_NEWS_PER_DAY && rest.length) {
      const sym = rest.shift()!;
      m.set(sym, makeEvent(sym, day));
    }
  }
  if (dayCache.size > 5000) dayCache.clear();
  dayCache.set(day, m);
  return m;
}

/** The random news story for `sym` on day `day` (days since the model's epoch), or null. Same answer on every device. */
export function newsEvent(sym: string, day: number): NewsEvent | null {
  return dayNews(day).get(sym) ?? null;
}

export const dayOf = (t: number): number => Math.floor((t - EPOCH) / DAY);
export const dayStart = (day: number): number => EPOCH + day * DAY;

/** cum[sym][k] = total log move from news on days before k. */
const cum = new Map<string, number[]>();
function cumTo(sym: string, k: number): number {
  let a = cum.get(sym);
  if (!a) cum.set(sym, (a = [0]));
  while (a.length <= k) {
    const e = newsEvent(sym, a.length - 1);
    a.push(a[a.length - 1] + (e ? Math.log(1 + e.impact) : 0));
  }
  return a[k];
}

/** A day's news moves the price the next day, phased in over that day's first hour. */
function newsLog(sym: string, t: number): number {
  const day = dayOf(t);
  if (day < 1) return 0;
  const e = newsEvent(sym, day - 1);
  const ramp = Math.min(1, (t - dayStart(day)) / HOUR);
  return cumTo(sym, day - 1) + (e ? Math.log(1 + e.impact) * ramp : 0);
}

/* ---------------------------------------------------------------- VRMNY */

const vPts = VERMANY.prices.map((p) => ({ t: Date.parse(p.date + 'T08:00:00Z'), l: Math.log(p.price) })).sort((a, b) => a.t - b.t);

/** Passes exactly through each hand-set point; noise `n` fades out near the points. */
function vermanyPrice(t: number, n: number): number {
  if (!vPts.length) return 100 * Math.exp(n);
  let base: number;
  let dist: number;
  if (t <= vPts[0].t) (base = vPts[0].l), (dist = vPts[0].t - t);
  else if (t >= vPts[vPts.length - 1].t) (base = vPts[vPts.length - 1].l), (dist = t - vPts[vPts.length - 1].t);
  else {
    const i = vPts.findIndex((p) => p.t > t);
    const a = vPts[i - 1];
    const b = vPts[i];
    base = a.l + ((b.l - a.l) * (t - a.t)) / (b.t - a.t);
    dist = Math.min(t - a.t, b.t - t);
  }
  return Math.exp(base + n * Math.min(1, Math.sqrt(dist / (5 * DAY))));
}

/** Sensible precision for a price level: pence for most things, whole pounds for big numbers. */
export function round(p: number, level = p): number {
  const dp = level >= 1000 ? 2 : level >= 10 ? 2 : 3;
  const k = 10 ** dp;
  return Math.round(p * k) / k;
}

/* ---------------------------------------------------------------- candles */

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export const TIMEFRAMES = [
  { id: '1m', label: '1m', ms: MIN },
  { id: '5m', label: '5m', ms: 5 * MIN },
  { id: '15m', label: '15m', ms: 15 * MIN },
  { id: '1h', label: '1H', ms: HOUR },
  { id: '4h', label: '4H', ms: 4 * HOUR },
  { id: '1d', label: '1D', ms: DAY },
  { id: '1w', label: '1W', ms: 7 * DAY },
] as const;
export type TimeframeId = (typeof TIMEFRAMES)[number]['id'];

const SAMPLES = 14;

/** One candle covering [start, start + ms), cut off at `now` if still open. `from` is when trading actually began in it. */
export function candleAt(sym: string, start: number, ms: number, now: number, mode: MarketMode = '24h', from = start): Candle {
  const end = Math.min(start + ms, now);
  const o = priceAt(sym, from, mode);
  const c = priceAt(sym, end, mode);
  let h = Math.max(o, c);
  let l = Math.min(o, c);
  const n = Math.max(2, Math.round((SAMPLES * (end - from)) / ms));
  for (let i = 1; i < n; i++) {
    const p = priceAt(sym, from + ((end - from) * i) / n, mode);
    if (p > h) h = p;
    if (p < l) l = p;
  }
  const m = model(sym);
  const move = Math.abs(c - o) / o;
  const noise = 0.55 + 0.45 * Math.abs(hash(m.seed ^ 0xabc, Math.floor(start / ms)));
  const v = Math.round((ms / MIN) * 1000 * noise * (1 + move * 60) * Math.max(0.05, (end - start) / ms));
  return { t: start, o, h, l, c, v };
}

/** Closed candles never change, so they are cached. */
const closed = new Map<string, Candle>();

/** The last `count` candles up to `now`; the final one is still forming. In 'uk' mode, closed hours are skipped. */
export function candles(sym: string, ms: number, count: number, now = Date.now(), mode: MarketMode = '24h'): Candle[] {
  if (closed.size > 50_000) closed.clear();
  if (mode === 'uk' && !is24h(sym)) return ukCandles(sym, ms, count, now);
  const last = Math.floor(now / ms) * ms;
  const out: Candle[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const t = last - i * ms;
    if (t + ms <= now) {
      const key = sym + '|' + ms + '|' + t;
      let k = closed.get(key);
      if (!k) closed.set(key, (k = candleAt(sym, t, ms, now)));
      out.push(k);
    } else out.push(candleAt(sym, t, ms, now));
  }
  return out;
}

function ukCandles(sym: string, ms: number, count: number, now: number): Candle[] {
  const out: Candle[] = [];
  let t = Math.floor(now / ms) * ms;
  for (let guard = 0; out.length < count && guard < count * 40; guard++) {
    const end = Math.min(t + ms, now);
    const first = isOpenUk(t) ? t : nextOpenUk(t);
    if (first < end) {
      const key = sym + '|uk|' + ms + '|' + t;
      let k = t + ms <= now ? closed.get(key) : undefined;
      if (!k) {
        k = candleAt(sym, t, ms, now, 'uk', first);
        if (t + ms <= now) closed.set(key, k);
      }
      out.push(k);
      t -= ms;
    } else {
      // Whole bucket is outside market hours: jump back to the bucket holding the last close.
      t = Math.min(t - ms, Math.floor((lastCloseUk(t) - 1) / ms) * ms);
    }
  }
  return out.reverse();
}

/** Evenly spaced closing prices for small line charts. */
export function series(sym: string, span: number, points: number, now = Date.now()): { t: number; p: number }[] {
  const out = [];
  for (let i = 0; i <= points; i++) {
    const t = now - span + (span * i) / points;
    out.push({ t, p: priceAt(sym, t) });
  }
  return out;
}

/** Lowest and highest price touched between two times (sampled). */
export function rangeBetween(sym: string, from: number, to: number, mode: MarketMode = '24h'): { lo: number; hi: number } {
  if (to <= from) {
    const p = priceAt(sym, to, mode);
    return { lo: p, hi: p };
  }
  const n = Math.min(400, Math.max(4, Math.ceil((to - from) / (15 * 1000))));
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= n; i++) {
    const p = priceAt(sym, from + ((to - from) * i) / n, mode);
    if (p < lo) lo = p;
    if (p > hi) hi = p;
  }
  return { lo, hi };
}

/* ------------------------------------------------------------ fundamentals */

export interface Quote {
  price: number;
  /** Change over the last 24 hours. */
  chg: number;
  chgPct: number;
  dayHi: number;
  dayLo: number;
  yearHi: number;
  yearLo: number;
  pe: number | null;
  divYield: number | null;
  marketCap: number | null;
  earningsYield: number | null;
}

export function quote(sym: string, now = Date.now(), mode: MarketMode = '24h'): Quote {
  const ins = BY_SYM[sym];
  const price = priceAt(sym, now, mode);
  const prev = priceAt(sym, now - DAY, mode);
  const day = rangeBetween(sym, now - DAY, now, mode);
  let yearHi = -Infinity;
  let yearLo = Infinity;
  for (let i = 0; i <= 120; i++) {
    const p = priceAt(sym, now - (365 * DAY * i) / 120, mode);
    yearHi = Math.max(yearHi, p);
    yearLo = Math.min(yearLo, p);
  }
  yearHi = Math.max(yearHi, day.hi);
  yearLo = Math.min(yearLo, day.lo);
  return {
    price,
    chg: price - prev,
    chgPct: (price - prev) / prev,
    dayHi: day.hi,
    dayLo: day.lo,
    yearHi,
    yearLo,
    pe: ins.eps && ins.eps > 0 ? price / ins.eps : null,
    earningsYield: ins.eps && ins.eps > 0 ? ins.eps / price : null,
    divYield: ins.dps !== undefined ? ins.dps / price : null,
    marketCap: ins.shares ? price * ins.shares * 1e6 : null,
  };
}
