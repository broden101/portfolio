"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer, DataBadge, SourceNote, EmptyState } from "@/components/DataState";

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
}

export default function TrackerPage() {
  const [data, setData] = useState<Recommendation[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");

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

  const filtered = data.filter((item) => {
    const matchSearch =
      item.ticker.toLowerCase().includes(search.toLowerCase()) ||
      item.broker.toLowerCase().includes(search.toLowerCase()) ||
      item.title.toLowerCase().includes(search.toLowerCase());
    const matchSource =
      sourceFilter === "ALL" || item.source.toUpperCase() === sourceFilter.toUpperCase();
    return matchSearch && matchSource;
  });

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#d6ad5a]/20 text-[#d6ad5a]">
                LIVE TRACKER
              </span>
              <span className="text-xs text-gray-400">
                Update Otomatis Hari Bursa
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Rekomendasi Saham Terbaru
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Agregator rekomendasi analis sekuritas harian (CNBC, Kontan, &amp; Morning Brief) lengkap dengan harga live &amp; potensi upside.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-400 text-right">
              <div>Pembaruan Terakhir:</div>
              <div className="font-mono text-white">
                {updatedAt ? new Date(updatedAt).toLocaleString("id-ID") : "—"}
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-xs font-medium rounded-md border border-gray-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#161b22] p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Cari emiten, broker, judul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d6ad5a] w-full sm:w-80"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "CNBC Indonesia", "Kontan"].map((src) => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  sourceFilter === src
                    ? "bg-[#d6ad5a] text-black font-semibold"
                    : "bg-[#0d1117] text-gray-300 hover:bg-[#21262d] border border-gray-700"
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Content */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Memuat data rekomendasi...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Tidak ada rekomendasi yang sesuai filter"
            description="Coba ubah kata kunci pencarian atau pindah filter sumber."
          />
        ) : (
          <div className="bg-[#161b22] rounded-xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 bg-[#1f242c] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Emiten</th>
                    <th className="py-3 px-4">Broker / Sumber</th>
                    <th className="py-3 px-4">Aksi</th>
                    <th className="py-3 px-4 text-right">Entry</th>
                    <th className="py-3 px-4 text-right">Target Price (TP)</th>
                    <th className="py-3 px-4 text-right">Stop Loss (SL)</th>
                    <th className="py-3 px-4 text-right">Harga Last</th>
                    <th className="py-3 px-4 text-right">Upside</th>
                    <th className="py-3 px-4">Artikel / Sumber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {filtered.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1f242c]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <span className="font-mono bg-[#21262d] px-2 py-1 rounded text-[#d6ad5a] border border-gray-700">
                          {item.ticker}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-200">{item.broker}</div>
                        <div className="text-xs text-gray-400">{item.source}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            item.action.toLowerCase().includes("buy")
                              ? "bg-green-500/20 text-green-400"
                              : item.action.toLowerCase().includes("sell")
                              ? "bg-red-500/20 text-red-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {item.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-300">
                        {item.entry}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#d6ad5a]">
                        {item.target_price}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-red-400">
                        {item.stop_loss}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-white">
                        {item.last_price ? item.last_price.toLocaleString("id-ID") : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {item.upside_pct !== undefined && item.upside_pct !== null ? (
                          <span
                            className={
                              item.upside_pct >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"
                            }
                          >
                            {item.upside_pct > 0 ? `+${item.upside_pct}%` : `${item.upside_pct}%`}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline line-clamp-1 max-w-xs"
                            title={item.title}
                          >
                            {item.title}
                          </a>
                        ) : (
                          <span className="text-gray-400">{item.title}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8">
          <Disclaimer />
        </div>
      </main>

      <Footer />
    </div>
  );
}
