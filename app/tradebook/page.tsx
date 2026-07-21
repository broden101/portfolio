"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  buildOrderBook,
  calcVWAP,
  type RunningTrade,
  type OrderLevel,
  type TickerInfo,
} from "@/lib/orderbook";

/** Max rows rendered per list panel — prevents 40k-row freeze */
const LIST_WINDOW = 180;
/** During play, rebuild orderbook every N steps (forward uses incremental) */
const REBUILD_EVERY = 1;
const SPEEDS = [1, 2, 5, 10, 25, 50, 100];

function fmt(n: number, dig = 0) {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: dig,
    maximumFractionDigits: dig,
  });
}

function fmtPrice(p: number) {
  return p.toLocaleString("id-ID");
}

export default function OrderBookPage() {
  const [trades, setTrades] = useState<RunningTrade[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [ticker, setTicker] = useState<TickerInfo>({
    code: "DEWA",
    last: 0,
    change: 0,
    high: 0,
    low: 0,
    open: 0,
    volume: 0,
  });
  const [tickerCode, setTickerCode] = useState("DEWA");
  const [tickerInput, setTickerInput] = useState("DEWA");
  const [tickerOpen, setTickerOpen] = useState(false);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [latestDate, setLatestDate] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const tickerBoxRef = useRef<HTMLDivElement>(null);
  const [levels, setLevels] = useState<OrderLevel[]>([]);
  const [showBroker, setShowBroker] = useState(true);

  const filteredTickers = useMemo(() => {
    const q = tickerInput.trim().toUpperCase();
    if (!q) return availableTickers.slice(0, 50);
    return availableTickers.filter((t) => t.startsWith(q)).slice(0, 50);
  }, [availableTickers, tickerInput]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!tickerBoxRef.current?.contains(e.target as Node)) setTickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  useEffect(() => {
    setTickerInput(tickerCode);
  }, [tickerCode]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef(trades);
  const idxRef = useRef(currentIdx);
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const levelsMapRef = useRef<Map<number, OrderLevel>>(new Map());
  const statsRef = useRef({ high: 0, low: Infinity, open: 0, volume: 0 });

  // Keep refs in sync for timer/keyboard without rebind
  useEffect(() => {
    tradesRef.current = trades;
  }, [trades]);
  useEffect(() => {
    idxRef.current = currentIdx;
  }, [currentIdx]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Load available tickers + dates
  useEffect(() => {
    fetch("/data/trades-index.json")
      .then((r) => r.json())
      .then((d) => {
        if (d.tickers) setAvailableTickers(d.tickers);
        if (d.dates) setAvailableDates(d.dates);
        if (d.date) {
          setSelectedDate(d.date);
          setLatestDate(d.date);
        }
      })
      .catch(() => {});
  }, []);

  const applyBookFromScratch = useCallback(
    (data: RunningTrade[], idx: number, code: string) => {
      if (data.length === 0 || idx < 0) {
        levelsMapRef.current = new Map();
        statsRef.current = { high: 0, low: Infinity, open: 0, volume: 0 };
        setLevels([]);
        setTicker({ code, last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
        return;
      }
      const { levels: lv, ticker: tk } = buildOrderBook(data, idx);
      const map = new Map<number, OrderLevel>();
      for (const l of lv) map.set(l.price, { ...l });
      levelsMapRef.current = map;
      statsRef.current = {
        high: tk.high,
        low: tk.low || Infinity,
        open: tk.open,
        volume: tk.volume,
      };
      setLevels(lv);
      setTicker(tk);
    },
    []
  );

  /** Incremental forward apply (fast path during play) */
  const applyForward = useCallback((data: RunningTrade[], from: number, to: number) => {
    if (to < from || to >= data.length) return;
    const map = levelsMapRef.current;
    const st = statsRef.current;
    let last = data[from]?.price ?? 0;
    let lastChange = data[from]?.change ?? 0;

    for (let i = from + 1; i <= to; i++) {
      const t = data[i];
      let lv = map.get(t.price);
      if (!lv) {
        lv = { price: t.price, bidVol: 0, offerVol: 0, freq: 0 };
        map.set(t.price, lv);
      }
      if (t.side === "BUY") lv.bidVol += t.lot;
      else lv.offerVol += t.lot;
      lv.freq++;
      st.volume += t.lot;
      if (i === 0 || st.open === 0) st.open = t.price;
      if (t.price > st.high) st.high = t.price;
      if (t.price < st.low) st.low = t.price;
      last = t.price;
      lastChange = t.change;
    }

    const sorted = Array.from(map.values()).sort((a, b) => b.price - a.price);
    setLevels(sorted);
    setTicker({
      code: data[0]?.code || "—",
      last,
      change: lastChange,
      high: st.high,
      low: st.low === Infinity ? 0 : st.low,
      open: st.open,
      volume: st.volume,
    });
  }, []);

  const loadData = useCallback(
    (data: RunningTrade[], code: string) => {
      setTrades(data);
      const idx = data.length > 0 ? 0 : -1;
      setCurrentIdx(idx);
      setPlaying(false);
      applyBookFromScratch(data, idx, code);
    },
    [applyBookFromScratch]
  );

  const fetchTickerData = useCallback(
    async (code: string, date?: string) => {
      const targetDate = date || selectedDate || latestDate;
      if (!targetDate) return;
      setLoadingData(true);
      setPlaying(false);
      try {
        const isLatest = targetDate === latestDate;
        const url = isLatest
          ? `/data/trades/${code}.json`
          : `/data/trades-history/${targetDate}/${code}.json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          loadData(data, code);
        }
      } catch (e) {
        console.error("Load failed", e);
      }
      setLoadingData(false);
    },
    [selectedDate, latestDate, loadData]
  );

  useEffect(() => {
    fetchTickerData(tickerCode);
  }, [fetchTickerData, tickerCode]);

  // Rebuild book when index jumps (slider / step back / non-sequential)
  const lastAppliedRef = useRef(-1);
  useEffect(() => {
    if (trades.length === 0 || currentIdx < 0) {
      lastAppliedRef.current = -1;
      return;
    }
    const prev = lastAppliedRef.current;
    if (prev >= 0 && currentIdx > prev && currentIdx - prev <= 50) {
      applyForward(trades, prev, currentIdx);
      lastAppliedRef.current = currentIdx;
      return;
    }
    applyBookFromScratch(trades, currentIdx, tickerCode);
    lastAppliedRef.current = currentIdx;
  }, [trades, currentIdx, tickerCode, applyForward, applyBookFromScratch]);

  // Auto-scroll orderbook only when not playing
  useEffect(() => {
    if (playing) return;
    if (!orderBookRef.current || levels.length === 0) return;
    const idx = levels.findIndex((l) => l.price === ticker.last);
    if (idx >= 0) {
      const el = orderBookRef.current.children[idx] as HTMLElement | undefined;
      if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [currentIdx, levels, ticker.last, playing]);

  // Playback
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!playing) return;
    const tickMs = 30;
    timerRef.current = setInterval(() => {
      const data = tradesRef.current;
      if (!data.length) return;
      const sp = speedRef.current;
      const step = Math.max(1, Math.round(sp));
      setCurrentIdx((prev) => {
        if (prev >= data.length - 1) {
          setPlaying(false);
          return prev;
        }
        return Math.min(data.length - 1, prev + step);
      });
    }, tickMs);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing]);

  const togglePlay = useCallback(() => {
    const data = tradesRef.current;
    if (!data.length) return;
    const idx = idxRef.current;
    if (idx >= data.length - 1) {
      setCurrentIdx(0);
      lastAppliedRef.current = -1;
      setPlaying(true);
      return;
    }
    if (idx < 0) {
      setCurrentIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, []);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setCurrentIdx((prev) => {
      const max = tradesRef.current.length - 1;
      return prev < max ? prev + 1 : prev;
    });
  }, []);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const jumpToStart = useCallback(() => {
    setPlaying(false);
    lastAppliedRef.current = -1;
    setCurrentIdx(tradesRef.current.length > 0 ? 0 : -1);
  }, []);

  const jumpToEnd = useCallback(() => {
    setPlaying(false);
    lastAppliedRef.current = -1;
    const n = tradesRef.current.length;
    setCurrentIdx(n > 0 ? n - 1 : -1);
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => {
      const i = SPEEDS.indexOf(s);
      return SPEEDS[(i + 1) % SPEEDS.length];
    });
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.code === "ArrowRight") {
        e.preventDefault();
        stepForward();
      }
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, stepForward, stepBack]);

  // ── Trade done by price (levels with both sides) ──
  const windowSlice = useMemo(() => {
    if (currentIdx < 0 || trades.length === 0) return [] as RunningTrade[];
    const start = Math.max(0, currentIdx - LIST_WINDOW + 1);
    const out: RunningTrade[] = [];
    for (let i = currentIdx; i >= start; i--) out.push(trades[i]);
    return out;
  }, [trades, currentIdx]);

  // Stats
  const { cumBuy, cumSell, totalValue } = useMemo(() => {
    let b = 0, s = 0, v = 0;
    for (let i = 0; i <= currentIdx && i < trades.length; i++) {
      const t = trades[i];
      if (t.side === "BUY") b += t.lot;
      else s += t.lot;
      v += t.lot * 100 * t.price;
    }
    return { cumBuy: b, cumSell: s, totalValue: v };
  }, [trades, currentIdx]);

  const totalLots = cumBuy + cumSell;
  const vwap = useMemo(() => calcVWAP(trades, currentIdx), [trades, currentIdx]);
  const totalFreq = useMemo(() => levels.reduce((s, l) => s + l.freq, 0), [levels]);
  const totalBidLot = useMemo(() => levels.reduce((s, l) => s + l.bidVol, 0), [levels]);
  const totalOfferLot = useMemo(() => levels.reduce((s, l) => s + l.offerVol, 0), [levels]);
  const maxVol = useMemo(
    () => Math.max(...levels.map((l) => Math.max(l.bidVol, l.offerVol)), 1),
    [levels]
  );

  const currentTime = currentIdx >= 0 && trades[currentIdx] ? trades[currentIdx].time : "—";
  const endTime = trades.length > 0 ? trades[trades.length - 1].time : "—";
  const startTime = trades.length > 0 ? trades[0].time : "—";
  const prevPrice = trades.length > 0 ? trades[0].price : ticker.open || ticker.last;
  const changeAbs = ticker.last - prevPrice;
  const changePct = prevPrice > 0 ? (changeAbs / prevPrice) * 100 : 0;
  const progress = trades.length > 1 ? (currentIdx / (trades.length - 1)) * 100 : 0;

  // Filter levels to show only rows with trade activity (freq > 0 on either side)
  const tradeDoneLevels = useMemo(
    () => levels.filter((l) => l.freq > 0),
    [levels]
  );

  return (
    <div className="flex h-screen flex-col bg-[#0B0E11] text-[#EAECEF] overflow-hidden font-['Inter',system-ui,sans-serif] text-[11px]">
      <Navbar />
      <div className="h-14 shrink-0" aria-hidden />

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#12161C] border-b border-[#1E2329] px-3 py-2 shrink-0">
        <Field label="Ticker">
          <div className="relative" ref={tickerBoxRef}>
            <input
              value={tickerInput}
              onChange={(e) => { setTickerInput(e.target.value.toUpperCase()); setTickerOpen(true); }}
              onFocus={() => setTickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const next = availableTickers.includes(tickerInput) ? tickerInput : filteredTickers[0];
                  if (next) { setTickerInput(next); setTickerCode(next); setTickerOpen(false); }
                }
                if (e.key === "Escape") setTickerOpen(false);
              }}
              placeholder="Cari saham..."
              className="bg-[#0B0E11] border border-[#2B3139] px-2 py-1 rounded text-[11px] text-[#F0B90B] font-bold w-[88px] focus:outline-none focus:border-[#F0B90B]/60 uppercase"
            />
            {tickerOpen && tickerInput && (
              <div className="absolute top-full left-0 z-50 mt-0.5 max-h-[280px] overflow-y-auto bg-[#1E2329] border border-[#2B3139] rounded shadow-lg">
                {filteredTickers.map((t) => (
                  <div key={t}
                    className={`px-2.5 py-1 text-[11px] cursor-pointer hover:bg-[#2B3139] ${t === tickerCode ? "text-[#F0B90B]" : "text-[#EAECEF]"}`}
                    onMouseDown={() => { setTickerInput(t); setTickerCode(t); setTickerOpen(false); }}
                  >{t}</div>
                ))}
                {filteredTickers.length === 0 && <div className="px-2.5 py-1.5 text-[11px] text-[#5E6673]">Tidak ada ticker</div>}
              </div>
            )}
          </div>
        </Field>

        <Field label="Date">
          <select
            className="bg-black text-white p-1 border border-gray-700"
            value={selectedDate}
            onChange={(e) => { const d = e.target.value; setSelectedDate(d); fetchTickerData(tickerCode, d); }}
          >
            {availableDates.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </Field>

        <Field label="Broker">
          <label className="flex items-center gap-1.5 text-[#848E9C] cursor-pointer select-none">
            <input type="checkbox" checked={showBroker} onChange={() => setShowBroker((p) => !p)} className="accent-[#F0B90B]" />
            <span className="text-[10px]">Show</span>
          </label>
        </Field>

        <button type="button" onClick={() => fetchTickerData(tickerCode)}
          disabled={loadingData}
          className="bg-[#F0B90B] hover:bg-[#F8D12F] disabled:opacity-50 text-[#0B0E11] text-[11px] font-bold px-4 py-1 rounded transition-colors ml-auto cursor-pointer"
        >{loadingData ? "..." : "Show"}</button>
      </div>

      {/* ── Title + playback ── */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0E1218] border-b border-[#1E2329] px-3 py-2 shrink-0 relative z-20">
        <div className="flex items-center gap-1 shrink-0">
          <Ctrl onClick={jumpToStart}>⏮</Ctrl>
          <Ctrl onClick={stepBack}>◀</Ctrl>
          <Ctrl onClick={togglePlay} active={playing} big>{playing ? "⏸" : "▶"}</Ctrl>
          <Ctrl onClick={stepForward}>▶</Ctrl>
          <Ctrl onClick={jumpToEnd}>⏭</Ctrl>
        </div>
        <h1 className="text-[13px] font-bold text-white tracking-wide truncate">{tickerCode} — BID-OFFER REPLAY</h1>
        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1E2329] text-[#848E9C] px-1.5 py-0.5 rounded shrink-0">{currentIdx + 1}/{trades.length || 0}</span>
        <span className="text-[#F0B90B] font-bold min-w-[64px] font-mono text-[11px]">{currentTime}</span>
        <div className="flex-1 min-w-[120px] max-w-[360px]">
          <input type="range" min={0} max={Math.max(0, trades.length - 1)} value={Math.max(0, currentIdx)}
            onChange={(e) => { setPlaying(false); lastAppliedRef.current = -1; setCurrentIdx(Number(e.target.value)); }}
            className="w-full h-1.5 accent-[#F0B90B] cursor-pointer" disabled={trades.length === 0 || loadingData}
          />
        </div>
        <button type="button" onClick={cycleSpeed} className="px-2 py-1 rounded bg-[#1E2329] border border-[#2B3139] text-[#F0B90B] font-mono font-bold text-[11px] hover:border-[#F0B90B]/50 min-w-[48px] cursor-pointer">{speed}x</button>
        <div className="text-[10px] text-[#5E6673] hidden md:block">Space · ← →</div>
      </div>

      {/* ── Price summary ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#12161C] border-b border-[#1E2329] px-3 py-1.5 text-[11px] shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-white">{tickerCode}</span>
          <span className="text-[15px] font-bold text-[#F0B90B] font-mono">{ticker.last ? fmtPrice(ticker.last) : "—"}</span>
        </div>
        <Stat label="Prev" value={fmtPrice(prevPrice)} />
        <Stat label="Chg" value={`${changeAbs >= 0 ? "+" : ""}${fmtPrice(changeAbs)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`} color={changeAbs >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"} />
        <Stat label="Open" value={fmtPrice(ticker.open)} />
        <Stat label="High" value={fmtPrice(ticker.high)} color="text-[#0ECB81]" />
        <Stat label="Low" value={fmtPrice(ticker.low)} color="text-[#F6465D]" />
        <Stat label="Lot" value={fmt(totalLots)} />
        <Stat label="Value" value={totalValue >= 1e9 ? `${(totalValue / 1e9).toFixed(2)} B` : totalValue >= 1e6 ? `${(totalValue / 1e6).toFixed(1)} M` : fmt(totalValue)} />
        <Stat label="WAP" value={vwap ? fmtPrice(Math.round(vwap)) : "—"} color="text-[#F0B90B]" />
        <Stat label="Freq" value={fmt(totalFreq)} />
      </div>

      {loadingData && (
        <div className="bg-[#F0B90B]/10 text-[#F0B90B] text-center text-[11px] py-1 shrink-0">Loading trade data…</div>
      )}

      {/* ── Container: Orderbook Depth (top) + Trade Done (bottom) ── */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* DEPTH — classic bid/offer */}
        <div className="flex flex-col min-h-0 shrink basis-1/2">
          <div className="text-[10px] font-bold px-2 py-1 uppercase tracking-wider bg-[#1E2329] text-[#848E9C] flex justify-between shrink-0">
            <span>Orderbook Depth</span>
            <span className="opacity-60 normal-case tracking-normal">{levels.length} levels</span>
          </div>
          <div className="grid grid-cols-6 gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] shrink-0">
            <span className="text-center">Freq</span>
            <span className="text-right">BLot</span>
            <span className="text-right">Bid</span>
            <span className="text-right">Offer</span>
            <span className="text-right">SLot</span>
            <span className="text-center">Freq</span>
          </div>
          <div ref={orderBookRef} className="flex-1 overflow-y-auto overscroll-contain">
            {levels.map((lv) => {
              const isLast = lv.price === ticker.last;
              const bidPct = (lv.bidVol / maxVol) * 100;
              const offerPct = (lv.offerVol / maxVol) * 100;
              return (
                <div key={lv.price}
                  className={`relative grid grid-cols-6 gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${isLast ? "bg-[#F0B90B]/10" : ""}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <div className="absolute inset-y-0 left-0 bg-[#0ECB81]/10 pointer-events-none" style={{ width: `${bidPct / 2}%` }} />
                  <div className="absolute inset-y-0 right-0 bg-[#F6465D]/10 pointer-events-none" style={{ width: `${offerPct / 2}%` }} />
                  <span className="relative text-center text-[#0ECB81]/70 font-bold z-[1]">{lv.freq}</span>
                  <span className="relative text-right text-[#0ECB81] font-bold z-[1]">{fmt(lv.bidVol)}</span>
                  <span className={`relative text-right font-bold z-[1] ${isLast ? "text-[#F0B90B]" : "text-white"}`}>{fmtPrice(lv.price)}</span>
                  <span className={`relative text-right font-bold z-[1] ${isLast ? "text-[#F0B90B]" : "text-white"}`}>{fmtPrice(lv.price)}</span>
                  <span className="relative text-right text-[#F6465D] font-bold z-[1]">{fmt(lv.offerVol)}</span>
                  <span className="relative text-center text-[#F6465D]/70 font-bold z-[1]">{lv.freq}</span>
                </div>
              );
            })}
            {levels.length === 0 && <Empty />}
          </div>
          {/* Depth total row */}
          {levels.length > 0 && (
            <div className="border-t border-[#1E2329] bg-[#0E1218] px-1.5 py-1 text-[9px] font-mono text-[#848E9C] grid grid-cols-7 gap-0 shrink-0">
              <span className="text-[#5E6673]">TOTAL</span>
              <span className="text-[#0ECB81] text-right">{fmt(totalFreq)}</span>
              <span className="text-[#0ECB81] text-right">{fmt(totalBidLot)}</span>
              <span className="text-right">—</span>
              <span className="text-[#F6465D] text-right">{fmt(totalOfferLot)}</span>
              <span className="text-[#F6465D] text-right">{fmt(totalFreq)}</span>
              <span className="text-white text-right font-bold">{fmt(totalBidLot + totalOfferLot)}</span>
            </div>
          )}
        </div>

        {/* TRADE DONE BY PRICE — aggregated per level */}
        <div className="flex flex-col min-h-0 shrink basis-1/2 border-t border-[#1E2329]">
          <div className="text-[10px] font-bold px-2 py-1 uppercase tracking-wider bg-[#0D1F3C] text-[#3B82F6] flex justify-between shrink-0">
            <span>Trade Done</span>
            <span className="opacity-60 normal-case tracking-normal">{levels.length} levels</span>
          </div>
          <div className="grid grid-cols-7 gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] shrink-0">
            <span className="text-right">Price</span>
            <span className="text-center">B Freq</span>
            <span className="text-right">B Lot</span>
            <span className="text-right">S Lot</span>
            <span className="text-center">S Freq</span>
            <span className="text-center">Freq</span>
            <span className="text-right">Lot</span>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {levels.map((lv) => {
              const isLast = lv.price === ticker.last;
              return (
                <div key={lv.price}
                  className={`grid grid-cols-7 gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${isLast ? "bg-[#F0B90B]/10" : ""}`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span className={`text-right font-bold ${isLast ? "text-[#F0B90B]" : "text-white"}`}>{fmtPrice(lv.price)}</span>
                  <span className="text-center text-[#0ECB81]/80 font-bold">{lv.bidVol > 0 ? lv.freq : 0}</span>
                  <span className="text-right text-[#0ECB81] font-bold">{fmt(lv.bidVol)}</span>
                  <span className="text-right text-[#F6465D] font-bold">{fmt(lv.offerVol)}</span>
                  <span className="text-center text-[#F6465D]/80 font-bold">{lv.offerVol > 0 ? lv.freq : 0}</span>
                  <span className="text-center text-white font-bold">{lv.freq}</span>
                  <span className="text-right text-white font-bold">{fmt(lv.bidVol + lv.offerVol)}</span>
                </div>
              );
            })}
          </div>
          {/* Total row */}
          {levels.length > 0 && (
            <div className="border-t border-[#1E2329] bg-[#0E1218] px-1.5 py-1 text-[9px] font-mono text-[#848E9C] grid grid-cols-7 gap-0 shrink-0">
              <span className="text-[#5E6673]">TOTAL</span>
              <span className="text-right" />
              <span className="text-[#0ECB81] text-right">{fmt(totalBidLot)}</span>
              <span className="text-[#F6465D] text-right">{fmt(totalOfferLot)}</span>
              <span className="text-right" />
              <span className="text-center text-white">{fmt(totalFreq)}</span>
              <span className="text-white text-right font-bold">{fmt(totalBidLot + totalOfferLot)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="h-7 bg-[#0E1218] border-t border-[#1E2329] px-3 flex items-center justify-between text-[10px] font-bold shrink-0">
        <div className="flex gap-4">
          <span><span className="text-[#5E6673] uppercase mr-1">Buy Vol</span><span className="text-[#0ECB81] font-mono">{fmt(cumBuy)}</span></span>
          <span><span className="text-[#5E6673] uppercase mr-1">Sell Vol</span><span className="text-[#F6465D] font-mono">{fmt(cumSell)}</span></span>
          <span><span className="text-[#5E6673] uppercase mr-1">Net</span><span className={`font-mono ${cumBuy - cumSell >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}`}>{fmt(cumBuy - cumSell)}</span></span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-24 h-1 bg-[#1E2329] rounded overflow-hidden hidden sm:block">
            <div className="h-full bg-[#F0B90B] transition-all duration-75" style={{ width: `${progress}%` }} />
          </div>
          <span><span className="text-[#5E6673] uppercase mr-1">VWAP</span><span className="text-[#F0B90B] font-mono">{vwap ? fmtPrice(Math.round(vwap)) : "—"}</span></span>
          <span><span className="text-[#5E6673] uppercase mr-1">Total</span><span className="text-white font-mono">{fmt(totalLots)}</span></span>
        </div>
      </div>
    </div>
  );
}

/* ── UI atoms ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 shrink-0"><span className="text-[9px] text-[#5E6673] uppercase font-bold tracking-wide">{label}</span>{children}</div>;
}

function Ctrl({ children, onClick, active, big }: { children: React.ReactNode; onClick: () => void; active?: boolean; big?: boolean }) {
  return (
    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`${big ? "w-9 h-9 text-[14px]" : "w-7 h-7 text-[11px]"} flex items-center justify-center rounded border transition-colors cursor-pointer select-none ${active ? "bg-[#F0B90B] border-[#F0B90B] text-[#0B0E11]" : "bg-[#1E2329] border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]/50 hover:text-[#F0B90B]"}`}
    >{children}</button>
  );
}

function Stat({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return <div className="flex items-center gap-1"><span className="text-[#5E6673] text-[9px] uppercase">{label}</span><span className={`font-mono font-bold ${color}`}>{value}</span></div>;
}

function Empty() {
  return <div className="flex items-center justify-center h-24 text-[#5E6673] text-[11px]">No data</div>;
}
