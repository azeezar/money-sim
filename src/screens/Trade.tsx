import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MoneySlider } from "../components/MoneySlider";
import {
  INDICATORS,
  PriceChart,
  type ChartLine,
  type ChartType,
  type IndicatorId,
} from "../components/PriceChart";
import { RESOURCES } from "../data/resources";
import {
  LADDER,
  TRADE_FEE_RATE,
  TRADE_MAX_START,
  TRADE_MIN_START,
  TRADING_START_CASH,
  TRADING_TIER,
} from "../lib/config";
import { money } from "../lib/format";
import {
  BY_SYM,
  DAY,
  HOUR,
  is24h,
  MIN,
  priceAt,
  quote,
  TIMEFRAMES,
  TRADABLE,
  type MarketMode,
  type TimeframeId,
} from "../lib/market";
import { ADMIN } from "../lib/mode";
import { recentNews } from "../lib/news";
import { isUnlocked } from "../lib/progress";
import { isAdult } from "../lib/access";
import { isOpenUk, nextOpenUk } from "../lib/session";
import {
  attachExits,
  clockOf,
  fmtQty,
  LEVERAGE,
  liqPrice,
  marketOpen,
  place,
  positionSize,
  processOrders,
  valueOf,
  type PlaceOpts,
  type Result,
} from "../lib/trading";
import {
  cancelOrder,
  closePosition,
  backToToday,
  fastForward,
  keyFor,
  placeTrade,
  setExits,
  setTradeMode,
  startTrading,
  toggleWatch,
  type ForwardResult,
} from "../state/actions";
import { freshAccount, useStore } from "../state/store";
import type { Account, OrderType, Side } from "../state/types";
import { Icon } from "../ui/Icon";
import { toast } from "../ui/toast";
import { useNow } from "../ui/useNow";

const fmtP = (p: number) => {
  if (!Number.isFinite(p)) return "–";
  return p.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: p < 10 ? 3 : 2,
  });
};
const pctS = (r: number) =>
  `${r >= 0 ? "+" : "−"}${Math.abs(r * 100).toFixed(2)}%`;
const big = (n: number) =>
  n >= 1e12
    ? `£${(n / 1e12).toFixed(2)}T`
    : n >= 1e9
      ? `£${(n / 1e9).toFixed(2)}B`
      : `£${(n / 1e6).toFixed(0)}M`;
const r2 = (n: number) => Math.round(n * 100) / 100;
const when = (
  t: number,
  opts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  },
) =>
  new Date(t).toLocaleString("en-GB", { ...opts, timeZone: "Europe/London" });

type BottomTab = "positions" | "orders" | "history" | "account" | "resources";
const SPANS = [
  { id: "day", label: "Day", ms: DAY },
  { id: "week", label: "Week", ms: 7 * DAY },
  { id: "month", label: "Month", ms: 30 * DAY },
] as const;
/** Replay speeds: simulated time per real second. */
const SPEEDS = [
  { label: "1 min/s", ms: MIN },
  { label: "5 min/s", ms: 5 * MIN },
  { label: "15 min/s", ms: 15 * MIN },
  { label: "1 hr/s", ms: HOUR },
  { label: "4 hr/s", ms: 4 * HOUR },
];
const DEFAULT_SPEED: Record<(typeof SPANS)[number]["id"], number> = {
  day: 1,
  week: 3,
  month: 4,
};

/** The account, clock and order actions every panel works with: the live account, or a replay's practice copy. */
interface Desk {
  acct: Account;
  now: number;
  mode: MarketMode;
  replay: boolean;
  place: (o: PlaceOpts) => Result;
  cancel: (id: string) => void;
  close: (sym: string) => void;
  setExits: (sym: string, sl?: number, tp?: number) => void;
}
const DeskCtx = createContext<Desk>(null!);
const useDesk = () => useContext(DeskCtx);

interface Replay {
  span: string;
  /** Where the replay started and stops (the account's clock when it was opened). */
  from: number;
  end: number;
  t: number;
  speed: number;
  playing: boolean;
  acct: Account;
}

