import { QUESTS } from '../data/quests';
import { QUEST_REWARD } from '../lib/config';
import type { State } from '../state/types';

export function Quests({ s }: { s: State }) {
  return (
    <div className="card">
      <h3>Today’s quests</h3>
      {QUESTS.map((q) => {
        const done = s.quests[q.id] >= 1;
        return (
          <div className="quest" key={q.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>{q.label}</span>
              <span className="num muted">{done ? 'Done' : '0/1'}</span>
            </div>
            <div className="bar coinbar">
              <i style={{ width: done ? '100%' : '0%' }} />
            </div>
          </div>
        );
      })}
      <p className="muted small">Each quest pays {QUEST_REWARD.xp} XP and {QUEST_REWARD.stars} stars.</p>
    </div>
  );
}
