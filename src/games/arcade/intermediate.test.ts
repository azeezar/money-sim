import { describe, expect, it } from 'vitest';
import type { Input, Palette } from './engine';
import * as G from './intermediate';

const C = new Proxy({}, { get: () => '#888' }) as Palette;
/** A canvas context that accepts every call, so draw() runs without a browser. */
const ctx = new Proxy({}, { get: (_, k) => (k === 'measureText' ? () => ({ width: 40 }) : () => {}), set: () => true }) as unknown as CanvasRenderingContext2D;

const makers = [G.shareSlicers, G.yieldSeesaw, G.basketBuilder, G.feeEater, G.mixMaster, G.taxMaze, G.dcaAutopilot, G.targetRebalancer];
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];

describe('intermediate arcade games', () => {
  for (const make of makers)
    it(`${make.name} runs to a result under random play`, () => {
      for (const pace of [0.8, 1.6]) {
        const W = 340, H = 380;
        const input: Input = { x: W / 2, y: H / 2, down: false, seen: true, taps: [], keys: {}, hits: new Set() };
        const g = make({ W, H, C, input, pace });
        let out = null;
        for (let f = 0; f < 30 * 200 && !out; f++) {
          input.x = Math.random() * W;
          input.y = Math.random() * H;
          input.down = Math.random() < 0.3;
          if (f % 9 === 0) input.taps.push({ x: input.x, y: input.y });
          const k = KEYS[f % 37 % KEYS.length];
          if (f % 13 === 0) input.hits.add(k);
          input.keys = { [k]: f % 50 < 25 };
          g.tick(1 / 30);
          input.taps = [];
          input.hits.clear();
          g.draw(ctx);
          for (const s of g.hud()) expect(s).not.toMatch(/NaN|undefined/);
          out = g.over();
        }
        expect(out, 'game never ended').not.toBeNull();
        expect(Number.isFinite(out!.score)).toBe(true);
        expect(out!.text).not.toMatch(/NaN|undefined/);
      }
    });
});
