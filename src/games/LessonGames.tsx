import { useEffect, useMemo, useState } from 'react';
import { Mascot } from '../components/Mascot';
import { shuffle } from '../lib/format';
import type { MascotId } from '../state/types';
import type { Pool, QuizQ } from './pool';

export interface LessonGameProps {
  pool: Pool;
  /** Under-18 mode: no clocks, fewer rounds, gentler words. */
  kid: boolean;
  mascot: MascotId;
  onFinish: (good: boolean) => void;
}

const CHEER = ['Great job!', 'Brilliant!', 'You got it!', 'Super!', 'Nice one!'];

function Done({ good, kid, mascot, title, text, again }: { good: boolean; kid: boolean; mascot: MascotId; title: string; text: string; again: () => void }) {
  return (
    <div className="card">
      {kid && (
        <div className="center">
          <Mascot id={mascot} size={84} />
        </div>
      )}
      <div className={'fb ' + (good ? 'good' : 'bad')}>
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <button className="btn coin wide" onClick={again}>
        Play again
      </button>
    </div>
  );
}

/** Seconds since mount, ticking while `on`. */
function useClock(on: boolean, key: unknown) {
  const [t, setT] = useState(0);
  useEffect(() => {
    setT(0);
    if (!on) return;
    const id = setInterval(() => setT((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [on, key]);
  return t;
}

/* ------------------------------------------------------------- Term Match */

export function TermMatch({ pool, kid, mascot, onFinish }: LessonGameProps) {
  const [round, setRound] = useState(0);
  const deck = useMemo(() => shuffle(pool.pairs).slice(0, kid ? 4 : 6), [pool, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const left = useMemo(() => shuffle(deck.map((_, i) => i)), [deck]);
  const right = useMemo(() => shuffle(deck.map((_, i) => i)), [deck]);
  const [pl, setPl] = useState<number | null>(null);
  const [pr, setPr] = useState<number | null>(null);
  const [done, setDone] = useState<Record<number, true>>({});
  const [bad, setBad] = useState<[number, number] | null>(null);
  const [miss, setMiss] = useState(0);
  const finished = Object.keys(done).length === deck.length;
  const secs = useClock(!kid && !finished, round);

  useEffect(() => {
    if (finished) onFinish(miss <= 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const tap = (side: 'l' | 'r', ix: number) => {
    if (done[ix] || bad) return;
    const L = side === 'l' ? ix : pl;
    const R = side === 'r' ? ix : pr;
    if (L === null || R === null) return side === 'l' ? setPl(ix) : setPr(ix);
    setPl(null);
    setPr(null);
    if (L === R) return setDone((d) => ({ ...d, [L]: true }));
    setMiss((m) => m + 1);
    setBad([L, R]);
    setTimeout(() => setBad(null), 650);
  };

  if (finished) {
    const good = miss <= 1;
    return (
      <Done
        good={good}
        kid={kid}
        mascot={mascot}
        title={kid ? (good ? CHEER[miss % CHEER.length] : 'Good try!') : good ? 'Sharp memory' : 'Worth another go'}
        text={kid ? `You matched all ${deck.length} words${miss ? ` with ${miss} wrong ${miss === 1 ? 'guess' : 'guesses'}` : ' with no mistakes'}.` : `${deck.length} pairs in ${secs}s with ${miss} ${miss === 1 ? 'mistake' : 'mistakes'}. One mistake or fewer earns the bonus.`}
        again={() => (setRound((r) => r + 1), setDone({}), setMiss(0))}
      />
    );
  }

  const btn = (side: 'l' | 'r', ix: number, txt: string) => {
    const sel = (side === 'l' ? pl : pr) === ix;
    const no = bad && bad[side === 'l' ? 0 : 1] === ix;
    return (
      <button key={side + ix} className={'opt ' + (done[ix] ? 'gone' : no ? 'no' : sel ? 'sel' : '')} disabled={!!done[ix]} onClick={() => tap(side, ix)}>
        {txt}
      </button>
    );
  };
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{kid ? 'Match each word to what it means' : 'Match each term to its meaning'}</b>
        {!kid && <span className="chip num">{secs}s</span>}
      </div>
      <div className="match">
        <div className="opts">{left.map((ix) => btn('l', ix, deck[ix][0]))}</div>
        <div className="opts">{right.map((ix) => btn('r', ix, deck[ix][1]))}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Quick Quiz */

const PER_Q = 15;

export function QuickQuiz({ pool, kid, mascot, onFinish }: LessonGameProps) {
  const deal = () => shuffle(pool.questions).slice(0, kid ? 5 : 8).map((q) => ({ q, ord: q.o.length === 2 ? [0, 1] : shuffle(q.o.map((_, i) => i)) }));
  const [deck, setDeck] = useState(deal);
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const over = i >= deck.length;
  const secs = useClock(!kid && !over && sel === null, i);
  const pass = Math.ceil(deck.length * 0.75);

  const answer = (ix: number) => {
    if (sel !== null) return;
    setSel(ix);
    if (ix === 0) setScore((n) => n + 1);
  };
  // Running out of time counts as a wrong answer (-1 never matches an option).
  useEffect(() => {
    if (!kid && sel === null && secs >= PER_Q) setSel(-1);
  }, [kid, sel, secs]);
  useEffect(() => {
    if (over) onFinish(score >= pass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  if (over) {
    const good = score >= pass;
    return (
      <Done
        good={good}
        kid={kid}
        mascot={mascot}
        title={kid ? (good ? 'Quiz star!' : 'Good try!') : good ? 'Well learned' : 'Worth another go'}
        text={`You got ${score} of ${deck.length} right.${good ? '' : ` ${pass} earns the bonus. Revisit the lessons in this tier, then try again.`}`}
        again={() => (setDeck(deal()), setI(0), setSel(null), setScore(0))}
      />
    );
  }

  const { q, ord }: { q: QuizQ; ord: number[] } = deck[i];
  const options = q.o;
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="tag">
          Question {i + 1} of {deck.length}
        </span>
        {!kid && <span className={'chip num' + (PER_Q - secs <= 5 && sel === null ? ' down' : '')}>{sel === null ? `${Math.max(0, PER_Q - secs)}s` : '—'}</span>}
      </div>
      <div className="bar">
        <i style={{ width: `${(i / deck.length) * 100}%` }} />
      </div>
      {kid ? (
        <div className="teach">
          <Mascot id={mascot} size={48} />
          <h2>{q.q}</h2>
        </div>
      ) : (
        <h2>{q.q}</h2>
      )}
      <div className="opts">
        {ord.map((ix) => (
          <button key={ix} className={'opt ' + (sel === null ? '' : ix === 0 ? 'ok' : ix === sel ? 'no' : '')} disabled={sel !== null} onClick={() => answer(ix)}>
            {options[ix]}
          </button>
        ))}
      </div>
      {sel !== null && (
        <div className={'fb ' + (sel === 0 ? 'good' : 'bad')}>
          <b>{sel === 0 ? (kid ? CHEER[i % CHEER.length] : 'Correct') : sel === -1 ? 'Out of time' : 'Not quite'}</b>
          <p>{q.why}</p>
          <button className={'btn wide ' + (sel === 0 ? 'good' : 'bad')} onClick={() => (setI(i + 1), setSel(null))}>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
