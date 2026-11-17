import type {
  BenefitsContent,
  FeatureSectionContent,
  HeroContent,
  TicketingContent,
  TopEventsContent,
} from "@/types/home"

export const heroContent: HeroContent = {
  title: "URUSAN AIR\nDALAM\nGENGGAMAN",
  description:
    "Layanan digital terpadu PERUMDA Tirtawening Kota Bandung. Cek tagihan rekening air, laporkan angka meter mandiri, dan sampaikan pengaduan gangguan secara cepat, transparan, serta terverifikasi 24 jam.",
  videoSrc: "/vid/hero.mp4",
  cta: { label: "Cek Tagihan Air", href: "/cek-tagihan" },
}

export const topEventsContent: TopEventsContent = {
  title: "Layanan Unggulan Pelanggan",
  description:
    "Akses langsung seluruh kanal pelayanan mandiri dan informasi operasional air minum perpipaan Kota Bandung tanpa perlu datang ke kantor pelayanan.",
  cta: { label: "Buka Peta Kendali", href: "/peta-pengaduan" },
  events: [
    {
      id: "1",
      title: "Cek Tagihan Air",
      venue: "Layanan Mandiri 24 Jam",
      city: "Kota Bandung",
      date: "Online 24 Jam",
      price: "12 Periode",
      accentColor: "#00d8af",
    },
    {
      id: "2",
      title: "Lapor Stand Meter",
      venue: "Pembacaan Mandiri",
      city: "Kota Bandung",
      date: "Tgl 1 - 20 Tiap Bulan",
      price: "Kirim Foto",
      accentColor: "#24afee",
    },
    {
      id: "3",
      title: "Pengaduan Air",
      venue: "Tim Reaksi Cepat",
      city: "Kota Bandung",
      date: "Respon Cepat",
      price: "Tiket Aduan",
      accentColor: "#f2ef1d",
    },
    {
      id: "4",
      title: "Peta Gangguan Air",
      venue: "Sistem GIS Operasional",
      city: "Kota Bandung",
      date: "Live Monitoring",
      price: "Peta Digital",
      accentColor: "#4bfa94",
    },
    {
      id: "5",
      title: "Pasang Sambungan Baru",
      venue: "Pelayanan Pasang Baru",
      city: "Kota Bandung",
      date: "Senin - Jumat",
      price: "Rumah & Niaga",
      accentColor: "#a783ff",
    },
    {
      id: "6",
      title: "Info Pemeliharaan",
      venue: "Pusat Distribusi Jaringan",
      city: "Kota Bandung",
      date: "Pembaruan Real-Time",
      price: "Jadwal Pipa",
      accentColor: "#0000fe",
    },
  ],
}

export const ticketingContent: TicketingContent = {
  title: "Kemudahan Layanan Mandiri",
  subtitle:
    "Tiga langkah praktis mengelola kebutuhan air minum rumah tangga Anda langsung dari ponsel tanpa antre di loket.",
  items: [
    {
      title: "Cek Tagihan & Riwayat 12 Bulan",
      badge: "Langkah 01 · Instan",
      description:
        "Cek rincian tagihan rekening air dan grafik pemakaian 12 bulan terakhir dalam hitungan detik.",
      href: "/cek-tagihan",
      ctaLabel: "Cek Tagihan Sekarang",
      image: {
        src: "/images/layanan/tagihan.png",
        alt: "Cek Tagihan Rekening Air Tirtawening",
      },
    },
    {
      title: "Lapor Stand Meter Mandiri",
      badge: "Langkah 02 · Tgl 1–20",
      description:
        "Foto dan laporkan angka stand meter air sendiri dari rumah sebelum tanggal 20 agar tagihan selalu presisi.",
      href: "/lapor-meter",
      ctaLabel: "Kirim Foto Meter",
      image: {
        src: "/images/layanan/lapor.png",
        alt: "Lapor Stand Meter Mandiri",
      },
    },
    {
      title: "Lapor & Lacak Pengaduan GIS",
      badge: "Langkah 03 · Respon TRC",
      description:
        "Laporkan titik pipa bocor atau aliran keruh di peta interaktif untuk langsung ditangani teknisi lapangan.",
      href: "/pengaduan-air",
      ctaLabel: "Buat Tiket Pengaduan",
      image: {
        src: "/images/layanan/peta.png",
        alt: "Peta Kendali Pengaduan & Gangguan Spasial",
      },
    },
  ],
}

