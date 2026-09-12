import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0a0b0b] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link href="/articles" className="inline-flex items-center gap-2 text-[#9ba3a6]/50 text-xs tracking-wider uppercase hover:text-[#3f9e74] transition-colors mb-10">
          ← Kembali ke Arsip Riset
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#3f9e74] text-xs tracking-wider">Juni 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#242929]" />
            <span className="text-[#9ba3a6]/50 text-xs tracking-wider uppercase">IHSG / Index Rebalancing</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#edf1f2] leading-tight font-light mb-6">
            4 Indonesian Stocks Removed from FTSE Russell Index June 2026
          </h1>

          <p className="text-[#9ba3a6] text-lg leading-relaxed font-light">
            FTSE Russell officially announced the removal of four Indonesian stocks from their global index in the June 2026 rebalancing. This decision impacts foreign fund flows and global institutional portfolio composition.
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#9ba3a6] text-base leading-relaxed font-light">

          <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4">List of Removed Stocks</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#3f9e74]/20 text-left text-xs tracking-[0.15em] uppercase text-[#9ba3a6]/60">
                  <th className="pb-3 pr-4 font-medium">Ticker</th>
                  <th className="pb-3 pr-4 font-medium">Issuer</th>
                  <th className="pb-3 font-medium">Reason for Removal</th>
                </tr>
              </thead>
              <tbody className="text-[#edf1f2]">
                <tr className="border-b border-[#242929]/50">
                  <td className="py-4 pr-4 font-semibold text-[#3f9e74]">DSSA</td>
                  <td className="py-4 pr-4">PT Dian Swastatika Sentosa Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">High Shareholding Concentration (HSC)</span>
                    <br />
                    <span className="text-[#9ba3a6]/50 text-xs">Highly concentrated share ownership. FTSE will remove using a &quot;zero price&quot; mechanism.</span>
                  </td>
                </tr>
                <tr className="border-b border-[#242929]/50">
                  <td className="py-4 pr-4 font-semibold text-[#3f9e74]">DAAZ</td>
                  <td className="py-4 pr-4">PT DAAZ Lifestyle Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Failed to meet minimum free float</span>
                    <br />
                    <span className="text-[#9ba3a6]/50 text-xs">Free float below FTSE Russell minimum requirements.</span>
                  </td>
                </tr>
                <tr className="border-b border-[#242929]/50">
                  <td className="py-4 pr-4 font-semibold text-[#3f9e74]">HILL</td>
                  <td className="py-4 pr-4">PT Hillcon Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Failed FISE screener criteria</span>
                    <br />
                    <span className="text-[#9ba3a6]/50 text-xs">Failed to meet the Foreign Inclusion Screening Eligible (FISE) criteria.</span>
                  </td>
                </tr>
                <tr className="border-b border-[#242929]/50">
                  <td className="py-4 pr-4 font-semibold text-[#3f9e74]">MLIA</td>
                  <td className="py-4 pr-4">PT Mulia Industrindo Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Failed FISE screener criteria</span>
                    <br />
                    <span className="text-[#9ba3a6]/50 text-xs">Failed to meet the Foreign Inclusion Screening Eligible (FISE) criteria.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4">Special Case: DSSA</h2>

          <p>
            Specifically for <strong className="text-[#3f9e74]">DSSA</strong> (Dian Swastatika Sentosa), FTSE will remove the stock using a <strong className="text-[#edf1f2]">&quot;zero price&quot;</strong> mechanism due to its high shareholding concentration. This means the stock will not be assigned any value in the index calculation, which could trigger sell-offs by fund managers replicating the FTSE index.
          </p>

          <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4">Market Impact</h2>

          <div className="card-luxury p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3f9e74] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#edf1f2]">Foreign fund outflows</strong> — Global fund managers tracking the FTSE index are required to sell positions in these four stocks, potentially creating short-term selling pressure.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3f9e74] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#edf1f2]">Psychological impact</strong> — Removal from a global index can affect retail and domestic institutional investor sentiment toward the affected stocks.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3f9e74] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#edf1f2]">Rebalancing window</strong> — The period between announcement and effective date (June 5, 2026) is a critical window for investors to adjust their positions.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3f9e74] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#edf1f2]">Not yet final</strong> — FTSE emphasizes that this announcement is not yet final and remains subject to changes until June 5, 2026.
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4">What Is FTSE Russell?</h2>

          <p>
            FTSE Russell is a global index provider owned by the London Stock Exchange Group (LSEG). Their indices are used by thousands of global fund managers as benchmarks for capital allocation. Inclusion in or removal from a FTSE index means automatic capital inflows or outflows into the respective stock.
          </p>

          <p>
            The June 2026 rebalancing is part of FTSE Russell&apos;s periodic quarterly review to ensure the index composition accurately represents market conditions.
          </p>

          <div className="card-luxury p-6 border-l-4 border-l-[#3f9e74]">
            <p className="text-sm italic text-[#9ba3a6]/80">
              Disclaimer: This article is for informational purposes only and does not constitute investment advice. Always conduct your own research before making investment decisions.
            </p>
          </div>
        </div>

        <div className="gold-line w-full mt-12 mb-8" />

        <Link href="/articles" className="inline-flex items-center gap-2 text-[#3f9e74] text-xs tracking-[0.2em] uppercase hover:text-[#D4B76A] transition-colors">
          ← Kembali ke Arsip Riset
        </Link>
      </article>
    </div>
  );
}
