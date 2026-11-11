import type { ReactNode } from 'react';

export type IconName = 'flame' | 'star' | 'heart' | 'learn' | 'goal' | 'games' | 'lock' | 'check' | 'pie' | 'candles' | 'user' | 'gear';

const PATHS: Record<IconName, ReactNode> = {
  flame: <path d="M12 2c1 4 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2 1-3.2 1.6-4.6C9.6 9.6 11 7 12 2z" />,
  star: <path d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z" />,
  heart: <path d="M12 21s-7.5-4.6-9.3-9.3C1.4 8.1 3.6 4.5 7 4.5c2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3.4 0 5.6 3.6 4.3 7.2C19.5 16.4 12 21 12 21z" />,
  learn: (
    <>
      <circle cx="7" cy="5" r="3.2" />
      <circle cx="16.5" cy="12" r="3.2" />
      <circle cx="8" cy="19" r="3.2" />
    </>
  ),
  goal: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="12" cy="12" r="3.6" />
    </>
  ),
  games: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7.5h10a4.75 4.75 0 0 1 0 9.5H7a4.75 4.75 0 0 1 0-9.5z" />
      <path d="M8 12.25h4M10 10.25v4" />
      <circle cx="15.5" cy="12.25" r=".7" />
    </g>
  ),
  lock: <path d="M7 10V8a5 5 0 0 1 10 0v2h1.5v10h-13V10H7zm2.5 0h5V8a2.5 2.5 0 0 0-5 0v2z" />,
  pie: (
    <>
      <path d="M11 3.1A9 9 0 1 0 20.9 13H11z" />
      <path d="M13 1.5V11h9.5A9.5 9.5 0 0 0 13 1.5z" opacity=".6" />
    </>
  ),
  candles: (
    <>
      <rect x="3.5" y="8" width="4.5" height="9" rx="1" />
      <path d="M5.75 4v4M5.75 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="15.5" y="5" width="4.5" height="8" rx="1" opacity=".6" />
      <path d="M17.75 2v3M17.75 13v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
      <rect x="9.75" y="10" width="4.5" height="6" rx="1" />
      <path d="M12 7v3M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4.2" />
      <path d="M3.5 21c.6-4.3 4-7 8.5-7s7.9 2.7 8.5 7z" />
    </>
  ),
  gear: <path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" fillRule="evenodd" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />,
};

export function Icon({ name, size }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={size} height={size}>
      {PATHS[name]}
    </svg>
  );
}
