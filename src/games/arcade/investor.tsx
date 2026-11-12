import { Arcade, pick, rand, type ArcadeProps, type World } from './engine';
import { catcher, keeper, lanes, type Quiz } from './kit';

const int = (lo: number, hi: number) => Math.round(rand(lo, hi));
const money = (n: number) => (n < 0 ? `−£${Math.abs(n)}` : `£${n}`);

/* ---------------------------------------------------------------- 13.1 Option Strike Zone */

function optionQ(): Quiz {
  const call = Math.random() < 0.5;
  const K = pick([50, 80, 100, 120]);
  const prem = pick([2, 3, 5]);
  const S = K + pick([-20, -10, -5, 5, 10, 20]);
  const pl = Math.max(0, call ? S - K : K - S) - prem;
  const wrong = pick([Math.max(0, call ? S - K : K - S), -prem * 2, pl + prem * 2, Math.abs(S - K)].filter((v) => v !== pl));
  return {
    q: `${call ? 'Call' : 'Put'}, strike £${K}, premium £${prem}. Share ends at £${S}. Profit or loss per share?`,
    a: money(pl),
    b: money(wrong ?? pl + 1),
    why: `${call ? 'A call gains above' : 'A put gains below'} £${K}: value £${Math.max(0, call ? S - K : K - S)} minus the £${prem} premium = ${money(pl)}.`,
  };
}
export const strikeZone = (w: World) => lanes(w, { next: optionQ, total: 10, need: 7, win: 'Strike zone mastered: an option’s payoff is its value at expiry minus the premium you paid.', lose: 'Call value = share − strike (if positive). Put value = strike − share (if positive). Then take off the premium.' });
export const StrikeZone = (p: ArcadeProps) => (
  <Arcade {...p} name="Option Strike Zone" how="Work out each option’s profit or loss at expiry and steer into the right answer. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={strikeZone} />
);

/* ---------------------------------------------------------------- 13.2 Theta Time Crunch */

function thetaQ(): Quiz {
  return pick<Quiz>([
    (() => {
      const [a, b] = [int(60, 120), int(3, 14)];
      return { q: `Option A has ${a} days left, B has ${b}. Whose time value melts faster each day?`, a: `B (${b} days)`, b: `A (${a} days)`, why: 'Time decay speeds up in the final weeks before expiry.' };
    })(),
    (() => {
      const [prem, intr] = [int(6, 12), int(1, 4)];
      return { q: `Premium £${prem}, intrinsic value £${intr}. Time value?`, a: `£${prem - intr}`, b: `£${prem + intr}`, why: 'Premium = intrinsic value + time value.' };
    })(),
    { q: 'At expiry, an option’s time value is…', a: 'Zero', b: 'Its highest', why: 'No time left means no time value; only intrinsic value remains.' },
    { q: 'Who earns theta: the option buyer or the seller?', a: 'Seller', b: 'Buyer', why: 'Sellers collect the premium as it decays; buyers pay it.' },
    { q: 'Own a share and sell a call on it. This is a…', a: 'Covered call', b: 'Protective put', why: 'A covered call earns premium and caps your upside at the strike.' },
    { q: 'Own a share and buy a put as insurance. This is a…', a: 'Protective put', b: 'Covered call', why: 'A protective put limits your loss below the strike.' },
  ]);
}
export const thetaCrunch = (w: World) => lanes(w, { next: thetaQ, total: 10, need: 7, win: 'You managed the clock: time value melts fastest near expiry, and sellers collect it.', lose: 'Premium = intrinsic + time value. Time value decays to zero at expiry, fastest at the end.' });
export const ThetaCrunch = (p: ArcadeProps) => (
  <Arcade {...p} name="Theta Time Crunch" how="The decay clock is ticking. Answer questions about time value and option strategies before the gates reach you. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={thetaCrunch} />
);

/* ---------------------------------------------------------------- 14.1 REIT Tycoon */

