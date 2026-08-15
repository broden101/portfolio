"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer, EmptyState } from "@/components/DataState";

const gold = "#d6ad5a";

interface Recommendation {
  ticker: string;
  broker: string;
  action: string;
  entry: string;
  target_price: string;
  stop_loss: string;
  title: string;
  source: string;
  url: string;
  date: string;
  last_price?: number;
  change_pct?: number;
  upside_pct?: number;
  downside_pct?: number;
}

export default function TrackerPage() {
  const [data, setData] = useState<Recommendation[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/data/tracker/latest.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json.data || []);
        setUpdatedAt(json.updated_at || "");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tracker data:", err);
        setLoading(false);
      });
  }, []);

  // Frekuensi kemunculan (ticker, tanggal) — emiten yang sering direkomendasikan
  // pada hari yang sama (modus) diurutkan ke paling atas.
  const freqMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of data) {
      const key = `${item.date}|${item.ticker}`;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }, [data]);

  const filtered = useMemo(() => {
    return data
      .filter((item) => {
        const q = search.toLowerCase();
        return (
          item.ticker.toLowerCase().includes(q) ||
          item.broker.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // 1. Tanggal rilis terbaru dulu
        const da = a.date || "";
        const db = b.date || "";
        if (da !== db) return da < db ? 1 : -1;
        // 2. Modus: emiten paling sering muncul di hari yang sama paling atas
        const fa = freqMap.get(`${a.date}|${a.ticker}`) || 0;
        const fb = freqMap.get(`${b.date}|${b.ticker}`) || 0;
        if (fa !== fb) return fb - fa;
        // 3. Kelompokkan emiten yang sama biar berdampingan
        if (a.ticker !== b.ticker) return a.ticker < b.ticker ? -1 : 1;
        // 4. Upside tertinggi di dalam grup
        return (b.upside_pct ?? -999) - (a.upside_pct ?? -999);
      });
  }, [data, search, freqMap]);

  return (
    <div className="min-h-screen bg-[#0B0B0A] text-[#F4EFE6] font-sans flex flex-col pt-24 pb-20">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">
                Live Tracker
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl text-[#F4EFE6] font-light">
              Rekomendasi Saham Terbaru
            </h1>
            <p className="text-sm text-[#B8AA96]/70 mt-1">
              Rekomendasi analis sekuritas — entry, TP, SL, harga live, &amp; potensi upside.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-[#B8AA96]/60 text-right">
              <div>Pembaruan Terakhir:</div>
              <div className="font-mono text-[#F4EFE6]">
                {updatedAt ? new Date(updatedAt).toLocaleString("id-ID") : "—"}
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#1A1A18] hover:bg-[#2C261E] text-xs font-medium text-[#F4EFE6] rounded border border-[#2C261E] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#161614] p-4 rounded border border-[#2C261E]">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari emiten, broker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0B0B0A] border border-[#2C261E] rounded px-3 py-2 text-sm text-[#F4EFE6] placeholder-[#B8AA96]/40 focus:outline-none focus:border-[#C6A15B] w-full sm:w-80 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-[#B8AA96]/70 font-mono">
              {filtered.length} rekomendasi
            </span>
          </div>
        </div>

        {/* Table / Content */}
        {loading ? (
          <div className="text-center py-20 text-[#B8AA96]/70 font-mono text-sm">Memuat data rekomendasi...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada rekomendasi yang sesuai filter"
            description="Coba ubah kata kunci pencarian."
          />
        ) : (
          <div className="bg-[#161614] rounded border border-[#2C261E] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2C261E] bg-[#1A1A18] text-[11px] font-semibold text-[#B8AA96] uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Emiten</th>
                    <th className="py-3 px-4">Broker / Sumber</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4 text-right">Entry</th>
                    <th className="py-3 px-4 text-right">Target Price (TP)</th>
                    <th className="py-3 px-4 text-right">Stop Loss (SL)</th>
                    <th className="py-3 px-4 text-right">Harga Last</th>
                    <th className="py-3 px-4 text-right">Upside</th>
                    <th className="py-3 px-4 text-right">Downside</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C261E]/40 text-xs">
                  {filtered.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1A1A18]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[#B8AA96] whitespace-nowrap">
                        {item.date ? new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#F4EFE6]">
                        <span className="font-mono bg-[#1A1A18] px-2 py-1 rounded text-[#C6A15B] border border-[#2C261E]">
                          {item.ticker}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#F4EFE6] font-medium">
                        {item.broker}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded ${
                            item.action.toLowerCase().includes("buy")
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : item.action.toLowerCase().includes("sell")
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#B8AA96]">
                        {item.entry}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#C6A15B]">
                        {item.target_price}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-red-400">
                        {item.stop_loss}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#F4EFE6]">
                        {item.last_price ? item.last_price.toLocaleString("id-ID") : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {item.upside_pct !== undefined && item.upside_pct !== null ? (
                          <span
                            className={
                              item.upside_pct >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                            }
                          >
                            {item.upside_pct > 0 ? `+${item.upside_pct}%` : `${item.upside_pct}%`}
                          </span>
                        ) : (
                          <span className="text-[#B8AA96]/40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {item.downside_pct !== undefined && item.downside_pct !== null ? (
                          <span
                            className={
                              item.downside_pct >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"
                            }
                          >
                            {item.downside_pct > 0 ? `+${item.downside_pct}%` : `${item.downside_pct}%`}
                          </span>
                        ) : (
                          <span className="text-[#B8AA96]/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-12">
          <Disclaimer />
        </div>
      </main>

      <Footer />
    </div>
  );
}
