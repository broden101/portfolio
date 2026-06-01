"use client";

import { useState, useEffect, useRef } from "react";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

const navLinks: NavLink[] = [
  { label: "Profile", href: "/#about" },
  { label: "Research", href: "/articles" },
  { label: "Market Playbook", href: "/screener" },
  { label: "Valuation Lab", href: "/calculator" },
  {
    label: "Tools",
    href: "#",
    children: [
      { label: "IDX Screener", href: "/screener" },
      { label: "Tradebook", href: "/tradebook" },
      { label: "Rights Issue Calculator", href: "/calculator" },
      { label: "Dividend Tracker", href: "/dividend" },
    ],
  },
  { label: "Contact", href: "/#contact" },
];

function DropdownLink({ link }: { link: NavLink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[#B8AA96] text-[11px] tracking-[0.18em] uppercase font-medium hover:text-[#C6A15B] transition-colors duration-300"
      >
        {link.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M2.5 4L5 6.5L7.5 4" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-52 bg-[#0B0B0A] border border-[#2C261E] shadow-xl shadow-black/50 py-2">
          {link.children?.map((child) => (
            <a
              key={child.href}
              href={child.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[#B8AA96] text-[11px] tracking-[0.15em] uppercase font-medium hover:text-[#C6A15B] hover:bg-[#C6A15B]/5 transition-colors"
            >
              {child.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0B0B0A]/95 backdrop-blur-md border-b border-[#2C261E]" : "bg-[#0B0B0A] border-b border-[#2C261E]/50"}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 border border-[#C6A15B]/50 flex items-center justify-center">
              <span className="text-[#C6A15B] font-heading text-xs font-semibold">R</span>
            </div>
            <span className="font-heading text-sm tracking-[0.25em] text-[#F4EFE6] uppercase font-semibold">
              Raga Playbook
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              link.children ? (
                <DropdownLink key={link.label} link={link} />
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[#B8AA96] text-[11px] tracking-[0.18em] uppercase font-medium hover:text-[#C6A15B] transition-colors duration-300"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="lg:hidden text-[#B8AA96] hover:text-[#C6A15B] p-1" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? <path d="M6 6l10 10M6 16L16 6" /> : <path d="M4 7h14M4 15h14" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-[#0B0B0A] border-b border-[#2C261E]">
          <div className="px-6 py-5 flex flex-col gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <div className="text-[#C6A15B] text-[11px] tracking-[0.18em] uppercase font-semibold py-2 mt-2">{link.label}</div>
                  <div className="pl-4 flex flex-col gap-1">
                    {link.children.map((child) => (
                      <a key={child.href} href={child.href} onClick={() => setMenuOpen(false)} className="text-[#B8AA96] text-xs tracking-[0.15em] uppercase font-medium hover:text-[#C6A15B] py-2 transition-colors">
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-[#B8AA96] text-xs tracking-[0.18em] uppercase font-medium hover:text-[#C6A15B] py-2 transition-colors">
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
