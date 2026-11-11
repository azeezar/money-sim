import { useState } from 'react';
import { Mascot, MASCOTS, buddyName } from '../components/Mascot';
import { Quests } from '../components/Quests';
import { XpBar } from '../components/XpBar';
import { BADGES } from '../data/badges';
import { BOOKS } from '../data/books';
import { LESSONS } from '../data/lessons';
import { PROFILES } from '../data/profiles';
import { summarise } from '../lib/budget';
import { canTrade, isAdult } from '../lib/access';
import { ALL_TIERS, TRADING_START_CASH } from '../lib/config';
import { gbp } from '../lib/format';
import { currentTier } from '../lib/progress';
import { clockOf, valueOf } from '../lib/trading';
import { resetStore, useStore } from '../state/store';
import { setTheme, useTheme } from '../ui/theme';
import { useNow } from '../ui/useNow';

const pctS = (r: number) => `${r >= 0 ? '+' : '−'}${Math.abs(r * 100).toFixed(1)}%`;

/** Everything about the user in one place: money, goals, learning, rewards and settings. */
export function Profile({ onRetake, go }: { onRetake: () => void; go: (v: 'pot' | 'portfolio' | 'trade' | 'learn') => void }) {
  const s = useStore();
  const now = useNow(5000);
  const theme = useTheme();
  const [confirm, setConfirm] = useState(false);
  const buddy = MASCOTS.find((m) => m.id === s.mascot)!;
  const p = PROFILES[s.profile];
  const lessonCount = Object.values(LESSONS).reduce((n, l) => n + l.length, 0);
  const done = Object.keys(s.done).length;
  const pv = valueOf(s.portfolio, now);
  // Both trading accounts (24h and UK hours), each on its own clock.
  const tv = { value: valueOf(s.trading, clockOf(s.trading, now)).value + valueOf(s.tradingUk, clockOf(s.tradingUk, now)).value };
  const tStart = (s.trading.start ?? TRADING_START_CASH) + (s.tradingUk.start ?? TRADING_START_CASH);
  const tradeOpen = canTrade(s);
  const net = s.goal.saved + pv.value + (tradeOpen ? tv.value : 0);
  const g = s.goal;
  const gp = g.target > 0 ? Math.min(100, (g.saved / g.target) * 100) : 0;
  const bs = summarise(s.budget, s.monthly);
  const hits = s.budget.history.filter((h) => h.hit).length;
  const earned = Object.keys(s.badges).length;

  return (
    <>
      <section className="hero h-profile">
        <div className="row">
          <Mascot id={s.mascot} size={72} />
          <div className="grow">
            <span className="tag">{currentTier(s.xp).name} · {p.name}</span>
            <h1>{s.name || 'Your profile'}</h1>
            <span className="small">
              with {buddyName(s.mascot, s.look.nick)}, {buddy.tag.toLowerCase()}
            </span>
          </div>
        </div>
        <div className="chips" style={{ justifyContent: 'flex-start' }}>
          <span className="chip num">⚡ {s.xp} XP</span>
          <span className="chip num">🔥 {s.streak}-day streak</span>
          <span className="chip num">★ {s.stars} stars</span>
          <span className="chip num">♥ {s.hearts} hearts</span>
        </div>
      </section>

      <div className="card">
        <span className="tag">Net worth (virtual)</span>
        <div className="big num">{gbp(net)}</div>
        <div className="tiles four">
          <button className="tile c1" onClick={() => go('pot')}>
            <span className="small">Savings pot</span>
            <b className="num">{gbp(g.saved)}</b>
          </button>
          <button className="tile c2" onClick={() => go('portfolio')}>
            <span className="small">Portfolio</span>
            <b className="num">{gbp(pv.value)}</b>
            <span className={'small num ' + (pv.value >= s.portfolioStart ? 'up' : 'down')}>{pctS((pv.value - s.portfolioStart) / s.portfolioStart)}</span>
          </button>
          <button className="tile c3" onClick={() => isAdult(s) && go('trade')}>
            <span className="small">Trading</span>
            {tradeOpen ? (
              <>
                <b className="num">{gbp(tv.value)}</b>
                <span className={'small num ' + (tv.value >= tStart ? 'up' : 'down')}>{pctS((tv.value - tStart) / tStart)}</span>
              </>
            ) : (
              <b>{isAdult(s) ? 'Locked' : '18+ only'}</b>
            )}
          </button>
          <div className="tile c4">
            <span className="small">Holdings</span>
            <b className="num">{Object.keys(s.portfolio.positions).length + Object.keys(s.trading.positions).length + Object.keys(s.tradingUk.positions).length}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Budget goals</h3>
          <button className="chip" onClick={() => go('pot')}>
            Open My budget ›
          </button>
        </div>
        {g.target > 0 ? (
          <>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{g.name}</b>
              <span className="num muted">
                {gbp(g.saved)} of {gbp(g.target)}
              </span>
            </div>
            <div className="bar">
              <i style={{ width: `${gp}%` }} />
            </div>
          </>
        ) : (
          <p className="muted">No savings goal yet.</p>
        )}
        <div className="tiles">
          <div className="tile">
            <span className="muted small">Save each month</span>
            <b className="num">{gbp(s.monthly)}</b>
          </div>
          <div className="tile">
            <span className="muted small">Spent this month</span>
            <b className="num">{gbp(bs.spent)}</b>
          </div>
          <div className="tile">
            <span className="muted small">Left to spend</span>
            <b className={'num ' + (bs.left >= 0 ? 'up' : 'down')}>{gbp(bs.left)}</b>
          </div>
        </div>
        <p className="muted small num">
          Income {gbp(s.budget.income)} a month · {s.budget.history.length} months closed · goal hit {hits} {hits === 1 ? 'time' : 'times'}
        </p>
      </div>

      <XpBar xp={s.xp} />

      <div className="card">
        <h3>Learning</h3>
        <p className="muted small num">
          {done} of {lessonCount} lessons finished
        </p>
        {ALL_TIERS.map((t) => {
          const ls = LESSONS[t.id];
          const d = ls.filter((l) => s.done[l.id]).length;
          return (
            <div key={t.id} className={`tierrow t-${t.id}`}>
              <span className="small">
                <b>{t.name}</b>
              </span>
              <div className="bar tb">
                <i style={{ width: `${(d / ls.length) * 100}%` }} />
              </div>
              <span className="small num muted">
                {d}/{ls.length}
              </span>
            </div>
          );
        })}
        <p className="small num">
          📚 {Object.keys(s.reading).length} of {BOOKS.length} recommended books read
        </p>
      </div>

      <div className="m-only">
        <Quests s={s} />
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Badges</h3>
          <span className="chip num">
            {earned}/{BADGES.length}
          </span>
        </div>
        <div className="badges">
          {BADGES.map((b) => (
            <div className={'badge' + (s.badges[b.id] ? '' : ' off')} key={b.id}>
              <span className="medal" aria-hidden="true">
                {b.glyph}
              </span>
              {b.name}
              <span className="muted small" style={{ fontWeight: 500 }}>
                {b.how}
              </span>
              <span className="sr-only">{s.badges[b.id] ? 'Earned' : 'Locked'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Appearance</h3>
        <div className="seg-s" role="group" aria-label="Theme">
          <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
            ☀︎ Light
          </button>
          <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
            ☾ Dark
          </button>
        </div>
      </div>

      <div className="card">
        <span className="tag">Your investor profile</span>
        <h3>{p.name}</h3>
        <p className="muted">{p.blurb}</p>
        <button className="btn ghost" onClick={onRetake}>
          Retake the starting quiz
        </button>
      </div>

      <div className="card">
        <h3>Your data</h3>
        <p className="muted small">Progress is saved in this browser only. All money is virtual and nothing here is financial advice.</p>
        <button
          className={'btn ' + (confirm ? 'bad' : 'ghost')}
          onClick={() => {
            if (!confirm) return setConfirm(true);
            resetStore();
          }}
        >
          {confirm ? 'Tap again to erase everything' : 'Erase all progress'}
        </button>
      </div>
    </>
  );
}
