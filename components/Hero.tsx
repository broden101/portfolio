"use client";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#DDBFA2]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #A39276 0%, transparent 70%)" }}/>

      <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#A39276]/10 to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#A39276]/10 to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="animate-fade-in opacity-0 mb-8">
          <span className="text-[#6E6151] text-xs tracking-[0.5em] uppercase font-medium">
            Investment Research & Market Playbook
          </span>
        </div>

        <h1 className="animate-fade-in animate-delay-1 opacity-0 font-serif text-6xl md:text-7xl lg:text-9xl font-bold tracking-tight text-[#111111] mb-8">
          Raga Playbook
        </h1>

        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#726556] text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-3">
          Investment Research, Market Strategy & Equity Analysis
        </p>

        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#A39276] text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed">
          A personal portfolio showcasing equity research, market insights, valuation work, and data-driven investment thinking.
        </p>

        <div className="animate-fade-in animate-delay-3 opacity-0 flex items-center justify-center gap-4 my-12">
          <div className="w-20 h-px bg-[#A39276]/30" />
          <div className="w-2 h-2 rotate-45 border border-[#A39276]/50" />
          <div className="w-20 h-px bg-[#A39276]/30" />
        </div>

        <div className="animate-fade-in animate-delay-4 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-5">
          <a href="#contact" className="px-10 py-4 bg-[#111111] text-white text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#000000] transition-all duration-300 shadow-md hover:shadow-lg">
            Contact Me
          </a>
          <a href="#about" className="px-10 py-4 border-2 border-[#111111]/30 text-[#111111] text-xs tracking-[0.25em] uppercase font-semibold hover:border-[#111111] hover:bg-[#A39276]/10 transition-all duration-300">
            Learn More
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#111111]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#111111] to-transparent" />
      </div>
    </section>
  );
}
