import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoneySlider } from '../components/MoneySlider';
import { Spark } from '../components/Spark';
import { PORTFOLIO_TIER, canPortfolio } from '../lib/access';
import { LADDER, PORTFOLIO_MAX_START } from '../lib/config';
import { gbp, money } from '../lib/format';
import { BY_SYM, DAY, INVESTABLE, priceAt, quote, series } from '../lib/market';
import { fmtQty, valueOf } from '../lib/trading';
import { portfolioTrade, startPortfolio } from '../state/actions';
import { useStore } from '../state/store';
import { Icon } from '../ui/Icon';
import { useNow } from '../ui/useNow';

const RANGES = [
  { id: '1W', ms: 7 * DAY },
  { id: '1M', ms: 30 * DAY },
  { id: '6M', ms: 182 * DAY },
  { id: '1Y', ms: 365 * DAY },
  { id: '5Y', ms: 5 * 365 * DAY },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

const COLORS = ['#6a45e8', '#17a567', '#1f6fd1', '#ff9f1c', '#d6368a', '#00a5a8', '#e5484d', '#8f6b00', '#5b8def', '#9c27b0', '#2e7d32'];
const colorOf = (sym: string) => COLORS[INVESTABLE.findIndex((i) => i.sym === sym) % COLORS.length];
const pctS = (r: number) => `${r >= 0 ? '+' : '−'}${Math.abs(r * 100).toFixed(2)}%`;
const p2 = (n: number) => Math.round(n * 100) / 100;
/** £ with sign, e.g. +£12.40 / −£3. */
const signed = (n: number) => (p2(n) >= 0 ? '+' : '−') + money(Math.abs(p2(n)));

function Logo({ sym, size = 40 }: { sym: string; size?: number }) {
  return (
    <span className="t2-logo" style={{ background: colorOf(sym), width: size, height: size, fontSize: size * 0.32 }} aria-hidden="true">
      {sym.slice(0, 4)}
    </span>
  );
}

export function Portfolio() {
  const s = useStore();
  const now = useNow(5000);
  const [tab, setTab] = useState<'portfolio' | 'explore'>('portfolio');
  const [detail, setDetail] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'buy' | 'sell' | null>(null);

  if (!canPortfolio(s)) {
    const t = LADDER.find((x) => x.id === PORTFOLIO_TIER)!;
    return (
      <div className="card center">
        <Icon name="lock" size={40} />
        <h2>Portfolio opens at {t.name}</h2>
        <p className="muted">
          Earn {t.at} XP from lessons, quests and your budget to unlock a virtual portfolio of funds and shares. You have {s.xp} XP.
        </p>
        <div className="bar">
          <i style={{ width: `${Math.min(100, (s.xp / t.at) * 100)}%` }} />
        </div>
      </div>
    );
  }

  const a = s.portfolio;
  const v = valueOf(a, now);
  const start = s.portfolioStart;
  const ret = p2(v.value - start);
  const holdings = Object.entries(a.positions)
    .map(([sym, p]) => {
      const px = priceAt(sym, now);
      return { sym, p, px, value: p.qty * px, gain: (px - p.avg) * p.qty };
    })
    .sort((x, y) => y.value - x.value);

  if (detail) return <Detail sym={detail} now={now} onBack={() => setDetail(null)} sheet={sheet} setSheet={setSheet} />;

  return (
    <div className="t2">
      <section className="t2-head">
        <span className="muted small">Investing · virtual account</span>
        <div className="t2-total num">{money(p2(v.value))}</div>
        <span className={'num ' + (ret >= 0 ? 'up' : 'down')}>
          {signed(ret)} ({pctS(ret / start)}) since you started with {money(start)}
        </span>
        <div className="t2-stats num">
          <div>
            <span className="muted small">Free funds</span>
            <b>{money(p2(a.cash))}</b>
          </div>
          <div>
            <span className="muted small">Invested</span>
            <b>{money(p2(v.invested))}</b>
          </div>
          <div>
            <span className="muted small">Return</span>
            <b className={v.unrealised >= 0 ? 'up' : 'down'}>{signed(v.unrealised)}</b>
          </div>
        </div>
      </section>

      <div className="t2-tabs" role="tablist">
        {(['portfolio', 'explore'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'portfolio' ? 'Portfolio' : 'Explore'}
          </button>
        ))}
      </div>

      {tab === 'portfolio' ? (
        <>
          {holdings.length ? (
            <>
              <Donut holdings={holdings} cash={a.cash} total={v.value} />
              <div className="t2-list">
                {holdings.map((h) => (
                  <button key={h.sym} className="t2-row" onClick={() => setDetail(h.sym)}>
                    <Logo sym={h.sym} />
                    <span className="grow">
                      <b>{BY_SYM[h.sym].name}</b>
                      <span className="muted small num">
                        {fmtQty(p2(h.p.qty * 10) / 10)} {BY_SYM[h.sym].kind === 'fund' ? 'units' : 'shares'} · {Math.round((h.value / v.value) * 100)}%
                      </span>
                    </span>
                    <span className="t2-right num">
                      <b>{money(p2(h.value))}</b>
                      <span className={h.gain >= 0 ? 'up' : 'down'}>
                        {signed(h.gain)} ({pctS((h.px - h.p.avg) / h.p.avg)})
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {a.history.length === 0 && <StartCard fresh />}
              <div className="card center">
                <h3>Your portfolio is empty</h3>
                <p className="muted">You have {money(p2(a.cash))} of virtual money to invest. A broad index fund like WRLD is a common first holding.</p>
                <button className="btn" onClick={() => setTab('explore')}>
                  Explore investments
                </button>
              </div>
            </>
          )}

          {a.history.length > 0 && (
            <div className="card">
              <h3>Activity</h3>
              <div className="log">
                {a.history.slice(0, 12).map((f) => (
                  <div key={f.id}>
                    <span>
                      <b className={f.side === 'buy' ? 'up' : 'down'}>{f.side === 'buy' ? 'Bought' : 'Sold'}</b> {f.sym}
                      <span className="muted small"> · {new Date(f.t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </span>
                    <span className="num">{money(p2(f.qty * f.price))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {a.history.length > 0 && <StartCard fresh={false} />}
        </>
      ) : (
        <Explore now={now} onPick={setDetail} />
      )}
    </div>
  );
}

function Donut({ holdings, cash, total }: { holdings: { sym: string; value: number }[]; cash: number; total: number }) {
  let at = 0;
  const stops = holdings.map((h) => {
    const from = at;
    at += (h.value / total) * 100;
    return `${colorOf(h.sym)} ${from}% ${at}%`;
  });
  stops.push(`var(--line) ${at}% 100%`);
  return (
    <div className="t2-pie card">
      <div className="t2-donut" style={{ background: `conic-gradient(${stops.join(',')})` }}>
        <span>
          <b className="num">{holdings.length}</b>
          <span className="small muted">{holdings.length === 1 ? 'holding' : 'holdings'}</span>
        </span>
      </div>
      <div className="t2-legend small">
        {holdings.map((h) => (
          <span key={h.sym}>
            <i style={{ background: colorOf(h.sym) }} /> {h.sym} <b className="num">{Math.round((h.value / total) * 100)}%</b>
          </span>
        ))}
        {cash > 0.5 && (
          <span>
            <i style={{ background: 'var(--line)' }} /> Cash <b className="num">{Math.round((cash / total) * 100)}%</b>
          </span>
        )}
      </div>
    </div>
  );
}

function Explore({ now, onPick }: { now: number; onPick: (sym: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'fund' | 'stock'>('all');
  return (
    <>
      <div className="seg-s" role="group" aria-label="Filter">
        {(['all', 'fund', 'stock'] as const).map((f) => (
          <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'fund' ? 'Funds' : 'Shares'}
          </button>
        ))}
      </div>
      <div className="t2-list">
        {INVESTABLE.filter((i) => filter === 'all' || i.kind === filter).map((i) => {
          const p = priceAt(i.sym, now);
          const r = (p - priceAt(i.sym, now - DAY)) / priceAt(i.sym, now - DAY);
          return (
            <button key={i.sym} className="t2-row" onClick={() => onPick(i.sym)}>
              <Logo sym={i.sym} />
              <span className="grow">
                <b>{i.name}</b>
                <span className="muted small">
                  {i.sym} · {i.kind === 'fund' ? 'Fund' : i.sector}
                </span>
              </span>
              <span className="t2-right num">
                <b>{money(p2(p))}</b>
                <span className={'t2-pill ' + (r >= 0 ? 'upbg' : 'downbg')}>{pctS(r)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Detail({ sym, now, onBack, sheet, setSheet }: { sym: string; now: number; onBack: () => void; sheet: 'buy' | 'sell' | null; setSheet: (v: 'buy' | 'sell' | null) => void }) {
  const s = useStore();
  const [range, setRange] = useState<RangeId>('1Y');
  const ins = BY_SYM[sym];
  const q = quote(sym, now);
  const rMs = RANGES.find((r) => r.id === range)!.ms;
  const pts = useMemo(() => series(sym, rMs, 120, now), [sym, rMs, Math.floor(now / 60000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const rangeRet = (pts[pts.length - 1].p - pts[0].p) / pts[0].p;
  const held = s.portfolio.positions[sym];
  const risk = ins.vol < 0.1 ? 'Low' : ins.vol < 0.2 ? 'Medium' : ins.vol < 0.35 ? 'High' : 'Very high';

  return (
    <div className="t2">
      <button className="btn ghost t2-back" onClick={onBack}>
        ‹ Back
      </button>
      <section className="t2-head">
        <div className="row">
          <Logo sym={sym} size={48} />
          <div>
            <h2>{ins.name}</h2>
            <span className="muted small">
              {sym} · {ins.kind === 'fund' ? 'Fund' : 'Share'} · {ins.sector}
            </span>
          </div>
        </div>
        <div className="t2-total num">{money(q.price)}</div>
        <span className={'num ' + (rangeRet >= 0 ? 'up' : 'down')}>
          {pctS(rangeRet)} past {range}
        </span>
        <Spark pts={pts} labels />
        <div className="t2-ranges" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r.id} className={range === r.id ? 'on' : ''} onClick={() => setRange(r.id)}>
              {r.id}
            </button>
          ))}
        </div>
      </section>

      {held && (
        <div className="card">
          <h3>Your investment</h3>
          <div className="t2-grid num">
            <div>
              <span className="muted small">Value</span>
              <b>{money(p2(held.qty * q.price))}</b>
            </div>
            <div>
              <span className="muted small">Return</span>
              <b className={q.price >= held.avg ? 'up' : 'down'}>
                {signed((q.price - held.avg) * held.qty)} ({pctS((q.price - held.avg) / held.avg)})
              </b>
            </div>
            <div>
              <span className="muted small">Quantity</span>
              <b>{fmtQty(p2(held.qty * 1000) / 1000)}</b>
            </div>
            <div>
              <span className="muted small">Average price</span>
              <b>{money(p2(held.avg))}</b>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Key stats</h3>
        <div className="t2-grid num">
          <div>
            <span className="muted small">1Y low – high</span>
            <b>
              {money(p2(q.yearLo))} – {money(p2(q.yearHi))}
            </b>
          </div>
          <div>
            <span className="muted small">Risk</span>
            <b>{risk}</b>
          </div>
          {q.pe !== null && (
            <div>
              <span className="muted small">P/E ratio</span>
              <b>{q.pe.toFixed(1)}</b>
            </div>
          )}
          {q.divYield !== null && (
            <div>
              <span className="muted small">Dividend yield</span>
              <b>{(q.divYield * 100).toFixed(2)}%</b>
            </div>
          )}
          {ins.ocf !== undefined && (
            <div>
              <span className="muted small">Ongoing charge (OCF)</span>
              <b>{(ins.ocf * 100).toFixed(2)}%</b>
            </div>
          )}
        </div>
        <h3>About</h3>
        <p className="muted small">{ins.desc}</p>
        <p className="muted small">Simulated prices for an invented {ins.kind === 'fund' ? 'fund' : 'company'}. Real investments can fall as well as rise.</p>
      </div>

      <div className="t2-actions">
        {held && (
          <button className="btn bad grow" onClick={() => setSheet('sell')}>
            Sell
          </button>
        )}
        <button className="btn good grow" onClick={() => setSheet('buy')}>
          Buy
        </button>
      </div>

      {sheet && <OrderSheet sym={sym} side={sheet} price={q.price} onClose={() => setSheet(null)} />}
    </div>
  );
}

function OrderSheet({ sym, side, price, onClose }: { sym: string; side: 'buy' | 'sell'; price: number; onClose: () => void }) {
  const s = useStore();
  const a = s.portfolio;
  const heldValue = p2((a.positions[sym]?.qty ?? 0) * price);
  const [amt, setAmt] = useState(Math.min(500, side === 'buy' ? Math.max(1, Math.floor(a.cash)) : Math.max(1, heldValue)));
  const limit = side === 'buy' ? a.cash : heldValue;
  const over = amt > limit + 0.001;
  const downOnBackdrop = useRef(false);

  // Portal to <body>: the page column creates a stacking context that would put the sheet under the tab bar.
  return createPortal(
    <div
      className="t2-sheetwrap"
      role="dialog"
      aria-modal="true"
      aria-label={`${side === 'buy' ? 'Buy' : 'Sell'} ${sym}`}
      // Close only on a press that starts and ends on the backdrop, so a slider drag released outside the sheet does not close it.
      onPointerDown={(e) => (downOnBackdrop.current = e.target === e.currentTarget)}
      onClick={(e) => downOnBackdrop.current && e.target === e.currentTarget && onClose()}
    >
      <div className="t2-sheet">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div className="row">
            <Logo sym={sym} size={36} />
            <b>
              {side === 'buy' ? 'Buy' : 'Sell'} {BY_SYM[sym].name}
            </b>
          </div>
          <button className="x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="t2-amount num">{money(amt)}</div>
        <span className="muted small center num">
          ≈ {fmtQty(p2((amt / price) * 1000) / 1000)} {BY_SYM[sym].kind === 'fund' ? 'units' : 'shares'} at {money(price)}
        </span>
        <MoneySlider id="amt-slider" label="Amount in pounds" value={amt} max={limit} onChange={setAmt} />
        <div className="chips">
          {[10, 100, 1000, 5000]
            .filter((n) => n < limit)
            .map((n) => (
              <button key={n} className="chip" onClick={() => setAmt(n)}>
                {gbp(n)}
              </button>
            ))}
          {limit >= 1 && (
            <button className="chip" onClick={() => setAmt(side === 'buy' ? Math.floor(limit * 100) / 100 : heldValue)}>
              {side === 'buy' ? 'Max' : 'All'} ({money(side === 'buy' ? Math.floor(limit * 100) / 100 : heldValue)})
            </button>
          )}
        </div>
        <span className={'small num ' + (over ? 'down' : 'muted')}>
          {side === 'buy' ? `Free funds: ${money(p2(a.cash))}` : `You hold ${money(heldValue)}`}
          {over && (side === 'buy' ? ' · not enough free funds' : ' · more than you hold')}
        </span>
        <button
          className={'btn wide ' + (side === 'buy' ? 'good' : 'bad')}
          disabled={over || amt < 1}
          onClick={() => {
            if (portfolioTrade(sym, side, amt).ok) onClose();
          }}
        >
          {side === 'buy' ? 'Buy' : 'Sell'} {money(amt)}
        </button>
      </div>
    </div>,
    document.body,
  );
}

/** Pick the portfolio's starting balance. Before the first trade it just sets it; afterwards it is a fresh start, so it asks twice. */
function StartCard({ fresh }: { fresh: boolean }) {
  const s = useStore();
  const [amt, setAmt] = useState(s.portfolioStart);
  const [sure, setSure] = useState(false);
  const same = amt === s.portfolioStart && fresh;
  return (
    <div className="card">
      <h3>{fresh ? 'Choose your starting balance' : 'Start again'}</h3>
      <p className="muted small">
        {fresh ? 'Pick how much virtual money to start your portfolio with, from £1 to £10,000.' : 'Clear your holdings and history and start again with a new balance.'}
      </p>
      <div className="t2-amount num">{money(amt)}</div>
      <MoneySlider id="start-slider" label="Starting balance in pounds" value={amt} max={PORTFOLIO_MAX_START} onChange={(n) => (setAmt(Math.round(n)), setSure(false))} />
      <button
        className={'btn ' + (sure ? 'bad' : fresh ? '' : 'ghost')}
        disabled={same}
        onClick={() => {
          if (!fresh && !sure) return setSure(true);
          startPortfolio(amt);
          setSure(false);
        }}
      >
        {sure ? 'Tap again: this clears your holdings' : same ? `Starting with ${money(amt)}` : `Start with ${money(amt)}`}
      </button>
      <p className="muted small">Simulated prices for invented companies and funds. No fees. Real investments can fall as well as rise, and past performance is not a guide to the future.</p>
    </div>
  );
}
