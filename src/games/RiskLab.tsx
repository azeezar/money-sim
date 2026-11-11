import { useState } from 'react';
import { pct, short, gbp } from '../lib/format';
import { getState } from '../state/store';
export interface GameProps {
  level: number;
  /** Called once when a run ends. `good` earns the bonus stars. */
  onFinish: (good: boolean, meta?: { steady?: boolean }) => void;
}
import { riskYears } from './levels';
import { STRAT, choose, newRun, type Run, type Strat } from './risk-model';

function Chart({ run }: { run: Run }) {
  const W = 320, H = 176, l = 44, r = 12, t = 12, b = 22;
  const peak = Math.max(...run.hist, ...run.gh);
  const max = peak * 1.06;
  const X = (i: number) => l + ((W - l - r) * i) / run.years;
  const Y = (v: number) => t + (H - t - b) * (1 - v / max);
  const ln = (a: number[]) => a.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const ticks = [0, peak];
  if (run.start < peak * 0.8 && run.start > peak * 0.14) ticks.push(run.start);
  const e = run.hist.length - 1;
  const mid = Math.round(run.years / 2);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Your balance compared with the steady fund over the years">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeWidth="1" />
          <text x={l - 6} y={Y(v) + 3} textAnchor="end">
            {short(v)}
          </text>
        </g>
      ))}
      {[0, mid, run.years].map((i, k) => (
        <text key={k} x={X(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === run.years ? 'end' : 'middle'}>
          {i === 0 ? 'Now' : `Year ${i}`}
        </text>
      ))}
      <polyline points={ln(run.gh)} fill="none" stroke="var(--muted)" strokeWidth="2" strokeDasharray="4 4" />
      <polyline points={ln(run.hist)} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(e)} cy={Y(run.hist[e])} r="5" fill="var(--primary)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}

export function RiskLab({ level, onFinish }: GameProps) {
  const years = riskYears(level);
  const [run, setRun] = useState<Run>(() => newRun(Math.max(100, getState().goal.saved), years));

  function pickStrat(k: Strat) {
    const next = choose(run, k);
    setRun(next);
    if (next.over) {
      const steady = !next.wiped && next.log.every((x) => x.k === 'fund');
      onFinish(steady, { steady });
    }
  }

  const yr = run.log.length;
  const d = run.bal - run.start;
  const g = run.gh[run.gh.length - 1];

  return (
    <>
      <div className="card">
        <span className="tag">What-if only</span>
        <p className="muted">
          This takes a copy of your {gbp(run.start)} pot. Your real virtual pot is never touched. Each year, choose where the money goes. {years} years this round.
        </p>
      </div>
      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className="tag">{run.over ? (run.wiped ? `Wiped out in year ${yr}` : `After ${years} years`) : `Year ${yr} of ${years}`}</span>
            <div className="big num">{gbp(run.bal)}</div>
          </div>
          <span className={'num ' + (d >= 0 ? 'up' : 'down')}>
            {d >= 0 ? '+' : '−'}
            {gbp(Math.abs(d))}
          </span>
        </div>
        <Chart run={run} />
        <div className="legend">
          <span>
            <i style={{ background: 'var(--primary)' }} />
            You
          </span>
          <span className="muted">
            <i style={{ background: 'var(--muted)' }} />
            If you had held the fund throughout
          </span>
        </div>
      </div>

      {!run.over ? (
        <div className="card">
          <h3>Year {yr + 1}: where does it go?</h3>
          {(Object.keys(STRAT) as Strat[]).map((k) => (
            <button key={k} className={'btn strat ' + STRAT[k].tone} onClick={() => pickStrat(k)}>
              {STRAT[k].name}
              <span>{STRAT[k].sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className={'fb ' + (run.bal >= g ? 'good' : 'bad')}>
            <b>{run.wiped ? 'The whole pot is gone' : run.bal >= g ? 'You came out ahead this time' : 'The steady fund beat you'}</b>
            <p>
              You finished with <span className="num">{gbp(run.bal)}</span>. Holding the fund every year would have given <span className="num">{gbp(g)}</span>.
            </p>
            <p className="small">{run.wiped ? 'After a wipe-out there is nothing left to recover with. That is the real danger of leverage.' : 'One run is luck. The table below shows what happens to a thousand people making each choice.'}</p>
          </div>
          <div className="card">
            <h3>1,000 people, {years} years each</h3>
            {run.sim?.map((x) => (
              <div className="quest" key={x.s}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <b>{STRAT[x.s].name}</b>
                  <span className="num muted">typical result {gbp(x.med)}</span>
                </div>
                <div className="bar badbar">
                  <i style={{ width: `${x.below}%` }} />
                </div>
                <span className="small muted num">
                  {Math.round(x.below)}% ended with less than they started{x.wiped >= 1 ? ` · ${Math.round(x.wiped)}% lost everything` : ''}
                </span>
              </div>
            ))}
            <button className="btn wide" onClick={() => setRun(newRun(Math.max(100, getState().goal.saved), years))}>
              Run it again
            </button>
          </div>
        </>
      )}

      {run.log.length > 0 && (
        <div className="card">
          <h3>Year by year</h3>
          <div className="log">
            {run.log
              .slice()
              .reverse()
              .map((e) => (
                <div key={e.y}>
                  <span>
                    Year {e.y} · {STRAT[e.k].name}
                  </span>
                  <span className="num">
                    <span className={e.r >= 0 ? 'up' : 'down'}>{pct(e.r)}</span>
                    {e.k !== 'fund' && <span className="muted"> (fund {pct(e.fr)})</span>}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      <p className="muted small">A simplified teaching model with made-up odds. Real markets behave differently and past patterns do not predict the future. It is not financial advice.</p>
    </>
  );
}
