import { describe, expect, it } from 'vitest';
import type { Budget } from '../state/types';
import { makeCats, spentIn, summarise } from './budget';

describe('starter budget', () => {
  it('splits what is left after saving across the categories', () => {
    const cats = makeCats(2000, 400);
    const total = cats.reduce((a, c) => a + c.planned, 0);
    expect(Math.abs(total - 1600)).toBeLessThanOrEqual(cats.length); // rounding only
    expect(cats.some((c) => c.kind === 'need')).toBe(true);
    expect(cats.some((c) => c.kind === 'want')).toBe(true);
  });
  it('never plans negative money when saving exceeds income', () => {
    expect(makeCats(100, 500).every((c) => c.planned === 0)).toBe(true);
  });
});

describe('budget summary', () => {
  const budget = (spend: number[]): Budget => ({
    income: 2000,
    cats: makeCats(2000, 300),
    txns: spend.map((amount, i) => ({ id: String(i), cat: i % 2 ? 'fun' : 'rent', amount, note: '' })),
    history: [],
  });

  it('is on track while spending stays within income minus the savings target', () => {
    const s = summarise(budget([900, 400]), 300);
    expect(s.available).toBe(1700);
    expect(s.left).toBe(400);
    expect(s.saved).toBe(700);
    expect(s.onTrack).toBe(true);
  });
  it('flags the goal at risk once spending passes the allowance', () => {
    const s = summarise(budget([1500, 400]), 300);
    expect(s.left).toBe(-200);
    expect(s.onTrack).toBe(false);
    expect(s.saved).toBe(100);
  });
  it('sums spending per category', () => {
    const b = budget([100, 50, 25]);
    expect(spentIn(b.txns, 'rent')).toBe(125);
    expect(spentIn(b.txns, 'fun')).toBe(50);
  });
});
