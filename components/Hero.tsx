"use client";

import { useState, useEffect } from "react";

const tools = [
  {
    title: "Screener Saham",
    desc: "Cari emiten IDX yang masih masuk akal: valuasi, ROE, likuiditas, momentum, dan ruang risiko.",
    tags: ["PBV", "PER", "ROE", "Revenue Growth", "Liquidity"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-5" />
      </svg>
    ),
    href: "/screener",
    accent: "#C6A15B",
  },
  {
    title: "Lab Valuasi",
    desc: "Hitung harga wajar pakai DCF, PBV-ROE, PER, EV/EBITDA, dan skenario yang bisa diperdebatkan.",
    tags: ["DCF", "PBV", "PER", "EV/EBITDA", "Scenario Analysis"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    href: "/calculator",
    accent: "#C6A15B",
  },
  {
    title: "Tradebook",
    desc: "Catat alasan entry, exit, salah baca, dan evaluasi posisi. Bukan cuma screenshot cuan.",
    tags: ["Entry", "Exit", "PnL", "Replay", "Journal"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
    href: "/tradebook",
    accent: "#C6A15B",
  },
  {
    title: "Kalender Dividen",
    desc: "Pantau ex-date, yield, riwayat dividen, dan konsistensi payout emiten IDX.",
    tags: ["Ex-Date", "Yield", "Payout Ratio", "Calendar", "History"],
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    href: "/dividend",
    accent: "#C6A15B",
  },
];

const CYCLE_MS = 4000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setActive((a) => (a + 1) % tools.length);
          return 0;
        }
        return p + 2;
      });
    }, CYCLE_MS / 50);
    return () => clearInterval(interval);
  }, []);

  /* manual click resets cycle */
  const selectTool = (i: number) => {
    setActive(i);
    setProgress(0);
  };

  return (
    <section className="relative min-h-screen overflow-hidden hero-bg">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 min-h-screen flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-32">

          {/* ── LEFT: copywriting ── */}
          <div>
            <div className="mb-6">
              <span className="text-[#C6A15B] text-sm font-medium">
                Catatan pasar pribadi · IDX · valuasi · arus asing
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-[#F4EFE6] mb-6 leading-[1.05] font-light tracking-tight">
              Raga Playbook
            </h1>

            <p className="text-[#B8AA96] text-base md:text-lg font-light leading-relaxed max-w-lg mb-10">
              Tempat gue bongkar saham Indonesia: mana yang murah beneran, mana yang cuma murah di headline, dan level mana yang layak ditunggu.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/articles"
                className="px-6 py-3 bg-[#C6A15B] text-[#0B0B0A] text-sm font-semibold hover:bg-[#D4B76A] transition-all duration-300 border border-[#C6A15B]"
              >
                Baca Riset
              </a>
              <a
                href="/screener"
                className="px-6 py-3 bg-transparent text-[#F4EFE6] text-sm font-semibold border border-[#8A6F3D] hover:border-[#C6A15B] hover:text-[#C6A15B] transition-all duration-300"
              >
                Buka Tools
              </a>
            </div>
          </div>

          {/* ── RIGHT: animated tool card ── */}
          <div className="flex flex-col items-center lg:items-end">
            <div className="relative w-full max-w-md">
              {/* stacked shadow cards (depth effect) */}
              <div className="absolute -top-2 -right-2 w-full h-full border border-[#2C261E]/40" />
              <div className="absolute -top-1 -right-1 w-full h-full border border-[#2C261E]/60" />

              {/* main card */}
              <div
                key={active}
                className="relative bg-[#0E0E0C] border border-[#2C261E] p-8 md:p-10"
              >
                {/* icon + label row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-[#C6A15B]/30 flex items-center justify-center text-[#C6A15B]">
                      {tools[active].icon}
                    </div>
                    <span className="text-[#B8AA96]/50 text-xs">
                      Modul {active + 1} / {tools.length}
                    </span>
                  </div>
                  <a
                    href={tools[active].href}
                    className="text-[#C6A15B] text-xs font-medium hover:text-[#D4B76A] transition-colors"
                  >
                    Buka →
                  </a>
                </div>

                <h3 className="font-heading text-2xl md:text-3xl text-[#F4EFE6] mb-3 font-medium">
                  {tools[active].title}
                </h3>
                <p className="text-[#B8AA96] text-sm leading-relaxed font-light mb-6">
                  {tools[active].desc}
                </p>

                {/* tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {tools[active].tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 border border-[#2C261E] text-[#B8AA96]/70 text-[10px] tracking-[0.15em] uppercase font-medium hover:border-[#C6A15B]/40 hover:text-[#C6A15B] transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* progress bar */}
                <div className="w-full h-px bg-[#2C261E]">
                  <div
                    className="h-full bg-[#C6A15B]/60 transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* dot nav */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  {tools.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => selectTool(i)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === active
                          ? "bg-[#C6A15B] scale-110"
                          : "bg-[#2C261E] hover:bg-[#C6A15B]/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs text-[#B8AA96]">Geser</span>
        <div className="w-px h-8 bg-gradient-to-b from-[#B8AA96] to-transparent" />
      </div>
    </section>
  );
}
