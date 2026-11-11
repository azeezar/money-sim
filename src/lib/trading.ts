/**
 * Pure account rules shared by the portfolio and the trading simulator.
 * Functions mutate the account passed in (a draft from the store) and return a result.
 * Long only: you can sell what you hold, not borrow to sell short.
 */
import { is24h, priceAt, rangeBetween, round } from './market';
import { isOpenUk, nextOpenUk } from './session';
import { uid } from './format';
import type { Account, Fill, Order, Side } from '../state/types';

export type Result = { ok: true; fill?: Fill; msg: string } | { ok: false; msg: string };

const EPS = 1e-9;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const LEVERAGE = [1, 2, 5, 25, 50] as const;

/** Price at which a leveraged long loses its whole margin and is closed. */
export const liqPrice = (avg: number, lev: number): number => avg * (1 - 1 / lev);

/**
 * Buy or sell `qty` units of `sym` at `price` right now.
 * With leverage `lev`, a buy only takes value ÷ lev from cash (the margin); the commission is on the full value.
 * Losses are capped at the margin (negative balance protection), so cash never goes below zero.
 */
export function execute(a: Account, sym: string, side: Side, qty: number, price: number, feeRate: number, t: number, note?: string, lev = 1): Result {
  if (!(qty > 0) || !Number.isFinite(qty)) return { ok: false, msg: 'Enter a quantity above zero.' };
  const value = qty * price;
  const fee = r2(value * feeRate);
  const pos = a.positions[sym];
  if (side === 'buy') {
    if (pos && (pos.lev ?? 1) !== lev) return { ok: false, msg: `You already hold ${sym} at ${pos.lev ?? 1}× leverage. Close it first, or buy at the same leverage.` };
    const cost = value / lev + fee;
    if (cost > a.cash + EPS) return { ok: false, msg: `Not enough cash. That needs £${r2(cost).toLocaleString('en-GB')}${lev > 1 ? ` (margin at ${lev}×)` : ''}.` };
    a.cash = r2(a.cash - cost);
    const held = pos?.qty ?? 0;
    const avg = held > 0 ? (pos!.avg * held + value) / (held + qty) : price;
    a.positions[sym] = { qty: held + qty, avg, ...(lev > 1 && { lev }) };
    const fill: Fill = { id: uid(), sym, side, qty, price, fee, t, note };
    a.history.unshift(fill);
    return { ok: true, fill, msg: `Bought ${fmtQty(qty)} ${sym}${lev > 1 ? ` at ${lev}×` : ''}` };
  }
  if (!pos || pos.qty < qty - EPS) return { ok: false, msg: `You only hold ${fmtQty(pos?.qty ?? 0)} ${sym}. This simulator does not allow short selling.` };
  const margin = (qty * pos.avg) / (pos.lev ?? 1);
  // Margin back plus the profit or loss, never less than nothing.
  const credit = r2(Math.max(0, margin + (price - pos.avg) * qty - fee));
  const pnl = r2(credit - margin);
  a.cash = r2(a.cash + credit);
  a.realised = r2(a.realised + pnl);
  const left = pos.qty - qty;
  if (left <= EPS) {
    delete a.positions[sym];
    // Protective orders make no sense once the position is gone.
    a.orders = a.orders.filter((o) => !(o.sym === sym && o.side === 'sell'));
  } else {
    a.positions[sym] = { ...pos, qty: left };
    trimSells(a, sym);
  }
  const fill: Fill = { id: uid(), sym, side, qty, price, fee, pnl, t, note };
  a.history.unshift(fill);
  return { ok: true, fill, msg: `Sold ${fmtQty(qty)} ${sym} (${pnl >= 0 ? '+' : '−'}£${Math.abs(pnl).toLocaleString('en-GB')})` };
}

/** Keep each pending sell no bigger than what is still held. */
function trimSells(a: Account, sym: string) {
  const held = a.positions[sym]?.qty ?? 0;
  for (const o of a.orders) if (o.sym === sym && o.side === 'sell' && o.qty > held) o.qty = held;
  a.orders = a.orders.filter((o) => o.qty > EPS);
}

