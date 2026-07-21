"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  parseCSV,
  buildOrderBook,
  generateSampleData,
  calcVWAP,
  brokerSummary,
  type RunningTrade,
  type OrderLevel,
  type TickerInfo,
} from "@/lib/orderbook";

type Tab = "backtest" | "data" | "stats";
type TradeFilter = "all" | "buy" | "sell";

const BIG_LOT = 10;

export default function OrderBookPage() {
  const [tab, setTab] = useState<Tab>("backtest");
  const [trades, setTrades] = useState<RunningTrade[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<TradeFilter>("all");
  const [csvText, setCsvText] = useState("");
  const [ticker, setTicker] = useState<TickerInfo>({ code: "TLKM", last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
  const [tickerCode, setTickerCode] = useState("DEWA");
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [levels, setLevels] = useState<OrderLevel[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<RunningTrade[]>([]);
  const [hasBroker, setHasBroker] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<HTMLDivElement>(null);

  // Load available tickers index on mount
  useEffect(() => {
    fetch("/data/trades-index.json")
      .then((r) => r.json())
      .then((d) => { if (d.tickers) setAvailableTickers(d.tickers); })
      .catch(() => {});
  }, []);

  // Load ticker data from server
  const fetchTickerData = async (code: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/data/trades/${code}.json`);
      if (res.ok) {
        const data = await res.json();
        loadData(data);
      }
    } catch (e) { console.error("Load failed", e); }
    setLoadingData(false);
  };

  // Auto-load on mount
  useEffect(() => {
    fetchTickerData(tickerCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") { e.preventDefault(); stepForward(); }
      if (e.code === "ArrowLeft") { e.preventDefault(); stepBack(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trades, currentIdx, playing]);

  // Update order book when index changes
  useEffect(() => {
    if (trades.length === 0 || currentIdx < 0) {
      setLevels([]);
      setTicker({ code: tickerCode, last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
      setVisibleTrades([]);
      return;
    }
    const { levels: lv, ticker: tk } = buildOrderBook(trades, currentIdx);
    setLevels(lv);
    setTicker(tk);

    const shown = trades.slice(0, currentIdx + 1).reverse();
    setVisibleTrades(filter === "all" ? shown : shown.filter((t) => filter === "buy" ? t.side === "BUY" : t.side === "SELL"));
  }, [trades, currentIdx, filter, tickerCode]);

  // Auto-scroll orderbook to last price
  useEffect(() => {
    if (!orderBookRef.current || levels.length === 0) return;
    const idx = levels.findIndex((l) => l.price === ticker.last);
    if (idx >= 0) {
      const el = orderBookRef.current.children[idx] as HTMLElement;
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentIdx, levels, ticker.last]);

  // Playback
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing && currentIdx < trades.length - 1) {
      const ms = Math.max(10, 1000 / speed);
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= trades.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speed, trades.length, currentIdx]);

  const loadData = useCallback((data: RunningTrade[]) => {
    setTrades(data);
    setCurrentIdx(data.length - 1);
    setPlaying(false);
    setHasBroker(data.some((t) => !!t.broker));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      if (parsed.length > 0) loadData(parsed);
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    const parsed = parseCSV(csvText);
    if (parsed.length > 0) loadData(parsed);
  };

  const handleGenerate = () => {
    const data = generateSampleData();
    loadData(data);
  };

  const handleReset = () => {
    setTrades([]);
    setCurrentIdx(-1);
    setPlaying(false);
    setVisibleTrades([]);
    setLevels([]);
  };

  const togglePlay = () => {
    if (currentIdx < 0 && trades.length > 0) {
      setCurrentIdx(0);
      setPlaying(true);
    } else {
      setPlaying(!playing);
    }
  };

  const stepForward = () => {
    if (currentIdx < trades.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const stepBack = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const maxFreq = Math.max(...levels.map((l) => l.freq), 1);
  const buyTrades = visibleTrades.filter((t) => t.side === "BUY").length;
  const sellTrades = visibleTrades.filter((t) => t.side === "SELL").length;
  const totalLots = visibleTrades.reduce((s, t) => s + t.lot, 0);
  const totalFreq = levels.reduce((s, l) => s + l.freq, 0);
  const totalVal = levels.reduce((s, l) => s + (l.bidVol + l.offerVol) * l.price, 0);
  const vwap = calcVWAP(trades, currentIdx);
  const cumBuy = visibleTrades.filter((t) => t.side === "BUY").reduce((s, t) => s + t.lot, 0);
  const cumSell = visibleTrades.filter((t) => t.side === "SELL").reduce((s, t) => s + t.lot, 0);
  const maxCum = Math.max(cumBuy, cumSell, 1);
  const brokerMap = brokerSummary(trades, currentIdx);

  return (
    <div className="flex h-screen flex-col bg-[#050505] text-[#F4EFE6] overflow-hidden font-['Inter']">
      <Navbar />

        {/* Top Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#0A0A0A] border-b border-[#1A1A1A] px-2 py-1.5 min-h-[40px]">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-[#B8AA96]/40 px-1 uppercase font-bold">Ticker</span>
            {availableTickers.length > 0 ? (
              <select
                value={tickerCode}
                onChange={(e) => { setTickerCode(e.target.value); fetchTickerData(e.target.value); }}
                className="bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded text-xs text-[#C6A15B] font-bold min-w-[70px] focus:outline-none focus:border-[#C6A15B]/50"
              >
                {availableTickers.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <div className="bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded text-xs text-[#C6A15B] font-bold min-w-[60px]">{ticker.code}</div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-[#B8AA96]/40 px-1 uppercase font-bold">Date</span>
            <div className="bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded text-xs text-[#B8AA96] min-w-[80px]">
              {loadingData ? "Loading..." : "20/07/2026"}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-[#B8AA96]/40 px-1 uppercase font-bold">Broker</span>
            <div className="bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded text-xs text-[#B8AA96] min-w-[50px]">ALL</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-[#B8AA96]/40 px-1 uppercase font-bold">Time</span>
            <div className="bg-[#141210] border border-[#2C261E] px-2 py-0.5 rounded text-xs text-[#B8AA96] min-w-[70px]">ALL</div>
          </div>
          <button onClick={() => fetchTickerData(tickerCode)} className="bg-[#C6A15B] hover:bg-[#A6813B] text-[#0A0A0A] text-[11px] font-bold px-3 py-1 rounded ml-auto transition-colors shrink-0">
            {loadingData ? "..." : "LOAD"}
          </button>
          <div className="flex gap-1 ml-2 shrink-0">
            <button onClick={togglePlay} className="w-8 h-7 flex items-center justify-center bg-[#141210] border border-[#2C261E] rounded text-[#C6A15B] hover:bg-[#2C261E] transition-colors">{playing ? "⏸" : "▶"}</button>
            <button onClick={stepBack} className="w-8 h-7 flex items-center justify-center bg-[#141210] border border-[#2C261E] rounded text-[#B8AA96]/60 hover:bg-[#2C261E] transition-colors">⏮</button>
            <button onClick={stepForward} className="w-8 h-7 flex items-center justify-center bg-[#141210] border border-[#2C261E] rounded text-[#B8AA96]/60 hover:bg-[#2C261E] transition-colors">⏭</button>
            <div className="flex items-center px-2 bg-[#141210] border border-[#2C261E] rounded text-[10px] text-[#C6A15B] font-mono">{speed}x</div>
          </div>
        </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Panels Grid */}
        <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden bg-[#0A0A0A]">
          {/* Panel Left: Buy Orders (3 cols) */}
          <div className="col-span-3 flex flex-col border-r border-[#1A1A1A] overflow-hidden">
            <div className="bg-[#103D2E] text-[#10B981] text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex justify-between">
              <span>Buy Orders</span>
              <span className="opacity-60">{visibleTrades.filter(t => t.side === "BUY").length} orders</span>
            </div>
            <div className="grid grid-cols-8 gap-0 border-b border-[#1A1A1A] px-1 py-1 text-[9px] text-[#B8AA96]/40 uppercase font-bold bg-[#0D0D0D]" style={{fontVariantNumeric:"tabular-nums"}}>
              <span className="col-span-1 text-left">Ord</span>
              <span className="col-span-2 text-center">Time</span>
              <span className="col-span-1 text-right">Price</span>
              <span className="col-span-1 text-right">Rls</span>
              <span className="col-span-1 text-right">Open</span>
              <span className="col-span-1 text-right">Inv</span>
              <span className="col-span-1 text-right">Br</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {visibleTrades.filter(t => t.side === "BUY").map((t, i) => (
                <div key={i} className="grid grid-cols-8 gap-0 px-1 py-[1.5px] text-[10px] border-b border-[#1A1A1A]/30 hover:bg-[#103D2E]/10" style={{fontVariantNumeric:"tabular-nums"}}>
                  <span className="col-span-1 text-[#B8AA96]/30">#</span>
                  <span className="col-span-2 text-center text-[#B8AA96]/60">{t.time}</span>
                  <span className="col-span-1 text-right text-emerald-400 font-bold">{t.price}</span>
                  <span className="col-span-1 text-right text-[#B8AA96]/40">0</span>
                  <span className="col-span-1 text-right text-white font-bold">{t.lot}</span>
                  <span className="col-span-1 text-right text-white font-bold">{t.lot}</span>
                  <span className="col-span-1 text-right text-[#C6A15B] font-bold">{t.broker || "—"}</span>
                  <span className="col-span-1 text-right text-emerald-500/60 font-bold">O</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Center: Orderbook Depth (3 cols) */}
          <div className="col-span-3 flex flex-col border-r border-[#1A1A1A] overflow-hidden">
            <div className="bg-[#1A1A1A] text-[#B8AA96] text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex justify-between">
              <span>Orderbook Depth</span>
              <span className="opacity-60">{levels.length} levels</span>
            </div>
            <div className="grid grid-cols-6 gap-0 border-b border-[#1A1A1A] px-1 py-1 text-[9px] text-[#B8AA96]/40 uppercase font-bold bg-[#0D0D0D]" style={{fontVariantNumeric:"tabular-nums"}}>
              <span className="text-center">Freq</span>
              <span className="text-right">Blot</span>
              <span className="text-right">Bid</span>
              <span className="text-right">Offer</span>
              <span className="text-right">Slot</span>
              <span className="text-right">Freq</span>
            </div>
            <div ref={orderBookRef} className="flex-1 overflow-y-auto scrollbar-hide">
              {levels.map((lv, i) => {
                const isLast = lv.price === ticker.last;
                return (
                  <div key={i} className={`grid grid-cols-6 gap-0 px-1 py-[1.5px] text-[10px] border-b border-[#1A1A1A]/30 ${isLast ? "bg-[#C6A15B]/[0.08]" : "hover:bg-white/[0.02]"}`} style={{fontVariantNumeric:"tabular-nums"}}>
                    <span className="text-center text-emerald-400/60 font-bold">{lv.freq}</span>
                    <span className="text-right text-emerald-400 font-bold">{lv.bidVol}</span>
                    <span className={`text-right font-bold ${isLast ? "text-[#C6A15B] bg-[#C6A15B]/20" : "text-white"}`}>{lv.price}</span>
                    <span className={`text-right font-bold ${isLast ? "text-[#C6A15B] bg-[#C6A15B]/20" : "text-white"}`}>{lv.price}</span>
                    <span className="text-right text-red-400 font-bold">{lv.offerVol}</span>
                    <span className="text-right text-red-400/60 font-bold">{lv.freq}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel Right: Sell Orders (3 cols) */}
          <div className="col-span-3 flex flex-col border-r border-[#1A1A1A] overflow-hidden">
            <div className="bg-[#4D1C1C] text-[#EF4444] text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex justify-between">
              <span>Sell Orders</span>
              <span className="opacity-60">{visibleTrades.filter(t => t.side === "SELL").length} orders</span>
            </div>
            <div className="grid grid-cols-8 gap-0 border-b border-[#1A1A1A] px-1 py-1 text-[9px] text-[#B8AA96]/40 uppercase font-bold bg-[#0D0D0D]" style={{fontVariantNumeric:"tabular-nums"}}>
              <span className="col-span-1 text-left">Ord</span>
              <span className="col-span-2 text-center">Time</span>
              <span className="col-span-1 text-right">Price</span>
              <span className="col-span-1 text-right">Rls</span>
              <span className="col-span-1 text-right">Open</span>
              <span className="col-span-1 text-right">Inv</span>
              <span className="col-span-1 text-right">Br</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {visibleTrades.filter(t => t.side === "SELL").map((t, i) => (
                <div key={i} className="grid grid-cols-8 gap-0 px-1 py-[1.5px] text-[10px] border-b border-[#1A1A1A]/30 hover:bg-[#4D1C1C]/10" style={{fontVariantNumeric:"tabular-nums"}}>
                  <span className="col-span-1 text-[#B8AA96]/30">#</span>
                  <span className="col-span-2 text-center text-[#B8AA96]/60">{t.time}</span>
                  <span className="col-span-1 text-right text-red-400 font-bold">{t.price}</span>
                  <span className="col-span-1 text-right text-[#B8AA96]/40">0</span>
                  <span className="col-span-1 text-right text-white font-bold">{t.lot}</span>
                  <span className="col-span-1 text-right text-white font-bold">{t.lot}</span>
                  <span className="col-span-1 text-right text-[#C6A15B] font-bold">{t.broker || "—"}</span>
                  <span className="col-span-1 text-right text-red-500/60 font-bold">O</span>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Right Extra: Running Trade (3 cols) */}
          <div className="col-span-3 flex flex-col overflow-hidden">
            <div className="bg-[#1C2C4D] text-[#3B82F6] text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex justify-between">
              <span>Running Trade</span>
              <span className="opacity-60">{visibleTrades.length} trades</span>
            </div>
            <div className="grid grid-cols-8 gap-0 border-b border-[#1A1A1A] px-1 py-1 text-[9px] text-[#B8AA96]/40 uppercase font-bold bg-[#0D0D0D]" style={{fontVariantNumeric:"tabular-nums"}}>
              <span className="col-span-1 text-left">Time</span>
              <span className="col-span-1 text-center">Stock</span>
              <span className="col-span-1 text-right">Price</span>
              <span className="col-span-1 text-right">Lot</span>
              <span className="col-span-1 text-right">Buy</span>
              <span className="col-span-1 text-right">Sel</span>
              <span className="col-span-1 text-right">BO</span>
              <span className="col-span-1 text-right">SO</span>
            </div>
            <div ref={tradesRef} className="flex-1 overflow-y-auto scrollbar-hide">
              {visibleTrades.map((t, i) => (
                <div key={i} className="grid grid-cols-8 gap-0 px-1 py-[1.5px] text-[10px] border-b border-[#1A1A1A]/30 hover:bg-[#1C2C4D]/10" style={{fontVariantNumeric:"tabular-nums"}}>
                  <span className="col-span-1 text-[#B8AA96]/60">{t.time}</span>
                  <span className="col-span-1 text-center text-[#C6A15B] font-bold">{t.code}</span>
                  <span className="col-span-1 text-right text-white font-bold">{t.price}</span>
                  <span className="col-span-1 text-right text-[#C6A15B] font-bold">{t.lot}</span>
                  <span className="col-span-1 text-right text-emerald-400 font-bold">{t.side === "BUY" ? (t.broker || "??") : "—"}</span>
                  <span className="col-span-1 text-right text-red-400 font-bold">{t.side === "SELL" ? (t.broker || "??") : "—"}</span>
                  <span className="col-span-1 text-right text-[#B8AA96]/40">#</span>
                  <span className="col-span-1 text-right text-[#B8AA96]/40">#</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Stats Summary */}
        <div className="h-8 bg-[#0D0D0D] border-t border-[#1A1A1A] px-2 flex items-center justify-between text-[10px] font-bold text-[#B8AA96]/60">
          <div className="flex gap-4">
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">Buy Vol:</span><span className="text-emerald-400 font-mono">{cumBuy.toLocaleString("id-ID")}</span></div>
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">Sell Vol:</span><span className="text-red-400 font-mono">{cumSell.toLocaleString("id-ID")}</span></div>
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">Net Flow:</span><span className={`${cumBuy - cumSell >= 0 ? "text-emerald-400" : "text-red-400"} font-mono`}>{(cumBuy - cumSell).toLocaleString("id-ID")}</span></div>
          </div>
          <div className="flex gap-4">
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">VWAP:</span><span className="text-[#C6A15B] font-mono">{vwap.toFixed(0)}</span></div>
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">Total:</span><span className="text-white font-mono">{totalLots.toLocaleString("id-ID")}</span></div>
            <div className="flex gap-1.5"><span className="text-[#B8AA96]/30 uppercase">Change:</span><span className={`${ticker.change >= 0 ? "text-emerald-400" : "text-red-400"} font-mono`}>{ticker.change >= 0 ? "+" : ""}{ticker.change.toFixed(2)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
