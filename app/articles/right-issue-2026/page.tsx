import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title:
    "Rights Issue Schedule 2026: 9 IPO Issuers New & Upcoming — Raga Playbook",
  description:
    "Complete list of rights issues in 2026 — from MPPA Rp5.94T to COCO Rp266M. Some postponed by OJK, some already effective.",
};

const rightsIssueData = [
  {
    ticker: "MPPA",
    status: "Up Coming",
    effective: "June 12, 2026",
    dana: "Rp5.94 T",
    rasio: "-",
    harga: "-",
    color: "emerald",
    note: "Largest fund target among all issuers. Operates in the retail sector (Hypermart, Lion Super Indo).",
  },
  {
    ticker: "BNBR",
    status: "Up Coming",
    effective: "June 26, 2026",
    dana: "Rp4.76 T",
    rasio: "27:14",
    harga: "Rp53",
    color: "emerald",
    note: "Bakrie & Brothers — national conglomerate. Large funds for restructuring and expansion.",
  },
  {
    ticker: "CBRE",
    status: "Postponed",
    effective: "Awaiting Issuer",
    dana: "Rp1.91 T",
    rasio: "90:253",
    harga: "Rp100–150",
    color: "amber",
    note: "Massive funds nearly Rp2T, but still held up at OJK.",
  },
  {
    ticker: "IRSX",
    status: "Postponed",
    effective: "Awaiting Issuer",
    dana: "Rp3.7 T",
    rasio: "1:2",
    harga: "Rp300",
    color: "amber",
    note: "Ratio 1:2 — buy 1 old share to get 2 new shares. One of the postponed issues.",
  },
  {
    ticker: "ELPI",
    status: "Postponed",
    effective: "Awaiting Issuer",
    dana: "Rp739 M",
    rasio: "200:57",
    harga: "Rp350",
    color: "amber",
    note: "Unique ratio 200:57 — for every 200 old shares, entitled to 57 new shares.",
  },
  {
    ticker: "PADI",
    status: "Postponed",
    effective: "Awaiting Issuer",
    dana: "Rp113 M",
    rasio: "5:1",
    harga: "Rp50",
    color: "amber",
    note: "Aggressive ratio 5:1, low exercise price of Rp50/share.",
  },
  {
    ticker: "RMKO",
    status: "Up Coming",
    effective: "June 15, 2026",
    dana: "Rp159 M",
    rasio: "175:64",
    harga: "Rp350",
    color: "emerald",
    note: "Relatively small fund, exercise price Rp350.",
  },
  {
    ticker: "COCO",
    status: "Up Coming",
    effective: "July 6, 2026",
    dana: "Rp266 M",
    rasio: "1:3",
    harga: "-",
    color: "emerald",
    note: "Ratio 1:3 — buy 1 old share, entitled to 3 new shares. Fund Rp266M.",
  },
  {
    ticker: "PYFA",
    status: "Up Coming",
    effective: "July 7, 2026",
    dana: "-",
    rasio: "-",
    harga: "-",
    color: "emerald",
    note: "Pyridam Farma — pharmaceutical sector. Price and ratio details not yet announced.",
  },
  {
    ticker: "JGLE",
    status: "Awaiting Market Stability",
    effective: "-",
    dana: "-",
    rasio: "-",
    harga: "-",
    color: "sky",
    note: "Still waiting for market conditions to stabilize before continuing the process.",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Up Coming":
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Postponed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Awaiting Market Stability":
      "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span
      className={`inline-block px-3 py-1 text-xs tracking-wider uppercase border rounded-full ${
        styles[status] || "bg-[#1a1a1a] text-[#B8AA96] border-[#2C261E]"
      }`}
    >
      {status}
    </span>
  );
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-[#B8AA96]/50 text-xs tracking-wider uppercase hover:text-[#C6A15B] transition-colors mb-10"
        >
          ← Back to Articles
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#C6A15B] text-xs tracking-wider">
              May 2026
            </span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
              Corporate Action / Rights Issue
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            Rights Issue Schedule 2026: 9 Issuers with Tens of
            Trillions in Total Funds
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            From Rp5.94T (MPPA) down to Rp113M (PADI) — some have already
            received an effective date, while others are still awaiting the
            issuer. Here is the complete list of rights issues you need to
            monitor in the second half of 2026.
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-10 text-[#B8AA96] text-base leading-relaxed font-light">
          {/* Overview */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Overview
            </h2>
            <p>
              At least <strong className="text-[#F4EFE6]">9 issuers</strong>{" "}
              are currently in the process of a rights issue in 2026 — with
              total targeted funds reaching tens of trillions of rupiah. Five
              of them already have an effective schedule (Up Coming), while
              four others are still awaiting OJK approval or market
              stabilization.
            </p>
            <p className="mt-3">
              The amounts vary — from hundreds of billions to nearly Rp6
              trillion. Ratios also range widely, with aggressive ones like
              1:3 and 5:1, and moderate ones like 27:14.
            </p>
          </div>

          {/* Upcoming */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              📅 Already Have an Effective Schedule
            </h2>

            <div className="space-y-4">
              {rightsIssueData
                .filter((r) => r.status === "Up Coming")
                .map((item) => (
                  <div
                    key={item.ticker}
                    className="card-luxury p-6 border-l-2 border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                          {item.ticker}
                        </span>
                        <span className="text-[#B8AA96]/50 text-xs ml-3">
                          Effective: {item.effective}
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Funds
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.dana}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Ratio
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.rasio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Exercise Price
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.harga}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#B8AA96]/60 mt-2">
                      {item.note}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Pending OJK */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              ⏳ Still Awaiting Issuer
            </h2>

            <div className="space-y-4">
              {rightsIssueData
                .filter((r) => r.status === "Postponed")
                .map((item) => (
                  <div
                    key={item.ticker}
                    className="card-luxury p-6 border-l-2 border-amber-500/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                          {item.ticker}
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Funds
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.dana}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Ratio
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.rasio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Exercise Price
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.harga}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#B8AA96]/60 mt-2">
                      {item.note}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Waiting market */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              🌊 Awaiting Market Stability
            </h2>

            {rightsIssueData
              .filter((r) => r.status === "Awaiting Market Stability")
              .map((item) => (
                <div
                  key={item.ticker}
                  className="card-luxury p-6 border-l-2 border-sky-500/30"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                      {item.ticker}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-[#B8AA96]/70">{item.note}</p>
                </div>
              ))}
          </div>

          {/* What investor should know */}
          <div className="card-luxury p-8 border-l-2 border-[#C6A15B]/40">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-4">
              What Should Investors Know?
            </h2>
            <div className="space-y-4 text-sm">
              <p>
                <strong className="text-[#F4EFE6]">1. Rights issues aren't
                always negative.</strong>{" "}
                Although potentially dilutive, a rights issue can be a signal
                that the company needs funds for expansion or restructuring.
                What matters is the intended use of the funds.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">2. Check the exercise price.</strong>{" "}
                If the exercise price is well below market price, the HMETD
                can be sold. Don't miss the HMETD trading window — usually
                only a few days.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">3. Monitor the OJK status.</strong>{" "}
                Issuers that are still "Postponed" mean there is no certainty
                on when they will become effective. Don't enter new positions
                just because of rights issue rumors.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">4. Calculate scenarios.</strong>{" "}
                Use a rights issue calculator to compare scenarios of
                participating vs. not participating — and determine the best
                strategy for your portfolio.
              </p>
            </div>
          </div>

          {/* Calculator CTA */}
          <div className="card-luxury p-6 text-center bg-[#C6A15B]/5 border border-[#C6A15B]/10">
            <p className="text-[#F4EFE6] text-sm mb-3">
              💡 Use our rights issue calculator to calculate scenarios of
              participating vs. not participating
            </p>
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-[#C6A15B]/10 text-[#C6A15B] text-sm tracking-wider uppercase hover:bg-[#C6A15B]/20 transition-colors rounded"
            >
              Open Calculator →
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="pt-6 border-t border-[#2C261E]">
            <p className="text-xs text-[#B8AA96]/30">
              Disclaimer: This article is for informational purposes only and
              does not constitute investment advice. Data is sourced from
              various public sources and may change at any time. Investment
              decisions are solely the reader's responsibility. Always conduct
              your own research and consult with your financial advisor.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
