import { makeCats, summarise } from '../lib/budget';
import {
  CAPACITY,
  GAME_STAR_PLAYS_PER_DAY,
  HEART_REFILL_COST,
  LESSON_XP,
  MAX_HEARTS,
  ONE_REWARD_PER_CALENDAR_MONTH,
  PLACEMENT,
  PORTFOLIO_MAX_START,
  TRADE_FEE_RATE,
  TRADE_MAX_START,
  TRADE_MIN_START,
  TRADING_START_CASH,
} from '../lib/config';
import { priceAt, type MarketMode } from '../lib/market';
import { attachExits, clockOf, execute, fmtQty, place, processOrders, valueOf, type PlaceOpts, type Result } from '../lib/trading';
import { dayKey, uid } from '../lib/format';
import { levelFor, monthReward } from '../lib/progress';
import { profileFor } from '../data/profiles';
import { toast } from '../ui/toast';
import { addXP, touchDay } from './helpers';
import { freshAccount, freshGame, getState, update } from './store';
import type { Fill, GameId, MascotId, MonthRecord, Quiz, State } from './types';

/* ------------------------------------------------------------ onboarding */

export interface OnboardingDraft {
  name: string;
  /** Date of birth, YYYY-MM-DD. Left out on a quiz retake. */
  dob?: string;
  mascot: MascotId;
  quiz: Partial<Quiz>;
  startAmount: number;
  income: number;
  monthly: number;
  goalName: string;
  target: number;
}

export function completeOnboarding(d: OnboardingDraft, retake: boolean): void {
  update((s) => {
    s.quiz = d.quiz;
    s.profile = profileFor(d.quiz);
    s.name = d.name;
    if (d.dob !== undefined) s.dob = d.dob;
    s.mascot = d.mascot;
    if (retake) return;
    s.startAmount = d.startAmount;
    s.monthly = d.monthly;
    s.goal = { name: d.goalName, target: d.target, saved: d.startAmount };
    s.budget = { income: d.income, cats: makeCats(d.income, d.monthly), txns: [], history: [] };
    s.log = [{ t: 'Starting pot', a: d.startAmount }];
    // The quiz can give a head start on tiers. It counts as lifetime XP only, never as spendable XP.
    s.xp = PLACEMENT[d.quiz.know ?? 'new'] ?? 0;
    s.wallet = 0;
    s.stars = 10;
    s.onboarded = true;
  });
}

export const setMascot = (m: MascotId): void => update((s) => void (s.mascot = m));

/* ---------------------------------------------------------------- lessons */

export const loseHeart = (): void => update((s) => void (s.hearts = Math.max(0, s.hearts - 1)));

export function refillHearts(): boolean {
  let ok = false;
  update((s) => {
    if (s.stars >= HEART_REFILL_COST) {
      s.stars -= HEART_REFILL_COST;
      s.hearts = MAX_HEARTS;
      ok = true;
    }
  });
  return ok;
}

export function finishLesson(id: string, mistakes: number, replay: boolean): { gain: number; perfect: boolean } {
  const perfect = mistakes === 0;
  const gain = (replay ? LESSON_XP.replay : LESSON_XP.first) + (perfect ? LESSON_XP.perfect : 0);
  update((s) => {
    addXP(s, gain);
    s.done[id] = true;
    s.quests.lesson = 1;
    if (perfect) s.perfect++;
    touchDay(s);
  });
  return { gain, perfect };
}

/* ---------------------------------------------------------- pot and budget */

export function addDeposit(amount: number): void {
  update((s) => {
    s.goal.saved += amount;
    s.log.push({ t: 'Virtual deposit', a: amount });
  });
}

export function saveGoal(name: string, target: number): void {
  update((s) => {
    s.goal.name = name;
    s.goal.target = target;
  });
}

export function savePlan(income: number, monthly: number): void {
  update((s) => {
    s.budget.income = income;
    s.monthly = monthly;
  });
}

export function setPlanned(catId: string, planned: number): void {
  update((s) => {
    const c = s.budget.cats.find((x) => x.id === catId);
    if (c) c.planned = planned;
  });
}

/** Re-split the budget across the starter categories using the current income and savings target. */
export function autoPlan(): void {
  update((s) => {
    s.budget.cats = makeCats(s.budget.income, s.monthly);
  });
}

export function addTxn(cat: string, amount: number, note: string): void {
  update((s) => {
    s.budget.txns.push({ id: uid(), cat, amount, note });
    s.txnCount++;
    s.quests.budget = 1;
    touchDay(s);
  });
}

