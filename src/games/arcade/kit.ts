import { FONT, pill, rand, rr, steer, text, type Game, type World } from './engine';

/**
 * Three reusable game shapes for the Advanced and Investor tiers. Each game supplies only its content.
 * shortcut: shared shapes keep 16 games small; give a game its own maker if it needs a mechanic these lack.
 */

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ---------------------------------------------------------------- Catcher */

export interface Drop {
  label: string;
  good: boolean;
  /** Shown after catching a bad one. */
  why: string;
}

/** Steer a tray along the bottom. Catch the good drops, dodge the bad ones. */
export function catcher(w: World, cfg: { tray: string; next: () => Drop; goal: number; secs: number; win: string; lose: string }): Game {
  const { W, H, C, pace } = w;
  const items: (Drop & { x: number; y: number; v: number })[] = [];
  let px = W / 2;
  let t = 0;
  let spawn = 0.5;
  let got = 0;
  let lives = 3;
  let msg = '';
  let msgT = 0;
  return {
    tick(dt) {
      t += dt;
      msgT -= dt;
      spawn -= dt;
      if (spawn <= 0) {
        spawn = rand(0.9, 1.4) / pace;
        const d = cfg.next();
        items.push({ ...d, x: rand(70, W - 70), y: 30, v: rand(55, 75) * pace });
      }
      px = steer(w, px, 45, dt);
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.v * dt;
        if (it.y > H - 46 && it.y < H - 20 && Math.abs(it.x - px) < 60) {
          items.splice(i, 1);
          if (it.good) got++;
          else {
            lives--;
            msg = it.why;
            msgT = 2.4;
          }
        } else if (it.y > H) items.splice(i, 1);
      }
    },
    draw(x) {
      for (const it of items) {
        x.font = FONT(12);
        const half = x.measureText(it.label).width / 2 + 13;
        it.x = clamp(it.x, half, W - half); // long labels stay on screen
        pill(x, it.label, it.x, it.y, C.surface, C.line, C.ink, 12);
      }
      x.fillStyle = C.priD;
      rr(x, px - 45, H - 30, 90, 20, 8);
      x.fillStyle = C.pri;
      rr(x, px - 45, H - 33, 90, 20, 8);
      text(x, cfg.tray, px, H - 23, C.onPri, 11);
      if (msgT > 0) text(x, msg, W / 2, H - 52, C.bad, 12);
    },
    hud: () => [`${'♥'.repeat(Math.max(0, lives))}  ${Math.max(0, Math.ceil(cfg.secs - t))}s`, `${got} / ${cfg.goal}`],
    over: () => (lives <= 0 || t >= cfg.secs ? { score: got, good: lives > 0 && got >= cfg.goal, text: `${got} caught. ${lives > 0 && got >= cfg.goal ? cfg.win : cfg.lose}` } : null),
  };
}

/* ---------------------------------------------------------------- Lanes */

export interface Quiz {
  q: string;
  /** The right answer. */
  a: string;
  /** A wrong answer. */
  b: string;
  why: string;
}

/** A question at the top, two answer gates rolling down. Be in the right lane when they arrive. */
const TOP = 106;

export function lanes(w: World, cfg: { next: () => Quiz; total: number; need: number; win: string; lose: string }): Game {
  const { W, H, C, pace, input } = w;
  let n = 0;
  let right = 0;
  let lane = 0;
  let cur = make();
  let gy = TOP;
  let fb = 0;
  let ok = false;
  function make() {
    const z = cfg.next();
    const flip = Math.random() < 0.5;
    return { ...z, opts: flip ? [z.b, z.a] : [z.a, z.b], good: flip ? 1 : 0 };
  }
  return {
    tick(dt) {
      if (input.hits.has('ArrowLeft')) lane = 0;
      if (input.hits.has('ArrowRight')) lane = 1;
      for (const t of input.taps) lane = t.x < W / 2 ? 0 : 1;
      if (input.seen && input.down) lane = input.x < W / 2 ? 0 : 1;
      if (fb > 0) {
        fb -= dt;
        if (fb <= 0) {
          n++;
          if (n < cfg.total) {
            cur = make();
            gy = TOP;
          }
        }
        return;
      }
      gy += 26 * pace * dt;
      if (gy >= H - 90) {
        ok = lane === cur.good;
        if (ok) right++;
        fb = 1.9;
      }
    },
    draw(x) {
      words(x, cur.q, W / 2, 56, W - 30, C.ink, 13);
      x.strokeStyle = C.line;
      x.setLineDash([6, 6]);
      x.beginPath();
      x.moveTo(W / 2, 90);
      x.lineTo(W / 2, H - 10);
      x.stroke();
      x.setLineDash([]);
      cur.opts.forEach((o, k) => {
        const show = fb > 0 ? (k === cur.good ? [C.good, C.goodD, C.onGood] : [C.surface, C.line, C.muted]) : [C.coin, C.coinD, C.onCoin];
        pill(x, o, W / 4 + (k * W) / 2, gy, show[0], show[1], show[2], 12);
      });
      x.fillStyle = C.pri;
      x.beginPath();
      x.arc(W / 4 + (lane * W) / 2, H - 40, 14, 0, 7);
      x.fill();
      if (fb > 0) words(x, (ok ? '✓ ' : '✗ ') + cur.why, W / 2, H - 80, W - 30, ok ? C.goodD : C.bad, 12);
    },
    hud: () => [`Question ${Math.min(cfg.total, n + 1)} / ${cfg.total}`, `${right} right`],
    over: () => (n >= cfg.total ? { score: right, good: right >= cfg.need, text: `${right} of ${cfg.total} right. ${right >= cfg.need ? cfg.win : cfg.lose}` } : null),
  };
}

