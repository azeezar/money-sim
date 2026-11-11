import { useEffect, useMemo, useRef, useState } from 'react';
import { atr, bollinger, ema, heikinAshi, macd, rsi, sma, vwap } from '../lib/indicators';
import { BY_SYM, candles, DAY, type Candle, type MarketMode } from '../lib/market';

export type ChartType = 'candles' | 'hollow' | 'heikin' | 'bars' | 'line' | 'area';
export type IndicatorId = 'vol' | 'sma20' | 'sma50' | 'sma200' | 'ema9' | 'ema21' | 'bb' | 'vwap' | 'rsi' | 'macd' | 'atr';

export const INDICATORS: { id: IndicatorId; label: string; pane?: boolean }[] = [
  { id: 'vol', label: 'Volume' },
  { id: 'sma20', label: 'SMA 20' },
  { id: 'sma50', label: 'SMA 50' },
  { id: 'sma200', label: 'SMA 200' },
  { id: 'ema9', label: 'EMA 9' },
  { id: 'ema21', label: 'EMA 21' },
  { id: 'bb', label: 'Bollinger Bands (20, 2)' },
  { id: 'vwap', label: 'VWAP' },
  { id: 'rsi', label: 'RSI (14)', pane: true },
  { id: 'macd', label: 'MACD (12, 26, 9)', pane: true },
  { id: 'atr', label: 'ATR (14)', pane: true },
];

const LINE_COLORS: Partial<Record<IndicatorId, string>> = {
  sma20: '#f7a600',
  sma50: '#2962ff',
  sma200: '#e91e63',
  ema9: '#00bcd4',
  ema21: '#9c27b0',
  vwap: '#ff6d00',
};

export interface ChartLine {
  price: number;
  label: string;
  color: string;
  dashed?: boolean;
}

interface Props {
  sym: string;
  tf: number;
  type: ChartType;
  ind: Set<IndicatorId>;
  now: number;
  /** 'uk' skips hours the London market is closed. */
  mode?: MarketMode;
  lines: ChartLine[];
  /** When set, a click on the chart calls this with the price under the pointer. */
  onPick?: (price: number) => void;
  height?: number;
}

const WARMUP = 200;
const AXIS_W = 70;
const TIME_H = 24;

