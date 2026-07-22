"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  buildOrderBook,
  calcVWAP,
  type RunningTrade,
  type OrderLevel,
  type DepthLevel,
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
  const [depthLevels, setDepthLevels] = useState<DepthLevel[]>([]);
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
        lv = { price: t.price, bidVol: 0, offerVol: 0, freq: 0, buyBrokers: [], sellBrokers: [] };
        map.set(t.price, lv);
      }
      if (t.side === "BUY") {
        lv.bidVol += t.lot;
        const b = t.buyer || t.broker;
        if (b && !lv.buyBrokers.includes(b)) lv.buyBrokers.push(b);
      } else {
        lv.offerVol += t.lot;
        const s = t.seller || t.broker;
        if (s && !lv.sellBrokers.includes(s)) lv.sellBrokers.push(s);
      }
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
      // Start at 0 for replay — light render; user jumps via slider
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
        const depthUrl = isLatest
          ? `/data/depth/${code}.json`
          : `/data/depth-history/${targetDate}/${code}.json`;
        
        const [res, dRes] = await Promise.all([fetch(url), fetch(depthUrl)]);
        if (res.ok) {
          const data = await res.json();
          loadData(data, code);
        }
        if (dRes.ok) {
          const depthData = await dRes.json();
          setDepthLevels(depthData);
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
    // Sequential forward by small step → incremental
    if (prev >= 0 && currentIdx > prev && currentIdx - prev <= 50) {
      applyForward(trades, prev, currentIdx);
      lastAppliedRef.current = currentIdx;
      return;
    }
    // Seek / jump / backward → full rebuild
    applyBookFromScratch(trades, currentIdx, tickerCode);
    lastAppliedRef.current = currentIdx;
  }, [trades, currentIdx, tickerCode, applyForward, applyBookFromScratch]);

  // Auto-scroll orderbook only when not playing (smooth is expensive)
  useEffect(() => {
    if (playing) return;
    if (!orderBookRef.current || levels.length === 0) return;
    const idx = levels.findIndex((l) => l.price === ticker.last);
    if (idx >= 0) {
      const el = orderBookRef.current.children[idx] as HTMLElement | undefined;
      if (el) el.scrollIntoView({ block: "center", behavior: "auto" });
    }
  }, [currentIdx, levels, ticker.last, playing]);

  // Playback — interval stable; uses refs; batch steps by speed
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!playing) return;

    // Base tick ~30ms; advance multiple trades per tick at high speed
    const tickMs = 30;
    timerRef.current = setInterval(() => {
      const data = tradesRef.current;
      if (!data.length) return;
      const sp = speedRef.current;
      // trades per tick: at 1x ≈ 1 trade / 100ms → ~3 ticks = 1 trade
      // simplify: advance `sp` trades every tick at 30ms → 1x = ~33 trades/s
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

  // Keyboard — stable handlers via refs
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

  // ── Windowed lists (only last LIST_WINDOW trades) ──
  const windowSlice = useMemo(() => {
    if (currentIdx < 0 || trades.length === 0) return [] as RunningTrade[];
    const start = Math.max(0, currentIdx - LIST_WINDOW + 1);
    // newest first
    const out: RunningTrade[] = [];
    for (let i = currentIdx; i >= start; i--) out.push(trades[i]);
    return out;
  }, [trades, currentIdx]);

  const buyTrades = useMemo(
    () => windowSlice.filter((t) => t.side === "BUY"),
    [windowSlice]
  );
  const sellTrades = useMemo(
    () => windowSlice.filter((t) => t.side === "SELL"),
    [windowSlice]
  );

  // Cumulative stats from full range 0..currentIdx (lightweight loop)
  const { cumBuy, cumSell, totalValue } = useMemo(() => {
    let b = 0,
      s = 0,
      v = 0;
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
  const totalDepthBidFreq = useMemo(() => depthLevels.reduce((s, l) => s + l.bidFreq, 0), [depthLevels]);
  const totalDepthBidLot = useMemo(() => depthLevels.reduce((s, l) => s + l.bidLots, 0), [depthLevels]);
  const totalDepthOfferLot = useMemo(() => depthLevels.reduce((s, l) => s + l.offerLots, 0), [depthLevels]);
  const totalDepthOfferFreq = useMemo(() => depthLevels.reduce((s, l) => s + l.offerFreq, 0), [depthLevels]);

  /** Pair bid levels (from trades) with offer levels side-by-side around last price */
  const pairedDepth = useMemo(() => {
    // Bid: levels ≤ lastP, sorted desc (440, 438, ...)
    const bids = levels
      .filter((l) => l.bidVol > 0 && l.price <= ticker.last)
      .sort((a, b) => b.price - a.price);
    
    // Offer: levels ≥ lastP, sorted asc (440, 442, ...)
    const offers = levels
      .filter((l) => l.offerVol > 0 && l.price >= ticker.last)
      .sort((a, b) => a.price - b.price);

    const isActive = currentIdx >= 0 && ticker.last > 0;
    const rows: {
      bidPrice: number; bidFreq: number; bidLots: number; bidBroker: string;
      offerPrice: number; offerFreq: number; offerLots: number; offerBroker: string;
      bidShown: boolean; offerShown: boolean; isLast: boolean;
    }[] = [];

    if (!isActive) return rows;

    const maxRows = Math.max(bids.length, offers.length);
    for (let i = 0; i < maxRows; i++) {
      const b = i < bids.length ? bids[i] : null;
      const o = i < offers.length ? offers[i] : null;
      if (!b && !o) continue;
      
      const bidPrice = b?.price ?? o?.price ?? 0;
      const offerPrice = o?.price ?? b?.price ?? 0;
      const isLastRow = bidPrice === ticker.last || offerPrice === ticker.last;
      
      rows.push({
        bidPrice,
        bidFreq: b?.freq ?? 0,
        bidLots: b?.bidVol ?? 0,
        bidBroker: b?.buyBrokers?.[0] ?? "—",
        offerPrice,
        offerFreq: o?.freq ?? 0,
        offerLots: o?.offerVol ?? 0,
        offerBroker: o?.sellBrokers?.[0] ?? "—",
        bidShown: !!b,
        offerShown: !!o,
        isLast: isLastRow,
      });
    }
    return rows;
  }, [levels, ticker.last, currentIdx]);
  const maxVol = useMemo(
    () => Math.max(...levels.map((l) => Math.max(l.bidVol, l.offerVol)), 1),
    [levels]
  );

  const currentTime =
    currentIdx >= 0 && trades[currentIdx] ? trades[currentIdx].time : "—";
  const endTime = trades.length > 0 ? trades[trades.length - 1].time : "—";
  const startTime = trades.length > 0 ? trades[0].time : "—";
  const prevPrice = trades.length > 0 ? trades[0].price : ticker.open || ticker.last;
  const changeAbs = ticker.last - prevPrice;
  const changePct = prevPrice > 0 ? (changeAbs / prevPrice) * 100 : 0;
  const progress = trades.length > 1 ? (currentIdx / (trades.length - 1)) * 100 : 0;

  const brokersAtLast = useMemo(() => {
    if (currentIdx < 0 || !ticker.last) return { buy: [] as string[], sell: [] as string[] };
    const buyB = new Set<string>();
    const sellB = new Set<string>();
    // only scan window for brokers at last price
    const start = Math.max(0, currentIdx - 500);
    for (let i = start; i <= currentIdx; i++) {
      const t = trades[i];
      if (t.price !== ticker.last || !t.broker) continue;
      if (t.side === "BUY") buyB.add(t.broker);
      else sellB.add(t.broker);
    }
    return { buy: Array.from(buyB).slice(0, 8), sell: Array.from(sellB).slice(0, 8) };
  }, [trades, currentIdx, ticker.last]);

  return (
    <div className="flex h-screen flex-col bg-[#0B0E11] text-[#EAECEF] overflow-hidden font-['Inter',system-ui,sans-serif] text-[11px]">
      <Navbar />
      {/* spacer for fixed Navbar */}
      <div className="h-14 shrink-0" aria-hidden />

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#12161C] border-b border-[#1E2329] px-3 py-2 shrink-0">
        <Field label="Ticker">
          <div className="relative" ref={tickerBoxRef}>
            <input
              value={tickerInput}
              onChange={(e) => {
                setTickerInput(e.target.value.toUpperCase());
                setTickerOpen(true);
              }}
              onFocus={() => setTickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const next = availableTickers.includes(tickerInput) ? tickerInput : filteredTickers[0];
                  if (next) {
                    setTickerInput(next);
                    setTickerCode(next);
                    setTickerOpen(false);
                  }
                }
                if (e.key === "Escape") setTickerOpen(false);
              }}
              placeholder="Cari saham..."
              className="bg-[#0B0E11] border border-[#2B3139] px-2 py-1 rounded text-[11px] text-[#F0B90B] font-bold w-[88px] focus:outline-none focus:border-[#F0B90B]/60 uppercase"
            />
            {tickerOpen && tickerInput && (
              <div className="absolute top-full left-0 z-50 mt-0.5 max-h-[280px] overflow-y-auto bg-[#1E2329] border border-[#2B3139] rounded shadow-lg">
                {filteredTickers.map((t) => (
                    <div
                      key={t}
                      className={`px-2.5 py-1 text-[11px] cursor-pointer hover:bg-[#2B3139] ${
                        t === tickerCode ? "text-[#F0B90B]" : "text-[#EAECEF]"
                      }`}
                      onMouseDown={() => {
                        setTickerInput(t);
                        setTickerCode(t);
                        setTickerOpen(false);
                      }}
                    >
                      {t}
                    </div>
                  ))}
                {filteredTickers.length === 0 && (
                  <div className="px-2.5 py-1.5 text-[11px] text-[#5E6673]">Tidak ada ticker</div>
                )}
              </div>
            )}
          </div>
        </Field>

        <Field label="Date">
          <select
            className="bg-black text-white p-1 border border-gray-700"
            value={selectedDate}
            onChange={(e) => {
              const d = e.target.value;
              setSelectedDate(d);
              fetchTickerData(tickerCode, d);
            }}
          >
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Time">
          <Box min="70px">{startTime}</Box>
          <span className="text-[#5E6673] mx-0.5">–</span>
          <Box min="70px">{endTime}</Box>
        </Field>

        <Field label="Broker">
          <Box min="50px">All</Box>
        </Field>

        <Field label="Board">
          <Box min="40px">RG</Box>
        </Field>

        <label className="flex items-center gap-1.5 text-[#848E9C] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBroker}
            onChange={(e) => setShowBroker(e.target.checked)}
            className="accent-[#F0B90B] w-3 h-3"
          />
          Broker
        </label>

        <button
          type="button"
          onClick={() => fetchTickerData(tickerCode)}
          disabled={loadingData}
          className="bg-[#F0B90B] hover:bg-[#F8D12F] disabled:opacity-50 text-[#0B0E11] text-[11px] font-bold px-4 py-1 rounded transition-colors ml-auto cursor-pointer"
        >
          {loadingData ? "..." : "Show"}
        </button>
      </div>

      {/* ── Title + playback strip ── */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0E1218] border-b border-[#1E2329] px-3 py-2 shrink-0 relative z-20">
        <div className="flex items-center gap-1 shrink-0">
          <Ctrl onClick={jumpToStart} title="Start">
            ⏮
          </Ctrl>
          <Ctrl onClick={stepBack} title="Step back">
            ◀
          </Ctrl>
          <Ctrl onClick={togglePlay} title="Play/Pause" active={playing} big>
            {playing ? "⏸" : "▶"}
          </Ctrl>
          <Ctrl onClick={stepForward} title="Step forward">
            ▶
          </Ctrl>
          <Ctrl onClick={jumpToEnd} title="End">
            ⏭
          </Ctrl>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-[13px] font-bold text-white tracking-wide truncate">
            {tickerCode} — BID-OFFER REPLAY
          </h1>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-[#1E2329] text-[#848E9C] px-1.5 py-0.5 rounded shrink-0">
            {currentIdx + 1}/{trades.length || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-[#F0B90B] font-bold min-w-[64px]">{currentTime}</span>
          <span className="text-[#5E6673]">/</span>
          <span className="text-[#848E9C] min-w-[64px]">{endTime}</span>
        </div>

        <div className="flex-1 min-w-[120px] max-w-[360px]">
          <input
            type="range"
            min={0}
            max={Math.max(0, trades.length - 1)}
            value={Math.max(0, currentIdx)}
            onChange={(e) => {
              setPlaying(false);
              lastAppliedRef.current = -1;
              setCurrentIdx(Number(e.target.value));
            }}
            className="w-full h-1.5 accent-[#F0B90B] cursor-pointer"
            disabled={trades.length === 0 || loadingData}
          />
        </div>

        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2 py-1 rounded bg-[#1E2329] border border-[#2B3139] text-[#F0B90B] font-mono font-bold text-[11px] hover:border-[#F0B90B]/50 min-w-[48px] cursor-pointer"
          title="Cycle speed"
        >
          {speed}x
        </button>

        <div className="text-[10px] text-[#5E6673] hidden md:block">Space · ← →</div>
      </div>

      {/* ── Price summary ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#12161C] border-b border-[#1E2329] px-3 py-1.5 text-[11px] shrink-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-white">{tickerCode}</span>
          <span className="text-[15px] font-bold text-[#F0B90B] font-mono">
            {ticker.last ? fmtPrice(ticker.last) : "—"}
          </span>
        </div>
        <Stat label="Prev" value={fmtPrice(prevPrice)} />
        <Stat
          label="Chg"
          value={`${changeAbs >= 0 ? "+" : ""}${fmtPrice(changeAbs)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`}
          color={changeAbs >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}
        />
        <Stat label="Open" value={fmtPrice(ticker.open)} />
        <Stat label="High" value={fmtPrice(ticker.high)} color="text-[#0ECB81]" />
        <Stat label="Low" value={fmtPrice(ticker.low)} color="text-[#F6465D]" />
        <Stat label="Lot" value={fmt(totalLots)} />
        <Stat
          label="Value"
          value={
            totalValue >= 1e9
              ? `${(totalValue / 1e9).toFixed(2)} B`
              : totalValue >= 1e6
              ? `${(totalValue / 1e6).toFixed(1)} M`
              : fmt(totalValue)
          }
        />
        <Stat label="WAP" value={vwap ? fmtPrice(Math.round(vwap)) : "—"} color="text-[#F0B90B]" />
        <Stat label="Freq" value={fmt(currentIdx + 1)} />
      </div>

      {loadingData && (
        <div className="bg-[#F0B90B]/10 text-[#F0B90B] text-center text-[11px] py-1 shrink-0">
          Loading trade data…
        </div>
      )}

      {/* ── Main 4-panel grid ── */}
      <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
        {/* BUY */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#0B2E21] text-[#0ECB81]"
          title="Buy Orders"
          count={`${buyTrades.length}${currentIdx + 1 > LIST_WINDOW ? "+" : ""} shown`}
        >
          <TableHead cols={["#", "Time", "Price", "Lot", showBroker ? "Br" : "", "St"]} />
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {buyTrades.map((t, i) => (
              <Row key={`b-${currentIdx}-${i}`} green>
                <Cell muted>{i + 1}</Cell>
                <Cell muted>{t.time}</Cell>
                <Cell className="text-[#0ECB81] font-bold">{fmtPrice(t.price)}</Cell>
                <Cell className="text-white font-bold text-right">{fmt(t.lot)}</Cell>
                {showBroker && (
                  <Cell className="text-[#F0B90B] font-bold text-right">{t.broker || "—"}</Cell>
                )}
                <Cell className="text-[#0ECB81]/70 text-right">O</Cell>
              </Row>
            ))}
            {buyTrades.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* DEPTH — 9-col: Freq | B-Brk | BLot | Bid | │ | Offer | SLot | S-Brk | Freq */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#1E2329] text-[#848E9C]"
          title="Orderbook Depth"
          count={`${depthLevels.length} levels`}
        >
          <div className="grid grid-cols-9 gap-0 border-b border-[#1E2329] px-1 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] shrink-0">
            <span className="text-center">Freq</span>
            <span className="text-center">B-Brk</span>
            <span className="text-right">BLot</span>
            <span className="text-right col-span-2">Bid</span>
            <span className="text-left col-span-2">Offer</span>
            <span className="text-left">SLot</span>
            <span className="text-center">S-Brk</span>
            <span className="text-center">Freq</span>
          </div>
          <div ref={orderBookRef} className="flex-1 overflow-y-auto overscroll-contain">
            {pairedDepth.map((row) => {
              return (
                <div
                  key={`${row.bidPrice}-${row.offerPrice}`}
                  className={`grid grid-cols-9 gap-0 px-1 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${
                    row.isLast ? "bg-[#F0B90B]/10" : ""
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span className="text-center text-[#0ECB81]/70 font-bold">{row.bidFreq || ""}</span>
                  <span className="text-center text-[#0ECB81] font-bold">{row.bidBroker !== "—" ? row.bidBroker : ""}</span>
                  <span className="text-right text-[#0ECB81] font-bold">{row.bidLots ? fmt(row.bidLots) : ""}</span>
                  <span className="text-right font-bold text-[#0ECB81]">{row.bidShown ? fmtPrice(row.bidPrice) : ""}</span>
                  <span className="text-center text-[#2B3139] text-[8px] font-bold">{row.bidShown && row.offerShown ? "┃" : ""}</span>
                  <span className="text-left font-bold text-[#F6465D]">{row.offerShown ? fmtPrice(row.offerPrice) : ""}</span>
                  <span className="text-left text-[#F6465D] font-bold">{row.offerLots ? fmt(row.offerLots) : ""}</span>
                  <span className="text-center text-[#F6465D] font-bold">{row.offerBroker !== "—" ? row.offerBroker : ""}</span>
                  <span className="text-center text-[#F6465D]/70 font-bold">{row.offerFreq || ""}</span>
                </div>
              );
            })}
            {pairedDepth.length === 0 && <Empty />}
          </div>
          <div className="border-t border-[#1E2329] bg-[#0E1218] px-1 py-1 text-[9px] font-mono text-[#848E9C] grid grid-cols-9 gap-0 shrink-0">
            <span className="text-[#5E6673]">TOTAL</span>
            <span className="text-[#0ECB81] text-right">{fmt(totalDepthBidFreq)}</span>
            <span className="text-[#0ECB81] text-right">{fmt(totalDepthBidLot)}</span>
            <span className="text-center col-span-2 text-white font-bold">{fmt(totalDepthBidLot + totalDepthOfferLot)}</span>
            <span className="text-center text-[#2B3139] text-[8px]">┃</span>
            <span className="text-[#F6465D] text-left">{fmt(totalDepthOfferLot)}</span>
            <span className="text-[#F6465D] text-center">{fmt(totalDepthOfferFreq)}</span>
            <span className="text-white text-center font-bold">{fmt(totalDepthBidLot + totalDepthOfferLot)}</span>
          </div>
          {showBroker && ticker.last > 0 && (
            <div className="border-t border-[#1E2329] bg-[#0E1218] px-1.5 py-1 text-[9px] flex flex-wrap gap-x-2 gap-y-0.5 shrink-0">
              <span className="text-[#5E6673]">@ {fmtPrice(ticker.last)}</span>
              {brokersAtLast.buy.map((b) => (
                <span key={`bb-${b}`} className="text-[#0ECB81] font-bold">
                  {b}
                </span>
              ))}
              {brokersAtLast.sell.map((b) => (
                <span key={`bs-${b}`} className="text-[#F6465D] font-bold">
                  {b}
                </span>
              ))}
            </div>
          )}
        </Panel>

        {/* SELL */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#3D1218] text-[#F6465D]"
          title="Sell Orders"
          count={`${sellTrades.length}${currentIdx + 1 > LIST_WINDOW ? "+" : ""} shown`}
        >
          <TableHead cols={["#", "Time", "Price", "Lot", showBroker ? "Br" : "", "St"]} />
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {sellTrades.map((t, i) => (
              <Row key={`s-${currentIdx}-${i}`} red>
                <Cell muted>{i + 1}</Cell>
                <Cell muted>{t.time}</Cell>
                <Cell className="text-[#F6465D] font-bold">{fmtPrice(t.price)}</Cell>
                <Cell className="text-white font-bold text-right">{fmt(t.lot)}</Cell>
                {showBroker && (
                  <Cell className="text-[#F0B90B] font-bold text-right">{t.broker || "—"}</Cell>
                )}
                <Cell className="text-[#F6465D]/70 text-right">O</Cell>
              </Row>
            ))}
            {sellTrades.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* RUNNING */}
        <Panel
          className="col-span-3"
          headerClass="bg-[#0D1F3C] text-[#3B82F6]"
          title="Running Trade"
          count={`${windowSlice.length} / ${currentIdx + 1}`}
        >
          <div className="grid grid-cols-7 gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] shrink-0">
            <span>Time</span>
            <span className="text-center">Stock</span>
            <span className="text-right">Price</span>
            <span className="text-right">Lot</span>
            <span className="text-right">Buyer</span>
            <span className="text-right">Seller</span>
            <span className="text-right">Side</span>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {windowSlice.map((t, i) => {
              const isBuy = t.side === "BUY";
              return (
                <div
                  key={`rt-${currentIdx}-${i}`}
                  className={`grid grid-cols-7 gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${
                    i === 0 ? "bg-[#F0B90B]/[0.06]" : ""
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span className="text-[#848E9C]">{t.time}</span>
                  <span className="text-center text-[#F0B90B] font-bold">{t.code}</span>
                  <span className="text-right text-white font-bold">{fmtPrice(t.price)}</span>
                  <span className="text-right text-[#F0B90B] font-bold">{fmt(t.lot)}</span>
                  <span className="text-right font-bold text-[#0ECB81]">
                    {t.buyer || t.broker || "—"}
                  </span>
                  <span className="text-right font-bold text-[#F6465D]">
                    {t.seller || "—"}
                  </span>
                  <span
                    className={`text-right font-bold ${isBuy ? "text-[#0ECB81]" : "text-[#F6465D]"}`}
                  >
                    {isBuy ? "B" : "S"}
                  </span>
                </div>
              );
            })}
            {windowSlice.length === 0 && <Empty />}
          </div>
        </Panel>
      </div>

      {/* ── Bottom bar ── */}
      <div className="h-7 bg-[#0E1218] border-t border-[#1E2329] px-3 flex items-center justify-between text-[10px] font-bold shrink-0">
        <div className="flex gap-4">
          <span>
            <span className="text-[#5E6673] uppercase mr-1">Buy Vol</span>
            <span className="text-[#0ECB81] font-mono">{fmt(cumBuy)}</span>
          </span>
          <span>
            <span className="text-[#5E6673] uppercase mr-1">Sell Vol</span>
            <span className="text-[#F6465D] font-mono">{fmt(cumSell)}</span>
          </span>
          <span>
            <span className="text-[#5E6673] uppercase mr-1">Net</span>
            <span
              className={`font-mono ${cumBuy - cumSell >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"}`}
            >
              {fmt(cumBuy - cumSell)}
            </span>
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <div className="w-24 h-1 bg-[#1E2329] rounded overflow-hidden hidden sm:block">
            <div
              className="h-full bg-[#F0B90B] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>
            <span className="text-[#5E6673] uppercase mr-1">VWAP</span>
            <span className="text-[#F0B90B] font-mono">
              {vwap ? fmtPrice(Math.round(vwap)) : "—"}
            </span>
          </span>
          <span>
            <span className="text-[#5E6673] uppercase mr-1">Total</span>
            <span className="text-white font-mono">{fmt(totalLots)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── UI atoms ── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[9px] text-[#5E6673] uppercase font-bold tracking-wide">{label}</span>
      {children}
    </div>
  );
}

function Box({ children, min = "60px" }: { children: React.ReactNode; min?: string }) {
  return (
    <div
      className="bg-[#0B0E11] border border-[#2B3139] px-2 py-1 rounded text-[11px] text-[#EAECEF] font-mono"
      style={{ minWidth: min }}
    >
      {children}
    </div>
  );
}

function Ctrl({
  children,
  onClick,
  title,
  active,
  big,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`${big ? "w-9 h-9 text-[14px]" : "w-7 h-7 text-[11px]"} flex items-center justify-center rounded border transition-colors cursor-pointer select-none ${
        active
          ? "bg-[#F0B90B] border-[#F0B90B] text-[#0B0E11]"
          : "bg-[#1E2329] border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]/50 hover:text-[#F0B90B]"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[#5E6673] text-[9px] uppercase">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

function Panel({
  className,
  headerClass,
  title,
  count,
  children,
}: {
  className?: string;
  headerClass: string;
  title: string;
  count: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col overflow-hidden min-h-0 ${className || ""}`}>
      <div
        className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex justify-between shrink-0 ${headerClass}`}
      >
        <span>{title}</span>
        <span className="opacity-60 normal-case tracking-normal">{count}</span>
      </div>
      {children}
    </div>
  );
}

function TableHead({ cols }: { cols: string[] }) {
  const filtered = cols.filter(Boolean);
  return (
    <div
      className="grid gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] shrink-0"
      style={{ gridTemplateColumns: `repeat(${filtered.length}, minmax(0, 1fr))` }}
    >
      {filtered.map((c, i) => (
        <span
          key={c + i}
          className={i === 0 ? "text-left" : i === 1 ? "text-center" : "text-right"}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function Row({
  children,
  green,
  red,
}: {
  children: React.ReactNode;
  green?: boolean;
  red?: boolean;
}) {
  const cols = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return (
    <div
      className={`grid gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${
        green ? "hover:bg-[#0B2E21]/40" : red ? "hover:bg-[#3D1218]/40" : ""
      }`}
      style={{
        fontVariantNumeric: "tabular-nums",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

function Cell({
  children,
  className = "",
  muted,
}: {
  children: React.ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span className={`${muted ? "text-[#5E6673]" : ""} ${className}`}>{children}</span>
  );
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-24 text-[#5E6673] text-[11px]">No data</div>
  );
}
