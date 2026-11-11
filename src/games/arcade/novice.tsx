import { gbp } from '../../lib/format';
import { Arcade, disc, pick, pill, rand, rr, steer, text, type ArcadeProps, type Game, type World } from './engine';

/* ---------------------------------------------------------------- 1.1 Leak Dodger */

const SUBS = ['Unused gym', 'Streaming #3', 'App trial', 'Cloud 2TB', 'Magazine', 'Delivery pass', 'Old phone cover'];

function leakDodger(w: World): Game {
  const { W, H, C, pace } = w;
  let px = W / 2;
  let lives = 3;
  let saved = 0;
  let left = 30;
  let spawn = 0.4;
  let flash = 0;
  const items: { x: number; y: number; v: number; fire: boolean; label: string; wob: number }[] = [];
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      flash = Math.max(0, flash - dt);
      px = steer(w, px, 30, dt);
      if (spawn <= 0) {
        spawn = rand(0.35, 0.6) / pace;
        const fire = Math.random() < 0.62;
        items.push({ x: rand(30, W - 30), y: -20, v: rand(140, 220) * pace, fire, label: fire ? pick(SUBS) : '+£100 pay', wob: rand(0, 6) });
      }
      for (const it of items) {
        it.y += it.v * dt;
        it.wob += dt * 6;
        if (it.y > H - 62 && it.y < H - 22 && Math.abs(it.x + (it.fire ? Math.sin(it.wob) * 8 : 0) - px) < (it.fire ? 40 : 46)) {
          it.y = H + 99;
          if (it.fire) {
            lives--;
            saved = Math.max(0, saved - 50);
            flash = 0.3;
          } else saved += 100;
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 30) items.splice(i, 1);
    },
    draw(x) {
      if (flash) {
        x.fillStyle = C.bad;
        x.globalAlpha = flash;
        x.fillRect(0, 0, W, H);
        x.globalAlpha = 1;
      }
      for (const it of items) {
        if (it.fire) {
          const cx = it.x + Math.sin(it.wob) * 8;
          disc(x, cx, it.y, 16, C.bad, C.badD);
          x.fillStyle = C.coin;
          x.beginPath();
          x.moveTo(cx - 8, it.y - 6);
          x.quadraticCurveTo(cx, it.y - 30, cx + 8, it.y - 6);
          x.fill();
          text(x, it.label, cx, it.y + 28, C.bad, 11);
        } else pill(x, it.label, it.x, it.y, C.good, C.goodD, C.onGood, 12);
      }
      x.fillStyle = C.priD;
      rr(x, px - 30, H - 46, 60, 34, 10);
      x.fillStyle = C.pri;
      rr(x, px - 30, H - 50, 60, 34, 10);
      text(x, 'WALLET', px, H - 33, C.onPri, 11);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  Saved ${gbp(saved)}`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      lives <= 0 || left <= 0
        ? {
            score: saved,
            good: lives > 0 && saved >= 800,
            text: lives > 0 ? `You kept ${gbp(saved)} of your pay away from stealth subscriptions.` : `Three leaks got through. Every forgotten subscription drains pay you already earned. You kept ${gbp(saved)}.`,
          }
        : null,
  };
}

export const LeakDodger = (p: ArcadeProps) => (
  <Arcade {...p} name="Leak Dodger" how="30 seconds. Catch your pay (+£100) and dodge subscription fireballs. Three hits and the run ends. Keep £800 to win." controls="Drag, or use the arrow keys, to move your wallet." make={leakDodger} />
);

/* ---------------------------------------------------------------- 1.2 Budget Balancer */

type Bucket = 0 | 1 | 2;
const COINS: [string, Bucket][] = [
  ['Rent', 0], ['Energy bill', 0], ['Food shop', 0], ['Bus fare', 0], ['Council tax', 0],
  ['Gig tickets', 1], ['Takeaway', 1], ['New game', 1], ['Trainers', 1],
  ['ISA', 2], ['Emergency fund', 2], ['Pay off card', 2],
];
const BUCKETS = ['Needs 50%', 'Wants 30%', 'Save 20%'];

function budgetBalancer(w: World): Game {
  const { W, H, C, pace } = w;
  const bw = W / 3;
  const fill = [0, 0, 0];
  let n = 0;
  let right = 0;
  let coin = next();
  let msg = '';
  let msgT = 0;
  function next() {
    const r = Math.random();
    const want: Bucket = r < 0.5 ? 0 : r < 0.8 ? 1 : 2;
    const opts = COINS.filter((c) => c[1] === want);
    const [label, b] = pick(opts);
    return { x: W / 2, y: 70, vy: 30 * pace, vx: 0, label, b };
  }
  const TOTAL = 18;
  return {
    tick(dt) {
      msgT = Math.max(0, msgT - dt);
      const target = w.input.keys.ArrowLeft ? coin.x - 300 * dt : w.input.keys.ArrowRight ? coin.x + 300 * dt : w.input.seen ? w.input.x : coin.x;
      coin.vx = (target - coin.x) * 8;
      coin.x = Math.max(20, Math.min(W - 20, coin.x + coin.vx * dt));
      coin.vy += 150 * pace * dt;
      coin.y += coin.vy * dt;
      if (coin.y > H - 70) {
        const k = Math.min(2, Math.floor(coin.x / bw)) as Bucket;
        fill[k]++;
        n++;
        if (k === coin.b) {
          right++;
          msg = '✓ ' + coin.label;
        } else msg = `${coin.label} belongs in ${BUCKETS[coin.b].split(' ')[0]}`;
        msgT = 1.2;
        coin = next();
      }
    },
    draw(x) {
      for (let k = 0; k < 3; k++) {
        const col = [C.pri, C.coin, C.good][k];
        const deep = [C.priD, C.coinD, C.goodD][k];
        x.fillStyle = C.line;
        rr(x, k * bw + 6, H - 70, bw - 12, 64, 12);
        const share = n ? fill[k] / n : 0;
        x.fillStyle = col;
        x.globalAlpha = 0.35;
        rr(x, k * bw + 6, H - 6 - 64 * Math.min(1, share / 0.6), bw - 12, 64 * Math.min(1, share / 0.6), 12);
        x.globalAlpha = 1;
        x.strokeStyle = deep;
        x.setLineDash([4, 4]);
        const ty = H - 6 - 64 * ([0.5, 0.3, 0.2][k] / 0.6);
        x.beginPath();
        x.moveTo(k * bw + 10, ty);
        x.lineTo((k + 1) * bw - 10, ty);
        x.stroke();
        x.setLineDash([]);
        text(x, BUCKETS[k], k * bw + bw / 2, H - 40, C.ink, 12);
        text(x, `${Math.round(share * 100)}%`, k * bw + bw / 2, H - 22, C.muted, 11);
      }
      disc(x, coin.x, coin.y, 18, C.coin, C.coinD);
      text(x, '£', coin.x, coin.y + 1, C.onCoin, 15);
      pill(x, coin.label, coin.x, coin.y - 32, C.surface, C.line, C.ink, 12);
      if (msgT) text(x, msg, W / 2, H - 90, msg.startsWith('✓') ? C.goodD : C.bad, 13);
    },
    hud: () => [`Coin ${Math.min(TOTAL, n + 1)} / ${TOTAL}`, `${right} right`],
    over: () =>
      n >= TOTAL
        ? {
            score: right,
            good: right >= TOTAL * 0.75,
            text: `${right} of ${TOTAL} coins landed in the right bucket. Your split ended at ${fill.map((f) => Math.round((f / n) * 100) + '%').join(' / ')}, against a 50/30/20 target.`,
          }
        : null,
  };
}

export const BudgetBalancer = (p: ArcadeProps) => (
  <Arcade {...p} name="Budget Balancer" how="18 coins drop, each labelled with a cost. Steer each into Needs, Wants or Save. Land 14 right to win." controls="Hold and drag, or use the arrow keys, to steer the falling coin." make={budgetBalancer} />
);

/* ---------------------------------------------------------------- 2.1 Yield Stack */

function yieldStack(w: World): Game {
  const { W, H, C, pace } = w;
  const BH = 26;
  const tower: { x: number; w: number; apy: number }[] = [{ x: W / 2 - 80, w: 160, apy: 0 }];
  let lives = 3;
  let value = 1000;
  let mv = spawn();
  let msg = '';
  let msgT = 0;
  let cam = 0;
  let ended = false;
  function spawn() {
    const good = Math.random() < 0.72;
    const top = tower[tower.length - 1];
    return { x: 0, w: top.w, dir: 1, v: (130 + tower.length * 9) * pace, apy: good ? +rand(3.8, 5.2).toFixed(1) : +rand(0.01, 0.5).toFixed(2), good, passes: 0 };
  }
  return {
    tick(dt) {
      msgT = Math.max(0, msgT - dt);
      mv.x += mv.dir * mv.v * dt;
      if (mv.x < 0 || mv.x + mv.w > W) {
        mv.dir *= -1;
        mv.x = Math.max(0, Math.min(W - mv.w, mv.x));
        mv.passes++;
        if (!mv.good && mv.passes >= 2) {
          msg = 'Low-yield block skipped. Good call.';
          msgT = 1;
          mv = spawn();
        }
      }
      const drop = w.input.taps.length > 0 || w.input.hits.has(' ') || w.input.hits.has('ArrowDown');
      if (drop) {
        if (!mv.good) {
          lives--;
          msg = `${mv.apy}% barely grows. That block crumbled.`;
          msgT = 1.4;
          mv = spawn();
        } else {
          const top = tower[tower.length - 1];
          const l = Math.max(top.x, mv.x);
          const r = Math.min(top.x + top.w, mv.x + mv.w);
          if (r - l < 6) {
            lives = 0;
            ended = true;
          } else {
            tower.push({ x: l, w: r - l, apy: mv.apy });
            value *= 1 + mv.apy / 100;
            msg = `+${mv.apy}% · year ${tower.length - 1}`;
            msgT = 0.8;
            mv = spawn();
          }
        }
      }
      const want = Math.max(0, (tower.length - 7) * BH);
      cam += (want - cam) * Math.min(1, dt * 5);
    },
    draw(x) {
      const base = H - 20 + cam;
      tower.forEach((b, k) => {
        const y = base - (k + 1) * BH;
        if (y > H + BH) return;
        x.fillStyle = k ? C.coinD : C.priD;
        rr(x, b.x, y + 3, b.w, BH - 2, 6);
        x.fillStyle = k ? C.coin : C.pri;
        rr(x, b.x, y, b.w, BH - 2, 6);
        text(x, k ? `${b.apy}%` : '£1,000', b.x + b.w / 2, y + BH / 2 - 1, k ? C.onCoin : C.onPri, 11);
      });
      const y = base - (tower.length + 1) * BH - 14;
      x.fillStyle = mv.good ? C.coinD : C.line;
      rr(x, mv.x, y + 3, mv.w, BH - 2, 6);
      x.fillStyle = mv.good ? C.coin : C.muted;
      rr(x, mv.x, y, mv.w, BH - 2, 6);
      text(x, `${mv.apy}% APY`, mv.x + mv.w / 2, y + BH / 2 - 1, mv.good ? C.onCoin : C.surface, 11);
      if (msgT) text(x, msg, W / 2, 40, C.ink, 13);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  ${gbp(value)}`, `${tower.length - 1} years`],
    over: () =>
      lives <= 0 || ended || tower.length > 15
        ? {
            score: tower.length - 1,
            good: tower.length - 1 >= 10,
            text: `Your tower compounded £1,000 into ${gbp(value)} over ${tower.length - 1} years of high-yield blocks. Skipping low-APY blocks is the same as choosing a better savings account.`,
          }
        : null,
  };
}

