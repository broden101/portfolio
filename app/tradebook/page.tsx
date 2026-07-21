"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  parseCSV,
  buildOrderBook,
  calcVWAP,
  brokerSummary,
  type RunningTrade,
  type OrderLevel,
  type TickerInfo,
} from "@/lib/orderbook";

type TradeFilter = "all" | "buy" | "sell";

const SPEEDS = [0.5, 1, 2, 5, 10, 25, 50];

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
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<TradeFilter>("all");
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
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [levels, setLevels] = useState<OrderLevel[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<RunningTrade[]>([]);
  const [dateLabel, setDateLabel] = useState("—");
  const [showBroker, setShowBroker] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderBookRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const sellRef = useRef<HTMLDivElement>(null);

  // Load available tickers
  useEffect(() => {
    fetch("/data/trades-index.json")
      .then((r) => r.json())
      .then((d) => {
        if (d.tickers) setAvailableTickers(d.tickers);
        if (d.date) setDateLabel(d.date);
      })
      .catch(() => {});
  }, []);

  const fetchTickerData = async (code: string) => {
    setLoadingData(true);
    setPlaying(false);
    try {
      const res = await fetch(`/data/trades/${code}.json`);
      if (res.ok) {
        const data = await res.json();
        loadData(data);
      }
    } catch (e) {
      console.error("Load failed", e);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    fetchTickerData(tickerCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, currentIdx, playing]);

  // Rebuild book on index change
  useEffect(() => {
    if (trades.length === 0 || currentIdx < 0) {
      setLevels([]);
      setTicker({
        code: tickerCode,
        last: 0,
        change: 0,
        high: 0,
        low: 0,
        open: 0,
        volume: 0,
      });
      setVisibleTrades([]);
      return;
    }
    const { levels: lv, ticker: tk } = buildOrderBook(trades, currentIdx);
    setLevels(lv);
    setTicker(tk);

    const shown = trades.slice(0, currentIdx + 1).reverse();
    setVisibleTrades(
      filter === "all"
        ? shown
        : shown.filter((t) => (filter === "buy" ? t.side === "BUY" : t.side === "SELL"))
    );
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

  // Auto-scroll running trade to top
  useEffect(() => {
    if (tradesRef.current) tradesRef.current.scrollTop = 0;
    if (buyRef.current) buyRef.current.scrollTop = 0;
    if (sellRef.current) sellRef.current.scrollTop = 0;
  }, [currentIdx]);

  // Playback timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing && currentIdx < trades.length - 1) {
      const ms = Math.max(5, 1000 / speed);
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed, trades.length, currentIdx]);

  const loadData = useCallback((data: RunningTrade[]) => {
    setTrades(data);
    // Start at beginning for replay feel (first trade), like bandarmolony
    // User can jump with slider. Default show last for quick overview.
    setCurrentIdx(data.length > 0 ? data.length - 1 : -1);
    setPlaying(false);
  }, []);

  const togglePlay = () => {
    if (trades.length === 0) return;
    if (currentIdx >= trades.length - 1) {
      setCurrentIdx(0);
      setPlaying(true);
      return;
    }
    if (currentIdx < 0) {
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

  const jumpToStart = () => {
    setPlaying(false);
    setCurrentIdx(trades.length > 0 ? 0 : -1);
  };

  const jumpToEnd = () => {
    setPlaying(false);
    setCurrentIdx(trades.length > 0 ? trades.length - 1 : -1);
  };

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  };

  // Stats
  const buyTrades = useMemo(
    () => visibleTrades.filter((t) => t.side === "BUY"),
    [visibleTrades]
  );
  const sellTrades = useMemo(
    () => visibleTrades.filter((t) => t.side === "SELL"),
    [visibleTrades]
  );
  const cumBuy = buyTrades.reduce((s, t) => s + t.lot, 0);
  const cumSell = sellTrades.reduce((s, t) => s + t.lot, 0);
  const totalLots = cumBuy + cumSell;
  const vwap = calcVWAP(trades, currentIdx);
  const totalFreq = levels.reduce((s, l) => s + l.freq, 0);
  const totalBidLot = levels.reduce((s, l) => s + l.bidVol, 0);
  const totalOfferLot = levels.reduce((s, l) => s + l.offerVol, 0);
  const totalValue = useMemo(() => {
    let v = 0;
    for (let i = 0; i <= currentIdx && i < trades.length; i++) {
      v += trades[i].lot * 100 * trades[i].price; // lot * 100 shares * price
    }
    return v;
  }, [trades, currentIdx]);

  const currentTime =
    currentIdx >= 0 && trades[currentIdx] ? trades[currentIdx].time : "—";
  const endTime = trades.length > 0 ? trades[trades.length - 1].time : "—";
  const startTime = trades.length > 0 ? trades[0].time : "—";
  const prevPrice =
    currentIdx > 0 ? trades[0].price : ticker.open || ticker.last;
  const changeAbs = ticker.last - prevPrice;
  const changePct = prevPrice > 0 ? (changeAbs / prevPrice) * 100 : 0;
  const progress = trades.length > 1 ? (currentIdx / (trades.length - 1)) * 100 : 0;

  // Broker top for current price level
  const brokersAtLast = useMemo(() => {
    if (currentIdx < 0) return { buy: [] as string[], sell: [] as string[] };
    const buyB = new Set<string>();
    const sellB = new Set<string>();
    for (let i = 0; i <= currentIdx && i < trades.length; i++) {
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

      {/* spacer for fixed Navbar (h ~56-64px) */}
      <div className="h-14 shrink-0" aria-hidden />

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-[#12161C] border-b border-[#1E2329] px-3 py-2 shrink-0">
        <Field label="Ticker">
          {availableTickers.length > 0 ? (
            <select
              value={tickerCode}
              onChange={(e) => {
                setTickerCode(e.target.value);
                fetchTickerData(e.target.value);
              }}
              className="bg-[#0B0E11] border border-[#2B3139] px-2 py-1 rounded text-[11px] text-[#F0B90B] font-bold min-w-[72px] focus:outline-none focus:border-[#F0B90B]/60"
            >
              {availableTickers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          ) : (
            <Box>{tickerCode}</Box>
          )}
        </Field>

        <Field label="Date">
          <Box min="90px">{loadingData ? "Loading..." : dateLabel || "20/07/2026"}</Box>
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
          onClick={() => fetchTickerData(tickerCode)}
          disabled={loadingData}
          className="bg-[#F0B90B] hover:bg-[#F8D12F] disabled:opacity-50 text-[#0B0E11] text-[11px] font-bold px-4 py-1 rounded transition-colors ml-auto"
        >
          {loadingData ? "..." : "Show"}
        </button>
      </div>

      {/* ── Title + playback strip ── */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0E1218] border-b border-[#1E2329] px-3 py-1.5 shrink-0 relative z-10">
        {/* Transport first so always visible */}
        <div className="flex items-center gap-1 order-first shrink-0">
          <Ctrl onClick={jumpToStart} title="Start">
            ⏮
          </Ctrl>
          <Ctrl onClick={stepBack} title="Step back">
            ◀
          </Ctrl>
          <Ctrl onClick={togglePlay} title="Play/Pause" active={playing}>
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

        {/* Progress slider */}
        <div className="flex-1 min-w-[120px] max-w-[360px]">
          <input
            type="range"
            min={0}
            max={Math.max(0, trades.length - 1)}
            value={Math.max(0, currentIdx)}
            onChange={(e) => {
              setPlaying(false);
              setCurrentIdx(Number(e.target.value));
            }}
            className="w-full h-1.5 accent-[#F0B90B] cursor-pointer"
            disabled={trades.length === 0}
          />
        </div>

        <button
          onClick={cycleSpeed}
          className="px-2 py-0.5 rounded bg-[#1E2329] border border-[#2B3139] text-[#F0B90B] font-mono font-bold text-[11px] hover:border-[#F0B90B]/50 min-w-[44px]"
          title="Cycle speed"
        >
          {speed}x
        </button>

        <div className="text-[10px] text-[#5E6673] hidden sm:block">
          Space play · ← → step
        </div>
      </div>

      {/* ── Price summary ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#12161C] border-b border-[#1E2329] px-3 py-1.5 text-[11px]">
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
        <Stat label="Freq" value={fmt(totalFreq)} />
      </div>

      {/* ── Main 4-panel grid ── */}
      <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
        {/* BUY ORDERS */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#0B2E21] text-[#0ECB81]"
          title="Buy Orders"
          count={`${buyTrades.length} orders`}
        >
          <TableHead cols={["Ord", "Time", "Price", "Lot", "Inv", showBroker ? "Br" : "", "St"]} />
          <div ref={buyRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {buyTrades.map((t, i) => (
              <Row key={`b-${i}`} green hover>
                <Cell muted>{buyTrades.length - i}</Cell>
                <Cell muted>{t.time}</Cell>
                <Cell className="text-[#0ECB81] font-bold">{fmtPrice(t.price)}</Cell>
                <Cell className="text-white font-bold text-right">{fmt(t.lot)}</Cell>
                <Cell className="text-white text-right">{fmt(t.lot)}</Cell>
                {showBroker && <Cell className="text-[#F0B90B] font-bold text-right">{t.broker || "—"}</Cell>}
                <Cell className="text-[#0ECB81]/70 text-right">O</Cell>
              </Row>
            ))}
            {buyTrades.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* ORDERBOOK DEPTH */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#1E2329] text-[#848E9C]"
          title="Orderbook Depth"
          count={`${levels.length} levels`}
        >
          <div className="grid grid-cols-6 gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] sticky top-0 z-10">
            <span className="text-center">Freq</span>
            <span className="text-right">BLot</span>
            <span className="text-right">Bid</span>
            <span className="text-right">Offer</span>
            <span className="text-right">SLot</span>
            <span className="text-center">Freq</span>
          </div>
          <div ref={orderBookRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {levels.map((lv, i) => {
              const isLast = lv.price === ticker.last;
              const maxVol = Math.max(...levels.map((l) => Math.max(l.bidVol, l.offerVol)), 1);
              const bidPct = (lv.bidVol / maxVol) * 100;
              const offerPct = (lv.offerVol / maxVol) * 100;
              return (
                <div
                  key={i}
                  className={`relative grid grid-cols-6 gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${
                    isLast ? "bg-[#F0B90B]/10" : "hover:bg-white/[0.02]"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {/* depth bars */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[#0ECB81]/10 pointer-events-none"
                    style={{ width: `${bidPct / 2}%` }}
                  />
                  <div
                    className="absolute inset-y-0 right-0 bg-[#F6465D]/10 pointer-events-none"
                    style={{ width: `${offerPct / 2}%` }}
                  />
                  <span className="relative text-center text-[#0ECB81]/70 font-bold z-[1]">
                    {lv.freq}
                  </span>
                  <span className="relative text-right text-[#0ECB81] font-bold z-[1]">
                    {fmt(lv.bidVol)}
                  </span>
                  <span
                    className={`relative text-right font-bold z-[1] ${
                      isLast ? "text-[#F0B90B] bg-[#F0B90B]/20 px-0.5 rounded" : "text-white"
                    }`}
                  >
                    {fmtPrice(lv.price)}
                  </span>
                  <span
                    className={`relative text-right font-bold z-[1] ${
                      isLast ? "text-[#F0B90B] bg-[#F0B90B]/20 px-0.5 rounded" : "text-white"
                    }`}
                  >
                    {fmtPrice(lv.price)}
                  </span>
                  <span className="relative text-right text-[#F6465D] font-bold z-[1]">
                    {fmt(lv.offerVol)}
                  </span>
                  <span className="relative text-center text-[#F6465D]/70 font-bold z-[1]">
                    {lv.freq}
                  </span>
                </div>
              );
            })}
            {levels.length === 0 && <Empty />}
          </div>
          {/* Bottom aggregate */}
          <div className="border-t border-[#1E2329] bg-[#0E1218] px-1.5 py-1 text-[9px] font-mono text-[#848E9C] grid grid-cols-7 gap-0">
            <span className="text-[#5E6673]">TOTAL</span>
            <span className="text-[#0ECB81] text-right">{fmt(totalFreq)}</span>
            <span className="text-[#0ECB81] text-right">{fmt(totalBidLot)}</span>
            <span className="text-right">—</span>
            <span className="text-[#F6465D] text-right">{fmt(totalOfferLot)}</span>
            <span className="text-[#F6465D] text-right">{fmt(totalFreq)}</span>
            <span className="text-white text-right font-bold">{fmt(totalBidLot + totalOfferLot)}</span>
          </div>
          {showBroker && ticker.last > 0 && (
            <div className="border-t border-[#1E2329] bg-[#0E1218] px-1.5 py-1 text-[9px] flex flex-wrap gap-x-2 gap-y-0.5">
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

        {/* SELL ORDERS */}
        <Panel
          className="col-span-3 border-r border-[#1E2329]"
          headerClass="bg-[#3D1218] text-[#F6465D]"
          title="Sell Orders"
          count={`${sellTrades.length} orders`}
        >
          <TableHead cols={["Ord", "Time", "Price", "Lot", "Inv", showBroker ? "Br" : "", "St"]} />
          <div ref={sellRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {sellTrades.map((t, i) => (
              <Row key={`s-${i}`} red hover>
                <Cell muted>{sellTrades.length - i}</Cell>
                <Cell muted>{t.time}</Cell>
                <Cell className="text-[#F6465D] font-bold">{fmtPrice(t.price)}</Cell>
                <Cell className="text-white font-bold text-right">{fmt(t.lot)}</Cell>
                <Cell className="text-white text-right">{fmt(t.lot)}</Cell>
                {showBroker && <Cell className="text-[#F0B90B] font-bold text-right">{t.broker || "—"}</Cell>}
                <Cell className="text-[#F6465D]/70 text-right">O</Cell>
              </Row>
            ))}
            {sellTrades.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* RUNNING TRADE */}
        <Panel
          className="col-span-3"
          headerClass="bg-[#0D1F3C] text-[#3B82F6]"
          title="Running Trade"
          count={`${visibleTrades.length} trades`}
        >
          <div className="grid grid-cols-7 gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] sticky top-0 z-10">
            <span>Time</span>
            <span className="text-center">Stock</span>
            <span className="text-right">Price</span>
            <span className="text-right">Lot</span>
            <span className="text-right">Buyer</span>
            <span className="text-right">Seller</span>
            <span className="text-right">Side</span>
          </div>
          <div ref={tradesRef} className="flex-1 overflow-y-auto scrollbar-thin">
            {visibleTrades.map((t, i) => {
              const isBuy = t.side === "BUY";
              return (
                <div
                  key={`rt-${i}`}
                  className={`grid grid-cols-7 gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 hover:bg-[#0D1F3C]/40 ${
                    i === 0 ? "bg-[#F0B90B]/[0.06]" : ""
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <span className="text-[#848E9C]">{t.time}</span>
                  <span className="text-center text-[#F0B90B] font-bold">{t.code}</span>
                  <span className="text-right text-white font-bold">{fmtPrice(t.price)}</span>
                  <span className="text-right text-[#F0B90B] font-bold">{fmt(t.lot)}</span>
                  <span className={`text-right font-bold ${isBuy ? "text-[#0ECB81]" : "text-[#5E6673]"}`}>
                    {isBuy ? t.broker || "??" : "—"}
                  </span>
                  <span className={`text-right font-bold ${!isBuy ? "text-[#F6465D]" : "text-[#5E6673]"}`}>
                    {!isBuy ? t.broker || "??" : "—"}
                  </span>
                  <span className={`text-right font-bold ${isBuy ? "text-[#0ECB81]" : "text-[#F6465D]"}`}>
                    {isBuy ? "B" : "S"}
                  </span>
                </div>
              );
            })}
            {visibleTrades.length === 0 && <Empty />}
          </div>
        </Panel>
      </div>

      {/* ── Bottom bar ── */}
      <div className="h-7 bg-[#0E1218] border-t border-[#1E2329] px-3 flex items-center justify-between text-[10px] font-bold">
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
              className={`font-mono ${
                cumBuy - cumSell >= 0 ? "text-[#0ECB81]" : "text-[#F6465D]"
              }`}
            >
              {fmt(cumBuy - cumSell)}
            </span>
          </span>
        </div>
        <div className="flex gap-4 items-center">
          {/* mini progress */}
          <div className="w-24 h-1 bg-[#1E2329] rounded overflow-hidden hidden sm:block">
            <div
              className="h-full bg-[#F0B90B] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>
            <span className="text-[#5E6673] uppercase mr-1">VWAP</span>
            <span className="text-[#F0B90B] font-mono">{vwap ? fmtPrice(Math.round(vwap)) : "—"}</span>
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

/* ── small UI atoms ── */

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
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded border text-[11px] transition-colors ${
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
      className="grid gap-0 border-b border-[#1E2329] px-1.5 py-1 text-[9px] text-[#5E6673] uppercase font-bold bg-[#0E1218] sticky top-0 z-10"
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
  hover,
}: {
  children: React.ReactNode;
  green?: boolean;
  red?: boolean;
  hover?: boolean;
}) {
  const cols = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return (
    <div
      className={`grid gap-0 px-1.5 py-[2px] text-[10px] border-b border-[#1E2329]/40 ${
        hover
          ? green
            ? "hover:bg-[#0B2E21]/40"
            : red
            ? "hover:bg-[#3D1218]/40"
            : "hover:bg-white/[0.02]"
          : ""
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
    <div className="flex items-center justify-center h-24 text-[#5E6673] text-[11px]">
      No data
    </div>
  );
}