export function Trade({ onLearn }: { onLearn: () => void }) {
  const s = useStore();
  const real = useNow(1000);
  const tier = LADDER.find((t) => t.id === TRADING_TIER)!;
  const open = isAdult(s) && (ADMIN || isUnlocked(TRADING_TIER, s.xp));
  const mode = s.tradeMode;
  const key = keyFor(mode);
  const live = s[key];

  const [sym, setSym] = useState("NOVA");
  const [tfId, setTfId] = useState<TimeframeId>("5m");
  const [type, setType] = useState<ChartType>("candles");
  const [ind, setInd] = useState<Set<IndicatorId>>(
    () => new Set<IndicatorId>(["vol", "sma20", "sma50"]),
  );
  const [hlines, setHlines] = useState<Record<string, number[]>>({});
  const [tool, setTool] = useState(false);
  const [tab, setTab] = useState<BottomTab>("positions");
  const [pickFor, setPickFor] = useState<null | ((p: number) => void)>(null);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [fwd, setFwd] = useState<ForwardResult | null>(null);
  const [view, setView] = useState<"desk" | "news">("desk");
  const replayRef = useRef(replay);
  replayRef.current = replay;

  // Replay clock: advance, fill practice orders, stop at the end.
  useEffect(() => {
    if (!replay?.playing) return;
    const id = setInterval(() => {
      const r = replayRef.current;
      if (!r) return;
      const t = Math.min(r.end, r.t + SPEEDS[r.speed].ms / 5);
      const a = structuredClone(r.acct);
      const fills = processOrders(a, TRADE_FEE_RATE, t);
      fills.forEach((f) =>
        toast(
          `Replay: ${f.note ?? "order"} filled, ${f.side} ${fmtQty(f.qty)} ${f.sym} at ${f.price}`,
        ),
      );
      setReplay({ ...r, t, acct: a, playing: t < r.end });
    }, 200);
    return () => clearInterval(id);
  }, [replay?.playing]);

  const desk: Desk = useMemo(() => {
    if (replay) {
      const mut = (fn: (a: Account) => Result | void) => {
        const r = replayRef.current!;
        const a = structuredClone(r.acct);
        processOrders(a, TRADE_FEE_RATE, r.t);
        const res = fn(a);
        setReplay({ ...r, acct: a });
        if (res) toast(res.msg);
        return res;
      };
      return {
        acct: replay.acct,
        now: replay.t,
        mode,
        replay: true,
        place: (o) =>
          mut((a) =>
            place(a, o, TRADE_FEE_RATE, replayRef.current!.t),
          ) as Result,
        cancel: (id) =>
          void mut(
            (a) => void (a.orders = a.orders.filter((o) => o.id !== id)),
          ),
        close: (x) => {
          const q = replayRef.current!.acct.positions[x]?.qty;
          if (q)
            mut((a) =>
              place(
                a,
                { sym: x, side: "sell", type: "market", qty: q },
                TRADE_FEE_RATE,
                replayRef.current!.t,
              ),
            );
        },
        setExits: (x, sl, tp) =>
          void mut((a) => {
            const pos = a.positions[x];
            if (!pos) return;
            a.orders = a.orders.filter(
              (o) =>
                !(
                  o.sym === x &&
                  (o.label === "Stop loss" || o.label === "Take profit")
                ),
            );
            attachExits(a, x, pos.qty, sl, tp, replayRef.current!.t);
          }),
      };
    }
    return {
      acct: live,
      now: clockOf(live, real),
      mode,
      replay: false,
      place: (o) => placeTrade(key, o),
      cancel: (id) => cancelOrder(key, id),
      close: (x) => closePosition(key, x),
      setExits: (x, sl, tp) => setExits(key, x, sl, tp),
    };
  }, [replay, live, real, mode, key]);

  const { acct, now } = desk;
  const tf = TIMEFRAMES.find((t) => t.id === tfId)!.ms;
  const q = useMemo(() => quote(sym, now, mode), [sym, now, mode]);
  const val = valueOf(acct, now);

  const lines: ChartLine[] = useMemo(() => {
    const out: ChartLine[] = (hlines[sym] ?? []).map((p) => ({
      price: p,
      label: "",
      color: "#787b86",
    }));
    const pos = acct.positions[sym];
    if (pos)
      out.push({
        price: pos.avg,
        label: `Position ${fmtQty(pos.qty)} @ avg${pos.lev ? ` · ${pos.lev}×` : ""}`,
        color: "#2962ff",
      });
    if (pos?.lev)
      out.push({
        price: liqPrice(pos.avg, pos.lev),
        label: `Liquidation ${pos.lev}×`,
        color: "#9c27b0",
        dashed: true,
      });
    for (const o of acct.orders) {
      if (o.sym !== sym) continue;
      const color =
        o.label === "Stop loss"
          ? "#f23645"
          : o.label === "Take profit"
            ? "#089981"
            : "#ff9800";
      out.push({
        price: o.price,
        label: `${o.label ?? o.type} ${fmtQty(o.qty)}`,
        color,
        dashed: true,
      });
    }
    return out;
  }, [hlines, sym, acct.positions, acct.orders]);

  if (!open) {
    return (
      <div className="view">
        <section className="hero h-trade">
          <span className="tag">Trading simulator</span>
          <h1>Live trading, virtual money</h1>
          <p>
            A full charting and order screen with live simulated prices,
            indicators and order types.
          </p>
        </section>
        <div className="card center">
          <div className="lockbig">
            <Icon name="lock" size={34} />
          </div>
          <h3>Unlocks at the {tier.name} tier</h3>
          <p className="muted">
            Reach <b className="num">{tier.at} XP</b> to open the trading
            simulator. You have <b className="num">{s.xp} XP</b>, so{" "}
            {Math.max(0, tier.at - s.xp)} to go.
          </p>
          <div className="bar pri" style={{ width: "100%" }}>
            <i style={{ width: `${Math.min(100, (s.xp / tier.at) * 100)}%` }} />
          </div>
          <p className="muted small">
            Trading is fast and risky. The Investor lessons cover candles, P/E,
            indicators and order types first, so you know what you are looking
            at.
          </p>
          <button className="btn" onClick={onLearn}>
            Go to lessons
          </button>
        </div>
      </div>
    );
  }

  const pick = (fn: (p: number) => void) => {
    setTool(false);
    setPickFor(() => fn);
  };
  const startReplay = (span: (typeof SPANS)[number]) => {
    const end = clockOf(live, Date.now());
    const from = end - span.ms;
    setReplay({
      span: span.label,
      from,
      end,
      t: from,
      speed: DEFAULT_SPEED[span.id],
      playing: false,
      acct: { ...freshAccount(live.cash, live.mode), checked: from },
    });
    setTab("positions");
  };
  const forward = (span: (typeof SPANS)[number]) =>
    setFwd(fastForward(key, span.ms));
  const pristine =
    !live.chosen &&
    !live.history.length &&
    !live.orders.length &&
    !Object.keys(live.positions).length;
  const symOpen = marketOpen(acct, sym, now);
  const groups: [string, typeof TRADABLE][] = [
    ["Shares", TRADABLE.filter((i) => i.kind === "stock")],
    ["Funds", TRADABLE.filter((i) => i.kind === "fund")],
    ["Crypto (24h)", TRADABLE.filter((i) => i.kind === "crypto")],
    ["Commodities (24h)", TRADABLE.filter((i) => i.kind === "commodity")],
  ];

  return (
    <DeskCtx.Provider value={desk}>
      <div className="tv">
        <div className="tv-modes">
          <div className="tv-tfs" role="group" aria-label="Market">
            <button
              className={mode === "24h" && view === "desk" ? "on" : ""}
              disabled={!!replay}
              onClick={() => (setTradeMode("24h"), setView("desk"))}
            >
              24-hour market
            </button>
            <button
              className={mode === "uk" && view === "desk" ? "on" : ""}
              disabled={!!replay}
              onClick={() => (setTradeMode("uk"), setView("desk"))}
            >
              UK market hours
            </button>
            <button
              className={view === "news" ? "on" : ""}
              onClick={() => setView(view === "news" ? "desk" : "news")}
            >
              📰 News
            </button>
          </div>
          <span className={"tv-status " + (symOpen ? "open" : "shut")}>
            {mode === "24h" || is24h(sym)
              ? "● Open 24/7"
              : isOpenUk(now)
                ? "● London open · closes 16:30"
                : `● London closed · opens ${when(nextOpenUk(now))}`}
          </span>
          <span className="muted small num">
            {replay
              ? "Replay time"
              : (live.offset ?? 0) > 0
                ? "Account clock (fast-forwarded)"
                : "UK time"}
            : {when(now)}
          </span>
          <span className="grow" />
          {(replay || (live.offset ?? 0) > 0) && (
            <TodayButton
              onReplay={replay ? () => setReplay(null) : undefined}
              onToday={() => backToToday(key)}
            />
          )}
          {!replay && (
            <>
              <details className="tv-menu">
                <summary>⏪ Replay</summary>
                <div className="tv-pop right">
                  <p className="muted small">
                    Play back the past with a practice account. Nothing you do
                    in a replay is saved.
                  </p>
                  {SPANS.map((sp) => (
                    <button
                      key={sp.id}
                      className="tv-btn"
                      onClick={(e) => (
                        startReplay(sp),
                        (
                          e.currentTarget.closest(
                            "details",
                          ) as HTMLDetailsElement
                        ).removeAttribute("open")
                      )}
                    >
                      Replay the last {sp.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </details>
              <details className="tv-menu">
                <summary>⏩ Fast-forward</summary>
                <div className="tv-pop right">
                  <p className="muted small">
                    Moves this account’s clock forward and shows what happened
                    to your positions and orders. You can’t go back.
                  </p>
                  {SPANS.map((sp) => (
                    <button
                      key={sp.id}
                      className="tv-btn"
                      onClick={(e) => (
                        forward(sp),
                        (
                          e.currentTarget.closest(
                            "details",
                          ) as HTMLDetailsElement
                        ).removeAttribute("open")
                      )}
                    >
                      Skip 1 {sp.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>

        {replay && (
          <ReplayBar r={replay} set={setReplay} startCash={live.cash} />
        )}
        {view === "news" && (
          <News
            sym={sym}
            onSym={(x) => (setSym(x), setView("desk"))}
            watch={s.watchlist}
          />
        )}
        {view === "desk" && !replay && pristine && (
          <StartBox mode={mode} acct={live} first />
        )}

        {view === "desk" && (
          <>
            <div className="tv-top">
              <label className="tv-sym">
                <span className="sr-only">Symbol</span>
                <select value={sym} onChange={(e) => setSym(e.target.value)}>
                  {groups.map(([g, list]) => (
                    <optgroup key={g} label={g}>
                      {list.map((i) => (
                        <option key={i.sym} value={i.sym}>
                          {i.sym} · {i.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="tv-price num">
                <b>{fmtP(q.price)}</b>
                <span className={q.chg >= 0 ? "up" : "down"}>
                  {q.chg >= 0 ? "+" : "−"}
                  {fmtP(Math.abs(q.chg))} ({pctS(q.chgPct)})
                </span>
                <span
                  className="tv-live"
                  title={replay ? "Replaying" : "Prices update every second"}
                >
                  {replay ? "● Replay" : symOpen ? "● Live sim" : "● Closed"}
                </span>
              </div>
              <div className="tv-tfs" role="group" aria-label="Timeframe">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.id}
                    className={t.id === tfId ? "on" : ""}
                    onClick={() => setTfId(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <label className="tv-ctl">
                <span className="sr-only">Chart type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ChartType)}
                >
                  <option value="candles">Candles</option>
                  <option value="hollow">Hollow candles</option>
                  <option value="heikin">Heikin Ashi</option>
                  <option value="bars">Bars (OHLC)</option>
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                </select>
              </label>
              <details className="tv-menu">
                <summary>Indicators ({ind.size})</summary>
                <div className="tv-pop">
                  {INDICATORS.map((i) => (
                    <label key={i.id} className="tv-check">
                      <input
                        type="checkbox"
                        checked={ind.has(i.id)}
                        onChange={() => {
                          const n = new Set(ind);
                          if (n.has(i.id)) n.delete(i.id);
                          else n.add(i.id);
                          setInd(n);
                        }}
                      />
                      {i.label}
                    </label>
                  ))}
                </div>
              </details>
              <button
                className={"tv-btn" + (tool ? " on" : "")}
                onClick={() => (setPickFor(null), setTool(!tool))}
                title="Click the chart to draw a horizontal line"
              >
                ─ H-line
              </button>
              {(hlines[sym]?.length ?? 0) > 0 && (
                <button
                  className="tv-btn"
                  onClick={() => setHlines({ ...hlines, [sym]: [] })}
                >
                  Clear lines
                </button>
              )}
              <button
                className={"tv-btn" + (s.watchlist.includes(sym) ? " on" : "")}
                onClick={() => toggleWatch(sym)}
              >
                {s.watchlist.includes(sym) ? "★ Watching" : "☆ Watch"}
              </button>
            </div>

            {(tool || pickFor) && (
              <div className="tv-hint">
                {pickFor
                  ? "Click the chart to set the price."
                  : "Click the chart to place a horizontal line (support or resistance). Click H-line again to stop."}
              </div>
            )}

            <div className="tv-body">
              <div className="tv-chart">
                <PriceChart
                  sym={sym}
                  tf={tf}
                  type={type}
                  ind={ind}
                  now={now}
                  mode={mode}
                  lines={lines}
                  height={Math.min(
                    560,
                    Math.max(380, window.innerHeight - 330),
                  )}
                  onPick={
                    pickFor
                      ? (p) => {
                          pickFor(p);
                          setPickFor(null);
                        }
                      : tool
                        ? (p) =>
                            setHlines({
                              ...hlines,
                              [sym]: [...(hlines[sym] ?? []), p],
                            })
                        : undefined
                  }
                />
                <p className="tv-foot muted small">
                  Scroll to zoom · drag to pan · double-click to reset · all
                  prices are simulated, companies are invented
                  {mode === "uk"
                    ? " · closed hours are hidden for shares and funds"
                    : ""}
                  .
                </p>
              </div>

              <aside className="tv-side">
                <Watchlist sym={sym} onPick={setSym} list={s.watchlist} />
                <Ticket key={sym + mode + !!replay} sym={sym} pick={pick} />
                <SymbolInfo sym={sym} q={q} />
              </aside>
            </div>

            <div className="tv-bottom">
              <div className="tv-tabs" role="tablist">
                {(
                  [
                    [
                      "positions",
                      `Positions (${Object.keys(acct.positions).length})`,
                    ],
                    ["orders", `Orders (${acct.orders.length})`],
                    ["history", "History"],
                    ["account", "Account"],
                    ["resources", "Resources"],
                  ] as [BottomTab, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    className={tab === id ? "on" : ""}
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
                <span className="grow" />
                <span className="tv-eq num">
                  {replay && <b className="tv-practice">Practice</b>} Equity{" "}
                  <b>{money(r2(val.value))}</b> · Cash <b>{money(acct.cash)}</b>{" "}
                  · P&L{" "}
                  <b className={val.unrealised >= 0 ? "up" : "down"}>
                    {money(r2(val.unrealised))}
                  </b>
                </span>
              </div>
              <div className="tv-panel">
                {tab === "positions" && <Positions onSym={setSym} />}
                {tab === "orders" && <Orders />}
                {tab === "history" && <History />}
                {tab === "account" && <AccountTab />}
                {tab === "resources" && <Resources sym={sym} />}
              </div>
            </div>
          </>
        )}
      </div>
      {fwd && <ForwardModal r={fwd} onClose={() => setFwd(null)} />}
    </DeskCtx.Provider>
  );
}

/* ------------------------------------------------------- replay, forward, start */

/** Jump straight back to the present. Leaving a replay is harmless; undoing a fast-forward wipes what happened since, so it asks twice. */
function TodayButton({
  onReplay,
  onToday,
}: {
  onReplay?: () => void;
  onToday: () => void;
}) {
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const id = setTimeout(() => setSure(false), 4000);
    return () => clearTimeout(id);
  }, [sure]);
  return (
    <button
      className={"tv-btn" + (sure ? " sell" : " on")}
      onClick={() => {
        if (onReplay) return onReplay();
        if (!sure) return setSure(true);
        onToday();
        setSure(false);
      }}
      title="Return to the present day"
    >
      {sure
        ? "Tap again: undo everything since you fast-forwarded"
        : "⏺ Back to today"}
    </button>
  );
}

function ReplayBar({
  r,
  set,
  startCash,
}: {
  r: Replay;
  set: (r: Replay | null) => void;
  startCash: number;
}) {
  const v = valueOf(r.acct, r.t).value;
  const done = r.t >= r.end;
  return (
    <div className="tv-replay">
      <b>⏪ Replay: last {r.span.toLowerCase()}</b>
      <button
        className="tv-btn"
        disabled={done}
        onClick={() => set({ ...r, playing: !r.playing })}
      >
        {r.playing ? "❚❚ Pause" : "▶ Play"}
      </button>
      <label className="tv-ctl">
        <span className="sr-only">Replay speed</span>
        <select
          value={r.speed}
          onChange={(e) => set({ ...r, speed: Number(e.target.value) })}
        >
          {SPEEDS.map((sp, i) => (
            <option key={sp.label} value={i}>
              {sp.label}
            </option>
          ))}
        </select>
      </label>
      <div
        className="bar grow"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(((r.t - r.from) / (r.end - r.from)) * 100)}
      >
        <i style={{ width: `${((r.t - r.from) / (r.end - r.from)) * 100}%` }} />
      </div>
      <span className="num small">
        Practice P&L{" "}
        <b className={v >= startCash ? "up" : "down"}>
          {money(r2(v - startCash))}
        </b>
      </span>
      {done && <b className="small">Replay finished</b>}
      <button className="tv-btn sell" onClick={() => set(null)}>
        Exit replay
      </button>
    </div>
  );
}

function ForwardModal({
  r,
  onClose,
}: {
  r: ForwardResult;
  onClose: () => void;
}) {
  const chg = r.after - r.before;
  return (
    <div
      className="t2-sheetwrap"
      role="dialog"
      aria-modal="true"
      aria-label="Fast-forward results"
    >
      <div className="t2-sheet">
        <h2>⏩ Fast-forward results</h2>
        <p className="muted small">
          {when(r.from)} → {when(r.to)}
        </p>
        <div className="t2-grid num">
          <div>
            <span className="muted small">Account value before</span>
            <b>{money(r2(r.before))}</b>
          </div>
          <div>
            <span className="muted small">Account value after</span>
            <b>{money(r2(r.after))}</b>
          </div>
          <div>
            <span className="muted small">Change</span>
            <b className={chg >= 0 ? "up" : "down"}>
              {chg >= 0 ? "+" : "−"}
              {money(Math.abs(r2(chg)))} ({pctS(r.before ? chg / r.before : 0)})
            </b>
          </div>
          <div>
            <span className="muted small">Orders filled</span>
            <b>{r.fills.length}</b>
          </div>
        </div>
        {r.fills.length > 0 && (
          <div className="log">
            {r.fills.map((f) => (
              <div key={f.id}>
                <span>
                  <b className={f.side === "buy" ? "up" : "down"}>
                    {f.note ?? f.side}
                  </b>{" "}
                  {f.sym} · {fmtQty(f.qty)} @ {fmtP(f.price)}
                </span>
                {f.pnl !== undefined && (
                  <span className={f.pnl >= 0 ? "up" : "down"}>
                    {money(f.pnl)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <button className="btn wide" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}

/** Choose a trading account's starting balance: £10 up to £100,000 (admin: £1,000,000,000) in £10 steps. */
function StartBox({
  mode,
  acct,
  first,
}: {
  mode: MarketMode;
  acct: Account;
  first?: boolean;
}) {
  const [amt, setAmt] = useState(acct.start ?? TRADING_START_CASH);
  const [sure, setSure] = useState(false);
  return (
    <div className={"tv-box tv-start" + (first ? " first" : "")}>
      <h3>
        {first
          ? `Set your starting balance (${mode === "uk" ? "UK market hours" : "24-hour market"})`
          : "Start again with a new balance"}
      </h3>
      <div className="tv-startamt num">{money(amt)}</div>
      <MoneySlider
        id={"trade-start-" + mode}
        label="Starting balance in pounds"
        value={amt}
        min={TRADE_MIN_START}
        max={TRADE_MAX_START}
        onChange={(n) => (setAmt(n), setSure(false))}
        typed
      />
      <button
        className={"tv-btn" + (sure ? " sell" : " on")}
        onClick={() => {
          if (!first && !sure) return setSure(true);
          startTrading(keyFor(mode), amt);
          setSure(false);
        }}
      >
        {sure
          ? "Tap again: this clears positions, orders and history"
          : `Start with ${money(amt)}`}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- watchlist */

function Watchlist({
  sym,
  onPick,
  list,
}: {
  sym: string;
  onPick: (s: string) => void;
  list: string[];
}) {
  const { now, mode } = useDesk();
  return (
    <div className="tv-box">
      <h3>Watchlist</h3>
      <table className="tv-table wl">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Last</th>
            <th>Chg%</th>
          </tr>
        </thead>
        <tbody>
          {list
            .filter((x) => BY_SYM[x])
            .map((x) => {
              const p = priceAt(x, now, mode);
              const prev = priceAt(x, now - DAY, mode);
              const r = (p - prev) / prev;
              return (
                <tr
                  key={x}
                  className={x === sym ? "sel" : ""}
                  onClick={() => onPick(x)}
                >
                  <td>
                    <b>{x}</b>
                  </td>
                  <td className="num">{fmtP(p)}</td>
                  <td className={"num " + (r >= 0 ? "up" : "down")}>
                    {pctS(r)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------- order ticket */

function Ticket({
  sym,
  pick,
}: {
  sym: string;
  pick: (fn: (p: number) => void) => void;
}) {
  const d = useDesk();
  const { acct, now } = d;
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<OrderType>("market");
  const [qty, setQty] = useState("10");
  const [price, setPrice] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [lev, setLev] = useState(1);
  const px = priceAt(sym, now, d.mode);
  const held = acct.positions[sym]?.qty ?? 0;
  const closedNow = !marketOpen(acct, sym, now);
  const n = parseFloat(qty) || 0;
  const entry = type === "market" ? px : parseFloat(price) || px;
  const value = n * entry;
  const fee = value * TRADE_FEE_RATE;
  const heldLev = acct.positions[sym]?.lev ?? 1;
  const L = side === "buy" ? lev : heldLev;
  const margin = value / L;
  const slN = parseFloat(sl);
  const tpN = parseFloat(tp);
  const risk = side === "buy" && slN > 0 ? (entry - slN) * n : null;
  const reward = side === "buy" && tpN > 0 ? (tpN - entry) * n : null;
  const equity = valueOf(acct, now).value;

  function submit() {
    d.place({
      sym,
      side,
      type,
      qty: n,
      price: type === "market" ? undefined : parseFloat(price),
      lev: side === "buy" ? lev : undefined,
      stopLoss:
        side === "buy" && type === "market" && slN > 0 ? slN : undefined,
      takeProfit:
        side === "buy" && type === "market" && tpN > 0 ? tpN : undefined,
    });
  }

  return (
    <div className="tv-box ticket">
      <div className="seg">
        <button
          className={"b" + (side === "buy" ? " on" : "")}
          onClick={() => setSide("buy")}
        >
          Buy
          <small className="num">{fmtP(px)}</small>
        </button>
        <button
          className={"s" + (side === "sell" ? " on" : "")}
          onClick={() => setSide("sell")}
        >
          Sell
          <small className="num">{fmtP(px)}</small>
        </button>
      </div>
      <div className="tv-tfs full" role="group" aria-label="Order type">
        {(["market", "limit", "stop"] as OrderType[]).map((t) => (
          <button
            key={t}
            className={type === t ? "on" : ""}
            onClick={() => setType(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {type !== "market" && (
        <label className="tv-field">
          <span>
            {type === "limit"
              ? side === "buy"
                ? "Buy at or below"
                : "Sell at or above"
              : side === "buy"
                ? "Buy when price rises to"
                : "Sell when price falls to"}
          </span>
          <div className="row nowrap">
            <input
              inputMode="decimal"
              value={price}
              placeholder={fmtP(px)}
              onChange={(e) => setPrice(e.target.value)}
            />
            <button
              className="tv-btn"
              onClick={() => pick((p) => setPrice(String(p)))}
              title="Pick from chart"
            >
              ⌖
            </button>
          </div>
        </label>
      )}
      {side === "buy" && (
        <div className="tv-field">
          <span>Leverage</span>
          <div className="tv-tfs full" role="group" aria-label="Leverage">
            {LEVERAGE.map((x) => (
              <button
                key={x}
                className={lev === x ? "on" + (x >= 25 ? " hot" : "") : ""}
                onClick={() => setLev(x)}
              >
                {x === 1 ? "None" : `${x}×`}
              </button>
            ))}
          </div>
          {lev > 1 && (
            <p className="small down" style={{ margin: 0 }}>
              {lev}× multiplies gains and losses. A{" "}
              {(100 / lev).toFixed(lev >= 25 ? 1 : 0)}% fall wipes out your
              margin and the position is closed (liquidated). Real UK brokers
              cap retail leverage far lower, e.g. 5× on shares and 2× on crypto.
            </p>
          )}
        </div>
      )}
      <label className="tv-field">
        <span>
          Quantity{" "}
          {side === "sell" && (
            <em className="muted">(you hold {fmtQty(held)})</em>
          )}
        </span>
        <div className="row nowrap">
          <input
            inputMode="decimal"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          {side === "sell" && held > 0 && (
            <button className="tv-btn" onClick={() => setQty(String(held))}>
              All
            </button>
          )}
        </div>
      </label>
      {side === "buy" && type === "market" && (
        <>
          <div className="row nowrap">
            <label className="tv-field grow">
              <span className="down">Stop loss</span>
              <div className="row nowrap">
                <input
                  inputMode="decimal"
                  value={sl}
                  placeholder="optional"
                  onChange={(e) => setSl(e.target.value)}
                />
                <button
                  className="tv-btn"
                  onClick={() => pick((p) => setSl(String(p)))}
                  title="Pick from chart"
                >
                  ⌖
                </button>
              </div>
            </label>
            <label className="tv-field grow">
              <span className="up">Take profit</span>
              <div className="row nowrap">
                <input
                  inputMode="decimal"
                  value={tp}
                  placeholder="optional"
                  onChange={(e) => setTp(e.target.value)}
                />
                <button
                  className="tv-btn"
                  onClick={() => pick((p) => setTp(String(p)))}
                  title="Pick from chart"
                >
                  ⌖
                </button>
              </div>
            </label>
          </div>
          {slN > 0 && slN < px && (
            <div className="row nowrap small">
              <span className="muted">Size so the stop risks</span>
              <input
                className="mini"
                inputMode="decimal"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                aria-label="Risk percent"
              />
              <span className="muted">%</span>
              <button
                className="tv-btn"
                onClick={() =>
                  setQty(
                    String(positionSize(equity, parseFloat(riskPct), px, slN)),
                  )
                }
              >
                Apply
              </button>
            </div>
          )}
        </>
      )}
      <dl className="tv-dl num small">
        <dt>{L > 1 ? "Exposure" : "Value"}</dt>
        <dd>{money(Math.round(value * 100) / 100)}</dd>
        {L > 1 && side === "buy" && (
          <>
            <dt>Margin needed ({L}×)</dt>
            <dd>{money(r2(margin))}</dd>
            <dt>Liquidation price</dt>
            <dd className="down">{fmtP(liqPrice(entry, L))}</dd>
          </>
        )}
        <dt>Commission (0.1%)</dt>
        <dd>{money(Math.round(fee * 100) / 100)}</dd>
        <dt>Cash available</dt>
        <dd>{money(acct.cash)}</dd>
        {risk !== null && (
          <>
            <dt>Risk to stop</dt>
            <dd className="down">
              {money(Math.round(risk * 100) / 100)} (
              {((risk / equity) * 100).toFixed(2)}%)
            </dd>
          </>
        )}
        {reward !== null && (
          <>
            <dt>Reward to target</dt>
            <dd className="up">{money(Math.round(reward * 100) / 100)}</dd>
          </>
        )}
        {risk !== null && reward !== null && risk > 0 && (
          <>
            <dt>Reward : risk</dt>
            <dd>{(reward / risk).toFixed(2)} : 1</dd>
          </>
        )}
      </dl>
      {closedNow && type === "market" && (
        <p className="down small">
          The London market is closed. Use a limit or stop order; it can fill
          from the next open.
        </p>
      )}
      <button
        className={"btn wide " + (side === "buy" ? "tv-buy" : "tv-sell")}
        disabled={closedNow && type === "market"}
        onClick={submit}
      >
        {side === "buy" ? "Buy" : "Sell"} {qty || 0} {sym}{" "}
        {side === "buy" && lev > 1 ? `${lev}× ` : ""}
        {type === "market" ? "at market" : `${type} @ ${price || "…"}`}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- info box */

function SymbolInfo({ sym, q }: { sym: string; q: ReturnType<typeof quote> }) {
  const ins = BY_SYM[sym];
  const pos = (q.price - q.yearLo) / (q.yearHi - q.yearLo || 1);
  return (
    <div className="tv-box">
      <h3>
        {ins.name} <span className="muted small">{ins.sector}</span>
      </h3>
      <p className="muted small">{ins.desc}</p>
      <dl className="tv-dl num small">
        <dt>Day range</dt>
        <dd>
          {fmtP(q.dayLo)} – {fmtP(q.dayHi)}
        </dd>
        <dt>52-week range</dt>
        <dd>
          {fmtP(q.yearLo)} – {fmtP(q.yearHi)}
        </dd>
      </dl>
      <div className="range52" aria-hidden="true">
        <i style={{ left: `${Math.max(0, Math.min(100, pos * 100))}%` }} />
      </div>
      <dl className="tv-dl num small">
        {q.marketCap !== null && (
          <>
            <dt>Market cap</dt>
            <dd>{big(q.marketCap)}</dd>
          </>
        )}
        <dt>P/E ratio</dt>
        <dd>{q.pe !== null ? q.pe.toFixed(1) : "n/a"}</dd>
        <dt>EPS</dt>
        <dd>{ins.eps !== undefined ? "£" + ins.eps.toFixed(2) : "n/a"}</dd>
        <dt>Earnings yield</dt>
        <dd>
          {q.earningsYield !== null
            ? (q.earningsYield * 100).toFixed(2) + "%"
            : "n/a"}
        </dd>
        <dt>Dividend yield</dt>
        <dd>
          {q.divYield !== null ? (q.divYield * 100).toFixed(2) + "%" : "n/a"}
        </dd>
        {ins.ocf !== undefined && (
          <>
            <dt>OCF</dt>
            <dd>{(ins.ocf * 100).toFixed(2)}%</dd>
          </>
        )}
        <dt>Volatility (yearly)</dt>
        <dd>{Math.round(ins.vol * 100)}%</dd>
      </dl>
    </div>
  );
}

/* ----------------------------------------------------------- bottom panels */

function Positions({ onSym }: { onSym: (s: string) => void }) {
  const d = useDesk();
  const { acct, now } = d;
  const rows = Object.entries(acct.positions);
  if (!rows.length)
    return (
      <p className="muted small pad">
        No open positions. Use the order ticket to buy.
      </p>
    );
  return (
    <div className="tv-scroll">
      <table className="tv-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Qty</th>
            <th>Avg price</th>
            <th>Last</th>
            <th>Leverage</th>
            <th>Liq. price</th>
            <th>Value</th>
            <th>Unrealised P&L</th>
            <th>Stop loss</th>
            <th>Take profit</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(([sym, p]) => {
            const last = priceAt(sym, now, d.mode);
            const pnl = (last - p.avg) * p.qty;
            const sl = acct.orders.find(
              (o) => o.sym === sym && o.label === "Stop loss",
            );
            const tp = acct.orders.find(
              (o) => o.sym === sym && o.label === "Take profit",
            );
            return (
              <tr key={sym}>
                <td>
                  <button className="linkish" onClick={() => onSym(sym)}>
                    {sym}
                  </button>
                </td>
                <td className="num">{fmtQty(p.qty)}</td>
                <td className="num">{fmtP(p.avg)}</td>
                <td className="num">{fmtP(last)}</td>
                <td className="num">{p.lev ? `${p.lev}×` : "–"}</td>
                <td className="num down">
                  {p.lev ? fmtP(liqPrice(p.avg, p.lev)) : "–"}
                </td>
                <td className="num">
                  {money(
                    r2(
                      p.lev
                        ? Math.max(0, (p.qty * p.avg) / p.lev + pnl)
                        : last * p.qty,
                    ),
                  )}
                </td>
                <td className={"num " + (pnl >= 0 ? "up" : "down")}>
                  {money(Math.round(pnl * 100) / 100)} (
                  {pctS(((last - p.avg) / p.avg) * (p.lev ?? 1))})
                </td>
                <td>
                  <ExitInput
                    value={sl?.price}
                    onSet={(v) => d.setExits(sym, v, tp?.price)}
                  />
                </td>
                <td>
                  <ExitInput
                    value={tp?.price}
                    onSet={(v) => d.setExits(sym, sl?.price, v)}
                  />
                </td>
                <td>
                  <button className="tv-btn sell" onClick={() => d.close(sym)}>
                    Close
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ExitInput({
  value,
  onSet,
}: {
  value?: number;
  onSet: (v: number | undefined) => void;
}) {
  const [v, setV] = useState(value !== undefined ? String(value) : "");
  return (
    <input
      className="mini"
      inputMode="decimal"
      value={v}
      placeholder="–"
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const n = parseFloat(v);
        onSet(n > 0 ? n : undefined);
      }}
      onKeyDown={(e) =>
        e.key === "Enter" && (e.target as HTMLInputElement).blur()
      }
    />
  );
}

function Orders() {
  const d = useDesk();
  const { acct, now } = d;
  if (!acct.orders.length)
    return (
      <p className="muted small pad">
        No pending orders. Limit and stop orders wait here until the price
        reaches them.
      </p>
    );
  return (
    <div className="tv-scroll">
      <table className="tv-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Order</th>
            <th>Side</th>
            <th>Qty</th>
            <th>Trigger</th>
            <th>Last</th>
            <th>Distance</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {acct.orders.map((o) => {
            const last = priceAt(o.sym, now, d.mode);
            return (
              <tr key={o.id}>
                <td>
                  <b>{o.sym}</b>
                </td>
                <td>{o.label ?? o.type}</td>
                <td className={o.side === "buy" ? "up" : "down"}>{o.side}</td>
                <td className="num">{fmtQty(o.qty)}</td>
                <td className="num">{fmtP(o.price)}</td>
                <td className="num">{fmtP(last)}</td>
                <td className="num">{pctS((o.price - last) / last)}</td>
                <td>
                  <button className="tv-btn" onClick={() => d.cancel(o.id)}>
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function History() {
  const { acct } = useDesk();
  if (!acct.history.length)
    return <p className="muted small pad">No trades yet.</p>;
  return (
    <div className="tv-scroll">
      <table className="tv-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Fee</th>
            <th>Realised P&L</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {acct.history.slice(0, 200).map((f) => (
            <tr key={f.id}>
              <td className="num">
                {when(f.t, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td>
                <b>{f.sym}</b>
              </td>
              <td className={f.side === "buy" ? "up" : "down"}>{f.side}</td>
              <td className="num">{fmtQty(f.qty)}</td>
              <td className="num">{fmtP(f.price)}</td>
              <td className="num">{money(f.fee)}</td>
              <td
                className={
                  "num " +
                  (f.pnl === undefined ? "" : f.pnl >= 0 ? "up" : "down")
                }
              >
                {f.pnl === undefined ? "–" : money(f.pnl)}
              </td>
              <td className="muted">{f.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountTab() {
  const { acct, now, mode, replay } = useDesk();
  const v = valueOf(acct, now);
  const sells = acct.history.filter((f) => f.pnl !== undefined);
  const wins = sells.filter((f) => (f.pnl ?? 0) > 0).length;
  const fees = acct.history.reduce((a, f) => a + f.fee, 0);
  const start = acct.start ?? TRADING_START_CASH;
  const ret = (v.value - start) / start;
  return (
    <div className="tv-stats">
      {[
        ["Market", mode === "uk" ? "UK market hours" : "24-hour market"],
        ["Started with", money(start) + (replay ? " (practice)" : "")],
        ["Equity", money(r2(v.value))],
        ["Cash", money(acct.cash)],
        ["In positions", money(r2(v.invested))],
        ["Unrealised P&L", money(r2(v.unrealised))],
        ["Realised P&L", money(acct.realised)],
        ["Total return", pctS(ret)],
        ["Closed trades", String(sells.length)],
        [
          "Win rate",
          sells.length ? Math.round((wins / sells.length) * 100) + "%" : "–",
        ],
        ["Fees paid", money(r2(fees))],
        ...(!replay && (acct.offset ?? 0) > 0
          ? [
              [
                "Fast-forwarded",
                `${Math.round((acct.offset ?? 0) / HOUR / 24)} days ahead`,
              ],
            ]
          : []),
      ].map(([k, val]) => (
        <div key={k} className="tile">
          <span className="muted small">{k}</span>
          <b className="num">{val}</b>
        </div>
      ))}
      {!replay && <StartBox mode={mode} acct={acct} />}
    </div>
  );
}

/* --------------------------------------------------------------------- news */

function News({
  sym,
  onSym,
  watch,
}: {
  sym: string;
  onSym: (s: string) => void;
  watch: string[];
}) {
  const { now } = useDesk();
  const [scope, setScope] = useState<"all" | "sym" | "watch">("all");
  const items = useMemo(() => {
    const all = recentNews(now, 7, scope === "sym" ? sym : undefined);
    return scope === "watch" ? all.filter((n) => watch.includes(n.sym)) : all;
  }, [Math.floor(now / MIN), scope, sym, watch]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="tv-news">
      <div className="row" style={{ gap: 8 }}>
        <div className="tv-tfs" role="group" aria-label="News filter">
          {(
            [
              ["all", "All companies"],
              ["sym", sym],
              ["watch", "Watchlist"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={scope === id ? "on" : ""}
              onClick={() => setScope(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="muted small">
          At least two stories every day. A day’s news moves the price the next
          day: shares at the next open, crypto over the next day. Tap a ticker
          to open its chart.
        </span>
      </div>
      {items.length === 0 && (
        <p className="muted small pad">No news in the last week.</p>
      )}
      {items.slice(0, 120).map((n) => (
        <article key={n.id} className={"tv-story " + n.tone}>
          <span className="num muted small">{when(n.t)}</span>
          <button className="linkish" onClick={() => onSym(n.sym)}>
            {n.sym}
          </button>
          <div className="grow">
            <b>{n.headline}</b>
            {n.body && <p className="muted small">{n.body}</p>}
          </div>
          <span
            className={
              "t2-pill " +
              (n.tone === "good" ? "upbg" : n.tone === "bad" ? "downbg" : "")
            }
          >
            {n.tone === "good"
              ? "Positive"
              : n.tone === "bad"
                ? "Negative"
                : "Company news"}
            {n.major && n.tone !== "neutral" ? " · major" : ""}
          </span>
        </article>
      ))}
    </div>
  );
}

function Resources({ sym }: { sym: string }) {
  const [eq, setEq] = useState("25000");
  const [risk, setRisk] = useState("1");
  const { now, mode } = useDesk();
  const [entry, setEntry] = useState(() => String(priceAt(sym, now, mode)));
  const [stop, setStop] = useState("");
  const units = positionSize(
    parseFloat(eq),
    parseFloat(risk),
    parseFloat(entry),
    parseFloat(stop),
  );
  return (
    <div className="tv-res">
      <div className="tv-box calc">
        <h3>Position size calculator</h3>
        <div className="calc-grid">
          <label className="tv-field">
            <span>Account (£)</span>
            <input
              inputMode="decimal"
              value={eq}
              onChange={(e) => setEq(e.target.value)}
            />
          </label>
          <label className="tv-field">
            <span>Risk per trade (%)</span>
            <input
              inputMode="decimal"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
            />
          </label>
          <label className="tv-field">
            <span>Entry price</span>
            <input
              inputMode="decimal"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </label>
          <label className="tv-field">
            <span>Stop price</span>
            <input
              inputMode="decimal"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
            />
          </label>
        </div>
        <p className="num">
          Buy up to <b>{units.toLocaleString("en-GB")}</b> units. If the stop is
          hit you lose about{" "}
          <b>
            {money(
              Math.round(
                units *
                  Math.abs(parseFloat(entry) - parseFloat(stop) || 0) *
                  100,
              ) / 100,
            )}
          </b>
          .
        </p>
      </div>
      {RESOURCES.map((sec) => (
        <details key={sec.id} className="tv-box res">
          <summary>
            <h3>{sec.title}</h3>
          </summary>
          <dl>
            {sec.items.map((it) => (
              <div key={it.term}>
                <dt>{it.term}</dt>
                <dd>{it.body}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </div>
  );
}
