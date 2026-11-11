import type { Quiz, ProfileId } from '../state/types';

export const PROFILES: Record<ProfileId, { name: string; blurb: string }> = {
  safety: {
    name: 'Safety Builder',
    blurb: 'You want firm footing first. Your plan lessons lean on safety nets, short timelines and steady habits.',
  },
  steady: {
    name: 'Steady Grower',
    blurb: 'You are thinking long term. Your plan lessons focus on time, compounding and staying the course.',
  },
  explorer: {
    name: 'Risk Explorer',
    blurb: 'You are curious about trading. Your plan lessons put the dangers of big bets next to the boring habits that work.',
  },
};

export function profileFor(q: Partial<Quiz>): ProfileId {
  if (q.why === 'trade' || q.drop === 'bet') return 'explorer';
  if (q.why === 'safety' || q.when === 'short' || q.drop === 'sell') return 'safety';
  return 'steady';
}

export const QUIZ: { k: keyof Quiz; q: string; o: [string, string][] }[] = [
  {
    k: 'why',
    q: 'What brings you here?',
    o: [
      ['safety', 'Build a safety net'],
      ['big', 'Save for something big'],
      ['grow', 'Grow my money over the long term'],
      ['trade', 'I am curious about trading'],
    ],
  },
  {
    k: 'when',
    q: 'When might you need this money?',
    o: [
      ['short', 'Within a year'],
      ['mid', 'In 1 to 5 years'],
      ['long', 'In more than 5 years'],
      ['unsure', 'Not sure yet'],
    ],
  },
  {
    k: 'know',
    q: 'How much do you know about investing?',
    o: [
      ['new', 'I am brand new'],
      ['some', 'I know a few terms'],
      ['good', 'I am fairly confident'],
    ],
  },
  {
    k: 'drop',
    q: 'Your investment falls 20% in a month. What do you do?',
    o: [
      ['sell', 'Sell everything'],
      ['wait', 'Worry, but wait'],
      ['plan', 'Stick to my plan'],
      ['bet', 'Bet bigger to win it back'],
    ],
  },
];

export const GOAL_DEFAULTS: Record<string, [string, number]> = {
  safety: ['Emergency fund', 3000],
  big: ['Something big', 5000],
  grow: ['Long-term pot', 10000],
  trade: ['First £5,000', 5000],
};
