import { gbp } from '../../lib/format';
import { Arcade, disc, pick, pill, rand, rr, steer, text, type ArcadeProps, type Game, type World } from './engine';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const shuffle = <T,>(a: T[]): T[] => a.map((v) => [Math.random(), v] as const).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

/* ---------------------------------------------------------------- 5.1 Share Slicers */

const COMPANIES = ['ACME PLC', 'Brightwave', 'Northgate', 'Kettle & Co', 'Orbital', 'Greenfield'];
const SLICES = [0.1, 0.2, 0.25, 0.4, 0.5, 0.75];

export function shareSlicers(w: World): Game {
  const { W, H, C, pace, input } = w;
  const TOTAL = 10;
  const cw = Math.min(240, W - 50);
  let n = 0;
  let good = 0;
  let cut = -1; // seconds left on the cut animation, -1 when the certificate is whole
  let cutAt = 0;
  let msg = '';
  let ok = false;
  let cur = W / 2;
  let cert = make();
  function make() {
    const price = pick([40, 80, 120, 200, 240, 400]);
    const f = pick(SLICES);
    return { x: (W - cw) / 2, y: 46, price, f, budget: price * f, name: pick(COMPANIES) };
  }
  function settle(hit: boolean, text: string) {
    n++;
    if (hit) good++;
    ok = hit;
    msg = text;
    cut = 0.9;
  }
  return {
    tick(dt) {
      if (cut >= 0) {
        cut -= dt;
        if (cut < 0 && n < TOTAL) {
          cert = make();
          cut = -1;
        }
        return;
      }
      cert.y += 34 * pace * dt;
      if (input.keys.ArrowLeft) cur -= 160 * dt;
      if (input.keys.ArrowRight) cur += 160 * dt;
      if (input.seen) cur = input.x;
      cur = clamp(cur, cert.x, cert.x + cw);
      const tap = input.taps.find((t) => t.y > cert.y - 50 && t.y < cert.y + 110);
      if (tap) cur = clamp(tap.x, cert.x, cert.x + cw);
      if (tap || input.hits.has(' ')) {
        cutAt = (cur - cert.x) / cw;
        const hit = Math.abs(cutAt - cert.f) <= 0.06;
        settle(hit, hit ? `✓ ${gbp(cert.budget)} buys ${cert.f} of a share` : `You cut ${cutAt.toFixed(2)}. ${gbp(cert.budget)} ÷ ${gbp(cert.price)} = ${cert.f}`);
      } else if (cert.y > H - 70) settle(false, `Missed. ${gbp(cert.budget)} ÷ ${gbp(cert.price)} = ${cert.f} of a share`);
    },
    draw(x) {
      const { y } = cert;
      const ch = 64;
      pill(x, `Spend ${gbp(cert.budget)}`, W / 2, y - 18, C.coin, C.coinD, C.onCoin, 13);
      const piece = (a: number, b: number, dx: number, own: boolean) => {
        x.fillStyle = C.line;
        rr(x, cert.x + a * cw + dx, y + 3, (b - a) * cw, ch, 10);
        x.fillStyle = own ? C.good : C.surface;
        rr(x, cert.x + a * cw + dx, y, (b - a) * cw, ch, 10);
      };
      if (cut >= 0) {
        const gap = (0.9 - cut) * 30;
        piece(0, cutAt, -gap, ok);
        piece(cutAt, 1, gap, false);
      } else piece(0, 1, 0, false);
      text(x, cert.name, W / 2, y + 22, C.ink, 14);
      text(x, `1 share · ${gbp(cert.price)}`, W / 2, y + 44, C.muted, 12);
      x.strokeStyle = C.muted;
      x.lineWidth = 1;
      for (const q of [0.25, 0.5, 0.75]) {
        x.beginPath();
        x.moveTo(cert.x + q * cw, y + ch - 8);
        x.lineTo(cert.x + q * cw, y + ch);
        x.stroke();
      }
      if (cut < 0) {
        x.strokeStyle = C.bad;
        x.lineWidth = 2;
        x.setLineDash([5, 4]);
        x.beginPath();
        x.moveTo(cur, y - 6);
        x.lineTo(cur, y + ch + 8);
        x.stroke();
        x.setLineDash([]);
        text(x, '✂', cur, y + ch + 20, C.bad, 16);
      } else text(x, msg, W / 2, H - 40, ok ? C.goodD : C.bad, 13);
      x.fillStyle = C.line;
      x.fillRect(0, H - 12, W, 2);
    },
    hud: () => [`Share ${Math.min(TOTAL, n + 1)} / ${TOTAL}`, `${good} sliced right`],
    over: () =>
      n >= TOTAL && cut < 0
        ? { score: good, good: good >= 7, text: `${good} of ${TOTAL} slices were the right fraction. With fractional shares, any amount buys its exact slice: money ÷ share price.` }
        : null,
  };
}

export const ShareSlicers = (p: ArcadeProps) => (
  <Arcade {...p} name="Share Slicers" how="Each falling certificate is one share. Cut off exactly the slice your money buys: £50 of a £200 share is 0.25. Get 7 of 10 within a whisker to win." controls="Move the scissors with your finger or the arrow keys. Tap the certificate, or press Space, to cut." make={shareSlicers} />
);

/* ---------------------------------------------------------------- 5.2 Yield Seesaw */