export function removeTxn(id: string): void {
  update((s) => {
    s.budget.txns = s.budget.txns.filter((t) => t.id !== id);
  });
}

/**
 * Close the open month. Saved = income - spent. The saved amount joins the pot, and
 * hitting the savings goal pays XP that lands in the wallet for spending on minigames.
 */
export function closeMonth(): MonthRecord | null {
  let rec: MonthRecord | null = null;
  update((s) => {
    if (!s.budget.txns.length) return;
    const b = s.budget;
    const { spent, saved } = summarise(b, s.monthly);
    const month = dayKey().slice(0, 7);
    const reward = monthReward(saved, s.monthly);
    let xp = reward.xp;
    if (ONE_REWARD_PER_CALENDAR_MONTH && s.rewardedMonths.includes(month)) xp = 0;
    else if (reward.hit) s.rewardedMonths.push(month);
    rec = { n: b.history.length + 1, income: b.income, spent, saved, target: s.monthly, hit: reward.hit, xp, closedOn: dayKey() };
    b.history.push(rec);
    b.txns = [];
    if (saved > 0) {
      s.goal.saved += saved;
      s.log.push({ t: `Month ${rec.n} · budget`, a: saved });
    }
    addXP(s, xp);
    s.quests.budget = 1;
    touchDay(s);
  });
  return rec;
}

/* -------------------------------------------------------------- minigames */

/** Move XP from the wallet into a game. Returns how much actually moved. */
export function transferXP(game: GameId, amount: number): number {
  let moved = 0;
  update((s) => {
    const g = (s.games[game] ??= freshGame());
    moved = Math.max(0, Math.min(amount, s.wallet, CAPACITY - g.invested));
    if (!moved) return;
    const before = levelFor(g.invested);
    s.wallet -= moved;
    g.invested += moved;
    const after = levelFor(g.invested);
    if (after > before) toast(`Level ${after} reached`);
  });
  return moved;
}

/** Record a finished play and pay stars. Returns the stars paid (0 once the daily limit is hit). */
export function finishGame(game: GameId, good: boolean, meta?: { steady?: boolean }): number {
  let stars = 0;
  update((s) => {
    const g = (s.games[game] ??= freshGame());
    const t = dayKey();
    if (g.day !== t) {
      g.day = t;
      g.rewarded = 0;
    }
    g.plays++;
    if (g.rewarded < GAME_STAR_PLAYS_PER_DAY) {
      stars = 1 + levelFor(g.invested) + (good ? 2 : 0);
      s.stars += stars;
      g.rewarded++;
    }
    if (game === 'risk') {
      s.riskRuns++;
      if (meta?.steady) s.steadyRuns++;
    }
    s.quests.game = 1;
    touchDay(s);
  });
  return stars;
}

/* ------------------------------------------------------- portfolio & trading */

/** Buy or sell in the long-term portfolio at today's price. No fees. `amount` is in pounds. */
export function portfolioTrade(sym: string, side: 'buy' | 'sell', amount: number): Result {
  let res: Result = { ok: false, msg: 'Nothing happened.' };
  update((s) => {
    const now = Date.now();
    const px = priceAt(sym, now);
    const held = s.portfolio.positions[sym]?.qty ?? 0;
    // Selling "everything" by value should not leave dust behind.
    const qty = side === 'sell' && amount >= held * px - 0.01 ? held : Math.floor((amount / px) * 1e6) / 1e6;
    res = execute(s.portfolio, sym, side, qty, px, 0, now);
    if (res.ok) touchDay(s);
  });
  toast(res.msg);
  return res;
}

export type TradeKey = 'trading' | 'tradingUk';
export const keyFor = (m: MarketMode): TradeKey => (m === 'uk' ? 'tradingUk' : 'trading');

export function placeTrade(key: TradeKey, o: PlaceOpts): Result {
  let res: Result = { ok: false, msg: 'Nothing happened.' };
  update((s) => {
    const now = clockOf(s[key]);
    processOrders(s[key], TRADE_FEE_RATE, now);
    res = place(s[key], o, TRADE_FEE_RATE, now);
    if (res.ok) touchDay(s);
  });
  toast(res.msg);
  return res;
}

export function cancelOrder(key: TradeKey, id: string): void {
  update((s) => {
    s[key].orders = s[key].orders.filter((o) => o.id !== id);
  });
}

