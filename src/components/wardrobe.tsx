import type { ReactNode } from 'react';
import type { MascotId, Slot } from '../state/types';

/** Where accessories sit on each mascot, on the shared 64×64 grid. */
export interface Anchor {
  /** Top of the head, where a hat's brim sits. */
  top: number;
  eyeY: number;
  /** Half the distance between the eyes. */
  eyeDX: number;
  eyeR: number;
  /** Where a collar sits. */
  neck: number;
}

export const ANCHOR: Record<MascotId, Anchor> = {
  cat: { top: 13, eyeY: 33, eyeDX: 9, eyeR: 5.5, neck: 57 },
  fox: { top: 21, eyeY: 33, eyeDX: 8, eyeR: 5, neck: 56 },
  frog: { top: 14, eyeY: 21, eyeDX: 14, eyeR: 8, neck: 57 },
  panda: { top: 12, eyeY: 33, eyeDX: 9.5, eyeR: 6, neck: 58 },
  penguin: { top: 7, eyeY: 24.5, eyeDX: 7, eyeR: 5.5, neck: 41 },
  robot: { top: 16, eyeY: 33, eyeDX: 7, eyeR: 5, neck: 56 },
};

export interface Item {
  id: string;
  slot: Slot;
  name: string;
  /** Lifetime XP needed to unlock. */
  xp: number;
  /** CSS filter for colour styles. */
  filter?: string;
  draw?: (a: Anchor) => ReactNode;
}

