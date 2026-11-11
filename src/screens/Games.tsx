import { useState } from 'react';
import { LESSONS, type Lesson } from '../data/lessons';
import { ARCADE } from '../games/arcade';
import { QuickQuiz, TermMatch } from '../games/LessonGames';
import { RiskLab } from '../games/RiskLab';
import { perk } from '../games/levels';
import { MIN_PAIRS, MIN_QUESTIONS, lessonPool } from '../games/pool';
import { isAdult, tierOpen } from '../lib/access';
import { CAPACITY, GAME_STAR_PLAYS_PER_DAY, LADDER, MAX_LEVEL, type TierId } from '../lib/config';
import { dayKey } from '../lib/format';
import { levelFor, levelProgress } from '../lib/progress';
import { finishGame, transferXP } from '../state/actions';
import { freshGame, useStore } from '../state/store';
import type { State } from '../state/types';
import { Icon } from '../ui/Icon';
import { toast } from '../ui/toast';

type LadderId = Exclude<TierId, 'plan'>;
type Review = 'pairs' | 'quiz' | 'risk';

/** A playable thing on this screen: a lesson's arcade game, or a tier-wide review game. */
type Open = { kind: 'arcade'; lesson: Lesson; tier: LadderId } | { kind: Review; tier: LadderId };

const REVIEW: Record<Review, { name: string; kid: string; tag: string; kidTag: string }> = {
  pairs: { name: 'Term Match', kid: 'Word Pairs', tag: 'Match the key terms from this tier’s lessons to their meanings.', kidTag: 'Match words from your lessons to what they mean.' },
  quiz: { name: 'Quick Quiz', kid: 'Quiz Time', tag: 'Questions from this tier’s lessons, against the clock.', kidTag: 'Questions from lessons you have finished. No timer.' },
  risk: { name: 'Risk Lab', kid: 'Risk Lab', tag: 'Run your money through the years to see why spreading risk works.', kidTag: 'See why spreading your money out is safer.' },
};
const REVIEWS: Record<LadderId, Review[]> = { novice: ['pairs', 'quiz'], intermediate: ['risk', 'pairs', 'quiz'], advanced: ['pairs', 'quiz'], investor: ['pairs', 'quiz'] };

/** The id that holds an item's stars and XP level. */
const gameId = (o: Open): string => (o.kind === 'arcade' ? o.lesson.arcade!.id : o.kind === 'risk' ? 'risk' : 'quiz');

/** Why something cannot be played yet, or null when it can. */
function blocker(o: Open, s: State, kid: boolean): string | null {
  if (!tierOpen(s, o.tier)) return null; // whole tier is locked; the tier header says so
  if (o.kind === 'arcade') {
    if (!ARCADE[o.lesson.arcade!.id]) return 'Coming soon.';
    return kid && !s.done[o.lesson.id] ? `Finish lesson ${o.lesson.num} to play.` : null;
  }
  if (o.kind === 'risk') return null;
  const p = lessonPool(o.tier, s, kid);
  const enough = o.kind === 'pairs' ? p.pairs.length >= MIN_PAIRS : p.questions.length >= MIN_QUESTIONS;
  return enough ? null : kid ? 'Finish a lesson in this tier to play.' : 'Not enough lesson content yet.';
}

function Pips({ level }: { level: number }) {
  return (
    <span className="pips" role="img" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <i key={i} className={i < level ? 'on' : ''} />
      ))}
    </span>
  );
}

