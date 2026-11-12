import { Arcade, pick, rand, type ArcadeProps, type World } from './engine';
import { catcher, keeper, lanes, type Drop, type Quiz } from './kit';

const int = (lo: number, hi: number) => Math.round(rand(lo, hi));
const m = (n: number) => `£${n}m`;
/** A wrong number near the right one, never equal to it. */
const near = (a: number, opts: number[]) => pick(opts.filter((o) => o !== a && o > 0)) ?? a + 1;

/* ---------------------------------------------------------------- 9.1 Margin Hero */

function marginLine(): Drop {
  const rev = int(2, 9) * 100;
  const cost = Math.round((rev * rand(0.3, 0.8)) / 10) * 10;
  const gross = rev - cost;
  const pct = Math.round((gross / rev) * 100);
  const good = Math.random() < 0.55;
  const fake = pick([cost, rev + cost, Math.round(gross * 1.5)]);
  return good
    ? { label: pick([`${m(rev)} − ${m(cost)} = ${m(gross)} gross`, `Gross ${m(gross)} on ${m(rev)} = ${pct}%`]), good, why: '' }
    : pick([
        { label: `${m(rev)} − ${m(cost)} = ${m(fake)} gross`, good, why: `Gross profit is revenue − cost of sales = ${m(gross)}.` },
        { label: `Gross ${m(gross)} on ${m(rev)} = ${Math.min(99, pct + 15)}%`, good, why: `Margin = ${m(gross)} ÷ ${m(rev)} = ${pct}%.` },
      ]);
}
export const marginHero = (w: World) =>
  catcher(w, {
    tray: 'Correct',
    next: marginLine,
    goal: 12,
    secs: 45,
    win: 'You can read an income statement on the fly: revenue minus cost of sales is gross profit, and margin is profit ÷ revenue.',
    lose: 'Check each line: gross profit = revenue − cost of sales; margin = gross profit ÷ revenue.',
  });
export const MarginHero = (p: ArcadeProps) => (
  <Arcade {...p} name="Margin Hero" how="Income-statement lines rain down. Catch the ones where the maths is right, and dodge the wrong ones. Catch 12 in 45 seconds with a life left to win." controls="Slide your finger or use the arrow keys to move the tray." make={marginHero} />
);

/* ---------------------------------------------------------------- 9.2 Cash Flow Plumber */

function fcfQ(): Quiz {
  const ocf = int(4, 15) * 10;
  const capex = int(1, ocf / 10 - 1) * 10;
  const fcf = ocf - capex;
  return { q: `Operating cash flow ${m(ocf)}, CapEx ${m(capex)}. Free cash flow?`, a: m(fcf), b: m(near(fcf, [ocf + capex, ocf, capex, fcf + 20])), why: `${m(ocf)} − ${m(capex)} = ${m(fcf)} of free cash flow.` };
}
function bsQ(): Quiz {
  const assets = int(5, 20) * 10;
  const debt = int(1, assets / 10 - 1) * 10;
  return { q: `Assets ${m(assets)}, liabilities ${m(debt)}. Shareholders' equity?`, a: m(assets - debt), b: m(near(assets - debt, [assets + debt, assets, debt])), why: `Equity = assets − liabilities = ${m(assets - debt)}.` };
}
export const cashflowPlumber = (w: World) => lanes(w, { next: () => (Math.random() < 0.65 ? fcfQ() : bsQ()), total: 10, need: 7, win: 'Your pipes are plumbed: cash from operations minus CapEx fills the free cash flow tank.', lose: 'Remember: FCF = operating cash flow − CapEx, and equity = assets − liabilities.' });
export const CashflowPlumber = (p: ArcadeProps) => (
  <Arcade {...p} name="Cash Flow Plumber" how="Each round shows a company's cash or balance sheet. Two answer pipes roll down: be in the right lane when they reach you. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={cashflowPlumber} />
);

/* ---------------------------------------------------------------- 10.1 Valuation Matchmaker */

function peQ(): Quiz {
  const eps = int(1, 8);
  const pe = pick([8, 10, 12, 15, 20, 25, 30]);
  return { q: `Share price £${eps * pe}, earnings per share £${eps}. P/E ratio?`, a: `${pe}`, b: `${near(pe, [pe + 5, pe * 2, Math.round(pe / 2), eps])}`, why: `£${eps * pe} ÷ £${eps} = a P/E of ${pe}.` };
}
function pegQ(): Quiz {
  const [a, b] = [pick([10, 15, 20]), pick([25, 30, 40])];
  const [ga, gb] = [pick([5, 10]), pick([30, 40])];
  const pa = +(a / ga).toFixed(2);
  const pb = +(b / gb).toFixed(2);
  const cheapA = pa < pb;
  return { q: `A: P/E ${a}, growth ${ga}%. B: P/E ${b}, growth ${gb}%. Better value for its growth?`, a: cheapA ? `A (PEG ${pa})` : `B (PEG ${pb})`, b: cheapA ? `B (PEG ${pb})` : `A (PEG ${pa})`, why: `PEG = P/E ÷ growth. Lower PEG means less paid per unit of growth.` };
}
export const valuationMatchmaker = (w: World) => lanes(w, { next: () => (Math.random() < 0.5 ? peQ() : pegQ()), total: 10, need: 7, win: 'Matched: P/E is price ÷ earnings, and PEG adjusts it for growth.', lose: 'P/E = price ÷ earnings per share. PEG = P/E ÷ growth; lower is cheaper for the growth.' });
export const ValuationMatchmaker = (p: ArcadeProps) => (
  <Arcade {...p} name="Valuation Matchmaker" how="Work out P/E ratios and spot the better value using PEG. Steer into the right answer as it rolls down. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={valuationMatchmaker} />
);

