"use client";

export default function About() {
  return (
    <section id="about" className="relative py-32 bg-[#0B0B0A]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-16 h-px bg-[#C6A15B]/30" />
          <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">About Me</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="relative">
            <div className="aspect-[3/4] bg-[#141210] border border-[#2C261E] overflow-hidden">
              <img
                src="/profile.jpg"
                alt="Polikarpus Raga"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#2C261E]/50 -z-10" />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] mb-8 leading-tight font-light">
              Aspiring Investment<br />
              <span className="text-gold-gradient font-medium">Professional</span>
            </h2>

            <div className="space-y-5 text-[#B8AA96] text-base leading-relaxed font-light">
              <p>I am an aspiring investment professional with strong interest in Indonesian capital markets, equity research, and financial analysis.</p>
              <p>Through Raga Playbook, I document my research process, investment thesis, and market observations to demonstrate analytical thinking, curiosity, and discipline in understanding businesses and market dynamics.</p>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-14 pt-10 border-t border-[#2C261E]">
              {[
                { number: "5+", label: "Years of Interest" },
                { number: "100+", label: "Research Notes" },
                { number: "IDX", label: "IDX Focus" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-heading text-3xl md:text-4xl text-[#C6A15B] mb-2 font-medium">{stat.number}</div>
                  <div className="text-[#B8AA96]/60 text-xs tracking-wider uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
