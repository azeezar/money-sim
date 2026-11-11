import { useEffect, useRef, useState } from 'react';

/** Props every arcade game receives from the Games screen. */
export interface ArcadeProps {
  /** 0–5, from XP moved into this game. Higher is faster and tougher. */
  level: number;
  /** Under-18 mode: a gentler pace. */
  kid: boolean;
  onFinish: (good: boolean) => void;
}

export interface Palette {
  ink: string;
  muted: string;
  line: string;
  soft: string;
  surface: string;
  pri: string;
  priD: string;
  onPri: string;
  coin: string;
  coinD: string;
  onCoin: string;
  good: string;
  goodD: string;
  onGood: string;
  bad: string;
  badD: string;
  onBad: string;
}

export interface Input {
  /** Pointer position in canvas pixels; starts in the middle. */
  x: number;
  y: number;
  down: boolean;
  /** True once the pointer has moved over the canvas, until an arrow key takes over. */
  seen: boolean;
  /** Taps since the last frame. */
  taps: { x: number; y: number }[];
  keys: Record<string, boolean>;
  /** Keys pressed since the last frame. */
  hits: Set<string>;
}

export interface World {
  W: number;
  H: number;
  C: Palette;
  input: Input;
  /** Difficulty multiplier from level and age. */
  pace: number;
}

export interface Result {
  score: number;
  good: boolean;
  text: string;
}

export interface Game {
  tick(dt: number): void;
  draw(x: CanvasRenderingContext2D): void;
  /** Left and right HUD text. */
  hud(): [string, string];
  /** A result once the run is over, otherwise null. */
  over(): Result | null;
}

export const pace = (level: number, kid: boolean): number => (kid ? 0.8 : 1) * (1 + 0.12 * level);

export const FONT = (px: number, w = 800) => `${w} ${px}px Nunito Variable, Nunito, system-ui, sans-serif`;

export function rr(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.fill();
}

/** A raised, labelled pill centred on (cx, cy). Returns its width. */
export function pill(x: CanvasRenderingContext2D, label: string, cx: number, cy: number, bg: string, deep: string, fg: string, px = 12): number {
  x.font = FONT(px);
  const w = x.measureText(label).width + 18;
  const h = px + 14;
  x.fillStyle = deep;
  rr(x, cx - w / 2, cy - h / 2 + 3, w, h, 9);
  x.fillStyle = bg;
  rr(x, cx - w / 2, cy - h / 2, w, h, 9);
  x.fillStyle = fg;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(label, cx, cy + 1);
  return w;
}

export function disc(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, bg: string, deep: string) {
  x.fillStyle = deep;
  x.beginPath();
  x.arc(cx, cy + 2, r, 0, 7);
  x.fill();
  x.fillStyle = bg;
  x.beginPath();
  x.arc(cx, cy, r, 0, 7);
  x.fill();
}

export function text(x: CanvasRenderingContext2D, s: string, cx: number, cy: number, color: string, px = 13, align: CanvasTextAlign = 'center') {
  x.font = FONT(px);
  x.fillStyle = color;
  x.textAlign = align;
  x.textBaseline = 'middle';
  x.fillText(s, cx, cy);
}

/** Steering for games with a paddle or player on the bottom row: pointer, or arrow keys. */
export function steer(w: World, px: number, half: number, dt: number, speed = 380): number {
  const { input } = w;
  if (input.keys.ArrowLeft) px -= speed * dt;
  else if (input.keys.ArrowRight) px += speed * dt;
  else if (input.seen) px += (input.x - px) * Math.min(1, dt * 14);
  return Math.max(half, Math.min(w.W - half, px));
}

export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function palette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    ink: v('--ink'), muted: v('--muted'), line: v('--line'), soft: v('--soft'), surface: v('--surface'),
    pri: v('--primary'), priD: v('--primary-deep'), onPri: v('--on-primary'),
    coin: v('--coin'), coinD: v('--coin-deep'), onCoin: v('--on-coin'),
    good: v('--good'), goodD: v('--good-deep'), onGood: v('--on-good'),
    bad: v('--bad'), badD: v('--bad-deep'), onBad: v('--on-bad'),
  };
}

const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

/**
 * Shared shell for the arcade games: start screen, canvas loop, input, HUD and result.
 * Each game only supplies `make`, which builds a fresh run.
 */
export function Arcade({ name, how, controls, make, level, kid, onFinish }: ArcadeProps & { name: string; how: string; controls: string; make: (w: World) => Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fin = useRef(onFinish);
  fin.current = onFinish;
  const mk = useRef(make);
  mk.current = make;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [res, setRes] = useState<Result | null>(null);

  useEffect(() => {
    if (phase !== 'play') return;
    const c = ref.current;
    const x = c?.getContext('2d');
    if (!c || !x) return;
    const W = c.clientWidth;
    const H = c.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr;
    c.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const input: Input = { x: W / 2, y: H / 2, down: false, seen: false, taps: [], keys: {}, hits: new Set() };
    const C = palette();
    const game = mk.current({ W, H, C, input, pace: pace(level, kid) });
    const at = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      input.x = e.clientX - r.left;
      input.y = e.clientY - r.top;
      input.seen = true;
    };
    const pm = (e: PointerEvent) => at(e);
    const pd = (e: PointerEvent) => {
      at(e);
      input.down = true;
      input.taps.push({ x: input.x, y: input.y });
    };
    const pu = () => void (input.down = false);
    const kd = (e: KeyboardEvent) => {
      if (!GAME_KEYS.has(e.key)) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') input.seen = false;
      if (!input.keys[e.key]) input.hits.add(e.key);
      input.keys[e.key] = true;
    };
    const ku = (e: KeyboardEvent) => void (input.keys[e.key] = false);
    c.addEventListener('pointermove', pm);
    c.addEventListener('pointerdown', pd);
    addEventListener('pointerup', pu);
    addEventListener('keydown', kd);
    addEventListener('keyup', ku);
    let last = 0;
    let raf = 0;
    const frame = (ts: number) => {
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
      last = ts;
      game.tick(dt);
      input.taps = [];
      input.hits.clear();
      x.clearRect(0, 0, W, H);
      game.draw(x);
      const [l, r] = game.hud();
      text(x, l, 10, 16, C.ink, 14, 'left');
      text(x, r, W - 10, 16, C.ink, 14, 'right');
      const out = game.over();
      if (out) {
        setRes(out);
        setPhase('done');
        fin.current(out.good);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener('pointermove', pm);
      c.removeEventListener('pointerdown', pd);
      removeEventListener('pointerup', pu);
      removeEventListener('keydown', kd);
      removeEventListener('keyup', ku);
    };
  }, [phase, level, kid]);

  if (phase === 'play')
    return (
      <div className="card">
        <canvas className="arcade-cv" ref={ref} aria-label={`${name} game area`} />
        <p className="muted small">{controls}</p>
      </div>
    );

  return (
    <div className="card">
      {res && (
        <div className={'fb ' + (res.good ? 'good' : 'bad')}>
          <b>{res.good ? 'Great run' : 'Run over'}</b>
          <p>{res.text}</p>
        </div>
      )}
      <h3>{name}</h3>
      <p className="muted">{how}</p>
      <button
        className="btn coin wide"
        onClick={() => {
          setRes(null);
          setPhase('play');
        }}
      >
        {res ? 'Play again' : 'Start'}
      </button>
    </div>
  );
}
