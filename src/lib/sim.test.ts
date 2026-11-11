import { describe, expect, it } from 'vitest';
import { VERMANY } from '../data/vermany';
import { freshAccount } from '../state/store';
import { BY_SYM, candles, dayOf, dayStart, HOUR, INSTRUMENTS, MIN, newsEvent, priceAt } from './market';
import { recentNews } from './news';
import { isOpenUk, lastCloseUk, nextOpenUk } from './session';
import { place, processOrders } from './trading';

const utc = (s: string) => Date.parse(s + 'Z');

describe('UK market hours', () => {
  it('opens 08:00–16:30 London time on weekdays, in winter and summer', () => {
    expect(isOpenUk(utc('2026-11-11T08:00:00'))).toBe(true); // GMT
    expect(isOpenUk(utc('2026-11-11T07:59:00'))).toBe(false);
    expect(isOpenUk(utc('2026-11-11T16:29:00'))).toBe(true);
    expect(isOpenUk(utc('2026-11-11T16:30:00'))).toBe(false);
    expect(isOpenUk(utc('2026-07-15T07:00:00'))).toBe(true); // BST: 08:00 local
    expect(isOpenUk(utc('2026-07-15T15:30:00'))).toBe(false); // 16:30 local
    expect(isOpenUk(utc('2026-11-14T12:00:00'))).toBe(false); // Saturday
    expect(nextOpenUk(utc('2026-11-13T17:00:00'))).toBe(utc('2026-11-16T08:00:00')); // Fri evening -> Mon
    expect(lastCloseUk(utc('2026-11-15T12:00:00'))).toBe(utc('2026-11-13T16:30:00')); // Sun -> Fri close
  });

  it('freezes shares outside hours, keeps crypto moving, and skips closed candles', () => {
    const sat1 = utc('2026-11-14T10:00:00');
    const sat2 = utc('2026-11-14T20:00:00');
    expect(priceAt('NOVA', sat1, 'uk')).toBe(priceAt('NOVA', sat2, 'uk'));
    expect(priceAt('NOVA', sat1, 'uk')).toBe(priceAt('NOVA', utc('2026-11-13T16:30:00')));
    expect(priceAt('BTCX', sat1, 'uk')).toBe(priceAt('BTCX', sat1));
    const ks = candles('NOVA', HOUR, 30, utc('2026-11-16T12:00:00'), 'uk');
    expect(ks).toHaveLength(30);
    for (const k of ks) expect(isOpenUk(k.t) || isOpenUk(k.t + HOUR - 1)).toBe(true);
  });

  it('refuses market orders while closed but accepts limit orders', () => {
    const a = freshAccount(10_000, 'uk');
    const sat = utc('2026-11-14T10:00:00');
    expect(place(a, { sym: 'NOVA', side: 'buy', type: 'market', qty: 1 }, 0, sat).ok).toBe(false);
    expect(place(a, { sym: 'BTCX', side: 'buy', type: 'market', qty: 0.01 }, 0, sat).ok).toBe(true);
    const px = priceAt('NOVA', sat, 'uk');
    expect(place(a, { sym: 'NOVA', side: 'buy', type: 'limit', qty: 1, price: Math.floor(px * 0.5) }, 0, sat).ok).toBe(true);
    a.checked = sat;
    processOrders(a, 0, sat + 2 * HOUR);
    expect(a.orders).toHaveLength(1); // nothing traded on a Saturday
  });
});

