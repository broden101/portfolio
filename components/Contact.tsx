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
    <section id="contact" className="relative py-32 bg-[#0B0B0A]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#C6A15B]/30" />
              <span className="text-[#C6A15B] text-xs tracking-[0.3em] uppercase font-medium">Contact</span>
            </div>

            <h2 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] mb-8 font-light">
              Let's <span className="text-gold-gradient font-medium">Connect</span>
            </h2>

            <p className="text-[#B8AA96] text-base leading-relaxed font-light mb-12">
              Interested in discussing investment strategies or need market research? Feel free to reach out through the form or contact details below.
            </p>

            <div className="space-y-8">
              {[
                { label: "Email", value: "baguspolikarpus@gmail.com" },
                { label: "Phone", value: "+62 899 8866 735" },
                { label: "Location", value: "Surabaya, Indonesia" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-px h-5 bg-[#C6A15B]/20 mt-0.5" />
                  <div>
                    <div className="text-[#B8AA96]/50 text-xs tracking-[0.2em] uppercase mb-1">{item.label}</div>
                    <div className="text-[#F4EFE6] text-sm">{item.value}</div>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <a
                  href="/cv-raga-playbook.pdf"
                  download
                  className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#C6A15B] text-[#0B0B0A] text-xs tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B76A] transition-all duration-300 border border-[#C6A15B]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  Download CV
                </a>
              </div>
            </div>
          </div>

          <div className="card-luxury p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { key: "name", label: "Full Name", type: "text", placeholder: "Enter your name" },
                { key: "email", label: "Email", type: "email", placeholder: "name@email.com" },
                { key: "phone", label: "Phone Number", type: "tel", placeholder: "+62" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3.5 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/30 transition-all duration-300"
                    required
                  />
                </div>
              ))}

              <div>
                <label className="block text-[#B8AA96]/60 text-xs tracking-[0.15em] uppercase mb-2">Message</label>
                <textarea
                  placeholder="Tell me about your investment needs..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                  className="w-full bg-[#0B0B0A] border border-[#2C261E] px-4 py-3.5 text-[#F4EFE6] text-sm placeholder-[#B8AA96]/30 resize-none transition-all duration-300"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#C6A15B] text-[#0B0B0A] text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#D4B76A] transition-all duration-300 border border-[#C6A15B]"
              >
                {sent ? "✓ Message Sent" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
