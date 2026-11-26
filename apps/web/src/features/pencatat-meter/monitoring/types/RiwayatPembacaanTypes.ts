export type StatusSesi =
  | "Tercatat"
  | "Anomali Tinggi"
  | "Libur"
  | "Tuntas"
  | "Terlambat"
  | "Gagal"
  | "Dilewati";

export interface SesiBacaRute {
  id: string;
  tanggal: string; // misal "10 Nov" atau "10 Nov 2026"
  status: StatusSesi;
  durasiMenit: number; // durasi dalam menit
  meterTerbaca: number; // Volume SL dibaca hari itu
  totalMeter: number; // Target beban rute / harian
  kubikasiM3?: number; // Total volume air m3 terbaca
  anomaliCount?: number; // Jumlah temuan anomali
  petugasNama: string;
  waktuSelesaiTeks?: string; // misal "Sesi 10 Nov"
}

export interface ItemRuteBaca {
  id: string; // misal "petugas-01" atau "rute-01"
  nama: string; // misal "Petugas IWAN"
  seksiWilayah: string; // misal "wilayah operasional · 1 rute binaan"
  jumlahPelanggan: number; // Total target beban SL (misal 2.506)
  totalTerbaca?: number; // Total SL aktual yang telah dibaca periode ini
  capaianPersen?: number; // (totalTerbaca / jumlahPelanggan) * 100
  petugasDefault: string;
  isNonaktif?: boolean;
  sesiList: SesiBacaRute[]; // Deret kalender hari siklus (1 s.d. 20)
}

export interface RingkasanRuteData {
  // Metrik Operasional Riil PDAM
  totalMeterTerbaca: number; // Total SL terbaca semua petugas (misal 22.549 SL)
  targetKotaTotal: number; // Total target beban SL
  capaianKotaPersen: number; // % capaian total kota
  rataRataLajuHarian: number; // Rata-rata SL per hari kerja aktif
  hariKerjaAktif: number; // Jumlah hari dengan transaksi catat > 0
  totalHariSiklus: number; // Total hari siklus kalender (20 hari)
  puncakPembacaanSL: number; // Volume SL hari tertinggi
  puncakTanggalTeks: string; // Tanggal puncak (misal "13 Nov")
  totalPetugasAktif: number; // Jumlah petugas aktif
  totalAnomaliSiklus: number; // Total temuan anomali

  // Properti kompatibilitas untuk unit test dan integrasi lama
  sesiTuntasPersen: number;
  selisihVsSebelumnyaPts: number;
  totalSesi: number;
  totalTuntas: number;
  totalBermasalah: number;
  ruteBermasalahCount: number;
  totalRuteCount: number;
  rangkaianTerpanjangBermasalah: number;
  sesiTerlamaP95Teks: string;
  sesiTerlamaRuteNama: string;
  durasiRataRataTeks?: string;
}