describe('market and news', () => {
  it('has 25 companies plus VRMNY and 4 cryptos', () => {
    expect(INSTRUMENTS.filter((i) => i.kind === 'stock' && i.sym !== 'VRMNY')).toHaveLength(25);
    expect(INSTRUMENTS.filter((i) => i.kind === 'crypto')).toHaveLength(4);
    expect(new Set(INSTRUMENTS.map((i) => i.sym)).size).toBe(INSTRUMENTS.length);
  });

  it('moves the price the day after a story, in the story’s direction', () => {
    const today = dayOf(utc('2026-11-11T12:00:00'));
    let checked = 0;
    for (const ins of INSTRUMENTS) {
      for (let d = today - 60; d < today && checked < 40; d++) {
        const e = newsEvent(ins.sym, d);
        if (!e || Math.abs(e.impact) < 0.02) continue;
        // Within the first hour of the next day the news ramps in; compare the same instant with and without it is not possible,
        // so check the ramp alone: tiny noise over 1 hour vs a 2%+ news move.
        const a = priceAt(ins.sym, dayStart(d + 1));
        const b = priceAt(ins.sym, dayStart(d + 1) + HOUR);
        if (ins.vol > 0.5) continue; // very volatile coins can out-move the news in an hour
        expect(Math.sign(b - a), `${ins.sym} day ${d}`).toBe(Math.sign(e.impact));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
    expect(recentNews(utc('2026-11-11T23:00:00'), 7).length).toBeGreaterThan(20);
  });

  it('passes VRMNY exactly through the hand-set prices and shows its custom news', () => {
    for (const p of VERMANY.prices) expect(priceAt('VRMNY', Date.parse(p.date + 'T08:00:00Z'))).toBeCloseTo(p.price, 1);
    const n = VERMANY.news[0];
    expect(recentNews(Date.parse(n.date + 'T12:00:00Z'), 1, 'VRMNY').map((x) => x.headline)).toContain(n.headline);
    expect(BY_SYM.VRMNY.kind).toBe('stock');
  });

  it('keeps prices positive and finite for every instrument', () => {
    const t = utc('2026-11-11T12:00:00');
    for (const i of INSTRUMENTS) for (let k = -400; k <= 40; k += 20) {
      const p = priceAt(i.sym, t + k * 24 * HOUR + 7 * MIN);
      expect(Number.isFinite(p) && p > 0, i.sym).toBe(true);
    }
  });
});

describe('daily news minimum', () => {
  it('has at least 2 stories every day from 1 Oct 2026', () => {
    const start = dayOf(utc('2026-10-01T12:00:00'));
    for (let d = start; d < start + 200; d++) {
      const n = INSTRUMENTS.filter((i) => newsEvent(i.sym, d)).length;
      expect(n, `day ${d}`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('leverage', () => {
  it('takes only the margin, multiplies the gain, and liquidates at the margin', async () => {
    const { execute, liqPrice, valueOf } = await import('./trading');
    const a = freshAccount(1000);
    expect(execute(a, 'NOVA', 'buy', 10, 100, 0, 0, undefined, 5).ok).toBe(true); // £1,000 of shares for £200
    expect(a.cash).toBe(800);
    expect(a.positions.NOVA.lev).toBe(5);
    expect(execute(a, 'NOVA', 'buy', 1, 100, 0, 0).ok).toBe(false); // can't mix leverage
    expect(liqPrice(100, 5)).toBe(80);
    const r = execute(a, 'NOVA', 'sell', 10, 110, 0, 0);
    expect(r.ok && r.fill?.pnl).toBe(100); // +10% price = +50% on the £200 margin
    expect(a.cash).toBe(1100);

    const b = freshAccount(1000);
    execute(b, 'NOVA', 'buy', 10, 100, 0, 0, undefined, 50); // £20 margin
    b.positions.NOVA.avg = 100;
    expect(valueOf(b, 0).value).toBeGreaterThanOrEqual(980 - 1e-9);
    const loss = execute(b, 'NOVA', 'sell', 10, 50, 0, 0); // gapped far past liquidation
    expect(loss.ok && loss.fill?.pnl).toBe(-20); // loss capped at the margin
    expect(b.cash).toBe(980);
  });

  it('auto-closes a leveraged position when the price touches its liquidation level', async () => {
    const { processOrders, liqPrice } = await import('./trading');
    const t0 = utc('2026-11-11T12:00:00');
    const a = freshAccount(100_000);
    const px = priceAt('DOGX', t0);
    a.positions.DOGX = { qty: 10_000, avg: px * 1.5, lev: 50 }; // far above the price: already past liquidation
    a.cash -= (10_000 * px * 1.5) / 50;
    a.checked = t0;
    const fills = processOrders(a, 0, t0 + MIN);
    expect(fills[0]?.note).toBe('Liquidated (50×)');
    expect(a.positions.DOGX).toBeUndefined();
    expect(liqPrice(px * 1.5, 50)).toBeGreaterThan(px);
  });
});