export function yieldSeesaw(w: World): Game {
  const { W, H, C, pace, input } = w;
  const COUPON = 4;
  let rate = 4;
  let goal = 4;
  let price = 100;
  let shock = 2;
  let t = 0;
  let level = 0;
  let news = '';
  const LEN = 35;
  const fair = () => (100 * COUPON) / rate;
  const tilt = () => clamp((price - fair()) / fair(), -1, 1);
  const toX = (p: number) => 30 + ((p - 40) / 160) * (W - 60);
  return {
    tick(dt) {
      t += dt;
      shock -= dt;
      if (shock <= 0) {
        shock = rand(2, 3.2) / pace;
        const old = goal;
        goal = clamp(+(goal + pick([-1, 1]) * rand(0.6, 1.6) * pace).toFixed(1), 2, 8);
        news = goal > old ? `Rates rise to ${goal}%` : `Rates cut to ${goal}%`;
      }
      rate += (goal - rate) * Math.min(1, dt * 3);
      if (input.keys.ArrowLeft) price -= 60 * dt;
      if (input.keys.ArrowRight) price += 60 * dt;
      if (input.seen && input.down) price = 40 + ((input.x - 30) / (W - 60)) * 160;
      price = clamp(price, 40, 200);
      if (Math.abs(tilt()) < 0.08) level += dt;
    },
    draw(x) {
      const px = W / 2;
      const py = H / 2 + 10;
      const a = tilt() * 0.4;
      const half = W / 2 - 40;
      x.fillStyle = C.priD;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px - 24, py + 44);
      x.lineTo(px + 24, py + 44);
      x.fill();
      x.save();
      x.translate(px, py);
      x.rotate(a);
      x.fillStyle = Math.abs(tilt()) < 0.08 ? C.good : C.coin;
      rr(x, -half, -7, half * 2, 14, 7);
      x.restore();
      const end = (side: -1 | 1, label: string, bg: string, deep: string, fg: string) => pill(x, label, px + side * half * Math.cos(a), py + side * half * Math.sin(a) - 26, bg, deep, fg, 13);
      end(-1, `Rate ${rate.toFixed(1)}%`, C.pri, C.priD, C.onPri);
      end(1, `Price £${price.toFixed(0)}`, C.coin, C.coinD, C.onCoin);
      text(x, news, W / 2, 48, C.ink, 14);
      text(x, `£100 bond, ${COUPON}% coupon`, W / 2, 70, C.muted, 12);
      const ty = H - 40;
      x.fillStyle = C.line;
      rr(x, 30, ty - 4, W - 60, 8, 4);
      disc(x, toX(price), ty, 13, C.coin, C.coinD);
      text(x, '£40', 30, ty + 22, C.muted, 11, 'left');
      text(x, 'drag the bond price', W / 2, ty + 22, C.muted, 11);
      text(x, '£200', W - 30, ty + 22, C.muted, 11, 'right');
    },
    hud: () => [`Level ${t ? Math.round((level / t) * 100) : 100}% of the time`, `${Math.max(0, Math.ceil(LEN - t))}s`],
    over: () =>
      t >= LEN
        ? {
            score: Math.round((level / t) * 100),
            good: level / t >= 0.55,
            text: `You kept the beam level ${Math.round((level / t) * 100)}% of the time. When rates went up you had to drop the price, and when they fell the price rose: bonds and rates sit on opposite ends of the seesaw.`,
          }
        : null,
  };
}

export const YieldSeesaw = (p: ArcadeProps) => (
  <Arcade {...p} name="Yield Seesaw" how="Interest rates jump about. Slide the bond’s price so its 4% coupon pays the same yield as the market, which keeps the beam level. Stay level more than half the time to win." controls="Drag along the bottom track, or use the arrow keys, to set the price." make={yieldSeesaw} />
);

/* ---------------------------------------------------------------- 6.1 Basket Builder */

const SECTORS: [string, string[]][] = [
  ['Tech', ['Chipco', 'Cloudly', 'Pixel']],
  ['Banks', ['Lendwell', 'Vaultex']],
  ['Energy', ['Windgrid', 'Petrolux']],
  ['Health', ['Medica', 'Curewell']],
  ['Retail', ['Shopfast', 'Basketry']],
  ['Mining', ['Orelia', 'Copperton']],
];

