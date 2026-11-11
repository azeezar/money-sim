import type { Budget, BudgetCat, Txn } from '../state/types';

/** Starter categories. Weights sum to 1 and split whatever is left after the savings target. */
const STARTER: [string, string, 'need' | 'want', number][] = [
  ['rent', 'Housing', 'need', 0.3],
  ['bills', 'Bills', 'need', 0.1],
  ['food', 'Food', 'need', 0.15],
  ['travel', 'Transport', 'need', 0.1],
  ['out', 'Eating out', 'want', 0.08],
  ['subs', 'Subscriptions', 'want', 0.05],
  ['fun', 'Fun', 'want', 0.12],
  ['shop', 'Shopping', 'want', 0.1],
];

export function makeCats(income: number, monthly: number): BudgetCat[] {
  const avail = Math.max(0, income - monthly);
  return STARTER.map(([id, name, kind, w]) => ({ id, name, kind, planned: Math.round(avail * w) }));
}

export const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

export const spentIn = (txns: Txn[], catId: string): number =>
  sum(txns.filter((t) => t.cat === catId).map((t) => t.amount));

export interface BudgetSummary {
  /** Spent so far this month. */
  spent: number;
  /** What the plan lets you spend after setting the savings target aside. */
  available: number;
  /** Planned spending across all categories. */
  plannedTotal: number;
  /** available - spent. Negative means the savings goal is at risk. */
  left: number;
  /** income - spent: what you would bank if the month ended now. */
  saved: number;
  /** available - plannedTotal. Negative means the plan itself overspends. */
  planGap: number;
  onTrack: boolean;
}

export function summarise(b: Budget, target: number): BudgetSummary {
  const spent = sum(b.txns.map((t) => t.amount));
  const available = b.income - target;
  const plannedTotal = sum(b.cats.map((c) => c.planned));
  const left = available - spent;
  return { spent, available, plannedTotal, left, saved: b.income - spent, planGap: available - plannedTotal, onTrack: left >= 0 };
}
