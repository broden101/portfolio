"use client";

const competencies = [
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M3 3v18h18M7 16l4-4 4 4 5-5" /></svg>),
    title: "Riset Emiten",
    desc: "Bongkar laporan keuangan, bisnis utama, valuasi, dan red flag emiten IDX sebelum masuk watchlist.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>),
    title: "Peta Market",
    desc: "Pantau IHSG, BI Rate, USD/IDR, komoditas, foreign flow, dan rotasi sektor buat baca arah risiko.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>),
    title: "Portofolio Nasabah",
    desc: "Sesuaikan saham, obligasi, reksa dana, dan sukuk dengan horizon, tujuan, dan toleransi drawdown.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>),
    title: "Screener Data",
    desc: "Pakai Excel, Python, dan data market buat shortlist saham. Narasi belakangan, angka dulu.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-32 bg-[#0B0B0A]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-px bg-[#C6A15B]/30" />
          <span className="text-[#C6A15B] text-sm font-medium">Yang dikerjakan</span>
        </div>

        <h2 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] mb-16 max-w-xl font-light">
          Dari data mentah ke <span className="text-gold-gradient font-medium">keputusan</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {competencies.map((s, i) => (
            <div key={i} className="card-luxury p-10 group cursor-default">
              <div className="text-[#C6A15B]/20 group-hover:text-[#C6A15B] transition-colors duration-300 mb-6">
                {s.icon}
              </div>
              <h3 className="font-heading text-xl text-[#F4EFE6] mb-3 font-medium">{s.title}</h3>
              <p className="text-[#B8AA96] text-sm leading-relaxed font-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
