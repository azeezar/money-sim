import { useState } from 'react';
import { MASCOTS, Mascot, MascotPicker, buddyName } from '../components/Mascot';
import { ITEMS, SLOTS, isOpen, nextUnlock } from '../components/wardrobe';
import { setMascot, setNick, wear } from '../state/actions';
import { useStore } from '../state/store';
import type { MascotId } from '../state/types';
import { Icon } from '../ui/Icon';

/** What each mascot does on its own, and the trick it plays when tapped. */
const MOVES: Record<MascotId, [string, string]> = {
  cat: ['sways', 'a spin'],
  fox: ['hops', 'a backflip'],
  frog: ['bounces', 'a big leap'],
  panda: ['rocks', 'a tumble'],
  penguin: ['waddles', 'a slide'],
  robot: ['hovers', 'a glitch'],
};

export function MyMascot() {
  const s = useStore();
  const [trick, setTrick] = useState(0);
  const [busy, setBusy] = useState(false);
  const name = buddyName(s.mascot, s.look.nick);
  const tag = MASCOTS.find((m) => m.id === s.mascot)!.tag;
  const [idle, move] = MOVES[s.mascot];
  const next = nextUnlock(s.xp);
  const prev = Math.max(0, ...ITEMS.filter((i) => i.xp <= s.xp).map((i) => i.xp));
  const opened = ITEMS.filter((i) => isOpen(i, s.xp)).length;

  return (
    <>
      <section className="hero h-mascot">
        <span className="tag">My mascot</span>
        <button
          className="mascot-stage"
          onClick={() => {
            setTrick((t) => t + 1);
            setBusy(true);
          }}
          onAnimationEnd={(e) => e.target !== e.currentTarget && busy && setBusy(false)}
          aria-label={`Make ${name} do ${move}`}
        >
          <Mascot key={trick} id={s.mascot} size={150} trick={busy} />
        </button>
        <h1>{name}</h1>
        <p className="small">
          {tag} · {idle} about · tap for {move}
        </p>
        <label className="field">
          <span>Name your mascot</span>
          <input value={s.look.nick} maxLength={16} placeholder={MASCOTS.find((m) => m.id === s.mascot)!.name} onChange={(e) => setNick(e.target.value)} />
        </label>
      </section>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Wardrobe</h3>
          <span className="chip num">
            {opened} / {ITEMS.length} unlocked
          </span>
        </div>
        {next ? (
          <>
            <p className="muted small">
              You have {s.xp} XP. Next unlock: <b>{next.name}</b> at {next.xp} XP. Earn XP from lessons, games and your budget.
            </p>
            <div className="bar pri">
              <i style={{ width: `${Math.min(100, ((s.xp - prev) / (next.xp - prev)) * 100)}%` }} />
            </div>
          </>
        ) : (
          <p className="muted small">Everything is unlocked. Mix and match.</p>
        )}
      </div>

      <div className="card">
        <h3>Choose your mascot</h3>
        <p className="muted small">Every mascot has its own moves, and wears whatever you have picked below.</p>
        <MascotPicker value={s.mascot} onChange={setMascot} />
      </div>

      {SLOTS.map(({ slot, name: title }) => (
        <div className="card" key={slot}>
          <h3>{title}</h3>
          <div className="mgrid" role="radiogroup" aria-label={title}>
            {ITEMS.filter((i) => i.slot === slot).map((i) => {
              const ok = isOpen(i, s.xp);
              const on = s.look[slot] === i.id;
              return (
                <button key={i.id} type="button" role="radio" aria-checked={on} disabled={!ok} className={'mbtn' + (on ? ' on' : '') + (ok ? '' : ' locked')} onClick={() => wear(slot, i.id)}>
                  <Mascot id={s.mascot} size={52} still look={{ ...s.look, [slot]: i.id }} />
                  <b>{i.name}</b>
                  <span className="row" style={{ gap: 3, justifyContent: 'center' }}>
                    {ok ? (on ? 'Wearing' : i.xp ? `${i.xp} XP` : 'Free') : <><Icon name="lock" size={12} /> {i.xp} XP</>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
