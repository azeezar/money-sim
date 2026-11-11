import type { State } from '../state/types';
import { PROFILES } from '../data/profiles';

export type Horizon = 'short' | 'mid' | 'long' | 'unsure';

/** Everything the "My plan" lessons need to talk about the user's own numbers. */
export interface PlanCtx {
  name: string;
  goalName: string;
  target: number;
  saved: number;
  monthly: number;
  remaining: number;
  /** Months to cover `remaining` at `monthly`, ignoring growth. */
  months: number;
  /** A sensible "save a bit more" nudge: 25% of monthly, rounded to £5. */
  extra: number;
  monthsFaster: number;
  /** Planned monthly essentials from the budget (needs only). */
  essentials: number;
  hasBudget: boolean;
  horizon: Horizon;
  drop: string;
  profileName: string;
}

export function planCtx(s: State): PlanCtx {
  const monthly = Math.max(1, s.monthly);
  const remaining = Math.max(0, s.goal.target - s.goal.saved);
  const extra = Math.max(5, Math.round((monthly * 0.25) / 5) * 5);
  const essentials = s.budget.cats.filter((c) => c.kind === 'need').reduce((a, c) => a + c.planned, 0);
  const horizon = (['short', 'mid', 'long'] as const).find((h) => h === s.quiz.when) ?? 'unsure';
  return {
    name: s.name,
    goalName: s.goal.name || 'your goal',
    target: s.goal.target,
    saved: s.goal.saved,
    monthly,
    remaining,
    months: Math.ceil(remaining / monthly),
    extra,
    monthsFaster: Math.ceil(remaining / (monthly + extra)),
    essentials,
    hasBudget: essentials > 0,
    horizon,
    drop: s.quiz.drop ?? '',
    profileName: PROFILES[s.profile].name,
  };
}
