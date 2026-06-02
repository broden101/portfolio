import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title:
    "Jadwal Right Issue 2026: 9 Emiten IPO Baru & Upcoming — Raga Playbook",
  description:
    "Daftar lengkap right issue tahun 2026 — dari MPPA Rp5,94T hingga COCO Rp266M. Ada yang ditunda OJK, ada yang sudah dapat efektif.",
};

const rightsIssueData = [
  {
    ticker: "MPPA",
    status: "Up Coming",
    effective: "12 Juni 2026",
    dana: "Rp5,94 T",
    rasio: "-",
    harga: "-",
    color: "emerald",
    note: "Target dana terbesar di antara semua emiten. Beroperasi di sektor ritel (Hypermart, Lion Super Indo).",
  },
  {
    ticker: "BNBR",
    status: "Up Coming",
    effective: "26 Juni 2026",
    dana: "Rp4,76 T",
    rasio: "27:14",
    harga: "Rp53",
    color: "emerald",
    note: "Bakrie & Brothers — konglomerat nasional. Dana besar untuk restrukturisasi dan ekspansi.",
  },
  {
    ticker: "CBRE",
    status: "Ditunda",
    effective: "Menunggu Emiten",
    dana: "Rp1,91 T",
    rasio: "90:253",
    harga: "Rp100–150",
    color: "amber",
    note: "Dana masif hampir Rp2T, tapi masih tertahan di OJK.",
  },
  {
    ticker: "IRSX",
    status: "Ditunda",
    effective: "Menunggu Emiten",
    dana: "Rp3,7 T",
    rasio: "1:2",
    harga: "Rp300",
    color: "amber",
    note: "Rasio 1:2 — beli 1 saham lama dapat 2 saham baru. Salah satu yang tertunda.",
  },
  {
    ticker: "ELPI",
    status: "Ditunda",
    effective: "Menunggu Emiten",
    dana: "Rp739 M",
    rasio: "200:57",
    harga: "Rp350",
    color: "amber",
    note: "Rasio unik 200:57 — untuk setiap 200 saham lama, berhak 57 saham baru.",
  },
  {
    ticker: "PADI",
    status: "Ditunda",
    effective: "Menunggu Emiten",
    dana: "Rp113 M",
    rasio: "5:1",
    harga: "Rp50",
    color: "amber",
    note: "Rasio agresif 5:1, harga tebus rendah Rp50/lembar.",
  },
  {
    ticker: "RMKO",
    status: "Up Coming",
    effective: "15 Juni 2026",
    dana: "Rp159 M",
    rasio: "175:64",
    harga: "Rp350",
    color: "emerald",
    note: "Dana relatif kecil, harga tebus Rp350.",
  },
  {
    ticker: "COCO",
    status: "Up Coming",
    effective: "6 Juli 2026",
    dana: "Rp266 M",
    rasio: "1:3",
    harga: "-",
    color: "emerald",
    note: "Rasio 1:3 — beli 1 saham lama, berhak 3 saham baru. Dana Rp266M.",
  },
  {
    ticker: "PYFA",
    status: "Up Coming",
    effective: "7 Juli 2026",
    dana: "-",
    rasio: "-",
    harga: "-",
    color: "emerald",
    note: "Pyridam Farma — sektor farmasi. Detail harga dan rasio belum diumumkan.",
  },
  {
    ticker: "JGLE",
    status: "Menunggu Market Stabil",
    effective: "-",
    dana: "-",
    rasio: "-",
    harga: "-",
    color: "sky",
    note: "Masih menunggu kondisi pasar stabil sebelum melanjutkan proses.",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Up Coming":
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Ditunda: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Menunggu Market Stabil":
      "bg-sky-500/10 text-sky-400 border-sky-500/20",
  };
  return (
    <span
      className={`inline-block px-3 py-1 text-xs tracking-wider uppercase border rounded-full ${
        styles[status] || "bg-[#1a1a1a] text-[#B8AA96] border-[#2C261E]"
      }`}
    >
      {status}
    </span>
  );
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-[#B8AA96]/50 text-xs tracking-wider uppercase hover:text-[#C6A15B] transition-colors mb-10"
        >
          ← Back to Articles
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#C6A15B] text-xs tracking-wider">
              Mei 2026
            </span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">
              Corporate Action / Right Issue
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            Jadwal Right Issue 2026: 9 Emiten dengan Total Dana Puluhan
            Triliun
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            Mulai dari Rp5,94T (MPPA) hingga Rp113M (PADI) — ada yang sudah
            mendapat tanggal efektif, ada yang masih menunggu emiten. Berikut
            daftar lengkap right issue yang perlu Anda pantau di semester 2
            2026.
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-10 text-[#B8AA96] text-base leading-relaxed font-light">
          {/* Overview */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Gambaran Umum
            </h2>
            <p>
              Setidaknya <strong className="text-[#F4EFE6]">9 emiten</strong>{" "}
              tercatat sedang dalam proses right issue di tahun 2026 — dengan
              total dana yang ditargetkan mencapai puluhan triliun rupiah. Lima
              di antaranya sudah mendapat jadwal efektif (Up Coming), sementara
              empat lainnya masih menunggu persetujuan OJK atau stabilisasi
              pasar.
            </p>
            <p className="mt-3">
              Besarannya bervariasi — dari ratusan miliar hingga hampir Rp6
              triliun. Rasio juga beragam, ada yang agresif 1:3 dan 5:1, ada
              yang moderat seperti 27:14.
            </p>
          </div>

          {/* Upcoming */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              📅 Sudah Ada Jadwal Efektif
            </h2>

            <div className="space-y-4">
              {rightsIssueData
                .filter((r) => r.status === "Up Coming")
                .map((item) => (
                  <div
                    key={item.ticker}
                    className="card-luxury p-6 border-l-2 border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                          {item.ticker}
                        </span>
                        <span className="text-[#B8AA96]/50 text-xs ml-3">
                          Efektif: {item.effective}
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Dana
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.dana}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Rasio
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.rasio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Harga Tebus
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.harga}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#B8AA96]/60 mt-2">
                      {item.note}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Pending OJK */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              ⏳ Masih Menunggu OJK
            </h2>

            <div className="space-y-4">
              {rightsIssueData
                .filter((r) => r.status === "Ditunda")
                .map((item) => (
                  <div
                    key={item.ticker}
                    className="card-luxury p-6 border-l-2 border-amber-500/30"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                          {item.ticker}
                        </span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Dana
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.dana}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Rasio
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.rasio}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#B8AA96]/40 text-xs uppercase tracking-wider block mb-1">
                          Harga Tebus
                        </span>
                        <span className="text-[#F4EFE6] font-medium">
                          {item.harga}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#B8AA96]/60 mt-2">
                      {item.note}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Waiting market */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-6">
              🌊 Menunggu Kondisi Pasar Stabil
            </h2>

            {rightsIssueData
              .filter((r) => r.status === "Menunggu Market Stabil")
              .map((item) => (
                <div
                  key={item.ticker}
                  className="card-luxury p-6 border-l-2 border-sky-500/30"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-[#C6A15B] font-bold text-lg tracking-wide">
                      {item.ticker}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-[#B8AA96]/70">{item.note}</p>
                </div>
              ))}
          </div>

          {/* What investor should know */}
          <div className="card-luxury p-8 border-l-2 border-[#C6A15B]/40">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-4">
              Apa yang Investor Perlu Tahu?
            </h2>
            <div className="space-y-4 text-sm">
              <p>
                <strong className="text-[#F4EFE6]">1. Right Issue bukan
                selamanya negatif.</strong>{" "}
                Meskipun berpotensi dilusi, right issue bisa jadi sinyal bahwa
                perusahaan butuh dana untuk ekspansi atau restrukturisasi. Yang
                penting: tujuan penggunaan dananya apa.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">2. Cek harga tebus.</strong>{" "}
                Jika harga tebus jauh di bawah pasar, HMETD bisa dijual.
                Jangan lewatkan window perdagangan HMETD — biasanya hanya
                beberapa hari.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">3. Perhatikan status OJK.</strong>{" "}
                Emiten yang masih "Ditunda" artinya belum ada kepastian kapan
                efektif. Jangan masuk posisi baru hanya karena rumor right issue.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">4. Hitung skenario.</strong>{" "}
                Gunakan kalkulator rights issue untuk membandingkan skenario ikut
                vs tidak ikut — dan tentukan strategi terbaik untuk portofolio
                Anda.
              </p>
            </div>
          </div>

          {/* Calculator CTA */}
          <div className="card-luxury p-6 text-center bg-[#C6A15B]/5 border border-[#C6A15B]/10">
            <p className="text-[#F4EFE6] text-sm mb-3">
              💡 Gunakan kalkulator rights issue kami untuk menghitung skenario
              ikut vs tidak ikut
            </p>
            <Link
              href="/calculator"
              className="inline-block px-6 py-3 bg-[#C6A15B]/10 text-[#C6A15B] text-sm tracking-wider uppercase hover:bg-[#C6A15B]/20 transition-colors rounded"
            >
              Buka Kalkulator →
            </Link>
          </div>

          {/* Disclaimer */}
          <div className="pt-6 border-t border-[#2C261E]">
            <p className="text-xs text-[#B8AA96]/30">
              Disclaimer: Artikel ini bersifat informatif dan bukan merupakan
              rekomendasi investasi. Data diambil dari berbagai sumber publik
              dan mungkin berubah sewaktu-waktu. Keputusan investasi sepenuhnya
              merupakan tanggung jawab pembaca. Selalu lakukan riset mandiri
              dan konsultasikan dengan penasihat keuangan Anda.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
