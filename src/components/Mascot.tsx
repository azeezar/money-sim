import type { ReactNode } from 'react';
import type { MascotId } from '../state/types';

const OUT = '#2a2140';
const LINE = { stroke: OUT, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

export const MASCOTS: { id: MascotId; name: string; tag: string }[] = [
  { id: 'cat', name: 'Penny', tag: 'Curious cat' },
  { id: 'fox', name: 'Rusty', tag: 'Clever fox' },
  { id: 'frog', name: 'Lily', tag: 'Calm frog' },
  { id: 'panda', name: 'Bamboo', tag: 'Patient panda' },
  { id: 'penguin', name: 'Pip', tag: 'Cool penguin' },
  { id: 'robot', name: 'Bolt', tag: 'Number-crunching robot' },
];

/** Six original mascots drawn on one 64×64 grid so they can swap anywhere. */
const ART: Record<MascotId, ReactNode> = {
  cat: (
    <>
      <path d="M10 30L8 6l18 10zM54 30l2-24-18 10z" fill="#e8920f" {...LINE} />
      <circle cx="32" cy="36" r="24" fill="#ffb81f" {...LINE} />
      <circle cx="23" cy="33" r="3.6" fill={OUT} />
      <circle cx="41" cy="33" r="3.6" fill={OUT} />
      <path d="M29 41h6l-3 4z" fill={OUT} {...LINE} />
      <path d="M32 45c-2 4-6 4-8 2M32 45c2 4 6 4 8 2" fill="none" {...LINE} />
    </>
  ),
  fox: (
    <>
      <path d="M9 8l17 14-14 14zM55 8L38 22l14 14z" fill="#d9561a" {...LINE} />
      <path d="M8 32q0-12 13-12h22q13 0 13 12 0 20-24 27Q8 52 8 32z" fill="#f2762e" {...LINE} />
      <path d="M17 40q15-8 30 0-6 16-15 19-9-3-15-19z" fill="#fff4e8" {...LINE} />
      <circle cx="24" cy="33" r="3.2" fill={OUT} />
      <circle cx="40" cy="33" r="3.2" fill={OUT} />
      <ellipse cx="32" cy="48" rx="3.6" ry="2.8" fill={OUT} />
    </>
  ),
  frog: (
    <>
      <circle cx="18" cy="21" r="11" fill="#46c28a" {...LINE} />
      <circle cx="46" cy="21" r="11" fill="#46c28a" {...LINE} />
      <ellipse cx="32" cy="40" rx="26" ry="19" fill="#46c28a" {...LINE} />
      <circle cx="18" cy="21" r="6" fill="#fff" />
      <circle cx="46" cy="21" r="6" fill="#fff" />
      <circle cx="19" cy="22" r="3" fill={OUT} />
      <circle cx="45" cy="22" r="3" fill={OUT} />
      <path d="M19 44q13 11 26 0" fill="none" {...LINE} />
      <circle cx="14" cy="40" r="3.5" fill="#ff9db8" />
      <circle cx="50" cy="40" r="3.5" fill="#ff9db8" />
    </>
  ),
  panda: (
    <>
      <circle cx="13" cy="14" r="9" fill="#2f2a3d" {...LINE} />
      <circle cx="51" cy="14" r="9" fill="#2f2a3d" {...LINE} />
      <circle cx="32" cy="36" r="24" fill="#ffffff" {...LINE} />
      <ellipse cx="22" cy="33" rx="6.5" ry="8.5" transform="rotate(20 22 33)" fill="#2f2a3d" />
      <ellipse cx="42" cy="33" rx="6.5" ry="8.5" transform="rotate(-20 42 33)" fill="#2f2a3d" />
      <circle cx="23" cy="33" r="2.4" fill="#fff" />
      <circle cx="41" cy="33" r="2.4" fill="#fff" />
      <ellipse cx="32" cy="43" rx="4.2" ry="3" fill="#2f2a3d" />
      <path d="M32 46q-1 5-6 4M32 46q1 5 6 4" fill="none" {...LINE} />
    </>
  ),
  penguin: (
    <>
      <ellipse cx="10" cy="38" rx="6" ry="13" transform="rotate(12 10 38)" fill="#2f3b63" {...LINE} />
      <ellipse cx="54" cy="38" rx="6" ry="13" transform="rotate(-12 54 38)" fill="#2f3b63" {...LINE} />
      <ellipse cx="22" cy="60" rx="8" ry="3.5" fill="#ffb81f" {...LINE} />
      <ellipse cx="42" cy="60" rx="8" ry="3.5" fill="#ffb81f" {...LINE} />
      <ellipse cx="32" cy="33" rx="22" ry="27" fill="#2f3b63" {...LINE} />
      <ellipse cx="32" cy="41" rx="14" ry="17" fill="#ffffff" />
      <circle cx="25" cy="24" r="5" fill="#fff" />
      <circle cx="39" cy="24" r="5" fill="#fff" />
      <circle cx="26" cy="25" r="2.2" fill={OUT} />
      <circle cx="38" cy="25" r="2.2" fill={OUT} />
      <path d="M27 31h10l-5 7z" fill="#ffb81f" {...LINE} />
    </>
  ),
  robot: (
    <>
      <path d="M32 16V7" fill="none" {...LINE} />
      <circle cx="32" cy="6" r="3.5" fill="#ffb81f" {...LINE} />
      <rect x="4" y="30" width="6" height="14" rx="3" fill="#6f86ad" {...LINE} />
      <rect x="54" y="30" width="6" height="14" rx="3" fill="#6f86ad" {...LINE} />
      <rect x="9" y="16" width="46" height="40" rx="11" fill="#9db4d8" {...LINE} />
      <rect x="15" y="26" width="34" height="14" rx="7" fill="#1f2a44" />
      <circle cx="25" cy="33" r="3.6" fill="#7fe8c0" />
      <circle cx="39" cy="33" r="3.6" fill="#7fe8c0" />
      <path d="M24 47h16" fill="none" {...LINE} />
    </>
  ),
};

export function Mascot({ id, size = 56 }: { id: MascotId; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flex: 'none' }}>
      {ART[id]}
    </svg>
  );
}

export function MascotPicker({ value, onChange }: { value: MascotId; onChange: (m: MascotId) => void }) {
  return (
    <div className="mgrid" role="radiogroup" aria-label="Choose your buddy">
      {MASCOTS.map((m) => (
        <button
          key={m.id}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          className={'mbtn' + (value === m.id ? ' on' : '')}
          onClick={() => onChange(m.id)}
        >
          <Mascot id={m.id} size={52} />
          <b>{m.name}</b>
          <span>{m.tag}</span>
        </button>
      ))}
    </div>
  );
}
