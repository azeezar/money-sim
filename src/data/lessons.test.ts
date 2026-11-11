import { describe, expect, it } from 'vitest';
import { ALL_TIERS } from '../lib/config';
import { planCtx } from '../lib/plan';
import { defaultState } from '../state/store';
import { makeCats } from '../lib/budget';
import { LESSONS, findLesson, type Step } from './lessons';

/** Plan lessons read the user's own numbers, so check them across a spread of realistic states. */
function states() {
  const out = [];
  for (const [target, saved, monthly, income, when, drop] of [
    [5000, 1000, 100, 2000, 'long', 'plan'],
    [3000, 2990, 100, 1800, 'short', 'sell'],
    [3000, 3500, 250, 2500, 'unsure', 'bet'],
    [10000, 0, 1, 1500, 'mid', 'wait'],
    [800, 100, 400, 400, 'short', ''],
  ] as const) {
    const s = defaultState();
    s.goal = { name: 'Test goal', target, saved };
    s.monthly = monthly;
    s.budget.income = income;
    s.budget.cats = makeCats(income, Math.min(monthly, income));
    s.quiz = { when, drop };
    out.push(s);
  }
  return out;
}

const allSteps = (): { id: string; steps: Step[] }[] =>
  ALL_TIERS.flatMap((t) => LESSONS[t.id]).flatMap((l) => states().map((s) => ({ id: l.id, steps: l.steps(planCtx(s)) })));

describe('lesson content', () => {
  it('has at least four lessons in each of the five tiers with unique ids', () => {
    const ids = ALL_TIERS.flatMap((t) => LESSONS[t.id].map((l) => l.id));
    expect(ALL_TIERS).toHaveLength(5);
    ALL_TIERS.forEach((t) => expect(LESSONS[t.id].length).toBeGreaterThanOrEqual(4));
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(findLesson(id)).not.toBeNull());
  });

  it('gives every lesson at least three steps that all render with sensible content', () => {
    for (const { id, steps } of allSteps()) {
      expect(steps.length, id).toBeGreaterThanOrEqual(3);
      for (const st of steps) {
        if (st.k === 'mc') {
          expect(st.o.length, `${id}: ${st.q}`).toBeGreaterThanOrEqual(3);
          expect(new Set(st.o).size, `${id}: duplicate options in "${st.q}"`).toBe(st.o.length);
          expect(st.why.length, id).toBeGreaterThan(5);
        }
        if (st.k === 'match') {
          expect(st.p.length, id).toBeGreaterThanOrEqual(3);
          expect(new Set(st.p.map((x) => x[0])).size).toBe(st.p.length);
          expect(new Set(st.p.map((x) => x[1])).size).toBe(st.p.length);
        }
        const text = JSON.stringify(st);
        expect(text, `${id} has an unfilled value`).not.toMatch(/NaN|undefined|Infinity|\[object/);
      }
    }
  });

  it('has every Intermediate arcade game built', async () => {
    const { ARCADE } = await import('../games/arcade');
    for (const l of LESSONS.intermediate) expect(ARCADE[l.arcade!.id], l.arcade!.id).toBeTruthy();
  });
});

describe('my plan tier', () => {
  it('uses the user’s own numbers', () => {
    const s = defaultState();
    s.goal = { name: 'Flat deposit', target: 5000, saved: 1000 };
    s.monthly = 200;
    const text = JSON.stringify(LESSONS.plan[0].steps(planCtx(s)));
    expect(text).toContain('Flat deposit');
    expect(text).toContain('£4,000'); // remaining
    expect(text).toContain('20 months'); // 4000 / 200
  });

  it('switches to a "goal reached" lesson once the target is met', () => {
    const s = defaultState();
    s.goal = { name: 'Done', target: 1000, saved: 1200 };
    const steps = LESSONS.plan[0].steps(planCtx(s));
    expect(JSON.stringify(steps)).toContain('reached');
  });

  it('tailors the timeline lesson to the quiz answer', () => {
    const short = defaultState();
    short.quiz = { when: 'short' };
    const long = defaultState();
    long.quiz = { when: 'long' };
    const a = JSON.stringify(LESSONS.plan[2].steps(planCtx(short)));
    const b = JSON.stringify(LESSONS.plan[2].steps(planCtx(long)));
    expect(a).not.toEqual(b);
    expect(a).toContain('within a year');
    expect(b).toContain('more than five years');
  });
});

describe('teachFirst', () => {
  it('puts every card and key term in one learn step before the questions', async () => {
    const { teachFirst } = await import('./lessons');
    const l = findLesson('l13.1')!.lesson;
    const raw = l.steps(planCtx(defaultState()));
    const out = teachFirst(l.title, raw);
    expect(out[0].k).toBe('learn');
    if (out[0].k !== 'learn') return;
    expect(out[0].cards).toHaveLength(raw.filter((x) => x.k === 'card').length);
    expect(out[0].terms.map((t) => t[0])).toContain('Call option');
    expect(out.slice(1).some((x) => x.k === 'card')).toBe(false);
    expect(out.length).toBe(raw.length - out[0].cards.length + 1);
  });
});

describe('curriculum', () => {
  it('has 4 tiers of 8 lessons in 4 units, each with a unique mechanic and arcade game', async () => {
    const { LADDER } = await import('../lib/config');
    const ls = LADDER.flatMap((t) => LESSONS[t.id]);
    expect(ls).toHaveLength(32);
    LADDER.forEach((t) => {
      expect(LESSONS[t.id]).toHaveLength(8);
      expect(new Set(LESSONS[t.id].map((l) => l.unit)).size).toBe(4);
    });
    const mech = ls.map((l) => l.mech!.id);
    const arcade = ls.map((l) => l.arcade!.id);
    expect(new Set(mech).size).toBe(32);
    expect(new Set(arcade).size).toBe(32);
    expect(ls.map((l) => l.num)).toContain('16.2');
  });

  it('has every Novice mechanic and arcade game built', async () => {
    const { MECHS } = await import('../mechs');
    const { ARCADE } = await import('../games/arcade');
    for (const l of LESSONS.novice) {
      expect(MECHS[l.mech!.id], l.mech!.id).toBeTruthy();
      expect(ARCADE[l.arcade!.id], l.arcade!.id).toBeTruthy();
    }
  });

  it('has every Intermediate arcade game built', async () => {
    const { ARCADE } = await import('../games/arcade');
    for (const l of LESSONS.intermediate) expect(ARCADE[l.arcade!.id], l.arcade!.id).toBeTruthy();
  });
});