export function Games() {
  const s = useStore();
  const kid = !isAdult(s);
  const [open, setOpen] = useState<Open | null>(null);
  const levelled = (o: Open) => o.kind !== 'pairs' && o.kind !== 'quiz';
  const title = (o: Open) => (o.kind === 'arcade' ? o.lesson.arcade!.name : kid ? REVIEW[o.kind].kid : REVIEW[o.kind].name);

  if (open) {
    const id = gameId(open);
    const g = s.games[id] ?? freshGame();
    const level = levelled(open) ? levelFor(g.invested) : 0;
    const left = Math.max(0, GAME_STAR_PLAYS_PER_DAY - (g.day === dayKey() ? g.rewarded : 0));
    const onFinish = (good: boolean, meta?: { steady?: boolean }) => {
      const stars = finishGame(id, good, meta);
      toast(stars > 0 ? `+${stars} ${stars === 1 ? 'star' : 'stars'}` : 'Daily star limit reached for this game');
    };
    const pool = { pool: lessonPool(open.tier, s, kid), kid, mascot: s.mascot, onFinish };
    const Game = open.kind === 'arcade' ? ARCADE[open.lesson.arcade!.id] : null;
    return (
      <div className={kid ? 'kid' : ''}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button className="btn ghost" onClick={() => setOpen(null)}>
            ← Minigames
          </button>
          <span className="row" style={{ gap: 8 }}>
            <b>{title(open)}</b>
            {levelled(open) && <Pips level={level} />}
          </span>
        </div>
        <p className="muted small">
          {open.kind === 'arcade' ? `Lesson ${open.lesson.num}: ${open.lesson.title}` : LADDER.find((t) => t.id === open.tier)!.name}
          {levelled(open) ? ` · Level ${level} · ${perk(id, level)}` : kid ? ' · from lessons you have finished' : ' · from this tier’s lessons'} · {left} {left === 1 ? 'play' : 'plays'} left today that pay stars.
        </p>
        {Game && <Game level={level} kid={kid} onFinish={onFinish} />}
        {open.kind === 'risk' && <RiskLab level={level} onFinish={onFinish} />}
        {open.kind === 'pairs' && <TermMatch {...pool} />}
        {open.kind === 'quiz' && <QuickQuiz {...pool} />}
      </div>
    );
  }

  function row(o: Open, ok: boolean) {
    const why = blocker(o, s, kid);
    const id = gameId(o);
    const lp = levelled(o) ? levelProgress((s.games[id] ?? freshGame()).invested) : null;
    const tag = o.kind === 'arcade' ? `Lesson ${o.lesson.num} · ${o.lesson.arcade!.desc}` : kid ? REVIEW[o.kind].kidTag : REVIEW[o.kind].tag;
    const soon = o.kind === 'arcade' && !ARCADE[id];
    return (
      <div className={'gitem' + (soon ? ' soon' : '')} key={o.kind === 'arcade' ? id : o.kind}>
        <div className="grow">
          <div className="row" style={{ gap: 8 }}>
            <b>{title(o)}</b>
            {lp && !soon && <Pips level={lp.level} />}
          </div>
          <span className="muted small">{why ?? tag}</span>
        </div>
        <div className="row nowrap" style={{ gap: 6 }}>
          {lp && ok && !kid && !soon && (
            <button
              className="btn ghost"
              disabled={lp.maxed || s.wallet <= 0}
              title="Move XP from your wallet to level this game up"
              onClick={() => {
                const room = CAPACITY - (s.games[id]?.invested ?? 0);
                if (!transferXP(id, Math.min(room, lp.need - lp.into))) toast('No XP to spend yet.');
              }}
            >
              Level up
            </button>
          )}
          <button className="btn coin" disabled={!ok || !!why} onClick={() => setOpen(o)}>
            {!ok ? <Icon name="lock" size={16} /> : soon ? 'Soon' : 'Play'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="hero h-games">
        <span className="tag">Minigames</span>
        <h1>{kid ? 'Play what you learned' : 'Practise what you learned'}</h1>
        <p className="small">
          {kid
            ? 'Every lesson has its own arcade game. Finish the lesson to unlock it.'
            : 'Every lesson has its own arcade game, grouped by unit. A tier’s games open when you reach it with XP.'}
        </p>
        {!kid && (
          <div className="chips" style={{ justifyContent: 'flex-start' }}>
            <span className="chip num">⚡ {s.wallet} XP to spend on game levels</span>
            <span className="chip num">★ {s.stars} stars</span>
          </div>
        )}
      </section>

      {LADDER.map((t) => {
        const tid = t.id as LadderId;
        const ok = tierOpen(s, tid);
        const units = [...new Set(LESSONS[tid].map((l) => l.unit))];
        return (
          <div className={`card gtier t-${tid}` + (ok ? '' : ' locked')} key={tid}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3>{t.name}</h3>
              {ok ? <span className="tag">Open</span> : <span className="tag row" style={{ gap: 4 }}><Icon name="lock" size={14} /> {t.at} XP</span>}
            </div>
            {!ok && <p className="muted small">Reach {t.name} ({t.at} XP, you have {s.xp}) to open these games.</p>}
            {units.map((u) => (
              <div className="glist" key={u}>
                <span className="tag">{u}</span>
                {LESSONS[tid]
                  .filter((l) => l.unit === u && l.arcade)
                  .map((l) => row({ kind: 'arcade', lesson: l, tier: tid }, ok))}
              </div>
            ))}
            <div className="glist">
              <span className="tag">Tier review</span>
              {REVIEWS[tid].map((k) => row({ kind: k, tier: tid }, ok))}
            </div>
          </div>
        );
      })}
      <p className="muted small">Playing pays stars, which top up hearts in lessons. Only {GAME_STAR_PLAYS_PER_DAY} plays per game pay out each day.</p>
    </>
  );
}
