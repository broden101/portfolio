"use client";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#c9a84c]/8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#c9a84c]/40 flex items-center justify-center">
              <span className="text-[#c9a84c]/60 font-serif text-xs">P</span>
            </div>
            <span className="font-serif text-sm tracking-widest text-[#f5f0e8]/40 uppercase">
              Portfolio
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            {["LinkedIn", "Instagram", "Email"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-[#f5f0e8]/20 text-xs tracking-[0.15em] uppercase hover:text-[#c9a84c]/60 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-[#f5f0e8]/15 text-xs tracking-wider">
            © {new Date().getFullYear()} All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
