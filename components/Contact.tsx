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
    <section id="contact" className="relative py-32 bg-[#F3EFE6]">
      <div className="gold-line w-full" />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-px bg-[#9A7A3F]/40" />
              <span className="text-[#9A7A3F] text-xs tracking-[0.3em] uppercase font-semibold">Contact</span>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl text-[#111111] mb-8 font-bold">
              Let's <span className="text-gold-gradient">Connect</span>
            </h2>

            <p className="text-[#6F6252] text-base leading-relaxed font-light mb-12">
              Interested in discussing investment strategies or need market research? Feel free to reach out through the form or contact details below.
            </p>

            <div className="space-y-8">
              {[
                { label: "Email", value: "baguspolikarpus@gmail.com" },
                { label: "Phone", value: "+62 899 8866 735" },
                { label: "Location", value: "Surabaya, Indonesia" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-px h-5 bg-[#9A7A3F]/30 mt-0.5" />
                  <div>
                    <div className="text-[#9A7A3F] text-xs tracking-[0.2em] uppercase mb-1 font-medium">{item.label}</div>
                    <div className="text-[#111111] text-sm font-medium">{item.value}</div>
                  </div>
                </div>
              ))}
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
                  <label className="block text-[#6F6252] text-xs tracking-[0.15em] uppercase mb-2 font-medium">{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} className="w-full bg-white border border-[#C8B89B] px-4 py-3.5 text-[#17120C] text-sm placeholder-[#C8B89B] transition-all duration-300 focus:shadow-md" required />
                </div>
              ))}

              <div>
                <label className="block text-[#6F6252] text-xs tracking-[0.15em] uppercase mb-2 font-medium">Message</label>
                <textarea placeholder="Tell me about your investment needs..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="w-full bg-white border border-[#C8B89B] px-4 py-3.5 text-[#17120C] text-sm placeholder-[#C8B89B] resize-none transition-all duration-300 focus:shadow-md" required />
              </div>

              <button type="submit" className="w-full py-4 bg-[#111111] text-white text-xs tracking-[0.25em] uppercase font-semibold hover:bg-[#3A2C1A] transition-all duration-300 shadow-md hover:shadow-lg">
                {sent ? "✓ Message Sent" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
