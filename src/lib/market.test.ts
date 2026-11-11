import { describe, expect, it } from 'vitest';
import { candles, DAY, INSTRUMENTS, MIN, priceAt, quote } from './market';

const T = Date.UTC(2026, 10, 11, 12, 0, 0);

describe('simulated market', () => {
  it('is deterministic: same symbol and time give the same price', () => {
    expect(priceAt('NOVA', T)).toBe(priceAt('NOVA', T));
    expect(priceAt('NOVA', T)).not.toBe(priceAt('ORBT', T));
  });

  it('keeps every instrument positive and near its base level over two years', () => {
    // VRMNY's prices are hand-set in src/data/vermany.ts, so it is not held to this range.
    for (const i of INSTRUMENTS.filter((x) => x.sym !== 'VRMNY')) {
      for (let k = 0; k < 100; k++) {
        const p = priceAt(i.sym, T - k * 7 * DAY);
        expect(p, i.sym).toBeGreaterThan(0);
        // Very volatile coins (over 70% a year) legitimately wander further.
        const band = i.vol > 0.7 ? 3 : 1;
        expect(p / i.base, i.sym).toBeGreaterThan(0.15 / band);
        expect(p / i.base, i.sym).toBeLessThan(6 * band);
      }
    }
  });

  it('moves from minute to minute', () => {
    const ps = new Set(Array.from({ length: 10 }, (_, k) => priceAt('NOVA', T + k * MIN)));
    expect(ps.size).toBeGreaterThan(5);
  });

  it('builds valid OHLC candles ending at now', () => {
    const cs = candles('BTCX', 5 * MIN, 50, T + 90_000);
    expect(cs).toHaveLength(50);
    for (const c of cs) {
      expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
      expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c));
      expect(c.v).toBeGreaterThan(0);
    }
    for (let i = 1; i < cs.length; i++) expect(cs[i].t - cs[i - 1].t).toBe(5 * MIN);
    expect(cs[cs.length - 1].c).toBe(priceAt('BTCX', T + 90_000));
  });

  it('computes P/E from price and earnings', () => {
    const q = quote('GRNE', T);
    expect(q.pe).toBeCloseTo(q.price / 21, 6);
    expect(quote('BTCX', T).pe).toBeNull();
    expect(q.yearHi).toBeGreaterThanOrEqual(q.price);
    expect(q.yearLo).toBeLessThanOrEqual(q.price);
  });
});
