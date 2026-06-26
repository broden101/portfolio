"use client";

import Link from "next/link";

const insights = [
  { date: "Juni 2026", tag: "IHSG", title: "4 Saham RI Keluar dari FTSE Russell", excerpt: "FTSE Russell resmi hapus DSSA, DAAZ, HILL, MLIA dari indeks global dalam rebalancing Juni 2026.", slug: "/articles/ftse-russell-juni-2026" },
  { date: "Mei 2026", tag: "Makro", title: "BI Rate: Siapa Diuntungkan?", excerpt: "Catatan dampak suku bunga ke bank, obligasi, properti, rupiah, dan appetite asing di IHSG.", slug: "" },
  { date: "April 2026", tag: "Sektor", title: "Bank Besar: Mahal Tapi Tetap Dikejar", excerpt: "Cek ROE, CASA, NIM, kualitas aset, dan kenapa saham bank bisa tetap premium saat market lelah.", slug: "" },
];

export default function MarketInsights() {
  return (
    <section id="market" className="relative py-32 bg-[#0B0B0A]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center justify-between mb-16 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-sm font-medium">Catatan terbaru</span>
            </div>
            <h2 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light">
              Bukan headline doang, <span className="text-gold-gradient font-medium">angka ikut masuk</span>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {insights.map((item, i) => {
            const card = (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[#C6A15B] text-xs tracking-wider">{item.date}</span>
                  <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
                  <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">{item.tag}</span>
                </div>
                <h3 className="font-heading text-lg text-[#F4EFE6] mb-3 font-medium group-hover:text-[#C6A15B] transition-colors duration-300">{item.title}</h3>
                <p className="text-[#B8AA96] text-sm leading-relaxed font-light flex-1">{item.excerpt}</p>
                <div className="mt-6 pt-6 border-t border-[#2C261E]">
                  <span className="text-[#C6A15B]/50 text-xs tracking-[0.2em] uppercase group-hover:text-[#C6A15B] transition-colors">
                    Baca →
                  </span>
                </div>
              </>
            );

            if (item.slug) {
              return (
                <Link key={i} href={item.slug} className="card-luxury p-8 group cursor-pointer flex flex-col">
                  {card}
                </Link>
              );
            }

            return (
              <div key={i} className="card-luxury p-8 group cursor-pointer flex flex-col">
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
