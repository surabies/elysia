export interface SplashSlide {
  id: string
  text: string
  /**
   * TODO: Ganti dengan foto suasana air bersih / pelayanan Tirtawening beresolusi tinggi
   * di `apps/web/public/images/splash/splash-1.jpg` dst. jika sudah tersedia.
   */
  image: string
}

export const splashConfig = {
  /** Durasi tahan slide pertama sebelum mulai berganti cepat (ms) */
  initialHoldMs: 800,
  /** Interval perpindahan cepat antar slide kata (ms) */
  stepIntervalMs: 280,
  /** Durasi tampilan logo zoom-in di tengah layar putih (ms) */
  logoHoldMs: 1200,
  /** Durasi fade-out seluruh splash screen menuju halaman utama (ms) */
  fadeOutMs: 750,
  skipLabel: "Lewati",
  logo: {
    src: "/logo.png",
    alt: "PERUMDA Tirtawening Kota Bandung",
    title: "TIRTAWENING",
    subtitle: "Perumda Air Minum Kota Bandung",
  },
  slides: [
    {
      id: "slide-1",
      text: "#1",
      image: "/images/features/jaringan-bandung.png",
    },
    {
      id: "slide-2",
      text: "Cek Tagihan",
      image: "/images/layanan/tagihan.png",
    },
    {
      id: "slide-3",
      text: "Pengaduan Air",
      image: "/images/layanan/peta.png",
    },
    {
      id: "slide-4",
      text: "Lapor Meter",
      image: "/images/layanan/lapor.png",
    },
  ] satisfies readonly SplashSlide[],
} as const
