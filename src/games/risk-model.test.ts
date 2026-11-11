import { describe, expect, it } from 'vitest';
import { choose, newRun, ret, simulate } from './risk-model';

/** Small deterministic generator so the tests are repeatable. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('risk model', () => {
  it('ends the run after the chosen number of years', () => {
    const rnd = seeded(1);
    let run = newRun(1000, 5);
    for (let i = 0; i < 5; i++) run = choose(run, 'fund', rnd);
    expect(run.over).toBe(true);
    expect(run.log).toHaveLength(5);
    expect(run.hist).toHaveLength(6);
    expect(run.sim).not.toBeNull();
  });

  it('keeps you level with the fund when you only pick the fund', () => {
    const rnd = seeded(2);
    let run = newRun(1000, 4);
    for (let i = 0; i < 4; i++) run = choose(run, 'fund', rnd);
    expect(run.bal).toBeCloseTo(run.ghost, 6);
  });

  it('never mutates the previous run', () => {
    const run = newRun(1000, 3);
    choose(run, 'share', seeded(3));
    expect(run.hist).toEqual([1000]);
    expect(run.log).toHaveLength(0);
  });

  it('shows leveraged trading ending far worse than the fund across many runs', () => {
    const rows = simulate(10, 1000, seeded(4), 2000);
    const by = Object.fromEntries(rows.map((r) => [r.s, r]));
    expect(by.lev.below).toBeGreaterThan(by.share.below);
    expect(by.share.below).toBeGreaterThan(by.fund.below);
    expect(by.lev.wiped).toBeGreaterThan(50);
    expect(by.fund.wiped).toBe(0);
  });

  it('keeps a year of fund returns inside its caps', () => {
    const rnd = seeded(5);
    for (let i = 0; i < 500; i++) {
      const r = ret('fund', rnd);
      expect(r).toBeGreaterThanOrEqual(-0.4);
      expect(r).toBeLessThanOrEqual(0.5);
    }
  });
});