export const YieldStack = (p: ArcadeProps) => (
  <Arcade {...p} name="Yield Stack" how="Drop gold high-APY blocks onto the tower and let grey low-APY blocks slide past. Misaligned edges get trimmed. Stack 10 years to win." controls="Tap, or press Space, to drop the block." make={yieldStack} />
);

/* ---------------------------------------------------------------- 2.2 Shield Defense */

const SHOCKS: [string, number][] = [['Car repair', 450], ['Vet bill', 300], ['Boiler breaks', 800], ['Phone screen', 150], ['Dentist', 200], ['Job gap', 1000], ['Washing machine', 350]];

function shieldDefense(w: World): Game {
  const { W, H, C, pace } = w;
  const cx = W / 2;
  const cy = H / 2 + 10;
  let shield = 3000;
  let blocked = 0;
  let left = 35;
  let spawn = 0.8;
  let hitT = 0;
  const rocks: { x: number; y: number; vx: number; vy: number; label: string; cost: number; r: number }[] = [];
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      hitT = Math.max(0, hitT - dt);
      if (spawn <= 0) {
        spawn = rand(0.6, 1.1) / pace;
        const a = rand(0, Math.PI * 2);
        const d = Math.hypot(W, H) / 2 + 20;
        const [label, cost] = pick(SHOCKS);
        const x0 = cx + Math.cos(a) * d;
        const y0 = cy + Math.sin(a) * d;
        const v = rand(45, 75) * pace;
        rocks.push({ x: x0, y: y0, vx: ((cx - x0) / d) * v, vy: ((cy - y0) / d) * v, label, cost, r: 14 + cost / 80 });
      }
      for (const t of w.input.taps) {
        const k = rocks.findIndex((r) => Math.hypot(r.x - t.x, r.y - t.y) < r.r + 18);
        if (k >= 0) {
          rocks.splice(k, 1);
          blocked++;
        }
      }
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i];
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        if (Math.hypot(r.x - cx, r.y - cy) < 46 + r.r) {
          shield -= r.cost;
          hitT = 0.3;
          rocks.splice(i, 1);
        }
      }
    },
    draw(x) {
      const frac = Math.max(0, shield / 3000);
      x.strokeStyle = hitT ? C.bad : C.good;
      x.lineWidth = 6;
      x.globalAlpha = 0.25 + 0.6 * frac;
      x.beginPath();
      x.arc(cx, cy, 52, 0, Math.PI * 2 * frac);
      x.stroke();
      x.globalAlpha = 1;
      x.lineWidth = 1;
      disc(x, cx, cy, 40, C.pri, C.priD);
      text(x, 'Savings', cx, cy - 7, C.onPri, 11);
      text(x, gbp(Math.max(0, shield)), cx, cy + 9, C.onPri, 12);
      for (const r of rocks) {
        disc(x, r.x, r.y, r.r, C.muted, C.ink);
        text(x, `£${r.cost}`, r.x, r.y, C.surface, 10);
        text(x, r.label, r.x, r.y - r.r - 9, C.ink, 11);
      }
    },
    hud: () => [`${blocked} blocked`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      shield <= 0 || left <= 0
        ? {
            score: blocked,
            good: shield > 0,
            text: shield > 0 ? `Your emergency fund held with ${gbp(shield)} left after ${blocked} surprises. That is what the shield is for.` : `The surprises drained the whole £3,000. Real emergencies come in clusters, which is why 3 to 6 months of cover matters.`,
          }
        : null,
  };
}

