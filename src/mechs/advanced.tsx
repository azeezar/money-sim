import { useState } from 'react';
import { gbp } from '../lib/format';
import { Sorter, useDoneWhen } from './intermediate';
import { Done, Range, type MechProps } from './novice';

const pct = (n: number, d = 1) => `${(n * 100).toLocaleString('en-GB', { maximumFractionDigits: d })}%`;
const k = (n: number) => (n >= 1e6 ? `£${(n / 1e6).toFixed(2)}m` : `£${Math.round(n / 1000)}k`);

export interface Ask {
  q: string;
  /** Correct option first; shown in this order. */
  o: string[];
  why: string;
}

/** Questions one at a time. A wrong pick shows a hint and lets the user try again. Calls onDone after the last. */
export function Asks({ asks, onDone, end }: { asks: Ask[]; onDone: () => void; end: string }) {
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState('');
  const [order] = useState(() => asks.map((a) => [...a.o].sort(() => Math.random() - 0.5)));
  useDoneWhen(i >= asks.length, onDone);
  if (i >= asks.length) return <Done>{end}</Done>;
  const a = asks[i];
  return (
    <div className="col">
      <b>{a.q}</b>
      <div className="col" style={{ gap: 6 }}>
        {order[i].map((o) => (
          <button
            key={o}
            className={'opt' + (wrong === o ? ' no' : '')}
            onClick={() => {
              if (o === a.o[0]) (setI(i + 1), setWrong(''));
              else setWrong(o);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {wrong && <p className="small" style={{ color: 'var(--bad)' }}>Not quite. {a.why}</p>}
    </div>
  );
}

/** A small line chart. Each series is a list of y values spread evenly across the width. */
export function Lines({ series, lo, hi, zero, label }: { series: { ys: number[]; color: string; n?: number }[]; lo: number; hi: number; zero?: number; label: string }) {
  const W = 300;
  const H = 150;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-chart" role="img" aria-label={label}>
      {zero !== undefined && <line x1="0" x2={W} y1={y(zero)} y2={y(zero)} stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" />}
      {series.map((s, j) => {
        const n = s.n ?? s.ys.length;
        const pts = s.ys.slice(0, n).map((v, i) => `${(i / (s.ys.length - 1)) * W},${y(v)}`);
        return <polyline key={j} points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />;
      })}
    </svg>
  );
}

const Row = ({ l, v, strong }: { l: string; v: string; strong?: boolean }) => (
  <div className="row" style={{ justifyContent: 'space-between', fontWeight: strong ? 800 : 600 }}>
    <span>{l}</span>
    <span className="num">{v}</span>
  </div>
);

/* ---------------------------------------------------------------- 9.1 Line-Item Inspector */

export function LineItem({ onDone }: MechProps) {
  const R = 800_000, COGS = 480_000, OPEX = 200_000, INT = 20_000, TAX = 25_000;
  const gross = R - COGS;
  const net = gross - OPEX - INT - TAX;
  return (
    <div className="col">
      <p className="muted small">Brightloaf Bakeries’ results for the year. Work out its margins.</p>
      <div className="mx-lane">
        <Row l="Revenue" v={k(R)} strong />
        <Row l="Cost of goods sold" v={`−${k(COGS)}`} />
        <Row l="Gross profit" v={k(gross)} strong />
        <Row l="Operating costs" v={`−${k(OPEX)}`} />
        <Row l="Interest" v={`−${k(INT)}`} />
        <Row l="Tax" v={`−${k(TAX)}`} />
        <Row l="Net profit" v={k(net)} strong />
      </div>
      <Asks
        onDone={onDone}
        asks={[
          { q: 'Gross margin?', o: [pct(gross / R), pct(COGS / R), pct(net / R)], why: 'Gross margin = gross profit ÷ revenue.' },
          { q: 'Net margin?', o: [pct(net / R), pct(gross / R), pct((net + TAX) / R)], why: 'Net margin = net profit ÷ revenue.' },
        ]}
        end={`Brightloaf keeps ${pct(gross / R)} of each sale after making it, and ${pct(net / R)} after every cost. Compare those with similar bakeries, and watch whether they rise over time.`}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- 9.2 FCF Waterfall */

const FLOW: [string, number][] = [
  ['Profit', 60],
  ['Depreciation', 25],
  ['Working capital', -10],
  ['Operating cash', 0],
  ['CapEx', -45],
  ['Free cash', 0],
];

export function FcfWaterfall({ onDone }: MechProps) {
  const [n, setN] = useState(1);
  let run = 0;
  const bars = FLOW.map(([l, v]) => {
    const total = v === 0;
    const from = total ? 0 : run;
    if (!total) run += v;
    return { l, v: total ? run : v, from: total ? 0 : Math.min(from, run), h: total ? run : Math.abs(v), total, neg: v < 0 };
  });
  const done = n >= FLOW.length;
  const max = 90;
  return (
    <div className="col">
      <p className="muted small">Trace the cash, in £ millions. Tap to add each step to the waterfall.</p>
      <div className="mx-fall">
        {bars.map((b, i) => (
          <div key={b.l} className="mx-fallcol" style={{ opacity: i < n ? 1 : 0.15 }}>
            <b className="num small">{b.total ? `£${b.v}m` : `${b.v > 0 ? '+' : '−'}£${Math.abs(b.v)}m`}</b>
            <div className="mx-fallwrap">
              <i style={{ bottom: `${(b.from / max) * 100}%`, height: `${(b.h / max) * 100}%`, background: b.total ? 'var(--primary)' : b.neg ? 'var(--bad)' : 'var(--good)' }} />
            </div>
            <span className="tiny">{b.l}</span>
          </div>
        ))}
      </div>
      {!done ? (
        <button className="btn wide" onClick={() => setN(n + 1)}>
          Add: {FLOW[n][0]}
        </button>
      ) : (
        <Asks
          onDone={onDone}
          asks={[{ q: 'Profit was £60m. How much free cash did the business actually generate?', o: ['£30m', '£60m', '£75m', '£85m'], why: 'Operating cash flow £75m minus £45m of CapEx.' }]}
          end="£60m of profit became only £30m of free cash once the business paid for new ovens and vans. Free cash flow is what could actually go back to shareholders or pay down debt."
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- 10.1 Peer Multiples */

const PEERS: { n: string; price: number; eps: number; g: number }[] = [
  { n: 'Orbit Software', price: 120, eps: 3, g: 20 },
  { n: 'Nimbus Cloud', price: 90, eps: 3, g: 10 },
  { n: 'Pixel Labs', price: 75, eps: 5, g: 25 },
  { n: 'Codeforge', price: 48, eps: 4, g: 5 },
];

export function PeerMultiples({ onDone }: MechProps) {
  const [shown, setShown] = useState(false);
  const [pick, setPick] = useState('');
  const peg = (p: (typeof PEERS)[number]) => p.price / p.eps / p.g;
  const best = [...PEERS].sort((a, b) => peg(a) - peg(b))[0].n;
  const ok = pick === best;
  useDoneWhen(ok, onDone);
  return (
    <div className="col">
      <p className="muted small">Four software companies. Show their multiples, then tap the one that looks most undervalued for its growth.</p>
      <table className="mx-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Price</th>
            <th>EPS</th>
            <th>Growth</th>
            {shown && <th>P/E</th>}
            {shown && <th>PEG</th>}
          </tr>
        </thead>
        <tbody>
          {PEERS.map((p) => (
            <tr key={p.n} className={pick === p.n ? (ok ? 'ok' : 'no') : ''} onClick={() => shown && setPick(p.n)} style={{ cursor: shown ? 'pointer' : undefined }}>
              <td>{p.n}</td>
              <td className="num">£{p.price}</td>
              <td className="num">£{p.eps}</td>
              <td className="num">{p.g}%</td>
              {shown && <td className="num">{(p.price / p.eps).toFixed(0)}</td>}
              {shown && <td className="num">{peg(p).toFixed(2)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {!shown && (
        <button className="btn wide" onClick={() => setShown(true)}>
          Calculate P/E and PEG
        </button>
      )}
      {pick && !ok && <p className="small" style={{ color: 'var(--bad)' }}>Look at PEG, not just P/E: the lowest PEG pays least for each point of growth.</p>}
      {ok && <Done>Pixel Labs has a P/E of 15 but grows 25% a year, so its PEG is just 0.6. Codeforge has the lowest P/E, 12, but with 5% growth its PEG is 2.4: cheap for a reason.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 10.2 Discount Rate Slider */

export const dcf = (cash: number, g: number, r: number, years: number): number => {
  let v = 0;
  for (let t = 1; t <= years; t++) v += (cash * Math.pow(1 + g, t)) / Math.pow(1 + r, t);
  return v;
};

export function DiscountSlider({ onDone }: MechProps) {
  const [g, setG] = useState(0.05);
  const [r, setR] = useState(0.08);
  const [seen, setSeen] = useState({ hi: false, lo: false });
  const v = dcf(100, g, r, 10);
  const check = (gg: number, rr: number) => {
    const x = dcf(100, gg, rr, 10);
    setSeen((s) => ({ hi: s.hi || x > 1200, lo: s.lo || x < 700 }));
  };
  useDoneWhen(seen.hi && seen.lo, onDone);
  return (
    <div className="col">
      <p className="muted small">A company will make £100k of free cash next year. What are the next 10 years worth today? Push the value above £1.2m, then below £700k.</p>
      <div className="mx-big num">{k(v * 1000)}</div>
      <Range label="Growth per year" value={g} min={0} max={0.15} step={0.005} fmt={(n) => pct(n)} onChange={(n) => (setG(n), check(n, r))} />
      <Range label="Discount rate" value={r} min={0.03} max={0.15} step={0.005} fmt={(n) => pct(n)} onChange={(n) => (setR(n), check(g, n))} />
      <p className="small">
        Above £1.2m: {seen.hi ? '✓' : '…'} · Below £700k: {seen.lo ? '✓' : '…'}
      </p>
      {seen.hi && seen.lo && <Done>The same business can look worth under £700k or over £1.2m from small changes in two guesses. Treat a DCF as a range, and be wary of anyone quoting one exact value.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 11.1 Central Bank Console */

type Move = 'raise' | 'hold' | 'cut';
const DATA: { name: string; kind: Move; why: string }[] = [
  { name: 'Inflation 6.5%, unemployment 3.8%, wages rising fast', kind: 'raise', why: 'Inflation far above 2% in a tight jobs market: raise rates to cool demand.' },
  { name: 'Inflation 2.1%, unemployment 4.3%, steady growth', kind: 'hold', why: 'Inflation is on target and jobs are steady: no need to move.' },
  { name: 'Inflation 0.8%, unemployment 6.9%, shops cutting prices', kind: 'cut', why: 'Inflation below target and jobs being lost: cut rates to support spending.' },
  { name: 'Inflation 4.9%, house prices up 12% this year', kind: 'raise', why: 'Prices running hot: higher rates cool borrowing and spending.' },
  { name: 'Inflation 1.9%, unemployment jumped from 4% to 6% in a year', kind: 'cut', why: 'A fast rise in unemployment signals a slowdown; cutting cushions it.' },
];
export const BankConsole = ({ onDone }: MechProps) => (
  <Sorter
    intro="You chair the central bank. Read each month’s data and set the base rate."
    items={DATA}
    kinds={[
      ['raise', 'Raise'],
      ['hold', 'Hold'],
      ['cut', 'Cut'],
    ]}
    onDone={onDone}
    summary={(r) => `You made ${r} of ${DATA.length} calls the way most central banks would. Raise when inflation runs hot, cut when the economy weakens, and remember rate changes take a year or more to bite.`}
  />
);

/* ---------------------------------------------------------------- 11.2 Yield Curve Plotter */

export function YieldCurve({ onDone }: MechProps) {
  const [short, setShort] = useState(3);
  const [long, setLong] = useState(4.5);
  const [seen, setSeen] = useState({ inv: false, back: false });
  const mid = (short * 2 + long) / 3;
  const inv = short > long;
  useDoneWhen(seen.back, onDone);
  const set = (s: number, l: number) => setSeen((x) => ({ inv: x.inv || s > l, back: x.back || (x.inv && s < l) }));
  return (
    <div className="col">
      <p className="muted small">Set short-term and long-term government bond yields. Invert the curve, then put it back to normal.</p>
      <Lines label={`Yield curve, ${inv ? 'inverted' : 'normal'}`} lo={0} hi={8} series={[{ ys: [short, mid, long], color: inv ? 'var(--bad)' : 'var(--good)' }]} />
      <div className="row small muted" style={{ justifyContent: 'space-between' }}>
        <span>2-year</span>
        <span>5-year</span>
        <span>10-year</span>
      </div>
      <p className="mx-say">
        <b style={{ color: inv ? 'var(--bad)' : 'var(--good-deep)' }}>{inv ? '⚠ Inverted: recession signal' : 'Normal: long bonds pay more'}</b>
      </p>
      <Range label="2-year yield" value={short} min={0.5} max={7.5} step={0.1} fmt={(n) => `${n.toFixed(1)}%`} onChange={(n) => (setShort(n), set(n, long))} />
      <Range label="10-year yield" value={long} min={0.5} max={7.5} step={0.1} fmt={(n) => `${n.toFixed(1)}%`} onChange={(n) => (setLong(n), set(short, n))} />
      {seen.back && <Done>When short rates rise above long ones, markets expect cuts ahead, usually because a slowdown is coming. An inverted curve has come before most US recessions since the 1960s, though not on any fixed timetable.</Done>}
    </div>
  );
}

/* ---------------------------------------------------------------- 12.1 Bias Spotter */

type Bias = 'fomo' | 'loss' | 'anchor';
const CHATS: { name: string; kind: Bias; why: string }[] = [
  { name: '“NOVA is up 80% this month. I HAVE to get in before it goes higher!”', kind: 'fomo', why: 'Fear of missing out: chasing what has already soared.' },
  { name: '“I’m not selling until it gets back to the £50 I paid.”', kind: 'anchor', why: 'Anchoring on the buy price. The market does not know what you paid.' },
  { name: '“It’s down 10%. I can’t stand the pain, selling it all now.”', kind: 'loss', why: 'Loss aversion: losses feel twice as bad as gains feel good.' },
  { name: '“Everyone at work just bought this coin. I’ll buy too.”', kind: 'fomo', why: 'FOMO and herding: the crowd is not a reason.' },
  { name: '“It was £200 last year, so at £120 it must be a bargain.”', kind: 'anchor', why: 'Anchoring on an old price. Ask what it is worth now.' },
  { name: '“I’ll keep my losers and sell my winners to lock in some green.”', kind: 'loss', why: 'Loss aversion again: avoiding the pain of admitting a loss.' },
];
export const BiasSpotter = ({ onDone }: MechProps) => (
  <Sorter
    intro="Messages from a trading chat. Name the bias in each."
    items={CHATS}
    kinds={[
      ['fomo', 'FOMO'],
      ['loss', 'Loss aversion'],
      ['anchor', 'Anchoring'],
    ]}
    onDone={onDone}
    summary={(r) => `You spotted ${r} of ${CHATS.length}. Naming a bias is the first step to beating it. A written plan is the second.`}
  />
);

/* ---------------------------------------------------------------- 12.2 Crash Decision Tree */

const CHOICES: { id: string; label: string; end: number; put: number; text: string }[] = [
  { id: 'sell', label: 'Sell everything', end: 6500, put: 10000, text: 'You locked in the loss and missed the rebound.' },
  { id: 'hold', label: 'Hold and wait', end: 10400, put: 10000, text: 'You rode it out and came back ahead.' },
  { id: 'buy', label: 'Hold, and add £2,000 spare cash', end: 13600, put: 12000, text: 'Your extra £2,000 bought at crash prices.' },
];

export function CrashTree({ onDone }: MechProps) {
  const [tried, setTried] = useState<string[]>([]);
  const last = CHOICES.find((c) => c.id === tried.at(-1));
  useDoneWhen(tried.length === CHOICES.length, onDone);
  return (
    <div className="col">
      <p className="muted small">Your £10,000 portfolio just fell 35% to £6,500. Over the next three years the market recovers 60% from the bottom. Try every choice.</p>
      <div className="col" style={{ gap: 6 }}>
        {CHOICES.map((c) => (
          <button key={c.id} className={'opt' + (tried.includes(c.id) ? ' sel' : '')} onClick={() => setTried((t) => (t.includes(c.id) ? [...t.filter((x) => x !== c.id), c.id] : [...t, c.id]))}>
            {c.label}
            {tried.includes(c.id) && (
              <span className="num">
                {' '}
                → {gbp(c.end)}
              </span>
            )}
          </button>
        ))}
      </div>
      {last && (
        <div className={'fb ' + (last.end >= last.put ? 'good' : 'bad')}>
          <b>
            {gbp(last.end)} from {gbp(last.put)} put in
          </b>
          <p>{last.text}</p>
        </div>
      )}
      {tried.length === CHOICES.length && <Done>The same crash, three endings. Selling turned a paper loss into a real one. History does not promise a recovery, but broad markets have recovered from every crash so far, often within a few years.</Done>}
    </div>
  );
}

export const ADVANCED_MECHS = {
  'line-item': LineItem,
  'fcf-waterfall': FcfWaterfall,
  'peer-multiples': PeerMultiples,
  'discount-slider': DiscountSlider,
  'bank-console': BankConsole,
  'yield-curve': YieldCurve,
  'bias-spotter': BiasSpotter,
  'crash-tree': CrashTree,
};
