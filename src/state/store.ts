import { useSyncExternalStore } from 'react';
import { dayKey } from '../lib/format';
import { MAX_HEARTS, PORTFOLIO_START_CASH, TRADING_START_CASH } from '../lib/config';
import { ADMIN } from '../lib/mode';
import { findLesson } from '../data/lessons';
import { settle } from './settle';
import { ITEMS } from '../components/wardrobe';
import { toast } from '../ui/toast';
import type { MarketMode } from '../lib/market';
import type { Account, GameState, State } from './types';

/** The admin build keeps its own save so testing never touches a regular user's progress. */
const KEY = ADMIN ? 'money-sim-v2-admin' : 'money-sim-v2';
/** Saves from before the rename to Money Sim. Read once, then written under KEY. */
const OLD_KEY = 'kitty-academy-v2';

export const freshAccount = (cash: number, mode?: MarketMode): Account => ({ cash, positions: {}, orders: [], history: [], realised: 0, checked: Date.now(), start: cash, ...(mode && { mode }) });
export const DEFAULT_WATCHLIST = ['MSX', 'NOVA', 'ORBT', 'GRNE', 'BRKS', 'LUMA', 'VOLT', 'BTCX', 'GOLD'];

export const freshGame = (): GameState => ({ invested: 0, plays: 0, day: '', rewarded: 0 });

export function defaultState(): State {
  const t = dayKey();
  return {
    v: 2,
    onboarded: false,
    name: '',
    dob: null,
    mascot: 'cat',
    profile: 'steady',
    quiz: {},
    startAmount: 1000,
    monthly: 100,
    goal: { name: '', target: 0, saved: 0 },
    xp: 0,
    wallet: 0,
    stars: 0,
    hearts: MAX_HEARTS,
    heartsDay: t,
    streak: 0,
    lastDay: null,
    done: {},
    badges: {},
    perfect: 0,
    txnCount: 0,
    riskRuns: 0,
    steadyRuns: 0,
    budget: { income: 2000, cats: [], txns: [], history: [] },
    games: {},
    log: [],
    quests: { day: t, lesson: 0, budget: 0, game: 0, paid: {} },
    rewardedMonths: [],
    portfolio: freshAccount(PORTFOLIO_START_CASH),
    portfolioStart: PORTFOLIO_START_CASH,
    trading: freshAccount(TRADING_START_CASH),
    tradingUk: freshAccount(TRADING_START_CASH, 'uk'),
    tradeMode: '24h',
    reading: {},
    readingHidden: false,
    look: { color: 'classic', hat: 'none', eyes: 'none', neck: 'none', nick: '' },
    watchlist: DEFAULT_WATCHLIST.slice(),
    seen: {},
    reminder: false,
  };
}

/** Hearts refill and quests reset when a new local day starts. */
function rollover(s: State): void {
  const t = dayKey();
  if (s.heartsDay !== t) {
    s.hearts = MAX_HEARTS;
    s.heartsDay = t;
  }
  if (s.quests.day !== t) s.quests = { day: t, lesson: 0, budget: 0, game: 0, paid: {} };
}

function load(): State {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<State>;
      if (p && p.v === 2) return hydrate(p);
    }
  } catch {
    /* ignore corrupt or unavailable storage */
  }
  return base;
}

/** Fill gaps in an older or hand-edited save with defaults, and migrate renamed ids. */
export function hydrate(p: Partial<State>): State {
  const base = defaultState();
  const merged: State = {
    ...base,
    ...p,
    games: { ...base.games },
    budget: { ...base.budget, ...p.budget },
    portfolio: { ...base.portfolio, ...p.portfolio },
    trading: { ...base.trading, ...p.trading },
    tradingUk: { ...base.tradingUk, ...p.tradingUk, mode: 'uk' },
    reading: { ...p.reading },
    look: { ...base.look, ...p.look },
    seen: { ...p.seen },
    watchlist: p.watchlist?.length ? p.watchlist : base.watchlist,
  } as State;
  for (const [g, v] of Object.entries(p.games ?? {})) merged.games[g] = { ...freshGame(), ...v };
  // The "Knowledgeable" tier was renamed "Investor".
  const done: Record<string, true> = {};
  // Lessons from before the 32-lesson curriculum no longer exist, so their progress is dropped.
  for (const id of Object.keys(merged.done ?? {})) if (findLesson(id)) done[id] = true;
  merged.done = done;
  if (merged.badges?.knowledgeable) {
    merged.badges = { ...merged.badges, investor: true };
    delete merged.badges.knowledgeable;
  }
  // Saves from before date of birth was asked held a plain age. Drop it so the app asks for the date once.
  delete (merged as Partial<State> & { age?: unknown }).age;
  rollover(merged);
  return merged;
}

let state: State = load();
const subs = new Set<() => void>();

export const getState = (): State => state;

export const subscribe = (f: () => void): (() => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

function commit(next: State): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage can be blocked; the app still works in memory */
  }
  subs.forEach((f) => f());
}

/** Apply a change. `fn` may mutate the draft freely; the store keeps state immutable between calls. */
export function update(fn: (s: State) => void): void {
  const s = structuredClone(state);
  rollover(s);
  fn(s);
  settle(s);
  for (const i of ITEMS) if (i.xp > state.xp && i.xp <= s.xp) toast(`Wardrobe unlock: ${i.name}! Dress up on the Mascot tab.`);
  commit(s);
}

export function resetStore(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  commit(defaultState());
}

/** Replace the whole state (admin editor). */
export function replaceState(next: Partial<State>): void {
  const s = hydrate(next);
  settle(s);
  commit(s);
}

export const useStore = (): State => useSyncExternalStore(subscribe, getState, getState);

/** A copyable backup code holding the whole save. */
export function exportSave(): string {
  let bin = '';
  for (const b of new TextEncoder().encode(JSON.stringify(state))) bin += String.fromCharCode(b); // no spread: big saves overflow the call stack
  return 'MS1:' + btoa(bin);
}

/** Restores a backup code. Returns false, changing nothing, when the code is not a valid save. */
export function importSave(code: string): boolean {
  try {
    const b64 = code.trim().replace(/^MS1:/, '');
    const p = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))) as Partial<State>;
    if (!p || p.v !== 2 || typeof p.onboarded !== 'boolean') return false;
    replaceState(p);
    return true;
  } catch {
    return false;
  }
}
