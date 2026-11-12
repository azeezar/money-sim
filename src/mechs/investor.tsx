import { useState } from 'react';
import { gbp } from '../lib/format';
import { Asks, Lines } from './advanced';
import { useDoneWhen } from './intermediate';
import { Done, Range, type MechProps } from './novice';
import { drawdown, mixStats } from './sims';

const pct = (n: number, d = 1) => `${(n * 100).toLocaleString('en-GB', { maximumFractionDigits: d })}%`;
const k = (n: number) => (Math.abs(n) >= 1e6 ? `£${(n / 1e6).toFixed(2)}m` : `£${Math.round(n / 1000)}k`);

/* ---------------------------------------------------------------- 13.1 Payoff Plotter */

export function PayoffPlotter({ onDone }: MechProps) {
  const PREM = 5;
  const [call, setCall] = useState(true);
  const [K, setK] = useState(100);
  const [S, setS] = useState(100);
  const [seen, setSeen] = useState<Record<string, true>>({});
  const pl = (s: number, c = call, k_ = K) => Math.max(0, c ? s - k_ : k_ - s) - PREM;
  const note = (c: boolean, k_: number, s: number) => setSeen((x) => ({ ...x, [`${c ? 'call' : 'put'}${pl(s, c, k_) > 0 ? '+' : '-'}`]: true }));
  const xs = Array.from({ length: 21 }, (_, i) => 50 + i * 5);
  const got = ['call+', 'call-', 'put+', 'put-'].filter((x) => seen[x]).length;
  useDoneWhen(got === 4, onDone);
  const v = pl(S);
  return (
    <div className="col">
      <p className="muted small">Each option costs a £{PREM} premium. Move the share price at expiry to find a profit and a loss for both a call and a put.</p>
      <div className="seg-s" role="group" aria-label="Option type">
        {[true, false].map((c) => (
          <button key={String(c)} className={call === c ? 'on' : ''} onClick={() => (setCall(c), note(c, K, S))}>
            {c ? 'Call (right to buy)' : 'Put (right to sell)'}
          </button>
        ))}
      </div>
      <Lines label={`${call ? 'Call' : 'Put'} payoff`} lo={-10} hi={50} zero={0} series={[{ ys: xs.map((x) => Math.min(50, pl(x))), color: 'var(--primary)' }]} />
      <p className="center">
        Share at <b className="num">£{S}</b>: <b className="num" style={{ color: v > 0 ? 'var(--good-deep)' : 'var(--bad)' }}>{v > 0 ? `+£${v}` : `−£${-v}`}</b> per share
      </p>
      <Range label="Strike price" value={K} min={80} max={120} step={5} fmt={(n) => `£${n}`} onChange={(n) => (setK(n), note(call, n, S))} />
      <Range label="Share price at expiry" value={S} min={50} max={150} step={1} fmt={(n) => `£${n}`} onChange={(n) => (setS(n), note(call, K, n))} />
      <p className="small">Found {got} of 4: call profit {seen['call+'] ? '✓' : '…'} · call loss {seen['call-'] ? '✓' : '…'} · put profit {seen['put+'] ? '✓' : '…'} · put loss {seen['put-'] ? '✓' : '…'}</p>
      {got === 4 && <Done>A buyer’s loss stops at the £{PREM} premium, wherever the share goes. A call needs the share above strike + premium to profit; a put needs it below strike − premium.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 13.2 Time Decay Clock */

export function DecayClock({ onDone }: MechProps) {
  const [d, setD] = useState(60);
  const intr = 4;
  const tv = (days: number) => 6 * Math.sqrt(days / 60);
  useDoneWhen(d === 0, onDone);
  const ys = Array.from({ length: 61 }, (_, i) => intr + tv(60 - i));
  return (
    <div className="col">
      <p className="muted small">A call with strike £100 on a share at £104: £4 of intrinsic value plus time value. Drag the clock down to expiry.</p>
      <Lines label="Option premium over time" lo={0} hi={11} series={[{ ys, color: 'var(--coin)', n: 61 - d }]} />
      <div className="mx-lane">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Intrinsic value</span>
          <b className="num">£{intr.toFixed(2)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Time value</span>
          <b className="num">£{tv(d).toFixed(2)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
          <span>Premium</span>
          <b className="num">£{(intr + tv(d)).toFixed(2)}</b>
        </div>
      </div>
      <Range label="Days to expiry" value={60 - d} min={0} max={60} step={1} fmt={(n) => `${60 - n} days left`} onChange={(n) => setD(60 - n)} />
      {d === 0 && <Done>£6 of time value melted to nothing, and over a third of it went in the last 10 days. That daily melt is theta: buyers pay it, sellers collect it.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 14.1 Cap Rate Calculator */

export function CapRate({ onDone }: MechProps) {
  const RENT = 60000;
  const COSTS = 12000;
  const [vac, setVac] = useState(0.05);
  const [price, setPrice] = useState(500000);
  const noi = RENT * (1 - vac) - COSTS;
  const cap = noi / price;
  const ok = Math.abs(vac - 0.1) < 0.001 && Math.abs(cap - 0.06) < 0.0005;
  useDoneWhen(ok, onDone);
  return (
    <div className="col">
      <p className="muted small">A block of flats brings in {gbp(RENT)} rent a year when full, with {gbp(COSTS)} of running costs. The surveyor expects 10% of units empty. Set that, then find the price that gives a 6% cap rate.</p>
      <div className="mx-lane">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Net operating income</span>
          <b className="num">{gbp(noi)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
          <span>Cap rate</span>
          <b className="num" style={{ color: ok ? 'var(--good-deep)' : undefined }}>{pct(cap, 2)}</b>
        </div>
      </div>
      <Range label="Vacancy" value={vac} min={0} max={0.25} step={0.01} fmt={(n) => pct(n, 0)} onChange={setVac} />
      <Range label="Purchase price" value={price} min={400000} max={1000000} step={10000} fmt={gbp} onChange={setPrice} />
      {ok && <Done>NOI of {gbp(noi)} ÷ {gbp(price)} = 6%. Pay more and the cap rate falls; more empty units and it falls too. Investors compare cap rates to judge price per pound of income.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 14.2 LTV Adjuster */

export function Ltv({ onDone }: MechProps) {
  const PRICE = 250000;
  const [ltv, setLtv] = useState(0.6);
  const [move, setMove] = useState(0.1);
  const [seen, setSeen] = useState({ big: false, wiped: false });
  const deposit = PRICE * (1 - ltv);
  const equity = PRICE * (1 + move) - PRICE * ltv;
  const ret = equity / deposit - 1;
  const check = (l: number, m: number) => {
    const e = PRICE * (1 + m) - PRICE * l;
    const r = e / (PRICE * (1 - l)) - 1;
    setSeen((s) => ({ big: s.big || (m > 0 && r >= 1), wiped: s.wiped || e <= 0 }));
  };
  useDoneWhen(seen.big && seen.wiped, onDone);
  return (
    <div className="col">
      <p className="muted small">A {gbp(PRICE)} home. Change how much you borrow and how prices move. Find a 100%+ gain on your deposit, then a fall that wipes your equity out.</p>
      <div className="mx-lane">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Your deposit</span>
          <b className="num">{gbp(deposit)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Your equity after the move</span>
          <b className="num" style={{ color: equity <= 0 ? 'var(--bad)' : undefined }}>{equity <= 0 ? `${gbp(equity)} (negative equity)` : gbp(equity)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
          <span>Return on your deposit</span>
          <b className="num" style={{ color: ret >= 0 ? 'var(--good-deep)' : 'var(--bad)' }}>{pct(ret, 0)}</b>
        </div>
      </div>
      <Range label="Loan-to-value" value={ltv} min={0} max={0.95} step={0.05} fmt={(n) => pct(n, 0)} onChange={(n) => (setLtv(n), check(n, move))} />
      <Range label="House price change" value={move} min={-0.3} max={0.3} step={0.01} fmt={(n) => `${n > 0 ? '+' : ''}${pct(n, 0)}`} onChange={(n) => (setMove(n), check(ltv, n))} />
      <p className="small">
        100%+ gain {seen.big ? '✓' : '…'} · Equity wiped out {seen.wiped ? '✓' : '…'}
      </p>
      {seen.big && seen.wiped && <Done>Leverage multiplies your result in both directions. At 90% LTV, a 10% rise doubles your deposit, and a 10% fall wipes it out while you still owe the whole loan.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 15.1 VC J-Curve */

const J = [0, -6, -14, -20, -17, -8, 6, 24, 48, 70, 92];

export function JCurve({ onDone }: MechProps) {
  const [y, setY] = useState(0);
  useDoneWhen(y === 10, onDone);
  const note = ['Fund launches', 'Fees start, first bets made', 'Early failures written off', 'The bottom: fees plus failures', 'A few startups raise at higher prices', 'Winners pull ahead', 'First exit: a company is bought', 'A star startup lists on the market', 'More exits', 'The big winner sells', 'Fund winds down'][y];
  return (
    <div className="col">
      <p className="muted small">A venture fund invests in 25 startups. Step through its 10 years and watch its value against what investors put in.</p>
      <Lines label="Fund value vs. money put in" lo={-25} hi={100} zero={0} series={[{ ys: J, color: J[y] < 0 ? 'var(--bad)' : 'var(--good)', n: y + 1 }]} />
      <p className="center">
        Year {y}: <b className="num" style={{ color: J[y] < 0 ? 'var(--bad)' : 'var(--good-deep)' }}>{J[y] >= 0 ? '+' : ''}{J[y]}%</b> · {note}
      </p>
      {y < 10 && (
        <button className="btn wide" onClick={() => setY(y + 1)}>
          Next year
        </button>
      )}
      {y === 10 && <Done>The J-curve: three years under water before exits arrive. Most of the 25 startups failed; two or three winners paid for everything. That only works if you can leave the money locked away for a decade.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 15.2 Efficient Frontier */

const ASSETS = { r: [0.07, 0.04, 0.06], v: [0.16, 0.15, 0.12], corr: [[1, -0.1, 0.5], [-0.1, 1, 0.1], [0.5, 0.1, 1]] };
const stats = (s: number, g: number) => mixStats([s, g, 1 - s - g], ASSETS.r, ASSETS.v, ASSETS.corr, 0.02);
const BEST = (() => {
  let b = 0;
  for (let s = 0; s <= 100; s += 5) for (let g = 0; g <= 100 - s; g += 5) b = Math.max(b, stats(s / 100, g / 100).sharpe);
  return b;
})();

export function Frontier({ onDone }: MechProps) {
  const [s, setS] = useState(100);
  const [g, setG] = useState(0);
  const st = stats(s / 100, g / 100);
  const ok = st.sharpe >= BEST - 0.01;
  useDoneWhen(ok, onDone);
  return (
    <div className="col">
      <p className="muted small">Mix shares (7% return, 16% swings), gold (4%, 15%) and property (6%, 12%). Gold barely moves with shares. Find a mix with a Sharpe ratio of at least {(BEST - 0.01).toFixed(2)}.</p>
      <div className="mx-lane">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Mix</span>
          <b className="num">
            {s}% shares · {g}% gold · {100 - s - g}% property
          </b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Return / volatility</span>
          <b className="num">
            {pct(st.ret)} / {pct(st.vol)}
          </b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', fontWeight: 800 }}>
          <span>Sharpe ratio</span>
          <b className="num" style={{ color: ok ? 'var(--good-deep)' : undefined }}>{st.sharpe.toFixed(2)}</b>
        </div>
      </div>
      <Range label="Shares" value={s} min={0} max={100} step={5} fmt={(n) => `${n}%`} onChange={(n) => (setS(n), setG(Math.min(g, 100 - n)))} />
      <Range label="Gold" value={g} min={0} max={100 - s} step={5} fmt={(n) => `${n}%`} onChange={setG} />
      {ok && <Done>All shares gives a Sharpe of {stats(1, 0).sharpe.toFixed(2)}. Your mix earns more per unit of risk because gold and property do not move in step with shares. That is the efficient frontier at work.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 16.1 Harvesting Matrix */

const HOLD = [
  { n: 'UK tech fund', gl: -3200 },
  { n: 'World tracker', gl: 5400 },
  { n: 'Oil company shares', gl: -1800 },
  { n: 'US S&P 500 fund', gl: 2100 },
  { n: 'Emerging markets fund', gl: -900 },
];

export function HarvestMatrix({ onDone }: MechProps) {
  const [sold, setSold] = useState<string[]>([]);
  const [warn, setWarn] = useState('');
  const losers = HOLD.filter((h) => h.gl < 0);
  const harvested = losers.every((l) => sold.includes(l.n));
  const saved = losers.reduce((a, l) => a - l.gl, 0);
  return (
    <div className="col">
      <p className="muted small">This taxable account (not an ISA) has gains you will be taxed on. Sell every holding at a loss to offset them.</p>
      <div className="mx-strip">
        {HOLD.map((h) => (
          <button
            key={h.n}
            className={'mx-exp' + (sold.includes(h.n) ? ' gone' : '') + (warn === h.n ? ' warn' : '')}
            disabled={sold.includes(h.n) || harvested}
            onClick={() => {
              if (h.gl < 0) setSold([...sold, h.n]);
              else (setWarn(h.n), setTimeout(() => setWarn(''), 700));
            }}
          >
            <span>{h.n}</span>
            <b className="num" style={{ color: h.gl < 0 ? 'var(--bad)' : 'var(--good-deep)' }}>
              {h.gl < 0 ? '−' : '+'}
              {gbp(Math.abs(h.gl))}
            </b>
          </button>
        ))}
      </div>
      {warn && <p className="small" style={{ color: 'var(--bad)' }}>“{warn}” is in profit. Selling it would create a gain, not offset one.</p>}
      {harvested && (
        <Asks
          onDone={onDone}
          asks={[
            { q: `You sold the UK tech fund at a loss. How do you stay invested without breaking the 30-day rule?`, o: ['Buy a similar fund that tracks a different index', 'Buy the same fund back tomorrow', 'Buy it back on day 20', 'Buy a different share class of the same fund'], why: 'Similar, not identical. The same holding inside 30 days cancels the loss.' },
          ]}
          end={`You booked ${gbp(saved)} of losses to set against your ${gbp(7500)} of gains, while staying invested through a similar fund. Inside an ISA none of this is needed: there is no tax to harvest.`}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 16.2 Retirement Stress Test */

/** 30 years of returns averaging about 6%, with the bad years first. */
export const BEAR_FIRST = [-0.22, -0.15, -0.1, 0.02, 0.05, 0.08, 0.1, 0.06, 0.09, 0.07, 0.12, 0.05, 0.08, 0.1, 0.04, 0.11, 0.07, 0.09, 0.06, 0.13, 0.08, 0.05, 0.1, 0.12, 0.07, 0.15, 0.09, 0.14, 0.11, 0.16];

export function StressTest({ onDone }: MechProps) {
  const [y, setY] = useState(0);
  const bear = drawdown(500000, 22000, 0.025, BEAR_FIRST);
  const bull = drawdown(500000, 22000, 0.025, [...BEAR_FIRST].reverse());
  useDoneWhen(y === 30, onDone);
  return (
    <div className="col">
      <p className="muted small">Two retirees each start with £500,000 and withdraw £22,000 a year (4.4%), rising with inflation. They get the exact same 30 years of returns, in opposite order.</p>
      <Lines label="Two retirement pots over 30 years" lo={0} hi={Math.max(...bull, ...bear)} series={[{ ys: bull, color: 'var(--good)', n: y + 1 }, { ys: bear, color: 'var(--bad)', n: y + 1 }]} />
      <div className="row" style={{ justifyContent: 'space-around' }}>
        <span>
          <b style={{ color: 'var(--good-deep)' }}>Good years first</b> <span className="num">{k(bull[y])}</span>
        </span>
        <span>
          <b style={{ color: 'var(--bad)' }}>Crash first</b> <span className="num">{k(bear[y])}</span>
        </span>
      </div>
      <Range label="Year" value={y} min={0} max={30} step={1} fmt={(n) => `Year ${n}`} onChange={setY} />
      {y === 30 && <Done>Same average return, very different endings: {k(bull[30])} against {k(bear[30])}. A crash early in retirement forces you to sell more at low prices. Spending less in bad years, or keeping a cash buffer, is the usual defence.</Done>}
    </div>
  );
}

export const INVESTOR_MECHS = {
  'payoff-plotter': PayoffPlotter,
  'decay-clock': DecayClock,
  'cap-rate': CapRate,
  ltv: Ltv,
  'j-curve': JCurve,
  frontier: Frontier,
  'harvest-matrix': HarvestMatrix,
  'stress-test': StressTest,
};
