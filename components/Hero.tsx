"use client";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg">
      <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2C261E] to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#2C261E] to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="hero-card rounded-none p-12 md:p-16 lg:p-20">
          <div className="animate-fade-in opacity-0 mb-8">
            <span className="text-[#C6A15B] text-xs tracking-[0.5em] uppercase font-medium">
              Private Market Notes & Investment Research
            </span>
          </div>

          <h1 className="animate-fade-in animate-delay-1 opacity-0 font-['Cormorant_Garamond'] text-6xl md:text-7xl lg:text-9xl font-light tracking-tight text-[#F4EFE6] mb-8">
            Raga Playbook
          </h1>

          <p className="animate-fade-in animate-delay-2 opacity-0 text-[#B8AA96] text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-3">
            Investment Research, Market Strategy & Equity Analysis
          </p>

          <p className="animate-fade-in animate-delay-2 opacity-0 text-[#B8AA96]/60 text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed">
            A personal portfolio showcasing equity research, market insights, valuation work, and data-driven investment thinking.
          </p>

          <div className="animate-fade-in animate-delay-3 opacity-0 flex items-center justify-center gap-4 my-12">
            <div className="w-20 h-px bg-[#2C261E]" />
            <div className="w-2 h-2 rotate-45 border border-[#C6A15B]/40" />
            <div className="w-20 h-px bg-[#2C261E]" />
          </div>

          <div className="animate-fade-in animate-delay-4 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-5">
            <a href="#contact" className="px-10 py-4 bg-[#C6A15B] text-[#0B0B0A] text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#D4B76A] transition-all duration-300 border border-[#C6A15B]">
              Contact Me
            </a>
            <a href="#about" className="px-10 py-4 bg-transparent text-[#F4EFE6] text-xs tracking-[0.25em] uppercase font-semibold border border-[#8A6F3D] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all duration-300">
              Learn More
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#B8AA96]">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#B8AA96] to-transparent" />
      </div>
    </section>
  );
}