function capQ(): Quiz {
  if (Math.random() < 0.55) {
    const cap = pick([4, 5, 6, 8, 10]);
    const price = pick([500, 800, 1000, 1200]) * 1000;
    const noi = (price * cap) / 100;
    return { q: `Warehouse: NOI £${noi / 1000}k a year, price £${price / 1000}k. Cap rate?`, a: `${cap}%`, b: `${pick([cap * 2, cap + 3, Math.max(1, cap - 2)].filter((c) => c !== cap))}%`, why: `£${noi / 1000}k ÷ £${price / 1000}k = ${cap}%.` };
  }
  const [a, b] = [int(40, 60), int(40, 60)];
  const [pa, pb] = [int(6, 10) * 100, int(6, 10) * 100];
  const ca = (a / pa) * 100;
  const cb = (b / pb) * 100;
  if (Math.abs(ca - cb) < 0.2) return capQ();
  const A = `Office A ${ca.toFixed(1)}%`;
  const B = `Shop B ${cb.toFixed(1)}%`;
  return { q: `Office A: NOI £${a}k, price £${pa}k. Shop B: NOI £${b}k, price £${pb}k. More income per pound?`, a: ca > cb ? A : B, b: ca > cb ? B : A, why: 'Cap rate = NOI ÷ price. Higher means more income per pound, often with more risk.' };
}
export const reitTycoon = (w: World) => lanes(w, { next: capQ, total: 10, need: 7, win: 'Property empire built on numbers: cap rate = NOI ÷ price.', lose: 'Cap rate = net operating income ÷ purchase price.' });
export const ReitTycoon = (p: ArcadeProps) => (
  <Arcade {...p} name="REIT Tycoon" how="Size up commercial properties by their cap rate. Steer into the right answer. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={reitTycoon} />
);

/* ---------------------------------------------------------------- 14.2 Leverage Tightrope */

export const leverageTightrope = (w: World) =>
  keeper(w, {
    secs: 40,
    need: 0.6,
    start: 0.6,
    gauge: 'Loan-to-value (aim for 50–80%)',
    control: 'Your mortgage: pay down ◀ ▶ borrow more',
    win: 'You kept your balance: enough borrowing to boost returns, never so much that a price fall wiped you out.',
    lose: 'When prices fall, your LTV rises even if you borrow nothing. Pay down early to stay safe.',
    model: (pace) => {
      let price = 1;
      let drift = 0;
      let next = 2.5;
      const loan = (c: number) => c * 1.0;
      let ltv = 0.6;
      return {
        step(c, dt) {
          next -= dt;
          price = Math.max(0.5, Math.min(1.6, price * (1 + drift * dt)));
          ltv = loan(c) / price;
          if (next <= 0) {
            next = rand(2.5, 4) / pace;
            const s = pick<[number, string]>([[-0.06, 'House prices slump'], [-0.04, 'Rates jump, buyers vanish'], [0.05, 'Property boom'], [0.03, 'Rents rising'], [-0.08, 'Local factory closes']]);
            drift = s[0] * pace;
            return s[1];
          }
        },
        gauge: () => ({ v: Math.min(1, ltv / 1.2), lo: 0.5 / 1.2, hi: 0.8 / 1.2 }),
        labels: (c) => [ltv >= 1 ? `LTV ${Math.round(ltv * 100)}%: underwater!` : `LTV ${Math.round(ltv * 100)}%`, `Loan £${Math.round(loan(c) * 250)}k on a £${Math.round(price * 250)}k home`],
      };
    },
  });
export const LeverageTightrope = (p: ArcadeProps) => (
  <Arcade {...p} name="Leverage Tightrope" how="House prices swing. Adjust your mortgage to keep loan-to-value between 50% and 80%: enough leverage to earn, not enough to fall. Stay in the zone 60% of the time to win." controls="Drag the slider at the bottom, or use the arrow keys." make={leverageTightrope} />
);

/* ---------------------------------------------------------------- 15.1 Unicorn Hunter */

