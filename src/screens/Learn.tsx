import { useEffect, useRef, useState } from "react";
import { ReadingList } from "../components/ReadingList";
import { XpBar } from "../components/XpBar";
import { LESSONS } from "../data/lessons";
import { ALL_TIERS, type TierId } from "../lib/config";
import { ADMIN } from "../lib/mode";
import { isUnlocked as unlockedByXp } from "../lib/progress";
import { useStore } from "../state/store";
import { Icon } from "../ui/Icon";

const DX = [0, 44, 64, 44, 0, -44, -64, -44];
const isUnlocked: typeof unlockedByXp = (id, xp) =>
  ADMIN || unlockedByXp(id, xp);

export function Learn({ openLesson }: { openLesson: (id: string) => void }) {
  const s = useStore();
  const [picked, setPicked] = useState<TierId | null>(null);

  // Open on the first unlocked tier that still has lessons to do.
  const open = ALL_TIERS.filter(
    (t) => t.id !== "plan" && isUnlocked(t.id, s.xp),
  );
  const firstUnfinished = open.find((t) =>
    LESSONS[t.id].some((l) => !s.done[l.id]),
  );
  const tierId: TierId =
    picked ?? (firstUnfinished ?? open[open.length - 1]).id;
  const tier = ALL_TIERS.find((t) => t.id === tierId)!;
  const unlocked = isUnlocked(tierId, s.xp);
  const lessons = LESSONS[tierId];
  const curI = lessons.findIndex((l) => !s.done[l.id]);

  const activeTab = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    activeTab.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [tierId]);

  return (
    <>
      <XpBar xp={s.xp} />
      <div className="tabs-strip" role="tablist" aria-label="Learning tiers">
        {ALL_TIERS.map((t) => {
          const ok = isUnlocked(t.id, s.xp);
          return (
            <button
              key={t.id}
              ref={t.id === tierId ? activeTab : undefined}
              role="tab"
              aria-selected={t.id === tierId}
              className={
                "tiertab" + (t.id === tierId ? " on" : "") + (ok ? "" : " lock")
              }
              onClick={() => setPicked(t.id)}
            >
              {!ok && <Icon name="lock" />}
              {t.name}
            </button>
          );
        })}
      </div>

      <section className={`unit t-${tierId}`}>
        <span className="tag">
          {tierId === "plan"
            ? "Personal tier"
            : `Tier ${ALL_TIERS.findIndex((t) => t.id === tierId) + 1} of 4 · ${lessons.length} lessons · about ${lessons.reduce((a, l) => a + (l.mins ?? 0), 0)} min`}
        </span>
        <h2>{tier.name}</h2>
        <p className="small">{tier.blurb}</p>
      </section>

      {!unlocked ? (
        <div className="card center">
          <div className="lockbig">
            <Icon name="lock" size={34} />
          </div>
          <h3>Locked</h3>
          <p className="muted">
            Reach <b className="num">{tier.at} XP</b> to unlock {tier.name}. You
            have <b className="num">{s.xp} XP</b>, so {tier.at - s.xp} to go.
          </p>
          <div className="bar pri" style={{ width: "100%" }}>
            <i style={{ width: `${Math.min(100, (s.xp / tier.at) * 100)}%` }} />
          </div>
          <p className="muted small">
            Earn XP from lessons, daily quests and by hitting your savings goal
            in the budget planner.
          </p>
        </div>
      ) : (
        <div className={`path t-${tierId}`}>
          {lessons.map((l, i) => {
            const done = !!s.done[l.id];
            const cur = i === curI;
            const locked = !ADMIN && !done && !cur;
            const newUnit = l.unit && l.unit !== lessons[i - 1]?.unit;
            return (
              <div
                key={l.id}
                className="col"
                style={{ gap: 10, alignItems: "center" }}
              >
                {newUnit && <h3 className="unithead">{l.unit}</h3>}
                <div
                  className={"nodew" + (cur ? " cur" : "")}
                  style={{ ["--dx" as string]: `${DX[i % 8]}px` }}
                >
                  {cur && <span className="go">Start</span>}
                  <button
                    className={"node" + (locked ? " locked" : "")}
                    disabled={locked}
                    onClick={() => openLesson(l.id)}
                    aria-label={`${l.title}${done ? ", completed" : locked ? ", locked" : ""}`}
                  >
                    <Icon name={done ? "check" : locked ? "lock" : "star"} />
                  </button>
                  <span className={"lbl" + (locked ? " muted" : "")}>
                    {l.num && <b>{l.num} </b>}
                    {l.title}
                    {l.mins && (
                      <span className="muted small"> · {l.mins} min</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
          {curI < 0 && (
            <p className="muted small" style={{ textAlign: "center" }}>
              Tier complete. Tap a lesson to practise it again.
            </p>
          )}
        </div>
      )}
      <ReadingList />
    </>
  );
}
