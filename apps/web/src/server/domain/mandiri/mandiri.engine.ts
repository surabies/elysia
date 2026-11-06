/**
 * Domain Engine: Jendela Waktu Pelaporan Mandiri & Geofencing Spasial
 * 100% Pure Business Logic (Bebas dari I/O, Database, dan Framework HTTP)
 *
 * Menerapkan waktu WIB (UTC+7) secara deterministik untuk mencegah
 * perbedaan hari antara UTC dengan waktu lokal pelanggan Bandung.
 */

export const TANGGAL_BUKA_LAPOR_MANDIRI = 1;
export const TANGGAL_TUTUP_LAPOR_MANDIRI = 25;
export const MAKS_JARAK_GEOFENCE_METER = 50; // Ambang toleransi jarak foto dari rumah pelanggan

const OFFSET_WIB_MS = 7 * 60 * 60 * 1000;

const NAMA_BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

/**
 * Mengonversi objek Date UTC ke ekuivalen waktu WIB
 */
export function keWib(sekarang: Date): Date {
  return new Date(sekarang.getTime() + OFFSET_WIB_MS);
}

export interface JendelaLaporMandiri {
  boleh: boolean;
  tanggal: number;
  periode: number;
  tanggalBuka: number;
  tanggalTutup: number;
  sisaHari: number | null;
  bukaBerikutnya: string | null;
  pesan: string;
}

/**
 * Memeriksa status pembukaan jendela waktu lapor mandiri (tanggal 1-25 WIB)
 * @param sekarang Timestamp saat ini
 * @param opsi Tanggal buka & tanggal tutup kustom
 */
export function periksaJendelaLaporMandiri(
  sekarang: Date = new Date(),
  opsi: {
    tanggalBuka?: number;
    tanggalTutup?: number;
  } = {}
): JendelaLaporMandiri {
  const tanggalBuka = opsi.tanggalBuka ?? TANGGAL_BUKA_LAPOR_MANDIRI;
  const tanggalTutup = opsi.tanggalTutup ?? TANGGAL_TUTUP_LAPOR_MANDIRI;

  if (
    !Number.isInteger(tanggalBuka) ||
    !Number.isInteger(tanggalTutup) ||
    tanggalBuka < 1 ||
    tanggalBuka > 28 ||
    tanggalTutup < 1 ||
    tanggalTutup > 28 ||
    tanggalBuka > tanggalTutup
  ) {
    throw new RangeError(
      'Jendela laporan mandiri harus berada pada tanggal 1–28 dan tanggal buka tidak boleh melewati tanggal tutup.'
    );
  }

  const wib = keWib(sekarang);
  const tanggal = wib.getUTCDate();
  const bulan = wib.getUTCMonth();
  const tahun = wib.getUTCFullYear();
  const periode = tahun * 100 + (bulan + 1);

  const boleh = tanggal >= tanggalBuka && tanggal <= tanggalTutup;

  if (boleh) {
    const sisaHari = tanggalTutup - tanggal;
    return {
      boleh: true,
      tanggal,
      periode,
      tanggalBuka,
      tanggalTutup,
      sisaHari,
      bukaBerikutnya: null,
      pesan:
        sisaHari === 0
          ? `Hari ini hari TERAKHIR pelaporan bulan ini (tanggal ${tanggalTutup}). Setelah hari ini pelaporan ditutup sampai jendela berikutnya.`
          : `Pelaporan dibuka tanggal ${tanggalBuka}–${tanggalTutup} — tersisa ${sisaHari} hari lagi.`,
    };
  }

  const bulanBuka = tanggal < tanggalBuka ? bulan : (bulan + 1) % 12;
  const tahunBuka = tanggal < tanggalBuka || bulan < 11 ? tahun : tahun + 1;
  const bukaBerikutnya = `${tanggalBuka} ${NAMA_BULAN[bulanBuka]} ${tahunBuka}`;

  return {
    boleh: false,
    tanggal,
    periode,
    tanggalBuka,
    tanggalTutup,
    sisaHari: null,
    bukaBerikutnya,
    pesan:
      `Pelaporan meter mandiri hanya dilayani tanggal ${tanggalBuka}–${tanggalTutup} setiap bulan. ` +
      `Hari ini sudah tanggal ${tanggal}, jadi pelaporan bulan ini sudah ditutup. ` +
      `Silakan laporkan angka meter Anda mulai ${bukaBerikutnya}. ` +
      `Bila meter Anda belum sempat dicatat bulan ini, petugas akan tetap berkunjung sesuai jadwal rutenya.`,
  };
}

export interface HasilEvaluasiGeofence {
  isLokasiValid: boolean;
  jarakMeter: number;
  peringatan?: string;
}

/**
 * Mengevaluasi apakah posisi GPS saat memotret meter air berada dalam radius wajar dari rumah pelanggan
 * @param jarakMeter Jarak terhitung dalam meter (hasil kalkulasi ST_Distance / Haversine)
 * @param ambangBatas Toleransi maksimum (bawaan: 50 meter)
 */
export function evaluasiGeofenceMandiri(
  jarakMeter: number,
  ambangBatas: number = MAKS_JARAK_GEOFENCE_METER
): HasilEvaluasiGeofence {
  if (jarakMeter <= ambangBatas) {
    return {
      isLokasiValid: true,
      jarakMeter,
    };
  }

  return {
    isLokasiValid: false,
    jarakMeter,
    peringatan: `Posisi foto terdeteksi berjarak ${Math.round(jarakMeter)} meter dari koordinat rumah (melebihi toleransi ${ambangBatas} m). Memerlukan verifikasi manual oleh petugas.`,
  };
}