const SPREAD = ['20 small seed bets', 'Fund of 30 startups', '£500 across 10 deals', 'VC fund, 10-year lock', 'Follow-on in a winner'];
const ALLIN: [string, string][] = [
  ['All-in on one startup', 'Most startups fail. One bet usually means a total loss.'],
  ['Money needed next year', 'Private money is locked up for 7–10 years.'],
  ['Emergency fund into VC', 'Never put your safety net into the riskiest asset.'],
  ['Friend’s app, no due diligence', 'Check the business, not the friendship.'],
  ['Loan to fund a startup bet', 'Borrowing for a likely loss multiplies the damage.'],
];
export const unicornHunter = (w: World) =>
  catcher(w, {
    tray: 'Your fund',
    next: () => (Math.random() < 0.55 ? { label: pick(SPREAD), good: true, why: '' } : (([label, why]) => ({ label, good: false, why }))(pick(ALLIN))),
    goal: 12,
    secs: 45,
    win: 'A spread, patient portfolio: enough bets that one unicorn can pay for all the failures.',
    lose: 'In venture, most bets fail. Spread small amounts, lock up only money you will not need, and wait.',
  });
export const UnicornHunter = (p: ArcadeProps) => (
  <Arcade {...p} name="Unicorn Hunter" how="Catch spread, patient startup bets. Dodge all-in gambles and money you cannot lock away. Catch 12 in 45 seconds with a life left to win." controls="Slide your finger or use the arrow keys to move." make={unicornHunter} />
);

/* ---------------------------------------------------------------- 15.2 Sharpe Shooter */

function sharpeQ(): Quiz {
  if (Math.random() < 0.3)
    return pick<Quiz>([
      { q: 'Adding gold that moves opposite to shares usually makes a portfolio…', a: 'Swing less', b: 'Swing more', why: 'Low or negative correlation smooths the ride.' },
      { q: 'Correlation of +1 means two assets move…', a: 'In lockstep', b: 'Opposite ways', why: '+1 is perfectly together; −1 is perfectly opposite.' },
    ]);
  const rf = 2;
  const make = () => {
    const r = int(4, 14);
    const v = int(5, 25);
    return { r, v, s: (r - rf) / v };
  };
  const A = make();
  let B = make();
  while (Math.abs(A.s - B.s) < 0.08) B = make();
  const la = `A (${A.s.toFixed(2)})`;
  const lb = `B (${B.s.toFixed(2)})`;
  return { q: `Risk-free rate ${rf}%. A: return ${A.r}%, volatility ${A.v}%. B: return ${B.r}%, volatility ${B.v}%. Better Sharpe ratio?`, a: A.s > B.s ? la : lb, b: A.s > B.s ? lb : la, why: 'Sharpe = (return − risk-free) ÷ volatility: reward per unit of risk.' };
}
export const sharpeShooter = (w: World) => lanes(w, { next: sharpeQ, total: 10, need: 7, win: 'Sharp shooting: the best portfolio is the one paying the most per unit of risk, not just the most.', lose: 'Sharpe ratio = (return − risk-free rate) ÷ volatility. Higher is better.' });
export const SharpeShooter = (p: ArcadeProps) => (
  <Arcade {...p} name="Sharpe Shooter" how="Compare portfolios on reward per unit of risk. Steer into the better Sharpe ratio. Get 7 of 10 to win." controls="Tap the left or right half, or use the arrow keys." make={sharpeShooter} />
);

/* ---------------------------------------------------------------- 16.1 Wash-Sale Evasion */

