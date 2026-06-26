"use client";

const links = {
  JELAJAHI: [
    { label: "Riset Terbaru", href: "/articles" },
    { label: "Market Playbook", href: "/playbook" },
    { label: "Valuation Lab", href: "/calculator" },
    { label: "Tools", href: "/screener" },
  ],
  "SUMBER DATA": [
    { label: "Macro View", href: "/playbook/ihsg" },
    { label: "Screening", href: "/screener" },
    { label: "Portfolio Ideas", href: "/dividend" },
    { label: "Tentang Raga", href: "/#about" },
  ],
  PERUSAHAAN: [
    { label: "Profile", href: "/#about" },
    { label: "Contact", href: "/#contact" },
    { label: "Privacy Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(214,173,90,0.28)] bg-[#050505]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border border-[#d6ad5a]/40">
              <span className="font-heading text-xs font-semibold text-[#d6ad5a]">R</span>
            </div>
            <span className="font-heading text-sm tracking-[0.24em] text-[#f2eee6]">RAGA PLAYBOOK</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#aaa295]/60">
            Catatan riset pribadi tentang pasar modal Indonesia. Fokus pada valuasi, arus, dan narasi yang layak diikuti.
          </p>
          <div className="mt-6 flex gap-5 text-[10px] font-semibold tracking-[0.16em] text-[#aaa295]/50">
            {[
              { label: "X/Twitter", href: "https://x.com" },
              { label: "LinkedIn", href: "https://id.linkedin.com/in/polikarpusraga" },
              { label: "Instagram", href: "https://www.instagram.com/bagus.raga" },
              { label: "Email", href: "mailto:baguspolikarpus@gmail.com" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="hover:text-[#d6ad5a]">{l.label}</a>
            ))}
          </div>
        </div>
        {Object.entries(links).map(([title, items]) => (
          <div key={title}>
            <p className="text-[10px] font-semibold tracking-[0.24em] text-[#aaa295]/50">{title}</p>
            <ul className="mt-5 space-y-4 text-sm text-[#aaa295]/80">
              {items.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="transition hover:text-[#d6ad5a]">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[rgba(214,173,90,0.28)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-[10px] tracking-[0.14em] text-[#aaa295]/30 lg:px-12">
          <span>© {new Date().getFullYear()} Raga Playbook</span>
          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
