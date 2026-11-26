export interface TargetBulananItem {
  bulan: number; // 1 s.d 12
  targetSl: number;
  targetM3: number;
  versi?: number;
  catatan?: string | null;
}

export interface RealisasiBulananItem {
  bulan: number; // 0 = Des tahun lalu, 1 s.d 12 = Jan s.d Des
  realisasiSl: number;
  realisasiM3: number;
  sumber?: string;
  dikunci?: boolean;
}

export interface PengaturanCapaian {
  hariAcuanLps: number; // default 30
}

export type StatusBulan = 'SELESAI' | 'BERJALAN' | 'BELUM';

export interface BarisProgresBulanan {
  bulan: number;
  namaBulan: string;
  jumlahHari: number;
  realisasiSl: number | null;
  realisasiM3: number | null;
  m3PerSl: number | null;
  m3PerSlPerHari: number | null;
  deltaSl: number | null;
  deltaM3: number | null;
  deltaM3PerSl: number | null;
  deltaM3PerSlPerHari: number | null;
  status: StatusBulan;
}

export interface RingkasanTabelProgres {
  totalHari: number;
  rataRataSl: number;
  totalM3: number;
  m3PerSlTertimbang: number;
  rataM3PerSlPerHari: number;
  netDeltaSl: number;
  netDeltaM3: number;
}

export interface BarisTargetRealisasi {
  bulan: number;
  namaBulan: string;
  targetSl: number;
  realisasiSl: number | null;
  capaianSlPersen: number | null;
  targetM3: number;
  realisasiM3: number | null;
  capaianM3Persen: number | null;
  lps: number | null;
  selisihM3: number | null;
  selisihLps: number | null;
  status: StatusBulan;
  editable: boolean;
}

export interface RingkasanTargetRealisasi {
  rataRataTargetSlYtd: number;
  rataRataTargetSlTahunan: number;
  rataRataRealisasiSlYtd: number;
  capaianSlYtdPersen: number | null;
  totalTargetM3Ytd: number;
  totalTargetM3Tahunan: number;
  totalRealisasiM3Ytd: number;
  capaianM3YtdPersen: number | null;
  capaianM3TahunanPersen: number | null;
  rataLpsYtd: number | null;
  selisihM3Ytd: number | null;
  selisihLpsYtd: number | null;
}

export interface PointGrafikTargetRealisasiM3 {
  bulan: string;
  targetM3: number;
  realisasiM3: number | null;
}

export interface PointGrafikTargetRealisasiM3PerSl {
  bulan: string;
  targetM3PerSl: number | null;
  realisasiM3PerSl: number | null;
}

export interface PointGrafikSlTargetRealisasi {
  bulan: string;
  targetSl: number;
  realisasiSl: number | null;
}

export interface PointGrafikDeltaM3 {
  bulan: string;
  deltaM3: number | null;
  tipe: 'NAIK' | 'TURUN' | 'NETRAL';
}

export interface PointGrafikM3PerSlPerHari {
  bulan: string;
  m3PerSlPerHari: number | null;
}

export interface KumpulanSeriGrafik {
  targetVsRealisasiM3: PointGrafikTargetRealisasiM3[];
  targetVsRealisasiM3PerSl: PointGrafikTargetRealisasiM3PerSl[];
  slTargetVsRealisasi: PointGrafikSlTargetRealisasi[];
  deltaM3: PointGrafikDeltaM3[];
  m3PerSlPerHari: PointGrafikM3PerSlPerHari[];
}

export interface CapaianPayloadLengkap {
  wilayahId: string;
  tahun: number;
  pengaturan: PengaturanCapaian;
  tabelProgres: {
    baris: BarisProgresBulanan[];
    ringkasan: RingkasanTabelProgres;
  };
  tabelTargetRealisasi: {
    baris: BarisTargetRealisasi[];
    ringkasan: RingkasanTargetRealisasi;
  };
  grafik: KumpulanSeriGrafik;
}
