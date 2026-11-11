import { dayKey } from '../lib/format';
import type { State } from './types';

/** All XP counts towards tiers (lifetime) and is also spendable on minigames (wallet). */
export function addXP(s: State, n: number): void {
  s.xp += n;
  s.wallet += n;
}

/** Call when the user does something worth a streak day. */
export function touchDay(s: State): void {
  const t = dayKey();
  if (s.lastDay === t) return;
  s.streak = s.lastDay === dayKey(1) ? s.streak + 1 : 1;
  s.lastDay = t;
}
