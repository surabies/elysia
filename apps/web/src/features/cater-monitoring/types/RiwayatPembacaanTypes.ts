export type StatusSesi = "Tuntas" | "Terlambat" | "Gagal" | "Dilewati";

export interface SesiBacaRute {
  id: string;
  tanggal: string; // misal "10 Nov 2026"
  status: StatusSesi;
  durasiMenit: number; // durasi dalam menit
  meterTerbaca: number;
  totalMeter: number;
  petugasNama: string;
  waktuSelesaiTeks?: string; // misal "1 jam lalu"
}

export interface ItemRuteBaca {
  id: string; // misal "rute-01"
  nama: string; // misal "Rute 01 Coblong"
  seksiWilayah: string; // misal "coblong"
  jumlahPelanggan: number; // misal 412
  petugasDefault: string; // misal "Asep S."
  isNonaktif?: boolean;
  sesiList: SesiBacaRute[]; // 20 sesi urut dari terlama (index 0) ke terbaru (index 19)
}

export interface RingkasanRuteData {
  sesiTuntasPersen: number; // misal 95.6
  selisihVsSebelumnyaPts: number; // misal -8.8
  totalSesi: number; // 160
  totalTuntas: number; // 153
  totalBermasalah: number; // 7
  ruteBermasalahCount: number; // 1
  totalRuteCount: number; // 8
  rangkaianTerpanjangBermasalah: number; // 5
  sesiTerlamaP95Teks: string; // "7j 30m"
  sesiTerlamaRuteNama: string; // "Rute 01 Coblong"
}
