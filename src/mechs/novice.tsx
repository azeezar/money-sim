import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gbp, shuffle } from '../lib/format';
import { grow, payoff, race, realValue, type Debt } from './sims';

/** Every lesson mechanic gets this. Call onDone once the task is complete; the lesson then lets the user continue. */
export interface MechProps {
  onDone: () => void;
}

const p2 = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Range({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt: (n: number) => string }) {
  return (
    <label className="mx-range">
      <span className="row" style={{ justifyContent: 'space-between' }}>
        <span>{label}</span>
        <b className="num">{fmt(value)}</b>
      </span>
      <input
        type="range"
        className="t2-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={fmt(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </label>
  );
}

const Done = ({ children }: { children: React.ReactNode }) => (
  <div className="fb good">
    <b>Done</b>
    <p>{children}</p>
  </div>
);

/* ---------------------------------------------------------------- 1.1 Swipe-Sorter */

type Kind = 'need' | 'want' | 'leak';
const FEED: { name: string; amt: number; kind: Kind; why: string }[] = [
  { name: 'Rent: Oakfield Lettings', amt: 850, kind: 'need', why: 'A roof over your head is a need.' },
  { name: 'Grocery shop', amt: 62.4, kind: 'need', why: 'Food is a need.' },
  { name: 'Monthly train pass', amt: 120, kind: 'need', why: 'Getting to work is a need.' },
  { name: 'Takeaway delivery', amt: 23.5, kind: 'want', why: 'Nice, and you chose it, but not essential.' },
  { name: 'Cinema tickets', amt: 14, kind: 'want', why: 'A treat you meant to buy.' },
  { name: 'Gym membership (last visit: February)', amt: 34.99, kind: 'leak', why: 'Paying for something you stopped using is a classic leak.' },
  { name: 'Third streaming service', amt: 15.99, kind: 'leak', why: 'A forgotten extra subscription.' },
  { name: '2 TB cloud storage (using 40 GB)', amt: 8.99, kind: 'leak', why: 'Paying for far more than you use.' },
  { name: 'Electricity', amt: 74, kind: 'need', why: 'Energy bills are a need.' },
  { name: 'Phone insurance on your old phone', amt: 6.5, kind: 'leak', why: 'Insuring a phone you no longer use is a stealth leak.' },
];
const KINDS: [Kind, string][] = [['need', 'Need'], ['want', 'Want'], ['leak', 'Stealth leak']];

