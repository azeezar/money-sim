import { describe, expect, it } from 'vitest';
import { BUDGET_XP, CAPACITY, LADDER, LEVEL_COSTS } from './config';
import { isUnlocked, levelFor, levelProgress, monthReward, nextTier, tierIndex } from './progress';

describe('tier unlocks', () => {
  it('starts at Novice and unlocks each tier at its XP threshold', () => {
    expect(LADDER.map((t) => t.at)).toEqual([...LADDER.map((t) => t.at)].sort((a, b) => a - b));
    expect(tierIndex(0)).toBe(0);
    LADDER.forEach((t, i) => {
      expect(tierIndex(t.at)).toBe(i);
      if (t.at > 0) expect(tierIndex(t.at - 1)).toBe(i - 1);
    });
  });

  it('reports the next locked tier, then null when everything is open', () => {
    expect(nextTier(0)?.id).toBe('intermediate');
    expect(nextTier(LADDER[LADDER.length - 1].at)).toBeNull();
  });

  it('keeps the plan tier open from the start and locks the ladder tiers by XP', () => {
    expect(isUnlocked('plan', 0)).toBe(true);
    expect(isUnlocked('novice', 0)).toBe(true);
    expect(isUnlocked('advanced', 0)).toBe(false);
    expect(isUnlocked('advanced', LADDER[2].at)).toBe(true);
  });
});

describe('minigame levels', () => {
  it('starts at level 0 and needs the cumulative cost for each level', () => {
    expect(levelFor(0)).toBe(0);
    expect(levelFor(LEVEL_COSTS[0] - 1)).toBe(0);
    expect(levelFor(LEVEL_COSTS[0])).toBe(1);
    expect(levelFor(LEVEL_COSTS[0] + LEVEL_COSTS[1])).toBe(2);
    expect(levelFor(CAPACITY)).toBe(LEVEL_COSTS.length);
    expect(levelFor(CAPACITY + 999)).toBe(LEVEL_COSTS.length);
  });

  it('reports progress inside the current level', () => {
    expect(levelProgress(5)).toMatchObject({ level: 0, into: 5, need: LEVEL_COSTS[0], maxed: false });
    expect(levelProgress(LEVEL_COSTS[0] + 7)).toMatchObject({ level: 1, into: 7, need: LEVEL_COSTS[1] });
    expect(levelProgress(CAPACITY).maxed).toBe(true);
  });
});

describe('budget month reward', () => {
  it('pays only the logging XP when the goal is missed', () => {
    expect(monthReward(99, 100)).toEqual({ hit: false, xp: BUDGET_XP.logged });
  });
  it('pays the goal XP when the goal is hit exactly', () => {
    expect(monthReward(100, 100)).toEqual({ hit: true, xp: BUDGET_XP.logged + BUDGET_XP.hit });
  });
  it('adds the bonus for saving well over the goal', () => {
    expect(monthReward(120, 100).xp).toBe(BUDGET_XP.logged + BUDGET_XP.hit + BUDGET_XP.bonus);
  });
  it('never counts a zero target as hit', () => {
    expect(monthReward(500, 0).hit).toBe(false);
  });
});
