import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0A] pt-24 pb-20">
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back link */}
        <Link href="/articles" className="inline-flex items-center gap-2 text-[#B8AA96]/50 text-xs tracking-wider uppercase hover:text-[#C6A15B] transition-colors mb-10">
          ← Back to Articles
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#C6A15B] text-xs tracking-wider">Juni 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">IHSG / Index Rebalancing</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            4 Saham Indonesia Keluar dari Indeks FTSE Russell Juni 2026
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            FTSE Russell resmi mengumumkan penghapusan empat saham Indonesia dari indeks global mereka dalam rebalancing Juni 2026. Keputusan ini berdampak pada aliran dana asing dan komposisi portofolio institusional global.
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#B8AA96] text-base leading-relaxed font-light">

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Daftar Saham yang Dihapus</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#C6A15B]/20 text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                  <th className="pb-3 pr-4 font-medium">Ticker</th>
                  <th className="pb-3 pr-4 font-medium">Emiten</th>
                  <th className="pb-3 font-medium">Alasan Penghapusan</th>
                </tr>
              </thead>
              <tbody className="text-[#F4EFE6]">
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold text-[#C6A15B]">DSSA</td>
                  <td className="py-4 pr-4">PT Dian Swastatika Sentosa Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">High Shareholding Concentration (HSC)</span>
                    <br />
                    <span className="text-[#B8AA96]/50 text-xs">Kepemilikan saham terkonsentrasi tinggi. FTSE akan menghapus dengan mekanisme "harga nol".</span>
                  </td>
                </tr>
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold text-[#C6A15B]">DAAZ</td>
                  <td className="py-4 pr-4">PT DAAZ Lifestyle Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Tidak memenuhi minimum free float</span>
                    <br />
                    <span className="text-[#B8AA96]/50 text-xs">Free float di bawah ketentuan minimum FTSE Russell.</span>
                  </td>
                </tr>
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold text-[#C6A15B]">HILL</td>
                  <td className="py-4 pr-4">PT Hillcon Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Tidak memenuhi kriteria screener FISE</span>
                    <br />
                    <span className="text-[#B8AA96]/50 text-xs">Gagal memenuhi kriteria Foreign Inclusion Screening Eligible (FISE).</span>
                  </td>
                </tr>
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold text-[#C6A15B]">MLIA</td>
                  <td className="py-4 pr-4">PT Mulia Industrindo Tbk</td>
                  <td className="py-4">
                    <span className="text-red-400">Tidak memenuhi kriteria screener FISE</span>
                    <br />
                    <span className="text-[#B8AA96]/50 text-xs">Gagal memenuhi kriteria Foreign Inclusion Screening Eligible (FISE).</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Kasus Khusus: DSSA</h2>

          <p>
            Khusus untuk <strong className="text-[#C6A15B]">DSSA</strong> (Dian Swastatika Sentosa), FTSE akan menghapus saham ini dengan mekanisme <strong className="text-[#F4EFE6]">"harga nol"</strong> akibat tingginya konsentrasi kepemilikan saham. Ini berarti saham tidak akan dihargai dalam perhitungan indeks, yang berpotensi memicu aksi jual oleh fund manager yang mereplikasi indeks FTSE.
          </p>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Dampak terhadap Pasar</h2>

          <div className="card-luxury p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Outflow dana asing</strong> — Fund manager global yang melacak indeks FTSE wajib menjual posisi di empat saham ini, berpotensi menciptakan tekanan jual jangka pendek.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Dampak psikologis</strong> — Penghapusan dari indeks global dapat mempengaruhi sentimen investor ritel dan institusional domestik terhadap saham-saham terkait.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Rebalancing window</strong> — Periode antara pengumuman dan efektivitas (5 Juni 2026) menjadi window penting bagi investor untuk menyesuaikan posisi.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Belum final</strong> — FTSE menegaskan bahwa pengumuman ini belum bersifat final dan terbuka atas adanya perubahan hingga 5 Juni 2026.
              </div>
            </div>
          </div>

          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Apa Itu FTSE Russell?</h2>

          <p>
            FTSE Russell adalah penyedia indeks global yang dimiliki oleh London Stock Exchange Group (LSEG). Indeks mereka digunakan oleh ribuan fund manager global sebagai benchmark untuk alokasi dana. Masuk atau keluar dari indeks FTSE berarti arus dana masuk atau keluar dari saham tersebut secara otomatis.
          </p>

          <p>
            Rebalancing Juni 2026 merupakan bagian dari review berkala yang dilakukan FTSE Russell setiap kuartal untuk memastikan komposisi indeks tetap merepresentasikan kondisi pasar secara akurat.
          </p>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B]">
            <p className="text-sm italic text-[#B8AA96]/80">
              Disclaimer: Artikel ini bersifat informatif dan bukan merupakan rekomendasi investasi. Selalu lakukan riset mandiri sebelum mengambil keputusan investasi.
            </p>
          </div>
        </div>

        <div className="gold-line w-full mt-12 mb-8" />

        <Link href="/articles" className="inline-flex items-center gap-2 text-[#C6A15B] text-xs tracking-[0.2em] uppercase hover:text-[#D4B76A] transition-colors">
          ← Back to Articles
        </Link>
      </article>
    </div>
  );
}
