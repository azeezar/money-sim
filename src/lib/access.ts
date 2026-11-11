import type { State } from '../state/types';
import { LADDER, TRADING_TIER, type TierId } from './config';
import { ADMIN } from './mode';
import { isUnlocked, nextTier } from './progress';

export const ADULT_AGE = 18;
/** The portfolio opens at this tier. */
export const PORTFOLIO_TIER: TierId = 'intermediate';

/** Whole years between a YYYY-MM-DD birth date and `now`, or null for a missing or invalid date. */
export function ageFrom(dob: string | null, now = new Date()): number | null {
  const m = dob && /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const born = new Date(y, mo - 1, d);
  if (born.getFullYear() !== y || born.getMonth() !== mo - 1 || born.getDate() !== d) return null; // e.g. 31 February
  const beforeBirthday = now.getMonth() < mo - 1 || (now.getMonth() === mo - 1 && now.getDate() < d);
  return now.getFullYear() - y - (beforeBirthday ? 1 : 0);
}
/** Ages the app accepts at sign-up. */
export const validAge = (age: number | null): age is number => age !== null && age >= 4 && age <= 120;
export const ageOf = (s: State): number | null => ageFrom(s.dob);
export const isAdult = (s: State): boolean => (ageOf(s) ?? 0) >= ADULT_AGE;
/** XP locks are lifted in the admin build. The age rule is not, so admins can preview the under-18 app by editing the age. */
export const tierOpen = (s: State, id: TierId): boolean => ADMIN || isUnlocked(id, s.xp);
export const canPortfolio = (s: State): boolean => tierOpen(s, PORTFOLIO_TIER);
export const canTrade = (s: State): boolean => isAdult(s) && tierOpen(s, TRADING_TIER);

export interface Unlock {
  id: string;
  title: string;
  text: string;
}


/** Everything a user has unlocked by XP so far. The app pops up the ones not yet shown. */
export function unlocks(s: State): Unlock[] {
  const out: Unlock[] = [];
  for (const t of LADDER.slice(1)) {
    if (isUnlocked(t.id, s.xp)) out.push({ id: 'tier-' + t.id, title: `${t.name} lessons and minigames`, text: t.blurb });
  }
  if (isUnlocked(PORTFOLIO_TIER, s.xp)) out.push({ id: 'portfolio', title: 'Portfolio', text: 'Invest virtual money in funds and shares and watch it grow over time.' });
  if (isAdult(s) && isUnlocked(TRADING_TIER, s.xp)) out.push({ id: 'trade', title: 'Trade', text: 'The live trading simulator: charts, indicators and orders, with virtual money.' });
  return out;
}

/** What opens next and at how much XP, for the pop-up and locked screens. */
export function comingNext(s: State): string | null {
  const n = nextTier(s.xp);
  if (!n) return null;
  const extras = [n.id === PORTFOLIO_TIER && 'the Portfolio', n.id === TRADING_TIER && isAdult(s) && 'the Trade simulator'].filter(Boolean);
  return `${n.name} at ${n.at} XP: new lessons and minigames${extras.length ? ', plus ' + extras.join(' and ') : ''}.`;
}

