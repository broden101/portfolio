"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  fetchMarketData,
  recommendLabel,
  rsiLabel,
  fmtPct,
  fmtNum,
  fmtMiliar,
  isMarketOpen,
  IHSG_FALLBACK,
  KEY_LEVELS_FALLBACK,
  SECTOR_META,
  MARKET_OVERRIDES,
  type MarketData,
  type Quote,
} from "@/lib/market";

type PerfTab = "Day" | "Week" | "1M" | "YTD";

const TAB_COLUMNS: Record<PerfTab, (q: Quote) => number | null> = {
  Day: (q) => q.change,
  Week: (q) => q.perfWeek,
  "1M": (q) => q.perf1M,
  YTD: (q) => q.perfYTD,
};

export default function IHSGDashboard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PerfTab>("1M");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMarketData();
      setData(next);
      setLastUpdated(next.timestamp);
      setLive(next.ok && next.ihsg != null);
    } catch {
      setLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 60s. isMarketOpen() is a hint for the user; the client polls
    // unconditionally so a re-open or weekend news still surfaces.
    intervalRef.current = setInterval(refresh, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  /* ── Resolve IHSG quote (live → fallback) ── */
  const ihsg: Quote = data?.ihsg ?? IHSG_FALLBACK;
  const ihsgClose = ihsg.close ?? IHSG_FALLBACK.close!;
  const ihsgChange = ihsg.change ?? 0;
  const ihsgUp = ihsgChange >= 0;
  const rec = recommendLabel(ihsg.recommend);
  const rsi = rsiLabel(ihsg.rsi);

  /* ── Trend regime derived from MA position + RSI + recommend ── */
  const trendRegime = useMemo(() => {
    const r = ihsg.recommend ?? IHSG_FALLBACK.recommend!;
    const below50 = ihsg.close != null && ihsg.sma50 != null && ihsg.close < ihsg.sma50;
    const below200 = ihsg.close != null && ihsg.sma200 != null && ihsg.close < ihsg.sma200;
    if (r <= -0.5) return { label: "Strong Sell", color: "text-red-400" };
    if (below200 && below50) return { label: "Bearish", color: "text-red-400" };
    if (below50) return { label: "Below MA50", color: "text-yellow-400" };
    if (r >= 0.5) return { label: "Strong Buy", color: "text-emerald-400" };
    if (r >= 0.1) return { label: "Bullish", color: "text-emerald-400" };
    return { label: "Neutral", color: "text-yellow-400" };
  }, [ihsg]);

  const marketOpen = isMarketOpen();

  /* ── Macro bar: live macro + manually-maintained BI rate & trade balance ── */
  const macroRows = useMemo(() => {
    const m = data?.macro ?? {};
    const usdIdr = m.USDIDR;
    const gold = m.GOLD;
    const brent = m.UKOIL;
    const us10y = m.US10Y;
    return [
      {
        label: "IHSG",
        value: fmtNum(ihsg.close),
        change: fmtPct(ihsg.change),
        up: (ihsg.change ?? 0) >= 0,
        note: ihsg.perfYTD != null ? `YTD ${fmtPct(ihsg.perfYTD)}` : "Composite",
      },
      {
        label: "USD/IDR",
        value: usdIdr?.close != null ? fmtNum(usdIdr.close) : "—",
        change: usdIdr?.change != null ? fmtPct(usdIdr.change) : "",
        up: (usdIdr?.change ?? 0) >= 0,
        note: "Spot",
      },
      {
        label: "BI Rate",
        value: `${MARKET_OVERRIDES.biRate.value.toFixed(2)}%`,
        change: "Manual",
        up: true,
        note: MARKET_OVERRIDES.biRate.note,
      },
      {
        label: "US 10Y",
        value: us10y?.close != null ? `${us10y.close.toFixed(3)}%` : "—",
        change: us10y?.change != null ? fmtPct(us10y.change) : "",
        up: (us10y?.change ?? 0) >= 0,
        note: "Treasury yield",
      },
      {
        label: "Gold",
        value: gold?.close != null ? `$${fmtNum(gold.close, 0)}` : "—",
        change: gold?.change != null ? fmtPct(gold.change) : "",
        up: (gold?.change ?? 0) >= 0,
        note: "Safe haven",
      },
      {
        label: "Brent Oil",
        value: brent?.close != null ? `$${fmtNum(brent.close, 2)}` : "—",
        change: brent?.change != null ? fmtPct(brent.change) : "",
        up: (brent?.change ?? 0) >= 0,
        note: "Energy risk",
      },
      {
        label: "LQ45",
        value: data?.lq45?.close != null ? fmtNum(data.lq45.close, 2) : "—",
        change: fmtPct(data?.lq45?.change),
        up: (data?.lq45?.change ?? 0) >= 0,
        note: "Blue chip index",
      },
      {
        label: "Trade Bal",
        value: `$${MARKET_OVERRIDES.tradeBalance.value.toFixed(2)}B`,
        change: MARKET_OVERRIDES.tradeBalance.note,
        up: MARKET_OVERRIDES.tradeBalance.value >= 0,
        note: "Manual",
      },
    ];
  }, [data, ihsg]);

  /* ── Sectors enriched with static weight + colour ── */
  const sectors = useMemo(() => {
    return (data?.sectors ?? []).map((s) => ({
      ...s,
      weight: SECTOR_META[s.code]?.weight ?? 0,
      color: SECTOR_META[s.code]?.color ?? "#B8AA96",
    }));
  }, [data]);

  const getPerf = (q: Quote) => TAB_COLUMNS[activeTab](q);
  const sortedSectors = useMemo(() => [...sectors].sort((a, b) => (getPerf(b) ?? -999) - (getPerf(a) ?? -999)), [sectors, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Market Playbook</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-2">
              IHSG <span className="text-gold-gradient font-medium">Macro Dashboard</span>
            </h1>
            <p className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
              Macro · Foreign Flow · Sector Rotation · Market Regime
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-[#B8AA96]/30"}`} />
              <span className="text-[10px] tracking-[0.15em] uppercase text-[#B8AA96]/50">
                {loading ? "Connecting" : live ? (marketOpen ? "Live · Market Open" : "Live · Market Closed") : "Offline"}
              </span>
            </div>
            <div className="text-[#B8AA96]/30 text-[10px] tracking-[0.15em] uppercase mb-1">Last Updated</div>
            <div className="text-[#B8AA96]/60 text-sm font-mono">{lastUpdated ? fmtTime(lastUpdated) : "—"}</div>
          </div>
        </div>

        {/* ─── MACRO INDICATORS BAR ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {macroRows.map((m) => (
            <div key={m.label} className="card-luxury p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase">{m.label}</span>
                <span className={`text-[10px] font-mono ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
              </div>
              <div className="font-heading text-xl text-[#F4EFE6] font-medium">{m.value}</div>
              <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">{m.note}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* ─── MARKET REGIME ─── */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Market Regime</h2>
            <div className="space-y-4">
              {[
                { label: "Trend", value: trendRegime.label, color: trendRegime.color },
                { label: "Momentum", value: rsi.label, color: rsi.color },
                { label: "MA50", value: ihsg.sma50 != null ? fmtNum(ihsg.sma50) : "—", color: "text-[#B8AA96]" },
                { label: "MA200", value: ihsg.sma200 != null ? fmtNum(ihsg.sma200) : "—", color: "text-[#B8AA96]" },
                { label: "Signal", value: rec.label, color: rec.color },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between border-b border-[#2C261E]/50 pb-3">
                  <span className="text-[#B8AA96]/50 text-[11px] tracking-wider uppercase">{r.label}</span>
                  <span className={`text-sm font-medium ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Position vs MA */}
            <div className="mt-5 pt-4 border-t border-[#2C261E]">
              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase mb-3">Position vs Moving Averages</div>
              <div className="space-y-2">
                <MaRow label="MA50" ma={ihsg.sma50} price={ihsgClose} color="blue" />
                <MaRow label="MA200" ma={ihsg.sma200} price={ihsgClose} color="purple" />
              </div>
              <div className="mt-3 text-[9px] text-[#B8AA96]/40 leading-relaxed">
                {ihsgClose < (ihsg.sma200 ?? Infinity) ? "Trading below MA200 — long-term downtrend." : "Above MA200 — long-term uptrend."}{" "}
                {ihsgClose < (ihsg.sma50 ?? Infinity) ? "Below MA50 — medium-term weak." : "Above MA50 — medium-term firm."}
              </div>
            </div>
          </div>

          {/* ─── FOREIGN FLOW ─── */}
          <div className="card-luxury p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">Foreign Flow</h2>
              <span className="text-[9px] text-[#B8AA96]/40 uppercase tracking-wider border border-[#2C261E] px-1.5 py-0.5">Manual</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Week", value: MARKET_OVERRIDES.foreignFlow.weekNet, color: MARKET_OVERRIDES.foreignFlow.weekNet >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "MTD", value: MARKET_OVERRIDES.foreignFlow.mtdNet, color: MARKET_OVERRIDES.foreignFlow.mtdNet >= 0 ? "text-emerald-400" : "text-red-400" },
                { label: "YTD", value: MARKET_OVERRIDES.foreignFlow.ytdNet, color: MARKET_OVERRIDES.foreignFlow.ytdNet >= 0 ? "text-emerald-400" : "text-red-400" },
              ].map((f) => (
                <div key={f.label} className="border border-[#2C261E] p-3 text-center">
                  <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{f.label}</div>
                  <div className={`text-xs font-mono font-medium ${f.color}`}>{fmtMiliar(f.value)}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-emerald-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Top Net Buy</div>
                <div className="space-y-1.5">
                  {MARKET_OVERRIDES.foreignFlow.topBuy.map((b) => (
                    <div key={b.ticker} className="flex justify-between items-center">
                      <span className="text-[#F4EFE6] text-xs font-mono">{b.ticker}</span>
                      <span className="text-emerald-400 text-[10px] font-mono">+{b.net}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-red-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Top Net Sell</div>
                <div className="space-y-1.5">
                  {MARKET_OVERRIDES.foreignFlow.topSell.map((s) => (
                    <div key={s.ticker} className="flex justify-between items-center">
                      <span className="text-[#F4EFE6] text-xs font-mono">{s.ticker}</span>
                      <span className="text-red-400 text-[10px] font-mono">{s.net}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── KEY LEVELS ─── */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">IHSG Key Levels</h2>

            <div className="text-center py-4 mb-5 border border-[#2C261E] bg-[#0B0B0A]">
              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.15em] uppercase mb-1">IHSG Live</div>
              <div className={`font-heading text-3xl font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>
                {fmtNum(ihsgClose)}
              </div>
              <div className={`text-xs font-mono mt-1 ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>
                {ihsgUp ? "▲" : "▼"} {fmtPct(ihsg.change)} {ihsg.changeAbs != null && `(${ihsgUp ? "+" : ""}${ihsg.changeAbs.toFixed(0)})`}
              </div>
            </div>

            {/* Price level ladder */}
            <div className="space-y-1.5">
              {KEY_LEVELS_FALLBACK.resistance.map((r, i) => (
                <LevelRow key={`r-${i}`} label={`R${i + 1}`} value={r} tone="resistance" />
              ))}

              {/* Current price marker */}
              <div className="flex items-center gap-3 py-1">
                <span className="text-[#C6A15B] text-[10px] tracking-wider uppercase w-16">NOW</span>
                <div className="flex-1 h-0.5 bg-[#C6A15B]/40" />
                <span className={`text-xs font-mono font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>{fmtNum(ihsgClose)}</span>
              </div>

              {ihsg.sma50 != null && <LevelRow label="MA50" value={ihsg.sma50} tone="ma-blue" />}
              {ihsg.sma200 != null && <LevelRow label="MA200" value={ihsg.sma200} tone="ma-purple" />}

              {KEY_LEVELS_FALLBACK.support.map((s, i) => (
                <LevelRow key={`s-${i}`} label={`S${i + 1}`} value={s} tone="support" />
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#2C261E]">
              <p className="text-[#B8AA96]/30 text-[9px] leading-relaxed">
                Source: TradingView ({live ? "live" : "offline"}). RSI {rsi.label}. Signal {rec.label}. 52wk range {fmtNum(ihsg.low)}–{fmtNum(ihsg.high)}.
              </p>
            </div>
          </div>
        </div>

        {/* ─── SECTOR ROTATION HEATMAP ─── */}
        <div className="card-luxury p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
                Sector <span className="text-gold-gradient font-medium">Rotation</span>
              </h2>
              <p className="text-[10px] text-[#B8AA96]/40 mt-1">
                {live ? "Realtime from TradingView" : "Offline — showing last/empty"} · {sectors.filter((s) => s.type === "index").length} sector indices + {sectors.filter((s) => s.type === "basket").length} bellwether baskets
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(["Day", "Week", "1M", "YTD"] as PerfTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30"
                      : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {sortedSectors.length === 0 ? (
            <div className="text-center py-12 text-[#B8AA96]/40 text-sm">No sector data available.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {sortedSectors.map((s) => {
                const perf = getPerf(s);
                const intensity = perf != null ? Math.min(Math.abs(perf) / 15, 1) : 0;
                const bg =
                  perf == null
                    ? "rgba(184, 170, 150, 0.05)"
                    : perf >= 0
                      ? `rgba(34, 197, 94, ${0.08 + intensity * 0.25})`
                      : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
                const borderColor =
                  perf == null
                    ? "rgba(44, 38, 30, 0.5)"
                    : perf >= 0
                      ? `rgba(34, 197, 94, ${0.15 + intensity * 0.3})`
                      : `rgba(239, 68, 68, ${0.15 + intensity * 0.3})`;

                return (
                  <div key={s.code} className="p-4 border transition-all hover:scale-[1.03]" style={{ backgroundColor: bg, borderColor }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#F4EFE6] text-xs font-medium">{s.name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    </div>
                    <div className={`font-heading text-lg font-medium ${perf == null ? "text-[#B8AA96]/50" : perf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {perf == null ? "—" : `${perf >= 0 ? "+" : ""}${perf.toFixed(1)}%`}
                    </div>
                    <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">
                      Weight: {s.weight}%{s.type === "basket" && s.components ? ` · ${s.components} stk` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sector table */}
          {sectors.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#2C261E]">
                    <th className="text-left text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Sektor</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Day</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Week</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">1M</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">YTD</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">RSI</th>
                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Wt</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {sectors.map((s) => (
                    <tr key={s.code} className="border-b border-[#2C261E]/30">
                      <td className="py-2 text-[#F4EFE6] font-sans flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                        {s.type === "basket" && <span className="text-[8px] text-[#B8AA96]/40 uppercase">basket</span>}
                      </td>
                      <PerfCell v={s.change} />
                      <PerfCell v={s.perfWeek} />
                      <PerfCell v={s.perf1M} />
                      <PerfCell v={s.perfYTD} />
                      <td className={`py-2 text-right ${(s.rsi ?? 50) < 30 ? "text-yellow-400" : (s.rsi ?? 50) > 70 ? "text-yellow-400" : "text-[#B8AA96]/70"}`}>
                        {s.rsi != null ? s.rsi.toFixed(0) : "—"}
                      </td>
                      <td className="py-2 text-right text-[#B8AA96]/60">{s.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── MARKET SUMMARY ─── */}
        <div className="card-luxury p-8 mt-8">
          <h2 className="font-heading text-xl text-[#F4EFE6] mb-4 font-medium">Market Summary</h2>
          <div className="space-y-3 text-sm text-[#B8AA96] font-light leading-relaxed">
            <p>
              <span className="text-[#F4EFE6] font-medium">Trend:</span> IHSG {fmtNum(ihsgClose)} ({fmtPct(ihsg.change)}). {trendRegime.label} signal.{" "}
              {ihsg.sma50 != null && `MA50 ${fmtNum(ihsg.sma50)}, `}{ihsg.sma200 != null && `MA200 ${fmtNum(ihsg.sma200)}. `}
              RSI {rsi.label}. {ihsg.perfYTD != null && `YTD ${fmtPct(ihsg.perfYTD)}.`}
            </p>
            <p>
              <span className="text-[#F4EFE6] font-medium">Foreign Flow:</span> Minggu ini asing {MARKET_OVERRIDES.foreignFlow.weekNet >= 0 ? "net buy" : "net sell"} ({fmtMiliar(MARKET_OVERRIDES.foreignFlow.weekNet)}),
              YTD {fmtMiliar(MARKET_OVERRIDES.foreignFlow.ytdNet)}.
            </p>
            <p>
              <span className="text-[#F4EFE6] font-medium">Macro:</span>{" "}
              {data?.macro?.USDIDR?.close != null && `USD/IDR ${fmtNum(data.macro.USDIDR.close)}, `}
              {data?.macro?.GOLD?.close != null && `Gold $${fmtNum(data.macro.GOLD.close)}, `}
              {data?.macro?.UKOIL?.close != null && `Brent $${fmtNum(data.macro.UKOIL.close, 2)}, `}
              {data?.macro?.US10Y?.close != null && `US10Y ${data.macro.US10Y.close.toFixed(2)}%. `}
              BI Rate {MARKET_OVERRIDES.biRate.value.toFixed(2)}%.
            </p>
            <p className="text-[#B8AA96]/40 text-[10px] pt-2 border-t border-[#2C261E]/50">
              Data: TradingView scanner (realtime, poll 60s). Foreign flow, BI Rate & trade balance di-maintain manual di <code className="text-[#C6A15B]/70">lib/market.ts → MARKET_OVERRIDES</code>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Small presentational helpers
   ────────────────────────────────────────────────────────────────────────── */

function MaRow({ label, ma, price, color }: { label: string; ma: number | null; price: number; color: "blue" | "purple" }) {
  const above = ma != null && price >= ma;
  const pct =
    ma != null && ma > 0 ? ((price - ma) / ma) * 100 : null;
  const colorClass = color === "blue" ? "text-blue-400" : "text-purple-400";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={`${colorClass}/70 font-mono`}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={`${colorClass} font-mono`}>{ma != null ? fmtNum(ma) : "—"}</span>
        {pct != null && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${above ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {above ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function LevelRow({ label, value, tone }: { label: string; value: number; tone: "support" | "resistance" | "ma-blue" | "ma-purple" }) {
  const tones = {
    support: { text: "text-emerald-400/60", dot: "text-emerald-400", bar: "bg-emerald-400/20" },
    resistance: { text: "text-red-400/60", dot: "text-red-400", bar: "bg-red-400/20" },
    "ma-blue": { text: "text-blue-400/60", dot: "text-blue-400", bar: "bg-blue-400/20" },
    "ma-purple": { text: "text-purple-400/60", dot: "text-purple-400", bar: "bg-purple-400/20" },
  }[tone];
  return (
    <div className="flex items-center gap-3">
      <span className={`${tones.text} text-[10px] tracking-wider uppercase w-16`}>{label}</span>
      <div className={`flex-1 h-px ${tones.bar}`} />
      <span className={`${tones.dot} text-xs font-mono`}>{fmtNum(value)}</span>
    </div>
  );
}

function PerfCell({ v }: { v: number | null | undefined }) {
  if (v == null || !Number.isFinite(v)) {
    return <td className="py-2 text-right text-[#B8AA96]/30">—</td>;
  }
  return (
    <td className={`py-2 text-right ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>
      {v >= 0 ? "+" : ""}
      {v.toFixed(2)}%
    </td>
  );
}
