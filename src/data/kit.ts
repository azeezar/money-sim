import type { PlanCtx } from '../lib/plan';

/**
 * Lesson content. Each lesson is a short run of steps:
 *  - card  : teach one idea
 *  - mc    : multiple choice. The FIRST option is the correct one; the UI shuffles them.
 *  - tf    : true or false
 *  - match : pair terms with meanings
 *
 * Content here is a draft written for a prototype. Have it reviewed by someone qualified
 * before real users see it. It is education, not financial advice.
 */
export type Step =
  | { k: 'card'; t: string; b: string }
  | { k: 'mc'; q: string; o: string[]; why: string }
  | { k: 'tf'; q: string; a: boolean; why: string }
  | { k: 'match'; p: [string, string][] }
  /** Built by teachFirst: every card and key term in the lesson, shown before the questions. */
  | { k: 'learn'; t: string; cards: { t: string; b: string }[]; terms: [string, string][] }
  /** The lesson's interactive mechanic, added by the lesson screen when one is built. */
  | { k: 'play'; id: string; t: string; b: string };

/** A lesson's interactive mechanic or arcade game. */
export interface Activity {
  id: string;
  name: string;
  desc: string;
}

export interface Lesson {
  id: string;
  title: string;
  steps: (ctx: PlanCtx) => Step[];
  /** Curriculum lessons only: "1.1", its unit, length in minutes, and its two activities. */
  num?: string;
  unit?: string;
  mins?: number;
  mech?: Activity;
  arcade?: Activity;
}

export const card = (t: string, b: string): Step => ({ k: 'card', t, b });
export const mc = (q: string, o: string[], why: string): Step => ({ k: 'mc', q, o, why });
export const tf = (q: string, a: boolean, why: string): Step => ({ k: 'tf', q, a, why });
export const match = (p: [string, string][]): Step => ({ k: 'match', p });
export const lesson = (id: string, title: string, steps: Step[] | ((c: PlanCtx) => Step[])): Lesson => ({
  id,
  title,
  steps: typeof steps === 'function' ? steps : () => steps,
});

/** A curriculum lesson. Its id is "l" + its number, e.g. "l1.1". */
export function cur(num: string, title: string, mins: number, mech: [string, string, string], arcade: [string, string, string], steps: Step[]): Lesson {
  const act = ([id, name, desc]: [string, string, string]): Activity => ({ id, name, desc });
  return { ...lesson('l' + num, title, steps), num, mins, mech: act(mech), arcade: act(arcade) };
}

/** Stamps a unit name on its lessons. */
export const unit = (name: string, ls: Lesson[]): Lesson[] => ls.map((l) => ({ ...l, unit: name }));
