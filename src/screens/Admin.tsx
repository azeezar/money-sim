import { useState } from 'react';
import { BADGES } from '../data/badges';
import { LESSONS } from '../data/lessons';
import { PROFILES } from '../data/profiles';
import { ageOf } from '../lib/access';
import { ALL_TIERS, LADDER } from '../lib/config';
import { INSTRUMENTS } from '../lib/market';
import { adminEdit, backToToday, resetAccount } from '../state/actions';
import { getState, replaceState, resetStore, useStore } from '../state/store';
import type { ProfileId, State } from '../state/types';
import { toast } from '../ui/toast';

type NumKey = 'xp' | 'wallet' | 'stars' | 'hearts' | 'streak' | 'monthly' | 'startAmount';

/** Admin build only. Edits any part of the saved state, with shortcuts for common test setups. */
export function Admin() {
  const s = useStore();
  const [json, setJson] = useState('');
  const [err, setErr] = useState('');

  const num = (k: NumKey, label: string) => (
    <label className="field" key={k}>
      {label}
      <input
        type="number"
        value={s[k]}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) adminEdit((d) => void (d[k] = v));
        }}
      />
    </label>
  );

  return (
    <>
      <section className="hero h-admin">
        <span className="tag">Administrator build</span>
        <h1>Admin panel</h1>
        <p className="small">Every tier, lesson and the trading simulator are open in this build. Changes save to a separate admin copy of the data, so regular users are never affected.</p>
      </section>

      <div className="card">
        <h3>Quick setups</h3>
        <div className="chips" style={{ justifyContent: 'flex-start' }}>
          {LADDER.map((t) => (
            <button key={t.id} className="chip" onClick={() => adminEdit((d) => void (d.xp = t.at))}>
              Set XP to {t.name} ({t.at})
            </button>
          ))}
          <button className="chip" onClick={() => adminEdit((d) => ALL_TIERS.forEach((t) => LESSONS[t.id].forEach((l) => (d.done[l.id] = true))))}>
            Complete every lesson
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void (d.done = {}))}>
            Clear lesson progress
          </button>
          <button className="chip" onClick={() => adminEdit((d) => BADGES.forEach((b) => (d.badges[b.id] = true)))}>
            Award every badge
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void (d.badges = {}))}>
            Clear badges
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void ((d.wallet += 500), (d.stars += 100)))}>
            +500 XP wallet, +100 stars
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void (d.seen = {}))}>
            Replay unlock pop-ups
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void (d.onboarded = false))}>
            Re-run onboarding
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Player</h3>
        <div className="grid2">
          <label className="field">
            Name
            <input value={s.name} onChange={(e) => adminEdit((d) => void (d.name = e.target.value))} />
          </label>
          <label className="field">
            Investor profile
            <select value={s.profile} onChange={(e) => adminEdit((d) => void (d.profile = e.target.value as ProfileId))}>
              {Object.entries(PROFILES).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Date of birth (age {ageOf(s) ?? '?'}; under 18 hides Trade, child-friendly minigames)
            <input type="date" value={s.dob ?? ''} onChange={(e) => adminEdit((d) => void (d.dob = e.target.value || null))} />
          </label>
          {num('xp', 'Lifetime XP')}
          {num('wallet', 'XP wallet')}
          {num('stars', 'Stars')}
          {num('hearts', 'Hearts')}
          {num('streak', 'Streak (days)')}
        </div>
      </div>

      <div className="card">
        <h3>Savings and budget</h3>
        <div className="grid2">
          <label className="field">
            Goal name
            <input value={s.goal.name} onChange={(e) => adminEdit((d) => void (d.goal.name = e.target.value))} />
          </label>
          <label className="field">
            Goal target (£)
            <input type="number" value={s.goal.target} onChange={(e) => adminEdit((d) => void (d.goal.target = Number(e.target.value) || 0))} />
          </label>
          <label className="field">
            Pot saved (£)
            <input type="number" value={s.goal.saved} onChange={(e) => adminEdit((d) => void (d.goal.saved = Number(e.target.value) || 0))} />
          </label>
          <label className="field">
            Monthly income (£)
            <input type="number" value={s.budget.income} onChange={(e) => adminEdit((d) => void (d.budget.income = Number(e.target.value) || 0))} />
          </label>
          {num('monthly', 'Save per month (£)')}
          {num('startAmount', 'Starting pot (£)')}
        </div>
      </div>

      <div className="card">
        <h3>Simulator accounts</h3>
        <div className="grid2">
          <label className="field">
            Portfolio cash (£)
            <input type="number" value={s.portfolio.cash} onChange={(e) => adminEdit((d) => void (d.portfolio.cash = Number(e.target.value) || 0))} />
          </label>
          <label className="field">
            Trading cash (£)
            <input type="number" value={s.trading.cash} onChange={(e) => adminEdit((d) => void (d.trading.cash = Number(e.target.value) || 0))} />
          </label>
          <label className="field">
            UK-hours trading cash (£)
            <input type="number" value={s.tradingUk.cash} onChange={(e) => adminEdit((d) => void (d.tradingUk.cash = Number(e.target.value) || 0))} />
          </label>
        </div>
        <div className="chips" style={{ justifyContent: 'flex-start' }}>
          <button className="chip" onClick={() => resetAccount('portfolio')}>
            Reset portfolio (£{s.portfolioStart.toLocaleString('en-GB')})
          </button>
          <button className="chip" onClick={() => (resetAccount('trading'), resetAccount('tradingUk'))}>
            Reset both trading accounts
          </button>
          <button className="chip" onClick={() => (backToToday('trading'), backToToday('tradingUk'))}>
            Back to today (undo fast-forward)
          </button>
          <button className="chip" onClick={() => adminEdit((d) => void ((d.trading.orders = []), (d.tradingUk.orders = [])))}>
            Cancel all orders
          </button>
        </div>
        <p className="muted small">
          {INSTRUMENTS.length} simulated instruments. Prices, volatility and fundamentals live in <code>src/lib/market.ts</code>; the VRMNY easter egg's prices and news in <code>src/data/vermany.ts</code>; tier thresholds and economy numbers in <code>src/lib/config.ts</code>; lessons in <code>src/data/lessons.ts</code>; books in <code>src/data/books.ts</code>.
        </p>
      </div>

      <div className="card">
        <h3>Raw data editor</h3>
        <p className="muted small">The full saved state as JSON. Load it, edit anything, then apply. Missing fields are filled with defaults.</p>
        <div className="row">
          <button className="btn ghost" onClick={() => (setJson(JSON.stringify(getState(), null, 2)), setErr(''))}>
            Load current state
          </button>
          <button
            className="btn"
            disabled={!json}
            onClick={() => {
              try {
                const p = JSON.parse(json) as Partial<State>;
                if (!p || typeof p !== 'object' || p.v !== 2) throw new Error('The JSON must be an object with "v": 2.');
                replaceState(p);
                setErr('');
                toast('State applied');
              } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Apply
          </button>
        </div>
        {err && <p className="down small">{err}</p>}
        <textarea className="code" spellCheck={false} value={json} onChange={(e) => setJson(e.target.value)} placeholder="Press “Load current state”" rows={16} />
      </div>

      <div className="card">
        <h3>Danger zone</h3>
        <button className="btn bad" onClick={() => resetStore()}>
          Wipe admin data and start fresh
        </button>
      </div>
    </>
  );
}
