import type { CSSProperties } from 'react';
import { money } from '../lib/format';

const STEP = 10;
const p2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A £ slider from `min` to `max` in £10 steps. With min £1 the track's 0 means £1;
 * its last notch is exactly `max`. Optional number box for amounts too fine to drag to.
 */
export function MoneySlider({ id, label, value, max, min = 1, onChange, typed }: { id: string; label: string; value: number; max: number; min?: number; onChange: (n: number) => void; typed?: boolean }) {
  const top = Math.max(STEP, Math.ceil(max / STEP) * STEP);
  const lo = min < STEP ? 0 : min;
  const clamp = (n: number) => p2(Math.min(max, Math.max(min, n)));
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="t2-slider"
        type="range"
        min={lo}
        max={top}
        step={STEP}
        value={value <= min ? lo : value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-valuetext={money(value)}
        style={{ '--fill': `${Math.min(100, ((value - lo) / (top - lo)) * 100)}%` } as CSSProperties}
      />
      <div className="row small muted num" style={{ justifyContent: 'space-between' }}>
        <span>{money(min)}</span>
        {typed && (
          <input
            className="mini"
            type="number"
            min={min}
            max={max}
            step={STEP}
            value={value}
            aria-label={label}
            onChange={(e) => e.target.value !== '' && onChange(clamp(Math.round(Number(e.target.value) / STEP) * STEP || min))}
          />
        )}
        <span>{money(p2(max))}</span>
      </div>
    </>
  );
}
