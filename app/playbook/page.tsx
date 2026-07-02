"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Disclaimer } from "@/components/DataState";

const tools = [
  {
    title: "Dashboard IHSG",
    desc: "Makro IHSG, foreign flow, sector rotation — dashboard utama untuk baca arah pasar Indonesia.",
    tags: ["IHSG", "Makro", "Foreign Flow", "Sektor"],
    href: "/playbook/ihsg",
    ready: true,
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 4 5-5" />
      </svg>
    ),
  },
];

export default function PlaybookHubPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-px bg-[#C6A15B]/30" />
            <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Dashboard IHSG</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] font-light mb-3">
            Dashboard <span className="text-gold-gradient font-medium">IHSG</span>
          </h1>
          <p className="text-[#B8AA96]/60 text-sm font-light max-w-xl">
            Makro IHSG, foreign flow, sektor, dan market map — daily dashboard buat baca arah pasar Indonesia.
          </p>
        </div>

        {/* Tool Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <a
              key={tool.title}
              href={tool.href}
              className={`card-luxury p-8 group block transition-all duration-300 ${
                tool.ready ? "hover:border-[#C6A15B]/40 cursor-pointer" : "opacity-50 cursor-default pointer-events-none"
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`transition-colors duration-300 ${tool.ready ? "text-[#C6A15B]/40 group-hover:text-[#C6A15B]" : "text-[#B8AA96]/20"}`}>
                  {tool.icon}
                </div>
                {!tool.ready && (
                  <span className="text-[9px] tracking-[0.2em] uppercase text-[#B8AA96]/30 border border-[#2C261E] px-2 py-1">
                    Coming Soon
                  </span>
                )}
              </div>

              <h3 className="font-heading text-lg text-[#F4EFE6] mb-2 font-medium">{tool.title}</h3>
              <p className="text-[#B8AA96]/60 text-xs leading-relaxed font-light mb-5">{tool.desc}</p>

              <div className="flex flex-wrap gap-1.5">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 border border-[#2C261E] text-[#B8AA96]/40 text-[9px] tracking-[0.1em] uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-12 pt-8">
        <Disclaimer />
      </div>

      <Footer />
    </div>
  );
}
