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
    <section id="contact" className="relative py-32 bg-[#faf7f2]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#b8922d]/40" />
              <span className="text-[#b8922d] text-xs tracking-[0.3em] uppercase">Hubungi Saya</span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] mb-8">
              Mulai <span className="text-gold-gradient">Percakapan</span>
            </h2>

            <p className="text-[#777777] text-sm leading-relaxed font-light mb-12">
              Tertarik untuk mendiskusikan strategi investasi atau membutuhkan riset pasar? Silakan hubungi saya melalui formulir atau kontak langsung di bawah ini.
            </p>

            <div className="space-y-6">
              {[
                { label: "Email", value: "baguspolikarpus@gmail.com" },
                { label: "Telepon", value: "+62 899 8866 735" },
                { label: "Lokasi", value: "Pontianak, Indonesia" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-px h-5 bg-[#b8922d]/30 mt-0.5" />
                  <div>
                    <div className="text-[#999999] text-xs tracking-[0.2em] uppercase mb-1">{item.label}</div>
                    <div className="text-[#333333] text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-luxury p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { key: "name", label: "Nama Lengkap", type: "text", placeholder: "Masukkan nama Anda" },
                { key: "email", label: "Email", type: "email", placeholder: "nama@email.com" },
                { key: "phone", label: "Nomor Telepon", type: "tel", placeholder: "+62" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[#999999] text-xs tracking-[0.15em] uppercase mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-[#f5f0e8] border border-[#b8922d]/10 px-4 py-3 text-[#1a1a1a] text-sm placeholder-[#bbbbbb] transition-colors duration-300"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-[#999999] text-xs tracking-[0.15em] uppercase mb-2">Pesan</label>
                <textarea
                  placeholder="Ceritakan kebutuhan investasi Anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full bg-[#f5f0e8] border border-[#b8922d]/10 px-4 py-3 text-[#1a1a1a] text-sm placeholder-[#bbbbbb] resize-none transition-colors duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#b8922d] text-white text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#a37e2c] transition-all duration-300"
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
