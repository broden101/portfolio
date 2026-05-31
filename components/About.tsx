"use client";

export default function About() {
  return (
    <section id="about" className="relative py-32 bg-[#f5f0e8]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="flex items-center gap-4 mb-16">
          <div className="w-12 h-px bg-[#b8922d]/40" />
          <span className="text-[#b8922d] text-xs tracking-[0.3em] uppercase">Tentang Saya</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="relative">
            <div className="aspect-[3/4] bg-[#faf7f2] border border-[#b8922d]/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full border border-[#b8922d]/20 flex items-center justify-center">
                  <span className="text-[#b8922d]/40 text-2xl font-serif">RP</span>
                </div>
                <span className="text-[#999999] text-xs tracking-widest uppercase">Foto Profil</span>
              </div>
            </div>
            <div className="absolute -bottom-3 -right-3 w-full h-full border border-[#b8922d]/10 -z-10" />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-8 leading-tight">
              Profesional di Bidang<br />
              <span className="text-gold-gradient">Pasar Modal</span>
            </h2>

            <div className="space-y-5 text-[#555555] text-sm leading-relaxed font-light">
              <p>Dengan pengalaman bertahun-tahun di industri pasar modal, saya membantu klien memahami dinamika investasi dan membangun portofolio yang optimal sesuai profil risiko masing-masing.</p>
              <p>Spesialisasi dalam riset ekuitas, analisis fundamental, dan advisory untuk investor institusi maupun individu dengan portofolio signifikan.</p>
              <p>Pendekatan yang saya gunakan menggabungkan analisis teknikal dan fundamental dengan pemahaman mendalam terhadap kondisi makro ekonomi domestik dan global.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#b8922d]/10">
              {[
                { number: "5+", label: "Tahun Pengalaman" },
                { number: "100+", label: "Nasabah" },
                { number: "IDR", label: "AUM Kelolaan" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-2xl md:text-3xl text-[#b8922d] mb-1">{stat.number}</div>
                  <div className="text-[#999999] text-xs tracking-wider uppercase">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
