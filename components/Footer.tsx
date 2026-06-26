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
              { label: "X/Twitter", href: "https://x.com", icon: "x" },
              { label: "LinkedIn", href: "https://id.linkedin.com/in/polikarpusraga", icon: "linkedin" },
              { label: "Email", href: "mailto:baguspolikarpus@gmail.com", icon: "email" },
            ].map((l) => (
              <a key={l.label} href={l.href} aria-label={l.label} className="flex h-8 w-8 items-center justify-center border border-[rgba(214,173,90,0.28)] text-[#aaa295]/60 transition hover:border-[#d6ad5a] hover:text-[#d6ad5a]">
                {l.icon === "x" && <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="currentColor"><path d="M13.5 3h2.1l-4.6 5.3L16.5 15h-4.2l-3.3-4.2L5.1 15H3l4.9-5.6L2.7 3h4.3l3 3.8L13.5 3Zm-.7 10.6h1.2L5.5 4.3h-1.2l9 9.3Z"/></svg>}
                {l.icon === "linkedin" && <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="currentColor"><path d="M4.6 3a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM3 7.2h3.2V15H3V7.2Zm5.2 0H11v1.1h.04c.5-.9 1.7-1.9 3.5-1.9 3.8 0 4.5 2.5 4.5 5.7V15h-3.2v-4.3c0-1 0-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V15H8.2V7.2Z"/></svg>}
                {l.icon === "email" && <svg viewBox="0 0 18 18" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="m2 5.5 7 5 7-5"/></svg>}
              </a>
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
