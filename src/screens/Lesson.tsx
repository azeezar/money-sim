import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mascot, type Mood } from '../components/Mascot';
import type { MascotId } from '../state/types';
import { findLesson, teachFirst, type Step } from '../data/lessons';
import { planCtx } from '../lib/plan';
import { MECHS } from '../mechs';
import { HEART_REFILL_COST } from '../lib/config';
import { shuffle } from '../lib/format';
import { finishLesson, loseHeart, refillHearts } from '../state/actions';
import { getState, useStore } from '../state/store';
import { Icon } from '../ui/Icon';

interface MatchState {
  l: number[];
  r: number[];
  pl: number | null;
  pr: number | null;
  done: Record<number, true>;
  bad: [number, number] | null;
}

interface Ui {
  sel: number | null;
  /** Shuffled option order for mc, [0,1] for true/false. */
  ord: number[];
  fb: { ok: boolean; why: string } | null;
  m: MatchState | null;
}

function prep(st: Step): Ui {
  if (st.k === 'mc') return { sel: null, ord: shuffle(st.o.map((_, i) => i)), fb: null, m: null };
  if (st.k === 'tf') return { sel: null, ord: [0, 1], fb: null, m: null };
  if (st.k === 'match') {
    const ix = st.p.map((_, i) => i);
    return { sel: null, ord: [], fb: null, m: { l: shuffle(ix), r: shuffle(ix), pl: null, pr: null, done: {}, bad: null } };
  }
  return { sel: null, ord: [], fb: null, m: null };
}

