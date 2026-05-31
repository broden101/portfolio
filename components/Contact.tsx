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
    <section id="contact" className="relative py-32 bg-[#0f0f0a]">
      <div className="gold-line w-full" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-px bg-[#c9a84c]/40" />
              <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase">
                Hubungi Saya
              </span>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-[#f5f0e8] mb-8">
              Mulai <span className="text-gold-gradient">Percakapan</span>
            </h2>

            <p className="text-[#f5f0e8]/40 text-sm leading-relaxed font-light mb-12">
              Tertarik untuk mendiskusikan strategi investasi atau membutuhkan
              riset pasar? Silakan hubungi saya melalui formulir atau kontak
              langsung di bawah ini.
            </p>

            {/* Contact Info */}
            <div className="space-y-6">
              {[
                { label: "Email", value: "nama@email.com" },
                { label: "Telepon", value: "+62 812-XXXX-XXXX" },
                { label: "Lokasi", value: "Jakarta, Indonesia" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-px h-5 bg-[#c9a84c]/30 mt-0.5" />
                  <div>
                    <div className="text-[#f5f0e8]/25 text-xs tracking-[0.2em] uppercase mb-1">
                      {item.label}
                    </div>
                    <div className="text-[#f5f0e8]/70 text-sm">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Form */}
          <div className="card-luxury p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { key: "name", label: "Nama Lengkap", type: "text", placeholder: "Masukkan nama Anda" },
                { key: "email", label: "Email", type: "email", placeholder: "nama@email.com" },
                { key: "phone", label: "Nomor Telepon", type: "tel", placeholder: "+62" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[#f5f0e8]/30 text-xs tracking-[0.15em] uppercase mb-2">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-[#0a0a0a] border border-[#c9a84c]/10 px-4 py-3 text-[#f5f0e8]/80 text-sm placeholder-[#f5f0e8]/15 transition-colors duration-300"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-[#f5f0e8]/30 text-xs tracking-[0.15em] uppercase mb-2">
                  Pesan
                </label>
                <textarea
                  placeholder="Ceritakan kebutuhan investasi Anda..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-[#c9a84c]/10 px-4 py-3 text-[#f5f0e8]/80 text-sm placeholder-[#f5f0e8]/15 resize-none transition-colors duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#c9a84c] text-[#0a0a0a] text-xs tracking-[0.2em] uppercase font-medium hover:bg-[#dfc06e] transition-all duration-300"
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