export function basketBuilder(w: World): Game {
  const { W, H, C, pace } = w;
  let px = W / 2;
  let lives = 3;
  let left = 30;
  let spawn = 0.3;
  let flash = 0;
  const got = SECTORS.map(() => 0);
  const items: { x: number; y: number; v: number; s: number; name: string }[] = []; // s = -1 for a bomb
  const held = () => got.reduce((a, b) => a + b, 0);
  const spread = () => got.filter(Boolean).length;
  return {
    tick(dt) {
      left -= dt;
      spawn -= dt;
      flash = Math.max(0, flash - dt);
      px = steer(w, px, 40, dt);
      if (spawn <= 0) {
        spawn = rand(0.4, 0.65) / pace;
        const bomb = Math.random() < 0.3;
        const s = Math.floor(Math.random() * SECTORS.length);
        items.push({ x: rand(30, W - 30), y: -20, v: rand(130, 200) * pace, s: bomb ? -1 : s, name: bomb ? 'ALL-IN MEME' : pick(SECTORS[s][1]) });
      }
      for (const it of items) {
        it.y += it.v * dt;
        if (it.y > H - 60 && it.y < H - 20 && Math.abs(it.x - px) < 48) {
          it.y = H + 99;
          if (it.s < 0) {
            lives--;
            flash = 0.35;
          } else got[it.s]++;
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
      const bw = (W - 20) / SECTORS.length;
      SECTORS.forEach(([name], k) => {
        x.fillStyle = got[k] ? C.good : C.line;
        rr(x, 10 + k * bw + 2, 30, bw - 4, 22, 7);
        text(x, `${name} ${got[k] || ''}`, 10 + k * bw + bw / 2, 41, got[k] ? C.onGood : C.muted, 10);
      });
      for (const it of items) {
        if (it.s < 0) {
          disc(x, it.x, it.y, 17, C.bad, C.badD);
          x.strokeStyle = C.ink;
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(it.x + 8, it.y - 14);
          x.lineTo(it.x + 14, it.y - 24);
          x.stroke();
          text(x, '±60%', it.x, it.y + 1, C.onBad, 10);
          text(x, it.name, it.x, it.y + 28, C.bad, 10);
        } else pill(x, `${it.name} · ${SECTORS[it.s][0]}`, it.x, it.y, C.surface, C.line, C.ink, 11);
      }
      x.fillStyle = C.priD;
      rr(x, px - 44, H - 44, 88, 32, 12);
      x.fillStyle = C.pri;
      rr(x, px - 44, H - 48, 88, 32, 12);
      text(x, `FUND · ${held()}`, px, H - 32, C.onPri, 11);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  ${spread()}/6 sectors`, `${Math.max(0, Math.ceil(left))}s`],
    over: () =>
      lives <= 0 || left <= 0
        ? {
            score: held(),
            good: lives > 0 && spread() === 6 && held() >= 12,
            text:
              lives <= 0
                ? 'Three all-in bets blew up. Putting everything in one stock is the opposite of an index fund.'
                : `Your fund holds ${held()} companies across ${spread()} of 6 sectors. An index fund does this for you: hundreds of companies in one purchase.`,
          }
        : null,
  };
}

export const BasketBuilder = (p: ArcadeProps) => (
  <Arcade {...p} name="Basket Builder" how="Build your own index fund. Catch companies from all 6 sectors and dodge all-in single-stock bombs. Hold 12+ companies across every sector in 30 seconds to win." controls="Drag, or use the arrow keys, to move your fund." make={basketBuilder} />
);

/* ---------------------------------------------------------------- 6.2 Fee Eater */

const MAZE = [
  '#############',
  '#o....#....o#',
  '#.##.###.##.#',
  '#...........#',
  '#.#.##.##.#.#',
  '#.#...P...#.#',
  '#.#.##.##.#.#',
  '#...........#',
  '#.##.###.##.#',
  '#o....#....o#',
  '#############',
];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
type Mover = { c: number; r: number; dc: number; dr: number; t: number; home: [number, number] };

export function feeEater(w: World): Game {
  const { W, H, C, pace, input } = w;
  const COLS = MAZE[0].length;
  const ROWS = MAZE.length;
  const s = Math.floor(Math.min(W / COLS, (H - 30) / ROWS));
  const ox = (W - COLS * s) / 2;
  const oy = 28 + (H - 28 - ROWS * s) / 2;
  const open = (c: number, r: number) => MAZE[r]?.[c] !== undefined && MAZE[r][c] !== '#';
  const dots = new Map<string, 'dot' | 'tracker'>();
  let me: Mover = { c: 6, r: 5, dc: 0, dr: 0, t: 0, home: [6, 5] };
  MAZE.forEach((row, r) => [...row].forEach((ch, c) => (ch === '.' ? dots.set(`${c},${r}`, 'dot') : ch === 'o' && dots.set(`${c},${r}`, 'tracker'))));
  const homes: [number, number][] = [[1, 3], [11, 3], [4, 9]];
  const ghosts: Mover[] = homes.slice(0, pace < 1 ? 2 : 3).map(([c, r]) => ({ c, r, dc: 0, dr: 0, t: 0, home: [c, r] }));
  let want: [number, number] = [0, 0];
  let lives = 3;
  let pot = 10000;
  let cheap = 0;
  let safe = 0;
  let wait = 2; // ghosts hold still at the start and after each hit
  let left = 80;
  let msg = '';
  let msgT = 0;
  const pos = (m: Mover) => [m.c + m.dc * m.t, m.r + m.dr * m.t];
  const reset = () => {
    me = { ...me, c: 6, r: 5, dc: 0, dr: 0, t: 0 };
    for (const g of ghosts) Object.assign(g, { c: g.home[0], r: g.home[1], dc: 0, dr: 0, t: 0 });
    safe = 1.5;
    wait = 1.5;
  };
  /** Advance a mover; at each cell it asks `choose` for its next direction. */
  const move = (m: Mover, speed: number, dt: number, choose: (m: Mover) => [number, number]) => {
    m.t += speed * dt;
    if (m.dc === 0 && m.dr === 0) m.t = 1;
    if (m.t >= 1) {
      m.c += m.dc;
      m.r += m.dr;
      m.t = 0;
      [m.dc, m.dr] = choose(m);
      if (!open(m.c + m.dc, m.r + m.dr)) [m.dc, m.dr] = [0, 0];
    }
  };
  return {
    tick(dt) {
      left -= dt;
      cheap = Math.max(0, cheap - dt);
      safe = Math.max(0, safe - dt);
      wait = Math.max(0, wait - dt);
      msgT = Math.max(0, msgT - dt);
      const k = input.keys;
      if (k.ArrowLeft) want = [-1, 0];
      else if (k.ArrowRight) want = [1, 0];
      else if (k.ArrowUp) want = [0, -1];
      else if (k.ArrowDown) want = [0, 1];
      for (const t of input.taps) {
        const [mx, my] = pos(me);
        const dx = t.x - (ox + (mx + 0.5) * s);
        const dy = t.y - (oy + (my + 0.5) * s);
        want = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      }
      // turn back at once instead of waiting for the next cell
      if (want[0] === -me.dc && want[1] === -me.dr && (me.dc || me.dr)) {
        me.c += me.dc;
        me.r += me.dr;
        me.t = 1 - me.t;
        [me.dc, me.dr] = want;
      }
      move(me, 5.2, dt, (m) => (open(m.c + want[0], m.r + want[1]) ? want : [m.dc, m.dr]));
      const key = `${me.c},${me.r}`;
      const d = dots.get(key);
      if (d) {
        dots.delete(key);
        if (d === 'dot') pot += 100;
        else {
          cheap = 5;
          msg = 'Low-fee tracker! Fees can’t touch you.';
          msgT = 1.5;
        }
      }
      for (const g of ghosts) {
        if (!wait) move(g, (cheap ? 2.4 : 3.3) * pace, dt, (m) => {
          const opts = DIRS.filter(([a, b]) => open(m.c + a, m.r + b) && !(a === -m.dc && b === -m.dr && (m.dc || m.dr)));
          const all = opts.length ? opts : DIRS.filter(([a, b]) => open(m.c + a, m.r + b));
          if (Math.random() < 0.35) return [...pick(all)] as [number, number];
          const dist = ([a, b]: readonly [number, number]) => Math.hypot(m.c + a - me.c, m.r + b - me.r) * (cheap ? -1 : 1);
          return [...all.reduce((p, q) => (dist(q) < dist(p) ? q : p))] as [number, number];
        });
        const [gx, gy] = pos(g);
        const [mx, my] = pos(me);
        if (Math.hypot(gx - mx, gy - my) < 0.6) {
          if (cheap) {
            Object.assign(g, { c: g.home[0], r: g.home[1], dc: 0, dr: 0, t: 0 });
            pot += 300;
            msg = 'Fee ghost sent packing: +£300';
            msgT = 1;
          } else if (!safe) {
            const fee = Math.round(pot * 0.15);
            pot -= fee;
            lives--;
            msg = `A 1.5% fund ate ${gbp(fee)} over the years`;
            msgT = 1.6;
            reset();
          }
        }
      }
    },
    draw(x) {
      MAZE.forEach((row, r) =>
        [...row].forEach((ch, c) => {
          if (ch !== '#') return;
          x.fillStyle = C.pri;
          x.globalAlpha = 0.35;
          x.fillRect(ox + c * s, oy + r * s, s, s);
          x.globalAlpha = 1;
        }),
      );
      for (const [k, d] of dots) {
        const [c, r] = k.split(',').map(Number);
        if (d === 'dot') disc(x, ox + (c + 0.5) * s, oy + (r + 0.5) * s, s * 0.12, C.coin, C.coinD);
        else disc(x, ox + (c + 0.5) * s, oy + (r + 0.5) * s, s * 0.3, C.good, C.goodD);
      }
      for (const g of ghosts) {
        const [gx, gy] = pos(g);
        const cx = ox + (gx + 0.5) * s;
        const cy = oy + (gy + 0.5) * s;
        const blink = cheap && cheap < 1.2 && Math.floor(cheap * 6) % 2;
        x.fillStyle = cheap && !blink ? C.good : C.bad;
        x.beginPath();
        x.arc(cx, cy - s * 0.05, s * 0.42, Math.PI, 0);
        x.lineTo(cx + s * 0.42, cy + s * 0.4);
        x.lineTo(cx, cy + s * 0.25);
        x.lineTo(cx - s * 0.42, cy + s * 0.4);
        x.fill();
        text(x, cheap ? '0.1%' : '1.5%', cx, cy, cheap && !blink ? C.onGood : C.onBad, Math.max(8, s * 0.28));
      }
      const [mx, my] = pos(me);
      if (!safe || Math.floor(safe * 8) % 2) {
        disc(x, ox + (mx + 0.5) * s, oy + (my + 0.5) * s, s * 0.4, C.coin, C.coinD);
        text(x, '£', ox + (mx + 0.5) * s, oy + (my + 0.5) * s + 1, C.onCoin, s * 0.5);
      }
      if (msgT) pill(x, msg, W / 2, H - 14, C.surface, C.line, C.ink, 11);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  ${gbp(pot)}`, `${Math.max(0, Math.ceil(left))}s`],
    over: () => {
      const cleared = ![...dots.values()].includes('dot');
      if (!cleared && lives > 0 && left > 0) return null;
      return {
        score: pot,
        good: cleared && lives > 0,
        text: cleared
          ? `You grew your pot to ${gbp(pot)} while dodging high-fee funds. Each fee hit took 15% of the pot, roughly what a 1.5% fee costs over ten years.`
          : `Your pot ended at ${gbp(pot)}. High fees chase your money every single year, so pick low-cost trackers to keep them off you.`,
      };
    },
  };
}

export const FeeEater = (p: ArcadeProps) => (
  <Arcade {...p} name="Fee Eater" how="Steer your £ through the maze to collect growth. High-fee 1.5% ghosts each take a bite of your pot. Grab a green low-fee tracker to send them running. Clear every coin to win." controls="Arrow keys, or tap the side of the maze you want to head towards." make={feeEater} />
);

/* ---------------------------------------------------------------- 7.1 Portfolio Mix Master */

const PEOPLE: [string, number, boolean][] = [
  ['Mia, 22, saving for retirement, calm', 22, true],
  ['Dev, 35, hates seeing falls', 35, false],
  ['Ana, 50, steady nerves', 50, true],
  ['Sam, 64, retiring soon, jumpy', 64, false],
  ['Leo, 28, panics in a crash', 28, false],
  ['Kim, 45, calm investor', 45, true],
  ['Raj, 31, long horizon, calm', 31, true],
  ['Joy, 58, nervous about losses', 58, false],
];

export function mixMaster(w: World): Game {
  const { W, H, C, pace, input } = w;
  const order = shuffle(PEOPLE);
  const LIMIT = 7 / pace;
  let k = 0;
  let v = 50;
  let left = LIMIT;
  let t = 0;
  let good = 0;
  let res = -1; // seconds to show the last result
  let last = '';
  let lastOk = false;
  const target = (p: [string, number, boolean]) => clamp(Math.round((100 - p[1] + (p[2] ? 10 : -10)) / 5) * 5, 10, 95);
  const wob = () => Math.sin(t * 3.1) * 4 * pace + Math.sin(t * 7.3) * 2 * pace;
  const tx = (pct: number) => 30 + (pct / 100) * (W - 60);
  const lock = () => {
    const got = clamp(Math.round(v + wob()), 0, 100);
    const want = target(order[k]);
    const err = Math.abs(got - want);
    lastOk = err <= 10;
    if (lastOk) good++;
    last = `${got}% shares · target ${want}%${err <= 5 ? ' · spot on' : lastOk ? ' · close enough' : ''}`;
    res = 1.4;
    k++;
    left = LIMIT;
    v = 50;
  };
  return {
    tick(dt) {
      t += dt;
      if (res > 0) {
        res -= dt;
        return;
      }
      if (k >= order.length) return;
      left -= dt;
      if (input.keys.ArrowLeft) v -= 40 * dt;
      if (input.keys.ArrowRight) v += 40 * dt;
      const lockTap = input.taps.some((p) => p.y > H - 66);
      if (input.down && input.y < H - 66 && input.y > H / 2 - 30) v = ((input.x - 30) / (W - 60)) * 100;
      v = clamp(v, 0, 100);
      if (lockTap || input.hits.has(' ') || left <= 0) lock();
    },
    draw(x) {
      text(x, 'Shares ≈ 100 − age · calm +10 · jumpy −10', W / 2, 40, C.muted, 11);
      if (res > 0) {
        text(x, last, W / 2, H / 2 - 20, lastOk ? C.goodD : C.bad, 15);
        return;
      }
      if (k >= order.length) return;
      const p = order[k];
      pill(x, p[0], W / 2, 80, C.surface, C.line, C.ink, 12);
      const shown = clamp(v + wob(), 0, 100);
      const y = H / 2 + 10;
      x.fillStyle = C.coin;
      rr(x, 30, y - 16, W - 60, 32, 10);
      x.fillStyle = C.pri;
      rr(x, 30, y - 16, ((W - 60) * shown) / 100, 32, 10);
      text(x, `Shares ${Math.round(shown)}%`, 40, y - 30, C.pri, 12, 'left');
      text(x, `Bonds ${100 - Math.round(shown)}%`, W - 40, y - 30, C.coinD, 12, 'right');
      disc(x, tx(shown), y, 14, C.surface, C.line);
      x.fillStyle = C.line;
      x.fillRect(30, y + 40, ((W - 60) * left) / LIMIT, 5);
      text(x, 'Market wobble moves the dial. Drag to steer.', W / 2, y + 62, C.muted, 11);
      x.fillStyle = C.goodD;
      rr(x, 30, H - 58 + 3, W - 60, 42, 12);
      x.fillStyle = C.good;
      rr(x, 30, H - 58, W - 60, 42, 12);
      text(x, 'LOCK THIS MIX', W / 2, H - 37, C.onGood, 14);
    },
    hud: () => [`Investor ${Math.min(order.length, k + (res > 0 ? 0 : 1))} / ${order.length}`, `${good} matched`],
    over: () =>
      k >= order.length && res <= 0
        ? { score: good, good: good >= 6, text: `${good} of ${order.length} mixes matched their investor. Younger, calmer investors can hold more shares; people near their goal or who panic in falls need more bonds.` }
        : null,
  };
}

export const MixMaster = (p: ArcadeProps) => (
  <Arcade {...p} name="Portfolio Mix Master" how="Eight investors, one each round. Set their shares/bonds mix from age and nerves, while the market wobbles the dial, then lock it. Get 6 within 10% to win." controls="Drag on the bar, or use the arrow keys. Tap Lock, or press Space." make={mixMaster} />
);

/* ---------------------------------------------------------------- 7.2 Tax Shield Maze */

type Pot = 'isa' | 'pension' | 'taxable';
const STREAMS: [string, boolean][] = [
  ['Retirement', false], ['Retirement', false], ['Long-term', false], ['House in 3 yrs', true], ['Wedding fund', true], ['Car in 2 yrs', true],
];

export function taxMaze(w: World): Game {
  const { W, H, C, pace, input } = w;
  const TOTAL = 12;
  const A = { x: W / 2, y: 110 };
  const B = { x: (W * 2) / 3, y: 190 };
  const bin: Record<Pot, { x: number; name: string }> = { isa: { x: W / 6, name: 'ISA' }, pension: { x: W / 2, name: 'Pension' }, taxable: { x: (W * 5) / 6, name: 'Taxable' } };
  const floor = H - 70;
  let swA: 'L' | 'R' = 'L';
  let swB: 'L' | 'R' = 'L';
  let isa = 0;
  let saved = 0;
  let good = 0;
  let lives = 3;
  let sent = 0;
  let done = 0;
  let spawn = 0.5;
  let msg = '';
  let msgOk = true;
  let msgT = 0;
  const coins: { x: number; y: number; path: { x: number; y: number }[]; amt: number; label: string; soon: boolean; to?: Pot }[] = [];
  const land = (c: (typeof coins)[number]) => {
    done++;
    let ok = false;
    if (c.to === 'pension' && c.soon) {
      lives--;
      msg = `${c.label} is locked in a pension until 57!`;
    } else if (c.to === 'pension') {
      ok = true;
      saved += c.amt * 0.25;
      msg = `+25% tax relief on ${gbp(c.amt)}`;
    } else if (c.to === 'isa' && isa + c.amt <= 20000) {
      ok = true;
      isa += c.amt;
      saved += c.amt * 0.2;
      msg = `Tax-free in the ISA (${gbp(isa)} of £20k)`;
    } else if (c.to === 'isa') {
      msg = 'ISA is full: only £20k a year fits';
    } else {
      ok = c.soon && isa + c.amt > 20000;
      msg = ok ? 'ISA full, so taxable is the right call' : `Taxed! ${gbp(c.amt * 0.2)} lost to tax`;
    }
    if (ok) good++;
    msgOk = ok;
    msgT = 1.6;
  };
  return {
    tick(dt) {
      msgT = Math.max(0, msgT - dt);
      for (const t of input.taps) {
        if (Math.hypot(t.x - A.x, t.y - A.y) < 44) swA = swA === 'L' ? 'R' : 'L';
        else if (Math.hypot(t.x - B.x, t.y - B.y) < 44) swB = swB === 'L' ? 'R' : 'L';
      }
      if (input.hits.has('ArrowLeft')) swA = swA === 'L' ? 'R' : 'L';
      if (input.hits.has('ArrowRight')) swB = swB === 'L' ? 'R' : 'L';
      spawn -= dt;
      if (spawn <= 0 && sent < TOTAL) {
        spawn = rand(2, 2.6) / pace;
        sent++;
        const [label, soon] = pick(STREAMS);
        coins.push({ x: A.x, y: 58, path: [A], amt: Math.round(rand(2, 5)) * 1000, label, soon });
      }
      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        const p = c.path[0];
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        const step = 95 * pace * dt;
        if (d > step) {
          c.x += ((p.x - c.x) / d) * step;
          c.y += ((p.y - c.y) / d) * step;
          continue;
        }
        c.x = p.x;
        c.y = p.y;
        c.path.shift();
        if (p === A) {
          c.to = swA === 'L' ? 'isa' : undefined;
          c.path.push(swA === 'L' ? { x: bin.isa.x, y: floor } : B);
        } else if (p === B) {
          c.to = swB === 'L' ? 'pension' : 'taxable';
          c.path.push({ x: bin[c.to].x, y: floor });
        } else if (!c.path.length) {
          land(c);
          coins.splice(i, 1);
        }
      }
    },
    draw(x) {
      const seg = (a: { x: number; y: number }, b: { x: number; y: number }, on: boolean) => {
        x.strokeStyle = on ? C.pri : C.line;
        x.lineWidth = on ? 6 : 4;
        x.lineCap = 'round';
        x.beginPath();
        x.moveTo(a.x, a.y);
        x.lineTo(b.x, b.y);
        x.stroke();
      };
      seg({ x: A.x, y: 58 }, A, true);
      seg(A, { x: bin.isa.x, y: floor }, swA === 'L');
      seg(A, B, swA === 'R');
      seg(B, { x: bin.pension.x, y: floor }, swA === 'R' && swB === 'L');
      seg(B, { x: bin.taxable.x, y: floor }, swA === 'R' && swB === 'R');
      for (const [sw, at, key] of [[swA, A, '←'], [swB, B, '→']] as const) {
        disc(x, at.x, at.y, 20, C.coin, C.coinD);
        text(x, sw === 'L' ? '↙' : '↘', at.x, at.y + 1, C.onCoin, 18);
        text(x, `tap or ${key}`, at.x + 34, at.y, C.muted, 10, 'left');
      }
      (Object.keys(bin) as Pot[]).forEach((k) => {
        const b = bin[k];
        x.fillStyle = k === 'taxable' ? C.bad : k === 'isa' ? C.good : C.pri;
        x.globalAlpha = 0.2;
        rr(x, b.x - W / 6 + 6, floor + 6, W / 3 - 12, 58, 12);
        x.globalAlpha = 1;
        text(x, b.name, b.x, floor + 24, C.ink, 13);
        text(x, k === 'isa' ? `${gbp(isa)} / £20k` : k === 'pension' ? 'locked till 57' : '20% tax', b.x, floor + 44, C.muted, 10);
      });
      for (const c of coins) pill(x, `${gbp(c.amt)} ${c.soon ? '⏳ ' : ''}${c.label}`, c.x, c.y, c.soon ? C.coin : C.surface, c.soon ? C.coinD : C.line, c.soon ? C.onCoin : C.ink, 10);
      if (msgT) text(x, msg, W / 2, 42, msgOk ? C.goodD : C.bad, 12);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  Saved ${gbp(saved)}`, `Stream ${Math.min(TOTAL, done + 1)} / ${TOTAL}`],
    over: () =>
      lives <= 0 || done >= TOTAL
        ? {
            score: Math.round(saved),
            good: lives > 0 && good >= 9,
            text:
              lives <= 0
                ? 'Too much short-term money got locked in a pension. Pensions are best for money you will not touch until later life.'
                : `${good} of ${TOTAL} streams found the best shelter, saving ${gbp(saved)} in tax. Long-term money loves a pension’s relief; money you need sooner belongs in your ISA.`,
          }
        : null,
  };
}

export const TaxMaze = (p: ArcadeProps) => (
  <Arcade {...p} name="Tax Shield Maze" how="Income streams flow down the pipes. Flip the two switches to send long-term money to the pension, money you need sooner (⏳) to the ISA, and only overflow to taxable. Route 9 of 12 well to win." controls="Tap a switch, or press ← for the top switch and → for the lower one." make={taxMaze} />
);

/* ---------------------------------------------------------------- 8.1 DCA Auto-Pilot */

export function dcaAutopilot(w: World): Game {
  const { W, H, C, pace, input } = w;
  const MONTHS = 12;
  const PER = 30;
  const MONTH_S = 2.4 / pace;
  const prices: number[] = [];
  let p = 10;
  let trend = 0;
  for (let i = 0; i < MONTHS * PER; i++) {
    if (i % 45 === 0) trend = rand(-0.006, 0.007);
    p = clamp(p * (1 + trend + rand(-0.02, 0.02)), 4, 25);
    prices.push(p);
  }
  const buys: { i: number; p: number; auto: boolean }[] = [];
  let t = 0;
  let month = 0;
  let bought = false;
  const idx = () => Math.min(prices.length - 1, Math.floor((t / MONTH_S) * PER));
  const lo = Math.min(...prices) * 0.9;
  const hi = Math.max(...prices) * 1.05;
  const top = 40;
  const bot = H - 80;
  const px = (i: number) => 20 + (i / (prices.length - 1)) * (W - 40);
  const py = (v: number) => bot - ((v - lo) / (hi - lo)) * (bot - top);
  const avg = (ps: number[]) => ps.length / ps.reduce((a, b) => a + 1 / b, 0); // £100 each time: harmonic mean
  const pilot = avg(Array.from({ length: MONTHS }, (_, m) => prices[m * PER]));
  return {
    tick(dt) {
      if (month >= MONTHS) return;
      t += dt;
      const i = idx();
      if (!bought && (input.taps.length || input.hits.has(' '))) {
        buys.push({ i, p: prices[i], auto: false });
        bought = true;
      }
      const m = Math.floor(t / MONTH_S);
      if (m > month) {
        if (!bought) {
          const last = month * PER + PER - 1;
          buys.push({ i: last, p: prices[last], auto: true });
        }
        month = m;
        bought = false;
      }
    },
    draw(x) {
      const i = idx();
      for (let m = 0; m < MONTHS; m++) {
        x.fillStyle = m === month ? C.coin : m % 2 ? C.line : C.soft;
        x.globalAlpha = m === month ? 0.25 : 0.5;
        x.fillRect(px(m * PER), top, px(PER) - px(0), bot - top);
        x.globalAlpha = 1;
      }
      x.strokeStyle = C.pri;
      x.lineWidth = 2.5;
      x.beginPath();
      for (let k = 0; k <= i; k++) (k ? x.lineTo : x.moveTo).call(x, px(k), py(prices[k]));
      x.stroke();
      for (const b of buys) disc(x, px(b.i), py(b.p), 6, b.auto ? C.muted : C.coin, b.auto ? C.line : C.coinD);
      if (month < MONTHS) {
        disc(x, px(i), py(prices[i]), 5, C.pri, C.priD);
        pill(x, `£${prices[i].toFixed(2)}`, clamp(px(i), 40, W - 40), py(prices[i]) - 22, C.surface, C.line, C.ink, 11);
      }
      const mine = buys.length ? avg(buys.map((b) => b.p)) : 0;
      text(x, `Units ${buys.reduce((a, b) => a + 100 / b.p, 0).toFixed(1)}`, 20, H - 56, C.ink, 13, 'left');
      text(x, `Your avg £${mine ? mine.toFixed(2) : '—'}`, W - 20, H - 56, C.ink, 13, 'right');
      text(x, bought ? 'Bought this month ✓' : month < MONTHS ? 'Tap to buy £100 · else auto-buy at month end' : '', W / 2, H - 28, bought ? C.goodD : C.muted, 12);
    },
    hud: () => [`Month ${Math.min(MONTHS, month + 1)} / ${MONTHS}`, `£${buys.length * 100} invested`],
    over: () => {
      if (month < MONTHS) return null;
      const mine = avg(buys.map((b) => b.p));
      const simple = prices.reduce((a, b) => a + b, 0) / prices.length;
      return {
        score: Math.round(mine * 100),
        good: mine <= pilot * 1.01,
        text: `Your average cost: £${mine.toFixed(2)}. Buying on the 1st every month: £${pilot.toFixed(2)}. Average price over the year: £${simple.toFixed(2)}. A fixed £100 buys more units when prices dip, so even the auto-pilot usually beats the average price without any timing.`,
      };
    },
  };
}

export const DcaAutopilot = (p: ArcadeProps) => (
  <Arcade {...p} name="DCA Auto-Pilot" how="A year of prices, one month at a time. You invest £100 every month: tap to pick your moment, or the auto-pilot buys at month end. Match or beat the buy-on-the-1st average cost to win." controls="Tap the chart, or press Space, to buy this month." make={dcaAutopilot} />
);

/* ---------------------------------------------------------------- 8.2 Target Rebalancer */

const SPIKES: [string, number][] = [['Tech rally', 0.14], ['Earnings boom', 0.1], ['Market crash', -0.16], ['Rate scare', -0.1], ['Meme mania', 0.18], ['Sell-off', -0.12]];

export function targetRebalancer(w: World): Game {
  const { W, H, C, pace, input } = w;
  const LEN = 32;
  let sh = 7000;
  let bd = 3000;
  let t = 0;
  let inBand = 0;
  let fees = 0;
  let trades = 0;
  let next = 1.5;
  let news = '';
  let newsT = 0;
  const hist: number[] = [];
  const pct = () => (sh / (sh + bd)) * 100;
  const trade = (dir: 1 | -1) => {
    const amt = (sh + bd) * 0.04 * dir;
    sh += amt;
    bd -= amt;
    fees += 5;
    trades++;
  };
  const bx = (v: number) => 20 + ((v - 40) / 60) * (W - 40);
  return {
    tick(dt) {
      t += dt;
      newsT = Math.max(0, newsT - dt);
      next -= dt;
      sh *= 1 + rand(-0.02, 0.025) * dt;
      bd *= 1 + 0.003 * dt;
      if (next <= 0) {
        next = rand(1.6, 2.8) / pace;
        const [name, move] = pick(SPIKES);
        const m = move * rand(0.8, 1.2) * Math.min(1.5, pace);
        sh *= 1 + m;
        news = `${name}: shares ${m > 0 ? '+' : ''}${Math.round(m * 100)}%`;
        newsT = 1.5;
      }
      for (const p of input.taps) trade(p.x < W / 2 ? -1 : 1);
      if (input.hits.has('ArrowLeft')) trade(-1);
      if (input.hits.has('ArrowRight')) trade(1);
      if (Math.abs(pct() - 70) <= 5) inBand += dt;
      hist.push(pct());
      if (hist.length > 240) hist.shift();
    },
    draw(x) {
      const top = 50;
      const bot = H - 130;
      const yy = (v: number) => bot - ((clamp(v, 40, 100) - 40) / 60) * (bot - top);
      x.fillStyle = C.good;
      x.globalAlpha = 0.18;
      x.fillRect(10, yy(75), W - 20, yy(65) - yy(75));
      x.globalAlpha = 1;
      x.strokeStyle = C.goodD;
      x.setLineDash([4, 4]);
      x.beginPath();
      x.moveTo(10, yy(70));
      x.lineTo(W - 10, yy(70));
      x.stroke();
      x.setLineDash([]);
      x.strokeStyle = C.pri;
      x.lineWidth = 2.5;
      x.beginPath();
      hist.forEach((v, k) => (k ? x.lineTo : x.moveTo).call(x, 10 + (k / 239) * (W - 20), yy(v)));
      x.stroke();
      text(x, 'target 70% ±5', W - 14, yy(76) - 8, C.goodD, 10, 'right');
      if (newsT) text(x, news, W / 2, top - 8, news.includes('+') ? C.goodD : C.bad, 13);
      const v = pct();
      const by = H - 108;
      x.fillStyle = C.line;
      rr(x, 20, by, W - 40, 14, 7);
      x.fillStyle = C.good;
      x.globalAlpha = 0.5;
      x.fillRect(bx(65), by, bx(75) - bx(65), 14);
      x.globalAlpha = 1;
      disc(x, bx(clamp(v, 40, 100)), by + 7, 11, Math.abs(v - 70) <= 5 ? C.good : C.bad, Math.abs(v - 70) <= 5 ? C.goodD : C.badD);
      text(x, `Shares ${Math.round(v)}% · Bonds ${100 - Math.round(v)}%`, W / 2, by - 12, C.ink, 12);
      const btn = (x0: number, label: string, sub: string, bg: string, deep: string, fg: string) => {
        x.fillStyle = deep;
        rr(x, x0, H - 64 + 3, W / 2 - 18, 50, 12);
        x.fillStyle = bg;
        rr(x, x0, H - 64, W / 2 - 18, 50, 12);
        text(x, label, x0 + (W / 2 - 18) / 2, H - 46, fg, 13);
        text(x, sub, x0 + (W / 2 - 18) / 2, H - 28, fg, 10);
      };
      btn(12, '◀ Sell shares', 'into bonds', C.coin, C.coinD, C.onCoin);
      btn(W / 2 + 6, 'Buy shares ▶', 'from bonds', C.pri, C.priD, C.onPri);
    },
    hud: () => [`On target ${t ? Math.round((inBand / t) * 100) : 100}% · fees £${fees}`, `${Math.max(0, Math.ceil(LEN - t))}s`],
    over: () =>
      t >= LEN
        ? {
            score: Math.round((inBand / t) * 100),
            good: inBand / t >= 0.65,
            text: `You held your 70/30 target ${Math.round((inBand / t) * 100)}% of the time with ${trades} trades (£${fees} in fees). Rebalancing keeps risk where you planned it. Trading on every twitch just piles up costs.`,
          }
        : null,
  };
}

export const TargetRebalancer = (p: ArcadeProps) => (
  <Arcade {...p} name="Target Rebalancer" how="Market spikes push your 70/30 mix around. Trade 4% at a time to stay inside the green band, but every trade costs £5. Stay on target 65% of the time to win." controls="Tap the left or right button, or use the arrow keys." make={targetRebalancer} />
);

export const INTERMEDIATE_ARCADE = {
  'share-slicers': ShareSlicers,
  'yield-seesaw': YieldSeesaw,
  'basket-builder': BasketBuilder,
  'fee-eater': FeeEater,
  'mix-master': MixMaster,
  'tax-maze': TaxMaze,
  'dca-autopilot': DcaAutopilot,
  'target-rebalancer': TargetRebalancer,
};
