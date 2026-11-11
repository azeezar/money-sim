import type { TierId } from '../lib/config';
import { gbp } from '../lib/format';
import { ADVANCED, INTERMEDIATE, INVESTOR, NOVICE } from './curriculum';
import { card, mc, tf, match, lesson, type Lesson, type Step } from './kit';

export type { Activity, Lesson, Step } from './kit';

/** The correct answer first, then up to three distinct wrong ones. */
function numOpts(correct: number, fmt: (n: number) => string, candidates: number[]): string[] {
  const seen = new Set<number>([correct]);
  const wrong: number[] = [];
  for (const c of candidates) {
    const n = Math.round(c);
    if (n > 0 && !seen.has(n)) {
      seen.add(n);
      wrong.push(n);
    }
    if (wrong.length === 3) break;
  }
  for (let n = correct + 1; wrong.length < 3; n++) if (!seen.has(n)) (seen.add(n), wrong.push(n));
  return [fmt(correct), ...wrong.map(fmt)];
}

const monthsFmt = (n: number) => `${n} ${n === 1 ? 'month' : 'months'}`;
const monthCands = (m: number) => [m * 2, Math.max(1, Math.round(m / 2)), m + 6, m + 12, m * 3, m + 2];

export const LESSONS: Record<TierId, Lesson[]> = {
  novice: NOVICE,
  intermediate: INTERMEDIATE,
  advanced: ADVANCED,
  investor: INVESTOR,

  /* ----------------------------------------------------------------- My plan */
  plan: [
    lesson('plan-0', 'Your goal in numbers', (c) =>
      c.remaining <= 0
        ? [
            card(`You have reached ${gbp(c.target)}`, `Your virtual pot is at ${gbp(c.saved)}, past your target for ${c.goalName}. Raise the target on the My budget tab to keep the plan moving.`),
            mc('Your goal is reached. What is a sensible next move?', ['Set a new goal and keep the monthly habit', 'Spend it all at once', 'Borrow to reach the next goal', 'Stop saving for good'], 'A new target keeps the habit going, and the habit is what builds the pot.'),
            tf('Reaching a goal means the habit no longer matters.', false, 'The habit is what got you there. A new goal keeps it alive.'),
          ]
        : [
            card(`${c.goalName}: ${gbp(c.target)}`, `Your pot is at ${gbp(c.saved)}, so ${gbp(c.remaining)} to go. Saving ${gbp(c.monthly)} a month with no growth gets you there in about ${monthsFmt(c.months)}. Investing could shorten that, but it could also lengthen it.`),
            mc(`Saving ${gbp(c.monthly)} a month, about how long to cover the remaining ${gbp(c.remaining)}?`, numOpts(c.months, monthsFmt, monthCands(c.months)), `${gbp(c.remaining)} divided by ${gbp(c.monthly)} is about ${c.months}, rounded up to whole months.`),
            ...(c.months > 2 && c.monthsFaster < c.months
              ? [mc(`Add ${gbp(c.extra)} a month, so ${gbp(c.monthly + c.extra)} in total. About how long now?`, numOpts(c.monthsFaster, monthsFmt, monthCands(c.monthsFaster).concat([c.months])), `${gbp(c.remaining)} divided by ${gbp(c.monthly + c.extra)} is about ${c.monthsFaster}. A small raise saves ${c.months - c.monthsFaster} ${c.months - c.monthsFaster === 1 ? 'month' : 'months'}.`)]
              : []),
            tf('Taking bigger risks is a good way to reach a goal sooner.', false, 'Bigger risks widen the range of outcomes, including ending up with less. Saving a little more is the reliable lever.'),
            tf('A goal under a year away usually belongs in easy-access savings.', true, 'There is no time to recover from a fall.'),
          ],
    ),
    lesson('plan-1', 'Your safety net', (c) => {
      const ex = c.hasBudget ? c.essentials : 1200;
      const three = ex * 3;
      const six = ex * 6;
      const mths = Math.ceil(three / c.monthly);
      return [
        card('Your cushion', c.hasBudget
          ? `Your planned essentials come to about ${gbp(ex)} a month. Three to six months of that is ${gbp(three)} to ${gbp(six)}. That is the cushion to build before taking investment risk.`
          : `Set up your budget on the My budget tab to see your own number. For now, picture essentials of ${gbp(ex)} a month. Three to six months of that is ${gbp(three)} to ${gbp(six)}.`),
        mc(`With essentials of ${gbp(ex)} a month, how much is three months of cover?`, numOpts(three, gbp, [ex, six, ex * 12, three + ex]), `${gbp(ex)} × 3 = ${gbp(three)}.`),
        mc(`Saving ${gbp(c.monthly)} a month, about how long to build ${gbp(three)} from nothing?`, numOpts(mths, monthsFmt, monthCands(mths)), `${gbp(three)} divided by ${gbp(c.monthly)} is about ${mths}, rounded up.`),
        match([['Emergency fund', 'Cash set aside for surprises'], ['Essentials', 'Bills you must pay'], ['Wants', 'Nice-to-have spending'], ['Savings target', 'What you aim to keep each month']]),
        tf('An emergency fund works best invested in shares.', false, 'Emergencies do not wait for markets to recover. Keep it somewhere stable and quick to reach.'),
      ];
    }),
    lesson('plan-2', 'Your timeline and nerves', (c) => {
      const A = ['Mostly easy-access savings', 'A mix of savings and a diversified fund', 'Mostly a diversified fund, held for years', 'Settle the timeline first, then pick the account'];
      const say = { short: 'within a year', mid: 'in one to five years', long: 'in more than five years', unsure: 'at some point you are not sure of' }[c.horizon];
      const correct = { short: A[0], mid: A[1], long: A[2], unsure: A[3] }[c.horizon];
      const text = {
        short: 'That is a savings-account timeline. Investments can fall sharply in a year, so money you will need soon is usually kept steady.',
        mid: 'That sits in between. Common approaches keep most of it steady and consider a diversified investment for the part you will not need for the longest.',
        long: 'That gives time to ride out dips and let compounding work. A diversified, low-cost fund held for years is a common approach, with a safety net kept separately.',
        unsure: 'Until you know, treat it as short-term money. You can move it later, but you cannot undo a forced sale during a fall.',
      }[c.horizon];
      const nerves: Record<string, string> = {
        sell: 'You said you would sell everything after a 20% fall. That is the most common way a dip becomes a permanent loss. A safety net, automatic deposits and not checking daily make a panic sale less likely.',
        wait: 'You said you would worry but wait. That is a normal reaction, and waiting is often right with a long timeline. A written plan makes it easier to do.',
        plan: 'You said you would stick to your plan. That habit matters more than almost any pick. Check now and then that the plan still fits your timeline.',
        bet: 'You said you would bet bigger to win it back. That is called chasing losses, and it is how small losses become big ones. Leverage makes it worse.',
      };
      return [
        card('Your timeline', `You said you may need this money ${say}. ${text}`),
        mc('Given your timeline, which is a common approach?', [correct, ...A.filter((a) => a !== correct)], 'It follows from how long the money can stay untouched.'),
        card('Your nerves', nerves[c.drop] ?? 'How you react to a fall matters as much as what you hold. Decide your rules while you are calm.'),
        mc('Whatever you do in a fall, which habit helps?', ['Write down your rules before a fall happens', 'Check prices every hour', 'Follow tips from group chats', 'Wait to see how you feel on the day'], 'Rules made in advance beat decisions made in a panic.'),
        tf('Chasing a loss with a bigger bet improves your odds.', false, 'Each bet is independent. A bigger one only raises how much you can lose.'),
      ];
    }),
    lesson('plan-3', 'Your first steps', (c) => [
      card('A simple order', `1. Build your emergency fund. 2. Clear costly debt. 3. Set a monthly amount you will not miss, such as your ${gbp(c.monthly)}. 4. Choose low-cost, diversified options. 5. Review once or twice a year. Practise each step here first.`),
      mc('Which step comes first?', ['Build an emergency fund', 'Pick a hot share', 'Start day trading', 'Borrow to invest'], 'A cushion stops a surprise bill forcing you to sell at a bad time.'),
      mc(`You miss your ${gbp(c.monthly)} target one month. What helps most?`, ['Carry on next month without chasing it with bigger risk', 'Give up on the plan', 'Double up on risky bets to catch up', 'Hide the numbers'], 'One missed month is normal. The habit matters more than any single month.'),
      tf(`Your ${gbp(c.monthly)} a month only counts if you never miss a month.`, false, 'Consistency beats perfection. Restart and keep going.'),
      mc('What is the virtual money in this app for?', ['Practising decisions safely', 'Paying bills', 'Earning real interest', 'Buying real shares'], 'Mistakes here cost nothing. That is the point.'),
    ]),
  ],
};

export function findLesson(id: string): { tier: TierId; lesson: Lesson; index: number } | null {
  for (const tier of Object.keys(LESSONS) as TierId[]) {
    const index = LESSONS[tier].findIndex((l) => l.id === id);
    if (index >= 0) return { tier, lesson: LESSONS[tier][index], index };
  }
  return null;
}

/** Moves every teaching card and key term to a single "learn first" step, then the questions. */
export function teachFirst(title: string, steps: Step[]): Step[] {
  const cards: { t: string; b: string }[] = [];
  const terms: [string, string][] = [];
  const rest: Step[] = [];
  for (const st of steps) {
    if (st.k === 'card') cards.push({ t: st.t, b: st.b });
    else {
      if (st.k === 'match') terms.push(...st.p);
      rest.push(st);
    }
  }
  return [{ k: 'learn', t: title, cards, terms }, ...rest];
}
