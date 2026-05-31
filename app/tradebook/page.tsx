"use client";

import { useState, useEffect } from "react";
import {
  getPortfolio,
  addTrade,
  deleteTrade,
  resetPortfolio,
  getPortfolioStats,
  type PortfolioSnapshot,
  type Trade,
} from "@/lib/tradebook";

export default function TradebookPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCapital, setNewCapital] = useState("100000000");
  const [tab, setTab] = useState<"positions" | "history">("positions");

  // Form state
  const [form, setForm] = useState({
    ticker: "",
    side: "BUY" as "BUY" | "SELL",
    price: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    setPortfolio(getPortfolio());
  }, []);

  if (!portfolio) return <div className="min-h-screen bg-[#0B0B0A] pt-24 flex items-center justify-center text-[#B8AA96]/40">Loading...</div>;

  const stats = getPortfolioStats(portfolio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const updated = addTrade({
        ticker: form.ticker.toUpperCase(),
        side: form.side,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        date: form.date,
        notes: form.notes || undefined,
      });
      setPortfolio({ ...updated });
      setForm({ ticker: "", side: "BUY", price: "", quantity: "", date: new Date().toISOString().split("T")[0], notes: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Trade failed");
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this trade and recalculate?")) return;
    const updated = deleteTrade(id);
    setPortfolio({ ...updated });
  };

  const handleReset = () => {
    const cap = parseInt(newCapital) || 100_000_000;
    if (!confirm(`Reset portfolio with IDR ${cap.toLocaleString("id-ID")} capital? All trades will be deleted.`)) return;
    const updated = resetPortfolio(cap);
    setPortfolio({ ...updated });
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Trade Simulation</span>
            </div>
            <h1 className="font-['Cormorant_Garamond'] text-4xl text-[#F4EFE6] font-light">
              Trade<span className="text-gold-gradient font-medium">book</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettings(!showSettings)} className="px-5 py-2.5 border border-[#8A6F3D] text-[#B8AA96] text-xs tracking-[0.15em] uppercase hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all">
              Settings
            </button>
            <button onClick={() => { setShowForm(!showForm); setError(null); }} className="px-7 py-3 bg-[#C6A15B] text-[#0B0B0A] text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B76A] transition-all border border-[#C6A15B]">
              + New Trade
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="card-luxury p-8 mb-8">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#F4EFE6] mb-4 font-medium">Portfolio Settings</h3>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Initial Capital (IDR)</label>
                <input type="number" value={newCapital} onChange={(e) => setNewCapital(e.target.value)} className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm" />
              </div>
              <button onClick={handleReset} className="px-6 py-3 bg-red-500/10 text-red-400 text-xs tracking-[0.15em] uppercase border border-red-500/20 hover:bg-red-500/20 transition-all">
                Reset Portfolio
              </button>
            </div>
          </div>
        )}

        {/* New Trade Form */}
        {showForm && (
          <div className="card-luxury p-8 mb-8">
            <h3 className="font-['Cormorant_Garamond'] text-xl text-[#F4EFE6] mb-6 font-medium">Record Trade</h3>
            {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Ticker</label>
                <input type="text" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })} placeholder="ADRO" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm uppercase placeholder-[#B8AA96]/20" required />
              </div>
              <div>
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Side</label>
                <select value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value as "BUY" | "SELL" })} className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Price</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1250" step="1" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" required />
              </div>
              <div>
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Lots</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="10" step="1" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" required />
              </div>
              <div>
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm" required />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[#B8AA96]/60 text-xs tracking-wider uppercase mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-3 py-2.5 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full px-4 py-2.5 bg-[#C6A15B] text-[#0B0B0A] text-xs tracking-[0.15em] uppercase font-semibold hover:bg-[#D4B76A] transition-all border border-[#C6A15B]">
                  Execute
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Equity", value: `IDR ${(portfolio.equity / 1e6).toFixed(1)}M`, color: "text-[#F4EFE6]" },
            { label: "Cash", value: `IDR ${(portfolio.cash / 1e6).toFixed(1)}M`, color: "text-[#F4EFE6]" },
            { label: "Invested", value: `IDR ${(stats.totalInvested / 1e6).toFixed(1)}M`, color: "text-[#C6A15B]" },
            { label: "P&L", value: `${stats.pnl >= 0 ? "+" : ""}IDR ${(stats.pnl / 1e6).toFixed(1)}M`, color: stats.pnl >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Return", value: `${stats.pnlPct >= 0 ? "+" : ""}${stats.pnlPct.toFixed(2)}%`, color: stats.pnlPct >= 0 ? "text-emerald-400" : "text-red-400" },
            { label: "Trades", value: stats.totalTrades.toString(), color: "text-[#B8AA96]" },
          ].map((s) => (
            <div key={s.label} className="card-luxury p-5 text-center">
              <div className={`font-['Cormorant_Garamond'] text-2xl font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[#B8AA96]/40 text-xs tracking-[0.2em] uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cash vs Invested Bar */}
        <div className="card-luxury p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#B8AA96]/60 text-xs tracking-wider uppercase">Allocation</span>
            <span className="text-[#B8AA96]/40 text-xs">Cash: {stats.cashPct.toFixed(1)}% · Invested: {stats.investedPct.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-[#0B0B0A] border border-[#2C261E] overflow-hidden flex">
            <div className="h-full bg-[#C6A15B]/60 transition-all duration-500" style={{ width: `${stats.investedPct}%` }} />
            <div className="h-full bg-[#2C261E] flex-1" />
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 mb-6">
          {(["positions", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 text-xs tracking-[0.15em] uppercase font-medium transition-all ${tab === t ? "bg-[#C6A15B]/15 text-[#C6A15B] border border-[#C6A15B]/30" : "text-[#B8AA96]/40 border border-transparent hover:text-[#B8AA96]"}`}>
              {t === "positions" ? `Positions (${portfolio.positions.length})` : `History (${portfolio.trades.length})`}
            </button>
          ))}
        </div>

        {/* Positions Table */}
        {tab === "positions" && (
          <div className="card-luxury p-6">
            {portfolio.positions.length === 0 ? (
              <div className="text-center text-[#B8AA96]/30 py-12 text-sm">No open positions. Record a trade to start.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2C261E] text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                      <th className="pb-3 pr-4 font-medium">Ticker</th>
                      <th className="pb-3 pr-4 text-right font-medium">Avg Price</th>
                      <th className="pb-3 pr-4 text-right font-medium">Shares</th>
                      <th className="pb-3 pr-4 text-right font-medium">Lots</th>
                      <th className="pb-3 pr-4 text-right font-medium">Cost Basis</th>
                      <th className="pb-3 pr-4 text-right font-medium">Weight</th>
                      <th className="pb-3 pr-4 text-right font-medium">Trades</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.positions.map((pos) => {
                      const weight = stats.totalInvested > 0 ? (pos.totalCost / stats.totalInvested) * 100 : 0;
                      return (
                        <tr key={pos.ticker} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/[0.03] transition-colors">
                          <td className="py-3 pr-4 font-semibold text-[#C6A15B]">{pos.ticker}</td>
                          <td className="py-3 pr-4 text-right font-mono text-[#F4EFE6]">{pos.avgPrice.toLocaleString("id-ID")}</td>
                          <td className="py-3 pr-4 text-right text-[#B8AA96]">{pos.quantity.toLocaleString("id-ID")}</td>
                          <td className="py-3 pr-4 text-right text-[#B8AA96]">{(pos.quantity / 100).toLocaleString("id-ID")}</td>
                          <td className="py-3 pr-4 text-right text-[#F4EFE6] font-mono">IDR {(pos.totalCost / 1e6).toFixed(2)}M</td>
                          <td className="py-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-[#0B0B0A] border border-[#2C261E] overflow-hidden">
                                <div className="h-full bg-[#C6A15B]" style={{ width: `${weight}%` }} />
                              </div>
                              <span className="text-[#B8AA96]/60 text-xs">{weight.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-right text-[#B8AA96]/60">{pos.trades.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Trade History */}
        {tab === "history" && (
          <div className="card-luxury p-6">
            {portfolio.trades.length === 0 ? (
              <div className="text-center text-[#B8AA96]/30 py-12 text-sm">No trades recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2C261E] text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Ticker</th>
                      <th className="pb-3 pr-4 font-medium">Side</th>
                      <th className="pb-3 pr-4 text-right font-medium">Price</th>
                      <th className="pb-3 pr-4 text-right font-medium">Lots</th>
                      <th className="pb-3 pr-4 text-right font-medium">Total</th>
                      <th className="pb-3 pr-4 font-medium">Notes</th>
                      <th className="pb-3 pr-4 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.trades.map((t) => {
                      const total = t.price * t.quantity * 100;
                      return (
                        <tr key={t.id} className="border-b border-[#2C261E]/50 hover:bg-[#C6A15B]/[0.03] transition-colors">
                          <td className="py-3 pr-4 text-[#B8AA96] font-mono text-xs">{t.date}</td>
                          <td className="py-3 pr-4 font-semibold text-[#C6A15B]">{t.ticker}</td>
                          <td className="py-3 pr-4">
                            <span className={`px-2 py-0.5 text-xs font-semibold tracking-wider uppercase ${t.side === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                              {t.side}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-right font-mono text-[#F4EFE6]">{t.price.toLocaleString("id-ID")}</td>
                          <td className="py-3 pr-4 text-right text-[#B8AA96]">{t.quantity}</td>
                          <td className="py-3 pr-4 text-right font-mono text-[#F4EFE6]">IDR {(total / 1e6).toFixed(2)}M</td>
                          <td className="py-3 pr-4 text-[#B8AA96]/40 text-xs max-w-[150px] truncate">{t.notes || "—"}</td>
                          <td className="py-3 pr-4 text-right">
                            <button onClick={() => handleDelete(t.id)} className="text-[#B8AA96]/20 hover:text-red-400 transition-colors text-xs" title="Delete trade">
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
