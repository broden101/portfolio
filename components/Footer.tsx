"use client";

export default function Footer() {
  return (
    <footer className="bg-[#f5f0e8] border-t border-[#b8922d]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#b8922d]/40 flex items-center justify-center">
              <span className="text-[#b8922d]/60 font-serif text-xs">R</span>
            </div>
            <span className="font-serif text-sm tracking-widest text-[#6b6b6b] uppercase">
              Raga Playbook
            </span>
          </div>

          <div className="flex items-center gap-8">
            {[
              { name: "LinkedIn", url: "https://id.linkedin.com/in/polikarpusraga" },
              { name: "Instagram", url: "https://www.instagram.com/bagus.raga" },
              { name: "GitHub", url: "https://github.com/broden101" },
              { name: "Email", url: "mailto:baguspolikarpus@gmail.com" },
            ].map((link) => (
              <a
                key={link.name}
                href={link.url}
                className="text-[#999999] text-xs tracking-[0.15em] uppercase hover:text-[#b8922d] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="text-[#bbbbbb] text-xs tracking-wider">
            © {new Date().getFullYear()} All Rights Reserved
          </div>
        </div>
      </div>
    </footer>
  );
}
