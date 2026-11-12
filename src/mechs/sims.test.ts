import { describe, expect, it } from 'vitest';
import { RACE_DEBTS } from './novice';
import { afterFees, avgCost, bondPrice, grow, payoff, race, realValue } from './sims';

describe('mechanic maths', () => {
  it('compounds and deflates', () => {
    expect(grow(1000, 0.045, 10)).toBeCloseTo(1552.97, 1);
    expect(realValue(100, 0.03, 10)).toBeCloseTo(74.41, 1);
  });

  it('pays off debts, or never when the payment cannot beat the interest', () => {
    const cheap = payoff(1000, 0.045, 50);
    expect(cheap.months).toBe(21);
    expect(cheap.interest).toBeGreaterThan(0);
    expect(payoff(1000, 12.92, 50).months).toBe(Infinity);
  });

  it('avalanche pays less interest; snowball clears a debt sooner', () => {
    const a = race(RACE_DEBTS, 350, 'avalanche');
    const s = race(RACE_DEBTS, 350, 'snowball');
    expect(a.interest).toBeLessThan(s.interest);
    expect(s.firstClear).toBeLessThan(a.firstClear);
    expect(a.months.at(-1)!.balances.every((b) => b === 0)).toBe(true);
    expect(s.months.at(-1)!.balances.every((b) => b === 0)).toBe(true);
  });
});

describe('intermediate mechanic maths', () => {
  it('bond prices move against rates', () => {
    expect(bondPrice(1000, 0.04, 0.04, 10)).toBeCloseTo(1000, 6);
    expect(bondPrice(1000, 0.04, 0.06, 10)).toBeLessThan(1000);
    expect(bondPrice(1000, 0.04, 0.02, 10)).toBeGreaterThan(1000);
  });
  it('fees compound against you', () => {
    expect(afterFees(10000, 0.06, 0, 30)).toBeCloseTo(grow(10000, 0.06, 30), 6);
    expect(afterFees(10000, 0.06, 0.015, 30) / afterFees(10000, 0.06, 0.001, 30)).toBeLessThan(0.7);
  });
  it('a fixed amount buys at or below the average price', () => {
    expect(avgCost([10, 10])).toBe(10);
    expect(avgCost([5, 10, 15])).toBeLessThan(10);
  });
});
