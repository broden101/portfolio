"use client";

export default function Footer() {
  return (
    <footer className="bg-[#E7DFC8] border-t border-[#A39276]/15">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#A39276]/40 flex items-center justify-center">
              <span className="text-[#6E6151] font-serif text-xs font-semibold">R</span>
            </div>
            <span className="font-serif text-sm tracking-widest text-[#726556] uppercase font-semibold">Raga Playbook</span>
          </div>

          <div className="flex items-center gap-8">
            {[
              { name: "LinkedIn", url: "https://id.linkedin.com/in/polikarpusraga" },
              { name: "Instagram", url: "https://www.instagram.com/bagus.raga" },
              { name: "GitHub", url: "https://github.com/broden101" },
              { name: "Email", url: "mailto:baguspolikarpus@gmail.com" },
            ].map((link) => (
              <a key={link.name} href={link.url} className="text-[#A39276] text-xs tracking-[0.15em] uppercase font-medium hover:text-[#6E6151] transition-colors">
                {link.name}
              </a>
            ))}
          </div>

          <div className="text-[#A39276] text-xs tracking-wider">
            © {new Date().getFullYear()} All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
