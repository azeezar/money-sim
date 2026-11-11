import { BADGES } from '../data/badges';
import { QUESTS } from '../data/quests';
import { QUEST_REWARD } from '../lib/config';
import { toast } from '../ui/toast';
import { addXP } from './helpers';
import type { State } from './types';

/** Runs after every state change: pays finished quests and awards new badges. */
export function settle(s: State): void {
  for (const q of QUESTS) {
    if (s.quests[q.id] >= 1 && !s.quests.paid[q.id]) {
      s.quests.paid[q.id] = true;
      addXP(s, QUEST_REWARD.xp);
      s.stars += QUEST_REWARD.stars;
      toast(`Quest done: ${q.label} (+${QUEST_REWARD.xp} XP)`);
    }
  }
  for (const b of BADGES) {
    if (!s.badges[b.id] && b.test(s)) {
      s.badges[b.id] = true;
      toast(`Badge earned: ${b.name}`);
    }
  }
}
