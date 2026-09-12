import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MSCI Value May 2026: Leaner, BMRI Becomes Largest Weight — Raga Playbook",
  description:
    "MSCI Value rebalancing May 2026 reduces constituents from 10 to 7 stocks. BBCA, CPIN, and TPIA removed. BMRI replaces BBRI as largest weight.",
};

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0a0b0b] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-[#9ba3a6]/50 text-xs tracking-wider uppercase hover:text-[#3f9e74] transition-colors mb-10"
        >
          ← Kembali ke Arsip Riset
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#3f9e74] text-xs tracking-wider">
              May 2026
            </span>
            <span className="w-1 h-1 rounded-full bg-[#242929]" />
            <span className="text-[#9ba3a6]/50 text-xs tracking-wider uppercase">
              MSCI / Index Rebalancing
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#edf1f2] leading-tight font-light mb-6">
            MSCI Value May 2026: Leaner, BMRI Becomes Largest Weight
            Replacing BBRI
          </h1>

          <p className="text-[#9ba3a6] text-lg leading-relaxed font-light">
            MSCI rebalanced its Value index for the May 2026 period —
            reducing the number of constituents from 10 to 7 stocks. BBCA, CPIN,
            and TPIA removed. BMRI rises to the throne as the largest weight. What does it mean
            for investors?
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#9ba3a6] text-base leading-relaxed font-light">
          {/* What happened */}
          <div>
            <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4 mb-4">
              What Changed?
            </h2>
            <p>
              Morgan Stanley Capital International (MSCI) officially rebalanced
              the <strong className="text-[#edf1f2]">MSCI Value</strong> index for the
              May 2026 period. Based on Syailendra Research and MSCI data
              (20/5), the changes take effect from{" "}
              <strong className="text-[#edf1f2]">June 2, 2026</strong>.
            </p>
            <p className="mt-3">
              Total constituents trimmed from 10 stocks to just 7 stocks —
              a signal that the index is becoming increasingly concentrated on big
              cap stocks with cheap valuation profiles and stable fundamentals.
            </p>
          </div>

          {/* Changes table */}
          <div>
            <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4 mb-4">
              Who's Out, Who's In?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* OUT */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-400 text-xs tracking-[0.2em] uppercase font-medium">
                    Removed from MSCI Value
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#3f9e74] font-bold text-sm w-14">
                      BBCA
                    </span>
                    <span className="text-[#edf1f2] text-sm">
                      Bank Central Asia
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#3f9e74] font-bold text-sm w-14">
                      CPIN
                    </span>
                    <span className="text-[#edf1f2] text-sm">
                      Charoen Pokphand Indonesia
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#3f9e74] font-bold text-sm w-14">
                      TPIA
                    </span>
                    <span className="text-[#edf1f2] text-sm">
                      Chandra Asri Pacific
                    </span>
                  </div>
                </div>
              </div>

              {/* IN */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-xs tracking-[0.2em] uppercase font-medium">
                    Added to MSCI Value
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#3f9e74] font-bold text-sm w-14">
                    BRPT
                  </span>
                  <span className="text-[#edf1f2] text-sm">
                    Barito Pacific — returns to the constituents
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weight shift */}
          <div>
            <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4 mb-4">
              Weight Shift: BMRI Takes the New Throne
            </h2>
            <p>
              The most striking change:{" "}
              <strong className="text-[#3f9e74]">BMRI</strong> is now the
              constituent with the largest weight in MSCI Value — at{" "}
              <strong className="text-[#edf1f2]">27.3%</strong>, displacing BBRI
              which drops to 16.4%.
            </p>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#3f9e74]/20 text-left text-xs tracking-[0.15em] uppercase text-[#9ba3a6]/60">
                    <th className="pb-3 pr-4 font-medium">Ticker</th>
                    <th className="pb-3 pr-4 font-medium">New Weight</th>
                    <th className="pb-3 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="text-[#edf1f2]">
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      BMRI
                    </td>
                    <td className="py-3 pr-4">27.3%</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+9.7%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      TLKM
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+6.9%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      ASII
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+3.3%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      BBNI
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+2.3%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      BBRI
                    </td>
                    <td className="py-3 pr-4">16.4%</td>
                    <td className="py-3">
                      <span className="text-red-400">−7.4%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#242929]/50">
                    <td className="py-3 pr-4 font-semibold text-[#3f9e74]">
                      UNTR
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-red-400">−0.8%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-[#9ba3a6]/70">
              Source: Syailendra Research, MSCI data as of May 20, 2026.
            </p>
          </div>

          {/* Dividend angle */}
          <div className="card-luxury p-8 border-l-2 border-[#3f9e74]/40">
            <h2 className="font-heading text-xl text-[#edf1f2] font-medium mb-4">
              Dividend Play: Average Yield of 8.7%
            </h2>
            <p>
              An eye-catching figure — six out of seven MSCI Value constituents
              have consistently distributed dividends over the{" "}
              <strong className="text-[#edf1f2]">past 18 years</strong>.
              Based on the latest dividends, the average dividend yield of these
              six issuers reaches approximately{" "}
              <strong className="text-[#3f9e74]">8.7%</strong>.
            </p>
            <p className="mt-3">
              Amid a global trend of declining interest rates, a dividend profile
              like this becomes a magnet for income-focused investors.
            </p>
          </div>

          {/* Valuation angle */}
          <div>
            <h2 className="font-heading text-2xl text-[#edf1f2] font-medium pt-4 mb-4">
              Cheap? Four Out of Seven at 5-Year Low Levels
            </h2>
            <p>
              Syailendra Research also highlights the fact that four out of seven
              MSCI Value constituents are currently at their lowest valuation
              levels in the past five years. Meaning — these big cap stocks
              are trading at a relative discount amid domestic market
              volatility.
            </p>
            <p className="mt-3">
              Value trap or opportunity? That depends on each issuer's
              fundamentals and the macro outlook ahead.
            </p>
          </div>

          {/* Conclusion */}
          <div className="card-luxury p-8 border-l-2 border-[#3f9e74]/40">
            <h2 className="font-heading text-xl text-[#edf1f2] font-medium mb-4">
              Takeaway
            </h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong className="text-[#edf1f2]">1.</strong> MSCI Value is increasingly
                concentrated — banking dominates, BMRI becomes the weight king.
              </p>
              <p>
                <strong className="text-[#edf1f2]">2.</strong> BBCA exits the
                value index — but that doesn't mean its fundamentals are poor. BBCA's
                price rose so it is no longer "cheap" on a relative basis.
              </p>
              <p>
                <strong className="text-[#edf1f2]">3.</strong> Outflows from
                passive funds tracking MSCI Value may occur in BBCA,
                CPIN, and TPIA. The rebalancing window could be volatile.
              </p>
              <p>
                <strong className="text-[#edf1f2]">4.</strong> Average dividend yield
                of 8.7% + valuations at 5-year low levels = still
                attractive for patient income investors.
              </p>
            </div>
          </div>

          {/* Source */}
          <div className="pt-6 border-t border-[#242929]">
            <p className="text-xs text-[#9ba3a6]/50">
              <strong className="text-[#9ba3a6]/70">Source:</strong>{" "}
              <a
                href="https://www.bareksa.com/berita/saham/2026-05-20/msci-value-mei-2026-lebih-ramping-bmri-jadi-bobot-terbesar-gantikan-bbri"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3f9e74]/60 hover:text-[#3f9e74] underline transition-colors"
              >
                Bareksa — MSCI Value May 2026: Leaner, BMRI Becomes Largest
                Weight Replacing BBRI
              </a>
              . Research: Syailendra Research, MSCI data as of May 20, 2026.
            </p>
            <p className="text-xs text-[#9ba3a6]/30 mt-3">
              Disclaimer: This article is for informational purposes and does not constitute
              investment advice. Investment decisions are entirely the
              responsibility of the reader. Always conduct independent research before
              investing.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
