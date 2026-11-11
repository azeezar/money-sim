import { describe, expect, it } from 'vitest';
import { RACE_DEBTS } from './novice';
import { grow, payoff, race, realValue } from './sims';

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
