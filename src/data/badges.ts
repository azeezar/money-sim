import { LESSONS } from './lessons';
import type { TierId } from '../lib/config';
import { levelFor } from '../lib/progress';
import type { State } from '../state/types';

export interface Badge {
  id: string;
  name: string;
  glyph: string;
  how: string;
  test: (s: State) => boolean;
}

const tierDone = (s: State, id: TierId) => LESSONS[id].every((l) => s.done[l.id]);
const totalLevels = (s: State) => Object.values(s.games).reduce((n, g) => n + levelFor(g.invested), 0);
const progress = (s: State) => (s.goal.target > 0 ? s.goal.saved / s.goal.target : 0);

export const BADGES: Badge[] = [
  { id: 'goal', name: 'Goal setter', glyph: '£', how: 'Set a savings goal', test: (s) => s.goal.target > 0 },
  { id: 'first', name: 'First steps', glyph: '1', how: 'Finish a lesson', test: (s) => Object.keys(s.done).length > 0 },
  { id: 'perfect', name: 'Flawless', glyph: '★', how: 'Finish a lesson with no mistakes', test: (s) => s.perfect > 0 },
  { id: 'novice', name: 'Word bank', glyph: 'N', how: 'Finish every Novice lesson', test: (s) => tierDone(s, 'novice') },
  { id: 'intermediate', name: 'Spreader', glyph: 'I', how: 'Finish every Intermediate lesson', test: (s) => tierDone(s, 'intermediate') },
  { id: 'advanced', name: 'Eyes open', glyph: 'A', how: 'Finish every Advanced lesson', test: (s) => tierDone(s, 'advanced') },
  { id: 'investor', name: 'Investor', glyph: 'K', how: 'Finish every Investor lesson', test: (s) => tierDone(s, 'investor') },
  { id: 'plan', name: 'Planner', glyph: 'P', how: 'Finish every My plan lesson', test: (s) => tierDone(s, 'plan') },
  { id: 'month', name: 'Month saved', glyph: '+', how: 'Hit your savings goal for a month', test: (s) => s.budget.history.some((h) => h.hit) },
  { id: 'habit', name: 'Habit built', glyph: 'H', how: 'Hit your monthly goal 3 times', test: (s) => s.budget.history.filter((h) => h.hit).length >= 3 },
  { id: 'tracker', name: 'Tracker', glyph: '¢', how: 'Log 10 spends', test: (s) => s.txnCount >= 10 },
  { id: 'levelup', name: 'Level up', glyph: '↑', how: 'Take a minigame to level 1', test: (s) => totalLevels(s) >= 1 },
  { id: 'master', name: 'Game master', glyph: 'M', how: 'Reach 5 minigame levels in total', test: (s) => totalLevels(s) >= 5 },
  { id: 'dip', name: 'Seen the dip', glyph: '%', how: 'Finish a Risk Lab run', test: (s) => s.riskRuns > 0 },
  { id: 'steady', name: 'Steady hands', glyph: '≈', how: 'Hold the fund every year in a Risk Lab run', test: (s) => s.steadyRuns > 0 },
  { id: 'streak3', name: 'On a roll', glyph: '3', how: 'Reach a 3-day streak', test: (s) => s.streak >= 3 },
  { id: 'half', name: 'Halfway', glyph: '½', how: 'Reach 50% of your goal', test: (s) => progress(s) >= 0.5 },
  { id: 'trader', name: 'First trade', glyph: '⇅', how: 'Place a trade in the simulator', test: (s) => s.trading.history.length + s.tradingUk.history.length > 0 },
  { id: 'holder', name: 'Portfolio started', glyph: '◔', how: 'Buy your first holding', test: (s) => s.portfolio.history.length > 0 },
  { id: 'reader', name: 'Bookworm', glyph: 'B', how: 'Mark 3 books as read', test: (s) => Object.keys(s.reading).length >= 3 },
  { id: 'full', name: 'Goal reached', glyph: '✓', how: 'Reach your goal', test: (s) => progress(s) >= 1 },
];