/** Centred text wrapped to `max` pixels wide. */
function words(x: CanvasRenderingContext2D, s: string, cx: number, cy: number, maxW: number, color: string, px = 13) {
  x.font = FONT(px);
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(' ')) {
    const t = line ? line + ' ' + word : word;
    if (x.measureText(t).width > maxW && line) (lines.push(line), (line = word));
    else line = t;
  }
  lines.push(line);
  lines.forEach((l, i) => text(x, l, cx, cy + (i - (lines.length - 1) / 2) * (px + 4), color, px));
}

/* ---------------------------------------------------------------- Keeper */

export interface KeepModel {
  /** Moves the model on. `c` is the player's control, 0 to 1. Returns a headline when something happens. */
  step(c: number, dt: number): string | void;
  /** Where the tracked value is, and the safe band, all 0 to 1 on the gauge. */
  gauge(): { v: number; lo: number; hi: number };
  /** Gauge caption, control caption. */
  labels(c: number): [string, string];
}

/** Hold a value inside a safe band by sliding a control, while news pushes it around. */
export function keeper(w: World, cfg: { model: (pace: number) => KeepModel; secs: number; need: number; win: string; lose: string; gauge: string; control: string; start?: number }): Game {
  const { W, H, C, pace, input } = w;
  const m = cfg.model(pace);
  let c = cfg.start ?? 0.5;
  let t = 0;
  let inZone = 0;
  let news = '';
  let newsT = 0;
  const L = 30;
  const R = W - 30;
  return {
    tick(dt) {
      t += dt;
      newsT -= dt;
      if (input.keys.ArrowLeft) c -= 0.5 * dt;
      if (input.keys.ArrowRight) c += 0.5 * dt;
      if (input.seen && input.down && input.y > H * 0.55) c = (input.x - L) / (R - L);
      c = clamp(c, 0, 1);
      const h = m.step(c, dt);
      if (h) (news = h), (newsT = 2.5);
      const g = m.gauge();
      if (g.v >= g.lo && g.v <= g.hi) inZone += dt;
    },
    draw(x) {
      const g = m.gauge();
      const [gl, cl] = m.labels(c);
      const gy = H * 0.3;
      text(x, cfg.gauge, W / 2, gy - 36, C.muted, 12);
      x.fillStyle = C.line;
      rr(x, L, gy - 14, R - L, 28, 12);
      x.fillStyle = C.good;
      rr(x, L + clamp(g.lo, 0, 1) * (R - L), gy - 14, (clamp(g.hi, 0, 1) - clamp(g.lo, 0, 1)) * (R - L), 28, 10);
      const vx = L + clamp(g.v, 0, 1) * (R - L);
      const inside = g.v >= g.lo && g.v <= g.hi;
      x.fillStyle = inside ? C.ink : C.bad;
      rr(x, vx - 3, gy - 22, 6, 44, 3);
      text(x, gl, W / 2, gy + 38, inside ? C.goodD : C.bad, 15);
      if (newsT > 0) pill(x, news, W / 2, H * 0.48, C.coin, C.coinD, C.onCoin, 12);
      const cy = H * 0.72;
      text(x, cfg.control, W / 2, cy - 30, C.muted, 12);
      x.fillStyle = C.line;
      rr(x, L, cy - 4, R - L, 8, 4);
      const cx = L + c * (R - L);
      x.fillStyle = C.priD;
      x.beginPath();
      x.arc(cx, cy + 2, 16, 0, 7);
      x.fill();
      x.fillStyle = C.pri;
      x.beginPath();
      x.arc(cx, cy, 16, 0, 7);
      x.fill();
      text(x, cl, W / 2, cy + 36, C.ink, 14);
    },
    hud: () => [`${Math.max(0, Math.ceil(cfg.secs - t))}s left`, `${Math.round((inZone / Math.max(t, 0.001)) * 100)}% in the zone`],
    over: () => {
      if (t < cfg.secs) return null;
      const share = inZone / t;
      return { score: Math.round(share * 100), good: share >= cfg.need, text: `${Math.round(share * 100)}% of the time in the safe zone. ${share >= cfg.need ? cfg.win : cfg.lose}` };
    },
  };
}
