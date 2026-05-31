"use client";

const insights = [
  { date: "Mei 2026", tag: "IHSG", title: "Prospek IHSG Q2 2026", excerpt: "Analisis mendalam terhadap pergerakan indeks dan sektor-sektor potensial di kuartal kedua." },
  { date: "Mei 2026", tag: "Makro", title: "Dampak Kebijakan BI Rate", excerpt: "Bagaimana kebijakan suku bunga Bank Indonesia mempengaruhi arah investasi obligasi dan ekuitas." },
  { date: "April 2026", tag: "Sektor", title: "Sektor Perbankan: Peluang & Tantangan", excerpt: "Evaluasi kinerja emiten bank besar dan prospek pertumbuhan kredit di sisa tahun." },
];

export default function MarketInsights() {
  return (
    <section id="market" className="relative py-32 bg-[#E7DDCC]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center justify-between mb-16 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#9A7A3F]/40" />
              <span className="text-[#9A7A3F] text-xs tracking-[0.3em] uppercase font-semibold">Market Insight</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-[#111111] font-bold">
              Wawasan <span className="text-gold-gradient">Pasar</span>
            </h2>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {insights.map((item, i) => (
            <article key={i} className="card-luxury p-8 group cursor-pointer flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[#9A7A3F] text-xs tracking-wider font-semibold">{item.date}</span>
                <span className="w-1 h-1 rounded-full bg-[#9A7A3F]/40" />
                <span className="text-[#6F6252] text-xs tracking-wider uppercase">{item.tag}</span>
              </div>
              <h3 className="font-serif text-lg text-[#111111] mb-3 font-semibold group-hover:text-[#9A7A3F] transition-colors duration-300">{item.title}</h3>
              <p className="text-[#6F6252] text-sm leading-relaxed font-light flex-1">{item.excerpt}</p>
              <div className="mt-6 pt-6 border-t border-[#9A7A3F]/15">
                <span className="text-[#9A7A3F] text-xs tracking-[0.2em] uppercase font-medium group-hover:text-[#3A2C1A] transition-colors">
                  Baca Selengkapnya →
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
