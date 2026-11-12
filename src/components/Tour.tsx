import { useState } from 'react';
import { markSeen } from '../state/actions';
import type { MascotId } from '../state/types';
import { Icon, type IconName } from '../ui/Icon';
import { Mascot, MascotIcon } from './Mascot';

const STEPS: { v: string; icon: IconName; t: string; b: string }[] = [
  { v: 'learn', icon: 'learn', t: 'Learn', b: 'Short lessons with a hands-on activity in each. Finish them to earn XP and unlock new tiers.' },
  { v: 'pot', icon: 'goal', t: 'My budget', b: 'Plan your month, log what you spend, and hit your saving goal for bonus XP.' },
  { v: 'games', icon: 'games', t: 'Games', b: 'Arcade games for every lesson. Play to practise and win stars.' },
  { v: 'mascot', icon: 'user', t: 'Mascot', b: 'Your XP unlocks hats, colours and more for your mascot. Tap it to see a trick.' },
];

/** A four-card tour of the main tabs, shown once. `go` opens the tab being described. */
export function Tour({ mascot, go }: { mascot: MascotId; go: (v: string) => void }) {
  const [i, setI] = useState(0);
  const st = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="t2-sheetwrap" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="t2-sheet unlockpop">
        <div className="center">
          {i === 0 ? <Mascot id={mascot} size={72} /> : st.v === 'mascot' ? <MascotIcon id={mascot} /> : <Icon name={st.icon} size={40} />}
          <span className="tag">
            Quick tour · {i + 1} of {STEPS.length}
          </span>
          <h2 id="tour-title">{st.t}</h2>
          <p className="muted">{st.b}</p>
        </div>
        <div className="row">
          <button className="btn ghost grow" onClick={() => markSeen(['tour'])}>
            Skip
          </button>
          <button
            className="btn grow"
            onClick={() => {
              if (last) (markSeen(['tour']), go('learn'));
              else {
                setI(i + 1);
                go(STEPS[i + 1].v);
              }
            }}
          >
            {last ? 'Start learning' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
