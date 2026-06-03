"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Article {
  slug: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
}

const articles: Article[] = [
  {
    slug: "robot-actuator-supply-chain",
    date: "Juni 2026",
    tag: "Robotics / Supply Chain",
    title: "Who Builds the Actuator? Inside the Global Supply Chain of Every Robot Joint",
    excerpt: "A single robot joint depends on specialized components from at least five countries. No single nation can produce a complete actuator alone. The picks-and-shovels play for the humanoid robot revolution.",
  },
  {
    slug: "ihsg-q1-2026",
    date: "Maret 2026",
    tag: "IHSG / Makro",
    title: "IHSG Q1 2026: Fear Driven Selling, APBN Tertekan, dan Rupiah di Persimpangan",
    excerpt: "IHSG terperosok -19,68% dari ATH. Outflow Rp 6,71T dalam dua gelombang. Kombinasi isu MSCI, rating kredit, geopolitik Iran, kondisi APBN, dan pelemahan rupiah menciptakan zona bearish.",
  },
  {
    slug: "right-issue-2026",
    date: "Mei 2026",
    tag: "Corporate Action / Right Issue",
    title: "Jadwal Right Issue 2026: 9 Emiten dengan Total Dana Puluhan Triliun",
    excerpt: "MPPA Rp5,94T, BNBR Rp4,76T, IRSX Rp3,7T — ada yang sudah dapat jadwal efektif, ada yang masih menunggu emiten. Daftar lengkap beserta rasio dan harga tebus.",
  },
  {
    slug: "msci-value-mei-2026",
    date: "Mei 2026",
    tag: "MSCI / Index Rebalancing",
    title: "MSCI Value Mei 2026: Lebih Ramping, BMRI Jadi Bobot Terbesar Gantikan BBRI",
    excerpt: "MSCI memangkas konstituen dari 10 menjadi 7 saham. BBCA, CPIN, dan TPIA keluar. BMRI menggantikan BBRI sebagai bobot terbesar. Dividend yield rata-rata 8,7%.",
  },
  {
    slug: "ftse-russell-juni-2026",
    date: "Juni 2026",
    tag: "IHSG",
    title: "4 Saham Indonesia Keluar dari Indeks FTSE Russell Juni 2026",
    excerpt: "FTSE Russell resmi mengumumkan penghapusan DSSA, DAAZ, HILL, dan MLIA dari indeks global dalam rebalancing Juni 2026.",
  },
];

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Research & Analysis</span>
          </div>
          <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
            Market <span className="text-gold-gradient font-medium">Articles</span>
          </h1>
        </div>

        <div className="space-y-6">
          {articles.map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="block card-luxury p-8 group cursor-pointer">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#C6A15B] text-xs tracking-wider">{a.date}</span>
                <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
                <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">{a.tag}</span>
              </div>
              <h2 className="font-heading text-2xl text-[#F4EFE6] mb-3 font-medium group-hover:text-[#C6A15B] transition-colors">{a.title}</h2>
              <p className="text-[#B8AA96] text-sm leading-relaxed font-light">{a.excerpt}</p>
              <div className="mt-4 pt-4 border-t border-[#2C261E]">
                <span className="text-[#C6A15B]/50 text-xs tracking-[0.2em] uppercase group-hover:text-[#C6A15B] transition-colors">Read Article →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
