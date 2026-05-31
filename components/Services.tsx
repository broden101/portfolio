"use client";

const competencies = [
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M3 3v18h18M7 16l4-4 4 4 5-5" /></svg>),
    title: "Equity Research",
    desc: "Fundamental analysis, financial statement review, valuation, and investment thesis writing.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>),
    title: "Market Strategy",
    desc: "Monitoring IHSG, sector rotation, foreign flow, rates, currency, and commodity trends.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>),
    title: "Valuation & Modeling",
    desc: "Relative valuation, DCF assumptions, PBV-ROE framework, PER, EV/EBITDA comparison.",
  },
  {
    icon: (<svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>),
    title: "Data-Driven Screening",
    desc: "Stock screening based on financial ratios, price momentum, liquidity, and valuation metrics.",
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-32 bg-[#F3EFE6]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-px bg-[#9A7A3F]/40" />
          <span className="text-[#9A7A3F] text-xs tracking-[0.3em] uppercase font-semibold">Core Competencies</span>
        </div>

        <h2 className="font-serif text-4xl md:text-5xl text-[#111111] mb-16 max-w-xl font-bold">
          What I <span className="text-gold-gradient">Bring</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {competencies.map((s, i) => (
            <div key={i} className="card-luxury p-10 group cursor-default">
              <div className="text-[#9A7A3F]/40 group-hover:text-[#9A7A3F] transition-colors duration-500 mb-6">
                {s.icon}
              </div>
              <h3 className="font-serif text-xl text-[#111111] mb-3 font-semibold">{s.title}</h3>
              <p className="text-[#6F6252] text-sm leading-relaxed font-light">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
