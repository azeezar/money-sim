import { BUDGET_XP, LADDER, LEVEL_COSTS, type Tier, type TierId } from './config';

/** Index into LADDER of the highest tier unlocked at this lifetime XP. */
export const tierIndex = (xp: number): number => LADDER.reduce((i, t, k) => (xp >= t.at ? k : i), 0);

export const currentTier = (xp: number): Tier => LADDER[tierIndex(xp)];

/** The next tier still locked, or null once everything is open. */
export const nextTier = (xp: number): Tier | null => LADDER[tierIndex(xp) + 1] ?? null;

export const isUnlocked = (id: TierId, xp: number): boolean =>
  id === 'plan' || LADDER.findIndex((t) => t.id === id) <= tierIndex(xp);

/** Minigame level from the total XP moved into it. */
export function levelFor(invested: number): number {
  let level = 0;
  let acc = 0;
  for (const c of LEVEL_COSTS) {
    acc += c;
    if (invested >= acc) level++;
    else break;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  /** XP moved in since reaching this level. */
  into: number;
  /** XP needed to reach the next level (equals `into` when maxed). */
  need: number;
  maxed: boolean;
}

export function levelProgress(invested: number): LevelProgress {
  const level = levelFor(invested);
  if (level >= LEVEL_COSTS.length) return { level, into: 1, need: 1, maxed: true };
  let before = 0;
  for (let i = 0; i < level; i++) before += LEVEL_COSTS[i];
  return { level, into: invested - before, need: LEVEL_COSTS[level], maxed: false };
}

/** XP for closing a budget month. Logging pays a little; hitting the savings goal pays a lot. */
export function monthReward(saved: number, target: number): { hit: boolean; xp: number } {
  const hit = target > 0 && saved >= target;
  let xp = BUDGET_XP.logged;
  if (hit) {
    xp += BUDGET_XP.hit;
    if (saved >= target * BUDGET_XP.bonusRatio) xp += BUDGET_XP.bonus;
  }
  return { hit, xp };
}
