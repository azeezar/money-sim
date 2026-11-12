import type { MarketMode } from '../lib/market';

export type MascotId = 'cat' | 'fox' | 'frog' | 'panda' | 'penguin' | 'robot';
export type Slot = 'color' | 'hat' | 'eyes' | 'neck';
/** Chosen item id per wardrobe slot, plus an optional nickname for the mascot. */
export type Look = Record<Slot, string> & { nick: string };
export type ProfileId = 'safety' | 'steady' | 'explorer';
/**
 * A minigame's id: an arcade game id from the curriculum (e.g. 'leak-dodger'), 'risk' for Risk Lab,
 * or 'quiz' for the lesson review games (Term Match, Quick Quiz). Entries are created on first use.
 */
export type GameId = string;

export interface Quiz {
  why: string;
  when: string;
  know: string;
  drop: string;
}

export interface BudgetCat {
  id: string;
  name: string;
  kind: 'need' | 'want';
  planned: number;
}

export interface Txn {
  id: string;
  cat: string;
  amount: number;
  note: string;
}

export interface MonthRecord {
  n: number;
  income: number;
  spent: number;
  saved: number;
  target: number;
  hit: boolean;
  xp: number;
  closedOn: string;
}

export interface Budget {
  income: number;
  cats: BudgetCat[];
  /** Spends logged in the month that is currently open. */
  txns: Txn[];
  history: MonthRecord[];
}

export interface GameState {
  /** Total XP moved into this game. Level is derived from it. */
  invested: number;
  plays: number;
  /** Day the `rewarded` counter belongs to. */
  day: string;
  /** Plays that already paid stars today. */
  rewarded: number;
}

export interface State {
  v: 2;
  onboarded: boolean;
  name: string;
  /** Date of birth (YYYY-MM-DD) entered at sign-up. Age comes from it; under 18 hides the trading simulator and uses the child-friendly minigames. */
  dob: string | null;
  mascot: MascotId;
  profile: ProfileId;
  quiz: Partial<Quiz>;
  startAmount: number;
  /** Savings target per month, in virtual pounds. */
  monthly: number;
  goal: { name: string; target: number; saved: number };
  /** Lifetime XP. Drives tier unlocks. */
  xp: number;
  /** Spendable XP. Moves into minigames. */
  wallet: number;
  stars: number;
  hearts: number;
  heartsDay: string;
  streak: number;
  lastDay: string | null;
  done: Record<string, true>;
  badges: Record<string, true>;
  perfect: number;
  txnCount: number;
  riskRuns: number;
  steadyRuns: number;
  budget: Budget;
  games: Record<GameId, GameState>;
  log: { t: string; a: number }[];
  quests: { day: string; lesson: number; budget: number; game: number; paid: Record<string, true> };
  /** Calendar months (YYYY-MM) that already paid the goal-hit XP. Used only when the one-per-month rule is on. */
  rewardedMonths: string[];
  /** Long-term virtual portfolio (funds and shares, no fees). */
  portfolio: Account;
  /** Virtual cash the user chose to start the portfolio with (£1 to £10,000). Returns are measured from it. */
  portfolioStart: number;
  /** Trading simulator account for the 24-hour market. Opens at the Investor tier. */
  trading: Account;
  /** Trading simulator account that follows London market hours. */
  tradingUk: Account;
  /** Which of the two the Trade tab shows. */
  tradeMode: MarketMode;
  /** Books from the reading list marked as read. */
  reading: Record<string, true>;
  /** Recommended reading folded away on the Learn tab. */
  readingHidden: boolean;
  /** How the mascot is dressed. Items unlock with lifetime XP (see components/wardrobe). */
  look: Look;
  /** Symbols in the trading watchlist. */
  watchlist: string[];
  /** Daily 6pm reminder notification (iPhone app only). */
  reminder: boolean;
  /** Unlock pop-ups already shown, by id. */
  seen: Record<string, true>;
}

/* ---------------------------------------------------------------- simulators */

export type Side = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop';

export interface Position {
  qty: number;
  /** Average price paid per unit, fees excluded. */
  avg: number;
  /** Leverage multiple (2, 5, 25, 50). Missing means 1: paid in full. */
  lev?: number;
}

export interface Order {
  id: string;
  sym: string;
  side: Side;
  type: Exclude<OrderType, 'market'>;
  qty: number;
  price: number;
  placed: number;
  /** Orders sharing a group cancel each other when one fills (stop loss + take profit). */
  oco?: string;
  label?: string;
  /** Leverage for a buy order. */
  lev?: number;
}

export interface Fill {
  id: string;
  sym: string;
  side: Side;
  qty: number;
  price: number;
  fee: number;
  /** Profit or loss realised by a sell, after fees. */
  pnl?: number;
  t: number;
  note?: string;
}

export interface Account {
  cash: number;
  positions: Record<string, Position>;
  orders: Order[];
  history: Fill[];
  realised: number;
  /** Last time pending orders were checked against prices (ms), on this account's clock. */
  checked: number;
  /** Which market hours this account trades in. Missing means '24h'. */
  mode?: MarketMode;
  /** Fast-forward: ms this account's clock runs ahead of real time. */
  offset?: number;
  /** Cash the account started with, for its return. Missing means the old default. */
  start?: number;
  /** Set once the user has picked a starting balance, so the set-up box stops showing. */
  chosen?: true;
  /** The account as it was at the present day, saved on the first fast-forward. "Back to today" restores it. */
  saved?: Account;
}
