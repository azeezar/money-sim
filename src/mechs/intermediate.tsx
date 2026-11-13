import { useEffect, useRef, useState } from 'react';
import { gbp, shuffle } from '../lib/format';
import { Done, Range, p2, type MechProps } from './novice';
import { afterFees, bondPrice, payoff } from './sims';

/** Calls onDone once, the first time `ok` is true. */
export function useDoneWhen(ok: boolean, onDone: () => void) {
  const fired = useRef(false);
  useEffect(() => {
    if (ok && !fired.current) {
      fired.current = true;
      onDone();
    }
  }, [ok, onDone]);
}

const pct = (n: number, d = 1) => `${(n * 100).toLocaleString('en-GB', { maximumFractionDigits: d })}%`;

/** Pick-the-right-bucket feed shared by the sorting mechanics. */
export function Sorter<K extends string>({ intro, items, kinds, onDone, summary }: { intro: string; items: { name: string; kind: K; why: string }[]; kinds: [K, string][]; onDone: () => void; summary: (right: number) => string }) {
  const [deck] = useState(() => shuffle(items));
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [fb, setFb] = useState<{ ok: boolean; why: string } | null>(null);
  const it = deck[i];
  useDoneWhen(!it, onDone);
  if (!it) return <Done>{summary(right)}</Done>;
  return (
    <div className="col">
      <p className="muted small">
        {intro} Card {i + 1} of {deck.length}.
      </p>
      <div className={'mx-feed' + (fb ? (fb.ok ? ' ok' : ' no') : '')}>
        <b>{it.name}</b>
      </div>
      {fb ? (
        <div className={'fb ' + (fb.ok ? 'good' : 'bad')}>
          <b>{fb.ok ? 'Correct' : `Not quite: ${kinds.find((k) => k[0] === it.kind)![1]}`}</b>
          <p>{fb.why}</p>
          <button className={'btn wide ' + (fb.ok ? 'good' : 'bad')} onClick={() => (setFb(null), setI(i + 1))}>
            Next
          </button>
        </div>
      ) : (
        <div className="mx-3">
          {kinds.map(([k, label]) => (
            <button
              key={k}
              className="opt"
              onClick={() => {
                const ok = k === it.kind;
                if (ok) setRight(right + 1);
                setFb({ ok, why: it.why });
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 5.1 Corporate Tap */

export function CorporateTap({ onDone }: MechProps) {
  const PRICE = 200;
  const SHARES = 5_000_000;
  const DIV = 6;
  const [in_, setIn] = useState(0);
  const owned = in_ / PRICE;
  useDoneWhen(owned >= 0.5, onDone);
  return (
    <div className="col">
      <p className="muted small">Brightloaf Bakeries has {SHARES.toLocaleString('en-GB')} shares at {gbp(PRICE)} each, and pays a {gbp(DIV)} dividend per share a year. Tap to invest £10 at a time until you own half a share.</p>
      <div className="mx-lane">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Company value</span>
          <b className="num">{gbp(PRICE * SHARES)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>You invested</span>
          <b className="num">{gbp(in_)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Shares you own</span>
          <b className="num">{owned.toFixed(2)}</b>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Your yearly dividend</span>
          <b className="num">{p2(owned * DIV)}</b>
        </div>
        <div className="bar pri">
          <i style={{ width: `${Math.min(100, owned * 200)}%` }} />
        </div>
      </div>
      <button className="btn wide" disabled={owned >= 0.5} onClick={() => setIn(in_ + 10)}>
        Invest £10
      </button>
      {owned >= 0.5 && <Done>You own 0.5 of a share for {gbp(in_)}. You get half of every gain, loss and dividend a whole share gets: {p2(owned * DIV)} a year here. If the price rises 10%, your slice is worth {gbp(in_ * 1.1)}.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 5.2 Bond Seesaw */

export function BondSeesaw({ onDone }: MechProps) {
  const [rate, setRate] = useState(0.04);
  const [seen, setSeen] = useState({ up: false, down: false });
  const price = bondPrice(1000, 0.04, rate, 10);
  const tilt = Math.max(-18, Math.min(18, (1000 - price) / 12));
  useDoneWhen(seen.up && seen.down, onDone);
  return (
    <div className="col">
      <p className="muted small">You hold a 10-year gilt: £1,000 face value paying 4% (£40 a year). Move the rate new bonds pay. Push it above 5% and below 3% to see both sides of the seesaw.</p>
      <div className="mx-seesaw" aria-hidden>
        <div className="mx-beam" style={{ transform: `rotate(${tilt}deg)` }}>
          <span className="chip">Rates {pct(rate)}</span>
          <span className="chip">Price {gbp(price)}</span>
        </div>
        <i className="mx-pivot" />
      </div>
      <Range
        label="Rate on new bonds"
        value={rate}
        min={0.01}
        max={0.07}
        step={0.0025}
        fmt={(n) => pct(n, 2)}
        onChange={(n) => {
          setRate(n);
          setSeen((s) => ({ up: s.up || n >= 0.05, down: s.down || n <= 0.03 }));
        }}
      />
      <p className="small">
        Your bond is worth <b className="num">{gbp(price)}</b>: {Math.abs(price - 1000) < 1 ? 'about face value, because it pays the same as new bonds.' : price < 1000 ? 'below face value, because new bonds pay more than yours.' : 'above face value, because yours pays more than new bonds.'}
      </p>
      {seen.up && seen.down && <Done>Rates up, price down. Rates down, price up. Your £40 a year never changed; only what others will pay for it did.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 6.1 ETF Basket Builder */

const COS: [string, number][] = [
  ['Orbit Software', 410],
  ['Nova Phones', 380],
  ['Greenline Energy', 260],
  ['Northbank', 190],
  ['Mediwell Pharma', 170],
  ['Brick & Co', 60],
  ['Lumen Games', 45],
  ['Corner Cafés', 12],
  ['Tidy Socks', 4],
];

export function EtfBasket({ onDone }: MechProps) {
  const [pool] = useState(() => shuffle(COS));
  const [picked, setPicked] = useState<string[]>([]);
  const [bad, setBad] = useState('');
  const done = picked.length === 5;
  useDoneWhen(done, onDone);
  const top5 = COS.slice(0, 5);
  const share = top5.reduce((a, c) => a + c[1], 0) / COS.reduce((a, c) => a + c[1], 0);
  return (
    <div className="col">
      <p className="muted small">Build a “Top 5” index fund. Tap the five biggest companies by market value (in £ billions).</p>
      <div className="mx-strip">
        {pool.map(([n, cap]) => (
          <button
            key={n}
            className={'mx-exp' + (picked.includes(n) ? ' in' : '') + (bad === n ? ' warn' : '')}
            disabled={picked.includes(n) || done}
            onClick={() => {
              if (top5.some((c) => c[0] === n)) setPicked([...picked, n]);
              else {
                setBad(n);
                setTimeout(() => setBad(''), 700);
              }
            }}
          >
            <span>{n}</span>
            <b className="num">£{cap}bn</b>
          </button>
        ))}
      </div>
      <p className="small">
        In the basket: <b>{picked.length} / 5</b>
      </p>
      {done && <Done>One purchase of this fund buys all five, weighted by size, so Orbit counts most. The top 5 are {pct(share, 0)} of this whole market: index funds follow the giants.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 6.2 Fee Decay Graph */

export function FeeDecay({ onDone }: MechProps) {
  const [fee, setFee] = useState(0.0003);
  const [maxed, setMaxed] = useState(false);
  const cheap = afterFees(10000, 0.06, 0.0003, 30);
  const pot = afterFees(10000, 0.06, fee, 30);
  useDoneWhen(maxed, onDone);
  return (
    <div className="col">
      <p className="muted small">£10,000 grows at 6% a year for 30 years. Drag the yearly fee up to 1.5% and watch what it eats.</p>
      <div className="mx-bars">
        {(
          [
            ['Fee 0.03%', cheap, 'var(--good)'],
            [`Fee ${pct(fee, 2)}`, pot, 'var(--bad)'],
          ] as const
        ).map(([n, v, c]) => (
          <div key={n} className="mx-barcol">
            <b className="num">{gbp(v)}</b>
            <div className="mx-barwrap">
              <i style={{ height: `${(v / cheap) * 100}%`, background: c }} />
            </div>
            <span className="small">{n}</span>
          </div>
        ))}
      </div>
      <Range label="Yearly fee (OCF)" value={fee} min={0.0003} max={0.015} step={0.0001} fmt={(n) => pct(n, 2)} onChange={(n) => (setFee(n), n >= 0.015 && setMaxed(true))} />
      <p className="small">
        Lost to fees: <b className="num">{gbp(cheap - pot)}</b> ({pct(1 - pot / cheap, 0)} of the pot).
      </p>
      {maxed && <Done>A 1.5% fee takes about {pct(1 - afterFees(10000, 0.06, 0.015, 30) / cheap, 0)} of what a 0.03% tracker would have left you. Fees compound too.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 7.1 Risk Profile Mixer */

const NERVES: [string, string, number][] = [
  ['sell', 'I would sell', -20],
  ['wait', 'I would worry but wait', 0],
  ['buy', 'I would buy more', 10],
];

export function RiskMixer({ onDone }: MechProps) {
  const [age, setAge] = useState(30);
  const [nerve, setNerve] = useState('');
  const [mix, setMix] = useState(50);
  const adj = NERVES.find((n) => n[0] === nerve)?.[2] ?? 0;
  const target = Math.max(20, Math.min(100, Math.round((110 - age + adj) / 5) * 5));
  const ok = !!nerve && Math.abs(mix - target) <= 2;
  useDoneWhen(ok, onDone);
  return (
    <div className="col">
      <p className="muted small">Set an age and how you would react to a 30% fall. Then set the mix slider to the matching shares/bonds split.</p>
      <Range label="Age" value={age} min={18} max={75} step={1} fmt={(n) => `${n}`} onChange={setAge} />
      <div className="mx-3">
        {NERVES.map(([k, label]) => (
          <button key={k} className={'opt' + (nerve === k ? ' sel' : '')} onClick={() => setNerve(k)}>
            {label}
          </button>
        ))}
      </div>
      {nerve && (
        <p className="small">
          Suggested: <b>{target}% shares / {100 - target}% bonds</b>. Rule of thumb: 110 minus your age in shares, less if falls would make you sell.
        </p>
      )}
      <div className="mx-pie" style={{ alignSelf: 'center', background: `conic-gradient(var(--primary) 0 ${mix}%, var(--coin) ${mix}% 100%)` }} role="img" aria-label={`${mix}% shares, ${100 - mix}% bonds`} />
      <Range label="Your mix (shares)" value={mix} min={0} max={100} step={5} fmt={(n) => `${n}% / ${100 - n}%`} onChange={setMix} />
      {ok && <Done>A {target}/{100 - target} mix fits this profile. Younger, calmer investors can hold more shares; nearer the goal or more nervous, more bonds.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 7.2 Tax Router */

type Wrap = 'isa' | 'pen' | 'gia';
const MONEY: { name: string; kind: Wrap; why: string }[] = [
  { name: '£5,000 saved for a house deposit in 3 years', kind: 'isa', why: 'An ISA keeps it tax-free and you can take it out any time.' },
  { name: '£200 a month for retirement, with your employer matching', kind: 'pen', why: 'Employer matching is free money, and pensions get tax relief.' },
  { name: '£4,000 more after you already used your £20,000 ISA allowance', kind: 'gia', why: 'With the ISA full, the rest goes in a general (taxable) account.' },
  { name: '£1,000 to invest that you might need in 5 years', kind: 'isa', why: 'Pension money is locked until your late 50s; an ISA is not.' },
  { name: 'A £2,000 bonus you will not touch until you are 60', kind: 'pen', why: 'Tax relief turns £80 into £100 for a basic-rate taxpayer.' },
];

export const TaxRouter = ({ onDone }: MechProps) => (
  <Sorter
    intro="Route each pot of money into the best account."
    items={MONEY}
    kinds={[
      ['isa', 'ISA'],
      ['pen', 'Pension'],
      ['gia', 'General account'],
    ]}
    onDone={onDone}
    summary={(r) => `You routed ${r} of ${MONEY.length} right. The usual order: grab any employer match, fill the ISA, then use a general account.`}
  />
);

/* ---------------------------------------------------------------- 8.1 Minimum Payment Trap */

export function CardPayoff({ onDone }: MechProps) {
  const BAL = 1500;
  const APR = 0.249;
  const [pay, setPay] = useState(40);
  const r = payoff(BAL, APR, pay);
  const min = payoff(BAL, APR, 40);
  const ok = r.months <= 12;
  useDoneWhen(ok, onDone);
  const yrs = (m: number) => (m <= 12 ? `${m} months` : `about ${(m / 12).toFixed(1)} years`);
  return (
    <div className="col">
      <p className="muted small">You owe {gbp(BAL)} on a credit card at {pct(APR)} APR and stop using it. Drag the monthly repayment until the debt is gone within a year.</p>
      <div className="mx-bars">
        {(
          [
            ['You borrowed', BAL, 'var(--primary)'],
            ['Interest you pay', r.interest, 'var(--bad)'],
          ] as const
        ).map(([n, v, c]) => (
          <div key={n} className="mx-barcol">
            <b className="num">{gbp(v)}</b>
            <div className="mx-barwrap">
              <i style={{ height: `${Math.min(100, (v / BAL) * 100)}%`, background: c }} />
            </div>
            <span className="small">{n}</span>
          </div>
        ))}
      </div>
      <p className="mx-say">
        Cleared in <b className="num">{yrs(r.months)}</b>, paying <b className="num">{gbp(BAL + r.interest)}</b> in total.
      </p>
      <Range label="Monthly repayment" value={pay} min={35} max={300} step={5} fmt={gbp} onChange={setPay} />
      {ok && <Done>At {gbp(pay)} a month the card is clear in {r.months} months for {gbp(r.interest)} of interest. Paying £40 would have taken {yrs(min.months)} and cost {gbp(min.interest)}. Better still: pay the full balance every month and pay no interest at all.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 8.2 Drift Corrector */

export function DriftCorrector({ onDone }: MechProps) {
  const TOTAL = 10000;
  const [moved, setMoved] = useState(0);
  const shares = 8500 - moved;
  const ok = shares === 7000;
  useDoneWhen(ok, onDone);
  return (
    <div className="col">
      <p className="muted small">A strong year for shares drifted your £10,000 to 85/15. Your target is 70/30. Sell shares into bonds to get back on target.</p>
      <div className="mx-pie" style={{ alignSelf: 'center', background: `conic-gradient(var(--primary) 0 ${shares / 100}%, var(--coin) ${shares / 100}% 100%)` }} role="img" aria-label={`${shares / 100}% shares`} />
      <p className="mx-say small">
        Shares <b className="num">{gbp(shares)}</b> ({shares / 100}%) · Bonds <b className="num">{gbp(TOTAL - shares)}</b> ({(TOTAL - shares) / 100}%)
      </p>
      <Range label="Sell shares, buy bonds" value={moved} min={0} max={3000} step={100} fmt={gbp} onChange={setMoved} />
      {ok && <Done>Selling {gbp(1500)} of shares and buying bonds puts you back at 70/30. You sold what had risen and bought what lagged: “sell high, buy low”, built in.</Done>}
    </div>
  );
}

export const INTERMEDIATE_MECHS = {
  'corporate-tap': CorporateTap,
  'bond-seesaw': BondSeesaw,
  'etf-basket': EtfBasket,
  'fee-decay': FeeDecay,
  'risk-mixer': RiskMixer,
  'tax-router': TaxRouter,
  'card-payoff': CardPayoff,
  'drift-corrector': DriftCorrector,
};
