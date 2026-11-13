import type { ReactNode } from 'react';
import { useStore } from '../state/store';
import type { Look, MascotId } from '../state/types';
import { ANCHOR, type Anchor, item } from './wardrobe';

const OUT = '#2a2140';
const LINE = { stroke: OUT, strokeWidth: 2.5, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const THIN = { stroke: OUT, strokeWidth: 1.6, strokeLinecap: 'round' as const };
const BLUSH = '#ff8fab';

export const MASCOTS: { id: MascotId; name: string; tag: string }[] = [
  { id: 'cat', name: 'Penny', tag: 'Curious cat' },
  { id: 'fox', name: 'Rusty', tag: 'Clever fox' },
  { id: 'frog', name: 'Lily', tag: 'Calm frog' },
  { id: 'panda', name: 'Bamboo', tag: 'Patient panda' },
  { id: 'penguin', name: 'Pip', tag: 'Cool penguin' },
  { id: 'robot', name: 'Bolt', tag: 'Number-crunching robot' },
];

export type Mood = 'happy' | 'sad';

/** Per-mascot rigging: arm colours, shoulder position (half-width, y), eye colour and where the mouth sits (none for a beak). */
interface Rig {
  arm: string;
  paw: string;
  sh: [number, number];
  eye: string;
  mouth?: number;
}
const RIG: Record<MascotId, Rig> = {
  cat: { arm: '#ffb81f', paw: '#fff4e0', sh: [17, 52], eye: OUT, mouth: 46 },
  fox: { arm: '#f2762e', paw: '#3a2420', sh: [17, 53], eye: OUT, mouth: 52 },
  frog: { arm: '#46c28a', paw: '#7fe0b0', sh: [21, 49], eye: OUT, mouth: 45 },
  panda: { arm: '#2f2a3d', paw: '#2f2a3d', sh: [17, 54], eye: '#ffffff', mouth: 48 },
  penguin: { arm: '#2f3b63', paw: '#2f3b63', sh: [19, 36], eye: OUT },
  robot: { arm: '#6f86ad', paw: '#c9d6ea', sh: [22, 42], eye: '#7fe8c0', mouth: 49 },
};

/** Bodies without faces or arms, on one 64×64 grid so mascots can swap anywhere. */
const BODY: Record<MascotId, ReactNode> = {
  cat: (
    <>
      <path d="M10 30L8 6l18 10zM54 30l2-24-18 10z" fill="#e8920f" {...LINE} />
      <path d="M12 24l-1-12 9 6zM52 24l1-12-9 6z" fill={BLUSH} />
      <circle cx="32" cy="36" r="24" fill="#ffb81f" {...LINE} />
      <path d="M28 14l1 6M32 13v7M36 14l-1 6" stroke="#e8920f" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="32" cy="44" rx="10" ry="7" fill="#fff4e0" />
      <ellipse cx="22" cy="22" rx="5" ry="3" fill="#ffffff" opacity="0.45" transform="rotate(-25 22 22)" />
      <path d="M29 40h6l-3 3.5z" fill="#e35d7a" {...THIN} />
      <path d="M8 40l9 1M8 45l9-1M56 40l-9 1M56 45l-9-1" fill="none" {...THIN} />
    </>
  ),
  fox: (
    <>
      <path d="M9 8l17 14-14 14zM55 8L38 22l14 14z" fill="#d9561a" {...LINE} />
      <path d="M13 14l8 7-6 7zM51 14l-8 7 6 7z" fill="#3a2420" />
      <path d="M8 32q0-12 13-12h22q13 0 13 12 0 20-24 27Q8 52 8 32z" fill="#f2762e" {...LINE} />
      <path d="M17 40q15-8 30 0-6 16-15 19-9-3-15-19z" fill="#fff4e8" {...LINE} />
      <path d="M26 21q6 5 12 0" fill="none" stroke="#d9561a" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="20" cy="26" rx="4.5" ry="2.5" fill="#ffffff" opacity="0.4" transform="rotate(-20 20 26)" />
      <ellipse cx="32" cy="48" rx="3.6" ry="2.8" fill={OUT} />
      <circle cx="31" cy="47.2" r="0.9" fill="#fff" />
    </>
  ),
  frog: (
    <>
      <circle cx="18" cy="21" r="11" fill="#46c28a" {...LINE} />
      <circle cx="46" cy="21" r="11" fill="#46c28a" {...LINE} />
      <ellipse cx="32" cy="40" rx="26" ry="19" fill="#46c28a" {...LINE} />
      <ellipse cx="32" cy="47" rx="15" ry="9" fill="#a8edc8" />
      <circle cx="18" cy="21" r="6.5" fill="#fff" />
      <circle cx="46" cy="21" r="6.5" fill="#fff" />
      <circle cx="12" cy="33" r="2" fill="#2e9a6a" />
      <circle cx="53" cy="31" r="1.6" fill="#2e9a6a" />
      <circle cx="49" cy="36" r="1.2" fill="#2e9a6a" />
      <path d="M29 36.5h.1M35 36.5h.1" stroke={OUT} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  panda: (
    <>
      <circle cx="13" cy="14" r="9" fill="#2f2a3d" {...LINE} />
      <circle cx="51" cy="14" r="9" fill="#2f2a3d" {...LINE} />
      <circle cx="13" cy="14" r="4" fill="#4a4460" />
      <circle cx="51" cy="14" r="4" fill="#4a4460" />
      <circle cx="32" cy="36" r="24" fill="#ffffff" {...LINE} />
      <ellipse cx="22" cy="33" rx="6.5" ry="8.5" transform="rotate(20 22 33)" fill="#2f2a3d" />
      <ellipse cx="42" cy="33" rx="6.5" ry="8.5" transform="rotate(-20 42 33)" fill="#2f2a3d" />
      <ellipse cx="32" cy="45" rx="9" ry="6.5" fill="#f1eef8" />
      <ellipse cx="32" cy="43" rx="4.2" ry="3" fill="#2f2a3d" />
      <circle cx="31" cy="42.3" r="0.9" fill="#fff" />
    </>
  ),
  penguin: (
    <>
      <ellipse cx="22" cy="60" rx="8" ry="3.5" fill="#ffb81f" {...LINE} />
      <ellipse cx="42" cy="60" rx="8" ry="3.5" fill="#ffb81f" {...LINE} />
      <ellipse cx="32" cy="33" rx="22" ry="27" fill="#2f3b63" {...LINE} />
      <path d="M32 18q-15 2-14 18 1 18 14 22 13-4 14-22 1-16-14-18z" fill="#ffffff" />
      <ellipse cx="20" cy="13" rx="5" ry="2.6" fill="#ffffff" opacity="0.3" transform="rotate(-30 20 13)" />
      <circle cx="25" cy="24.5" r="5.5" fill="#fff" {...THIN} />
      <circle cx="39" cy="24.5" r="5.5" fill="#fff" {...THIN} />
      <path d="M27 31h10l-5 7z" fill="#ffb81f" {...LINE} />
      <path d="M28.5 33.5h7" stroke="#e8920f" strokeWidth="1.2" />
    </>
  ),
  robot: (
    <>
      <path d="M32 16V7" fill="none" {...LINE} />
      <circle cx="32" cy="6" r="3.5" fill="#ffb81f" {...LINE} />
      <circle cx="31" cy="5" r="1" fill="#fff" />
      <rect x="9" y="16" width="46" height="40" rx="11" fill="#9db4d8" {...LINE} />
      <rect x="13" y="19" width="16" height="4" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="15" y="26" width="34" height="14" rx="7" fill="#1f2a44" />
      <circle cx="14" cy="50" r="1.4" fill="#6f86ad" />
      <circle cx="50" cy="50" r="1.4" fill="#6f86ad" />
      <rect x="27" y="52" width="10" height="3" rx="1.5" fill="#6f86ad" />
    </>
  ),
};

function Eyes({ a, r, mood }: { a: Anchor; r: Rig; mood?: Mood }) {
  const pr = Math.max(2.2, a.eyeR * 0.55);
  return (
    <>
      {[-1, 1].map((side) => {
        const x = 32 + side * a.eyeDX;
        const y = a.eyeY + (r.eye === OUT && a.eyeR > 7 ? 1 : 0);
        if (mood === 'happy') return <path key={side} d={`M${x - pr * 1.2} ${y + pr * 0.4}q${pr * 1.2} ${-pr * 2.4} ${pr * 2.4} 0`} fill="none" stroke={r.eye} strokeWidth="2.4" strokeLinecap="round" />;
        return (
          <g key={side}>
            <circle cx={x} cy={y + (mood === 'sad' ? 1 : 0)} r={mood === 'sad' ? pr * 0.85 : pr} fill={r.eye} />
            {r.eye === OUT && <circle cx={x - pr * 0.35} cy={y - pr * 0.35} r={pr * 0.35} fill="#fff" />}
            {mood === 'sad' && <path d={`M${x - side * pr * 1.5} ${y - pr - 3.5}L${x + side * pr * 1.2} ${y - pr - 1.5}`} stroke={OUT} strokeWidth="2" strokeLinecap="round" />}
          </g>
        );
      })}
      {mood === 'sad' && <path d={`M${32 + a.eyeDX + 1} ${a.eyeY + pr + 2}q-2.5 4 0 5.5q2.5-1.5 0-5.5z`} fill="#6ec3ff" stroke="#3b8fd6" strokeWidth="0.8" />}
      {mood === 'happy' &&
        [-1, 1].map((side) => <ellipse key={'b' + side} cx={32 + side * (a.eyeDX + 4)} cy={a.eyeY + pr + 4} rx="3.4" ry="2" fill={BLUSH} opacity="0.85" />)}
    </>
  );
}

function Mouth({ y, mood, robot }: { y: number; mood?: Mood; robot: boolean }) {
  if (robot) return <path d={mood === 'happy' ? `M24 ${y - 2}q8 7 16 0` : mood === 'sad' ? `M25 ${y + 1}q7-5 14 0` : `M25 ${y}h14`} fill="none" {...LINE} />;
  if (mood === 'happy') return <path d={`M26.5 ${y - 1}q5.5 9 11 0z`} fill="#c2304f" {...LINE} strokeWidth={2} />;
  if (mood === 'sad') return <path d={`M28 ${y + 2}q4-3.5 8 0`} fill="none" {...LINE} strokeWidth={2} />;
  return <path d={`M28 ${y}q2 2.5 4 0q2 2.5 4 0`} fill="none" {...LINE} strokeWidth={2} />;
}

/** Arms and paws. Idle at the sides, thrown up when happy, hands to cheeks when sad. */
function Hands({ a, r, mood }: { a: Anchor; r: Rig; mood?: Mood }) {
  const [dx, sy] = r.sh;
  return (
    <>
      {[-1, 1].map((side) => {
        const sx = 32 + side * dx;
        const [px, py] = mood === 'happy' ? [32 + side * (dx + 11), sy - 24] : mood === 'sad' ? [32 + side * (a.eyeDX + 8), a.eyeY + 11] : [32 + side * (dx + 4), sy + 7];
        return (
          <g key={side} className={'hand ' + (side < 0 ? 'l' : 'r')}>
            <path d={`M${sx} ${sy}L${px} ${py}`} stroke={OUT} strokeWidth="8.5" strokeLinecap="round" />
            <path d={`M${sx} ${sy}L${px} ${py}`} stroke={r.arm} strokeWidth="5" strokeLinecap="round" />
            <circle cx={px} cy={py} r="4.3" fill={r.paw} stroke={OUT} strokeWidth="2" />
          </g>
        );
      })}
    </>
  );
}

const Face = ({ id, mood }: { id: MascotId; mood?: Mood }) => {
  const r = RIG[id];
  return (
    <>
      <Eyes a={ANCHOR[id]} r={r} mood={mood} />
      {r.mouth !== undefined && <Mouth y={r.mouth} mood={mood} robot={id === 'robot'} />}
    </>
  );
};

/**
 * A mascot in the user's chosen look (or `look` when given), with its own idle animation.
 * `mood` changes its face, arms and motion; `trick` plays its special move once; `still` stops the animation.
 */
export function Mascot({ id, size = 56, look, trick, still, mood }: { id: MascotId; size?: number; look?: Look; trick?: boolean; still?: boolean; mood?: Mood }) {
  const s = useStore();
  const lk = look ?? s.look;
  const filter = item('color', lk.color)?.filter;
  const extras = (['neck', 'eyes', 'hat'] as const).map((slot) => <g key={slot}>{item(slot, lk[slot])?.draw?.(ANCHOR[id])}</g>);
  const m = mood ?? (trick ? 'happy' : undefined);
  return (
    <span className={`mascot m-${id}` + (trick ? ' trick' : '') + (still ? ' still' : '') + (mood ? ' ' + mood : '')} style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 64 64" style={filter ? { filter } : undefined}>
        {m !== 'sad' && <Hands a={ANCHOR[id]} r={RIG[id]} mood={m} />}
        {BODY[id]}
        <Face id={id} mood={m} />
        {m === 'sad' && <Hands a={ANCHOR[id]} r={RIG[id]} mood={m} />}
      </svg>
      <svg width={size} height={size} viewBox="0 0 64 64">
        {extras}
      </svg>
    </span>
  );
}

/** A plain single-layer mascot that sizes like an Icon, for the tab bar. */
export const MascotIcon = ({ id }: { id: MascotId }) => (
  <svg viewBox="0 0 64 64" aria-hidden="true">
    {BODY[id]}
    <Face id={id} />
  </svg>
);

/** The mascot's display name: the user's nickname, or its own name. */
export const buddyName = (id: MascotId, nick: string): string => nick.trim() || MASCOTS.find((m) => m.id === id)!.name;

export function MascotPicker({ value, onChange }: { value: MascotId; onChange: (m: MascotId) => void }) {
  return (
    <div className="mgrid" role="radiogroup" aria-label="Choose your buddy">
      {MASCOTS.map((m) => (
        <button key={m.id} type="button" role="radio" aria-checked={value === m.id} className={'mbtn' + (value === m.id ? ' on' : '')} onClick={() => onChange(m.id)}>
          <Mascot id={m.id} size={52} />
          <b>{m.name}</b>
          <span>{m.tag}</span>
        </button>
      ))}
    </div>
  );
}
