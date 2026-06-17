     1|"use client";
     2|
     3|import { useState, useEffect, useCallback, useRef, useMemo } from "react";
     4|import Navbar from "@/components/Navbar";
     5|import Footer from "@/components/Footer";
     6|import {
     7|  fetchMarketData,
     8|  type ManualData,
     9|  type MarketData,
    10|  type Quote,
    11|  recommendLabel,
    12|  rsiLabel,
    13|  fmtPct,
    14|  fmtNum,
    15|  fmtMiliar,
    16|  isMarketOpen,
    17|  IHSG_FALLBACK,
    18|  KEY_LEVELS_FALLBACK,
    19|  SECTOR_META,
    20|  FALLBACK_MANUAL,
    21|} from "@/lib/market";
    22|
    23|type PerfTab = "Day" | "Week" | "1M" | "YTD";
    24|
    25|const TAB_COLUMNS: Record<PerfTab, (q: Quote) => number | null> = {
    26|  Day: (q) => q.change,
    27|  Week: (q) => q.perfWeek,
    28|  "1M": (q) => q.perf1M,
    29|  YTD: (q) => q.perfYTD,
    30|};
    31|
    32|/** Fetch foreign flow directly from Tradersaham (client-side, bypasses Vercel Cloudflare) */
    33|async function fetchForeignFlowClient(): Promise<ForeignFlowData | null> {
    34|  try {
    35|    const resp = await fetch("https://apiv2.tradersaham.com/api/market-insight/foreign-flow", {
    36|      headers: {
    37|        "Accept": "application/json",
    38|        "Origin": "https://www.tradersaham.com",
    39|        "Referer": "https://www.tradersaham.com/market-overview",
    40|      },
    41|    });
    42|    if (!resp.ok) return null;
    43|    const data = await resp.json();
    44|    const topBuy = (data.accumulation ?? []).slice(0, 10).map((a: Record<string, unknown>) => ({
    45|      ticker: a.stock_code as string,
    46|      net: Math.round(Number(a.net_value ?? 0) / 1e6),
    47|    }));
    48|    const topSell = (data.distribution ?? []).slice(0, 10).map((d: Record<string, unknown>) => ({
    49|      ticker: d.stock_code as string,
    50|      net: Math.round(Number(d.net_value ?? 0) / 1e6),
    51|    }));
    52|    const weekNet = topBuy.reduce((s: number, b: { net: number }) => s + b.net, 0) +
    53|                    topSell.reduce((s: number, d: { net: number }) => s + d.net, 0);
    54|    return { date: data.date, weekNet, mtdNet: null, ytdNet: null, topBuy, topSell };
    55|  } catch { return null; }
    56|}
    57|
    58|export default function IHSGDashboard() {
    59|  const [data, setData] = useState<MarketData | null>(null);
    60|  const [foreignFlow, setForeignFlow] = useState<ForeignFlowData | null>(null);
    61|  const [loading, setLoading] = useState(true);
    62|  const [activeTab, setActiveTab] = useState<PerfTab>("1M");
    63|  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    64|  const [live, setLive] = useState(false);
    65|  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    66|
    67|  const refresh = useCallback(async () => {
    68|    try {
    69|      const next = await fetchMarketData();
    70|      setData(next);
    71|      setForeignFlow(next.foreignFlow);
    72|      setLastUpdated(next.timestamp);
    73|      setLive(next.ok && next.ihsg != null);
    74|    } catch {
    75|      setLive(false);
    76|    } finally {
    77|      setLoading(false);
    78|    }
    79|  }, []);
    80|
    81|  useEffect(() => {
    82|    refresh();
    83|    intervalRef.current = setInterval(refresh, 60_000);
    84|    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    85|  }, [refresh]);
    86|
    87|  const ihsg: Quote = data?.ihsg ?? IHSG_FALLBACK;
    88|  const ihsgClose = ihsg.close ?? IHSG_FALLBACK.close!;
    89|  const ihsgChange = ihsg.change ?? 0;
    90|  const ihsgUp = ihsgChange >= 0;
    91|  const rec = recommendLabel(ihsg.recommend);
    92|  const rsi = rsiLabel(ihsg.rsi);
    93|
    94|  const trendRegime = useMemo(() => {
    95|    const r = ihsg.recommend ?? IHSG_FALLBACK.recommend!;
    96|    const below50 = ihsg.close != null && ihsg.sma50 != null && ihsg.close < ihsg.sma50;
    97|    const below200 = ihsg.close != null && ihsg.sma200 != null && ihsg.close < ihsg.sma200;
    98|    if (r <= -0.5) return { label: "Sell Kuat", color: "text-red-400" };
    99|    if (below200 && below50) return { label: "Bearish", color: "text-red-400" };
   100|    if (below50) return { label: "Di Bawah MA50", color: "text-yellow-400" };
   101|    if (r >= 0.5) return { label: "Buy Kuat", color: "text-emerald-400" };
   102|    if (r >= 0.1) return { label: "Bullish", color: "text-emerald-400" };
   103|    return { label: "Netral", color: "text-yellow-400" };
   104|  }, [ihsg]);
   105|
   106|  const marketOpen = isMarketOpen();
   107|  const manual: ManualData = data?.manualData ?? FALLBACK_MANUAL;
   108|  const ff = foreignFlow ?? data?.foreignFlow ?? null;
   109|
   110|  const macroRows = useMemo(() => {
   111|    const m = data?.macro ?? {};
   112|    const usdIdr = m.USDIDR;
   113|    const gold = m.GOLD;
   114|    const brent = m.UKOIL;
   115|    const us10y = m.US10Y;
   116|    return [
   117|      { label: "IHSG", value: fmtNum(ihsg.close), change: fmtPct(ihsg.change), up: ihsgUp, note: ihsg.perfYTD != null ? `YTD ${fmtPct(ihsg.perfYTD)}` : "Komposit" },
   118|      { label: "USD/IDR", value: usdIdr?.close != null ? fmtNum(usdIdr.close) : "—", change: usdIdr?.change != null ? fmtPct(usdIdr.change) : "", up: (usdIdr?.change ?? 0) >= 0, note: "Spot" },
   119|      { label: "BI Rate", value: `${(manual.biRate?.value ?? 5.50).toFixed(2)}%`, change: "Otomatis", up: true, note: manual.biRate?.note ?? "" },
   120|      { label: "US 10Y", value: us10y?.close != null ? `${us10y.close.toFixed(3)}%` : "—", change: us10y?.change != null ? fmtPct(us10y.change) : "", up: (us10y?.change ?? 0) >= 0, note: "Yield Treasury" },
   121|      { label: "Emas", value: gold?.close != null ? `$${fmtNum(gold.close, 0)}` : "—", change: gold?.change != null ? fmtPct(gold.change) : "", up: (gold?.change ?? 0) >= 0, note: "Safe haven" },
   122|      { label: "Minyak Brent", value: brent?.close != null ? `$${fmtNum(brent.close, 2)}` : "—", change: brent?.change != null ? fmtPct(brent.change) : "", up: (brent?.change ?? 0) >= 0, note: "Risiko energi" },
   123|      { label: "LQ45", value: data?.lq45?.close != null ? fmtNum(data.lq45.close, 2) : "—", change: fmtPct(data?.lq45?.change), up: (data?.lq45?.change ?? 0) >= 0, note: "Indeks blue chip" },
   124|      { label: "Neraca Dagang", value: `$${(manual.tradeBalance?.value ?? 3.32).toFixed(2)}B`, change: manual.tradeBalance?.note ?? "", up: (manual.tradeBalance?.value ?? 3.32) >= 0, note: "Manual" },
   125|    ];
   126|  }, [data, ihsg, ihsgUp, manual]);
   127|
   128|  const sectors = useMemo(() => {
   129|    return (data?.sectors ?? []).map((s) => ({
   130|      ...s,
   131|      weight: SECTOR_META[s.code]?.weight ?? 0,
   132|      color: SECTOR_META[s.code]?.color ?? "#B8AA96",
   133|    }));
   134|  }, [data]);
   135|
   136|  const getPerf = (q: Quote) => TAB_COLUMNS[activeTab](q);
   137|  const sortedSectors = useMemo(() => [...sectors].sort((a, b) => (getPerf(b) ?? -999) - (getPerf(a) ?? -999)), [sectors, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
   138|
   139|  const fmtTime = (iso: string) => {
   140|    try {
   141|      return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
   142|    } catch { return ""; }
   143|  };
   144|
   145|  return (
   146|    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
   147|      <Navbar />
   148|      <div className="max-w-7xl mx-auto px-6 lg:px-12">
   149|        {/* Header */}
   150|        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
   151|          <div>
   152|            <div className="flex items-center gap-4 mb-3">
   153|              <div className="w-10 h-px bg-[#C6A15B]/30" />
   154|              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Market Playbook</span>
   155|            </div>
   156|            <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-2">
   157|              IHSG <span className="text-gold-gradient font-medium">Dasbor Makro</span>
   158|            </h1>
   159|            <p className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
   160|              Makro · Aliran Dana Asing · Rotasi Sektor · Regime Pasar
   161|            </p>
   162|          </div>
   163|          <div className="text-right">
   164|            <div className="flex items-center justify-end gap-2 mb-1">
   165|              <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-[#B8AA96]/30"}`} />
   166|              <span className="text-[10px] tracking-[0.15em] uppercase text-[#B8AA96]/50">
   167|                {loading ? "Menghubungkan" : live ? (marketOpen ? "Live · Pasar Buka" : "Live · Pasar Tutup") : "Offline"}
   168|              </span>
   169|            </div>
   170|            <div className="text-[#B8AA96]/30 text-[10px] tracking-[0.15em] uppercase mb-1">Terakhir Diperbarui</div>
   171|            <div className="text-[#B8AA96]/60 text-sm font-mono">{lastUpdated ? fmtTime(lastUpdated) : "—"}</div>
   172|          </div>
   173|        </div>
   174|
   175|        {/* MACRO INDICATORS BAR */}
   176|        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
   177|          {macroRows.map((m) => (
   178|            <div key={m.label} className="card-luxury p-4">
   179|              <div className="flex items-center justify-between mb-1">
   180|                <span className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase">{m.label}</span>
   181|                <span className={`text-[10px] font-mono ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
   182|              </div>
   183|              <div className="font-heading text-xl text-[#F4EFE6] font-medium">{m.value}</div>
   184|              <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">{m.note}</div>
   185|            </div>
   186|          ))}
   187|        </div>
   188|
   189|        <div className="grid lg:grid-cols-3 gap-8 mb-8">
   190|          {/* MARKET REGIME */}
   191|          <div className="card-luxury p-6">
   192|            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Regime Pasar</h2>
   193|            <div className="space-y-4">
   194|              {[
   195|                { label: "Tren", value: trendRegime.label, color: trendRegime.color },
   196|                { label: "Momentum", value: rsi.label, color: rsi.color },
   197|                { label: "MA50", value: ihsg.sma50 != null ? fmtNum(ihsg.sma50) : "—", color: "text-[#B8AA96]" },
   198|                { label: "MA200", value: ihsg.sma200 != null ? fmtNum(ihsg.sma200) : "—", color: "text-[#B8AA96]" },
   199|                { label: "Sinyal", value: rec.label, color: rec.color },
   200|              ].map((r) => (
   201|                <div key={r.label} className="flex items-center justify-between border-b border-[#2C261E]/50 pb-3">
   202|                  <span className="text-[#B8AA96]/50 text-[11px] tracking-wider uppercase">{r.label}</span>
   203|                  <span className={`text-sm font-medium ${r.color}`}>{r.value}</span>
   204|                </div>
   205|              ))}
   206|            </div>
   207|            <div className="mt-5 pt-4 border-t border-[#2C261E]">
   208|              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.1em] uppercase mb-3">Posisi vs Moving Average</div>
   209|              <div className="space-y-2">
   210|                <MaRow label="MA50" ma={ihsg.sma50} price={ihsgClose} color="blue" />
   211|                <MaRow label="MA200" ma={ihsg.sma200} price={ihsgClose} color="purple" />
   212|              </div>
   213|              <div className="mt-3 text-[9px] text-[#B8AA96]/40 leading-relaxed">
   214|                {ihsgClose < (ihsg.sma200 ?? Infinity) ? "Di bawah MA200 — tren jangka panjang turun." : "Di atas MA200 — tren jangka panjang naik."}{" "}
   215|                {ihsgClose < (ihsg.sma50 ?? Infinity) ? "Di bawah MA50 — jangka menengah lemah." : "Di atas MA50 — jangka menengah kuat."}
   216|              </div>
   217|            </div>
   218|          </div>
   219|
   220|          {/* FOREIGN FLOW — auto from Tradersaham */}
   221|          <div className="card-luxury p-6">
   222|            <div className="flex items-center justify-between mb-5">
   223|              <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium">Aliran Dana Asing</h2>
   224|              <span className="text-[9px] text-emerald-400/50 uppercase tracking-wider border border-emerald-500/20 px-1.5 py-0.5">Auto</span>
   225|            </div>
   226|            {ff ? (
   227|              <>
   228|                <div className="grid grid-cols-3 gap-3 mb-5">
   229|                  {[
   230|                    { label: "Hari Ini", value: ff.weekNet, color: ff.weekNet >= 0 ? "text-emerald-400" : "text-red-400" },
   231|                    { label: "MTD", value: ff.mtdNet ?? 0, color: (ff.mtdNet ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
   232|                    { label: "YTD", value: ff.ytdNet ?? 0, color: (ff.ytdNet ?? 0) >= 0 ? "text-emerald-400" : "text-red-400" },
   233|                  ].map((f) => (
   234|                    <div key={f.label} className="border border-[#2C261E] p-3 text-center">
   235|                      <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{f.label}</div>
   236|                      <div className={`text-xs font-mono font-medium ${f.color}`}>{fmtMiliar(f.value)}</div>
   237|                    </div>
   238|                  ))}
   239|                </div>
   240|                <div className="grid grid-cols-2 gap-4">
   241|                  <div>
   242|                    <div className="text-emerald-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Net Buy Terbesar</div>
   243|                    <div className="space-y-1.5">
   244|                      {ff.topBuy.map((b) => (
   245|                        <div key={b.ticker} className="flex justify-between items-center">
   246|                          <span className="text-[#F4EFE6] text-xs font-mono">{b.ticker}</span>
   247|                          <span className="text-emerald-400 text-[10px] font-mono">+{b.net}M</span>
   248|                        </div>
   249|                      ))}
   250|                    </div>
   251|                  </div>
   252|                  <div>
   253|                    <div className="text-red-400/70 text-[10px] tracking-[0.1em] uppercase mb-2">Net Sell Terbesar</div>
   254|                    <div className="space-y-1.5">
   255|                      {ff.topSell.map((s) => (
   256|                        <div key={s.ticker} className="flex justify-between items-center">
   257|                          <span className="text-[#F4EFE6] text-xs font-mono">{s.ticker}</span>
   258|                          <span className="text-red-400 text-[10px] font-mono">{s.net}M</span>
   259|                        </div>
   260|                      ))}
   261|                    </div>
   262|                  </div>
   263|                </div>
   264|              </>
   265|            ) : (
   266|              <div className="text-center py-8 text-[#B8AA96]/40 text-sm">Data aliran dana asing tidak tersedia.</div>
   267|            )}
   268|          </div>
   269|
   270|          {/* KEY LEVELS */}
   271|          <div className="card-luxury p-6">
   272|            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Level Kunci IHSG</h2>
   273|            <div className="text-center py-4 mb-5 border border-[#2C261E] bg-[#0B0B0A]">
   274|              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.15em] uppercase mb-1">IHSG Live</div>
   275|              <div className={`font-heading text-3xl font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>{fmtNum(ihsgClose)}</div>
   276|              <div className={`text-xs font-mono mt-1 ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>
   277|                {ihsgUp ? "▲" : "▼"} {fmtPct(ihsg.change)} {ihsg.changeAbs != null && `(${ihsgUp ? "+" : ""}${ihsg.changeAbs.toFixed(0)})`}
   278|              </div>
   279|            </div>
   280|            <div className="space-y-1.5">
   281|              {KEY_LEVELS_FALLBACK.resistance.map((r, i) => (
   282|                <LevelRow key={`r-${i}`} label={`R${i + 1}`} value={r} tone="resistance" />
   283|              ))}
   284|              <div className="flex items-center gap-3 py-1">
   285|                <span className="text-[#C6A15B] text-[10px] tracking-wider uppercase w-16">SEKARANG</span>
   286|                <div className="flex-1 h-0.5 bg-[#C6A15B]/40" />
   287|                <span className={`text-xs font-mono font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>{fmtNum(ihsgClose)}</span>
   288|              </div>
   289|              {ihsg.sma50 != null && <LevelRow label="MA50" value={ihsg.sma50} tone="ma-blue" />}
   290|              {ihsg.sma200 != null && <LevelRow label="MA200" value={ihsg.sma200} tone="ma-purple" />}
   291|              {KEY_LEVELS_FALLBACK.support.map((s, i) => (
   292|                <LevelRow key={`s-${i}`} label={`S${i + 1}`} value={s} tone="support" />
   293|              ))}
   294|            </div>
   295|            <div className="mt-4 pt-3 border-t border-[#2C261E]">
   296|              <p className="text-[#B8AA96]/30 text-[9px] leading-relaxed">
   297|                Sumber: TradingView ({live ? "live" : "offline"}). RSI {rsi.label}. Sinyal {rec.label}. Rentang 52 minggu {fmtNum(ihsg.low)}–{fmtNum(ihsg.high)}.
   298|              </p>
   299|            </div>
   300|          </div>
   301|        </div>
   302|
   303|        {/* SECTOR ROTATION HEATMAP */}
   304|        <div className="card-luxury p-8">
   305|          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
   306|            <div>
   307|              <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
   308|                Sektor <span className="text-gold-gradient font-medium">Rotasi</span>
   309|              </h2>
   310|              <p className="text-[10px] text-[#B8AA96]/40 mt-1">
   311|                {live ? "Realtime dari TradingView" : "Offline — data terakhir/kosong"} · {sectors.filter((s) => s.type === "index").length} indeks sektor + {sectors.filter((s) => s.type === "basket").length} keranjang bellwether
   312|              </p>
   313|            </div>
   314|            <div className="flex items-center gap-1">
   315|              {(["Day", "Week", "1M", "YTD"] as PerfTab[]).map((tab) => (
   316|                <button key={tab} onClick={() => setActiveTab(tab)}
   317|                  className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
   318|                    activeTab === tab ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30" : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
   319|                  }`}>{tab}</button>
   320|              ))}
   321|            </div>
   322|          </div>
   323|          {sortedSectors.length === 0 ? (
   324|            <div className="text-center py-12 text-[#B8AA96]/40 text-sm">Data sektor tidak tersedia.</div>
   325|          ) : (
   326|            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
   327|              {sortedSectors.map((s) => {
   328|                const perf = getPerf(s);
   329|                const intensity = perf != null ? Math.min(Math.abs(perf) / 15, 1) : 0;
   330|                const bg = perf == null ? "rgba(184, 170, 150, 0.05)" : perf >= 0 ? `rgba(34, 197, 94, ${0.08 + intensity * 0.25})` : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
   331|                const borderColor = perf == null ? "rgba(44, 38, 30, 0.5)" : perf >= 0 ? `rgba(34, 197, 94, ${0.15 + intensity * 0.3})` : `rgba(239, 68, 68, ${0.15 + intensity * 0.3})`;
   332|                return (
   333|                  <div key={s.code} className="p-4 border transition-all hover:scale-[1.03]" style={{ backgroundColor: bg, borderColor }}>
   334|                    <div className="flex items-center justify-between mb-1">
   335|                      <span className="text-[#F4EFE6] text-xs font-medium">{s.name}</span>
   336|                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
   337|                    </div>
   338|                    <div className={`font-heading text-lg font-medium ${perf == null ? "text-[#B8AA96]/50" : perf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
   339|                      {perf == null ? "—" : `${perf >= 0 ? "+" : ""}${perf.toFixed(1)}%`}
   340|                    </div>
   341|                    <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">
   342|                      Bobot: {s.weight}%{s.type === "basket" && s.components ? ` · ${s.components} stk` : ""}
   343|                    </div>
   344|                  </div>
   345|                );
   346|              })}
   347|            </div>
   348|          )}
   349|          {sectors.length > 0 && (
   350|            <div className="overflow-x-auto">
   351|              <table className="w-full text-xs">
   352|                <thead>
   353|                  <tr className="border-b border-[#2C261E]">
   354|                    <th className="text-left text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Sektor</th>
   355|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Day</th>
   356|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Week</th>
   357|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">1M</th>
   358|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">YTD</th>
   359|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">RSI</th>
   360|                    <th className="text-right text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase py-2 font-medium">Wt</th>
   361|                  </tr>
   362|                </thead>
   363|                <tbody className="font-mono">
   364|                  {sectors.map((s) => (
   365|                    <tr key={s.code} className="border-b border-[#2C261E]/30">
   366|                      <td className="py-2 text-[#F4EFE6] font-sans flex items-center gap-2">
   367|                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
   368|                        {s.name}
   369|                        {s.type === "basket" && <span className="text-[8px] text-[#B8AA96]/40 uppercase">basket</span>}
   370|                      </td>
   371|                      <PerfCell v={s.change} />
   372|                      <PerfCell v={s.perfWeek} />
   373|                      <PerfCell v={s.perf1M} />
   374|                      <PerfCell v={s.perfYTD} />
   375|                      <td className={`py-2 text-right ${(s.rsi ?? 50) < 30 ? "text-yellow-400" : (s.rsi ?? 50) > 70 ? "text-yellow-400" : "text-[#B8AA96]/70"}`}>
   376|                        {s.rsi != null ? s.rsi.toFixed(0) : "—"}
   377|                      </td>
   378|                      <td className="py-2 text-right text-[#B8AA96]/60">{s.weight}%</td>
   379|                    </tr>
   380|                  ))}
   381|                </tbody>
   382|              </table>
   383|            </div>
   384|          )}
   385|        </div>
   386|
   387|
   388|      </div>
   389|      <Footer />
   390|    </div>
   391|  );
   392|}
   393|
   394|/* ── Presentational helpers ── */
   395|function MaRow({ label, ma, price, color }: { label: string; ma: number | null; price: number; color: "blue" | "purple" }) {
   396|  const above = ma != null && price >= ma;
   397|  const pct = ma != null && ma > 0 ? ((price - ma) / ma) * 100 : null;
   398|  const colorClass = color === "blue" ? "text-blue-400" : "text-purple-400";
   399|  return (
   400|    <div className="flex items-center justify-between text-xs">
   401|      <span className={`${colorClass}/70 font-mono`}>{label}</span>
   402|      <div className="flex items-center gap-2">
   403|        <span className={`${colorClass} font-mono`}>{ma != null ? fmtNum(ma) : "—"}</span>
   404|        {pct != null && (
   405|          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${above ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
   406|            {above ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
   407|          </span>
   408|        )}
   409|      </div>
   410|    </div>
   411|  );
   412|}
   413|
   414|function LevelRow({ label, value, tone }: { label: string; value: number; tone: "support" | "resistance" | "ma-blue" | "ma-purple" }) {
   415|  const tones = {
   416|    support: { text: "text-emerald-400/60", dot: "text-emerald-400", bar: "bg-emerald-400/20" },
   417|    resistance: { text: "text-red-400/60", dot: "text-red-400", bar: "bg-red-400/20" },
   418|    "ma-blue": { text: "text-blue-400/60", dot: "text-blue-400", bar: "bg-blue-400/20" },
   419|    "ma-purple": { text: "text-purple-400/60", dot: "text-purple-400", bar: "bg-purple-400/20" },
   420|  }[tone];
   421|  return (
   422|    <div className="flex items-center gap-3">
   423|      <span className={`${tones.text} text-[10px] tracking-wider uppercase w-16`}>{label}</span>
   424|      <div className={`flex-1 h-px ${tones.bar}`} />
   425|      <span className={`${tones.dot} text-xs font-mono`}>{fmtNum(value)}</span>
   426|    </div>
   427|  );
   428|}
   429|
   430|function PerfCell({ v }: { v: number | null | undefined }) {
   431|  if (v == null || !Number.isFinite(v)) return <td className="py-2 text-right text-[#B8AA96]/30">—</td>;
   432|  return <td className={`py-2 text-right ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</td>;
   433|}
   434|