import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "MSCI Value Mei 2026: Lebih Ramping, BMRI Jadi Bobot Terbesar — Raga Playbook",
  description:
    "MSCI Value rebalancing Mei 2026 mengurangi konstituen dari 10 menjadi 7 saham. BBCA, CPIN, dan TPIA keluar. BMRI menggantikan BBRI sebagai bobot terbesar.",
};

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
              MSCI / Index Rebalancing
            </span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            MSCI Value Mei 2026: Lebih Ramping, BMRI Jadi Bobot Terbesar
            Gantikan BBRI
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            MSCI melakukan rebalancing indeks Value periode Mei 2026 —
            mengurangi jumlah konstituen dari 10 menjadi 7 saham. BBCA, CPIN,
            dan TPIA keluar. BMRI naik takhta sebagai bobot terbesar. Apa artinya
            bagi investor?
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#B8AA96] text-base leading-relaxed font-light">
          {/* What happened */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Apa yang Berubah?
            </h2>
            <p>
              Morgan Stanley Capital International (MSCI) resmi melakukan
              rebalancing indeks <strong className="text-[#F4EFE6]">MSCI Value</strong> periode
              Mei 2026. Berdasarkan riset Syailendra Research dan data MSCI
              (20/5), perubahan efektif berlaku mulai{" "}
              <strong className="text-[#F4EFE6]">2 Juni 2026</strong>.
            </p>
            <p className="mt-3">
              Total konstituen dipangkas dari 10 saham menjadi hanya 7 saham —
              sinyal bahwa indeks semakin terkonsentrasi pada saham-saham big
              caps dengan profil valuasi murah dan fundamental stabil.
            </p>
          </div>

          {/* Changes table */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Siapa Keluar, Siapa Masuk?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* OUT */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-red-400 text-xs tracking-[0.2em] uppercase font-medium">
                    Keluar dari MSCI Value
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[#C6A15B] font-bold text-sm w-14">
                      BBCA
                    </span>
                    <span className="text-[#F4EFE6] text-sm">
                      Bank Central Asia
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#C6A15B] font-bold text-sm w-14">
                      CPIN
                    </span>
                    <span className="text-[#F4EFE6] text-sm">
                      Charoen Pokphand Indonesia
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#C6A15B] font-bold text-sm w-14">
                      TPIA
                    </span>
                    <span className="text-[#F4EFE6] text-sm">
                      Chandra Asri Pacific
                    </span>
                  </div>
                </div>
              </div>

              {/* IN */}
              <div className="card-luxury p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 text-xs tracking-[0.2em] uppercase font-medium">
                    Masuk ke MSCI Value
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#C6A15B] font-bold text-sm w-14">
                    BRPT
                  </span>
                  <span className="text-[#F4EFE6] text-sm">
                    Barito Pacific — comeback ke konstituen
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Weight shift */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Pergeseran Bobot: BMRI Takhta Baru
            </h2>
            <p>
              Perubahan paling mencolok:{" "}
              <strong className="text-[#C6A15B]">BMRI</strong> kini menjadi
              konstituen dengan bobot terbesar di MSCI Value — sebesar{" "}
              <strong className="text-[#F4EFE6]">27,3%</strong>, menggeser BBRI
              yang turun ke 16,4%.
            </p>

            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#C6A15B]/20 text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                    <th className="pb-3 pr-4 font-medium">Ticker</th>
                    <th className="pb-3 pr-4 font-medium">Bobot Baru</th>
                    <th className="pb-3 font-medium">Perubahan</th>
                  </tr>
                </thead>
                <tbody className="text-[#F4EFE6]">
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      BMRI
                    </td>
                    <td className="py-3 pr-4">27,3%</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+9,7%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      TLKM
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+6,9%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      ASII
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+3,3%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      BBNI
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-emerald-400">+2,3%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      BBRI
                    </td>
                    <td className="py-3 pr-4">16,4%</td>
                    <td className="py-3">
                      <span className="text-red-400">−7,4%</span>
                    </td>
                  </tr>
                  <tr className="border-b border-[#2C261E]/50">
                    <td className="py-3 pr-4 font-semibold text-[#C6A15B]">
                      UNTR
                    </td>
                    <td className="py-3 pr-4">—</td>
                    <td className="py-3">
                      <span className="text-red-400">−0,8%</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-sm text-[#B8AA96]/70">
              Sumber: Syailendra Research, data MSCI per 20 Mei 2026.
            </p>
          </div>

          {/* Dividend angle */}
          <div className="card-luxury p-8 border-l-2 border-[#C6A15B]/40">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-4">
              Dividend Play: Yield Rata-rata 8,7%
            </h2>
            <p>
              Angka yang menarik — enam dari tujuh konstituen MSCI Value
              tercatat konsisten membagikan dividen dalam{" "}
              <strong className="text-[#F4EFE6]">18 tahun terakhir</strong>.
              Berdasarkan dividen terakhir, rata-rata dividend yield keenam
              emiten tersebut mencapai sekitar{" "}
              <strong className="text-[#C6A15B]">8,7%</strong>.
            </p>
            <p className="mt-3">
              Di tengah tren suku bunga global yang mulai turun, profil dividen
              seperti ini menjadi magnet bagi income-focused investor.
            </p>
          </div>

          {/* Valuation angle */}
          <div>
            <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4 mb-4">
              Murah? Empat dari Tujuh di Level 5-Tahun Terendah
            </h2>
            <p>
              Syailendra Research juga menyoroti fakta bahwa empat dari tujuh
              konstituen MSCI Value saat ini berada di level valuasi terendah
              dalam lima tahun terakhir. Artinya — saham-saham big caps ini
              diperdagangkan di harga diskon relatif di tengah volatilitas
              pasar domestik.
            </p>
            <p className="mt-3">
              Value trap atau peluang? Itu tergantung fundamental masing-masing
              emiten dan makro ke depan.
            </p>
          </div>

          {/* Conclusion */}
          <div className="card-luxury p-8 border-l-2 border-[#C6A15B]/40">
            <h2 className="font-heading text-xl text-[#F4EFE6] font-medium mb-4">
              Takeaway
            </h2>
            <div className="space-y-3 text-sm">
              <p>
                <strong className="text-[#F4EFE6]">1.</strong> MSCI Value makin
                terkonsentrasi — perbankan mendominasi, BMRI jadi raja bobot.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">2.</strong> BBCA keluar dari
                value index — tapi bukan berarti fundamentalnya buruk. Harga
                BBCA naik sehingga tidak lagi "murah" secara relatif.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">3.</strong> Outflow dari
                passive funds yang track MSCI Value mungkin terjadi di BBCA,
                CPIN, dan TPIA. Rebalancing window bisa jadi volatil.
              </p>
              <p>
                <strong className="text-[#F4EFE6]">4.</strong> Dividend yield
                rata-rata 8,7% + valuasi di level 5-tahun terendah = tetap
                menarik untuk income investor yang sabar.
              </p>
            </div>
          </div>

          {/* Source */}
          <div className="pt-6 border-t border-[#2C261E]">
            <p className="text-xs text-[#B8AA96]/50">
              <strong className="text-[#B8AA96]/70">Sumber:</strong>{" "}
              <a
                href="https://www.bareksa.com/berita/saham/2026-05-20/msci-value-mei-2026-lebih-ramping-bmri-jadi-bobot-terbesar-gantikan-bbri"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A15B]/60 hover:text-[#C6A15B] underline transition-colors"
              >
                Bareksa — MSCI Value Mei 2026: Lebih Ramping, BMRI Jadi Bobot
                Terbesar Gantikan BBRI
              </a>
              . Riset: Syailendra Research, data MSCI per 20 Mei 2026.
            </p>
            <p className="text-xs text-[#B8AA96]/30 mt-3">
              Disclaimer: Artikel ini bersifat informatif dan bukan merupakan
              rekomendasi investasi. Keputusan investasi sepenuhnya merupakan
              tanggung jawab pembaca. Selalu lakukan riset mandiri sebelum
              berinvestasi.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