export const ShieldDefense = (p: ArcadeProps) => (
  <Arcade {...p} name="Shield Defense" how="Surprise bills fly at your £3,000 emergency fund. Tap them before they hit. Survive 35 seconds with money left to win." controls="Tap the asteroids to block them." make={shieldDefense} />
);

/* ---------------------------------------------------------------- 3.1 Interest Crusher */

const HIGH: [string, string][] = [['Credit card', '24.9%'], ['Payday loan', '1,292%'], ['Store card', '31.9%'], ['Overdraft', '39.9%'], ['Catalogue', '44.9%']];
const LOW: [string, string][] = [['Mortgage', '4.5%'], ['Student loan', '6.2%'], ['0% card deal', '0%']];

function interestCrusher(w: World): Game {
  const { W, H, C, pace } = w;
  const cols = 3;
  const gw = W / cols;
  const gh = (H - 40) / 3;
  const holes = Array.from({ length: 9 }, (_, k) => ({ x: (k % cols) * gw + gw / 2, y: 40 + Math.floor(k / cols) * gh + gh / 2, up: 0, life: 0, high: false, name: '', apr: '', hit: 0 }));
  let score = 0;
  let left = 30;
  let spawn = 0.3;
  let missed = 0;
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = rand(0.35, 0.7) / pace;
        const free = holes.filter((h) => !h.life && !h.hit);
        if (free.length) {
          const h = pick(free);
          h.high = Math.random() < 0.65;
          [h.name, h.apr] = pick(h.high ? HIGH : LOW);
          h.life = rand(1.0, 1.5) / pace;
        }
      }
      for (const h of holes) {
        h.hit = Math.max(0, h.hit - dt);
        if (h.life > 0) {
          h.life -= dt;
          h.up = Math.min(1, h.up + dt * 8);
          if (h.life <= 0) {
            h.life = 0;
            if (h.high) missed++;
          }
        } else h.up = Math.max(0, h.up - dt * 8);
      }
      for (const t of w.input.taps) {
        const h = holes.find((q) => q.life > 0 && Math.abs(q.x - t.x) < gw / 2 - 4 && Math.abs(q.y - t.y) < gh / 2 - 4);
        if (!h) continue;
        score += h.high ? 10 : -10;
        h.life = 0;
        h.up = 0;
        h.hit = 0.4;
      }
    },
    draw(x) {
      for (const h of holes) {
        x.fillStyle = C.line;
        x.beginPath();
        x.ellipse(h.x, h.y + 22, Math.min(46, gw / 2 - 8), 12, 0, 0, 7);
        x.fill();
        if (h.up > 0) {
          const y = h.y + 22 - 40 * h.up;
          pill(x, h.name, h.x, y - 10, h.high ? C.bad : C.good, h.high ? C.badD : C.goodD, h.high ? C.onBad : C.onGood, 12);
          text(x, h.apr + ' APR', h.x, y + 14, h.high ? C.bad : C.goodD, 11);
        }
        if (h.hit) text(x, '💥', h.x, h.y, C.ink, 26);
      }
    },
    hud: () => [`Score ${score}`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      left <= 0
        ? {
            score,
            good: score >= 120,
            text: `You scored ${score}. ${missed} high-APR debts slipped away and kept charging. Cheap debt like a mortgage can wait; expensive debt cannot.`,
          }
        : null,
  };
}

