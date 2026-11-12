import { describe, expect, it } from 'vitest';
import type { Input, Palette } from './engine';
import { fedChair } from './advanced';
import { leverageTightrope, safeWithdrawal } from './investor';

const C = new Proxy({}, { get: () => '#888' }) as Palette;
let said: string[] = [];
/** Records drawn text so a bot can read the gauge, like a player would. */
const ctx = new Proxy({}, { get: (_, k) => (k === 'measureText' ? () => ({ width: 40 }) : k === 'fillText' ? (s: string) => void said.push(s) : () => {}), set: () => true }) as unknown as CanvasRenderingContext2D;
const read = (re: RegExp) => +(said.map((s) => re.exec(s)?.[1]).find((v) => v !== undefined) ?? NaN);

const games = [
  { name: 'Fed Chair', make: fedChair, c0: 0.4, play: (c: number) => c + (read(/Inflation (-?[\d.]+)%/) - 2) * 0.004 },
  { name: 'Leverage Tightrope', make: leverageTightrope, c0: 0.6, play: (c: number) => c - (read(/LTV (\d+)%/) - 65) * 0.0008 },
  { name: 'Safe Withdrawal', make: safeWithdrawal, c0: 0.33, play: () => { const p = read(/Pot (\d+)%/); return p > 150 ? 0.4 : p > 115 ? 0.25 : 0.175; } },
];

describe('zone games', () => {
  for (const { name, make, c0, play } of games)
    it(`${name} can be won with sensible play at every pace`, () => {
      for (const pace of [0.8, 1, 1.6]) {
        const W = 340, H = 380;
        const input: Input = { x: 0, y: H * 0.8, down: true, seen: true, taps: [], keys: {}, hits: new Set() };
        const g = make({ W, H, C, input, pace });
        let c = c0;
        let out = null;
        while (!out) {
          said = [];
          g.draw(ctx);
          c = Math.max(0, Math.min(1, play(c)));
          input.x = 30 + c * (W - 60);
          g.tick(1 / 30);
          out = g.over();
        }
        expect(out.good, `${name} at pace ${pace}: ${out.text}`).toBe(true);
      }
    });
});