export const benefitsContent: BenefitsContent = {
  title: "Mengapa Layanan Digital Tirtawening?",
  subtitle:
    "Dirancang dengan standar keterbukaan informasi publik, verifikasi berjenjang, dan kecepatan respons lapangan.",
  items: [
    {
      title: "Transparansi perhitungan kubikasi pemakaian air tanpa biaya tersembunyi",
      description:
        "Setiap blok progresif pemakaian air (m³), beban tetap, dan pemeliharaan meter dirinci secara terbuka sesuai golongan tarif resmi.",
      metric: "100% Transparan",
      icon: {
        src: "/icons/benefits/transparansi-tarif.svg",
        alt: "Transparansi Tarif",
      },
      image: {
        src: "/images/benefits/transparansi.webp.png",
        alt: "Transparansi Tarif Rekening Air Tirtawening",
      },
    },
    {
      title: "Kemudahan lapor mandiri dengan verifikasi foto meteran oleh staf resmi",
      description:
        "Setiap foto stand meter yang dikirim warga diperiksa secara berjenjang oleh verifikator sebelum disahkan menjadi dasar tagihan.",
      metric: "Verifikasi 3 Lapis",
      icon: {
        src: "/icons/benefits/lapor-meter.svg",
        alt: "Verifikasi Cepat",
      },
      image: {
        src: "/images/benefits/lapor-meter.webp.png",
        alt: "Verifikasi Stand Meter Air Tirtawening",
      },
    },
    {
      title: "Tindak lanjut pengaduan kebocoran pipa oleh Tim Reaksi Cepat di lapangan",
      description:
        "Koordinat GPS laporan Anda diteruskan langsung ke regu teknisi terdekat lengkap dengan estimasi SLA dan bukti foto penyelesaian.",
      metric: "Siaga < 6 Jam",
      icon: {
        src: "/icons/benefits/reaksi-cepat.svg",
        alt: "Reaksi Cepat",
      },
      image: {
        src: "/images/benefits/reaksi-cepat.webp.png",
        alt: "Tim Reaksi Cepat Lapangan Tirtawening",
      },
    },
  ],
}

export const featureSections: FeatureSectionContent[] = [
  {
    id: "jaringan-cakupan",
    badge: "Infrastruktur & Distribusi Spasial",
    title: "Jangkauan Jaringan Pipa Air Minum se-Kota Bandung",
    description:
      "PERUMDA Tirtawening mengalirkan air minum perpipaan ke lebih dari 170.000 sambungan pelanggan di wilayah utara, timur, barat, dan selatan Kota Bandung dengan pemantauan kualitas laboratorium berkala.",
    highlights: [
      "Pemantauan tekanan & kontinuitas aliran berbasis zona DMA",
      "Uji laboratorium baku mutu air bersih secara berkala",
      "Peta interaktif cakupan jaringan & titik pekerjaan teknis",
    ],
    stats: [
      { label: "Sambungan Aktif", value: "170.000+" },
      { label: "Wilayah Layanan", value: "30 Kecamatan" },
      { label: "Pantauan GIS", value: "24 Jam Live" },
    ],
    media: {
      type: "image",
      src: "/images/features/jaringan-bandung.png",
      alt: "Peta Jaringan Pipa Air Minum Tirtawening Kota Bandung",
      width: 1122,
      height: 1402,
    },
    mediaPosition: "right",
    cta: { label: "Buka Peta Kendali", href: "/peta-pengaduan" },
  },
  {
    id: "lapor-meter-mandiri",
    badge: "Pencatatan Meter Mandiri",
    title: "Pelaporan Stand Meter Mandiri yang Akurat",
    description:
      "Cegah lonjakan tagihan tak terduga. Ambil foto stand meteran air Anda, masukkan angkanya, dan kirimkan langsung setiap tanggal 1 hingga 20. Staf verifikator kami akan memvalidasi keabsahan data sebelum tagihan diterbitkan.",
    highlights: [
      "Periode pelaporan terbuka setiap tanggal 1–20 bulan berjalan",
      "Kompresi foto otomatis yang hemat kuota & cepat diunggah",
      "Bukti tanda terima digital & pelacakan status verifikasi real-time",
    ],
    stats: [
      { label: "Jadwal Lapor", value: "Tgl 1 – 20" },
      { label: "Validasi Foto", value: "Staf Resmi" },
      { label: "Akurasi Tagihan", value: "Sesuai Stand Riil" },
    ],
    media: {
      type: "mockup",
      name: "lapor-meter",
    },
    mediaPosition: "left",
    cta: { label: "Lapor Meter Sekarang", href: "/lapor-meter" },
  },
  {
    id: "pengaduan-warga",
    badge: "Tim Reaksi Cepat (TRC) 24 Jam",
    title: "Pengaduan Kebocoran & Gangguan Aliran 24 Jam",
    description:
      "Melihat pipa dinas bocor di jalan, air mati, atau meteran air rusak? Laporkan lokasinya dengan penanda peta GPS interaktif. Tiket aduan Anda langsung masuk ke dashboard teknisi reaksi cepat.",
    highlights: [
      "Penandaan titik lokasi kejadian langsung di peta GPS Kota Bandung",
      "Nomor tiket unik untuk memantau linimasa penanganan teknisi",
      "Tiket hanya ditutup setelah warga mengonfirmasi air kembali normal",
    ],
    stats: [
      { label: "Respon Pipa Bocor", value: "< 6 Jam" },
      { label: "Pelacakan Tiket", value: "Transparan" },
      { label: "Akses Pelapor", value: "Seluruh Warga" },
    ],
    media: {
      type: "mockup",
      name: "pengaduan",
    },
    mediaPosition: "right",
    cta: { label: "Kirim Pengaduan Air", href: "/pengaduan-air" },
  },
]
