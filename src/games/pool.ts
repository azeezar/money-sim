import { LESSONS } from '../data/lessons';
import type { TierId } from '../lib/config';
import { planCtx } from '../lib/plan';
import type { State } from '../state/types';

export interface QuizQ {
  q: string;
  /** Correct answer first; the game shuffles. */
  o: string[];
  why: string;
}

export interface Pool {
  pairs: [string, string][];
  questions: QuizQ[];
  lessons: number;
}

/**
 * Minigame content comes straight from the Learn tab.
 * `onlyDone` (under-18 mode) keeps to lessons the user has finished, so games only test what they were taught.
 */
export function lessonPool(tier: TierId, s: State, onlyDone: boolean): Pool {
  const ls = LESSONS[tier].filter((l) => !onlyDone || s.done[l.id]);
  const ctx = planCtx(s);
  const seen = new Set<string>();
  const pairs: [string, string][] = [];
  const questions: QuizQ[] = [];
  for (const st of ls.flatMap((l) => l.steps(ctx))) {
    if (st.k === 'match') for (const p of st.p) if (!seen.has(p[0]) && !seen.has(p[1])) (seen.add(p[0]), seen.add(p[1]), pairs.push(p));
    if (st.k === 'mc') questions.push({ q: st.q, o: st.o, why: st.why });
    if (st.k === 'tf') questions.push({ q: st.q, o: st.a ? ['True', 'False'] : ['False', 'True'], why: st.why });
  }
  return { pairs, questions, lessons: ls.length };
}

export const MIN_PAIRS = 3;
export const MIN_QUESTIONS = 3;