/* ---------------------------------------------------------------- 10.2 Discount Machine */

function pvQ(): Quiz {
  const r = pick([5, 8, 10]);
  const y = pick([1, 2, 3]);
  const pv = pick([100, 200, 500, 1000]);
  const fv = Math.round(pv * Math.pow(1 + r / 100, y));
  return { q: `£${fv.toLocaleString('en-GB')} arriving in ${y} year${y > 1 ? 's' : ''}, at a ${r}% discount rate. Worth today?`, a: `£${pv.toLocaleString('en-GB')}`, b: `£${fv.toLocaleString('en-GB')}`, why: `£${fv.toLocaleString('en-GB')} ÷ ${(1 + r / 100).toFixed(2)}^${y} ≈ £${pv.toLocaleString('en-GB')}. Future cash is worth less today.` };
}
function rateQ(): Quiz {
  return pick([
    { q: 'You raise the discount rate in a DCF. What happens to the value?', a: 'It falls', b: 'It rises', why: 'A higher discount rate shrinks every future cash flow in today’s money.' },
    { q: 'You raise expected growth in a DCF. What happens to the value?', a: 'It rises', b: 'It falls', why: 'More future cash flow means more value today.' },
    { q: 'Which is worth more today: £100 now or £100 in 5 years?', a: '£100 now', b: '£100 in 5 years', why: 'Money now can be invested; later money must be discounted.' },
  ]);
}
export const discountMachine = (w: World) => lanes(w, { next: () => (Math.random() < 0.65 ? pvQ() : rateQ()), total: 10, need: 7, win: 'Your discount machine runs smoothly: future cash ÷ (1 + rate)^years is today’s value.', lose: 'Present value = future cash ÷ (1 + rate)^years. Higher rates mean lower values.' });
export const DiscountMachine = (p: ArcadeProps) => (
  <Arcade {...p} name="Discount Machine" how="Pass future cash flows through the discount machine: pick what they are worth today. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={discountMachine} />
);

/* ---------------------------------------------------------------- 11.1 Fed Chair */

export const fedChair = (w: World) =>
  keeper(w, {
    secs: 40,
    need: 0.6,
    start: 0.4,
    gauge: 'Inflation (target band 1–3%)',
    control: 'Base interest rate',
    win: 'You steered inflation back to target. Higher rates cool prices, but act slowly; cut too far and prices run hot again.',
    lose: 'Rates work with a delay. Raise them when inflation runs hot, cut when it falls below target, and move early.',
    model: (pace) => {
      let inf = 5;
      let push = 0;
      let next = 3;
      const rate = (c: number) => c * 8;
      return {
        step(c, dt) {
          next -= dt;
          // Inflation drifts towards a level set by shocks minus the effect of rates, with a lag.
          const aim = 2 + push + (3.5 - rate(c)) * 0.9;
          inf += (aim - inf) * dt * 0.45 * pace;
          if (next <= 0) {
            next = rand(3, 5) / pace;
            const s = pick<[number, string]>([[2, 'Energy prices spike'], [1.5, 'Wages jump'], [-1.5, 'Shoppers stop spending'], [-2, 'Factories slow down'], [1, 'Pound weakens']]);
            push = Math.max(-3, Math.min(4, push + s[0]));
            return s[1];
          }
          push *= 1 - dt * 0.05;
        },
        gauge: () => ({ v: (inf + 2) / 12, lo: 3 / 12, hi: 5 / 12 }),
        labels: (c) => [`Inflation ${inf.toFixed(1)}%`, `Base rate ${rate(c).toFixed(2)}%`],
      };
    },
  });
export const FedChair = (p: ArcadeProps) => (
  <Arcade {...p} name="Fed Chair Simulator" how="You run the central bank. News pushes inflation around; set the base rate to keep it in the 1–3% band. Stay in the zone 60% of the time to win." controls="Drag the rate slider at the bottom, or use the arrow keys." make={fedChair} />
);

/* ---------------------------------------------------------------- 11.2 Recession Rider */