const OUT = '#2a2140';
const L = { stroke: OUT, strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const SLOTS: { slot: Slot; name: string }[] = [
  { slot: 'color', name: 'Colour' },
  { slot: 'hat', name: 'Hats' },
  { slot: 'eyes', name: 'Eyewear' },
  { slot: 'neck', name: 'Neckwear' },
];

export const ITEMS: Item[] = [
  { id: 'classic', slot: 'color', name: 'Classic', xp: 0 },
  { id: 'mint', slot: 'color', name: 'Mint', xp: 25, filter: 'hue-rotate(110deg)' },
  { id: 'ocean', slot: 'color', name: 'Ocean', xp: 70, filter: 'hue-rotate(190deg)' },
  { id: 'berry', slot: 'color', name: 'Berry', xp: 110, filter: 'hue-rotate(280deg) saturate(1.3)' },
  { id: 'gold', slot: 'color', name: 'Gold', xp: 180, filter: 'sepia(0.9) saturate(3) hue-rotate(-12deg) brightness(1.05)' },
  { id: 'galaxy', slot: 'color', name: 'Galaxy', xp: 300, filter: 'invert(0.88) hue-rotate(200deg) saturate(1.6)' },

  { id: 'none', slot: 'hat', name: 'No hat', xp: 0 },
  {
    id: 'cap', slot: 'hat', name: 'Cap', xp: 20,
    draw: ({ top: t }) => (
      <>
        <path d={`M20 ${t + 2}q12-16 24 0z`} fill="#4a7dff" {...L} />
        <path d={`M40 ${t + 1}h12q2 3-2 4H42z`} fill="#3460d6" {...L} />
        <circle cx="32" cy={t - 6} r="1.8" fill="#fff" />
      </>
    ),
  },
  {
    id: 'beanie', slot: 'hat', name: 'Beanie', xp: 40,
    draw: ({ top: t }) => (
      <>
        <path d={`M19 ${t + 3}q13-22 26 0z`} fill="#ff6b8a" {...L} />
        <rect x="18" y={t} width="28" height="6" rx="3" fill="#e0476a" {...L} />
        <circle cx="32" cy={t - 13} r="4" fill="#fff" {...L} />
      </>
    ),
  },
  {
    id: 'party', slot: 'hat', name: 'Party hat', xp: 60,
    draw: ({ top: t }) => (
      <>
        <path d={`M24 ${t + 2}L32 ${t - 18}l8 ${20}z`} fill="#ffb81f" {...L} />
        <path d={`M27 ${t - 5}l9 3M29 ${t - 11}l6 2`} fill="none" stroke="#ff6b8a" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy={t - 19} r="3" fill="#7fe8c0" {...L} />
      </>
    ),
  },
  {
    id: 'tophat', slot: 'hat', name: 'Top hat', xp: 120,
    draw: ({ top: t }) => (
      <>
        <rect x="23" y={t - 15} width="18" height="16" rx="2" fill="#2f2a3d" {...L} />
        <rect x="23" y={t - 6} width="18" height="4" fill="#ff6b8a" />
        <rect x="16" y={t} width="32" height="4" rx="2" fill="#2f2a3d" {...L} />
      </>
    ),
  },
  {
    id: 'crown', slot: 'hat', name: 'Crown', xp: 270,
    draw: ({ top: t }) => (
      <>
        <path d={`M20 ${t + 3}l-1-14 7 6 6-9 6 9 7-6-1 14z`} fill="#ffd23f" {...L} />
        <circle cx="32" cy={t - 3} r="2" fill="#ff4d6d" />
        <circle cx="24" cy={t - 1} r="1.6" fill="#4a7dff" />
        <circle cx="40" cy={t - 1} r="1.6" fill="#4a7dff" />
      </>
    ),
  },

  { id: 'none', slot: 'eyes', name: 'No eyewear', xp: 0 },
  {
    id: 'round', slot: 'eyes', name: 'Round specs', xp: 30,
    draw: ({ eyeY: y, eyeDX: d, eyeR: r }) => (
      <g fill="none" stroke={OUT} strokeWidth="2">
        <circle cx={32 - d} cy={y} r={r} fill="#ffffff33" />
        <circle cx={32 + d} cy={y} r={r} fill="#ffffff33" />
        <path d={`M${32 - d + r} ${y}h${2 * (d - r)}`} />
      </g>
    ),
  },
  {
    id: 'shades', slot: 'eyes', name: 'Shades', xp: 80,
    draw: ({ eyeY: y, eyeDX: d, eyeR: r }) => (
      <>
        <path d={`M${32 - d - r - 1} ${y - r + 1}h${2 * (d + r + 1)}`} {...L} strokeWidth="2.4" />
        <rect x={32 - d - r} y={y - r + 1} width={2 * r} height={r * 1.5} rx={r * 0.6} fill="#1b1730" {...L} />
        <rect x={32 + d - r} y={y - r + 1} width={2 * r} height={r * 1.5} rx={r * 0.6} fill="#1b1730" {...L} />
        <path d={`M${32 - d - r / 2} ${y - r / 3}l2-1.5`} stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: 'hearts', slot: 'eyes', name: 'Heart specs', xp: 150,
    draw: ({ eyeY: y, eyeDX: d, eyeR: r }) => (
      <>
        <path d={`M${32 - d} ${y}h${2 * d}`} {...L} />
        {[32 - d, 32 + d].map((cx) => (
          <path key={cx} d="M0 4C-7-1-5-8 0-4 5-8 7-1 0 4z" transform={`translate(${cx} ${y}) scale(${r / 4.5})`} fill="#ff4d6d" stroke={OUT} strokeWidth={2 / (r / 4.5)} strokeLinejoin="round" />
        ))}
      </>
    ),
  },
  {
    id: 'monocle', slot: 'eyes', name: 'Monocle', xp: 200,
    draw: ({ eyeY: y, eyeDX: d, eyeR: r }) => (
      <>
        <circle cx={32 + d} cy={y} r={r + 0.5} fill="#ffffff44" stroke="#ffd23f" strokeWidth="2.4" />
        <path d={`M${32 + d + r * 0.7} ${y + r * 0.7}q3 8-2 14`} fill="none" stroke="#ffd23f" strokeWidth="1.4" />
      </>
    ),
  },

  { id: 'none', slot: 'neck', name: 'Nothing', xp: 0 },
  {
    id: 'bowtie', slot: 'neck', name: 'Bow tie', xp: 10,
    draw: ({ neck: n }) => (
      <>
        <path d={`M32 ${n}l-9-5v10zM32 ${n}l9-5v10z`} fill="#ff4d6d" {...L} />
        <circle cx="32" cy={n} r="2.4" fill="#c9304f" {...L} />
      </>
    ),
  },
  {
    id: 'scarf', slot: 'neck', name: 'Scarf', xp: 50,
    draw: ({ neck: n }) => (
      <>
        <rect x="15" y={n - 4} width="34" height="7" rx="3.5" fill="#46c28a" {...L} />
        <path d={`M40 ${n + 1}l2 10h-6l-1-9z`} fill="#46c28a" {...L} />
        <path d={`M20 ${n - 4}v7M27 ${n - 4}v7M34 ${n - 4}v7`} stroke="#2e9a6a" strokeWidth="1.6" />
      </>
    ),
  },
  {
    id: 'medal', slot: 'neck', name: 'Medal', xp: 100,
    draw: ({ neck: n }) => (
      <>
        <path d={`M24 ${n - 7}l8 9 8-9`} fill="none" stroke="#4a7dff" strokeWidth="3" />
        <circle cx="32" cy={n + 3} r="4.5" fill="#ffd23f" {...L} />
        <text x="32" y={n + 5} fontSize="6" fontWeight="900" textAnchor="middle" fill={OUT}>£</text>
      </>
    ),
  },
  {
    id: 'chain', slot: 'neck', name: 'Gold chain', xp: 220,
    draw: ({ neck: n }) => (
      <>
        <path d={`M18 ${n - 6}q14 14 28 0`} fill="none" stroke="#ffd23f" strokeWidth="2.6" strokeDasharray="2.5 1.5" />
        <rect x="28" y={n} width="8" height="8" rx="1.5" fill="#ffd23f" {...L} />
        <text x="32" y={n + 6.3} fontSize="6" fontWeight="900" textAnchor="middle" fill={OUT}>$</text>
      </>
    ),
  },
];

export const item = (slot: Slot, id: string): Item | undefined => ITEMS.find((i) => i.slot === slot && i.id === id);
export const isOpen = (i: Item, xp: number): boolean => xp >= i.xp;
/** The next item to unlock, if any is left. */
export const nextUnlock = (xp: number): Item | undefined => ITEMS.filter((i) => i.xp > xp).sort((a, b) => a.xp - b.xp)[0];
