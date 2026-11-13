import { ADMIN } from './mode';

/**
 * Every number that shapes the XP economy lives here, so it can be tuned in one place.
 *
 *  XP (lifetime)  -> never goes down. Unlocks learning tiers.
 *  XP wallet      -> every XP earned also lands here. Spend it by moving it into a minigame.
 *  Stars          -> earned from minigames and quests. Refill hearts.
 */
export type TierId = 'novice' | 'intermediate' | 'advanced' | 'investor' | 'plan';

export interface Tier {
  id: TierId;
  name: string;
  blurb: string;
  /** Lifetime XP needed to unlock. */
  at: number;
}

/** The four tiers that unlock by XP, in order. */
export const LADDER: Tier[] = [
  { id: 'novice', name: 'Novice', at: 0, blurb: 'Financial Foundations: income and leaks, budgeting, saving, debt and your first steps to investing.' },
  { id: 'intermediate', name: 'Intermediate', at: 60, blurb: 'Core Investor: shares, bonds, index funds, fees, asset allocation, tax wrappers and discipline.' },
  { id: 'advanced', name: 'Advanced', at: 180, blurb: 'Market Analyst: financial statements, valuation, central banks, market cycles and behavioural finance.' },
  { id: 'investor', name: 'Investor', at: 330, blurb: 'Sophisticated Strategist: options, real estate, private markets, correlation and tax-loss harvesting. Unlocks the trading simulator.' },
];

/** The fifth tier is separate from the ladder: always open, built from the user's own numbers. */
export const PLAN_TIER: Tier = {
  id: 'plan',
  name: 'My plan',
  at: 0,
  blurb: 'Built from your quiz answers, your goal and your budget.',
};

export const ALL_TIERS: Tier[] = [...LADDER, PLAN_TIER];

/** XP head start from the starting quiz's "how much do you know" answer. Lifetime XP only, not wallet. */
export const PLACEMENT: Record<string, number> = { new: 0, some: 60, good: 180 };

/** XP to move into a minigame to take it from level n to n+1. Everything starts at level 0. */
export const LEVEL_COSTS = [20, 40, 60, 80, 100];
export const MAX_LEVEL = LEVEL_COSTS.length;
export const CAPACITY = LEVEL_COSTS.reduce((a, b) => a + b, 0);

/** Budget planner rewards. `logged` is paid for closing any month, `hit` only when the savings goal is met. */
export const BUDGET_XP = { logged: 5, hit: 40, bonus: 20, bonusRatio: 1.2 };

export const LESSON_XP = { first: 15, perfect: 5, replay: 5 };
export const QUEST_REWARD = { xp: 5, stars: 2 };
export const HEART_REFILL_COST = 10;
export const MAX_HEARTS = 5;

/** Minigame star payouts: 1 + level, +2 for a good run. Only this many plays per game per day pay out. */
export const GAME_STAR_PLAYS_PER_DAY = 3;

/**
 * Virtual money makes it easy to close months back to back and farm XP.
 * Set true to pay the "goal hit" XP only once per real calendar month (what production should do).
 */
export const ONE_REWARD_PER_CALENDAR_MONTH = false;

/** Virtual cash each simulator account starts with. */
export const PORTFOLIO_START_CASH = 10000;
/** The user picks their portfolio's starting balance from £1 up to this. */
export const PORTFOLIO_MAX_START = 10000;
export const TRADING_START_CASH = 25000;
/** Trading accounts can start with £10 up to this (in £10 steps). The admin build allows far more for testing. */
export const TRADE_MIN_START = 10;
export const TRADE_MAX_START = ADMIN ? 1_000_000_000 : 100_000;
/** Trading simulator commission, as a share of each trade's value (0.1%). The portfolio has no fees. */
export const TRADE_FEE_RATE = 0.001;
/** The trading simulator opens when this tier is unlocked. */
export const TRADING_TIER: TierId = 'investor';
