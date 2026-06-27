"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketTickerStrip from "@/components/MarketTickerStrip";
import { Disclaimer, DataBadge, SourceNote, EmptyState } from "@/components/DataState";

const gold = "#d6ad5a";

const articles = [
  {
    date: "19 JUNI 2026",
    category: "ROBOTIK / SUPPLY CHAIN",
    title: "Siapa Pembuat Sendi Robot? Rantai Pasok Aktuator dari Jepang sampai China",
    summary: "Satu joint robot butuh komponen dari banyak negara. Ini cara baca emiten pick-and-shovel di balik hype humanoid robot.",
    read: "7 MIN READ",
    href: "/articles/robot-actuator-supply-chain",
  },
  {
    date: "17 JUNI 2026",
    category: "IHSG / MAKRO",
    title: "IHSG Q1 2026 Anjlok: Asing Kabur, Rupiah Lemah, Fiskal Diuji",
    summary: "IHSG turun -19,68% dari ATH. Asing keluar Rp8,71 T dalam dua gelombang. Catatan penyebab, bukan drama headline.",
    read: "11 MIN READ",
    href: "/articles/ihsg-q1-2026",
  },
  {
    date: "15 JUNI 2026",
    category: "CORPORATE ACTION / RIGHTS ISSUE",
    title: "Jadwal Rights Issue 2026: Emiten Mana yang Benar Butuh Modal?",
    summary: "MPPA Rp5,94 T, BBNI Rp4,76 T, IFSX Rp3,7 T. Cek rasio, harga pelaksanaan, dan potensi dilusi.",
    read: "9 MIN READ",
    href: "/articles/right-issue-2026",
  },
];

const defaultSnapshots = [
  { name: "IHSG", sub: "Index", value: "—", change: "—", tone: "flat", path: "M0 28 L10 22 L18 24 L28 13 L38 18 L48 8 L58 16 L68 5 L78 10" },
  { name: "USD/IDR", sub: "Rupiah", value: "—", change: "—", tone: "flat", path: "M0 30 L12 27 L24 24 L36 19 L48 17 L60 11 L78 7" },
  { name: "Emas", sub: "Spot USD/Oz", value: "—", change: "—", tone: "flat", path: "M0 18 L20 18 L20 14 L40 14 L40 14 L78 14" },
  { name: "BI Rate", sub: "Interest Rate", value: "—", change: "—", tone: "flat", path: "M0 18 L20 18 L20 14 L40 14 L40 14 L78 14" },
];

const method = [
  { title: "Macro dan Micro Dashboard", desc: "Membaca arah siklus global, makro domestik, dan kebijakan yang menggerakkan market.", icon: "globe" },
  { title: "Valuation Check", desc: "Memastikan harga masuk akal dengan pendekatan DCF, komparabel, dan reverse check.", icon: "search" },
  { title: "Flow & Positioning", desc: "Memantau arus dana asing, likuiditas, dan positioning institusi di tiap sektor.", icon: "chart" },
  { title: "Trading Plan / Investing Plan", desc: "Disiplin manajemen risiko: skenario, downside, dan probabilitas lebih dulu.", icon: "shield" },
];

type SectorRow = {
  code: string;
  name: string;
  change: number | null;
};

const marketMapSections = [
  { id: "IDXFINANCE", name: "FINANCE" },
  { id: "IDXBASIC", name: "BASIC MATERIALS" },
  { id: "IDXENERGY", name: "ENERGY" },
  { id: "IDXHEALTH", name: "HEALTHCARE" },
  { id: "IDXINDUST", name: "INDUSTRIALS" },
  { id: "IDXCYC", name: "CONSUMER CYCLICAL" },
  { id: "IDXTECHNOLOGY", name: "TECHNOLOGY" },
  { id: "IDXLQ45", name: "LQ 45" },
];

