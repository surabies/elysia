export type StatusPemakaian =
  | "Normal"
  | "Melewati Batas"
  | "Anomali"
  | "Tidak Terbaca";

export interface SegmenBlokTarif {
  blok1: number; // Blok 1 (0 - 10 m³), pola titik-titik
  blok2: number; // Blok 2 (11 - 20 m³), pola garis miring
  blok3: number; // Blok 3 (> 20 m³), pola garis datar
}

export interface KejadianMeter {
  tanggal: string; // misal "12 Agu 2026"
  keterangan: string; // misal "Meter diganti"
}

export interface PeriodePemakaian {
  id: string; // misal "2025-05"
  periode: string; // misal "Mei 25"
  bulanTahun: string; // misal "Mei 2025"
  waktuCatat?: string; // misal "22 Okt 14:00 WIB"
  nomorMeter?: string; // misal "MTR-48210"
  segmen: SegmenBlokTarif | null;
  totalM3: number | null; // null jika tidak terbaca
  status: StatusPemakaian;
  isOutlier?: boolean;
  kejadian?: KejadianMeter;
}

export interface SelRingkasan {
  label: string;
  nilai: string;
  selisih: {
    teks: string;
    arah: "up" | "down" | "neutral";
    tone: "positive" | "negative" | "neutral";
  };
  sparkline: number[];
}

export interface RingkasanPemakaianData {
  tingkatTerbaca: SelRingkasan;
  medianPemakaian: SelRingkasan;
  pemakaianTinggiP95: SelRingkasan;
  diAtasBatasWajar: SelRingkasan;
}

export interface InfoSambunganAir {
  nomorSambungan: string; // misal "01-048210"
  nomorMeterDefault: string; // misal "MTR-48210"
  namaPelanggan: string;
  alamat: string;
  golonganTarif: string;
  batasWajarM3: number; // default 30 m³
}
