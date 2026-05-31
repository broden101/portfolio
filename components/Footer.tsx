"use client";

export default function Footer() {
  return (
    <footer className="bg-[#0B0B0A] border-t border-[#2C261E]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#C6A15B]/30 flex items-center justify-center">
              <span className="text-[#C6A15B] font-heading text-xs font-semibold">R</span>
            </div>
            <span className="font-heading text-sm tracking-widest text-[#B8AA96] uppercase">Raga Playbook</span>
          </div>

          <div className="flex items-center gap-8">
            {[
              { name: "LinkedIn", url: "https://id.linkedin.com/in/polikarpusraga" },
              { name: "Instagram", url: "https://www.instagram.com/bagus.raga" },
              { name: "GitHub", url: "https://github.com/broden101" },
              { name: "Email", url: "mailto:baguspolikarpus@gmail.com" },
            ].map((link) => (
              <a key={link.name} href={link.url} className="text-[#B8AA96]/50 text-xs tracking-[0.15em] uppercase hover:text-[#C6A15B] transition-colors">
                {link.name}
              </a>
            ))}
          </div>

          <div className="text-[#B8AA96]/30 text-xs tracking-wider">
            © {new Date().getFullYear()} All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
