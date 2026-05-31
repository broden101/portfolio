"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Competencies", href: "#services" },
  { label: "Screener", href: "/screener" },
  { label: "Tradebook", href: "/tradebook" },
  { label: "Calculator", href: "/calculator" },
  { label: "Market Insight", href: "#market" },
  { label: "Articles", href: "/articles" },
  { label: "Contact", href: "#contact" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0A] border-b border-[#2C261E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <a href="#" className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#C6A15B]/50 flex items-center justify-center">
              <span className="text-[#C6A15B] font-heading text-sm font-semibold">R</span>
            </div>
            <span className="font-heading text-lg tracking-widest text-[#F4EFE6] uppercase font-semibold">
              Raga Playbook
            </span>
          </a>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-[#B8AA96] text-xs tracking-[0.18em] uppercase font-medium hover:text-[#C6A15B] transition-colors duration-300">
                {link.label}
              </a>
            ))}
          </div>

          <button className="md:hidden text-[#B8AA96] hover:text-[#C6A15B]" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 8h16M4 16h16" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-[#0B0B0A] border-b border-[#2C261E]">
          <div className="px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-[#B8AA96] text-sm tracking-[0.18em] uppercase font-medium hover:text-[#C6A15B] transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
