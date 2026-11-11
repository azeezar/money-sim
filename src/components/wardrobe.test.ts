import { describe, expect, it } from 'vitest';
import { wear } from '../state/actions';
import { defaultState, getState, update } from '../state/store';
import { ANCHOR, ITEMS, SLOTS, item, nextUnlock } from './wardrobe';

describe('mascot wardrobe', () => {
  it('has a free default per slot that matches a new save', () => {
    const look = defaultState().look;
    for (const { slot } of SLOTS) expect(item(slot, look[slot])?.xp, slot).toBe(0);
  });

  it('has unique ids per slot and draws on every mascot', () => {
    for (const { slot } of SLOTS) {
      const ids = ITEMS.filter((i) => i.slot === slot).map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const i of ITEMS) for (const a of Object.values(ANCHOR)) expect(() => i.draw?.(a)).not.toThrow();
  });

  it('only lets you wear what your XP has unlocked', () => {
    update((s) => void (s.xp = 50));
    expect(wear('hat', 'crown')).toBe(false);
    expect(wear('hat', 'beanie')).toBe(true);
    expect(wear('hat', 'nope')).toBe(false);
    expect(getState().look.hat).toBe('beanie');
    expect(nextUnlock(50)?.xp).toBeGreaterThan(50);
    expect(nextUnlock(10_000)).toBeUndefined();
  });
});
