"use client";

import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="relative py-32 bg-[#DDBFA2]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#A39276]/40" />
              <span className="text-[#6E6151] text-xs tracking-[0.3em] uppercase font-semibold">Hubungi Saya</span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl text-[#281F17] mb-8 font-bold">
              Mulai <span className="text-gold-gradient">Percakapan</span>
            </h2>

            <p className="text-[#726556] text-base leading-relaxed font-light mb-12">
              Tertarik untuk mendiskusikan strategi investasi atau membutuhkan riset pasar? Silakan hubungi saya melalui formulir atau kontak langsung di bawah ini.
            </p>

            <div className="space-y-8">
              {[
                { label: "Email", value: "baguspolikarpus@gmail.com" },
                { label: "Telepon", value: "+62 899 8866 735" },
                { label: "Lokasi", value: "Surabaya, Indonesia" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-px h-5 bg-[#A39276]/30 mt-0.5" />
                  <div>
                    <div className="text-[#A39276] text-xs tracking-[0.2em] uppercase mb-1 font-medium">{item.label}</div>
                    <div className="text-[#281F17] text-sm font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-luxury p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { key: "name", label: "Nama Lengkap", type: "text", placeholder: "Masukkan nama Anda" },
                { key: "email", label: "Email", type: "email", placeholder: "nama@email.com" },
                { key: "phone", label: "Nomor Telepon", type: "tel", placeholder: "+62" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[#726556] text-xs tracking-[0.15em] uppercase mb-2 font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-white border border-[#A39276]/20 px-4 py-3.5 text-[#070301] text-sm placeholder-[#A39276] transition-all duration-300 focus:shadow-md"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-[#726556] text-xs tracking-[0.15em] uppercase mb-2 font-medium">Pesan</label>
                <textarea
                  placeholder="Ceritakan kebutuhan investasi Anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full bg-white border border-[#A39276]/20 px-4 py-3.5 text-[#070301] text-sm placeholder-[#A39276] resize-none transition-all duration-300 focus:shadow-md"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#6E6151] text-white text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#281F17] transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {sent ? "✓ Pesan Terkirim" : "Kirim Pesan"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