export function closePosition(key: TradeKey, sym: string): void {
  const qty = getState()[key].positions[sym]?.qty;
  if (qty) placeTrade(key, { sym, side: 'sell', type: 'market', qty });
}

/** Add or replace the stop loss / take profit on an open position. */
export function setExits(key: TradeKey, sym: string, sl?: number, tp?: number): void {
  update((s) => {
    const pos = s[key].positions[sym];
    if (!pos) return;
    s[key].orders = s[key].orders.filter((o) => !(o.sym === sym && (o.label === 'Stop loss' || o.label === 'Take profit')));
    attachExits(s[key], sym, pos.qty, sl, tp, clockOf(s[key]));
  });
}

/** Fill pending orders whose price was reached, in both trading accounts. Called on a timer while the app is open. */
export function tickOrders(): void {
  const s = getState();
  const keys = (['trading', 'tradingUk'] as const).filter((k) => s[k].orders.length || Object.values(s[k].positions).some((p) => (p.lev ?? 1) > 1));
  if (!keys.length) return;
  let fills: Fill[] = [];
  update((d) => {
    fills = keys.flatMap((k) => processOrders(d[k], TRADE_FEE_RATE, clockOf(d[k])));
  });
  for (const f of fills) toast(`${f.note ?? 'Order'} filled: ${f.side} ${fmtQty(f.qty)} ${f.sym} at ${f.price}`);
}

/** Back to the present day: undo everything since the first fast-forward (fills, trades, orders). */
export function backToToday(key: TradeKey): void {
  update((s) => {
    const a = s[key];
    if (a.saved) s[key] = { ...a.saved, offset: 0 };
    else a.offset = 0;
    delete s[key].saved;
  });
}

export const setTradeMode = (m: MarketMode): void => update((s) => void (s.tradeMode = m));

/** Start a trading account again with a chosen balance. */
export function startTrading(key: TradeKey, amount: number): void {
  const cash = Math.min(TRADE_MAX_START, Math.max(TRADE_MIN_START, Math.round(amount)));
  update((s) => {
    s[key] = { ...freshAccount(cash, key === 'tradingUk' ? 'uk' : undefined), chosen: true };
  });
}

export interface ForwardResult {
  before: number;
  after: number;
  fills: Fill[];
  from: number;
  to: number;
}

/** Move one trading account's clock forward for good. Pending orders fill on the way, using the simulated prices. */
export function fastForward(key: TradeKey, ms: number): ForwardResult {
  let out!: ForwardResult;
  update((s) => {
    const a = s[key];
    const from = clockOf(a);
    processOrders(a, TRADE_FEE_RATE, from);
    // First jump away from the present: remember the account as it is now, so it can be restored.
    if (!a.offset) a.saved = structuredClone({ ...a, saved: undefined });
    const before = valueOf(a, from).value;
    a.offset = (a.offset ?? 0) + ms;
    const to = from + ms;
    const fills = processOrders(a, TRADE_FEE_RATE, to);
    out = { before, after: valueOf(a, to).value, fills, from, to };
  });
  return out;
}

export function toggleWatch(sym: string): void {
  update((s) => {
    s.watchlist = s.watchlist.includes(sym) ? s.watchlist.filter((x) => x !== sym) : [...s.watchlist, sym];
  });
}

export function resetAccount(which: 'portfolio' | TradeKey): void {
  update((s) => {
    s[which] = which === 'portfolio' ? freshAccount(s.portfolioStart) : freshAccount(s[which].start ?? TRADING_START_CASH, s[which].mode);
  });
}

/* ------------------------------------------------------------ reading list */

export function toggleRead(id: string): void {
  update((s) => {
    if (s.reading[id]) delete s.reading[id];
    else s.reading[id] = true;
  });
}

/* ------------------------------------------------------------------- admin */

/** Admin build only: change anything. */
export const adminEdit = (fn: (s: State) => void): void => update(fn);

/** Start the portfolio again with a chosen amount of virtual cash. Clears holdings and history. */
export function startPortfolio(amount: number): void {
  const cash = Math.min(PORTFOLIO_MAX_START, Math.max(1, Math.round(amount)));
  update((s) => {
    s.portfolioStart = cash;
    s.portfolio = freshAccount(cash);
  });
}

export const setDob = (dob: string): void => update((s) => void (s.dob = dob));
export const markSeen = (ids: string[]): void => update((s) => ids.forEach((id) => (s.seen[id] = true)));