function Icon({ type }: { type: string }) {
  const common = { fill: "none", stroke: gold, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (type === "globe") return <svg viewBox="0 0 32 32" className="h-8 w-8"><circle cx="16" cy="16" r="11" {...common}/><path d="M5 16h22M16 5c4 4 4 18 0 22M16 5c-4 4-4 18 0 22" {...common}/></svg>;
  if (type === "search") return <svg viewBox="0 0 32 32" className="h-8 w-8"><circle cx="14" cy="14" r="8" {...common}/><path d="M20 20l7 7" {...common}/><path d="M10 14h8" {...common}/></svg>;
  if (type === "chart") return <svg viewBox="0 0 32 32" className="h-8 w-8"><path d="M5 25h22M7 22l6-7 5 4 8-11" {...common}/><path d="M22 8h4v4" {...common}/></svg>;
  return <svg viewBox="0 0 32 32" className="h-8 w-8"><path d="M16 4l10 4v7c0 7-4 11-10 13C10 26 6 22 6 15V8l10-4z" {...common}/><path d="M12 16l3 3 6-7" {...common}/></svg>;
}

function BankSketch() {
  return (
    <svg viewBox="0 0 260 190" className="h-full w-full text-[#d6ad5a] opacity-80">
      <path d="M35 72L130 25l95 47" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M55 78h150M65 92v55M95 92v55M125 92v55M155 92v55M185 92v55M50 150h160M42 166h176" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M110 58h40M95 70h70" fill="none" stroke="currentColor" strokeWidth="1" opacity=".55" />
      <circle cx="130" cy="54" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity=".6" />
    </svg>
  );
}

export default function Home() {
  const [snapshots, setSnapshots] = useState(defaultSnapshots);
  const [updatedAt, setUpdatedAt] = useState<string | "">("");
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [marketStatus, setMarketStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const d = await res.json();

        const ihsg = d?.ihsg ?? {};
        const usdidr = d?.macro?.USDIDR ?? {};
        const gold = d?.macro?.GOLD ?? {};
        const bi = d?.manualData?.biRate ?? {};

        const num = (v: unknown) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : null;
        };
        const fmtClose = (v: unknown, decimals = 2) => {
          const n = num(v);
          if (n == null) return "—";
          return n.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        };
        const fmtPct = (v: unknown) => {
          const n = num(v);
          if (n == null) return "—";
          return (n > 0 ? "+" : "") + n.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
        };
        const tone = (v: unknown): "up" | "down" | "flat" => {
          const n = num(v);
          if (n == null || n === 0) return "flat";
          return n > 0 ? "up" : "down";
        };

        const nextSnapshots = [
          { ...defaultSnapshots[0], value: fmtClose(ihsg.close, 2), change: fmtPct(ihsg.change), tone: tone(ihsg.change) },
          { ...defaultSnapshots[1], value: fmtClose(usdidr.close, 0), change: fmtPct(usdidr.change), tone: tone(usdidr.change) },
          { ...defaultSnapshots[2], value: fmtClose(gold.close, 2), change: fmtPct(gold.change), tone: tone(gold.change) },
          { ...defaultSnapshots[3], value: fmtClose(bi.value, 2) + "%", change: bi.note || "—", tone: "flat" },
        ];

        const rawSectors: Array<Record<string, unknown>> = Array.isArray(d?.sectors) ? d.sectors : [];
        const sectorMap = new Map(rawSectors.map((s) => [String(s.code), s]));
        const nextSectors: SectorRow[] = marketMapSections
          .map((section) => sectorMap.get(section.id))
          .filter(Boolean)
          .map((s) => ({ code: String(s!.code), name: String(s!.name), change: num(s!.change) }));

        const ts = d?.timestamp ? new Date(d.timestamp) : new Date();
        const timePart = ts.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
        const datePart = ts.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

        if (!cancelled) {
          setSnapshots(nextSnapshots);
          setSectors(nextSectors);
          setUpdatedAt(`${datePart} ${timePart} WIB`);
          setMarketStatus("loaded");
        }
      } catch {
        if (!cancelled) setMarketStatus("error");
      }
    }

    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const gridSectors = sectors.slice(0, 8);
  const gridTone = (change: number | null) => change == null || change === 0 ? "text-[#aaa295]/60" : change > 0 ? "text-emerald-400" : "text-red-400";
  const fmtChange = (change: number | null) => {
    if (change == null) return "—";
    return (change > 0 ? "+" : "") + change.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f2eee6]">
      <Navbar />
      <div className="pt-16">
        <MarketTickerStrip />
      </div>

      <section className="relative border-b border-[rgba(214,173,90,0.28)] pt-12 lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(198,161,91,0.09),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-20 lg:grid-cols-[1fr_420px] lg:px-12">
          <div className="relative flex gap-8">
            <div className="hidden pt-4 lg:block">
              <div className="vertical-rl text-[10px] tracking-[0.35em] text-[#d6ad5a]/60 [writing-mode:vertical-rl]">FOCUS. DISCIPLINE. CONSISTENT.</div>
            </div>
            <div className="max-w-3xl pt-6">
              <div className="mb-8 h-px w-24 bg-[#d6ad5a]" />
              <h1 className="font-heading text-[clamp(3.4rem,7vw,7.5rem)] font-medium leading-[0.92] tracking-[-0.04em] text-[#f2eee6]">
                Mana saham yang murah beneran?
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-8 text-[#aaa295] md:text-lg">
                Catatan riset pribadi tentang valuasi, arus asing, corporate action, dan narasi pasar modal Indonesia.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <a href="/articles" className="border border-[#d6ad5a] bg-[#d6ad5a] px-6 py-3 text-[11px] font-semibold tracking-[0.18em] text-[#050505] transition hover:bg-transparent hover:text-[#d6ad5a]">
                  BACA RISET TERBARU
                </a>
                <a href="/playbook/ihsg" className="text-[11px] font-semibold tracking-[0.18em] text-[#d6ad5a] hover:text-[#f2eee6]">
                  LIHAT MARKET MAP →
                </a>
              </div>
            </div>
          </div>

          <aside className="border border-[rgba(214,173,90,0.28)] bg-[#101010]/80 p-6 shadow-2xl shadow-black/30">
            <div className="mb-6 flex items-end justify-between border-b border-[rgba(214,173,90,0.28)] pb-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.25em] text-[#d6ad5a]">KILASAN PASAR</p>
                <p className="mt-2 text-xs text-[#aaa295]/50">{updatedAt || "Memuat data pasar..."}</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="space-y-5">
              {snapshots.map((s) => (
                <div key={s.name} className="grid grid-cols-[1fr_80px_90px] items-center gap-4 border-b border-[rgba(214,173,90,0.28)]/60 pb-4 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-[#f2eee6]">{s.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#aaa295]/45">{s.sub}</p>
                  </div>
                  <svg viewBox="0 0 80 36" className="h-9 w-20">
                    <path d={s.path} fill="none" stroke={s.tone === "down" ? "#d45b4f" : gold} strokeWidth="1.6" />
                  </svg>
                  <div className="text-right">
                    <p className="font-mono text-sm text-[#f2eee6]">{s.value}</p>
                    <p className={`mt-1 font-mono text-xs ${s.tone === "down" ? "text-red-400" : s.tone === "up" ? "text-emerald-400" : "text-[#aaa295]/60"}`}>{s.change}</p>
                  </div>
                </div>
              ))}
            </div>
              <div className="mt-3 text-[10px] text-[#aaa295]/45">
                {marketStatus === "error" ? "Data pasar tidak tersedia saat ini." : "Sumber: TradingView. Data dapat tertunda."}
              </div>
              <a href="/playbook/ihsg" className="mt-6 inline-block text-[11px] font-semibold tracking-[0.18em] text-[#d6ad5a]">LIHAT SELENGKAPNYA →</a>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 border-b border-[rgba(214,173,90,0.28)] px-6 py-16 lg:grid-cols-[1fr_360px] lg:px-12">
        <div>
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-3xl text-[#f2eee6]">RISET TERBARU</h2>
            <a href="/articles" className="text-[11px] font-semibold tracking-[0.18em] text-[#d6ad5a]">LIHAT SEMUA →</a>
          </div>
          <div className="divide-y divide-[rgba(214,173,90,0.28)] border-y border-[rgba(214,173,90,0.28)]">
            {articles.map((a) => (
              <a key={a.title} href={a.href} className="grid gap-5 py-8 transition hover:bg-[#d6ad5a]/[0.03] md:grid-cols-[150px_1fr_90px]">
                <p className="text-[11px] tracking-[0.18em] text-[#aaa295]/45">{a.date}</p>
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-[#d6ad5a]">{a.category}</p>
                  <h3 className="mt-3 font-heading text-2xl leading-tight text-[#f2eee6]">{a.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aaa295]/70">{a.summary}</p>
                </div>
                <p className="text-[10px] tracking-[0.18em] text-[#aaa295]/40 md:text-right">{a.read}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between border border-[rgba(214,173,90,0.28)] bg-[#101010] p-8">
          <div className="font-heading text-7xl leading-none text-[#d6ad5a]">“</div>
          <blockquote className="mt-4 font-heading text-3xl leading-tight text-[#f2eee6]">
Jangan takut mengakui kesalahan,
            Itu bukan kekalahan,
            Tapi kebijaksanaan.
          </blockquote>
          <div className="mt-10">
            <p className="text-sm text-[#aaa295]">— Raga</p>
            <a href="/#about" className="mt-6 inline-block text-[11px] font-semibold tracking-[0.18em] text-[#d6ad5a]">TENTANG RAGA →</a>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl border-b border-[rgba(214,173,90,0.28)] px-6 py-16 lg:px-12">
        <h2 className="mb-10 font-heading text-4xl text-[#f2eee6]">CARA MEMBACA MARKET</h2>
        <div className="grid gap-px bg-[rgba(214,173,90,0.28)] md:grid-cols-2 lg:grid-cols-4">
          {method.map((m) => (
            <div key={m.title} className="bg-[#050505] p-7">
              <Icon type={m.icon} />
              <h3 className="mt-7 font-heading text-2xl text-[#f2eee6]">{m.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#aaa295]/70">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1fr_460px] lg:px-12">
        <div className="grid overflow-hidden border border-[rgba(214,173,90,0.28)] bg-[#101010] md:grid-cols-[1fr_260px]">
          <div className="p-8 lg:p-10">
            <p className="text-[10px] font-semibold tracking-[0.24em] text-[#d6ad5a]">INSIGHT OF THE WEEK</p>
            <h2 className="mt-5 font-heading text-4xl leading-tight text-[#f2eee6]">Bank besar masih murah secara historis.</h2>
            <p className="mt-5 text-sm leading-8 text-[#aaa295]/75">
              Cost of fund turun, NIM stabil, dan kredit mulai tumbuh lagi. Tapi pasar masih menghukum karena kekhawatiran kualitas aset.
            </p>
            <a href="/articles" className="mt-8 inline-block text-[11px] font-semibold tracking-[0.18em] text-[#d6ad5a]">BACA ANALISIS LENGKAP →</a>
            <div className="mt-8 flex flex-wrap gap-2">
              {["BANKING", "VALUATION", "MACRO", "IHSG"].map((t) => <span key={t} className="border border-[rgba(214,173,90,0.28)] px-3 py-1 text-[10px] tracking-[0.16em] text-[#aaa295]/60">{t}</span>)}
            </div>
          </div>
          <div className="hidden border-l border-[rgba(214,173,90,0.28)] bg-[#050505] p-6 md:block"><BankSketch /></div>
        </div>

        <div className="border border-[rgba(214,173,90,0.28)] bg-[#101010] p-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-3xl text-[#f2eee6]">SEKTOR PASAR</h2>
            <a href="/playbook/ihsg" className="text-[10px] font-semibold tracking-[0.18em] text-[#d6ad5a]">LIHAT DETAIL →</a>
          </div>
          {sectors.length === 0 ? (
            <div className="text-xs text-[#aaa295]/60">Data sektor belum tersedia. Coba segarkan untuk memuat data terbaru.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold tracking-[0.12em]">
              {gridSectors.map((s) => (
                <div key={s.code} className="border border-[rgba(214,173,90,0.28)] bg-[#050505] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#aaa295]/80">{s.name}</span>
                    <span className={gridTone(s.change)}>{fmtChange(s.change)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <Disclaimer />
      </div>

      <Footer />
    </main>
  );
}