function fmtPrice(p: number, ref: number) {
  if (!Number.isFinite(p)) return '';
  const dp = ref >= 1000 ? 2 : ref >= 10 ? 2 : 3;
  return p.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function fmtTime(t: number, tf: number, full = false) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  if (tf >= DAY) return full ? `${d.getDate()} ${mon} ${d.getFullYear()}` : `${d.getDate()} ${mon}`;
  return full ? `${d.getDate()} ${mon} ${p(d.getHours())}:${p(d.getMinutes())}` : `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function niceStep(range: number, target: number) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

const css = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

/** A TradingView-style canvas chart: candles, overlays, indicator panes, crosshair, zoom and pan. */
export function PriceChart({ sym, tf, type, ind, now, mode = '24h', lines, onPick, height = 520 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);
  const [count, setCount] = useState(90);
  const [offset, setOffset] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; off: number; moved: boolean } | null>(null);
  const layout = useRef<{ x0: number; step: number; top: number; mainH: number; lo: number; hi: number; n: number } | null>(null);

  // Reset the view when the symbol or timeframe changes.
  useEffect(() => {
    setOffset(0);
  }, [sym, tf]);

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Wheel to zoom (non-passive so the page does not scroll under the chart).
  useEffect(() => {
    const el = cv.current!;
    const f = (e: WheelEvent) => {
      e.preventDefault();
      setCount((c) => Math.max(20, Math.min(300, Math.round(c * (e.deltaY > 0 ? 1.12 : 0.89)))));
    };
    el.addEventListener('wheel', f, { passive: false });
    return () => el.removeEventListener('wheel', f);
  }, []);

  const data = useMemo(() => {
    const total = count + offset + WARMUP;
    const all = candles(sym, tf, total, now, mode);
    const shown = type === 'heikin' ? heikinAshi(all) : all;
    const c = all.map((k) => k.c);
    const h = all.map((k) => k.h);
    const l = all.map((k) => k.l);
    const v = all.map((k) => k.v);
    const cut = <T,>(xs: T[]) => xs.slice(WARMUP, WARMUP + count);
    const vis = cut(shown);
    const startV = WARMUP;
    const ov: { id: IndicatorId; vals: number[] }[] = [];
    if (ind.has('sma20')) ov.push({ id: 'sma20', vals: cut(sma(c, 20)) });
    if (ind.has('sma50')) ov.push({ id: 'sma50', vals: cut(sma(c, 50)) });
    if (ind.has('sma200')) ov.push({ id: 'sma200', vals: cut(sma(c, 200)) });
    if (ind.has('ema9')) ov.push({ id: 'ema9', vals: cut(ema(c, 9)) });
    if (ind.has('ema21')) ov.push({ id: 'ema21', vals: cut(ema(c, 21)) });
    if (ind.has('vwap')) {
      const hh = h.slice(startV), ll = l.slice(startV), cc = c.slice(startV), vv = v.slice(startV);
      ov.push({ id: 'vwap', vals: vwap(hh, ll, cc, vv).slice(0, count) });
    }
    const bb = ind.has('bb') ? bollinger(c, 20, 2) : null;
    const r = ind.has('rsi') ? cut(rsi(c, 14)) : null;
    const m = ind.has('macd') ? macd(c) : null;
    const a = ind.has('atr') ? cut(atr(h, l, c, 14)) : null;
    return {
      vis: vis as Candle[],
      raw: cut(all),
      ov,
      bb: bb && { up: cut(bb.up), mid: cut(bb.mid), lo: cut(bb.lo) },
      rsi: r,
      macd: m && { line: cut(m.line), signal: cut(m.signal), hist: cut(m.hist) },
      atr: a,
      last: all[all.length - 1],
    };
  }, [sym, tf, count, offset, now, mode, type, ind]);

  // Draw.
  useEffect(() => {
    const canvas = cv.current!;
    const dpr = window.devicePixelRatio || 1;
    const W = width;
    const H = height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const g = canvas.getContext('2d')!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const root = document.documentElement;
    const C = {
      bg: css(root, '--chart-bg'),
      grid: css(root, '--chart-grid'),
      text: css(root, '--chart-text'),
      up: css(root, '--up'),
      down: css(root, '--down'),
      cross: css(root, '--chart-cross'),
      label: css(root, '--chart-label'),
    };
    g.fillStyle = C.bg;
    g.fillRect(0, 0, W, H);
    g.font = '11px ui-sans-serif, system-ui, sans-serif';
    g.textBaseline = 'middle';

    const panes: ('rsi' | 'macd' | 'atr')[] = [];
    if (data.rsi) panes.push('rsi');
    if (data.macd) panes.push('macd');
    if (data.atr) panes.push('atr');
    const paneH = panes.length ? Math.min(110, (H - TIME_H) * 0.2) : 0;
    const mainH = H - TIME_H - paneH * panes.length;
    const plotW = W - AXIS_W;
    const n = data.vis.length;
    const step = plotW / n;
    const x0 = step / 2;
    const xAt = (i: number) => x0 + i * step;

    // Price range from what is visible, including overlays and order lines.
    let lo = Infinity;
    let hi = -Infinity;
    for (const k of data.vis) {
      lo = Math.min(lo, k.l);
      hi = Math.max(hi, k.h);
    }
    if (data.bb) for (let i = 0; i < n; i++) if (Number.isFinite(data.bb.up[i])) (hi = Math.max(hi, data.bb.up[i])), (lo = Math.min(lo, data.bb.lo[i]));
    // Keep nearby order and position lines in view (a stop just below the range, say).
    const span0 = hi - lo;
    for (const L of lines) if (L.price > lo - span0 && L.price < hi + span0) (lo = Math.min(lo, L.price)), (hi = Math.max(hi, L.price));
    const pad = (hi - lo) * 0.08 || hi * 0.01;
    lo -= pad;
    hi += pad;
    const top = 8;
    const volH = ind.has('vol') ? mainH * 0.18 : 0;
    const priceBottom = mainH - 6;
    const yAt = (p: number) => top + ((hi - p) / (hi - lo)) * (priceBottom - top);
    const pAt = (y: number) => hi - ((y - top) / (priceBottom - top)) * (hi - lo);
    layout.current = { x0, step, top, mainH: priceBottom, lo, hi, n };
    const ref = data.last.c;

    // Grid and price axis.
    g.strokeStyle = C.grid;
    g.lineWidth = 1;
    g.fillStyle = C.text;
    const ps = niceStep(hi - lo, 7);
    for (let p = Math.ceil(lo / ps) * ps; p <= hi; p += ps) {
      const y = Math.round(yAt(p)) + 0.5;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(plotW, y);
      g.stroke();
      g.textAlign = 'left';
      g.fillText(fmtPrice(p, ref), plotW + 6, y);
    }
    // Time axis and vertical grid.
    const every = Math.max(1, Math.round(90 / step));
    g.textAlign = 'center';
    for (let i = n - 1; i >= 0; i -= every) {
      const x = Math.round(xAt(i)) + 0.5;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H - TIME_H);
      g.stroke();
      g.fillText(fmtTime(data.vis[i].t, tf), x, H - TIME_H / 2);
    }

    // Volume.
    if (volH) {
      const vmax = Math.max(...data.raw.map((k) => k.v));
      for (let i = 0; i < n; i++) {
        const k = data.raw[i];
        const h = (k.v / vmax) * volH;
        g.fillStyle = k.c >= k.o ? C.up : C.down;
        g.globalAlpha = 0.28;
        g.fillRect(xAt(i) - step * 0.36, priceBottom - h, step * 0.72, h);
      }
      g.globalAlpha = 1;
    }

    // Bollinger fill.
    if (data.bb) {
      const { up, lo: bl, mid } = data.bb;
      g.fillStyle = 'rgba(33,150,243,0.08)';
      g.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) if (Number.isFinite(up[i])) (started ? g.lineTo(xAt(i), yAt(up[i])) : g.moveTo(xAt(i), yAt(up[i]))), (started = true);
      for (let i = n - 1; i >= 0; i--) if (Number.isFinite(bl[i])) g.lineTo(xAt(i), yAt(bl[i]));
      g.closePath();
      g.fill();
      drawLine(g, up, xAt, yAt, '#2196f3', 1);
      drawLine(g, bl, xAt, yAt, '#2196f3', 1);
      drawLine(g, mid, xAt, yAt, '#ff9800', 1);
    }

    // Price series.
    const bw = Math.max(1, step * 0.7);
    if (type === 'line' || type === 'area') {
      const cs = data.vis.map((k) => k.c);
      if (type === 'area') {
        const grad = g.createLinearGradient(0, top, 0, priceBottom);
        grad.addColorStop(0, 'rgba(41,98,255,0.35)');
        grad.addColorStop(1, 'rgba(41,98,255,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(xAt(0), priceBottom);
        cs.forEach((c, i) => g.lineTo(xAt(i), yAt(c)));
        g.lineTo(xAt(n - 1), priceBottom);
        g.closePath();
        g.fill();
      }
      drawLine(g, cs, xAt, yAt, '#2962ff', 2);
    } else {
      for (let i = 0; i < n; i++) {
        const k = data.vis[i];
        const upC = k.c >= k.o;
        const col = upC ? C.up : C.down;
        const x = xAt(i);
        g.strokeStyle = col;
        g.fillStyle = col;
        g.lineWidth = 1;
        if (type === 'bars') {
          g.beginPath();
          g.moveTo(Math.round(x) + 0.5, yAt(k.h));
          g.lineTo(Math.round(x) + 0.5, yAt(k.l));
          g.moveTo(x - bw / 2, yAt(k.o));
          g.lineTo(x, yAt(k.o));
          g.moveTo(x, yAt(k.c));
          g.lineTo(x + bw / 2, yAt(k.c));
          g.stroke();
          continue;
        }
        g.beginPath();
        g.moveTo(Math.round(x) + 0.5, yAt(k.h));
        g.lineTo(Math.round(x) + 0.5, yAt(k.l));
        g.stroke();
        const y1 = yAt(Math.max(k.o, k.c));
        const y2 = yAt(Math.min(k.o, k.c));
        const bh = Math.max(1, y2 - y1);
        if (type === 'hollow' && upC) {
          g.fillStyle = C.bg;
          g.fillRect(x - bw / 2, y1, bw, bh);
          g.strokeRect(x - bw / 2 + 0.5, y1 + 0.5, bw - 1, bh - 1);
        } else g.fillRect(x - bw / 2, y1, bw, bh);
      }
    }

    // Moving averages etc.
    for (const o of data.ov) drawLine(g, o.vals, xAt, yAt, LINE_COLORS[o.id] ?? '#888', 1.5);

    // Horizontal lines: user lines, positions and orders.
    for (const L of lines) {
      if (L.price < lo || L.price > hi) continue;
      const y = Math.round(yAt(L.price)) + 0.5;
      g.strokeStyle = L.color;
      g.lineWidth = 1;
      g.setLineDash(L.dashed ? [5, 4] : []);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(plotW, y);
      g.stroke();
      g.setLineDash([]);
      if (L.label) {
        const tw = g.measureText(L.label).width + 10;
        g.fillStyle = L.color;
        g.fillRect(plotW - tw - 6, y - 9, tw, 18);
        g.fillStyle = '#fff';
        g.textAlign = 'left';
        g.fillText(L.label, plotW - tw - 1, y);
      }
      axisTag(g, plotW, y, fmtPrice(L.price, ref), L.color, '#fff');
    }

    // Last price line.
    if (offset === 0) {
      const last = data.vis[n - 1];
      const col = last.c >= last.o ? C.up : C.down;
      const y = Math.round(yAt(data.last.c)) + 0.5;
      g.strokeStyle = col;
      g.setLineDash([2, 3]);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(plotW, y);
      g.stroke();
      g.setLineDash([]);
      axisTag(g, plotW, y, fmtPrice(data.last.c, ref), col, '#fff');
    }

    // Lower panes.
    panes.forEach((pane, pi) => {
      const y0 = mainH + pi * paneH;
      g.strokeStyle = C.grid;
      g.beginPath();
      g.moveTo(0, y0 + 0.5);
      g.lineTo(W, y0 + 0.5);
      g.stroke();
      g.fillStyle = C.text;
      g.textAlign = 'left';
      if (pane === 'rsi' && data.rsi) {
        const yr = (v: number) => y0 + 6 + ((100 - v) / 100) * (paneH - 12);
        g.fillStyle = 'rgba(126,87,194,0.08)';
        g.fillRect(0, yr(70), plotW, yr(30) - yr(70));
        g.strokeStyle = C.grid;
        g.setLineDash([4, 4]);
        for (const lv of [30, 70]) {
          g.beginPath();
          g.moveTo(0, yr(lv));
          g.lineTo(plotW, yr(lv));
          g.stroke();
          g.fillStyle = C.text;
          g.fillText(String(lv), plotW + 6, yr(lv));
        }
        g.setLineDash([]);
        drawLine(g, data.rsi, xAt, yr, '#7e57c2', 1.5);
        const lv = data.rsi[n - 1];
        g.fillStyle = C.text;
        g.fillText(`RSI 14  ${Number.isFinite(lv) ? lv.toFixed(1) : ''}`, 6, y0 + 12);
      }
      if (pane === 'macd' && data.macd) {
        const { line, signal, hist } = data.macd;
        const vals = [...line, ...signal, ...hist].filter(Number.isFinite);
        const m = Math.max(1e-9, ...vals.map(Math.abs));
        const ym = (v: number) => y0 + paneH / 2 - (v / m) * (paneH / 2 - 8);
        for (let i = 0; i < n; i++) {
          if (!Number.isFinite(hist[i])) continue;
          g.fillStyle = hist[i] >= 0 ? C.up : C.down;
          g.globalAlpha = 0.5;
          const y = ym(hist[i]);
          g.fillRect(xAt(i) - bw / 2, Math.min(y, ym(0)), bw, Math.abs(y - ym(0)) || 1);
        }
        g.globalAlpha = 1;
        drawLine(g, line, xAt, ym, '#2962ff', 1.5);
        drawLine(g, signal, xAt, ym, '#ff6d00', 1.5);
        g.fillStyle = C.text;
        g.fillText(`MACD 12 26 9  ${fmtNum(line[n - 1])}  ${fmtNum(signal[n - 1])}`, 6, y0 + 12);
      }
      if (pane === 'atr' && data.atr) {
        const vals = data.atr.filter(Number.isFinite);
        const mx = Math.max(...vals);
        const mn = Math.min(...vals);
        const ya = (v: number) => y0 + 8 + ((mx - v) / (mx - mn || 1)) * (paneH - 16);
        drawLine(g, data.atr, xAt, ya, '#d81b60', 1.5);
        g.fillStyle = C.text;
        g.fillText(`ATR 14  ${fmtNum(data.atr[n - 1])}`, 6, y0 + 12);
      }
    });

    // Crosshair and legend.
    let hi_i = n - 1;
    if (hover && hover.x < plotW) {
      hi_i = Math.max(0, Math.min(n - 1, Math.round((hover.x - x0) / step)));
      const x = Math.round(xAt(hi_i)) + 0.5;
      g.strokeStyle = C.cross;
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H - TIME_H);
      if (hover.y < H - TIME_H) {
        g.moveTo(0, Math.round(hover.y) + 0.5);
        g.lineTo(plotW, Math.round(hover.y) + 0.5);
      }
      g.stroke();
      g.setLineDash([]);
      if (hover.y < priceBottom) axisTag(g, plotW, hover.y, fmtPrice(pAt(hover.y), ref), C.label, '#fff');
      const tl = fmtTime(data.vis[hi_i].t, tf, true);
      const tw = g.measureText(tl).width + 12;
      g.fillStyle = C.label;
      g.fillRect(x - tw / 2, H - TIME_H + 2, tw, TIME_H - 4);
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.fillText(tl, x, H - TIME_H / 2);
    }
    const k = data.vis[hi_i];
    const raw = data.raw[hi_i];
    const chg = (raw.c - raw.o) / raw.o;
    const col = raw.c >= raw.o ? C.up : C.down;
    g.textAlign = 'left';
    let lx = 8;
    const ly = 16;
    const put = (t: string, color: string, bold = false) => {
      g.font = `${bold ? '700 ' : ''}12px ui-sans-serif, system-ui, sans-serif`;
      g.fillStyle = color;
      g.fillText(t, lx, ly);
      lx += g.measureText(t).width + 8;
    };
    put(`${sym} · ${BY_SYM[sym].name}`, C.text, true);
    put('O', C.text);
    lx -= 6;
    put(fmtPrice(k.o, ref), col);
    put('H', C.text);
    lx -= 6;
    put(fmtPrice(k.h, ref), col);
    put('L', C.text);
    lx -= 6;
    put(fmtPrice(k.l, ref), col);
    put('C', C.text);
    lx -= 6;
    put(fmtPrice(k.c, ref), col);
    put(`${chg >= 0 ? '+' : ''}${(chg * 100).toFixed(2)}%`, col);
    lx = 8;
    let oy = 34;
    g.font = '11px ui-sans-serif, system-ui, sans-serif';
    for (const o of data.ov) {
      g.fillStyle = LINE_COLORS[o.id] ?? C.text;
      g.fillText(`${INDICATORS.find((x) => x.id === o.id)!.label}  ${fmtPrice(o.vals[hi_i], ref)}`, 8, oy);
      oy += 15;
    }
    if (data.bb) {
      g.fillStyle = '#2196f3';
      g.fillText(`BB 20 2  ${fmtPrice(data.bb.up[hi_i], ref)}  ${fmtPrice(data.bb.lo[hi_i], ref)}`, 8, oy);
    }
  }, [data, width, height, hover, lines, offset, ind, type, sym, tf]);

  function pos(e: React.PointerEvent) {
    const r = cv.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  return (
    <div ref={wrap} className={'pchart' + (onPick ? ' picking' : '')}>
      <canvas
        ref={cv}
        role="img"
        aria-label={`${sym} price chart. Last price ${data.last.c}.`}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, off: offset, moved: false };
        }}
        onPointerMove={(e) => {
          const p = pos(e);
          setHover(p);
          const d = drag.current;
          const L = layout.current;
          if (d && L) {
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 3) d.moved = true;
            setOffset(Math.max(0, Math.min(800, Math.round(d.off + dx / L.step))));
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          const L = layout.current;
          if (d && !d.moved && onPick && L) {
            const y = pos(e).y;
            if (y <= L.mainH) onPick(Math.round((L.hi - ((y - L.top) / (L.mainH - L.top)) * (L.hi - L.lo)) * 1000) / 1000);
          }
        }}
        onPointerLeave={() => setHover(null)}
        onDoubleClick={() => {
          setOffset(0);
          setCount(90);
        }}
      />
      {offset > 0 && (
        <button className="chart-live" onClick={() => setOffset(0)}>
          Back to live ›
        </button>
      )}
    </div>
  );
}

function fmtNum(v: number) {
  return Number.isFinite(v) ? v.toFixed(Math.abs(v) >= 100 ? 1 : 3) : '';
}

function drawLine(g: CanvasRenderingContext2D, vals: number[], xAt: (i: number) => number, yAt: (v: number) => number, color: string, w: number) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  let started = false;
  vals.forEach((v, i) => {
    if (!Number.isFinite(v)) return;
    if (started) g.lineTo(xAt(i), yAt(v));
    else g.moveTo(xAt(i), yAt(v));
    started = true;
  });
  g.stroke();
  g.lineWidth = 1;
}

function axisTag(g: CanvasRenderingContext2D, x: number, y: number, text: string, bg: string, fg: string) {
  g.font = '11px ui-sans-serif, system-ui, sans-serif';
  g.fillStyle = bg;
  g.fillRect(x + 1, y - 9, AXIS_W - 2, 18);
  g.fillStyle = fg;
  g.textAlign = 'left';
  g.fillText(text, x + 6, y);
}
