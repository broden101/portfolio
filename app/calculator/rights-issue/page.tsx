"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer, SourceNote } from "@/components/DataState";

const EXAMPLES = [
  { label: "COCO", avgPrice: 167, lots: 20, cumPrice: 200, riPrice: 165, ratioOld: 1, ratioNew: 3 },
  { label: "BNBR", avgPrice: 86, lots: 50, cumPrice: 100, riPrice: 53, ratioOld: 27, ratioNew: 14 },
  { label: "PADI", avgPrice: 73, lots: 30, cumPrice: 80, riPrice: 50, ratioOld: 5, ratioNew: 1 },
];

export default function RightsIssuePage() {
  const [avgPrice, setAvgPrice] = useState("");
  const [lots, setLots] = useState("");
  const [cumPrice, setCumPrice] = useState("");
  const [riPrice, setRiPrice] = useState("");
  const [ratioOld, setRatioOld] = useState("");
  const [ratioNew, setRatioNew] = useState("");

  const calc = useMemo(() => {
    const avg = parseFloat(avgPrice) || 0;
    const lot = parseInt(lots) || 0;
    const cum = parseFloat(cumPrice) || 0;
    const ri = parseFloat(riPrice) || 0;
    const rOld = parseInt(ratioOld) || 0;
    const rNew = parseInt(ratioNew) || 0;

    if (!avg || !lot || !cum || !ri || !rOld || !rNew) return null;

    const sharesHeld = lot * 100;
    const newShares = Math.floor((sharesHeld / rOld) * rNew);
    const totalSharesAfter = sharesHeld + newShares;
    const totalCostExercise = newShares * ri;

    // Theoretical price after RI
    const theoPrice = ((sharesHeld * cum) + (newShares * ri)) / totalSharesAfter;

    // Portfolio value before RI (at cum price)
    const valueBefore = sharesHeld * cum;

    // Scenario 1: PARTICIPATE (exercise all rights)
    const valueAfterParticipate = totalSharesAfter * theoPrice;
    const costParticipate = totalCostExercise;
    const netValueParticipate = valueAfterParticipate - costParticipate;
    const pnlParticipate = netValueParticipate - (sharesHeld * avg);
    const pnlParticipatePct = ((netValueParticipate / (sharesHeld * avg + costParticipate)) - 1) * 100;

    // Scenario 2: NOT PARTICIPATE (sell rights / HMETD value)
    // HMETD value = cum price - theo price
    const hmetdValue = cum - theoPrice;
    const rightsProceeds = sharesHeld * hmetdValue;
    const valueAfterNotParticipate = sharesHeld * theoPrice + rightsProceeds;
    const pnlNotParticipate = valueAfterNotParticipate - (sharesHeld * avg);
    const pnlNotParticipatePct = ((valueAfterNotParticipate / (sharesHeld * avg)) - 1) * 100;

    // Average price after exercising
    const newAvgPrice = ((sharesHeld * avg) + totalCostExercise) / totalSharesAfter;

    // Break-even RI price
    const breakEven = theoPrice;

    return {
      sharesHeld,
      newShares,
      totalSharesAfter,
      totalCostExercise,
      theoPrice,
      valueBefore,
      valueAfterParticipate,
      costParticipate,
      netValueParticipate,
      pnlParticipate,
      pnlParticipatePct,
      hmetdValue,
      rightsProceeds,
      valueAfterNotParticipate,
      pnlNotParticipate,
      pnlNotParticipatePct,
      breakEven,
      newAvgPrice,
      ratio: `${rOld}:${rNew}`,
    };
  }, [avgPrice, lots, cumPrice, riPrice, ratioOld, ratioNew]);

  const fmt = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const fmtIDR = (n: number) => `Rp ${fmt(n)}`;

  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Calculator</span>
          </div>
          <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
            Rights Issue <span className="text-gold-gradient font-medium">& HMETD</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm mt-2 font-light">Hitung harga teoritis, potensi cuan, dan skenario partisipasi rights issue.</p>
        </div>

        {/* Suggested RI Stocks */}
        <div className="card-luxury p-5 mb-8">
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] font-medium mb-4">📋 Saham RI Aktif</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { ticker: "COCO", status: "Up Coming", effective: "6 Jul 2026", dana: "Rp266 M", rasio: "1:3", harga: "—" },
              { ticker: "BNBR", status: "Up Coming", effective: "26 Jun 2026", dana: "Rp4,76 T", rasio: "27:14", harga: "Rp53" },
              { ticker: "PADI", status: "Postponed", effective: "—", dana: "Rp113 M", rasio: "5:1", harga: "Rp50" },
              { ticker: "VKTR", status: "—", effective: "—", dana: "—", rasio: "—", harga: "—" },
            ].map((s) => (
              <button key={s.ticker} onClick={() => {
                const preset = EXAMPLES.find(e => e.label === s.ticker);
                if (preset) {
                  setAvgPrice(String(preset.avgPrice));
                  setLots(String(preset.lots));
                  setCumPrice(String(preset.cumPrice));
                  setRiPrice(String(preset.riPrice));
                  setRatioOld(String(preset.ratioOld));
                  setRatioNew(String(preset.ratioNew));
                }
              }} className="text-left border border-[#2C261E] hover:border-[#C6A15B]/40 p-3 transition-colors">
                <div className="text-[#C6A15B] font-bold text-sm tracking-wide">{s.ticker}</div>
                <div className="text-[10px] text-[#B8AA96]/40 uppercase mt-1">
                  {s.status === "Up Coming" ? <span className="text-emerald-400">✓ {s.status}</span> : <span className="text-amber-400">{s.status || "?"}</span>}
                </div>
                <div className="text-[10px] text-[#B8AA96]/30 mt-1.5 leading-relaxed">
                  {s.effective !== "—" && <div>Efektif: {s.effective}</div>}
                  <div>Rasio: {s.rasio} · Dana: {s.dana}</div>
                  {s.harga !== "—" && <div>Harga Tebus: {s.harga}</div>}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[#B8AA96]/30 text-[10px] mt-4">Klik saham untuk auto-fill kalkulator. Data: RagaPlaybook.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="card-luxury p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-[#F4EFE6] font-medium">Data Saham</h2>
                <div className="flex gap-2">
                  {EXAMPLES.map((ex) => (
                    <button key={ex.label} onClick={() => { setAvgPrice(String(ex.avgPrice)); setLots(String(ex.lots)); setCumPrice(String(ex.cumPrice)); setRiPrice(String(ex.riPrice)); setRatioOld(String(ex.ratioOld)); setRatioNew(String(ex.ratioNew)); }} className="border border-[rgba(214,173,90,0.28)] px-2.5 py-1.5 text-[10px] tracking-[0.1em] text-[#d6ad5a] hover:border-[#d6ad5a]">
                    {ex.label}
                  </button>
                ))}
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Harga Rata-rata (avg price)</label>
                  <input type="number" value={avgPrice} onChange={(e) => setAvgPrice(e.target.value)} placeholder="1500" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                </div>
                <div>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Jumlah Lot</label>
                  <input type="number" value={lots} onChange={(e) => setLots(e.target.value)} placeholder="10" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                </div>
                <div>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Harga Cum (Menjelang RI)</label>
                  <input type="number" value={cumPrice} onChange={(e) => setCumPrice(e.target.value)} placeholder="2000" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                </div>
                <div>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Harga Tebus (RI Price)</label>
                  <input type="number" value={riPrice} onChange={(e) => setRiPrice(e.target.value)} placeholder="1000" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                </div>
                <div>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Rasio Rights Issue (Lama : Baru)</label>
                  <div className="flex items-center gap-3">
                    <input type="number" value={ratioOld} onChange={(e) => setRatioOld(e.target.value)} placeholder="4" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                    <span className="text-[#C6A15B] font-heading text-2xl">:</span>
                    <input type="number" value={ratioNew} onChange={(e) => setRatioNew(e.target.value)} placeholder="1" className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Reference */}
            <div className="card-luxury p-6">
              <h3 className="text-xs tracking-[0.2em] uppercase text-[#C6A15B] mb-4 font-medium">Formula</h3>
              <div className="space-y-2 text-xs text-[#B8AA96]/60 font-mono">
                <p>Harga Teoritis = (Saham Lama × Harga Cum + Saham Baru × Harga Tebus) / Total Saham</p>
                <p>HMETD Value = Harga Cum - Harga Teoritis</p>
              </div>
              <SourceNote source="Rights issue formula" note="HMETD adalah hak memesan efek terlebih dahulu. Hasil bersifat teoretis dan belum termasuk biaya pasar." className="mt-3" />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {!calc ? (
              <div className="card-luxury p-12 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="text-4xl mb-4 opacity-20">📊</div>
                  <p className="text-[#B8AA96]/40 text-sm">Masukkan semua data untuk melihat hasil perhitungan</p>
                </div>
              </div>
            ) : (
              <>
                {/* Theoretical Price */}
                <div className="card-luxury p-8">
                  <h2 className="font-heading text-xl text-[#F4EFE6] mb-6 font-medium">Ringkasan Rights Issue</h2>

                  <div className="text-center py-6 mb-6 border border-[#2C261E] bg-[#0B0B0A]">
                    <div className="text-[#B8AA96]/50 text-xs tracking-[0.2em] uppercase mb-2">Harga Teoritis Pasca RI</div>
                    <div className="font-heading text-4xl text-[#C6A15B] font-medium">{fmtIDR(calc.theoPrice)}</div>
                    <div className="text-[#B8AA96]/40 text-xs mt-1">Rasio {calc.ratio}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Saham Dimiliki", value: fmt(calc.sharesHeld) },
                      { label: "Saham Baru", value: fmt(calc.newShares) },
                      { label: "Total Saham", value: fmt(calc.totalSharesAfter) },
                      { label: "Biaya Tebus", value: fmtIDR(calc.totalCostExercise) },
                      { label: "Harga Rata-rata Baru", value: fmtIDR(calc.newAvgPrice) },
                      { label: "Nilai Portofolio (Cum)", value: fmtIDR(calc.valueBefore) },
                      { label: "HMETD Value / Lembar", value: fmtIDR(calc.hmetdValue) },
                    ].map((item) => (
                      <div key={item.label} className="border-b border-[#2C261E]/50 pb-3">
                        <div className="text-[#B8AA96]/50 text-[10px] tracking-[0.15em] uppercase mb-1">{item.label}</div>
                        <div className="text-[#F4EFE6] text-sm font-medium">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scenario Comparison */}
                <div className="card-luxury p-8">
                  <h3 className="font-heading text-lg text-[#F4EFE6] mb-6 font-medium">Skenario Partisipasi</h3>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Participate */}
                    <div className="border border-[#2C261E] p-5">
                      <div className="text-xs tracking-[0.2em] uppercase text-emerald-400 mb-4 font-medium">✓ Ikut RI</div>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Modal Tebus</span><span className="text-[#F4EFE6] font-mono">{fmtIDR(calc.costParticipate)}</span></div>
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Total Modal</span><span className="text-[#F4EFE6] font-mono">{fmtIDR(calc.sharesHeld * parseFloat(avgPrice) + calc.costParticipate)}</span></div>
                        <div className="flex justify-between border-t border-[#2C261E]/50 pt-3"><span className="text-[#B8AA96]/50">P&L vs Avg</span><span className={calc.pnlParticipate >= 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>{calc.pnlParticipate >= 0 ? "+" : ""}{fmtIDR(calc.pnlParticipate)}</span></div>
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Return</span><span className={calc.pnlParticipatePct >= 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>{calc.pnlParticipatePct >= 0 ? "+" : ""}{calc.pnlParticipatePct.toFixed(2)}%</span></div>
                      </div>
                    </div>

                    {/* Not Participate */}
                    <div className="border border-[#2C261E] p-5">
                      <div className="text-xs tracking-[0.2em] uppercase text-red-400 mb-4 font-medium">✕ Tidak Ikut</div>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Jual HMETD</span><span className="text-[#F4EFE6] font-mono">{fmtIDR(calc.rightsProceeds)}</span></div>
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Nilai Saham</span><span className="text-[#F4EFE6] font-mono">{fmtIDR(calc.sharesHeld * calc.theoPrice)}</span></div>
                        <div className="flex justify-between border-t border-[#2C261E]/50 pt-3"><span className="text-[#B8AA96]/50">P&L vs Avg</span><span className={calc.pnlNotParticipate >= 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>{calc.pnlNotParticipate >= 0 ? "+" : ""}{fmtIDR(calc.pnlNotParticipate)}</span></div>
                        <div className="flex justify-between"><span className="text-[#B8AA96]/50">Return</span><span className={calc.pnlNotParticipatePct >= 0 ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>{calc.pnlNotParticipatePct >= 0 ? "+" : ""}{calc.pnlNotParticipatePct.toFixed(2)}%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pt-8">
        <Disclaimer />
      </div>

      <Footer />
    </div>
  );
}