const VALID = ['Sell FTSE 100 tracker, buy FTSE All-Share', 'Sell US tracker, buy world fund', 'Sell, wait 31 days, rebuy', 'Sell at a loss, hold cash 31 days', 'Swap one oil firm for another'];
const WASH: [string, string][] = [
  ['Sell, rebuy same fund day 3', 'Inside 30 days: the loss is matched to the rebuy.'],
  ['Sell, rebuy same share day 29', 'Day 29 is still inside the 30-day window.'],
  ['Buy more, sell old lot same day', 'Same-day buys of the same share are matched first.'],
  ['Sell fund, rebuy its twin class', 'Another class of the identical fund counts as the same.'],
];
export const washSale = (w: World) =>
  catcher(w, {
    tray: 'Harvest',
    next: () => (Math.random() < 0.55 ? { label: pick(VALID), good: true, why: '' } : (([label, why]) => ({ label, good: false, why }))(pick(WASH))),
    goal: 12,
    secs: 45,
    win: 'Clean harvests: losses booked, still invested, and nothing inside the 30-day window.',
    lose: 'Rebuying the same thing within 30 days cancels the loss for tax. Swap to a similar, not identical, fund.',
  });
export const WashSale = (p: ArcadeProps) => (
  <Arcade {...p} name="Wash-Sale Evasion" how="Catch valid tax-loss harvests. Dodge anything that rebuys the same holding inside 30 days. Catch 12 in 45 seconds with a life left to win." controls="Slide your finger or use the arrow keys to move." make={washSale} />
);

/* ---------------------------------------------------------------- 16.2 Safe Withdrawal Survival */

export const safeWithdrawal = (w: World) =>
  keeper(w, {
    secs: 45,
    need: 0.6,
    start: 0.33,
    gauge: 'Your pot vs. where it started (keep 70%+)',
    control: 'Yearly withdrawal',
    win: 'Your pot survived the bad years. Spending a little less after a crash is what keeps a retirement plan alive.',
    lose: 'Cut withdrawals after bad years and take a bit more after good ones. Under 3% is too little to live on.',
    model: (pace) => {
      let pot = 1;
      let year = 0;
      let yr = 0;
      let cc = 0.33;
      const rate = (c: number) => 0.02 + c * 0.06;
      const rets = [-0.18, -0.1, 0.04, 0.12, 0.08, -0.05, 0.15, 0.07, 0.09, -0.22, 0.2, 0.06, 0.1, 0.03, -0.08, 0.14, 0.05, 0.09, 0.11, -0.04, 0.07, 0.12, 0.02, 0.08, 0.06, 0.1, -0.12, 0.13, 0.05, 0.07];
      return {
        step(c, dt) {
          cc = c;
          yr += (dt * 30) / 45; // one retirement, 30 years, per run
          if (yr < 1) return;
          yr = 0;
          if (year >= rets.length) return;
          const r = rets[year] * (0.7 + 0.3 * pace); // higher levels swing harder
          pot = Math.max(0, (pot - rate(c)) * (1 + r));
          year++;
          return `Year ${year}: market ${r >= 0 ? '+' : ''}${Math.round(r * 100)}%`;
        },
        // Taking under 3% counts as out of the zone: the pot is safe but you cannot live on it.
        gauge: () => ({ v: rate(cc) < 0.03 ? 0 : Math.min(1, pot / 2), lo: 0.35, hi: 1 }),
        labels: (c) => [pot <= 0 ? 'Pot empty!' : `Pot ${Math.round(pot * 100)}% of start`, rate(c) < 0.03 ? `${(rate(c) * 100).toFixed(1)}%: too little to live on` : `Withdrawing ${(rate(c) * 100).toFixed(1)}% a year`],
      };
    },
  });
export const SafeWithdrawal = (p: ArcadeProps) => (
  <Arcade {...p} name="Safe Withdrawal Survival" how="You have retired. Each year the market moves; set how much you withdraw to keep your pot above 70% of where it started, while taking at least 3% to live on. Stay in the zone 60% of the time to win." controls="Drag the slider at the bottom, or use the arrow keys." make={safeWithdrawal} />
);

export const INVESTOR_ARCADE = {
  'strike-zone': StrikeZone,
  'theta-crunch': ThetaCrunch,
  'reit-tycoon': ReitTycoon,
  'leverage-tightrope': LeverageTightrope,
  'unicorn-hunter': UnicornHunter,
  'sharpe-shooter': SharpeShooter,
  'wash-sale': WashSale,
  'safe-withdrawal': SafeWithdrawal,
};
