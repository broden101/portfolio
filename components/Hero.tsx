"use client";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#faf7f2]">
      {/* Subtle warm radial */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #b8922d 0%, transparent 70%)" }}
      />

      {/* Decorative lines */}
      <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#b8922d]/8 to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#b8922d]/8 to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="animate-fade-in opacity-0 mb-8">
          <span className="text-[#b8922d] text-xs tracking-[0.4em] uppercase font-light">
            Investment Research & Market Playbook
          </span>
        </div>

        <h1 className="animate-fade-in animate-delay-1 opacity-0 font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-[#1a1a1a] mb-6">
          Raga Playbook
        </h1>

        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#6b6b6b] text-base md:text-lg font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-4">
          Investment Research, Market Strategy & Equity Analysis
        </p>

        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#999999] text-sm font-light tracking-wide max-w-xl mx-auto leading-relaxed">
          A personal portfolio showcasing equity research, market insights, valuation work, and data-driven investment thinking.
        </p>

        <div className="animate-fade-in animate-delay-3 opacity-0 flex items-center justify-center gap-4 my-10">
          <div className="w-16 h-px bg-[#b8922d]/30" />
          <div className="w-1.5 h-1.5 rotate-45 border border-[#b8922d]/50" />
          <div className="w-16 h-px bg-[#b8922d]/30" />
        </div>

        <div className="animate-fade-in animate-delay-4 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="px-8 py-3.5 bg-[#b8922d] text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#a37e2c] transition-all duration-300"
          >
            Contact Me
          </a>
          <a
            href="#about"
            className="px-8 py-3.5 border border-[#b8922d]/40 text-[#b8922d] text-xs tracking-[0.2em] uppercase font-light hover:border-[#b8922d]/70 transition-all duration-300"
          >
            Learn More
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#b8922d]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#b8922d] to-transparent" />
      </div>
    </section>
  );
}
