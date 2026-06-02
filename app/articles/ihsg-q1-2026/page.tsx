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
            <span className="text-[#C6A15B] text-xs tracking-wider">Maret 2026</span>
            <span className="w-1 h-1 rounded-full bg-[#2C261E]" />
            <span className="text-[#B8AA96]/50 text-xs tracking-wider uppercase">IHSG / Makro</span>
          </div>

          <h1 className="font-heading text-4xl md:text-5xl text-[#F4EFE6] leading-tight font-light mb-6">
            IHSG Q1 2026: Fear Driven Selling, APBN Tertekan, dan Rupiah di Persimpangan
          </h1>

          <p className="text-[#B8AA96] text-lg leading-relaxed font-light">
            IHSG terperosok ke zona bearish dengan koreksi nyaris 20% dari all-time high. Kombinasi isu MSCI,
            tekanan rating kredit, dan eskalasi geopolitik menciptakan fase jual panik. Bagaimana kondisi APBN,
            politik dalam negeri, dan nilai tukar rupiah merespons tekanan ini?
          </p>
        </header>

        <div className="gold-line w-full mb-12" />

        {/* Content */}
        <div className="space-y-8 text-[#B8AA96] text-base leading-relaxed font-light">

          {/* ─── BAGIAN 1: DATA ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">IHSG dalam Angka</h2>

          <p>
            Memasuki kuartal pertama 2026, IHSG mengalami tekanan jual yang signifikan. Dalam dua gelombang koreksi besar, indeks kehilangan hampir seperlima nilainya dari level tertinggi sepanjang masa (ATH).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#C6A15B]/20 text-left text-xs tracking-[0.15em] uppercase text-[#B8AA96]/60">
                  <th className="pb-3 pr-4 font-medium">Periode</th>
                  <th className="pb-3 pr-4 font-medium">Net Sell Asing</th>
                  <th className="pb-3 pr-4 font-medium">Level IHSG</th>
                  <th className="pb-3 font-medium">Koreksi (vs ATH)</th>
                </tr>
              </thead>
              <tbody className="text-[#F4EFE6]">
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold">Akhir Januari 2026</td>
                  <td className="py-4 pr-4 text-red-400">Rp 5,11 triliun</td>
                  <td className="py-4 pr-4">7.481</td>
                  <td className="py-4 text-red-400">-18,10%</td>
                </tr>
                <tr className="border-b border-[#2C261E]/50">
                  <td className="py-4 pr-4 font-semibold">Akhir Februari — Awal Maret 2026</td>
                  <td className="py-4 pr-4 text-red-400">Rp 1,6 triliun</td>
                  <td className="py-4 pr-4">7.337</td>
                  <td className="py-4 text-red-400">-19,68%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="card-luxury p-6 bg-[#0B0B0A] border border-red-400/20">
            <p className="text-[#F4EFE6] font-medium">Total outflow asing dalam dua gelombang: Rp 6,71 triliun</p>
            <p className="text-[#B8AA96]/60 text-sm mt-2">Koreksi -19,68% dari ATH menempatkan IHSG di ambang zona bear market (definisi umum: -20%).</p>
          </div>

          {/* ─── BAGIAN 2: DRIVER ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Tiga Tekanan Utama</h2>

          <p>
            Infografis terkini mengidentifikasi tiga isu utama yang memicu <em>fear driven selling</em> di pasar saham Indonesia. Ketiganya saling memperkuat dan berdampak sistemik terhadap persepsi risiko investor.
          </p>

          <div className="space-y-6">
            <div className="card-luxury p-6 border-l-4 border-l-blue-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">1. Isu MSCI — Risiko Downgrade ke Frontier Market</h3>
              <p>
                Kekhawatiran terhadap <strong className="text-[#F4EFE6]">investability </strong>pasar modal Indonesia meningkat. Freeze perubahan indeks dan potensi penurunan status dari <em>emerging market</em> ke <em>frontier market</em> menjadi perhatian utama investor global. Jika ini terjadi, Indonesia akan keluar dari indeks MSCI Emerging Markets — yang berarti <strong className="text-[#F4EFE6]">arus dana keluar jangka panjang</strong> dari fund manager global yang melacak indeks tersebut.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                Risiko ini langsung mempengaruhi <strong className="text-[#C6A15B]">risk premium</strong> pasar Indonesia. Semakin tinggi probabilitas downgrade, semakin besar diskon yang diminta investor untuk memegang aset Indonesia.
              </p>
            </div>

            <div className="card-luxury p-6 border-l-4 border-l-red-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">2. Outlook Kredit — Moody's & Fitch</h3>
              <p>
                Lembaga pemeringkat internasional <strong className="text-[#F4EFE6]">Moody's </strong>dan <strong className="text-[#F4EFE6]">Fitch </strong>menambah kekhawatiran investor terhadap kredibilitas kebijakan dan kondisi fiskal Indonesia. Meski peringkat Indonesia saat ini masih di <em>investment grade</em> (Baa2/BBB), prospek (<em>outlook</em>) yang negatif dapat memicu penurunan peringkat jika tidak ada perbaikan fundamental.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                Rating outlook yang negatif berarti biaya utang (<em>yield</em>) pemerintah naik, yang pada gilirannya menekan APBN dan mengurangi ruang fiskal.
              </p>
            </div>

            <div className="card-luxury p-6 border-l-4 border-l-yellow-500">
              <h3 className="font-heading text-lg text-[#F4EFE6] font-medium mb-2">3. Eskalasi Konflik Iran — Minyak & Selat Hormuz</h3>
              <p>
                Ketegangan geopolitik di Timur Tengah meningkat. Konflik Iran yang melibatkan Selat Hormuz — jalur transit <strong className="text-[#F4EFE6]">20-25% pasokan minyak dunia</strong> — mendorong kenaikan harga minyak global. Harga Brent yang sempat stabil di bawah $70 kembali merangkak naik ke level $82-85.
              </p>
              <p className="mt-3 text-sm text-[#B8AA96]/60">
                Bagi Indonesia, kenaikan harga minyak berarti: (1) <strong className="text-red-400">subsidi energi membengkak</strong>, (2) <strong className="text-red-400">defisit APBN melebar</strong>, (3) <strong className="text-red-400">tekanan inflasi impor</strong>, dan (4) <strong className="text-red-400">current account deficit</strong> meningkat.
              </p>
            </div>
          </div>

          {/* ─── BAGIAN 3: APBN & FISKAL ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Dampak ke APBN dan Kebijakan Fiskal</h2>

          <p>
            Tiga tekanan di atas berdampak langsung pada <strong className="text-[#F4EFE6]">APBN 2026</strong>. Pemerintah menganggarkan defisit sekitar <strong className="text-[#C6A15B]">2,5-2,8% dari PDB</strong> dalam asumsi makro awal tahun. Namun, kondisi aktual menunjukkan tekanan fiskal yang lebih besar dari perkiraan.
          </p>

          <div className="card-luxury p-6 space-y-4">
            <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Saluran Tekanan Fiskal</h3>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Subsidi energi membengkak</strong> — Setiap kenaikan ICP (Indonesia Crude Price) sebesar $5/barel menambah beban subsidi rata-rata Rp 15-20 triliun per tahun. Jika harga minyak bertahan di atas $80, realisasi subsidi bisa melampaui pagu anggaran.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Penerimaan pajak melambat</strong> — Ekonomi yang melambat tekanan kenaikan minyak dan pelemahan rupiah menekan sektor korporasi, yang berimbas pada setoran PPh dan PPN di bawah target.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Biaya utang naik</strong> — Imbal hasil SUN tenor 10 tahun yang naik 50-100 bps sepanjang Q1 2026 membuat <em>yield</em> yang harus dibayar pemerintah untuk penerbitan utang baru semakin mahal.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Ruang fiskal menyempit</strong> — Pemerintah menghadapi <em>trilemma</em>: (a) menjaga subsidi agar daya beli tidak anjlok, (b) mengendalikan defisit agar tidak melampaui 3% PDB, dan (c) tetap membiayai program prioritas (IKN, Makan Bergizi Gratis, infrastruktur).
              </div>
            </div>
          </div>

          <p>
            Opsi kebijakan yang tersedia terbatas: <strong className="text-[#C6A15B]">realokasi belanja</strong>, <strong className="text-[#C6A15B]">penerbitan SBN </strong>di tengah imbal hasil yang tinggi, atau <strong className="text-[#C6A15B]">kombinasi keduanya</strong> — yang semuanya berpotensi menambah tekanan pada likuiditas perbankan dan suku bunga.
          </p>

          {/* ─── BAGIAN 4: POLITIK ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Faktor Politik — Ketidakpastian dan Transisi</h2>

          <p>
            Faktor politik domestik turut berkontribusi terhadap persepsi risiko investor. Setelah pemilu 2024 dan transisi kepemimpinan yang melahirkan koalisi baru, pasar masih mencermati konsistensi kebijakan dan arah ekonomi jangka panjang.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-luxury p-6">
              <h3 className="font-heading text-base text-[#F4EFE6] font-medium mb-3">Dampak Langsung</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Debat publik soal keberlanjutan program flagship (IKN, Makan Bergizi Gratis) menciptakan ketidakpastian fiskal</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Persepsi risiko institusi (<em>institutional risk</em>) meningkat di mata investor asing — tercermin dari premi CDS Indonesia yang melebar</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Kekhawatiran intervensi kebijakan yang tidak lazim mempengaruhi investor institusional global</span>
                </li>
              </ul>
            </div>

            <div className="card-luxury p-6">
              <h3 className="font-heading text-base text-[#F4EFE6] font-medium mb-3">Risiko-risiko Politik</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Momentum reformasi dan <em>policy credibility</em> menjadi sorotan Moody's dan Fitch</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Fragmentasi koalisi: gesekan antara fraksi pendukung kebijakan populis vs fiskal konservatif</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#C6A15B]">→</span>
                  <span>Persepsi <em>democratic backsliding</em> di kalangan investor asing — memicu risk premium yang lebih tinggi</span>
                </li>
              </ul>
            </div>
          </div>

          <p>
            Meski demikian, Indonesia memiliki keunggulan demografis dan SDA yang tetap menjadi pertimbangan utama alokasi asing. Risiko politik yang tinggi tercermin di harga saat ini (IHSG di dekat 7.300-an) — artinya <strong className="text-[#F4EFE6]">sebagian risiko sudah terdiskon</strong>.
          </p>

          {/* ─── BAGIAN 5: RUPIAH ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Rupiah: Antara Tarik-Menarik Eksternal dan Fundamental Domestik</h2>

          <p>
            Rupiah bergerak melemah sepanjang Q1 2026, menembus level psikologis <strong className="text-[#F4EFE6]">Rp 16.300-16.500 per USD</strong>. Pelemahan ini memperparah tekanan di pasar saham dan menjadi umpan balik negatif (<em>feedback loop</em>) antara pasar SBN dan pasar saham.
          </p>

          <div className="card-luxury p-6 space-y-4">
            <h3 className="font-heading text-lg text-[#F4EFE6] font-medium">Tekanan pada Rupiah</h3>

            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Dollar Index (DXY) menguat</strong> — Data ekonomi AS yang resilient dan The Fed yang <em>hawkish</em> menahan suku bunga tinggi lebih lama. DXY bertahan di 104-106.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Current account deficit (CAD) melebar</strong> — Importasi migas naik seiring kenaikan ICP, sementara ekspor komoditas (CPO, batubara, nikel) mulai terkoreksi harga. CAD diperkirakan melebar ke kisaran 1,5-2% dari PDB.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Capital outflow</strong> — Asing melepas kepemilikan SUN dan ekuitas secara simultan, menekan neraca pembayaran dan cadangan devisa Bank Indonesia.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Term of Trade (ToT) memburuk</strong> — Harga barang jadi yang diimpor naik sementara harga komoditas ekspor mulai datar. Ini kompresi margin pendapatan nasional.
              </div>
            </div>
          </div>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B] bg-[#0B0B0A]">
            <p className="text-sm">
              <strong className="text-[#F4EFE6]">Trilema Kebijakan BI:</strong> Bank Indonesia menghadapi pilihan sulit antara (1) menaikkan suku bunga untuk menstabilkan rupiah — memperlambat ekonomi, (2) mempertahankan BI Rate untuk mendorong pertumbuhan — rupiah tertekan, atau (3) intervensi pasar valas — cadangan devisa terkuras.
            </p>
            <p className="text-sm mt-3 text-[#B8AA96]/60">
              Hingga saat ini, BI memilih jalur <em>stabilitas</em>: BI Rate dipertahankan di 5,75% (<em>hold</em> sejak Februari 2025) dengan intervensi ganda di pasar spot dan DNDF.
            </p>
          </div>

          {/* ─── BAGIAN 6: IMPLIKASI STRATEGIS ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Implikasi Investasi dan Strategi Portofolio</h2>

          <p>
            Kombinasi tekanan di atas menempatkan IHSG dalam fase <strong className="text-[#C6A15B]">bearish jangka pendek</strong> namun menarik dari sisi <strong className="text-[#C6A15B]">valuasi jangka panjang</strong>. Di level 7.300-an, IHSG diperdagangkan pada PER sekitar 13-14x (rata-rata historis 15-17x).
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-luxury p-6 border border-emerald-400/20">
              <h3 className="font-heading text-base text-emerald-400 font-medium mb-3">Sektor yang Berpeluang</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Perbankan big caps</strong> (BBCA, BBRI, BMRI) — net interest margin cenderung stabil di lingkungan suku bunga tinggi</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Energi & migas</strong> — diuntungkan kenaikan harga minyak (ADRO, PTBA, MEDC)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Defensif</strong> — consumer staples, telekomunikasi (TLKM, ICBP, UNVR) — sektor dengan permintaan inelastis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Exportir komoditas</strong> — diuntungkan pelemahan rupiah (kecuali harga komoditas turun)</span>
                </li>
              </ul>
            </div>

            <div className="card-luxury p-6 border border-red-400/20">
              <h3 className="font-heading text-base text-red-400 font-medium mb-3">Sektor yang Perlu Diwaspadai</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Importir bahan baku</strong> — margin tertekan pelemahan rupiah (kimia, consumer dengan kandungan impor tinggi)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Properti</strong> — sensitif suku bunga dan daya beli yang menurun</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Teknologi</strong> — valuasi tinggi, sensitif terhadap risk premium dan outflow asing</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-400">→</span>
                  <span><strong className="text-[#F4EFE6]">Small caps</strong> — likuiditas rendah, paling terpukul saat risk-off</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ─── BAGIAN 7: KESIMPULAN ─── */}
          <h2 className="font-heading text-2xl text-[#F4EFE6] font-medium pt-4">Kesimpulan</h2>

          <p>
            IHSG memasuki fase <em>fear driven selling</em> akibat kombinasi tiga isu besar — risiko MSCI, tekanan rating, dan geopolitik minyak — yang diperparah oleh kondisi fiskal yang ketat, politik yang belum stabil, dan rupiah yang melemah. Outflow asing Rp 6,71 triliun dalam dua gelombang menunjukkan tingkat kepanikan yang jarang terlihat.
          </p>

          <div className="card-luxury p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Short-term bearish</strong> — Level 7.250 (MA50) dan 7.000 (MA200) menjadi support kunci. Jika tembus 7.000, potensi turun ke 6.800-6.500 terbuka.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Medium-term attractive</strong> — Valuasi IHSG sudah murah (PER 13-14x). Investor dengan horizon 1-2 tahun bisa mulai akumulasi bertahap di big caps defensif dan perbankan.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Katalis positif yang perlu dipantau:</strong> Penurunan inflasi AS yang memicu pivot The Fed, stabilitas politik domestik, dan perbaikan <em>current account</em> dari hilirisasi.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#C6A15B] mt-2 flex-shrink-0" />
              <div>
                <strong className="text-[#F4EFE6]">Risiko downside:</strong> Eskalasi konflik Iran (minyak $90+), downgrade peringkat investasi Indonesia, atau MSCI demote ke frontier market.
              </div>
            </div>
          </div>

          <div className="card-luxury p-6 border-l-4 border-l-[#C6A15B]">
            <p className="text-sm italic text-[#B8AA96]/80">
              Disclaimer: Artikel ini bersifat informatif dan merupakan hasil analisis independen. Tidak ada afiliasi dengan pihak-pihak yang disebutkan. Selalu lakukan riset dan konsultasi dengan profesional keuangan sebelum mengambil keputusan investasi.
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