export const fmtQty = (q: number): string => (Number.isInteger(q) ? q.toLocaleString('en-GB') : q.toLocaleString('en-GB', { maximumFractionDigits: 6 }));

/**
 * Would this order fill if the price touched [lo, hi]?
 *  buy limit  : buy at the limit or cheaper  -> fills when the low reaches it
 *  buy stop   : buy once price rises to stop -> fills when the high reaches it
 *  sell limit : sell at the limit or higher  -> fills when the high reaches it (take profit)
 *  sell stop  : sell once price falls to it  -> fills when the low reaches it (stop loss)
 */
export function triggered(o: Order, lo: number, hi: number): boolean {
  if (o.side === 'buy') return o.type === 'limit' ? lo <= o.price : hi >= o.price;
  return o.type === 'limit' ? hi >= o.price : lo <= o.price;
}

export interface PlaceOpts {
  sym: string;
  side: Side;
  type: 'market' | 'limit' | 'stop';
  qty: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  /** Leverage for a buy (1 = none). */
  lev?: number;
}

/** This account's clock: real time plus any fast-forward. */
export const clockOf = (a: Account, real = Date.now()): number => real + (a.offset ?? 0);

/** Is `sym` trading at time t in this account's market? */
export const marketOpen = (a: Account, sym: string, t: number): boolean => a.mode !== 'uk' || is24h(sym) || isOpenUk(t);

/** Validate and place an order. Market orders fill now; others wait in `orders`. */
export function place(a: Account, o: PlaceOpts, feeRate: number, now: number): Result {
  const px = priceAt(o.sym, now, a.mode);
  if (o.type === 'market' && !marketOpen(a, o.sym, now)) {
    const at = new Date(nextOpenUk(now)).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
    return { ok: false, msg: `The London market is closed until ${at}. Place a limit or stop order to trade at the open.` };
  }
  if (o.type !== 'market') {
    if (!(o.price && o.price > 0)) return { ok: false, msg: 'Enter a trigger price.' };
    if (!(o.qty > 0)) return { ok: false, msg: 'Enter a quantity above zero.' };
    if (o.side === 'sell') {
      const held = a.positions[o.sym]?.qty ?? 0;
      if (held < o.qty - EPS) return { ok: false, msg: `You only hold ${fmtQty(held)} ${o.sym}. This simulator does not allow short selling.` };
    } else if (o.qty * o.price * (1 / (o.lev ?? 1) + feeRate) > a.cash + EPS) {
      return { ok: false, msg: 'Not enough cash for this order at its trigger price.' };
    }
    const wrongSide =
      (o.side === 'buy' && o.type === 'limit' && o.price >= px) ||
      (o.side === 'buy' && o.type === 'stop' && o.price <= px) ||
      (o.side === 'sell' && o.type === 'limit' && o.price <= px) ||
      (o.side === 'sell' && o.type === 'stop' && o.price >= px);
    if (wrongSide) {
      const hint =
        o.type === 'limit'
          ? `A ${o.side} limit goes ${o.side === 'buy' ? 'below' : 'above'} the current price (${px}). Use a market order to trade now.`
          : `A ${o.side} stop goes ${o.side === 'buy' ? 'above' : 'below'} the current price (${px}).`;
      return { ok: false, msg: hint };
    }
    const lev = o.side === 'buy' && (o.lev ?? 1) > 1 ? o.lev : undefined;
    a.orders.push({ id: uid(), sym: o.sym, side: o.side, type: o.type, qty: o.qty, price: o.price, placed: now, label: `${o.side} ${o.type}${lev ? ` ${lev}×` : ''}`, ...(lev && { lev }) });
    return { ok: true, msg: `${o.side === 'buy' ? 'Buy' : 'Sell'} ${o.type} placed at ${o.price}` };
  }

  if (o.side === 'buy') {
    if (o.stopLoss !== undefined && o.stopLoss >= px) return { ok: false, msg: `Stop loss must be below the current price (${px}).` };
    const lev = o.lev ?? 1;
    if (lev > 1 && o.stopLoss !== undefined && o.stopLoss <= liqPrice(px, lev)) return { ok: false, msg: `At ${lev}× you would be liquidated at ${r2(liqPrice(px, lev))}, before that stop loss. Move the stop higher.` };
    if (o.takeProfit !== undefined && o.takeProfit <= px) return { ok: false, msg: `Take profit must be above the current price (${px}).` };
  }
  const res = execute(a, o.sym, o.side, o.qty, px, feeRate, now, undefined, o.side === 'buy' ? (o.lev ?? 1) : 1);
  if (res.ok && o.side === 'buy') attachExits(a, o.sym, o.qty, o.stopLoss, o.takeProfit, now);
  return res;
}

