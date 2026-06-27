"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer } from "@/components/DataState";

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
    tag: "Robotik / Supply Chain",
    title: "Siapa Pembuat Sendi Robot? Rantai Pasok Aktuator dari Jepang sampai China",
    excerpt: "Satu joint robot butuh komponen dari banyak negara. Ini cara baca emiten picks-and-shovels di balik hype humanoid robot.",
  },
  {
    slug: "ihsg-q1-2026",
    date: "Maret 2026",
    tag: "IHSG / Makro",
    title: "IHSG Q1 2026 Anjlok: Asing Kabur, Rupiah Lemah, Fiskal Diuji",
    excerpt: "IHSG turun -19,68% dari ATH. Asing keluar Rp6,71T dalam dua gelombang. Catatan penyebab, bukan drama headline.",
  },
  {
    slug: "right-issue-2026",
    date: "Mei 2026",
    tag: "Corporate Action / Rights Issue",
    title: "Jadwal Rights Issue 2026: Emiten Mana yang Benar Butuh Modal?",
    excerpt: "MPPA Rp5,94T, BNBR Rp4,76T, IRSX Rp3,7T. Cek rasio, harga pelaksanaan, dan potensi dilusi.",
  },
  {
    slug: "msci-value-mei-2026",
    date: "Mei 2026",
    tag: "MSCI / Rebalancing",
    title: "MSCI Value Mei 2026: BMRI Geser BBRI, BBCA Keluar",
    excerpt: "Konstituen dipangkas dari 10 ke 7 saham. BMRI jadi bobot terbesar, yield rata-rata 8,7%.",
  },
  {
    slug: "ftse-russell-juni-2026",
    date: "Juni 2026",
    tag: "IHSG",
    title: "FTSE Russell Juni 2026: DSSA, DAAZ, HILL, MLIA Keluar",
    excerpt: "Empat saham keluar dari indeks global. Catatan dampak flow pasif dan risiko tekanan teknikal.",
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
            <span className="text-[#C6A15B] text-sm font-medium">Catatan riset</span>
          </div>
          <h1 className="font-heading text-4xl text-[#F4EFE6] font-light">
            Arsip tulisan saham dan market
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
                <span className="text-[#C6A15B]/60 text-sm group-hover:text-[#C6A15B] transition-colors">Baca →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pt-8">
        <Disclaimer />
      </div>

      <Footer />
    </div>
  );
}
