import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer, SourceNote } from "@/components/DataState";

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link href="/articles" className="inline-flex items-center gap-2 text-[#B8AA96]/50 text-xs tracking-wider uppercase hover:text-[#C6A15B] transition-colors mb-10">
          ← Kembali ke Arsip Riset
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#C6A15B] text-xs tracking-wider">March 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">IHSG / Macro</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            IHSG Q1 2026 Anjlok: Asing Kabur, Rupiah Lemah, Fiskal Diuji
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            IHSG plunged into bearish territory with a nearly 20% correction from its all-time high. The combination of MSCI issues,
            credit rating pressure, and geopolitical escalation created a panic selling phase. How did the state budget,
            domestic politics, and the rupiah exchange rate respond to this pressure?
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#B8AA96] text-base leading-relaxed font-light">

          {/* ─── SECTION 1: DATA ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">IHSG in Numbers</h2>

          <p>
            Entering the first quarter of 2026, IHSG experienced significant selling pressure. In two major correction waves, the index lost nearly one-fifth of its value from its all-time high (ATH).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#C6A15B]/20 text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                  <th className="pb-3 pr-4 font-medium">Period</th>
                  <th className="pb-3 pr-4 font-medium">Foreign Net Sell</th>
                  <th className="pb-3 pr-4 font-medium">IHSG Level</th>
                  <th className="pb-3 font-medium">Correction (vs ATH)</th>
                </tr>
              </thead>
              <tbody className="text-[#F4EFE6]">
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold">End of January 2026</td>
                  <td className="py-4 pr-4 text-red-400">Rp 5.11 trillion</td>
                  <td className="py-4 pr-4">7.481</td>
                  <td className="py-4 text-red-400">-18.10%</td>
                </tr>
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold">End of February — Early March 2026</td>
                  <td className="py-4 pr-4 text-red-400">Rp 1.6 trillion</td>
                  <td className="py-4 pr-4">7.337</td>
                  <td className="py-4 text-red-400">-19.68%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card-luxury p-6 bg-[#0B0B0A] border border-red-400/20">
            <p className="text-[#F4EFE6] font-medium">Total foreign outflow across two waves: Rp 6.71 trillion</p>
            <p className="text-[#B8AA96]/60 text-sm mt-2">A -19.68% correction from ATH places IHSG on the edge of bear market territory (common definition: -20%).</p>
          </div>

          {/* ─── SECTION 2: DRIVERS ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Three Key Pressures</h2>

          <p>
            Recent infographics identify three major issues triggering <em>fear driven selling</em> in the Indonesian stock market. All three reinforce each other and have a systemic impact on investor risk perception.
          </p>

          <div className="space-y-6">
            <div className="card-luxury p-6 border-l-4 border-l-blue-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">1. MSCI Issue — Downgrade Risk to Frontier Market</h3>
              <p>
                Concerns over the <strong className="text-[#F4EFE6]">investability </strong>of Indonesia's capital market have intensified. An index change freeze and the potential downgrade from <em>emerging market</em> to <em>frontier market</em> status are key concerns for global investors. If this occurs, Indonesia would exit the MSCI Emerging Markets index — meaning <strong className="text-[#F4EFE6]">long-term capital outflows</strong> from global fund managers tracking that index.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                This risk directly affects the <strong className="text-[#C6A15B]">risk premium</strong> of the Indonesian market. The higher the probability of a downgrade, the greater the discount investors demand for holding Indonesian assets.
              </p>
            </div>

            <div className="card-luxury p-6 border-l-4 border-l-red-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">2. Credit Outlook — Moody's & Fitch</h3>
              <p>
                International rating agencies <strong className="text-[#F4EFE6]">Moody's </strong>and <strong className="text-[#F4EFE6]">Fitch </strong>have added to investor concerns over policy credibility and Indonesia's fiscal conditions. Although Indonesia's current rating remains <em>investment grade</em> (Baa2/BBB), a negative <em>outlook</em> could trigger a downgrade if fundamental improvements are not achieved.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                A negative rating outlook means government debt costs (<em>yields</em>) rise, which in turn pressures the state budget and reduces fiscal space.
              </p>
            </div>

            <div className="card-luxury p-6 border-l-4 border-l-yellow-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">3. Iran Conflict Escalation — Oil & Strait of Hormuz</h3>
              <p>
                Geopolitical tensions in the Middle East have escalated. The Iran conflict involving the Strait of Hormuz — a transit route for <strong className="text-[#F4EFE6]">20-25% of global oil supply</strong> — has driven global oil prices higher. Brent crude, which had stabilized below $70, has climbed back to the $82-85 range.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                For Indonesia, rising oil prices mean: (1) <strong className="text-red-400">ballooning energy subsidies</strong>, (2) <strong className="text-red-400">widening fiscal deficit</strong>, (3) <strong className="text-red-400">import inflation pressure</strong>, and (4) <strong className="text-red-400">rising current account deficit</strong>.
              </p>
            </div>
          </div>

          {/* ─── SECTION 3: FISCAL & BUDGET ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Impact on the State Budget and Fiscal Policy</h2>

          <p>
            The three pressures above directly impact the <strong className="text-[#F4EFE6]">2026 State Budget</strong>. The government budgeted a deficit of approximately <strong className="text-[#C6A15B]">2.5-2.8% of GDP</strong> in its initial macro assumptions. However, actual conditions indicate greater fiscal pressure than anticipated.
          </p>

          <div className="card-luxury p-6 space-y-4">
            <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Channels of Fiscal Pressure</h3>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Ballooning energy subsidies</strong> — Every $5/barrel increase in ICP (Indonesia Crude Price) adds an average subsidy burden of Rp 15-20 trillion per year. If oil prices remain above $80, subsidy realization could exceed the budget ceiling.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Slowing tax revenue</strong> — A decelerating economy, combined with rising oil prices and a weakening rupiah, pressures the corporate sector, resulting in income tax and VAT collections falling below target.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Rising debt costs</strong> — The 10-year government bond yield rising 50-100 bps throughout Q1 2026 makes the <em>yields</em> the government must pay for new debt issuance increasingly expensive.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Narrowing fiscal space</strong> — The government faces a <em>trilemma</em>: (a) maintaining subsidies to prevent a collapse in purchasing power, (b) controlling the deficit to stay within 3% of GDP, and (c) continuing to fund priority programs (Nusantara Capital, Free Nutritious Meals, infrastructure).
              </div>
            </div>
          </div>

          <p>
            Available policy options are limited: <strong className="text-[#C6A15B]">spending reallocation</strong>, <strong className="text-[#C6A15B]">government bond issuance </strong>amid high yields, or a <strong className="text-[#C6A15B]">combination of both</strong> — all of which risk adding pressure to banking liquidity and interest rates.
          </p>

          {/* ─── SECTION 4: POLITICS ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Political Factors — Uncertainty and Transition</h2>

          <p>
            Domestic political factors also contribute to investor risk perception. Following the 2024 elections and the leadership transition that produced a new coalition, the market continues to monitor policy consistency and the direction of long-term economic strategy.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-luxury p-6">
              <h3 className="font-heading text-base text-[#F4EFE6] font-medium mb-3">Direct Impact</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Public debate over the sustainability of flagship programs (Nusantara Capital, Free Nutritious Meals) creates fiscal uncertainty</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Institutional risk perception has increased in the eyes of foreign investors — reflected in the widening Indonesia CDS spread</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Concerns over unconventional policy interventions affect global institutional investors</span>
                </li>
              </ul>
            </div>

            <div className="card-luxury p-6">
              <h3 className="font-heading text-base text-[#F4EFE6] font-medium mb-3">Political Risks</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Reform momentum and <em>policy credibility</em> are under scrutiny from Moody's and Fitch</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Coalition fragmentation: friction between factions supporting populist vs. fiscally conservative policies</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Perception of <em>democratic backsliding</em> among foreign investors — triggering higher risk premiums</span>
                </li>
              </ul>
            </div>
          </div>

          <p>
            Nevertheless, Indonesia retains demographic advantages and natural resources that remain key considerations for foreign allocation. High political risk is already reflected in current prices (IHSG near the 7,300 level) — meaning <strong className="text-[#F4EFE6]">some of the risk is already priced in</strong>.
          </p>

          {/* ─── SECTION 5: RUPIAH ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Rupiah: Between External Pull and Domestic Fundamentals</h2>

          <p>
            The rupiah weakened throughout Q1 2026, breaking through the psychological level of <strong className="text-[#F4EFE6]">Rp 16,300-16,500 per USD</strong>. This depreciation intensified pressure in the stock market and created a negative <em>feedback loop</em> between the bond market and the equity market.
          </p>

          <div className="card-luxury p-6 space-y-4">
            <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Pressures on the Rupiah</h3>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Dollar Index (DXY) strengthening</strong> — Resilient US economic data and a <em>hawkish</em> Federal Reserve keeping interest rates higher for longer. DXY holding at 104-106.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Widening current account deficit (CAD)</strong> — Oil and gas imports rising alongside ICP increases, while commodity export prices (CPO, coal, nickel) have begun to correct. CAD is expected to widen to the 1.5-2% of GDP range.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Capital outflow</strong> — Foreign investors are simultaneously selling government bonds and equities, pressuring the balance of payments and Bank Indonesia's foreign exchange reserves.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Deteriorating Terms of Trade (ToT)</strong> — Imported finished goods prices are rising while export commodity prices are flattening. This compresses national income margins.
              </div>
            </div>
          </div>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B] bg-[#0B0B0A]">
            <p className="text-sm">
              <strong className="text-[#F4EFE6]">Bank Indonesia Policy Trilemma:</strong> Bank Indonesia faces a difficult choice between (1) raising interest rates to stabilize the rupiah — slowing the economy, (2) holding the BI Rate to support growth — with the rupiah under pressure, or (3) intervening in the forex market — depleting foreign exchange reserves.
            </p>
            <p className="text-sm mt-3 text-[#B8AA96]/60">
              To date, BI has chosen the path of <em>stability</em>: the BI Rate is held at 5.75% (<em>hold</em> since February 2025) with dual intervention in the spot and DNDF markets.
            </p>
          </div>

          {/* ─── SECTION 6: STRATEGIC IMPLICATIONS ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Investment Implications and Portfolio Strategy</h2>

          <p>
            The combination of pressures above places IHSG in a <strong className="text-[#C6A15B]">short-term bearish phase</strong> yet attractive from a <strong className="text-[#C6A15B]">long-term valuation perspective</strong>. At the 7,300 level, IHSG trades at a P/E ratio of approximately 13-14x (historical average 15-17x).
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-luxury p-6 border border-emerald-400/20">
              <h3 className="font-heading text-base text-emerald-400 font-medium mb-3">Sectors with Upside Potential</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Big cap banking</strong> (BBCA, BBRI, BMRI) — net interest margins tend to remain stable in a high-rate environment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Energy & oil/gas</strong> — benefiting from rising oil prices (ADRO, PTBA, MEDC)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Defensives</strong> — consumer staples, telecommunications (TLKM, ICBP, UNVR) — sectors with inelastic demand</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Commodity exporters</strong> — benefiting from rupiah weakness (unless commodity prices decline)</span>
                </li>
              </ul>
            </div>

            <div className="card-luxury p-6 border border-red-400/20">
              <h3 className="font-heading text-base text-red-400 font-medium mb-3">Sectors to Watch Closely</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Raw material importers</strong> — margins pressured by rupiah weakness (chemicals, consumer with high import content)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Property</strong> — sensitive to interest rates and declining purchasing power</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Technology</strong> — high valuations, sensitive to risk premiums and foreign outflows</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Small caps</strong> — low liquidity, hardest hit during risk-off sentiment</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── SECTION 7: CONCLUSION ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Conclusion</h2>

          <p>
            IHSG entered a <em>fear driven selling</em> phase driven by a combination of three major issues — MSCI risk, rating pressure, and oil-related geopolitics — compounded by tight fiscal conditions, unstable politics, and a weakening rupiah. Foreign outflows of Rp 6.71 trillion across two waves reflect a level of panic rarely seen.
          </p>

          <div className="card-luxury p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Short-term bearish</strong> — Levels 7,250 (MA50) and 7,000 (MA200) serve as key support. If 7,000 breaks, a drop to 6,800-6,500 becomes possible.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Medium-term attractive</strong> — IHSG valuations are already cheap (P/E 13-14x). Investors with a 1-2 year horizon can begin gradual accumulation in defensive big caps and banking.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Positive catalysts to monitor:</strong> Declining US inflation triggering a Fed pivot, domestic political stability, and current account improvement from downstream industrialization.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Downside risks:</strong> Iran conflict escalation (oil at $90+), downgrade of Indonesia's investment rating, or MSCI demotion to frontier market.
              </div>
            </div>
          </div>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B]">
            <p className="text-sm italic text-[#B8AA96]/80">
              Disclaimer: This article is for informational purposes and is the result of independent analysis. There is no affiliation with any parties mentioned. Always conduct your own research and consult with a financial professional before making investment decisions.
            </p>
          </div>
        </div>

        <div className="gold-line w-full mt-12 mb-8" />

        <Link href="/articles" className="inline-flex items-center gap-2 text-[#C6A15B] text-xs tracking-[0.2em] uppercase hover:text-[#D4B76A] transition-colors">
          ← Kembali ke Arsip Riset
        </Link>
      </article>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-10">
        <SourceNote source="IHSG, IDX, Kemenkeu, Bank Indonesia, media" note="Angka bisa berbeda antar sumber karena perbedaan periode dan metode." className="mb-4" />
        <Disclaimer />
      </div>

      <Footer />
    </div>
  );
}
