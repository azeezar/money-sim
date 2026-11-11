import { describe, expect, it } from 'vitest';
import { canTrade, unlocks } from '../lib/access';
import { defaultState } from '../state/store';
import { lessonPool } from './pool';

describe('lesson minigames', () => {
  it('draws content from the whole tier, or only finished lessons in under-18 mode', () => {
    const s = defaultState();
    const all = lessonPool('novice', s, false);
    expect(all.pairs.length).toBeGreaterThanOrEqual(6);
    expect(all.questions.length).toBeGreaterThanOrEqual(8);
    expect(lessonPool('novice', s, true).questions).toHaveLength(0);
    s.done['l1.1'] = true;
    const kid = lessonPool('novice', s, true);
    expect(kid.lessons).toBe(1);
    expect(kid.pairs.map((p) => p[0])).toContain('Net income');
    // True/false questions keep the correct answer first.
    expect(kid.questions.find((q) => q.q.startsWith('Small costs'))!.o[0]).toBe('False');
  });
});

describe('age and unlocks', () => {
  it('keeps Trade from under 18s and pops up sections as XP unlocks them', () => {
    const s = defaultState();
    s.dob = '2015-01-01';
    s.xp = 1000;
    expect(canTrade(s)).toBe(false);
    expect(unlocks(s).map((u) => u.id)).not.toContain('trade');
    s.dob = '2000-01-01';
    expect(canTrade(s)).toBe(true);
    s.xp = 60;
    expect(unlocks(s).map((u) => u.id)).toEqual(['tier-intermediate', 'portfolio']);
    s.xp = 0;
    expect(unlocks(s)).toEqual([]);
  });
});

describe('portfolio starting balance', () => {
  it('starts fresh with the chosen amount, clamped to £1–£10,000', async () => {
    const { startPortfolio } = await import('../state/actions');
    const { getState } = await import('../state/store');
    startPortfolio(250);
    expect(getState().portfolioStart).toBe(250);
    expect(getState().portfolio.cash).toBe(250);
    startPortfolio(0);
    expect(getState().portfolio.cash).toBe(1);
    startPortfolio(50000);
    expect(getState().portfolio.cash).toBe(10000);
  });
});

describe('trading accounts', () => {
  it('fast-forward moves only that account’s clock and fills orders on the way', async () => {
    const { startTrading, fastForward, placeTrade } = await import('../state/actions');
    const { getState } = await import('../state/store');
    const { priceAt } = await import('../lib/market');
    startTrading('trading', 5);
    expect(getState().trading.cash).toBe(10); // clamped to the £10 minimum
    startTrading('trading', 50_000);
    const now = Date.now();
    placeTrade('trading', { sym: 'BTCX', side: 'buy', type: 'market', qty: 0.1 });
    const px = priceAt('BTCX', now);
    placeTrade('trading', { sym: 'BTCX', side: 'sell', type: 'limit', qty: 0.1, price: Math.round(px * 1.0005 * 100) / 100 });
    const r = fastForward('trading', 30 * 24 * 3600_000);
    expect(getState().trading.offset).toBe(30 * 24 * 3600_000);
    expect(getState().tradingUk.offset ?? 0).toBe(0);
    expect(r.to - r.from).toBe(30 * 24 * 3600_000);
    expect(Number.isFinite(r.after)).toBe(true);
  });
});

describe('back to today', () => {
  it('restores the account as it was before the first fast-forward', async () => {
    const { startTrading, fastForward, placeTrade, backToToday } = await import('../state/actions');
    const { getState } = await import('../state/store');
    startTrading('tradingUk', 20_000);
    fastForward('tradingUk', 7 * 24 * 3600_000);
    fastForward('tradingUk', 24 * 3600_000);
    placeTrade('tradingUk', { sym: 'BTCX', side: 'buy', type: 'market', qty: 0.01 });
    expect(getState().tradingUk.history.length).toBe(1);
    backToToday('tradingUk');
    const a = getState().tradingUk;
    expect(a.offset).toBe(0);
    expect(a.history).toHaveLength(0);
    expect(a.cash).toBe(20_000);
    expect(a.saved).toBeUndefined();
    expect(a.mode).toBe('uk');
  });
});

describe('date of birth', () => {
  it('works out age from the birthday, not just the year', async () => {
    const { ageFrom, validAge } = await import('../lib/access');
    const now = new Date(2026, 10, 11); // 11 Nov 2026
    expect(ageFrom('2008-11-11', now)).toBe(18);
    expect(ageFrom('2008-11-12', now)).toBe(17);
    expect(ageFrom('2008-02-29', now)).toBe(18);
    expect(ageFrom('2010-02-31', now)).toBeNull();
    expect(ageFrom('', now)).toBeNull();
    expect(validAge(ageFrom('2030-01-01', now))).toBe(false);
    expect(validAge(ageFrom('2020-01-01', now))).toBe(true);
  });

  it('asks again for saves that only stored an age, and drops progress from retired lessons', async () => {
    const { hydrate } = await import('../state/store');
    const s = hydrate({ v: 2, age: 30, done: { 'novice-0': true, 'l1.1': true } } as never);
    expect(s.dob).toBeNull();
    expect('age' in s).toBe(false);
    expect(Object.keys(s.done)).toEqual(['l1.1']);
  });
});