/** Add a stop loss and/or take profit for a bought quantity. When both exist, one filling cancels the other. */
export function attachExits(a: Account, sym: string, qty: number, sl: number | undefined, tp: number | undefined, now: number) {
  const oco = sl !== undefined && tp !== undefined ? uid() : undefined;
  if (sl !== undefined) a.orders.push({ id: uid(), sym, side: 'sell', type: 'stop', qty, price: sl, placed: now, oco, label: 'Stop loss' });
  if (tp !== undefined) a.orders.push({ id: uid(), sym, side: 'sell', type: 'limit', qty, price: tp, placed: now, oco, label: 'Take profit' });
}

/**
 * Fill any pending orders whose trigger price was touched since the last check.
 * Prices are a function of time, so this also catches up on time the app was closed.
 */
export function processOrders(a: Account, feeRate: number, now: number): Fill[] {
  const fills: Fill[] = [];
  const from = Math.max(a.checked || now, now - 30 * 86400_000);
  if (!a.orders.length && !Object.values(a.positions).some((p) => (p.lev ?? 1) > 1)) {
    a.checked = now;
    return fills;
  }
  const ranges = new Map<string, { lo: number; hi: number }>();
  for (const o of [...a.orders]) {
    if (!a.orders.includes(o)) continue; // cancelled by an OCO partner this pass
    const start = Math.max(from, o.placed);
    let r = ranges.get(o.sym + start);
    if (!r) ranges.set(o.sym + start, (r = rangeBetween(o.sym, start, now, a.mode)));
    if (!triggered(o, r.lo, r.hi)) continue;
    a.orders = a.orders.filter((x) => x.id !== o.id && !(o.oco && x.oco === o.oco));
    const res = execute(a, o.sym, o.side, o.qty, o.price, feeRate, now, o.label, o.side === 'buy' ? (o.lev ?? 1) : 1);
    if (res.ok && res.fill) fills.push(res.fill);
  }
  liquidate(a, feeRate, from, now, fills);
  a.checked = now;
  return fills;
}

/** Close any leveraged position whose price touched its liquidation level. */
function liquidate(a: Account, feeRate: number, from: number, now: number, fills: Fill[]) {
  for (const [sym, p] of Object.entries(a.positions)) {
    if (!p.lev || p.lev <= 1) continue;
    const liq = liqPrice(p.avg, p.lev);
    if (rangeBetween(sym, from, now, a.mode).lo > liq) continue;
    const res = execute(a, sym, 'sell', p.qty, round(liq), feeRate, now, `Liquidated (${p.lev}×)`);
    if (res.ok && res.fill) fills.push(res.fill);
  }
}

export interface AccountValue {
  cash: number;
  invested: number;
  value: number;
  /** Market value minus cost of open positions. */
  unrealised: number;
}

export function valueOf(a: Account, now: number): AccountValue {
  let invested = 0;
  let unrealised = 0;
  for (const [sym, p] of Object.entries(a.positions)) {
    const px = priceAt(sym, now, a.mode);
    const gain = (px - p.avg) * p.qty;
    // A leveraged position is worth its margin plus profit or loss (never below zero).
    invested += p.lev && p.lev > 1 ? Math.max(0, (p.qty * p.avg) / p.lev + gain) : p.qty * px;
    unrealised += gain;
  }
  return { cash: a.cash, invested, value: a.cash + invested, unrealised };
}

/** Units to buy so that hitting the stop loses `riskPct` of the account. */
export function positionSize(equity: number, riskPct: number, entry: number, stop: number): number {
  const perUnit = Math.abs(entry - stop);
  if (!(perUnit > 0) || !(equity > 0) || !(riskPct > 0)) return 0;
  return Math.floor((equity * riskPct) / 100 / perUnit);
}
