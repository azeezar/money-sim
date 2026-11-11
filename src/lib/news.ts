import { VERMANY } from '../data/vermany';
import { BY_SYM, dayOf, dayStart, HOUR, INSTRUMENTS, newsEvent } from './market';

export interface NewsItem {
  id: string;
  sym: string;
  /** When the story breaks (ms). */
  t: number;
  headline: string;
  body: string;
  tone: 'good' | 'bad' | 'neutral';
  major: boolean;
}

/** Sector-specific word for the templates. */
const THING: Record<string, string> = {
  Technology: 'robotics',
  Telecoms: 'fibre broadband',
  'Consumer staples': 'own-brand range',
  Financials: 'mortgage lending',
  Healthcare: 'heart drug',
  Automotive: 'electric SUV',
  Media: 'blockbuster game',
  Industrials: 'shipping fleet',
  Aerospace: 'jet engine',
  Energy: 'North Sea field',
  Utilities: 'pipe upgrade',
  Housebuilding: 'new homes',
  Retail: 'autumn collection',
  Beverages: 'premium gin',
  Mining: 'copper mine',
  Insurance: 'home insurance',
  Fintech: 'payments app',
  Software: 'cloud platform',
  Semiconductors: 'AI chip',
  Biotech: 'cancer trial',
  Travel: 'summer bookings',
  'Food producers': 'snack range',
  'Real estate': 'warehouse portfolio',
  Agriculture: 'fertiliser',
  Transport: 'parcel network',
};

const GOOD = [
  '{name} beats profit forecasts',
  '{name} wins major {thing} contract',
  'Analysts upgrade {name} to “buy”',
  '{name} raises full-year guidance',
  'Strong demand for {name}’s new {thing}',
  '{name} announces a share buyback',
  'Regulator approves {name}’s {thing} plans',
  '{name} reports record quarterly sales',
];
const BAD = [
  '{name} misses earnings expectations',
  '{name} issues a profit warning',
  'Analysts downgrade {name} to “sell”',
  'Regulator opens investigation into {name}’s {thing}',
  '{name} delays its {thing} launch',
  'Boss of {name} steps down unexpectedly',
  '{name} hit by supply chain problems',
  '{name} loses a key {thing} contract',
];
const CRYPTO_GOOD = ['{name} jumps as a big exchange lists it', 'Major payments firm starts accepting {name}', 'Network upgrade for {name} goes live smoothly', 'Large investment fund buys {name}'];
const CRYPTO_BAD = ['{name} slides after an exchange is hacked', 'Regulators warn investors about {name}', 'Large holder dumps {name}', '{name} network suffers an outage'];

function story(sym: string, day: number): NewsItem | null {
  const e = newsEvent(sym, day);
  if (!e) return null;
  const ins = BY_SYM[sym];
  const up = e.impact > 0;
  const list = ins.kind === 'crypto' ? (up ? CRYPTO_GOOD : CRYPTO_BAD) : up ? GOOD : BAD;
  const name = ins.kind === 'crypto' ? ins.name.replace(' (simulated)', '') : ins.name;
  const headline = list[Math.floor(e.pick * list.length)].replace('{name}', name).replace('{thing}', THING[ins.sector] ?? 'flagship product');
  const major = e.u > 0.6;
  const when = ins.kind === 'crypto' ? 'over the next day' : 'when the market opens tomorrow';
  return {
    id: `${sym}-${day}`,
    sym,
    t: dayStart(day) + e.hour * HOUR,
    headline,
    body: `${major ? 'A big story. ' : ''}Traders expect ${sym} to ${up ? 'rise' : 'fall'} ${when}.`,
    tone: up ? 'good' : 'bad',
    major,
  };
}

const custom: NewsItem[] = VERMANY.news.map((n, i) => ({
  id: `${VERMANY.sym}-c${i}`,
  sym: VERMANY.sym,
  t: Date.parse(n.date + 'T07:00:00Z'),
  headline: n.headline,
  body: n.body ?? '',
  tone: 'neutral',
  major: true,
}));

/** Stories from the last `days` days up to `now`, newest first. */
export function recentNews(now: number, days = 7, sym?: string): NewsItem[] {
  const syms = sym ? [sym] : INSTRUMENTS.map((i) => i.sym);
  const today = dayOf(now);
  const out: NewsItem[] = [];
  for (let d = today; d > today - days; d--) for (const s of syms) {
    const n = story(s, d);
    if (n && n.t <= now) out.push(n);
  }
  const from = dayStart(today - days + 1);
  for (const n of custom) if ((!sym || n.sym === sym) && n.t <= now && n.t >= from) out.push(n);
  return out.sort((a, b) => b.t - a.t);
}
