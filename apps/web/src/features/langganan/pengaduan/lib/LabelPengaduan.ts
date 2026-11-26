import {
  kodeStatusPengaduan,
  NADA_STATUS_PENGADUAN,
  type StatusPengaduan,
  type StatusTagihanTampilan,
} from "@/features/public/lib/format"

export const LABEL_PRIORITAS_PENGADUAN: Record<string, string> = {
  RENDAH: "Rendah",
  NORMAL: "Normal",
  TINGGI: "Tinggi",
  DARURAT: "Darurat",
}

/// Label status staf memakai sudut pandang orang ketiga. Status warga
/// ditulis kepada pelapor dan tidak tepat ditampilkan apa adanya kepada staf.
export const LABEL_STATUS_PENGADUAN_STAF: Record<StatusPengaduan, string> = {
  BARU: "Baru — perlu verifikasi",
  TERVERIFIKASI: "Terverifikasi — belum ditugaskan",
  DITUGASKAN: "Ditugaskan ke petugas",
  MENUJU_LOKASI: "Petugas menuju lokasi",
  DIPROSES: "Sedang ditangani",
  MENUNGGU_PELANGGAN: "Menunggu tanggapan pelapor",
  SELESAI: "Selesai — menunggu konfirmasi pelapor",
  DITUTUP: "Ditutup",
  DIBUKA_KEMBALI: "Dibuka kembali pelapor",
  DITOLAK: "Ditolak",
}

/// Versi ringkas untuk sel grid; status yang menunggu pelapor tetap menyebutnya.
export const LABEL_STATUS_PENGADUAN_STAF_RINGKAS: Record<
  StatusPengaduan,
  string
> = {
  BARU: "Baru",
  TERVERIFIKASI: "Terverifikasi",
  DITUGASKAN: "Ditugaskan",
  MENUJU_LOKASI: "Menuju lokasi",
  DIPROSES: "Ditangani",
  MENUNGGU_PELANGGAN: "Tunggu pelapor",
  SELESAI: "Tunggu konfirmasi",
  DITUTUP: "Ditutup",
  DIBUKA_KEMBALI: "Dibuka kembali",
  DITOLAK: "Ditolak",
}

/// Label untuk aksi transisi status, bukan label keadaan.
export const LABEL_AKSI_STATUS_PENGADUAN: Record<StatusPengaduan, string> = {
  BARU: "Kembalikan ke baru",
  TERVERIFIKASI: "Verifikasi",
  DITUGASKAN: "Tugaskan",
  MENUJU_LOKASI: "Tandai menuju lokasi",
  DIPROSES: "Mulai tangani",
  MENUNGGU_PELANGGAN: "Tunggu tanggapan pelapor",
  SELESAI: "Selesaikan",
  DITUTUP: "Tutup tiket",
  DIBUKA_KEMBALI: "Buka kembali",
  DITOLAK: "Tolak",
}

export function statusPengaduanStaf(status: string): StatusTagihanTampilan {
  const kode = kodeStatusPengaduan(status)
  return {
    label: LABEL_STATUS_PENGADUAN_STAF[kode],
    ...NADA_STATUS_PENGADUAN[kode],
  }
}

/**
 * Daftar Kode Alasan Penolakan Baku (Kuesioner SOP Tirtawening v2.0 Butir I-7 & I-8)
 * Penolakan resmi mewajibkan kode alasan terstruktur + teks alasan spesifik minimal 30 karakter.
 */
export const KODE_ALASAN_PENOLAKAN = [
  {
    kode: "LUAR_TANGGUNG_JAWAB_PDAM",
    judul: "Di Luar Tanggung Jawab PDAM",
    deskripsi: "Kerusakan pada instalasi pipa persil setelah meter air (tanggung jawab pelanggan).",
  },
  {
    kode: "LUAR_WILAYAH_LAYANAN",
    judul: "Di Luar Wilayah Layanan",
    deskripsi: "Titik kejadian berada di luar jangkauan wilayah distribusi Perumda Tirtawening.",
  },
  {
    kode: "TIDAK_DAPAT_DIVERIFIKASI",
    judul: "Tidak Dapat Diverifikasi",
    deskripsi: "Lokasi tidak ditemukan dan pelapor tidak dapat dihubungi setelah 2 kali percobaan.",
  },
  {
    kode: "LAPORAN_FIKTIF_BERTENTANGAN",
    judul: "Laporan Fiktif / Tidak Sah",
    deskripsi: "Laporan fiktif atau permohonan bertentangan dengan ketentuan hukum/SOP resmi.",
  },
] as const

/**
 * Daftar Kode Alasan Penangguhan / Jeda SLA Sah (Kuesioner SOP Tirtawening v2.0 Butir II-3 & II-4)
 * Durasi jeda maksimal 7 hari kalender (168 jam) per periode jeda.
 */
export const KODE_JEDA_SAH_SLA = [
  {
    kode: "MENUNGGU_IZIN_GALIAN",
    judul: "Izin Galian Instansi",
    deskripsi: "Menunggu izin resmi pekerjaan galian dari Dinas Bina Marga / Dishub / Kepolisian.",
  },
  {
    kode: "AKSES_PERSIL_TERTUTUP",
    judul: "Akses Persil Terkunci",
    deskripsi: "Pagar/persil pelanggan terkunci dan upaya kontak pemilik rumah tidak berhasil.",
  },
  {
    kode: "CUACA_EKSTREM_BANJIR",
    judul: "Cuaca Ekstrem / Banjir",
    deskripsi: "Kondisi cuaca atau genangan banjir ekstrem membahayakan keselamatan kerja fisik.",
  },
  {
    kode: "MENUNGGU_INFO_PELANGGAN",
    judul: "Menunggu Info Pelapor",
    deskripsi: "Menunggu kelengkapan informasi, patokan lokasi spesifik, atau foto tambahan dari pelapor.",
  },
] as const