export function LessonScreen({ id, onClose, onGames }: { id: string; onClose: () => void; onGames: () => void }) {
  const s = useStore();
  const found = findLesson(id)!;
  const replay = useRef(!!s.done[id]).current;
  const initial = useMemo(() => {
    const out = teachFirst(found.lesson.title, found.lesson.steps(planCtx(getState())));
    const m = found.lesson.mech;
    // The interactive mechanic sits between the teaching and the questions.
    if (m && MECHS[m.id]) out.splice(1, 0, { k: 'play', id: m.id, t: m.name, b: m.desc });
    return out;
  }, [found.lesson]);
  const [played, setPlayed] = useState(false);
  const markPlayed = useCallback(() => setPlayed(true), []);
  const [steps, setSteps] = useState<Step[]>(initial);
  const [i, setI] = useState(0);
  const [cleared, setCleared] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<'q' | 'fail' | 'end'>(s.hearts <= 0 ? 'fail' : 'q');
  // 'advance': the failing answer was already given, so refilling moves on. 'stay': redo the current step.
  const [failKind, setFailKind] = useState<'advance' | 'stay'>(s.hearts <= 0 ? 'stay' : 'advance');
  const [ui, setUi] = useState<Ui>(() => prep(initial[0]));
  const [end, setEnd] = useState<{ gain: number; perfect: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const st = steps[i];

  function goTo(n: number, list = steps) {
    if (n >= list.length) {
      setEnd(finishLesson(id, mistakes, replay));
      return setPhase('end');
    }
    setI(n);
    setUi(prep(list[n]));
  }

  function advance() {
    if (st.k === 'card' || st.k === 'learn' || st.k === 'play') setCleared((c) => c + 1);
    if (getState().hearts <= 0 && i < steps.length - 1) {
      setFailKind('advance');
      return setPhase('fail');
    }
    goTo(i + 1);
  }

  function check() {
    if (st.k !== 'mc' && st.k !== 'tf') return;
    const right = st.k === 'tf' ? (st.a ? 0 : 1) : 0;
    const ok = ui.sel === right;
    if (ok) setCleared((c) => c + 1);
    else {
      setMistakes((m) => m + 1);
      loseHeart();
      // Re-ask a missed question once, at the end. A repeat that is missed again is not queued again.
      if (i < initial.length) setSteps((arr) => [...arr, { ...st }]);
    }
    setUi({ ...ui, fb: { ok, why: st.why } });
  }

  function tapMatch(side: 'l' | 'r', ix: number) {
    if (st.k !== 'match' || !ui.m || ui.fb) return;
    const m = ui.m;
    if (m.done[ix] || m.bad) return;
    const next: MatchState = { ...m, [side === 'l' ? 'pl' : 'pr']: ix };
    if (next.pl !== null && next.pr !== null) {
      if (next.pl === next.pr) {
        next.done = { ...m.done, [next.pl]: true };
        next.pl = next.pr = null;
        if (Object.keys(next.done).length === st.p.length) {
          setCleared((c) => c + 1);
          return setUi({ ...ui, m: next, fb: { ok: true, why: '' } });
        }
      } else {
        next.bad = [next.pl, next.pr];
        setMistakes((n) => n + 1);
        loseHeart();
        timer.current = window.setTimeout(() => {
          if (getState().hearts <= 0) {
            setFailKind('stay');
            return setPhase('fail');
          }
          setUi((u) => (u.m ? { ...u, m: { ...u.m, bad: null, pl: null, pr: null } } : u));
        }, 650);
      }
    }
    setUi({ ...ui, m: next });
  }

  function refill() {
    if (!refillHearts()) return;
    setPhase('q');
    if (failKind === 'advance') goTo(i + 1);
    else setUi(prep(st));
  }

  const hearts = (
    <span className="stat s-heart num" aria-label={`Hearts ${s.hearts}`}>
      <Icon name="heart" />
      <b>{s.hearts}</b>
    </span>
  );
  const head = (
    <div className="lhead">
      <button className="x" onClick={onClose} aria-label="Close lesson">
        ×
      </button>
      <div className="bar grow">
        <i style={{ width: `${Math.min(100, (cleared / steps.length) * 100)}%` }} />
      </div>
      {hearts}
    </div>
  );

  if (phase === 'end' && end) {
    return (
      <div className="over">
        <div className="over-in">
          <div className="lbody center">
            <Mascot id={s.mascot} size={96} mood="happy" />
            <h1>Lesson complete</h1>
            <p className="muted">{found.lesson.title}</p>
            <div className="chips">
              <span className="chip">+{end.gain} XP</span>
              <span className="chip">{end.perfect ? 'No mistakes' : `${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}`}</span>
              <span className="chip">{s.streak}-day streak</span>
            </div>
            <p className="muted small">XP counts towards your next tier and can be moved into a minigame.</p>
          </div>
          <button className="btn wide" onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'fail') {
    return (
      <div className="over">
        <div className="over-in">
          {head}
          <div className="lbody center">
            <Mascot id={s.mascot} size={84} mood="sad" />
            <h1>Out of hearts</h1>
            <p className="muted">Mistakes are how this works. Hearts come back tomorrow, or you can top them up now.</p>
          </div>
          <div className="col">
            {s.stars >= HEART_REFILL_COST && (
              <button className="btn wide" onClick={refill}>
                Refill for {HEART_REFILL_COST} stars
              </button>
            )}
            <button className="btn coin wide" onClick={onGames}>
              Play a minigame to earn stars
            </button>
            <button className="btn ghost wide" onClick={onClose}>
              Leave lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  let body;
  let foot;
  if (st.k === 'learn') {
    body = (
      <>
        <span className="tag">Learn first</span>
        <div className="teach">
          <Mascot id={s.mascot} size={52} />
          <h2>{st.t}</h2>
        </div>
        {st.cards.map((c) => (
          <div className="learnsec" key={c.t}>
            <h3>{c.t}</h3>
            <p>{c.b}</p>
          </div>
        ))}
        {st.terms.length > 0 && (
          <div className="learnsec terms">
            <h3>Key terms</h3>
            <dl>
              {st.terms.map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </>
    );
    foot = (
      <button className="btn wide" onClick={advance}>
        I'm ready for the questions
      </button>
    );
  } else if (st.k === 'play') {
    const Mech = MECHS[st.id];
    body = (
      <>
        <span className="tag">Try it</span>
        <h2>{st.t}</h2>
        <p className="muted">{st.b}</p>
        <div className="mech">
          <Mech onDone={markPlayed} />
        </div>
      </>
    );
    foot = (
      <button className="btn wide" disabled={!played} onClick={advance}>
        {played ? 'On to the questions' : 'Finish the activity to continue'}
      </button>
    );
  } else if (st.k === 'card') {
    body = (
      <>
        <span className="tag">New idea</span>
        <div className="teach">
          <Mascot id={s.mascot} size={52} />
          <div className="col">
            <h2>{st.t}</h2>
            <p>{st.b}</p>
          </div>
        </div>
      </>
    );
    foot = (
      <button className="btn wide" onClick={advance}>
        Got it
      </button>
    );
  } else if (st.k === 'match') {
    const m = ui.m!;
    const btn = (side: 'l' | 'r', ix: number, txt: string) => {
      const sel = (side === 'l' ? m.pl : m.pr) === ix;
      const bad = m.bad && m.bad[side === 'l' ? 0 : 1] === ix;
      return (
        <button key={side + ix} className={'opt ' + (m.done[ix] ? 'gone' : bad ? 'no' : sel ? 'sel' : '')} disabled={!!m.done[ix]} onClick={() => tapMatch(side, ix)}>
          {txt}
        </button>
      );
    };
    body = (
      <>
        <Buddy id={s.mascot} mood={ui.fb ? 'happy' : m.bad ? 'sad' : undefined} />
        <h2>Match each term to its meaning</h2>
        <div className="match">
          <div className="opts">{m.l.map((ix) => btn('l', ix, st.p[ix][0]))}</div>
          <div className="opts">{m.r.map((ix) => btn('r', ix, st.p[ix][1]))}</div>
        </div>
      </>
    );
    foot = ui.fb ? (
      <div className="fb good">
        <b>All matched</b>
        <button className="btn good wide" onClick={advance}>
          Continue
        </button>
      </div>
    ) : (
      <p className="muted small center">Tap a term, then its meaning.</p>
    );
  } else {
    const options = st.k === 'tf' ? ['True', 'False'] : st.o;
    const right = st.k === 'tf' ? (st.a ? 0 : 1) : 0;
    const retry = i >= initial.length;
    body = (
      <>
        {retry ? <span className="tag">One more try</span> : st.k === 'tf' ? <span className="tag">True or false?</span> : null}
        <Buddy id={s.mascot} mood={ui.fb ? (ui.fb.ok ? 'happy' : 'sad') : undefined} />
        <h2>{st.q}</h2>
        <div className="opts">
          {ui.ord.map((ix) => {
            const cls = ui.fb ? (ix === right ? 'ok' : ix === ui.sel ? 'no' : '') : ix === ui.sel ? 'sel' : '';
            return (
              <button key={ix} className={'opt ' + cls} disabled={!!ui.fb} onClick={() => setUi({ ...ui, sel: ix })}>
                {options[ix]}
              </button>
            );
          })}
        </div>
      </>
    );
    foot = ui.fb ? (
      <div className={'fb ' + (ui.fb.ok ? 'good' : 'bad')}>
        <b>{ui.fb.ok ? 'Correct' : 'Not quite'}</b>
        <p>{ui.fb.why}</p>
        <button className={'btn wide ' + (ui.fb.ok ? 'good' : 'bad')} onClick={advance}>
          Continue
        </button>
      </div>
    ) : (
      <button className="btn wide" disabled={ui.sel === null} onClick={check}>
        Check
      </button>
    );
  }

  return (
    <div className="over">
      <div className="over-in">
        {head}
        <div className="lbody">{body}</div>
        {foot}
      </div>
    </div>
  );
}

const CHEER = ['Yes! Nailed it!', 'Brilliant!', 'You’re on fire!', 'Spot on!', 'Woohoo!'];
const OOPS = ['Oh no…', 'So close!', 'We’ll get the next one.', 'Hmm, not that one.'];
const ASK = ['What do you think?', 'Take your time.', 'You’ve got this.'];

/** The mascot beside each question: thrilled at a right answer, sad at a wrong one. */
function Buddy({ id, mood }: { id: MascotId; mood?: Mood }) {
  const say = mood === 'happy' ? CHEER : mood === 'sad' ? OOPS : ASK;
  // Same line for the whole of one mood, picked fresh each time the mood changes.
  const line = useMemo(() => say[Math.floor(Math.random() * say.length)], [say]);
  return (
    <div className={'buddy' + (mood ? ' ' + mood : '')} aria-live="polite">
      <Mascot key={mood ?? 'idle'} id={id} size={64} mood={mood} />
      <span className="bubble">{line}</span>
    </div>
  );
}