export function SwipeSorter({ onDone }: MechProps) {
  const [deck] = useState(() => shuffle(FEED));
  const [i, setI] = useState(0);
  const [fb, setFb] = useState<{ ok: boolean; why: string } | null>(null);
  const [right, setRight] = useState(0);
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const it = deck[i];
  const leaks = FEED.filter((f) => f.kind === 'leak').reduce((a, f) => a + f.amt, 0);

  function pick(k: Kind) {
    if (fb || !it) return;
    const ok = k === it.kind;
    if (ok) setRight((r) => r + 1);
    setFb({ ok, why: (ok ? '' : `That one is a ${KINDS.find((x) => x[0] === it.kind)![1].toLowerCase()}. `) + it.why });
  }
  function next() {
    setFb(null);
    setDx(0);
    if (i + 1 >= deck.length) onDone();
    setI(i + 1);
  }

  if (!it)
    return (
      <Done>
        You sorted {right} of {deck.length} right. The four leaks cost {p2(leaks)} a month, which is {gbp(leaks * 12)} a year for things you barely use.
      </Done>
    );

  return (
    <div className="col">
      <p className="muted small">
        Entry {i + 1} of {deck.length}. Swipe left for Need, right for Want, up for Stealth leak, or tap a button.
      </p>
      <div
        className={'mx-feed' + (fb ? (fb.ok ? ' ok' : ' no') : '')}
        style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)` }}
        onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
        onPointerMove={(e) => start.current && !fb && setDx(e.clientX - start.current.x)}
        onPointerUp={(e) => {
          const s0 = start.current;
          start.current = null;
          if (!s0 || fb) return setDx(0);
          const ddx = e.clientX - s0.x;
          const ddy = e.clientY - s0.y;
          if (ddy < -60 && Math.abs(ddy) > Math.abs(ddx)) pick('leak');
          else if (ddx < -60) pick('need');
          else if (ddx > 60) pick('want');
          setDx(0);
        }}
      >
        <span className="tag">Card payment</span>
        <b>{it.name}</b>
        <span className="num mx-amt">−{p2(it.amt)}</span>
      </div>
      {fb ? (
        <div className={'fb ' + (fb.ok ? 'good' : 'bad')}>
          <b>{fb.ok ? 'Correct' : 'Not quite'}</b>
          <p>{fb.why}</p>
          <button className={'btn wide ' + (fb.ok ? 'good' : 'bad')} onClick={next}>
            Next entry
          </button>
        </div>
      ) : (
        <div className="mx-3">
          {KINDS.map(([k, label]) => (
            <button key={k} className={'opt mx-k-' + k} onClick={() => pick(k)}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 1.2 Pie Slider */

const INCOME = 2000;
export function PieSlider({ onDone }: MechProps) {
  const [needs, setNeeds] = useState(62);
  const [wants, setWants] = useState(36);
  const save = 100 - needs - wants;
  const near = (a: number, b: number) => Math.abs(a - b) <= 3;
  const ok = near(needs, 50) && near(wants, 30) && near(save, 20);
  const fired = useRef(false);
  useEffect(() => {
    if (ok && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [ok, onDone]);
  const pie = `conic-gradient(var(--primary) 0 ${needs}%, var(--coin) ${needs}% ${needs + wants}%, var(--good) ${needs + wants}% 100%)`;
  const status = (v: number, t: number) => (near(v, t) ? 'ok' : v > t ? 'high' : 'low');
  return (
    <div className="col">
      <p className="muted small">Take-home pay is {gbp(INCOME)} a month. This budget saves almost nothing. Drag the sliders to get within 3% of 50/30/20.</p>
      <div className="row" style={{ justifyContent: 'center', gap: 20 }}>
        <div className="mx-pie" style={{ background: pie }} aria-label={`Needs ${needs}%, wants ${wants}%, saving ${save}%`} role="img" />
        <div className="col" style={{ gap: 6 }}>
          {(
            [
              ['Needs', needs, 50, 'var(--primary)'],
              ['Wants', wants, 30, 'var(--coin)'],
              ['Saving', save, 20, 'var(--good)'],
            ] as const
          ).map(([n, v, t, c]) => (
            <span key={n} className={'mx-leg ' + status(v, t)}>
              <i style={{ background: c }} />
              {n} <b className="num">{v}%</b> <span className="muted num">{gbp((INCOME * v) / 100)}</span> <span className="muted small">target {t}%</span>
            </span>
          ))}
        </div>
      </div>
      <Range label="Needs" value={needs} min={40} max={80} step={1} fmt={(n) => `${n}%`} onChange={(n) => (setNeeds(n), setWants(Math.min(wants, 100 - n)))} />
      <Range label="Wants" value={wants} min={0} max={100 - needs} step={1} fmt={(n) => `${n}%`} onChange={setWants} />
      {ok && <Done>Budget rescued: {gbp(INCOME * save / 100)} a month now goes to saving, {gbp((INCOME * save * 12) / 100)} a year.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 2.1 Time-Lapse Calculator */

export function TimeLapse({ onDone }: MechProps) {
  const [years, setYears] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fired = useRef(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYears((y) => (y >= 10 ? (setPlaying(false), 10) : Math.min(10, +(y + 0.25).toFixed(2)))), 90);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (years >= 10 && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [years, onDone]);
  const low = grow(1000, 0.0001, years);
  const high = grow(1000, 0.045, years);
  const top = grow(1000, 0.045, 10);
  return (
    <div className="col">
      <p className="muted small">£1,000 in a big-bank account at 0.01% versus a high-yield account at 4.5%. Drag the years or press play.</p>
      <div className="mx-bars">
        {(
          [
            ['Big bank 0.01%', low, 'var(--muted)'],
            ['High-yield 4.5%', high, 'var(--good)'],
          ] as const
        ).map(([n, v, c]) => (
          <div key={n} className="mx-barcol">
            <b className="num">{p2(v)}</b>
            <div className="mx-barwrap">
              <i style={{ height: `${(v / top) * 100}%`, background: c }} />
            </div>
            <span className="small">{n}</span>
          </div>
        ))}
      </div>
      <Range label="Years" value={years} min={0} max={10} step={0.25} fmt={(n) => `${Math.floor(n)} yr`} onChange={setYears} />
      <button className="btn ghost" onClick={() => (years >= 10 && setYears(0), setPlaying(true))} disabled={playing}>
        ▶ Play 10 years
      </button>
      {years >= 10 && <Done>After 10 years the high-yield account has {p2(high - low)} more, from the same £1,000 and the same safety. That gap is compounding.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 2.2 Expense Stripper */

const EXPENSES: { name: string; amt: number; need: boolean }[] = [
  { name: 'Rent', amt: 780, need: true },
  { name: 'Council tax', amt: 120, need: true },
  { name: 'Energy and water', amt: 110, need: true },
  { name: 'Food shop', amt: 220, need: true },
  { name: 'Travel to work', amt: 90, need: true },
  { name: 'Phone (basic plan)', amt: 12, need: true },
  { name: 'Eating out', amt: 140, need: false },
  { name: 'Streaming x3', amt: 35, need: false },
  { name: 'Clothes shopping', amt: 80, need: false },
  { name: 'Gaming subscriptions', amt: 18, need: false },
  { name: 'Weekend trips', amt: 120, need: false },
];

export function ExpenseStripper({ onDone }: MechProps) {
  const [gone, setGone] = useState<Record<string, true>>({});
  const [warn, setWarn] = useState('');
  const left = EXPENSES.filter((e) => !gone[e.name]);
  const total = left.reduce((a, e) => a + e.amt, 0);
  const done = EXPENSES.every((e) => e.need || gone[e.name]);
  const fired = useRef(false);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [done, onDone]);
  return (
    <div className="col">
      <p className="muted small">An emergency hits. Tap every cost you could cut to reveal your true survival baseline.</p>
      <div className="mx-strip">
        {EXPENSES.map((e) => (
          <button
            key={e.name}
            className={'mx-exp' + (gone[e.name] ? ' gone' : '') + (warn === e.name ? ' warn' : '')}
            disabled={!!gone[e.name] || done}
            onClick={() => {
              if (e.need) {
                setWarn(e.name);
                setTimeout(() => setWarn(''), 700);
              } else setGone({ ...gone, [e.name]: true });
            }}
          >
            <span>{e.name}</span>
            <b className="num">{gbp(e.amt)}</b>
          </button>
        ))}
      </div>
      {warn && <p className="small" style={{ color: 'var(--bad)' }}>You still need “{warn}” in an emergency.</p>}
      <div className="row mx-total">
        <span className="grow">Monthly spending</span>
        <b className="num">{gbp(total)}</b>
      </div>
      {done && <Done>Your survival baseline is {gbp(total)} a month. A 3-month emergency shield is {gbp(total * 3)}, and 6 months is {gbp(total * 6)}.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 3.1 APR Severity Scale */

const APRS: { name: string; apr: number }[] = [
  { name: 'Mortgage', apr: 0.045 },
  { name: 'UK student loan', apr: 0.062 },
  { name: 'Car finance', apr: 0.089 },
  { name: 'Credit card', apr: 0.249 },
  { name: 'Payday loan', apr: 12.92 },
];
const aprTxt = (a: number) => `${(a * 100).toLocaleString('en-GB', { maximumFractionDigits: 1 })}%`;

export function AprScale({ onDone }: MechProps) {
  const [pool] = useState(() => shuffle(APRS));
  const [placed, setPlaced] = useState<string[]>([]);
  const [bad, setBad] = useState('');
  const done = placed.length === APRS.length;
  return (
    <div className="col">
      <p className="muted small">Tap the debts from the lowest APR to the highest to build the severity scale.</p>
      <div className="mx-scale">
        {APRS.map((d, k) => (
          <div key={d.name} className={'mx-slot' + (placed[k] ? ' on' : '')} style={{ ['--h' as string]: `${30 + k * 17}%` }}>
            {placed[k] ? (
              <>
                <b>{d.name}</b>
                <span className="num">{aprTxt(d.apr)}</span>
              </>
            ) : (
              <span className="muted">{k + 1}</span>
            )}
          </div>
        ))}
      </div>
      {!done && (
        <div className="mx-3">
          {pool
            .filter((d) => !placed.includes(d.name))
            .map((d) => (
              <button
                key={d.name}
                className={'opt' + (bad === d.name ? ' no' : '')}
                onClick={() => {
                  if (d.name === APRS[placed.length].name) {
                    const next = [...placed, d.name];
                    setPlaced(next);
                    if (next.length === APRS.length) onDone();
                  } else {
                    setBad(d.name);
                    setTimeout(() => setBad(''), 600);
                  }
                }}
              >
                {d.name}
              </button>
            ))}
        </div>
      )}
      {done && (
        <>
          <h3>Paying off £1,000 at £50 a month</h3>
          <div className="mx-timeline">
            {APRS.map((d) => {
              const r = payoff(1000, d.apr, 50);
              const w = Number.isFinite(r.months) ? Math.min(100, (r.months / 40) * 100) : 100;
              return (
                <div key={d.name}>
                  <span className="small">
                    {d.name} <span className="muted num">{aprTxt(d.apr)}</span>
                  </span>
                  <div className={'bar' + (Number.isFinite(r.months) ? ' pri' : ' badbar')}>
                    <i style={{ width: `${w}%` }} />
                  </div>
                  <span className="small num">{Number.isFinite(r.months) ? `${r.months} months · ${gbp(r.interest)} interest` : 'Never: £50 does not even cover the interest'}</span>
                </div>
              );
            })}
          </div>
          <Done>The same £50 a month clears the mortgage-rate debt in under two years, but never touches the payday loan. APR is what decides.</Done>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 3.2 Dual-Race Simulator */

export const RACE_DEBTS: Debt[] = [
  { name: 'Store card', balance: 400, apr: 0.12, min: 25 },
  { name: 'Credit card', balance: 4000, apr: 0.29, min: 100 },
  { name: 'Car loan', balance: 2500, apr: 0.08, min: 75 },
];
const RACE_BUDGET = 350;

export function DualRace({ onDone }: MechProps) {
  const [guess, setGuess] = useState<'avalanche' | 'snowball' | null>(null);
  const [m, setM] = useState(0);
  const [runs] = useState(() => ({ avalanche: race(RACE_DEBTS, RACE_BUDGET, 'avalanche'), snowball: race(RACE_DEBTS, RACE_BUDGET, 'snowball') }));
  const end = Math.max(runs.avalanche.months.length, runs.snowball.months.length);
  const running = guess !== null && m < end;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setM((x) => x + 1), 120);
    return () => clearTimeout(id);
  }, [running, m]);
  const fired = useRef(false);
  useEffect(() => {
    if (guess && m >= end && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [m, end, guess, onDone]);
  const total = RACE_DEBTS.reduce((a, d) => a + d.balance, 0);
  const winner = runs.avalanche.interest <= runs.snowball.interest ? 'avalanche' : 'snowball';
  return (
    <div className="col">
      <p className="muted small">
        Three debts, {gbp(total)} in all, {gbp(RACE_BUDGET)} a month to pay.{' '}
        {RACE_DEBTS.map((d) => `${d.name} ${gbp(d.balance)} at ${aprTxt(d.apr)}`).join(' · ')}
      </p>
      {!guess ? (
        <>
          <h3>Which method will pay less interest?</h3>
          <div className="mx-3">
            <button className="opt" onClick={() => setGuess('avalanche')}>
              Avalanche (highest APR first)
            </button>
            <button className="opt" onClick={() => setGuess('snowball')}>
              Snowball (smallest balance first)
            </button>
          </div>
        </>
      ) : (
        (['snowball', 'avalanche'] as const).map((k) => {
          const r = runs[k];
          const row = r.months[Math.min(m, r.months.length) - 1];
          const bal = row ? row.balances : RACE_DEBTS.map((d) => d.balance);
          return (
            <div key={k} className="mx-lane">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>{k === 'avalanche' ? 'Avalanche' : 'Snowball'}</b>
                <span className="small num">
                  Month {Math.min(m, r.months.length)} · {gbp(row ? row.interest : 0)} interest
                </span>
              </div>
              {RACE_DEBTS.map((d, j) => (
                <div key={d.name} className="row nowrap small" style={{ gap: 6 }}>
                  <span style={{ width: 90 }}>{d.name}</span>
                  <div className="bar badbar grow">
                    <i style={{ width: `${(bal[j] / d.balance) * 100}%` }} />
                  </div>
                  <span className="num" style={{ width: 64, textAlign: 'right' }}>
                    {bal[j] === 0 ? '✓ clear' : gbp(bal[j])}
                  </span>
                </div>
              ))}
              {m >= r.months.length && (
                <span className="small">
                  Debt-free in {r.months.length} months. First debt cleared in month {r.firstClear}. Total interest {gbp(r.interest)}.
                </span>
              )}
            </div>
          );
        })
      )}
      {guess && m >= end && (
        <Done>
          {guess === winner ? 'You called it. ' : 'Not this time. '}Avalanche saved {gbp(Math.abs(runs.snowball.interest - runs.avalanche.interest))} in interest, but Snowball cleared its first debt in month {runs.snowball.firstClear} versus{' '}
          {runs.avalanche.firstClear}. Maths versus motivation.
        </Done>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 4.1 Purchasing Power Shrink */

const BASKET = ['🍞', '🥛', '🧀', '🍎', '☕', '🥚', '🍝', '🧻', '🧼', '🍫'];

export function PowerShrink({ onDone }: MechProps) {
  const [inf, setInf] = useState(2);
  const [years, setYears] = useState(0);
  const v = realValue(100, inf / 100, years);
  const items = Math.floor(v / 10 + 1e-9);
  const fired = useRef(false);
  useEffect(() => {
    if (v < 50 && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [v, onDone]);
  return (
    <div className="col">
      <p className="muted small">£100 buys this basket today. Turn the inflation knob and move through the years until £100 buys less than half of it.</p>
      <div className="mx-basket" aria-label={`£100 buys ${items} of 10 items`}>
        {BASKET.map((b, k) => (
          <span key={k} className={k < items ? '' : 'gone'}>
            {b}
          </span>
        ))}
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span>£100 is worth, in today’s money</span>
        <b className="num" style={{ color: v < 50 ? 'var(--bad)' : undefined }}>
          {p2(v)}
        </b>
      </div>
      <Range label={`Inflation${inf === 2 ? ' (the 2% target)' : ''}`} value={inf} min={0} max={12} step={0.5} fmt={(n) => `${n}%`} onChange={setInf} />
      <Range label="Years" value={years} min={0} max={30} step={1} fmt={(n) => `${n} yr`} onChange={setYears} />
      {v < 50 && <Done>At {inf}% for {years} years, £100 of cash buys only {p2(v)} of today’s shopping. Money that earns less than inflation shrinks quietly.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 4.2 Asset Drag */

type Zone = 'low' | 'mid' | 'high';
const ASSETS: { name: string; zone: Zone; why: string }[] = [
  { name: 'Cash at home', zone: 'low', why: 'Steady, but inflation slowly eats it and it earns nothing.' },
  { name: 'Easy-access savings', zone: 'low', why: 'Safe and protected, with modest interest.' },
  { name: 'Government bonds', zone: 'mid', why: 'Steady income, prices move when rates change.' },
  { name: 'Property', zone: 'mid', why: 'Rent plus growth, but values can fall and it is slow to sell.' },
  { name: 'Global index fund', zone: 'high', why: 'Thousands of shares: grows most over long periods, with big swings along the way.' },
  { name: 'One company’s shares', zone: 'high', why: 'All your eggs in one basket: one bad result can sink it.' },
  { name: 'Crypto', zone: 'high', why: 'Extreme swings, no earnings or income behind it.' },
];
const ZONES: [Zone, string][] = [['low', 'Low risk · low reward'], ['mid', 'Medium risk · medium reward'], ['high', 'High risk · high reward']];

export function AssetDrag({ onDone }: MechProps) {
  const [pool] = useState(() => shuffle(ASSETS));
  const [held, setHeld] = useState<string | null>(null);
  const [at, setAt] = useState<Record<string, Zone>>({});
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const done = Object.keys(at).length === ASSETS.length;
  function drop(name: string, z: Zone) {
    const a = ASSETS.find((x) => x.name === name)!;
    if (a.zone === z) {
      const next = { ...at, [name]: z };
      setAt(next);
      setMsg({ ok: true, t: `${a.name}: ${a.why}` });
      if (Object.keys(next).length === ASSETS.length) onDone();
    } else setMsg({ ok: false, t: `${a.name} does not belong in “${ZONES.find((x) => x[0] === z)![1]}”. Try again.` });
    setHeld(null);
  }
  return (
    <div className="col">
      <p className="muted small">Drag each asset onto the grid, or tap it and then tap a zone.</p>
      <div className="mx-chips">
        {pool
          .filter((a) => !at[a.name])
          .map((a) => (
            <button key={a.name} draggable className={'chip' + (held === a.name ? ' sel' : '')} onDragStart={(e) => e.dataTransfer.setData('text/plain', a.name)} onClick={() => setHeld(a.name)}>
              {a.name}
            </button>
          ))}
      </div>
      <div className="mx-grid">
        {ZONES.map(([z, label], k) => (
          <div
            key={z}
            className={'mx-zone z-' + z + (held ? ' armed' : '')}
            style={{ gridColumn: k + 1, gridRow: 3 - k }}
            onClick={() => held && drop(held, z)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e.dataTransfer.getData('text/plain'), z)}
          >
            <span className="tag">{label}</span>
            {ASSETS.filter((a) => at[a.name] === z).map((a) => (
              <span key={a.name} className="chip small">
                {a.name}
              </span>
            ))}
          </div>
        ))}
        <span className="mx-axis y">Reward ↑</span>
        <span className="mx-axis x">Risk →</span>
      </div>
      {msg && !done && <p className="small" style={{ color: msg.ok ? 'var(--good-deep)' : 'var(--bad)' }}>{msg.t}</p>}
      {done && <Done>Every asset placed. More potential reward comes with more risk, which is why you match investments to how long you can leave the money.</Done>}
    </div>
  );
}

export const NOVICE_MECHS = {
  'swipe-sorter': SwipeSorter,
  'pie-slider': PieSlider,
  'time-lapse': TimeLapse,
  'expense-stripper': ExpenseStripper,
  'apr-scale': AprScale,
  'dual-race': DualRace,
  'power-shrink': PowerShrink,
  'asset-drag': AssetDrag,
};