export const InterestCrusher = (p: ArcadeProps) => (
  <Arcade {...p} name="Interest Crusher" how="Whack red high-APR debts (+10). Leave green low-APR debts alone (−10 if you hit one). Score 120 in 30 seconds to win." controls="Tap a debt to whack it." make={interestCrusher} />
);

/* ---------------------------------------------------------------- 3.2 Debt Runner */

function debtRunner(w: World): Game {
  const { W, H, C, pace } = w;
  const lanes = [W / 6, W / 2, (5 * W) / 6];
  let lane = 1;
  let px = lanes[1];
  let debt = 5000;
  let lives = 3;
  let left = 45;
  let spawn = 0.5;
  let combo = 0;
  let msg = '';
  let msgT = 0;
  const things: { lane: number; y: number; kind: 'ava' | 'snow' | 'fee' }[] = [];
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      msgT = Math.max(0, msgT - dt);
      debt *= 1 + 0.006 * dt; // interest keeps ticking while you run: about 0.6% a second
      if (w.input.hits.has('ArrowLeft')) lane = Math.max(0, lane - 1);
      if (w.input.hits.has('ArrowRight')) lane = Math.min(2, lane + 1);
      for (const t of w.input.taps) lane = t.x < W / 3 ? 0 : t.x < (2 * W) / 3 ? 1 : 2;
      px += (lanes[lane] - px) * Math.min(1, dt * 16);
      if (spawn <= 0) {
        spawn = rand(0.45, 0.75) / pace;
        const r = Math.random();
        things.push({ lane: Math.floor(Math.random() * 3), y: -20, kind: r < 0.3 ? 'ava' : r < 0.6 ? 'snow' : 'fee' });
      }
      const v = 230 * pace;
      for (let i = things.length - 1; i >= 0; i--) {
        const t = things[i];
        t.y += v * dt;
        if (t.lane === lane && t.y > H - 70 && t.y < H - 30) {
          if (t.kind === 'ava') {
            debt -= 450;
            combo = 0;
            msg = 'Avalanche: highest APR hit, −£450';
          } else if (t.kind === 'snow') {
            combo++;
            debt -= 200 + combo * 60;
            msg = `Snowball ×${combo}: a debt cleared, −£${200 + combo * 60}`;
          } else {
            lives--;
            combo = 0;
            debt += 150;
            msg = 'Late fee! +£150';
          }
          msgT = 1;
          things.splice(i, 1);
        } else if (t.y > H + 30) things.splice(i, 1);
      }
      debt = Math.max(0, debt);
    },
    draw(x) {
      x.strokeStyle = C.line;
      x.setLineDash([10, 12]);
      for (const k of [1, 2]) {
        x.beginPath();
        x.moveTo((k * W) / 3, 30);
        x.lineTo((k * W) / 3, H);
        x.stroke();
      }
      x.setLineDash([]);
      for (const t of things) {
        const cx = lanes[t.lane];
        if (t.kind === 'ava') pill(x, '⛰ Avalanche', cx, t.y, C.pri, C.priD, C.onPri, 12);
        else if (t.kind === 'snow') pill(x, '❄ Snowball', cx, t.y, C.surface, C.line, C.ink, 12);
        else {
          x.fillStyle = C.bad;
          rr(x, cx - 40, t.y - 14, 80, 28, 6);
          text(x, 'LATE FEE', cx, t.y, C.onBad, 11);
        }
      }
      disc(x, px, H - 48, 18, C.coin, C.coinD);
      text(x, '🏃', px, H - 48, C.ink, 18);
      const frac = Math.min(1, debt / 6000);
      x.fillStyle = C.line;
      rr(x, 10, 30, W - 20, 10, 5);
      x.fillStyle = C.bad;
      rr(x, 10, 30, (W - 20) * frac, 10, 5);
      if (msgT) text(x, msg, W / 2, 56, C.ink, 13);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  Debt ${gbp(debt)}`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      debt <= 0 || lives <= 0 || left <= 0
        ? {
            score: Math.round(5000 - debt),
            good: debt <= 0,
            text: debt <= 0 ? `Debt-free with ${Math.ceil(left)} seconds to spare. Avalanche hits hardest; Snowball streaks keep you going.` : `You finished with ${gbp(debt)} still owed. Interest kept ticking the whole time, which is why speed matters.`,
          }
        : null,
  };
}

export const DebtRunner = (p: ArcadeProps) => (
  <Arcade {...p} name="Debt Runner" how="£5,000 of debt, growing with interest. Grab Avalanche (big hit) and Snowball (builds a streak) power-ups, dodge late fees. Clear it in 45 seconds to win." controls="Tap a lane, or use the left and right arrow keys." make={debtRunner} />
);

/* ---------------------------------------------------------------- 4.1 Inflation Escape */

function inflationEscape(w: World): Game {
  const { W, H, C, pace } = w;
  const steps: { x: number; y: number; w: number; price: number }[] = [{ x: -40, y: 0, w: 260, price: 1 }];
  const add = () => {
    const p = steps[steps.length - 1];
    steps.push({ x: p.x + p.w + rand(40, 90), y: p.y - rand(14, 44), w: rand(80, 140), price: +(p.price * 1.03).toFixed(2) });
  };
  for (let i = 0; i < 8; i++) add();
  const me = { x: 40, y: -20, vy: 0, ground: true };
  let lava = 140;
  let best = 0;
  let camX = 0;
  let camY = -H * 0.6;
  let dead = false;
  const vx = 170 * pace;
  return {
    tick(dt) {
      if (w.input.taps.length || w.input.hits.has(' ') || w.input.hits.has('ArrowUp')) {
        if (me.ground) {
          me.vy = -560;
          me.ground = false;
        }
      }
      const prevFeet = me.y;
      me.x += vx * dt;
      me.vy += 1500 * dt;
      me.y += me.vy * dt;
      me.ground = false;
      steps.forEach((s, k) => {
        if (me.vy >= 0 && prevFeet <= s.y + 1 && me.y >= s.y && me.x > s.x - 6 && me.x < s.x + s.w + 6) {
          me.y = s.y;
          me.vy = 0;
          me.ground = true;
          best = Math.max(best, k);
        }
      });
      while (steps[steps.length - 1].x < me.x + W) add();
      lava = Math.min(lava - 22 * pace * dt, me.y + 260);
      if (me.y > lava - 4) dead = true;
      camX += (me.x - W * 0.3 - camX) * Math.min(1, dt * 6);
      camY += (me.y - H * 0.6 - camY) * Math.min(1, dt * 4);
    },
    draw(x) {
      x.save();
      x.translate(-camX, -camY);
      for (const s of steps) {
        if (s.x + s.w < camX - 20 || s.x > camX + W + 20) continue;
        x.fillStyle = C.priD;
        rr(x, s.x, s.y + 3, s.w, 18, 6);
        x.fillStyle = C.pri;
        rr(x, s.x, s.y, s.w, 18, 6);
        text(x, `£${s.price.toFixed(2)}`, s.x + s.w / 2, s.y + 9, C.onPri, 11);
      }
      disc(x, me.x, me.y - 14, 13, C.coin, C.coinD);
      text(x, '£', me.x, me.y - 14, C.onCoin, 13);
      x.fillStyle = C.bad;
      x.globalAlpha = 0.85;
      x.fillRect(camX - 10, lava, W + 20, H + 400);
      x.globalAlpha = 1;
      text(x, 'RISING PRICES', camX + W / 2, lava + 18, C.onBad, 13);
      x.restore();
    },
    hud: () => [`Step ${best}`, `Basket £${(steps[best]?.price ?? 1).toFixed(2)}`],
    over: () =>
      dead
        ? {
            score: best,
            good: best >= 20,
            text: `You climbed ${best} steps before rising prices caught you. Each step was 3% pricier: a £1 basket became £${(steps[best]?.price ?? 1).toFixed(2)}. Money standing still gets caught.`,
          }
        : null,
  };
}

export const InflationEscape = (p: ArcadeProps) => (
  <Arcade {...p} name="Inflation Escape" how="Prices climb 3% every step and the red tide of inflation rises behind you. Jump from step to step. Reach step 20 to win." controls="Tap, or press Space, to jump." make={inflationEscape} />
);

/* ---------------------------------------------------------------- 4.2 Capital Catcher */

const GROW = ['Index fund', 'Property', 'Bonds', 'Pension', 'Global shares'];
const DECAY = ['Cash under the bed', 'Idle current account', 'Inflation trap', '0% savings'];

function capitalCatcher(w: World): Game {
  const { W, H, C, pace } = w;
  let px = W / 2;
  let pot = 1000;
  let assets = 0;
  let left = 30;
  let spawn = 0.4;
  let msg = '';
  let msgT = 0;
  const items: { x: number; y: number; v: number; good: boolean; label: string }[] = [];
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      msgT = Math.max(0, msgT - dt);
      px = steer(w, px, 44, dt);
      pot *= 1 + 0.004 * assets * dt; // productive assets keep compounding
      if (spawn <= 0) {
        spawn = rand(0.45, 0.7) / pace;
        const good = Math.random() < 0.6;
        items.push({ x: rand(50, W - 50), y: -20, v: rand(120, 190) * pace, good, label: pick(good ? GROW : DECAY) });
      }
      for (const it of items) {
        it.y += it.v * dt;
        if (it.y > H - 62 && it.y < H - 24 && Math.abs(it.x - px) < 70) {
          it.y = H + 99;
          if (it.good) {
            assets++;
            pot += 150;
            msg = `+ ${it.label}: now compounding`;
          } else {
            pot *= 0.88;
            msg = `${it.label}: −12% to inflation`;
          }
          msgT = 1;
        }
      }
      for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 30) items.splice(i, 1);
    },
    draw(x) {
      for (const it of items) pill(x, it.label, it.x, it.y, it.good ? C.good : C.muted, it.good ? C.goodD : C.ink, it.good ? C.onGood : C.surface, 12);
      x.fillStyle = C.priD;
      rr(x, px - 44, H - 46, 88, 34, 10);
      x.fillStyle = C.pri;
      rr(x, px - 44, H - 50, 88, 34, 10);
      text(x, 'PORTFOLIO', px, H - 33, C.onPri, 11);
      if (msgT) text(x, msg, W / 2, 44, msg.startsWith('+') ? C.goodD : C.bad, 13);
    },
    hud: () => [`${gbp(pot)} · ${assets} assets`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      left <= 0
        ? {
            score: Math.round(pot),
            good: pot >= 2500,
            text: `Your £1,000 became ${gbp(pot)}. Every productive asset you caught kept compounding for the rest of the run; idle cash only shrank.`,
          }
        : null,
  };
}

export const CapitalCatcher = (p: ArcadeProps) => (
  <Arcade {...p} name="Capital Catcher" how="Catch productive assets: each one adds money and keeps compounding. Dodge cash-decay traps that cost 12%. Grow £1,000 to £2,500 in 30 seconds to win." controls="Drag, or use the arrow keys, to move your portfolio." make={capitalCatcher} />
);

export const NOVICE_ARCADE = {
  'leak-dodger': LeakDodger,
  'budget-balancer': BudgetBalancer,
  'yield-stack': YieldStack,
  'shield-defense': ShieldDefense,
  'interest-crusher': InterestCrusher,
  'debt-runner': DebtRunner,
  'inflation-escape': InflationEscape,
  'capital-catcher': CapitalCatcher,
};
