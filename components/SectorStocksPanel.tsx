"use client";

import { useEffect, useState, useCallback } from "react";

type Stock = {
  name: string;
  desc: string;
  close: number | null;
  change: number | null;
  volume: number | null;
  mcap: number | null;
  rsi: number | null;
  perf1m: number | null;
};

type Props = {
  sectorCode: string;
  sectorName: string;
  sectorColor: string;
  onClose: () => void;
};

export default function SectorStocksPanel({ sectorCode, sectorName, sectorColor, onClose }: Props) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"mcap" | "change" | "volume">("mcap");
  const [sortAsc, setSortAsc] = useState(false);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      // Map sector code to TradingView sector name
      const sectorMap: Record<string, string> = {
        IDXFINANCE: "Finance",
        IDXBASIC: "Basic Materials",
        IDXENERGY: "Energy",
        IDXINDUST: "Industrials",
        IDXHEALTH: "Healthcare",
        IDXPROPERT: "Properties & Real Estate",
        IDXTECHNO: "Technology",
        IDXINFRA: "Infrastructure",
        IDXCYCLIC: "Consumer Cyclical",
        IDXNONCYC: "Consumer Non-Cyclical",
        IDXTRANS: "Transportation",
      };

      const tvSector = sectorMap[sectorCode] || sectorName;

      const resp = await fetch("/api/scanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector: tvSector }),
      });

      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setStocks(data.data || []);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [sectorCode, sectorName]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const sorted = [...stocks].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return sortAsc ? av - bv : bv - av;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const fmtMcap = (v: number | null) => {
    if (v == null) return "-";
    if (v >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    return `${(v / 1e6).toFixed(0)}M`;
  };

  const fmtVol = (v: number | null) => {
    if (v == null) return "-";
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
    return String(v);
  };

  const SortIcon = ({ active, asc }: { active: boolean; asc: boolean }) => (
    <span style={{ opacity: active ? 1 : 0.3, fontSize: "0.65rem", marginLeft: 2 }}>
      {asc ? "▲" : "▼"}
    </span>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", justifyContent: "flex-end",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: 480, height: "100%",
        background: "#0a0e17", borderLeft: `2px solid ${sectorColor}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${sectorColor}30`,
          background: `linear-gradient(135deg, ${sectorColor}10 0%, transparent 100%)`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: sectorColor, boxShadow: `0 0 8px ${sectorColor}80`,
            }} />
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
              IDX {sectorName}
            </span>
            <span style={{
              fontSize: "0.7rem", color: sectorColor, background: `${sectorColor}15`,
              padding: "2px 8px", borderRadius: 4, border: `1px solid ${sectorColor}30`,
            }}>
              {stocks.length} saham
            </span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#666",
            fontSize: "1.2rem", cursor: "pointer", padding: 4,
          }}>✕</button>
        </div>

        {/* Sort buttons */}
        <div style={{
          padding: "8px 20px", display: "flex", gap: 8,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          {(["mcap", "change", "volume"] as const).map((k) => (
            <button key={k} onClick={() => toggleSort(k)} style={{
              background: sortKey === k ? `${sectorColor}20` : "transparent",
              border: `1px solid ${sortKey === k ? sectorColor + "40" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 4,
              color: sortKey === k ? sectorColor : "#999",
              fontSize: "0.7rem", padding: "3px 8px",
              cursor: "pointer", display: "flex", alignItems: "center",
            }}>
              {k === "mcap" ? "Kapitalisasi" : k === "change" ? "Perubahan" : "Volume"}
              <SortIcon active={sortKey === k} asc={sortAsc} />
            </button>
          ))}
        </div>

        {/* Stock list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: sectorColor }}>
              Memuat data saham...
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#555" }}>
              Tidak ada data
            </div>
          ) : (
            sorted.map((s, i) => {
              const chg = s.change ?? 0;
              const chgColor = chg > 0 ? "#00E676" : chg < 0 ? "#FF5252" : "#666";
              return (
                <div key={s.name} style={{
                  display: "flex", alignItems: "center",
                  padding: "8px 20px", gap: 12,
                  borderBottom: `1px solid ${sectorColor}08`,
                  background: i % 2 === 0 ? "transparent" : `${sectorColor}05`,
                }}>
                  {/* Ticker */}
                  <div style={{ minWidth: 56 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: sectorColor }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#555", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                      {s.desc || ""}
                    </div>
                  </div>

                  {/* Spacer */}
                  <div style={{ flex: 1 }} />

                  {/* Price */}
                  <div style={{ textAlign: "right", minWidth: 60 }}>
                    <div style={{ fontSize: "0.75rem", color: "#aaa", fontWeight: 500 }}>
                      {s.close != null ? s.close.toLocaleString("id-ID") : "-"}
                    </div>
                  </div>

                  {/* Change */}
                  <div style={{
                    textAlign: "right", minWidth: 52,
                    color: chgColor, fontWeight: 600, fontSize: "0.75rem",
                  }}>
                    {chg > 0 ? "+" : ""}{chg.toFixed(2)}%
                  </div>

                  {/* MCap */}
                  <div style={{ textAlign: "right", minWidth: 48, fontSize: "0.65rem", color: "#777" }}>
                    {fmtMcap(s.mcap)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
