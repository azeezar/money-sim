import { LADDER } from '../lib/config';
import { currentTier, nextTier, tierIndex } from '../lib/progress';

/** Lifetime XP towards the next learning tier, with a pip for each tier on the ladder. */
export function XpBar({ xp }: { xp: number }) {
  const cur = currentTier(xp);
  const next = nextTier(xp);
  const span = next ? next.at - cur.at : 1;
  const into = next ? xp - cur.at : 1;
  const idx = tierIndex(xp);
  return (
    <div className="card xpcard">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span className="tag">Learning tier</span>
          <h2>{cur.name}</h2>
        </div>
        <b className="num">{xp} XP</b>
      </div>
      <div
        className="bar pri"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={span}
        aria-valuenow={into}
        aria-label={next ? `Progress to ${next.name}` : 'All tiers unlocked'}
      >
        <i style={{ width: `${Math.min(100, (into / span) * 100)}%` }} />
      </div>
      <p className="muted small num">
        {next ? `${next.at - xp} XP to unlock ${next.name}` : 'Every tier is unlocked. Keep going for the badges.'}
      </p>
      <ol className="ladder" aria-label="Tier ladder">
        {LADDER.map((t, i) => (
          <li key={t.id} className={i <= idx ? 'got' : ''}>
            <i aria-hidden="true" />
            <span>{t.name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
