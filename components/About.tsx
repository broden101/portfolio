"use client";

export default function About() {
  return (
    <section id="about" className="relative py-32 bg-[#0a0a0a]">
      <div className="gold-line w-full" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-px bg-[#c9a84c]/40" />
          <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase">
            Tentang Saya
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left - Photo placeholder */}
          <div className="relative">
            <div className="aspect-[3/4] bg-[#141414] border border-[#c9a84c]/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-[#c9a84c]/20 flex items-center justify-center">
                  <span className="text-[#c9a84c]/40 text-2xl font-serif">
                    NA
                  </span>
                </div>
                <span className="text-[#f5f0e8]/20 text-xs tracking-widest uppercase">
                  Foto Profil
                </span>
              </div>
            </div>
            {/* Gold corner accent */}
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#c9a84c]/15 -z-10" />
          </div>

          {/* Right - Content */}
          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-3xl md:text-4xl text-[#f5f0e8] mb-8 leading-tight">
              Profesional di Bidang
              <br />
              <span className="text-gold-gradient">Pasar Modal</span>
            </h2>

            <div className="space-y-5 text-[#f5f0e8]/50 text-sm leading-relaxed font-light">
              <p>
                Dengan pengalaman bertahun-tahun di industri pasar modal, saya
                membantu klien memahami dinamika investasi dan membangun portofolio
                yang optimal sesuai profil risiko masing-masing.
              </p>
              <p>
                Spesialisasi dalam riset ekuitas, analisis fundamental, dan
                advisory untuk investor institusi maupun individu dengan
                portofolio signifikan.
              </p>
              <p>
                Pendekatan yang saya gunakan menggabungkan analisis teknikal dan
                fundamental dengan pemahaman mendalam terhadap kondisi makro
                ekonomi domestik dan global.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#c9a84c]/10">
              {[
                { number: "5+", label: "Tahun Pengalaman" },
                { number: "100+", label: "Nasabah" },
                { number: "IDR", label: "AUM Kelolaan" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-2xl md:text-3xl text-[#c9a84c] mb-1">
                    {stat.number}
                  </div>
                  <div className="text-[#f5f0e8]/30 text-xs tracking-wider uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
