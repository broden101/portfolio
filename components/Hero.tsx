"use client";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0a] to-[#0a0a0a]" />

      {/* Subtle gold radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #c9a84c 0%, transparent 70%)",
        }}
      />

      {/* Vertical gold lines - decorative */}
      <div className="absolute left-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a84c]/5 to-transparent" />
      <div className="absolute right-[15%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c9a84c]/5 to-transparent" />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        {/* Pre-heading */}
        <div className="animate-fade-in opacity-0 mb-8">
          <span className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase font-light">
            Investment Research & Market Playbook
          </span>
        </div>

        {/* Name */}
        <h1 className="animate-fade-in animate-delay-1 opacity-0 font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-[#f5f0e8] mb-6">
          Raga Playbook
        </h1>

        {/* Tagline */}
        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#f5f0e8]/65 text-base md:text-lg font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-4">
          Investment Research, Market Strategy & Equity Analysis
        </p>

        <p className="animate-fade-in animate-delay-2 opacity-0 text-[#f5f0e8]/50 text-sm font-light tracking-wide max-w-xl mx-auto leading-relaxed">
          A personal portfolio showcasing equity research, market insights, valuation work, and data-driven investment thinking.
        </p>

        {/* Gold divider */}
        <div className="animate-fade-in animate-delay-3 opacity-0 flex items-center justify-center gap-4 my-10">
          <div className="w-16 h-px bg-[#c9a84c]/30" />
          <div className="w-1.5 h-1.5 rotate-45 border border-[#c9a84c]/50" />
          <div className="w-16 h-px bg-[#c9a84c]/30" />
        </div>

        {/* CTA */}
        <div className="animate-fade-in animate-delay-4 opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="px-8 py-3.5 bg-[#c9a84c] text-[#0a0a0a] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#dfc06e] transition-all duration-300"
          >
            Contact Me
          </a>
          <a
            href="#about"
            className="px-8 py-3.5 border border-[#c9a84c]/30 text-[#c9a84c] text-xs tracking-[0.2em] uppercase font-light hover:border-[#c9a84c]/60 transition-all duration-300"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#c9a84c]">
          Scroll
        </span>
        <div className="w-px h-8 bg-gradient-to-b from-[#c9a84c] to-transparent" />
      </div>
    </section>
  );
}
