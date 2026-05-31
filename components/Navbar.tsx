"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { label: "Tentang", href: "#about" },
  { label: "Competencies", href: "#services" },
  { label: "Screener", href: "/screener" },
  { label: "Market Insight", href: "#market" },
  { label: "Kontak", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b border-[#A39276]/20 shadow-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#A39276]/50 flex items-center justify-center">
              <span className="text-[#A39276] font-serif text-sm font-semibold">R</span>
            </div>
            <span className="font-serif text-lg tracking-widest text-[#E7DFC8] uppercase font-semibold">
              Raga Playbook
            </span>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-[#A39276] text-xs tracking-[0.2em] uppercase font-medium hover:text-[#E7DFC8] transition-colors duration-300">
                {link.label}
              </a>
            ))}
          </div>

          <button className="md:hidden text-[#A39276] hover:text-[#E7DFC8]" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#111111] backdrop-blur-md border-b border-[#A39276]/20">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-[#726556] text-sm tracking-[0.15em] uppercase font-medium hover:text-[#6E6151] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