function curveQ(): Quiz {
  const short = +rand(1, 6).toFixed(1);
  const inverted = Math.random() < 0.5;
  const long = +(inverted ? short - rand(0.4, 1.5) : short + rand(0.4, 1.5)).toFixed(1);
  return { q: `2-year gilt ${short}%, 10-year gilt ${Math.max(0.2, long)}%. The curve is…`, a: inverted ? 'Inverted' : 'Normal', b: inverted ? 'Normal' : 'Inverted', why: inverted ? 'Short above long is inverted, often a recession warning.' : 'Long paying more than short is a normal curve.' };
}
function cycleQ(): Quiz {
  return pick([
    { q: 'Unemployment rising, spending falling, output shrinking. Which phase?', a: 'Contraction', b: 'Expansion', why: 'Falling output and jobs mean contraction.' },
    { q: 'Jobs and profits growing steadily. Which phase?', a: 'Expansion', b: 'Contraction', why: 'Growing output and jobs mean expansion.' },
    { q: 'Shares usually move… the economy.', a: 'Ahead of', b: 'Behind', why: 'Markets price in the future, so they often turn before the economy does.' },
  ]);
}
export const recessionRider = (w: World) => lanes(w, { next: () => (Math.random() < 0.6 ? curveQ() : cycleQ()), total: 10, need: 7, win: 'You read the curve: when short yields beat long ones, a slowdown has often followed.', lose: 'Normal curve: long yields above short. Inverted: short above long, an old recession warning.' });
export const RecessionRider = (p: ArcadeProps) => (
  <Arcade {...p} name="Recession Rider" how="Read the yield curve and the business cycle. Ride into the right answer as it rolls towards you. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={recessionRider} />
);

/* ---------------------------------------------------------------- 12.1 Mind Over Market */

const CALM: string[] = ['Stick to the monthly plan', 'Check my written rules', 'Rebalance once a year', 'Sleep on it', 'Would I buy it today?', 'Diversify'];
const TRAPS: [string, string][] = [
  ['It’s up 300%, get in now!', 'FOMO: chasing what has already soared.'],
  ['Hold till it’s back to what I paid', 'Anchoring on your buy price.'],
  ['Everyone in the chat is buying', 'Herding: the crowd is not a plan.'],
  ['Sell everything, it’s down 5%', 'Loss aversion turning a dip into panic.'],
  ['I was right last time, go bigger', 'Overconfidence after a lucky win.'],
  ['Win it back with one big bet', 'Chasing losses makes them bigger.'],
];
export const mindOverMarket = (w: World) =>
  catcher(w, {
    tray: 'Calm mind',
    next: () => (Math.random() < 0.5 ? { label: pick(CALM), good: true, why: '' } : (([label, why]) => ({ label, good: false, why }))(pick(TRAPS))),
    goal: 10,
    secs: 45,
    win: 'Calm mind kept. Rules written in advance beat feelings in the moment.',
    lose: 'Spot the traps: FOMO, anchoring, herding, loss aversion and chasing losses.',
  });
export const MindOverMarket = (p: ArcadeProps) => (
  <Arcade {...p} name="Mind Over Market" how="Thoughts fall into your head. Catch the calm, rule-based ones and dodge the emotional traps. Catch 10 in 45 seconds with a life left to win." controls="Slide your finger or use the arrow keys to move." make={mindOverMarket} />
);

/* ---------------------------------------------------------------- 12.2 Dip Buyer */

const QUALITY = ['Global index fund −30%', 'FTSE tracker −25%', 'World ETF −28%', 'S&P 500 fund −32%', 'Bond fund −8%'];
const JUNK: [string, string][] = [
  ['Meme coin +400%', 'Hype, not quality. It can go to zero.'],
  ['Loan to buy more', 'Borrowing in a crash can wipe you out.'],
  ['Sell all, go to cash', 'Panic selling locks in the loss.'],
  ['Mystery penny share', 'A crash does not make junk good.'],
  ['Emergency fund raid', 'Keep your safety net. Only spare cash buys dips.'],
];
export const dipBuyer = (w: World) =>
  catcher(w, {
    tray: 'Spare cash',
    next: () => (Math.random() < 0.55 ? { label: pick(QUALITY), good: true, why: '' } : (([label, why]) => ({ label, good: false, why }))(pick(JUNK))),
    goal: 12,
    secs: 45,
    win: 'You bought quality on sale with spare cash and kept your safety net. That is how dips have rewarded patient investors.',
    lose: 'In a crash, buy broad quality funds with spare cash only. Dodge hype, debt and panic selling.',
  });
export const DipBuyer = (p: ArcadeProps) => (
  <Arcade {...p} name="Dip Buyer" how="The market has crashed. Catch broad, quality funds on sale and dodge hype, debt and panic. Catch 12 in 45 seconds with a life left to win." controls="Slide your finger or use the arrow keys to move." make={dipBuyer} />
);

export const ADVANCED_ARCADE = {
  'margin-hero': MarginHero,
  'cashflow-plumber': CashflowPlumber,
  'valuation-matchmaker': ValuationMatchmaker,
  'discount-machine': DiscountMachine,
  'fed-chair': FedChair,
  'recession-rider': RecessionRider,
  'mind-over-market': MindOverMarket,
  'dip-buyer': DipBuyer,
};
