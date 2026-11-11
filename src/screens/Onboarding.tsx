import { useState } from 'react';
import { Mascot, MascotPicker } from '../components/Mascot';
import { GOAL_DEFAULTS, PROFILES, QUIZ, profileFor } from '../data/profiles';
import { LADDER, PLACEMENT } from '../lib/config';
import { gbp } from '../lib/format';
import { tierIndex } from '../lib/progress';
import { ADULT_AGE, ageFrom, validAge } from '../lib/access';
import { completeOnboarding, setDob } from '../state/actions';
import { useStore } from '../state/store';
import type { MascotId, Quiz } from '../state/types';

interface Draft {
  name: string;
  dob: string;
  mascot: MascotId;
  quiz: Partial<Quiz>;
  start: string;
  income: string;
  monthly: string;
  goalName: string | null;
  target: string | null;
}

/** Steps: 0 welcome + buddy, 1-4 quiz, 5 virtual money, 6 goal, 7 your path. A retake only repeats the quiz. */
export function Onboarding({ retake, onDone }: { retake: boolean; onDone: () => void }) {
  const s = useStore();
  const flow = retake ? [1, 2, 3, 4, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
  const [pos, setPos] = useState(0);
  const [err, setErr] = useState('');
  const [d, setD] = useState<Draft>(() => ({
    name: s.name,
    dob: s.dob ?? '',
    mascot: s.mascot,
    quiz: retake ? { ...s.quiz } : {},
    start: String(retake ? s.startAmount : 1000),
    income: String(retake ? s.budget.income : 2000),
    monthly: String(retake ? s.monthly : 100),
    goalName: null,
    target: null,
  }));
  const step = flow[pos];
  const set = (p: Partial<Draft>) => {
    setErr('');
    setD((x) => ({ ...x, ...p }));
  };

  const start = Math.round(+d.start);
  const income = Math.round(+d.income);
  const monthly = Math.round(+d.monthly);
  const def = GOAL_DEFAULTS[d.quiz.why ?? 'grow'] ?? GOAL_DEFAULTS.grow;
  const goalName = d.goalName ?? def[0];
  const target = d.target !== null ? Math.round(+d.target) : Math.max(def[1], (start || 0) * 2);
  const profile = profileFor(d.quiz);
  const headStart = PLACEMENT[d.quiz.know ?? 'new'] ?? 0;
  const startTier = LADDER[tierIndex(headStart)];

  const quizStep = step >= 1 && step <= 4 ? QUIZ[step - 1] : null;
  const canNext = quizStep ? !!d.quiz[quizStep.k] : true;

  const ageOk = validAge(ageFrom(d.dob));

  function next() {
    if (step === 0 && !ageOk) return setErr('Enter your date of birth to continue.');
    if (step === 5) {
      if (!(start >= 0) || !(income >= 1) || !(monthly >= 1)) return setErr('Enter a starting amount of £0 or more, a monthly income and a monthly saving of at least £1.');
      if (monthly > income) return setErr('Your monthly saving cannot be more than your monthly income.');
    }
    if (step === 6) {
      if (!(target > start)) return setErr(`Your target needs to be higher than your starting pot of ${gbp(start)}.`);
    }
    if (step === 7) {
      completeOnboarding(
        { name: d.name.trim(), dob: retake ? undefined : d.dob, mascot: d.mascot, quiz: d.quiz, startAmount: start, income, monthly, goalName: goalName.trim() || 'My goal', target },
        retake,
      );
      return onDone();
    }
    setErr('');
    setPos(pos + 1);
  }

  let body;
  if (step === 0) {
    body = (
      <>
        <div className="col center">
          <Mascot id={d.mascot} size={96} />
          <h1>Welcome to Money Sim</h1>
          <p className="muted">Learn how saving and investing work, build a virtual portfolio, and practise trading with pretend money, so you see the risks before they cost you anything.</p>
        </div>
        <label className="field" htmlFor="ob-name">
          What should we call you? (optional)
          <input id="ob-name" maxLength={20} autoComplete="off" value={d.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <AgeField value={d.dob} onChange={(dob) => set({ dob })} />
        <div className="col">
          <h3>Pick your buddy</h3>
          <MascotPicker value={d.mascot} onChange={(m) => set({ mascot: m })} />
          <p className="muted small">You can change this any time in your Profile.</p>
        </div>
      </>
    );
  } else if (quizStep) {
    body = (
      <>
        <div className="teach">
          <Mascot id={d.mascot} size={48} />
          <h2>{quizStep.q}</h2>
        </div>
        <div className="opts">
          {quizStep.o.map(([v, label]) => (
            <button key={v} type="button" className={'opt' + (d.quiz[quizStep.k] === v ? ' sel' : '')} onClick={() => set({ quiz: { ...d.quiz, [quizStep.k]: v } })}>
              {label}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 5) {
    body = (
      <>
        <div className="teach">
          <Mascot id={d.mascot} size={48} />
          <div className="col">
            <h2>Set your virtual money</h2>
            <p className="muted">Enter the amounts you would really use. You get the same in virtual pounds, so practice feels real and costs nothing.</p>
          </div>
        </div>
        <label className="field" htmlFor="ob-start">
          Starting amount (£)
          <input id="ob-start" type="number" inputMode="decimal" min={0} value={d.start} onChange={(e) => set({ start: e.target.value })} />
        </label>
        <label className="field" htmlFor="ob-income">
          Monthly income (£)
          <input id="ob-income" type="number" inputMode="decimal" min={1} value={d.income} onChange={(e) => set({ income: e.target.value })} />
        </label>
        <label className="field" htmlFor="ob-monthly">
          Amount you aim to save each month (£)
          <input id="ob-monthly" type="number" inputMode="decimal" min={1} value={d.monthly} onChange={(e) => set({ monthly: e.target.value })} />
        </label>
      </>
    );
  } else if (step === 6) {
    body = (
      <>
        <div className="teach">
          <Mascot id={d.mascot} size={48} />
          <div className="col">
            <h2>Create your savings goal</h2>
            <p className="muted">Your pot starts at {gbp(start)}. Each month you hit your savings goal in the budget planner, the saving joins your pot and earns XP.</p>
          </div>
        </div>
        <label className="field" htmlFor="ob-goal">
          Goal name
          <input id="ob-goal" maxLength={30} value={goalName} onChange={(e) => set({ goalName: e.target.value })} />
        </label>
        <label className="field" htmlFor="ob-target">
          Target amount (£)
          <input id="ob-target" type="number" inputMode="decimal" min={1} value={d.target ?? String(target)} onChange={(e) => set({ target: e.target.value })} />
        </label>
      </>
    );
  } else {
    body = (
      <>
        <div className="col center">
          <Mascot id={d.mascot} size={84} />
          <span className="tag">{retake ? 'Your updated profile' : 'Your starting path'}</span>
          <h1>{PROFILES[profile].name}</h1>
          <p className="muted">{PROFILES[profile].blurb}</p>
        </div>
        {!retake && (
          <div className="card">
            <span className="tag">Where you start</span>
            <p>
              You begin at <b>{startTier.name}</b>
              {headStart > 0 ? `, with a ${headStart} XP head start from your quiz.` : '. Earn XP from lessons and your budget to unlock the next tier.'}
            </p>
            <div className="chips">
              <span className="chip">Pot {gbp(start)}</span>
              <span className="chip">Save {gbp(monthly)} a month</span>
              <span className="chip">Goal {gbp(target)}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  const label = step === 0 ? 'Start the quiz' : step === 7 ? (retake ? 'Save and go back' : 'Start learning') : 'Continue';

  return (
    <div className="over">
      <div className="over-in">
        <div className="dots" aria-hidden="true">
          {flow.map((_, i) => (
            <i key={i} className={i <= pos ? 'on' : ''} />
          ))}
        </div>
        <div className="lbody">{body}</div>
        {err && (
          <p className="down small" role="alert">
            {err}
          </p>
        )}
        <div className="row">
          {pos > 0 && (
            <button type="button" className="btn ghost" onClick={() => (setErr(''), setPos(pos - 1))}>
              Back
            </button>
          )}
          <button type="button" className="btn grow" disabled={!canNext} onClick={next}>
            {label}
          </button>
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>
          All money in this prototype is virtual. This is education, not financial advice.
        </p>
      </div>
    </div>
  );
}

function AgeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const age = ageFrom(value);
  const today = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return (
    <label className="field" htmlFor="ob-dob">
      Date of birth (required)
      <input id="ob-dob" type="date" required min={`${today.getFullYear() - 120}-01-01`} max={iso(today)} value={value} onChange={(e) => onChange(e.target.value)} />
      {value !== '' && !validAge(age) && <span className="small" style={{ color: 'var(--bad)' }}>Check the date: you need to be between 4 and 120.</span>}
      {validAge(age) && (
        <span className="muted small">
          You are {age}.{age < ADULT_AGE && ' Under 18s get the lessons, portfolio and child-friendly minigames. The trading simulator opens at 18.'}
        </span>
      )}
    </label>
  );
}

/** Saves from before date of birth was asked: ask once, then carry on. */
export function AgeGate() {
  const s = useStore();
  const [v, setV] = useState('');
  const ok = validAge(ageFrom(v));
  return (
    <div className="over">
      <div className="over-in">
        <div className="lbody">
          <div className="col center">
            <Mascot id={s.mascot} size={84} />
            <h1>One quick question</h1>
            <p className="muted">Money Sim now tailors what you see to your age. Some features, like the trading simulator, are for over 18s only.</p>
          </div>
          <AgeField value={v} onChange={setV} />
        </div>
        <button type="button" className="btn wide" disabled={!ok} onClick={() => setDob(v)}>
          Continue
        </button>
      </div>
    </div>
  );
}
