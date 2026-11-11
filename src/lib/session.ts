/**
 * London Stock Exchange hours: 08:00 to 16:30 UK time, Monday to Friday.
 * shortcut: UK bank holidays are treated as normal trading days; add a holiday list if that matters.
 */
const H = 3_600_000;
const D = 24 * H;
const OPEN = 8 * H;
const CLOSE = 16.5 * H;

/** UTC ms of 01:00 UTC on the last Sunday of a month (when UK clocks change). */
function lastSunday(y: number, m: number): number {
  const d = new Date(Date.UTC(y, m + 1, 0));
  return d.getTime() - d.getUTCDay() * D + H;
}

/** 1 hour during British Summer Time, otherwise 0. */
export function ukOffset(t: number): number {
  const y = new Date(t).getUTCFullYear();
  return t >= lastSunday(y, 2) && t < lastSunday(y, 9) ? H : 0;
}

const weekday = (localDay: number) => {
  const w = new Date(localDay).getUTCDay();
  return w !== 0 && w !== 6;
};
/** Local midnight (as a UTC-based number) of the UK day containing t. */
const localDay = (t: number) => Math.floor((t + ukOffset(t)) / D) * D;
/** A UK local clock time on a local day, back to real UTC ms. */
const toUtc = (local: number) => local - ukOffset(local - H);

export function isOpenUk(t: number): boolean {
  const day = localDay(t);
  const m = t + ukOffset(t) - day;
  return weekday(day) && m >= OPEN && m < CLOSE;
}

/** The latest session close at or before t. */
export function lastCloseUk(t: number): number {
  for (let day = localDay(t), i = 0; i < 10; i++, day -= D) {
    const close = toUtc(day + CLOSE);
    if (weekday(day) && close <= t) return close;
  }
  return t;
}

/** The next session open after t (or t's own session open if t is before it that day). */
export function nextOpenUk(t: number): number {
  for (let day = localDay(t), i = 0; i < 10; i++, day += D) {
    const open = toUtc(day + OPEN);
    if (weekday(day) && open > t) return open;
  }
  return t;
}

/** The moment whose price applies at t: t itself while open, else the last close. */
export const effTimeUk = (t: number): number => (isOpenUk(t) ? t : lastCloseUk(t));
