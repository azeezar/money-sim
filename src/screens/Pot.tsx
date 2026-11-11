import { useState } from 'react';
import { spentIn, summarise } from '../lib/budget';
import { BUDGET_XP } from '../lib/config';
import { gbp, money } from '../lib/format';
import { monthReward } from '../lib/progress';
import { addDeposit, addTxn, autoPlan, closeMonth, removeTxn, saveGoal, savePlan, setPlanned } from '../state/actions';
import { useStore } from '../state/store';
import type { BudgetCat, MonthRecord } from '../state/types';
import { toast } from '../ui/toast';

const num = (v: string): number => (v.trim() === '' ? NaN : Number(v));

export function Pot({ onGames }: { onGames: () => void }) {
  const s = useStore();
  const g = s.goal;
  const b = s.budget;
  const sum = summarise(b, s.monthly);
  const p = g.target > 0 ? Math.min(1, g.saved / g.target) : 0;
  const left = Math.max(0, g.target - g.saved);
  const months = Math.ceil(left / Math.max(1, s.monthly));
  const monthNo = b.history.length + 1;

  const [editGoal, setEditGoal] = useState(false);
  const [gName, setGName] = useState(g.name);
  const [gTarget, setGTarget] = useState(String(g.target));
  const [dep, setDep] = useState('');
  const [cat, setCat] = useState(b.cats[0]?.id ?? '');
  const [amt, setAmt] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<MonthRecord | null>(null);

  const catName = (id: string) => b.cats.find((c) => c.id === id)?.name ?? id;

  function addSpend() {
    const a = num(amt);
    if (!(a > 0) || a > 1e7) return setErr('Enter an amount greater than £0.');
    addTxn(cat, Math.round(a * 100) / 100, note.trim());
    setAmt('');
    setNote('');
    setErr('');
    setResult(null);
  }

  function deposit() {
    const a = Math.round(num(dep));
    if (!(a >= 1)) return toast('Enter an amount of at least £1.');
    addDeposit(a);
    setDep('');
    toast(`${gbp(a)} added to your pot`);
  }

  function saveGoalEdit() {
    const t = Math.round(num(gTarget));
    if (!(t >= 1)) return toast('Target must be at least £1.');
    saveGoal(gName.trim() || 'My goal', t);
    setEditGoal(false);
    toast('Goal saved');
  }

  const row = (c: BudgetCat) => {
    const spent = spentIn(b.txns, c.id);
    const over = spent > c.planned;
    return (
      <div className="catrow" key={c.id}>
        <div className="catname">
          <b>{c.name}</b>
          <span className={'small num ' + (over ? 'down' : 'muted')}>
            {money(spent)} of {money(c.planned)}
          </span>
        </div>
        <label className="sr-only" htmlFor={`plan-${c.id}`}>
          Planned for {c.name}
        </label>
        <input
          id={`plan-${c.id}`}
          className="mini"
          type="number"
          inputMode="decimal"
          min={0}
          value={c.planned}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setPlanned(c.id, Math.max(0, Math.round(num(e.target.value) || 0)))}
        />
        <div className={'bar ' + (over ? 'badbar' : 'pri')} style={{ gridColumn: '1 / -1' }}>
          <i style={{ width: `${c.planned > 0 ? Math.min(100, (spent / c.planned) * 100) : spent > 0 ? 100 : 0}%` }} />
        </div>
      </div>
    );
  };

  const preview = monthReward(sum.saved, s.monthly);

  return (
    <>
      <div className="card">
        <span className="tag">Virtual pot · {g.name}</span>
        <div className="big num">{gbp(g.saved)}</div>
        <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={g.target} aria-valuenow={Math.min(g.saved, g.target)} aria-label="Progress to goal">
          <i style={{ width: `${p * 100}%` }} />
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="muted num">
            {Math.round(p * 100)}% of {gbp(g.target)}
          </span>
          <span className="muted num">{left > 0 ? `${gbp(left)} to go · about ${months} ${months === 1 ? 'month' : 'months'} at ${gbp(s.monthly)}` : 'Goal reached'}</span>
        </div>
        <div className="row">
          <label className="field grow" htmlFor="g-dep">
            <span className="small">Add a virtual deposit (£)</span>
            <input id="g-dep" type="number" inputMode="decimal" min={1} placeholder="50" value={dep} onChange={(e) => setDep(e.target.value)} />
          </label>
          <button className="btn" style={{ alignSelf: 'flex-end' }} onClick={deposit}>
            Add
          </button>
        </div>
        {editGoal ? (
          <div className="col">
            <label className="field" htmlFor="g-name">
              Goal name
              <input id="g-name" maxLength={30} value={gName} onChange={(e) => setGName(e.target.value)} />
            </label>
            <label className="field" htmlFor="g-target">
              Target (£)
              <input id="g-target" type="number" min={1} value={gTarget} onChange={(e) => setGTarget(e.target.value)} />
            </label>
            <div className="row">
              <button className="btn ghost" onClick={() => setEditGoal(false)}>
                Cancel
              </button>
              <button className="btn grow" onClick={saveGoalEdit}>
                Save goal
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn ghost"
            onClick={() => {
              setGName(g.name);
              setGTarget(String(g.target));
              setEditGoal(true);
            }}
          >
            Edit goal
          </button>
        )}
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="tag">Budget planner</span>
            <h2>Month {monthNo}</h2>
          </div>
          <span className="chip">Hit your goal: +{BUDGET_XP.hit} XP</span>
        </div>
        <div className="row">
          <label className="field grow" htmlFor="b-income">
            Monthly income (£)
            <input id="b-income" type="number" inputMode="decimal" min={0} value={b.income} onFocus={(e) => e.target.select()} onChange={(e) => savePlan(Math.max(0, num(e.target.value) || 0), s.monthly)} />
          </label>
          <label className="field grow" htmlFor="b-save">
            Savings goal for the month (£)
            <input id="b-save" type="number" inputMode="decimal" min={0} value={s.monthly} onFocus={(e) => e.target.select()} onChange={(e) => savePlan(b.income, Math.max(0, num(e.target.value) || 0))} />
          </label>
        </div>
        <div className="tiles">
          <div className="tile">
            <span className="small muted">Spent so far</span>
            <b className="num">{money(sum.spent)}</b>
          </div>
          <div className="tile">
            <span className="small muted">Can spend</span>
            <b className="num">{money(sum.available)}</b>
          </div>
          <div className="tile">
            <span className="small muted">Left to spend</span>
            <b className={'num ' + (sum.onTrack ? 'up' : 'down')}>{money(sum.left)}</b>
          </div>
        </div>
        <div className={'fb ' + (sum.onTrack ? 'good' : 'bad')}>
          <b>{sum.onTrack ? 'On track for your savings goal' : 'Your savings goal is at risk'}</b>
          <p className="small">
            {sum.onTrack
              ? `If the month ended now you would save ${money(sum.saved)} against a goal of ${money(s.monthly)}.`
              : `You have spent ${money(-sum.left)} more than the ${money(sum.available)} you can spend while still saving ${money(s.monthly)}.`}
          </p>
        </div>
        {sum.planGap < -0.5 && (
          <div className="fb bad">
            <b>Your plan overspends</b>
            <p className="small">
              Planned spending is {money(sum.plannedTotal)}, but only {money(sum.available)} is free after saving {money(s.monthly)}. Trim {money(-sum.planGap)} somewhere, or let the planner re-split it.
            </p>
            <button className="btn ghost" onClick={autoPlan}>
              Re-split my plan
            </button>
          </div>
        )}

        <span className="tag">Needs</span>
        {b.cats.filter((c) => c.kind === 'need').map(row)}
        <span className="tag">Wants</span>
        {b.cats.filter((c) => c.kind === 'want').map(row)}
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="small muted num">Planned total {money(sum.plannedTotal)}</span>
          <button className="btn ghost" onClick={autoPlan}>
            Auto-plan
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Log a spend</h3>
        <div className="row">
          <label className="field grow" htmlFor="t-cat">
            Category
            <select id="t-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
              {b.cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field grow" htmlFor="t-amt">
            Amount (£)
            <input id="t-amt" type="number" inputMode="decimal" min={0} step="0.01" placeholder="12.50" value={amt} onChange={(e) => setAmt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSpend()} />
          </label>
        </div>
        <label className="field" htmlFor="t-note">
          Note (optional)
          <input id="t-note" maxLength={40} placeholder="Lunch with Sam" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSpend()} />
        </label>
        {err && (
          <p className="down small" role="alert">
            {err}
          </p>
        )}
        <button className="btn wide" onClick={addSpend}>
          Add spend
        </button>
        {b.txns.length > 0 && (
          <div className="log">
            {b.txns
              .slice(-6)
              .reverse()
              .map((t) => (
                <div key={t.id}>
                  <span>
                    {catName(t.cat)}
                    {t.note ? ` · ${t.note}` : ''}
                  </span>
                  <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <span className="num">{money(t.amount)}</span>
                    <button className="x" aria-label={`Remove ${money(t.amount)} ${catName(t.cat)}`} onClick={() => removeTxn(t.id)}>
                      ×
                    </button>
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Close month {monthNo}</h3>
        <p className="muted small">
          Closing adds what you saved to your pot. Hit your savings goal and you earn {BUDGET_XP.hit} XP, plus {BUDGET_XP.bonus} more for saving {Math.round((BUDGET_XP.bonusRatio - 1) * 100)}% over it. That XP can be moved into a minigame.
        </p>
        {!confirm ? (
          <button className="btn good wide" disabled={b.txns.length === 0} onClick={() => setConfirm(true)}>
            Close month
          </button>
        ) : (
          <div className="fb good">
            <b>Ready to close month {monthNo}?</b>
            <p>
              Income {money(b.income)} − spent {money(sum.spent)} = <b className="num">{money(sum.saved)}</b> saved against a goal of {money(s.monthly)}.
            </p>
            <p className="small">{preview.hit ? `Goal hit. You will earn ${preview.xp} XP.` : `Goal missed. You will earn ${preview.xp} XP for logging the month.`}</p>
            <div className="row">
              <button className="btn ghost" onClick={() => setConfirm(false)}>
                Not yet
              </button>
              <button
                className="btn good grow"
                onClick={() => {
                  setResult(closeMonth());
                  setConfirm(false);
                }}
              >
                Close and bank {money(Math.max(0, sum.saved))}
              </button>
            </div>
          </div>
        )}
        {b.txns.length === 0 && <p className="muted small">Log at least one spend to close the month.</p>}
        {result && (
          <div className={'fb ' + (result.hit ? 'good' : 'bad')}>
            <b>{result.hit ? 'Savings goal hit' : 'Month closed'}</b>
            <p>
              You saved <span className="num">{money(result.saved)}</span> against {money(result.target)} and earned {result.xp} XP.
            </p>
            <button className="btn ghost" onClick={onGames}>
              Spend XP in minigames
            </button>
          </div>
        )}
        {b.history.length > 0 && (
          <div className="log">
            {b.history
              .slice(-6)
              .reverse()
              .map((h) => (
                <div key={h.n}>
                  <span>
                    Month {h.n} · saved <span className="num">{money(h.saved)}</span> of {money(h.target)}
                  </span>
                  <span className={h.hit ? 'up' : 'down'}>{h.hit ? 'Hit' : 'Missed'} · +{h.xp} XP</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
