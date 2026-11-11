import { describe, expect, it } from 'vitest';
import { freshAccount } from '../state/store';
import { priceAt, rangeBetween } from './market';
import { execute, place, positionSize, processOrders, triggered, valueOf } from './trading';
import type { Order } from '../state/types';

const T = Date.UTC(2026, 10, 11, 12, 0, 0);

describe('account rules', () => {
  it('buys, averages and sells with fees and realised P&L', () => {
    const a = freshAccount(10_000);
    expect(execute(a, 'X', 'buy', 10, 100, 0.001, T).ok).toBe(true);
    expect(a.cash).toBe(10_000 - 1000 - 1);
    execute(a, 'X', 'buy', 10, 120, 0, T);
    expect(a.positions.X.avg).toBe(110);
    const r = execute(a, 'X', 'sell', 20, 130, 0, T);
    expect(r.ok).toBe(true);
    expect(a.positions.X).toBeUndefined();
    expect(a.realised).toBe(400);
  });

  it('refuses to overspend or short sell', () => {
    const a = freshAccount(100);
    expect(execute(a, 'X', 'buy', 2, 100, 0, T).ok).toBe(false);
    expect(execute(a, 'X', 'sell', 1, 100, 0, T).ok).toBe(false);
  });

  it('knows which way each order triggers', () => {
    const o = (side: 'buy' | 'sell', type: 'limit' | 'stop'): Order => ({ id: 'a', sym: 'X', side, type, qty: 1, price: 100, placed: 0 });
    expect(triggered(o('buy', 'limit'), 99, 105)).toBe(true);
    expect(triggered(o('buy', 'limit'), 101, 105)).toBe(false);
    expect(triggered(o('buy', 'stop'), 90, 100)).toBe(true);
    expect(triggered(o('sell', 'limit'), 90, 99)).toBe(false);
    expect(triggered(o('sell', 'stop'), 99, 105)).toBe(true);
  });

  it('rejects limit orders on the wrong side of the price', () => {
    const a = freshAccount(100_000);
    const px = priceAt('NOVA', T);
    expect(place(a, { sym: 'NOVA', side: 'buy', type: 'limit', qty: 1, price: px * 1.1 }, 0, T).ok).toBe(false);
    expect(place(a, { sym: 'NOVA', side: 'buy', type: 'limit', qty: 1, price: px * 0.9 }, 0, T).ok).toBe(true);
    expect(a.orders).toHaveLength(1);
  });

  it('fills a stop loss once price falls to it, and cancels the linked take profit', () => {
    const a = freshAccount(1_000_000);
    const px = priceAt('VOLT', T);
    const later = T + 3 * 86_400_000;
    const { lo } = rangeBetween('VOLT', T, later);
    const sl = Math.round((lo + 0.0001) * 1000) / 1000 + 0.001; // just above the lowest price reached
    if (!(sl < px)) return; // price never dipped in this window; nothing to test
    const res = place(a, { sym: 'VOLT', side: 'buy', type: 'market', qty: 10, stopLoss: sl, takeProfit: px * 100 }, 0, T);
    expect(res.ok).toBe(true);
    expect(a.orders).toHaveLength(2);
    a.checked = T;
    const fills = processOrders(a, 0, later);
    expect(fills).toHaveLength(1);
    expect(fills[0].price).toBe(sl);
    expect(a.orders).toHaveLength(0);
    expect(a.positions.VOLT).toBeUndefined();
  });

  it('sizes positions by risk', () => {
    expect(positionSize(10_000, 1, 50, 48)).toBe(50);
    expect(positionSize(10_000, 1, 50, 50)).toBe(0);
  });

  it('values an account at market prices', () => {
    const a = freshAccount(500);
    a.positions.NOVA = { qty: 2, avg: 1 };
    const v = valueOf(a, T);
    expect(v.value).toBeCloseTo(500 + 2 * priceAt('NOVA', T), 6);
  });
});
