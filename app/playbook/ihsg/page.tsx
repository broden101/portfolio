"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { TopMoverPanel } from "./TopMoverPanel";
import { CommodityPricesPanel } from "./CommodityPricesPanel";
import { Idx100Panel } from "./Idx100Panel";
import Footer from "@/components/Footer";
import SectorStocksPanel from "@/components/SectorStocksPanel";
import { Disclaimer, SourceNote, EmptyState } from "@/components/DataState";
import {
  fetchMarketData,
  type ManualData,
  type MarketData,
  type Quote,
  type ForeignFlowData,
  type ForeignFlowStock,
  recommendLabel,
  rsiLabel,
  fmtPct,
  fmtNum,
  fmtMiliar,
  fmtTriliun,
  isMarketOpen,
  IHSG_FALLBACK,
  SECTOR_META,
  FALLBACK_MANUAL,
} from "@/lib/market";

type PerfTab = "Day" | "Week" | "1M" | "YTD";
const TAB_COLUMNS: Record<PerfTab, (q: Quote) => number | null> = {
  Day: (q) => q.change,
  Week: (q) => q.perfWeek,
  "1M": (q) => q.perf1M,
  YTD: (q) => q.perfYTD,
};

/** Fetch foreign flow directly from Tradersaham (client-side, bypasses Vercel Cloudflare) */
async function fetchForeignFlowClient(): Promise<ForeignFlowData | null> {
  try {
    const resp = await fetch("https://apiv2.tradersaham.com/api/market-insight/foreign-flow", {
      headers: {
        "Accept": "application/json",
        "Origin": "https://www.tradersaham.com",
        "Referer": "https://www.tradersaham.com/market-overview",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const rawAcc = (data.accumulation ?? []) as Record<string, unknown>[];
    const rawDist = (data.distribution ?? []) as Record<string, unknown>[];
    const topBuy = rawAcc.slice(0, 10).map((a) => ({
      ticker: a.stock_code as string,
      net: Math.round(Number(a.net_value ?? 0) / 1e6),
    }));
    const topSell = rawDist.slice(0, 10).map((d) => ({
      ticker: d.stock_code as string,
      net: Math.round(Number(d.net_value ?? 0) / 1e6),
    }));
    const weekNet = topBuy.reduce((s, b) => s + b.net, 0) +
                    topSell.reduce((s, d) => s + d.net, 0);
    const totalForeignBuy = [...rawAcc, ...rawDist].reduce((s, r) => s + Number(r.total_buy_value ?? 0), 0);
    const totalForeignSell = [...rawAcc, ...rawDist].reduce((s, r) => s + Number(r.total_sell_value ?? 0), 0);
    const mapRaw = (r: Record<string, unknown>) => ({
      rank: Number(r.rank ?? 0),
      stock_code: String(r.stock_code ?? ""),
      stock_name: String(r.stock_name ?? ""),
      close_price: Number(r.close_price ?? 0),
      net_value: Number(r.net_value ?? 0),
      net_volume: Number(r.net_volume ?? 0),
      total_buy_volume: Number(r.total_buy_volume ?? 0),
      total_sell_volume: Number(r.total_sell_volume ?? 0),
      total_buy_value: Number(r.total_buy_value ?? 0),
      total_sell_value: Number(r.total_sell_value ?? 0),
    });
    return {
      date: data.date, weekNet, mtdNet: null, ytdNet: null, topBuy, topSell,
      rawAccumulation: rawAcc.map(mapRaw),
      rawDistribution: rawDist.map(mapRaw),
      totalForeignBuy,
      totalForeignSell,
    };
  } catch { return null; }
}

export default function IHSGDashboard() {
  const [data, setData] = useState<MarketData | null>(null);
  const [foreignFlow, setForeignFlow] = useState<ForeignFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PerfTab>("Day");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [flowHistory, setFlowHistory] = useState<{ date: string; dailyNet: number; totalForeignBuy: number; totalForeignSell: number }[]>([]);
  const [showVolumeHistory, setShowVolumeHistory] = useState(false);
  const [selectedSector, setSelectedSector] = useState<{ code: string; name: string; color: string; type?: string; tickers?: string[] } | null>(null);
  const [commodityData, setCommodityData] = useState<{ symbol: string; name: string; price: number; change: number | null; unit: string }[] | null>(null);

  const BASKET_TICKERS: Record<string, string[]> = {
    IDXAGRI: ["AALI", "TAPG", "LSIP", "SGRO", "PALM", "TBLA", "BWPT", "BISI", "JAWA", "SSMS", "ANJT", "PNGO", "TLDN", "UDNG", "MSJA", "STAA", "BRAM", "ALDO", "FPNI", "GZCO", "PDPP", "TALF", "ADMG", "IPOL", "GULA", "MOLI", "SMKL", "YPAS", "AMMS", "IGAR", "APLI", "MYTX", "AKPI", "PTPS", "ESTI", "INOV", "ACRO", "NPGF", "ERTX", "ANDI", "PSDN", "AYLS", "INCI", "OBMD", "SBMA", "CHEM", "OILS", "PICO", "FLMC"],
    IDXTECHNO: ["DCII", "ASII", "GOTO", "MLPT", "WIFI", "CYBR", "MTDL", "MSTI", "ASGR", "IRSX", "PTSN", "ATIC", "NFCX", "CHIP", "AXIO", "IKBI", "PGJO", "AREA", "AWAN", "ELIT", "VTNY", "TFAS", "JATI", "WGSH", "TRON", "LPLI", "CASH", "TOSK", "UVCR", "EPAC", "GPSO", "LPIN", "ZYRX", "DIVA", "MCAS", "RCCC", "RUNS", "DIGI", "INDX"],
    IDXINFRA: ["BREN", "MORA", "TLKM", "DNET", "CDIA", "ISAT", "EXCL", "MTEL", "PGEO", "RAJA", "POWR", "INET", "LINK", "KEEN", "DATA", "CENT", "GHON", "HGII", "INPS", "CGAS", "LAPD", "MSKY", "JAST", "MPOW"],
    IDXCYCLIC: ["AMRT", "BELI", "CMRY", "EMTK", "MSIN", "MAPI", "AKRA", "VKTR", "MDIY", "BUVA", "FILM", "MAPA", "MGLV", "SCMA", "CITA", "TSPC", "ALII", "BUKA", "MIDI", "BHAT", "HRTA", "INPP", "CNMA", "CLAY", "PNLF", "EPMT", "BOGA", "ERAA", "ACES", "FORE", "NATO", "TGKA", "SINI", "MNCN", "BPII", "JTPE", "MPMX", "GJTL", "HEXA", "GOLF", "LPPF", "IMAS", "OMRE", "JSPT", "DAAZ", "MMIX", "VISI", "PNIN", "MDLA", "MDIA", "MINA", "BLTZ", "RALS", "DAYA", "MAPB", "BHIT", "IATA", "DEPO", "PSKT", "BMTR", "OASA", "CSAP", "FORU", "SPTO", "SONA", "ERAL", "FUTR", "IPTV", "RAAM", "PMJS", "MKTR", "WOOD", "POLI", "MLPL", "HERO", "BLUE", "CARS", "ARTA", "LTLS", "FAST", "DMMX", "LUCY", "BUAH", "LIVE", "DOOH", "BOLA", "FOLK", "LFLO", "KING", "RANC", "KONI", "ASLC", "KDTN", "SOSS", "PJAA", "RODA", "KSIX", "VERN", "SHID", "ENAK", "SOTS", "NETV", "SMGA", "MPPA", "IBOS", "PANR", "IRRA", "PZZA", "LABS", "PEVE", "VIVA", "UNSP", "FITT", "UNTD", "BABY", "GRPM", "PMUI", "GDYR", "ESTA", "GLVA", "KMDS", "ZATA", "GPRA", "PNSE", "BAYU", "UFOE", "MUTU", "DPUM", "DART", "EAST", "SCNP", "HYGN", "TYRE", "TIRA", "BMSR", "PADA", "DYAN", "KOBX", "MICE", "PDES", "CRSN", "IOTF", "NAIK", "HAJJ", "HRME", "BAPA", "DEWI", "SMLE", "SDPC", "MEJA", "DOSS", "AGAR", "INTA", "MDRN", "PEHA", "PTSP", "MRAT", "TAMA", "ECII", "PTMP", "CAKK", "DFAM", "RBMS", "MPIX", "MANG", "KBLV", "SLIS", "LAND", "LMPI", "NTBK", "YELO", "BAUT", "KOPI", "INTD", "MARI", "ABBA", "FOOD", "ICON", "MERI", "TMPO", "SNLK", "OLIV", "NANO", "KIOS", "AIMS", "PGLI", "OPMS", "KOIN", "HDIT", "LUCK", "CSMI", "IDEA", "KICI", "BMBL", "PLAN", "HADE"],
    IDXNONCYC: ["PANI", "ICBP", "HMSP", "UNVR", "INDF", "MYOR", "GGRM", "FAPA", "ADES", "MLBI", "STTP", "ULTJ", "GOOD", "YUPI", "POLU", "CLEO", "SIMP", "DMND", "UNIC", "EURO", "VICI", "PSGO", "ROTI", "WIIM", "KEJU", "FISH", "CBUT", "BEEF", "KINO", "DLTA", "UCID", "CEKA", "SKLT", "TCID", "CAMP", "COCO", "AISA", "STRK", "SKBM", "BELL", "TRIS", "ZONE", "MAXI", "WINE", "CRAB", "SRSN", "GUNA", "SURI", "BEER", "BOBA", "ITIC", "ENZO", "NAYZ", "WAPO", "DSFI", "MBTO", "NASI", "ISEA", "BATA", "IKAN", "TAYS", "RICY", "PCAR", "SOUL"],
    IDXTRANS: ["TCPI", "GIAA", "JSMR", "ELPI", "RMKE", "CMNP", "TMAS", "GMFI", "BULL", "MBSS", "SHIP", "SMDR", "CASS", "BIRD", "HATM", "BESS", "CBRE", "SOCI", "WINS", "PORT", "ASSA", "HUMI", "IPCC", "GTSI", "IPCM", "TPMA", "PSSI", "PSAT", "BLOG", "BBRM", "BSML", "BLTA", "CMPP", "TAMU", "MITI", "NELY", "HAIS", "RIGS", "BOAT", "GTRA", "MPXL", "SAFE", "KLAS", "PURA", "SDMU", "TRUK", "SAPX", "HELI", "PTIS", "PPGL", "WEHA", "LAJU", "TAXI", "KARW", "CANI", "JAYA", "LRNA", "TNCA", "KJEN", "ARKA"],
  };

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchMarketData();
      setData(next);
      setForeignFlow(next.foreignFlow);
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
    intervalRef.current = setInterval(refresh, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh]);

  // Fetch foreign flow history (rolling net flow)
  useEffect(() => {
    fetch("/api/foreign-flow-history")
      .then((r) => r.json())
      .then((d) => setFlowHistory(d.days ?? []))
      .catch(() => {});
  }, []);

  // Fetch commodity prices
  useEffect(() => {
    fetch("/api/commodities")
      .then((r) => r.json())
      .then((d) => setCommodityData(d))
      .catch(() => {});
  }, []);

  const ihsg: Quote = data?.ihsg ?? IHSG_FALLBACK;
  const ihsgClose = ihsg.close ?? IHSG_FALLBACK.close!;
  const txnHistory = data?.txnHistory ?? [];
  const ihsgChange = ihsg.change ?? 0;
  const ihsgUp = ihsgChange >= 0;
  const rec = recommendLabel(ihsg.recommend);
  const rsi = rsiLabel(ihsg.rsi);

  const marketOpen = isMarketOpen();
  const manual: ManualData = data?.manualData ?? FALLBACK_MANUAL;
  const ff = foreignFlow ?? data?.foreignFlow ?? null;

  const macroRows = useMemo(() => {
    const m = data?.macro ?? {};
    const usdIdr = m.USDIDR;
    const gold = m.GOLD;
    const brent = m.UKOIL;
    const us10y = m.US10Y;
    return [
      { label: "IHSG", value: fmtNum(ihsg.close), change: fmtPct(ihsg.change), up: ihsgUp, note: ihsg.perfYTD != null ? `YTD ${fmtPct(ihsg.perfYTD)}` : "Komposit" },
      { label: "USD/IDR", value: usdIdr?.close != null ? fmtNum(usdIdr.close) : "—", change: usdIdr?.change != null ? fmtPct(usdIdr.change) : "", up: (usdIdr?.change ?? 0) >= 0, note: "Spot" },
      { label: "BI Rate", value: `${(manual.biRate?.value ?? 5.50).toFixed(2)}%`, change: "Otomatis", up: true, note: manual.biRate?.note ?? "" },
      { label: "Yield SBN 10Th", value: `${(manual.bondYield10y?.value ?? 6.85).toFixed(2)}%`, change: manual.bondYield10y?.change != null ? `${manual.bondYield10y.change >= 0 ? "+" : ""}${manual.bondYield10y.change.toFixed(2)}%` : "", up: (manual.bondYield10y?.change ?? 0) >= 0, note: manual.bondYield10y?.note ?? "SBN FR" },
      (() => {
        const pendapatan = manual.apbn?.pendapatan ?? 1185.0;
        const pendapatanTarget = manual.apbn?.pendapatanTarget ?? 3153.6;
        const belanja = manual.apbn?.belanja ?? 1365.4;
        const belanjaTarget = manual.apbn?.belanjaTarget ?? 3842.7;
        const deficit = manual.apbn?.deficit ?? 180.4;
        const deficitTarget = manual.apbn?.deficitTarget ?? 689.0;
        const unit = manual.apbn?.unit ?? "T";
        return { label: "APBN", value: `Rp${belanja.toFixed(1).replace('.',',')}${unit}`, change: "", up: false, note: manual.apbn?.note ?? "Mei", detail: { lines: [
          { label: "Pendapatan", value: `Rp${pendapatan.toFixed(1).replace('.',',')}${unit} · ${(pendapatan/pendapatanTarget*100).toFixed(1)}%`, up: true },
          { label: "Belanja", value: `Rp${belanja.toFixed(1).replace('.',',')}${unit} · ${(belanja/belanjaTarget*100).toFixed(1)}%`, up: false },
          { label: "Defisit", value: `(Rp${deficit.toFixed(1).replace('.',',')}${unit}) · ${(deficit/deficitTarget*100).toFixed(1)}%`, up: false },
        ] } };
      })(),
      { label: "GDP", value: `${(manual.gdp?.growth ?? 5.6).toFixed(1)}%`, change: manual.gdp?.note ?? "yoy", up: true, note: manual.gdp?.quarter ?? "Q1-2026" },
      { label: "Inflasi", value: `${(manual.inflation?.value ?? 3.08).toFixed(2)}%`, change: manual.inflation?.note ?? "yoy", up: (manual.inflation?.value ?? 0) > 0, note: manual.inflation?.month ? `${manual.inflation.month} (BPS)` : "BPS" },
      { label: "Neraca Dagang", value: `$${(manual.tradeBalance?.value ?? 3.32).toFixed(2)}B`, change: manual.tradeBalance?.note ?? "", up: (manual.tradeBalance?.value ?? 3.32) >= 0, note: "Manual" },
    ];
  }, [data, ihsg, ihsgUp, manual]);

  const sectors = useMemo(() => {
    return (data?.sectors ?? []).map((s) => ({
      ...s,
      weight: SECTOR_META[s.code]?.weight ?? 0,
      color: SECTOR_META[s.code]?.color ?? "#B8AA96",
    }));
  }, [data]);

  const getPerf = (q: Quote) => TAB_COLUMNS[activeTab](q);
  const sortedSectors = useMemo(() => [...sectors].sort((a, b) => (getPerf(b) ?? -999) - (getPerf(a) ?? -999)), [sectors, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rolling net flow from history
  // Dynamic key levels from IHSG price data
  const keyLevels = useMemo(() => {
    const price = ihsgClose;

    // Fibonacci retracement from swing data
    const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
    const fibLabels = ["0%", "23.6%", "38.2%", "50%", "61.8%", "78.6%", "100%"];

    // Build fib levels from all available swings
    type FibLevel = { value: number; label: string; swing: string };
    const allFibs: FibLevel[] = [];

    const addSwing = (high: number | null, low: number | null, swingName: string) => {
      if (high == null || low == null || high <= low) return;
      const diff = high - low;
      fibRatios.forEach((ratio, i) => {
        const val = Math.round(high - diff * ratio);
        allFibs.push({ value: val, label: `${fibLabels[i]} ${swingName}`, swing: swingName });
      });
    };

    addSwing(ihsg.high6M, ihsg.low6M, "6B");
    addSwing(ihsg.high3M, ihsg.low3M, "3B");
    addSwing(ihsg.high1M, ihsg.low1M, "1B");

    // Deduplicate by value (keep first label)
    const seen = new Set<number>();
    const uniqueFibs = allFibs.filter((f) => {
      if (seen.has(f.value)) return false;
      seen.add(f.value);
      return true;
    });

    // Pick nearest 2 resistance (above price) and 2 support (below price)
    const above = uniqueFibs.filter((f) => f.value > price * 1.005).sort((a, b) => a.value - b.value);
    const below = uniqueFibs.filter((f) => f.value < price * 0.995).sort((a, b) => b.value - a.value);

    const resistance = above.slice(0, 2).map((f) => ({ value: f.value, label: f.label })).reverse(); // descending for display
    const support = below.slice(0, 2).map((f) => ({ value: f.value, label: f.label })); // descending (highest first)

    // Gap levels: Fibonacci levels as chips
    const fibGaps = uniqueFibs
      .filter((f) => {
        const dist = Math.abs(f.value - price) / price;
        return dist > 0.01 && dist < 0.25;
      })
      .map((f) => f.value);

    // MA gaps
    const maGaps: number[] = [];
    if (ihsg.sma20 != null && Math.abs(ihsg.sma20 - price) / price > 0.01) maGaps.push(Math.round(ihsg.sma20));
    if (ihsg.sma50 != null && Math.abs(ihsg.sma50 - price) / price > 0.02) maGaps.push(Math.round(ihsg.sma50));
    if (ihsg.sma100 != null && Math.abs(ihsg.sma100 - price) / price > 0.02) maGaps.push(Math.round(ihsg.sma100));
    if (ihsg.sma200 != null && Math.abs(ihsg.sma200 - price) / price > 0.02) maGaps.push(Math.round(ihsg.sma200));

    const gaps = [...new Set([...fibGaps, ...maGaps])].sort((a, b) => a - b);
    return { support, resistance, gaps };
  }, [ihsgClose, ihsg]);

  const rollingNetFlow = useMemo(() => {
    const sumDays = (n: number) => {
      const slice = flowHistory.slice(-n);
      return { total: slice.reduce((s, d) => s + d.dailyNet, 0), count: slice.length };
    };
    return { net7d: sumDays(7), net14d: sumDays(14), net30d: sumDays(30) };
  }, [flowHistory]);

  // MTD and YTD cumulative from history
  const cumulativeFlow = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const monthStr = String(curMonth + 1).padStart(2, "0");
    const yearStart = `${curYear}-01-01`;
    const monthStart = `${curYear}-${monthStr}-01`;
    const mtd = flowHistory
      .filter(d => d.date >= monthStart)
      .reduce((s, d) => s + d.dailyNet, 0);
    const ytd = flowHistory
      .filter(d => d.date >= yearStart)
      .reduce((s, d) => s + d.dailyNet, 0);
    // Today's net from latest day in history
    const todayNet = flowHistory.length > 0 ? flowHistory[flowHistory.length - 1].dailyNet : null;
    // Rolling cumulative sums for history chart (cumulative from start of data)
    const cumulative = [];
    let running = 0;
    for (const d of flowHistory) {
      running += d.dailyNet;
      cumulative.push({ date: d.date, cumNet: running });
    }
    return { mtd, ytd, todayNet, cumulative, startDate: flowHistory[0]?.date ?? "" };
  }, [flowHistory]);

  // Top movers computed from raw foreign flow data
  const topMovers = useMemo(() => {
    if (!ff?.rawAccumulation || !ff?.rawDistribution) return null;
    const allStocks = [...ff.rawAccumulation, ...ff.rawDistribution];
    // Deduplicate by stock_code (some may appear in both)
    const uniqueMap = new Map<string, ForeignFlowStock>();
    for (const s of allStocks) {
      const existing = uniqueMap.get(s.stock_code);
      if (!existing) uniqueMap.set(s.stock_code, s);
      else {
        // Merge: sum volumes and values
        uniqueMap.set(s.stock_code, {
          ...s,
          total_buy_volume: existing.total_buy_volume + s.total_buy_volume,
          total_sell_volume: existing.total_sell_volume + s.total_sell_volume,
          total_buy_value: existing.total_buy_value + s.total_buy_value,
          total_sell_value: existing.total_sell_value + s.total_sell_value,
          net_value: existing.net_value + s.net_value,
        });
      }
    }
    const unique = Array.from(uniqueMap.values());
    const topBuy = [...unique].sort((a, b) => b.net_value - a.net_value).slice(0, 10);
    const topSell = [...unique].sort((a, b) => a.net_value - b.net_value).slice(0, 10);
    const topActive = [...unique].sort((a, b) => (b.total_buy_value + b.total_sell_value) - (a.total_buy_value + a.total_sell_value)).slice(0, 10);
    return { topBuy, topSell, topActive, date: ff.date };
  }, [ff]);

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch { return ""; }
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
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Dashboard IHSG</span>
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-2">
              Dashboard <span className="text-gold-gradient font-medium">IHSG</span>
            </h1>
            <p className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
              Makro · Aliran Dana Asing · Rotasi Sektor · Indeks Global
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-[#B8AA96]/30"}`} />
              <span className="text-[10px] tracking-[0.15em] uppercase text-[#B8AA96]/50">
                {loading ? "Menghubungkan" : live ? (marketOpen ? "Live · Pasar Buka" : "Live · Pasar Tutup") : "Offline"}
              </span>
            </div>
            <div className="text-[#B8AA96]/30 text-[10px] tracking-[0.15em] uppercase mb-1">Terakhir Diperbarui</div>
            <div className="text-[#B8AA96]/60 text-sm font-mono">{lastUpdated ? fmtTime(lastUpdated) : "—"}</div>
          </div>
        </div>

        {/* MACRO INDICATORS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {macroRows.map((m) => {
            const hasDetail = "detail" in m;
            return (
            <div key={m.label} className="card-luxury p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase">{m.label}</span>
                <span className={`text-[10px] font-mono ${m.up ? "text-emerald-400" : "text-red-400"}`}>{m.change}</span>
              </div>
              {hasDetail ? (
                <div className="space-y-0.5 mt-1">
                  {(m as any).detail.lines.map((l: { label: string; value: string; up: boolean }, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em]">{l.label}</span>
                      <span className={`text-[11px] font-mono ${l.up ? "text-emerald-400/80" : "text-red-400/80"}`}>{l.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
              <div className="font-heading text-xl text-[#F4EFE6] font-medium">{m.value}</div>
              )}
              <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">{m.note}</div>
            </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* INDEKS GLOBAL */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Indeks Global</h2>
            {(() => {
              const m = data?.macro ?? {};
              const q = (k: string) => m[k] ?? null;
              const row = (label: string, quote: {close?: number|null, change?: number|null}|null, fmt: (n:number)=>string = n=>`${n.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1})}`) => {
                if (!quote || quote.close == null) return <div key={label} className="flex justify-between py-1.5 border-b border-[#2C261E]/30"><span className="text-[#B8AA96]/50 text-[11px]">{label}</span><span className="text-[#B8AA96]/30 text-[11px]">—</span></div>;
                const up = (quote.change ?? 0) >= 0;
                return <div key={label} className="flex justify-between py-1.5 border-b border-[#2C261E]/30">
                  <span className="text-[#B8AA96]/70 text-[11px]">{label}</span>
                  <span className="text-[11px] font-mono">
                    <span className="text-[#F4EFE6]">{fmt(quote.close)}</span>
                    <span className={`ml-1.5 ${up ? "text-emerald-400" : "text-red-400"}`}>{up ? "▲" : "▼"} {(quote.change ?? 0) >= 0 ? "+" : ""}{(quote.change ?? 0).toFixed(2)}%</span>
                  </span>
                </div>;
              };
              const usFmt = (n:number) => n.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});
              const asiaFmt = (n:number) => n.toLocaleString("en-US",{minimumFractionDigits:1,maximumFractionDigits:1});
              return <>
                <div className="text-[#B8AA96]/30 text-[9px] tracking-[0.15em] uppercase mb-2 mt-1">US</div>
                {["SPX","IXIC","DJI","DXY","VIX"].map(k => row(k === "SPX" ? "S&P 500" : k === "IXIC" ? "Nasdaq" : k === "DJI" ? "Dow Jones" : k, q(k), k === "DXY" ? n=>n.toFixed(2) : k === "VIX" ? n=>n.toFixed(2) : usFmt))}
                {(() => { const e = q("AMEX_EIDO") ?? data?.eido; return row("EIDO", e, n=>n.toFixed(2)); })()}
                <div className="text-[#B8AA96]/30 text-[9px] tracking-[0.15em] uppercase mb-2 mt-4">ASIA</div>
                {[
                  ["NI225","Nikkei 225"],
                  ["HSI","Hang Seng"],
                  ["KOSPI","KOSPI"],
                  ["STI","STI"],
                  ["NIFTY","NIFTY 50"],
                ].map(([k,label]) => row(label, q(k), asiaFmt))}
                <div className="text-[#B8AA96]/30 text-[9px] tracking-[0.15em] uppercase mb-2 mt-4">CRYPTO</div>
                {row("BTC", q("BTC"), n=>`$${n.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0})}`)}
              </>;
            })()}
          </div>

          {/* COMMODITY PRICES — fetched from /api/commodities */}
          <CommodityPricesPanel data={commodityData} live={live} />

          {/* KEY LEVELS */}
          <div className="card-luxury p-6">
            <h2 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-5 font-medium">Level Kunci IHSG</h2>
            <div className="text-center py-4 mb-5 border border-[#2C261E] bg-[#0B0B0A]">
              <div className="text-[#B8AA96]/40 text-[10px] tracking-[0.15em] uppercase mb-1">IHSG Live</div>
              <div className={`font-heading text-3xl font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>{fmtNum(ihsgClose)}</div>
              <div className={`text-xs font-mono mt-1 ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>
                {ihsgUp ? "▲" : "▼"} {fmtPct(ihsg.change)} {ihsg.changeAbs != null && `(${ihsgUp ? "+" : ""}${ihsg.changeAbs.toFixed(0)})`}
              </div>
              {/* Candle Terakhir */}
              {ihsg.open != null && ihsg.high != null && ihsg.low != null && (
                <div className="mt-4 pt-3 border-t border-[#2C261E]/50">
                  <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Candle Terakhir</div>
                  <div className="flex items-center justify-center gap-4">
                    {/* Visual candle */}
                    <div className="flex flex-col items-center" style={{ height: 60 }}>
                      <CandleSVG o={ihsg.open} h={ihsg.high} l={ihsg.low} c={ihsgClose} />
                    </div>
                    {/* OHLC numbers */}
                    <div className="text-left space-y-0.5">
                      {[
                        ["O", ihsg.open],
                        ["H", ihsg.high],
                        ["L", ihsg.low],
                        ["C", ihsgClose],
                      ].map(([l, v]) => (
                        <div key={l as string} className="flex items-center gap-2">
                          <span className="text-[#B8AA96]/40 text-[10px] w-3">{l}</span>
                          <span className="text-[#B8AA96] text-[11px] font-mono">{fmtNum(v as number)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {keyLevels.resistance.map((r, i) => (
                <LevelRow key={`r-${i}`} label={`R${keyLevels.resistance.length - i}`} value={r.value} tone="resistance" price={ihsgClose} sub={r.label} />
              ))}
              <div className="flex items-center gap-3 py-1">
                <span className="text-[#C6A15B] text-[10px] tracking-wider uppercase w-16">SEKARANG</span>
                <div className="flex-1 h-0.5 bg-[#C6A15B]/40" />
                <span className={`text-xs font-mono font-medium ${ihsgUp ? "text-emerald-400" : "text-red-400"}`}>{fmtNum(ihsgClose)}</span>
              </div>
              {keyLevels.support.map((s, i) => (
                <LevelRow key={`s-${i}`} label={`S${i + 1}`} value={s.value} tone="support" price={ihsgClose} sub={s.label} />
              ))}
              <div className="mt-2 pt-2 border-t border-[#2C261E]" />
              {ihsg.sma20 != null && <LevelRow label="MA20" value={ihsg.sma20} tone="ma-cyan" price={ihsgClose} />}
              {ihsg.sma50 != null && <LevelRow label="MA50" value={ihsg.sma50} tone="ma-blue" price={ihsgClose} />}
            </div>
            {/* Gap Levels */}
            {keyLevels.gaps.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#2C261E]">
                <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Gap & Level Psikologis</div>
                <div className="flex flex-wrap gap-1.5">
                  {keyLevels.gaps.map((g) => {
                    const above = g > ihsgClose;
                    return (
                      <span key={g} className={`text-[10px] font-mono px-2 py-0.5 border ${
                        above
                          ? "border-red-400/20 text-red-400/70 bg-red-400/5"
                          : "border-emerald-400/20 text-emerald-400/70 bg-emerald-400/5"
                      }`}>
                        {fmtNum(g)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Volume Transaksi */}
            <div className="mt-4 pt-4 border-t border-[#2C261E]/30">
              <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-3">Volume Transaksi IHSG</div>
              {ihsg.volume != null ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[#B8AA96]/30 text-[9px] tracking-[0.15em] uppercase">Hari Ini</div>
                    <div className="font-heading text-lg font-medium text-[#F4EFE6] mt-0.5">
                      Rp {(ihsg.volume / 1e12).toFixed(2).replace(".", ",")}T
                    </div>
                  </div>
                  {txnHistory.length > 1 && (
                    <div className="flex-1 max-w-[200px] ml-4">
                      <div className="flex items-end gap-0.5 h-10">
                        {txnHistory.slice(0, 7).map((d, i) => {
                          const maxVal = Math.max(...txnHistory.slice(0, 7).map(x => x.value), 1);
                          const h = Math.min(d.value / maxVal * 100, 100);
                          const dateStr = new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${dateStr}: Rp ${(d.value / 1e12).toFixed(2)}T`}>
                              <div className="w-full bg-[#C6A15B]/40 rounded-t-sm" style={{ height: `${Math.max(h, 4)}%` }} />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[#B8AA96]/30 text-[7px] mt-1">
                        <span>{new Date(txnHistory.slice(-7)[0]?.date ?? "").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                        <span>{new Date(txnHistory.slice(-1)[0]?.date ?? "").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[#B8AA96]/30 text-sm">—</div>
              )}

              {/* Toggle History */}
              {txnHistory.length > 0 && (
                <button
                  onClick={() => setShowVolumeHistory((v) => !v)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-[10px] tracking-[0.12em] uppercase text-[#C6A15B]/60 hover:text-[#C6A15B] transition-colors py-1"
                >
                  <span>{showVolumeHistory ? "▲" : "▼"}</span>
                  {showVolumeHistory ? "Sembunyikan" : "Lihat History"}
                </button>
              )}
              {showVolumeHistory && txnHistory.length > 0 && (
                <div className="mt-2 max-h-[280px] overflow-y-auto">
                  <div className="flex justify-between text-[9px] tracking-wide text-[#B8AA96]/30 uppercase mb-1 px-1">
                    <span>Tanggal</span>
                    <span>Volume</span>
                    <span>Δ</span>
                  </div>
                  {txnHistory.map((d, i) => {
                    const vol = d.value / 1e12;
                    const prev = txnHistory[i + 1]?.value;
                    const delta = prev != null ? ((d.value - prev) / prev) * 100 : null;
                    const up = delta != null && delta >= 0;
                    return (
                      <div key={d.date} className="flex justify-between items-center py-1.5 px-1 border-t border-[#2C261E]/40">
                        <span className="text-[#B8AA96]/50 text-[11px] font-mono">
                          {new Date(d.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-[#F4EFE6] text-[11px] font-mono">
                          Rp {vol.toFixed(2).replace(".", ",")}T
                        </span>
                        {delta != null ? (
                          <span className={`text-[10px] font-mono ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {up ? "+" : ""}{delta.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#B8AA96]/20 text-[10px]">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ MARKET OVERVIEW: Net Flow + Composition + Top Movers ═══ */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
              Market <span className="text-gold-gradient font-medium">Overview</span>
            </h2>
            <span className="text-[9px] text-emerald-400/50 uppercase tracking-wider border border-emerald-500/20 px-1.5 py-0.5">Auto</span>
          </div>

          {/* Net Flow Rolling + Composition */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Net Flow 7d / 14d / 30d */}
            <div className="card-luxury p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">Net Flow Asing Kumulatif</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Hari Ini", value: cumulativeFlow.todayNet ?? (ff?.weekNet ?? null), unit: "M", div: 1e3 },
                  { label: "MTD", value: cumulativeFlow.mtd, unit: "M", div: 1e3 },
                  { label: "YTD", value: cumulativeFlow.ytd, unit: "T", div: 1e6 },
                ].map((r) => (
                  <div key={r.label} className="border border-[#2C261E] p-3 text-center">
                    <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.15em] uppercase mb-1">{r.label}</div>
                    <div className={`text-sm font-mono font-medium ${r.value == null ? "text-[#B8AA96]/30" : r.value >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {r.value != null ? `${r.value >= 0 ? "" : "-"}Rp ${Math.abs(r.value / r.div).toFixed(2).replace(".", ",")}${r.unit}` : "—"}
                    </div>
                    {r.label === "MTD" && <div className="text-[#B8AA96]/30 text-[8px] mt-0.5">{new Date().toLocaleDateString("id-ID", { month: "long" })}</div>}
                    {r.label === "YTD" && <div className="text-[#B8AA96]/30 text-[8px] mt-0.5">{new Date().getFullYear()}</div>}
                  </div>
                ))}
              </div>
              {flowHistory.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#2C261E]">
                  {/* Rolling cumulative: 7d / 14d / 30d */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "7 Hari", value: rollingNetFlow.net7d.total, div: 1e3, unit: "M" },
                      { label: "14 Hari", value: rollingNetFlow.net14d.total, div: 1e3, unit: "M" },
                      { label: "30 Hari", value: rollingNetFlow.net30d.total, div: 1e3, unit: "M" },
                    ].map((r) => (
                      <div key={r.label} className="text-center">
                        <div className="text-[#B8AA96]/30 text-[8px] tracking-[0.1em] uppercase">{r.label}</div>
                        <div className={`text-xs font-mono font-medium ${r.value >= 0 ? "text-emerald-400/80" : "text-red-400/80"}`}>
                          {r.value >= 0 ? "+" : ""}Rp {(r.value / r.div).toFixed(1).replace(".", ",")}{r.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Historis Harian */}
                  <div className="text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase mb-2">Historis Harian (Miliar Rp)</div>
                  <div className="max-h-64 overflow-y-auto mb-3">
                    <table className="w-full text-[10px] text-[#B8AA96]/70">
                      <tbody>
                        {flowHistory.slice(-15).reverse().map((d, i) => (
                          <tr key={i} className="border-b border-[#2C261E]/30">
                            <td className="py-1">{d.date}</td>
                            <td className={`py-1 text-right ${d.dailyNet >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {d.dailyNet >= 0 ? "+" : ""}{(d.dailyNet / 1e3).toFixed(2).replace(".", ",")} M
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}
            </div>
                </div>
              )}
            </div>

            <Idx100Panel />
          </div>

          <TopMoverPanel data={topMovers} live={live} />
        </div>

        {/* SECTOR ROTATION HEATMAP */}
        <div className="card-luxury p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">
                Sektor <span className="text-gold-gradient font-medium">Rotasi</span>
              </h2>
              <p className="text-[10px] text-[#B8AA96]/40 mt-1">
                {live ? "Realtime dari TradingView" : "Offline — data terakhir/kosong"} · {sectors.filter((s) => s.type === "index").length} indeks sektor + {sectors.filter((s) => s.type === "basket").length} keranjang bellwether
              </p>
            </div>
            <div className="flex items-center gap-1">
              {(["Day", "Week", "1M", "YTD"] as PerfTab[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs tracking-[0.15em] uppercase font-medium transition-all ${
                    activeTab === tab ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30" : "border border-[#2C261E] text-[#B8AA96]/50 hover:text-[#B8AA96]"
                  }`}>{tab}</button>
              ))}
            </div>
          </div>
          {sortedSectors.length === 0 ? (
            <EmptyState title="Data sektor tidak tersedia" description="Rotasi sektor akan tampil saat data sektor berhasil dimuat." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {sortedSectors.map((s) => {
                const perf = getPerf(s);
                const intensity = perf != null ? Math.min(Math.abs(perf) / 15, 1) : 0;
                const bg = perf == null ? "rgba(184, 170, 150, 0.05)" : perf >= 0 ? `rgba(34, 197, 94, ${0.08 + intensity * 0.25})` : `rgba(239, 68, 68, ${0.08 + intensity * 0.25})`;
                const borderColor = perf == null ? "rgba(44, 38, 30, 0.5)" : perf >= 0 ? `rgba(34, 197, 94, ${0.15 + intensity * 0.3})` : `rgba(239, 68, 68, ${0.15 + intensity * 0.3})`;
                return (
                  <div key={s.code} className="p-4 border transition-all hover:scale-[1.03] cursor-pointer" style={{ backgroundColor: bg, borderColor }} onClick={() => setSelectedSector({ code: s.code, name: s.name, color: s.color, type: s.type, tickers: BASKET_TICKERS[s.code] })}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#F4EFE6] text-xs font-medium">{s.name}</span>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    </div>
                    <div className={`font-heading text-lg font-medium ${perf == null ? "text-[#B8AA96]/50" : perf >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {perf == null ? "—" : `${perf >= 0 ? "+" : ""}${perf.toFixed(1)}%`}
                    </div>
                    <div className="text-[#B8AA96]/30 text-[9px] mt-0.5">
                      Bobot: {s.weight}%{s.type === "basket" && s.components ? ` · ${s.components} stk` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                    <tr key={s.code} className="border-b border-[#2C261E]/30 cursor-pointer hover:bg-[#2C261E]/40 transition-colors" onClick={() => setSelectedSector({ code: s.code, name: s.name, color: s.color, type: s.type, tickers: BASKET_TICKERS[s.code] })}>
                      <td className="py-2 text-[#F4EFE6] font-sans flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                        {s.type === "basket" && <span className="text-[8px] text-[#B8AA96]/40 uppercase">basket</span>}
                        <span className="text-[#B8AA96]/30 text-[9px]">→</span>
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


      </div>
      <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-12">
        <Disclaimer />
      </div>

      {selectedSector && (
        <SectorStocksPanel
          sectorCode={selectedSector.code}
          sectorName={selectedSector.name}
          sectorColor={selectedSector.color}
          sectorType={selectedSector.type as "index" | "basket" | undefined}
          sectorTickers={selectedSector.tickers}
          onClose={() => setSelectedSector(null)}
        />
      )}

      <Footer />
    </div>
  );
}

/* ── Candle SVG ── */
function CandleSVG({ o, h, l, c }: { o: number; h: number; l: number; c: number }) {
  const bearish = c < o;
  const color = bearish ? "#ef4444" : "#34d399";
  const wickColor = bearish ? "#ef444480" : "#34d39980";
  const range = h - l || 1;
  const svgH = 60;
  const svgW = 24;
  const bodyTop = ((h - Math.max(o, c)) / range) * svgH;
  const bodyH = Math.max(((Math.abs(o - c)) / range) * svgH, 2);
  const wickTop = 0;
  const wickH = svgH;
  const cx = svgW / 2;
  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* Upper wick */}
      <line x1={cx} y1={wickTop} x2={cx} y2={bodyTop} stroke={wickColor} strokeWidth={1.5} />
      {/* Body */}
      <rect x={cx - 5} y={bodyTop} width={10} height={bodyH} fill={color} rx={1} />
      {/* Lower wick */}
      <line x1={cx} y1={bodyTop + bodyH} x2={cx} y2={wickH} stroke={wickColor} strokeWidth={1.5} />
    </svg>
  );
}

/* ── Presentational helpers ── */
function LevelRow({ label, value, tone, price, sub }: { label: string; value: number; tone: "support" | "resistance" | "ma-blue" | "ma-cyan" | "ma-green" | "ma-purple"; price?: number; sub?: string }) {
  const pct = price != null && price > 0 ? ((value - price) / price) * 100 : null;
  const above = price != null && value >= price;
  const tones = {
    support: { text: "text-emerald-400/60", dot: "text-emerald-400", bar: "bg-emerald-400/20" },
    resistance: { text: "text-red-400/60", dot: "text-red-400", bar: "bg-red-400/20" },
    "ma-blue": { text: "text-blue-400/60", dot: "text-blue-400", bar: "bg-blue-400/20" },
    "ma-cyan": { text: "text-cyan-400/60", dot: "text-cyan-400", bar: "bg-cyan-400/20" },
    "ma-green": { text: "text-lime-400/60", dot: "text-lime-400", bar: "bg-lime-400/20" },
    "ma-purple": { text: "text-purple-400/60", dot: "text-purple-400", bar: "bg-purple-400/20" },
  }[tone];
  return (
    <div className="flex items-center gap-3">
      <span className={`${tones.text} text-[10px] tracking-wider uppercase w-16`}>{label}</span>
      <div className={`flex-1 h-px ${tones.bar}`} />
      {sub && <span className="text-[9px] text-[#B8AA96]/40 font-mono truncate max-w-[80px]">{sub}</span>}
      <span className={`${tones.dot} text-xs font-mono`}>{fmtNum(value)}</span>
      {pct != null && (
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${above ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {above ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function PerfCell({ v }: { v: number | null | undefined }) {
  if (v == null || !Number.isFinite(v)) return <td className="py-2 text-right text-[#B8AA96]/30">—</td>;
  return <td className={`py-2 text-right ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</td>;
}
