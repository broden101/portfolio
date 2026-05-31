"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  parseCSV,
  buildOrderBook,
  generateSampleData,
  type RunningTrade,
  type OrderLevel,
  type TickerInfo,
} from "@/lib/orderbook";

type Tab = "backtest" | "data" | "stats";
type TradeFilter = "all" | "buy" | "sell";

export default function OrderBookPage() {
  const [tab, setTab] = useState<Tab>("backtest");
  const [trades, setTrades] = useState<RunningTrade[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<TradeFilter>("all");
  const [csvText, setCsvText] = useState("");
  const [ticker, setTicker] = useState<TickerInfo>({ code: "—", last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
  const [levels, setLevels] = useState<OrderLevel[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<RunningTrade[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<HTMLDivElement>(null);

  // Update order book when index changes
  useEffect(() => {
    if (trades.length === 0 || currentIdx < 0) {
      setLevels([]);
      setTicker({ code: "—", last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
      setVisibleTrades([]);
      return;
    }
    const { levels: lv, ticker: tk } = buildOrderBook(trades, currentIdx);
    setLevels(lv);
    setTicker(tk);

    // Show trades up to current index, filter
    const shown = trades.slice(0, currentIdx + 1).reverse();
    setVisibleTrades(filter === "all" ? shown : shown.filter((t) => filter === "buy" ? t.side === "BUY" : t.side === "SELL"));
  }, [trades, currentIdx, filter]);

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

  // Auto-scroll trades to top
  useEffect(() => {
    if (tradesRef.current) tradesRef.current.scrollTop = 0;
  }, [visibleTrades.length]);

  const loadData = useCallback((data: RunningTrade[]) => {
    setTrades(data);
    setCurrentIdx(-1);
    setPlaying(false);
    setVisibleTrades([]);
    setLevels([]);
    setTicker({ code: data[0]?.code || "—", last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) loadData(parsed);
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    const parsed = parseCSV(csvText);
    if (parsed.length > 0) loadData(parsed);
  };

  const handleGenerate = () => {
    loadData(generateSampleData());
  };

  const handleReset = () => {
    setTrades([]);
    setCurrentIdx(-1);
    setPlaying(false);
    setLevels([]);
    setVisibleTrades([]);
    setTicker({ code: "—", last: 0, change: 0, high: 0, low: 0, open: 0, volume: 0 });
    setCsvText("");
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

  return (
    <div className="flex h-screen flex-col bg-[#0B0B0A] text-[#F4EFE6] px-2 py-2 overflow-hidden font-['Inter']">
      {/* Header */}
      <header className="mb-2 flex items-center justify-between bg-[#141210] border border-[#2C261E] px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-[#F4EFE6] font-['Cormorant_Garamond']">📈 OrderBook Backtest</h1>
        </div>
        <nav className="flex gap-1 bg-[#0B0B0A] border border-[#2C261E] p-0.5">
          {([
            { id: "backtest", icon: "🎮", label: "Backtest" },
            { id: "data", icon: "📂", label: "Data" },
            { id: "stats", icon: "📊", label: "Stats" },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${tab === t.id ? "bg-[#2C261E] text-[#C6A15B]" : "text-[#B8AA96]/50 hover:text-[#B8AA96]"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        {/* Order Book Panel */}
        <div className="w-[320px] flex-shrink-0">
          <div className="flex h-full flex-col border border-[#2C261E] bg-[#141210]">
            {/* Ticker Header */}
            <div className="border-b border-[#2C261E] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-[#F4EFE6] font-['Cormorant_Garamond']">Order Book</span>
                  <span className="ml-2 text-xs text-[#B8AA96]/40">Real-time</span>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${ticker.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{ticker.last || "0"}</div>
                  <div className={`text-xs ${ticker.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{ticker.change >= 0 ? "+" : ""}{ticker.change.toFixed(2)}%</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-[#B8AA96]">
                <div><span className="text-[#B8AA96]/30">H</span> {ticker.high || "0"}</div>
                <div><span className="text-[#B8AA96]/30">L</span> {ticker.low || "0"}</div>
                <div><span className="text-[#B8AA96]/30">O</span> {ticker.open || "0"}</div>
                <div><span className="text-[#B8AA96]/30">Vol</span> {ticker.volume || "0"}</div>
              </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-4 gap-2 border-b border-[#2C261E] px-3 py-1.5 text-[10px] text-[#B8AA96]/40">
              <span className="text-left">Bid</span>
              <span className="text-center">Price</span>
              <span className="text-center">Offer</span>
              <span className="text-right">Freq</span>
            </div>

            {/* Order Book Levels */}
            <div ref={orderBookRef} className="flex-1 overflow-y-auto">
              {levels.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-[#B8AA96]/30">Load data to view Order Book</div>
              ) : (
                levels.map((lv, i) => {
                  const bidPct = maxFreq > 0 ? (lv.bidVol / (lv.bidVol + lv.offerVol || 1)) * 100 : 0;
                  const offerPct = 100 - bidPct;
                  const isLast = lv.price === ticker.last;
                  return (
                    <div key={i} className={`grid grid-cols-4 gap-2 px-3 py-1 text-xs border-b border-[#2C261E]/30 ${isLast ? "bg-[#C6A15B]/[0.06]" : "hover:bg-[#C6A15B]/[0.02]"}`}>
                      {/* Bid bar */}
                      <div className="relative flex items-center">
                        <div className="absolute inset-0 bg-emerald-500/10" style={{ width: `${bidPct}%` }} />
                        <span className="relative text-emerald-400 font-mono text-[11px]">{lv.bidVol || ""}</span>
                      </div>
                      {/* Price */}
                      <div className={`text-center font-mono font-medium text-[11px] ${isLast ? "text-[#C6A15B]" : "text-[#F4EFE6]"}`}>
                        {lv.price.toLocaleString("id-ID")}
                      </div>
                      {/* Offer bar */}
                      <div className="relative flex items-center justify-end">
                        <div className="absolute inset-0 bg-red-500/10" style={{ width: `${offerPct}%`, marginLeft: "auto" }} />
                        <span className="relative text-red-400 font-mono text-[11px]">{lv.offerVol || ""}</span>
                      </div>
                      {/* Freq */}
                      <div className="text-right font-mono text-[#B8AA96]/50 text-[11px]">{lv.freq}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#2C261E] p-2 text-[10px] text-[#B8AA96]/40">
              Freq: {totalFreq} · Val: Rp{totalVal.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* Center + Right Panel */}
        <div className="flex flex-1 gap-2 overflow-hidden">
          {/* Running Trades */}
          <div className="flex-1">
            <div className="flex h-full flex-col border border-[#2C261E] bg-[#141210]">
              <div className="border-b border-[#2C261E] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-[#F4EFE6] font-['Cormorant_Garamond']">Running Trade</span>
                    <span className="ml-2 text-xs text-[#B8AA96]/40">{Math.max(0, currentIdx + 1)} trades</span>
                  </div>
                  <div className="text-xs text-[#B8AA96]/40">{currentIdx + 1}/{trades.length}</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    {(["all", "buy", "sell"] as const).map((f) => (
                      <button key={f} onClick={() => setFilter(f)} className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${filter === f ? "bg-[#2C261E] text-[#C6A15B]" : "text-[#B8AA96]/40 hover:text-[#B8AA96]"}`}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setVisibleTrades([])} className="text-xs text-[#B8AA96]/30 hover:text-red-400 transition-colors">Clear All</button>
                </div>
                <div className="mt-2 grid grid-cols-7 gap-1 border-t border-[#2C261E] pt-2 text-[10px] text-[#B8AA96]/40">
                  <span className="col-span-2">Time</span>
                  <span>Code</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Lot</span>
                  <span className="text-right">Chg%</span>
                  <span className="text-right">Side</span>
                </div>
              </div>

              <div ref={tradesRef} className="flex-1 overflow-y-auto">
                {visibleTrades.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-sm text-[#B8AA96]/30">No trades yet — load or start playback</div>
                ) : (
                  visibleTrades.map((t, i) => (
                    <div key={i} className="grid grid-cols-7 gap-1 px-3 py-1.5 text-xs border-b border-[#2C261E]/30 hover:bg-[#C6A15B]/[0.02]">
                      <span className="col-span-2 font-mono text-[#B8AA96]/60">{t.time}</span>
                      <span className="text-[#C6A15B] font-semibold">{t.code}</span>
                      <span className="text-right font-mono text-[#F4EFE6]">{t.price.toLocaleString("id-ID")}</span>
                      <span className="text-right text-[#B8AA96]">{t.lot}</span>
                      <span className={`text-right font-mono ${t.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.change >= 0 ? "+" : ""}{t.change.toFixed(2)}</span>
                      <span className={`text-right font-semibold ${t.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{t.side}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-[#2C261E] p-2 text-[10px] text-[#B8AA96]/40">
                <span className="text-emerald-400">BUY {buyTrades}</span> · <span className="text-red-400">SELL {sellTrades}</span> · Total lot {totalLots}
              </div>
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="w-[340px] flex-shrink-0 overflow-y-auto space-y-4">
            {/* Backtest Controls */}
            <div className="border border-[#2C261E] bg-[#141210] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#F4EFE6]">🎮 Backtest Controls</h3>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, trades.length - 1)}
                  value={currentIdx}
                  onChange={(e) => { setPlaying(false); setCurrentIdx(parseInt(e.target.value)); }}
                  className="w-full h-1 appearance-none bg-[#2C261E] outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#C6A15B] [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <button onClick={stepBack} disabled={currentIdx <= 0} className="rounded bg-[#2C261E] px-2 py-0.5 text-xs text-[#B8AA96] hover:text-[#F4EFE6] disabled:opacity-30 disabled:cursor-not-allowed">⏮</button>
                <button onClick={togglePlay} disabled={trades.length === 0} className="rounded bg-[#2C261E] px-2 py-0.5 text-xs text-emerald-400 hover:bg-[#3A2C1A] disabled:opacity-30 disabled:cursor-not-allowed">
                  {playing ? "⏸" : "▶"}
                </button>
                <button onClick={stepForward} disabled={currentIdx >= trades.length - 1} className="rounded bg-[#2C261E] px-2 py-0.5 text-xs text-[#B8AA96] hover:text-[#F4EFE6] disabled:opacity-30 disabled:cursor-not-allowed">⏭</button>
                <div className="flex-1" />
                {[1, 2, 5, 10, 20, 50, 100].map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${speed === s ? "bg-[#C6A15B]/20 text-[#C6A15B] border border-[#C6A15B]/30" : "text-[#B8AA96]/40 hover:text-[#B8AA96]"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Data Source */}
            {tab === "data" && (
              <div className="border border-[#2C261E] bg-[#141210] p-4">
                <h3 className="mb-3 text-sm font-medium text-[#F4EFE6]">📂 Data Source</h3>
                <div className="space-y-3">
                  <div onClick={() => fileRef.current?.click()} className="cursor-pointer rounded-lg border-2 border-dashed border-[#2C261E] p-4 text-center hover:border-[#C6A15B]/30 transition-colors">
                    <p className="text-xs text-[#B8AA96]/60">Upload CSV Running Trade</p>
                    <p className="mt-1 text-[10px] text-[#B8AA96]/30">Format: Time,Code,Price,Lot,Change,Side</p>
                    <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  </div>

                  <div>
                    <textarea
                      rows={4}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2 font-mono text-xs text-[#F4EFE6] placeholder-[#B8AA96]/20 resize-none"
                      placeholder={"Paste CSV data here...\nTime,Code,Price,Lot,Change,Side\n09:30:01,BUMI,170,10,0.00,BUY\n09:30:05,BUMI,169,25,-0.58,SELL"}
                    />
                    <button onClick={handlePasteLoad} className="mt-2 w-full py-2 border border-[#2C261E] text-xs text-[#B8AA96] hover:text-[#C6A15B] hover:border-[#C6A15B]/30 transition-colors">📥 Load from Text</button>
                  </div>

                  <button onClick={handleGenerate} className="w-full py-2 border border-[#2C261E] text-xs text-[#B8AA96] hover:text-[#C6A15B] hover:border-[#C6A15B]/30 transition-colors">
                    🎲 Generate Sample Data (BUMI)
                  </button>

                  <button onClick={handleReset} className="w-full text-xs text-[#B8AA96]/30 hover:text-red-400 transition-colors py-1">
                    🔄 Reset All Data
                  </button>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {tab === "stats" && (
              <div className="border border-[#2C261E] bg-[#141210] p-4">
                <h3 className="mb-3 text-sm font-medium text-[#F4EFE6]">📊 Session Stats</h3>
                <div className="space-y-3 text-xs">
                  {[
                    { label: "Total Trades", value: `${currentIdx + 1} / ${trades.length}` },
                    { label: "Total Buy Volume", value: `${visibleTrades.filter(t => t.side === "BUY").reduce((s, t) => s + t.lot, 0)} lots` },
                    { label: "Total Sell Volume", value: `${visibleTrades.filter(t => t.side === "SELL").reduce((s, t) => s + t.lot, 0)} lots` },
                    { label: "Price Range", value: levels.length > 0 ? `${Math.min(...levels.map(l => l.price))} — ${Math.max(...levels.map(l => l.price))}` : "—" },
                    { label: "Unique Price Levels", value: levels.length.toString() },
                    { label: "Total Volume", value: `${ticker.volume} lots` },
                    { label: "Net Flow", value: `${buyTrades - sellTrades} trades` },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between border-b border-[#2C261E]/50 pb-2">
                      <span className="text-[#B8AA96]/60">{s.label}</span>
                      <span className="text-[#F4EFE6] font-mono">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info (when on backtest tab) */}
            {tab === "backtest" && (
              <div className="border border-[#2C261E] bg-[#141210] p-4">
                <h3 className="mb-3 text-sm font-medium text-[#F4EFE6]">Quick Info</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-[#B8AA96]/60">Status</span><span className={playing ? "text-emerald-400" : "text-[#B8AA96]/40"}>{playing ? "▶ Playing" : currentIdx >= 0 ? "⏸ Paused" : "⏹ Ready"}</span></div>
                  <div className="flex justify-between"><span className="text-[#B8AA96]/60">Speed</span><span className="text-[#C6A15B] font-mono">{speed}x</span></div>
                  <div className="flex justify-between"><span className="text-[#B8AA96]/60">Progress</span><span className="text-[#F4EFE6] font-mono">{trades.length > 0 ? ((currentIdx + 1) / trades.length * 100).toFixed(1) : "0"}%</span></div>
                  <div className="flex justify-between"><span className="text-[#B8AA96]/60">Ticker</span><span className="text-[#C6A15B] font-semibold">{ticker.code}</span></div>
                </div>
              </div>
            )}

            {/* Data tab always shows source */}
            {tab !== "data" && (
              <div className="border border-[#2C261E] bg-[#141210] p-4">
                <h3 className="mb-3 text-sm font-medium text-[#F4EFE6]">📂 Data Source</h3>
                <div className="space-y-2">
                  <button onClick={handleGenerate} className="w-full py-2 border border-[#2C261E] text-xs text-[#B8AA96] hover:text-[#C6A15B] hover:border-[#C6A15B]/30 transition-colors">
                    🎲 Generate Sample Data
                  </button>
                  <button onClick={() => { setTab("data"); }} className="w-full py-2 border border-[#2C261E] text-xs text-[#B8AA96] hover:text-[#C6A15B] hover:border-[#C6A15B]/30 transition-colors">
                    📂 Upload / Paste CSV
                  </button>
                  {trades.length > 0 && (
                    <button onClick={handleReset} className="w-full text-xs text-[#B8AA96]/30 hover:text-red-400 transition-colors py-1">🔄 Reset</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
