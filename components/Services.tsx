"use client";

const services = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
        <path d="M3 3v18h18M7 16l4-4 4 4 5-5" />
      </svg>
    ),
    title: "Riset Ekuitas",
    desc: "Analisis mendalam terhadap emiten-listed di BEI, mencakup fundamental, valuasi, dan prospek pertumbuhan.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Portfolio Advisory",
    desc: "Rekomensi alokasi ases yang disesuaikan dengan profil risiko, horizon investasi, dan tujuan keuangan klien.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" />
      </svg>
    ),
    title: "Market Commentary",
    desc: "Update harian dan mingguan mengenai pergerakan pasar, sentimen, dan peluang investasi terkini.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Institutional Sales",
    desc: "Layanan dedicated untuk klien institusi, koperasi, dan dana pensiun dengan fokus pada eksekusi dan riset.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-32 bg-[#faf7f2]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-[#b8922d]/40" />
          <span className="text-[#b8922d] text-xs tracking-[0.3em] uppercase">Layanan</span>
        </div>

        <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-16 max-w-xl">
          Solusi Investasi yang <span className="text-gold-gradient">Komprehensif</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {services.map((s, i) => (
            <div key={i} className="card-luxury p-8 md:p-10 group cursor-default">
              <div className="text-[#b8922d]/40 group-hover:text-[#b8922d] transition-colors duration-500 mb-6">
                {s.icon}
              </div>
              <h3 className="font-serif text-xl text-[#1a1a1a] mb-3 tracking-wide">{s.title}</h3>
              <p className="text-[#777777] text-sm leading-relaxed font-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
