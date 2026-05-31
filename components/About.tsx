"use client";

export default function About() {
  return (
    <section id="about" className="relative py-32 bg-[#E7DFC8]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-16 h-px bg-[#A39276]/40" />
          <span className="text-[#6E6151] text-xs tracking-[0.3em] uppercase font-semibold">About Me</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="relative">
            <div className="aspect-[3/4] bg-[#DDBFA2] border border-[#111111]/10 shadow-md flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-[#A39276]/25 flex items-center justify-center">
                  <span className="text-[#A39276]/50 text-3xl font-serif font-bold">RP</span>
                </div>
                <span className="text-[#A39276] text-xs tracking-widest uppercase">Profile Photo</span>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#111111]/15 -z-10" />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-4xl md:text-5xl text-[#111111] mb-8 leading-tight font-bold">
Aspiring Investment<br />
          <span className="text-gold-gradient">Professional</span>
            </h2>

            <div className="space-y-5 text-[#726556] text-base leading-relaxed font-light">
              <p>I am an aspiring investment professional with strong interest in Indonesian capital markets, equity research, and financial analysis.</p>
              <p>Through Raga Playbook, I document my research process, investment thesis, and market observations to demonstrate analytical thinking, curiosity, and discipline in understanding businesses and market dynamics.</p>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-14 pt-10 border-t border-[#A39276]/20">
              {[
                { number: "5+", label: "Years of Interest" },
                { number: "100+", label: "Research Notes" },
                { number: "IDR", label: "IDX Focus" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-3xl md:text-4xl text-[#111111] mb-2 font-bold">{stat.number}</div>
                  <div className="text-[#A39276] text-xs tracking-wider uppercase font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
