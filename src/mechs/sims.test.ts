import { describe, expect, it } from 'vitest';
import { RACE_DEBTS } from './novice';
import { afterFees, bondPrice, drawdown, grow, mixStats, payoff, race, realValue } from './sims';

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
  it('the minimum payment trap', () => {
    expect(payoff(1500, 0.249, 40).months).toBe(74);
    expect(payoff(1500, 0.249, 140).months).toBeLessThanOrEqual(13);
    expect(payoff(1500, 0.249, 30).months).toBe(Infinity);
  });
});

describe('investor mechanic maths', () => {
  it('a bad start drains a pot that the same returns reversed would not', async () => {
    const { BEAR_FIRST } = await import('./investor');
    const bear = drawdown(500000, 22000, 0.025, BEAR_FIRST);
    const bull = drawdown(500000, 22000, 0.025, [...BEAR_FIRST].reverse());
    expect(bull.at(-1)!).toBeGreaterThan(bear.at(-1)! + 200000);
  });
  it('mixing uncorrelated assets beats either alone on Sharpe', () => {
    const corr = [[1, 0], [0, 1]];
    const a = mixStats([1, 0], [0.07, 0.07], [0.15, 0.15], corr, 0.02).sharpe;
    const ab = mixStats([0.5, 0.5], [0.07, 0.07], [0.15, 0.15], corr, 0.02).sharpe;
    expect(ab).toBeGreaterThan(a);
  });
});
