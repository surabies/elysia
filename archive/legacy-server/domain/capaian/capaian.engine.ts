import {
  TargetBulananItem,
  RealisasiBulananItem,
  PengaturanCapaian,
  BarisProgresBulanan,
  RingkasanTabelProgres,
  BarisTargetRealisasi,
  RingkasanTargetRealisasi,
  KumpulanSeriGrafik,
  CapaianPayloadLengkap,
  StatusBulan,
} from './capaian.types';

export const NAMA_BULAN_INDONESIA = [
  'Desember (Lalu)',
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
];

export const NAMA_BULAN_PENDEK = [
  'Des-Lalu',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ags',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Menghitung jumlah hari kalender dalam bulan tertentu (kabisat-aware).
 * bulan = 0 merujuk ke Desember tahun lalu (31 hari).
 */
export function hitungJumlahHari(tahun: number, bulan: number): number {
  if (bulan === 0) return 31;
  if (bulan < 1 || bulan > 12) return 30;
  // Javascript Date: bulan 1 (Januari) -> new Date(tahun, 1, 0).getDate()
  return new Date(tahun, bulan, 0).getDate();
}

/**
 * Pembagian aman terhadap nol, NaN, atau Infinity.
 */
export function bagiAman(
  pembilang: number | null | undefined,
  penyebut: number | null | undefined,
  desimal: number = 2
): number | null {
  if (
    pembilang === null ||
    pembilang === undefined ||
    penyebut === null ||
    penyebut === undefined ||
    penyebut === 0 ||
    isNaN(pembilang) ||
    isNaN(penyebut)
  ) {
    return null;
  }
  const hasil = pembilang / penyebut;
  if (!isFinite(hasil)) return null;
  const faktor = Math.pow(10, desimal);
  return Math.round(hasil * faktor) / faktor;
}

/**
 * Menghitung Debit Liter Per Detik (LPS) dari volume M³ pemakaian air.
 * Rumus: (m3 * 1000) / (hariAcuan * 86400)
 */
export function hitungLps(
  m3: number | null | undefined,
  hariAcuan: number = 30,
  desimal: number = 2
): number | null {
  if (m3 === null || m3 === undefined || m3 <= 0 || hariAcuan <= 0) {
    return null;
  }
  const detik = hariAcuan * 86400;
  return bagiAman(m3 * 1000, detik, desimal);
}

/**
 * Membangun data Tabel 1: Progres Capaian Bulanan
 */
export function bangunTabelProgres(
  tahun: number,
  realisasiList: RealisasiBulananItem[]
): { baris: BarisProgresBulanan[]; ringkasan: RingkasanTabelProgres } {
  const mapRealisasi = new Map<number, RealisasiBulananItem>();
  for (const item of realisasiList) {
    mapRealisasi.set(item.bulan, item);
  }

  const baris: BarisProgresBulanan[] = [];
  let prevSl: number | null = null;
  let prevM3: number | null = null;
  let prevM3PerSl: number | null = null;
  let prevM3PerSlPerHari: number | null = null;

  // 0 s.d 12
  for (let bulan = 0; bulan <= 12; bulan++) {
    const jmlHari = hitungJumlahHari(tahun, bulan);
    const item = mapRealisasi.get(bulan);
    const sl = item && item.realisasiSl > 0 ? item.realisasiSl : null;
    const m3 = item && item.realisasiM3 > 0 ? Number(item.realisasiM3) : null;

    let status: StatusBulan = 'BELUM';
    if (m3 !== null && sl !== null) {
      status = 'SELESAI';
    }

    const m3PerSl = m3 !== null && sl !== null ? bagiAman(m3, sl, 2) : null;
    const m3PerSlPerHari = m3PerSl !== null ? bagiAman(m3PerSl, jmlHari, 3) : null;

    let deltaSl: number | null = null;
    let deltaM3: number | null = null;
    let deltaM3PerSl: number | null = null;
    let deltaM3PerSlPerHari: number | null = null;

    if (bulan > 0 && sl !== null && prevSl !== null) {
      deltaSl = sl - prevSl;
    }
    if (bulan > 0 && m3 !== null && prevM3 !== null) {
      deltaM3 = Math.round((m3 - prevM3) * 100) / 100;
    }
    if (bulan > 0 && m3PerSl !== null && prevM3PerSl !== null) {
      deltaM3PerSl = Math.round((m3PerSl - prevM3PerSl) * 100) / 100;
    }
    if (bulan > 0 && m3PerSlPerHari !== null && prevM3PerSlPerHari !== null) {
      deltaM3PerSlPerHari = Math.round((m3PerSlPerHari - prevM3PerSlPerHari) * 1000) / 1000;
    }

    baris.push({
      bulan,
      namaBulan: NAMA_BULAN_INDONESIA[bulan],
      jumlahHari: jmlHari,
      realisasiSl: sl,
      realisasiM3: m3,
      m3PerSl,
      m3PerSlPerHari,
      deltaSl,
      deltaM3,
      deltaM3PerSl,
      deltaM3PerSlPerHari,
      status,
    });

    if (sl !== null) prevSl = sl;
    if (m3 !== null) prevM3 = m3;
    if (m3PerSl !== null) prevM3PerSl = m3PerSl;
    if (m3PerSlPerHari !== null) prevM3PerSlPerHari = m3PerSlPerHari;
  }

  // Hitung Ringkasan (Bulan 1 s.d 12 yang aktif/memiliki data)
  const barisAktif = baris.filter((b) => b.bulan >= 1 && b.realisasiM3 !== null && b.realisasiSl !== null);
  const nBulan = barisAktif.length;

  const totalHari = barisAktif.reduce((acc, b) => acc + b.jumlahHari, 0);
  const totalM3 = barisAktif.reduce((acc, b) => acc + (b.realisasiM3 || 0), 0);
  const totalSl = barisAktif.reduce((acc, b) => acc + (b.realisasiSl || 0), 0);

  const rataRataSl = nBulan > 0 ? Math.round(totalSl / nBulan) : 0;
  // Rata-rata tertimbang M3/SL = Total M3 / Total SL (sesuai Bagian 4.4 prompt)
  const m3PerSlTertimbang = totalSl > 0 ? bagiAman(totalM3, totalSl, 2) || 0 : 0;
  // Rata M3/SL/Hari
  const rataM3PerSlPerHari = totalHari > 0 ? bagiAman(totalM3 / (totalSl / nBulan || 1), totalHari, 3) || 0 : 0;

  // Net delta
  const barisDesLalu = baris.find((b) => b.bulan === 0);
  const slDesLalu = barisDesLalu?.realisasiSl || null;
  const m3DesLalu = barisDesLalu?.realisasiM3 || null;

  const slAkhir = nBulan > 0 ? barisAktif[nBulan - 1].realisasiSl : null;
  const m3Akhir = nBulan > 0 ? barisAktif[nBulan - 1].realisasiM3 : null;

  const netDeltaSl = slAkhir !== null && slDesLalu !== null ? slAkhir - slDesLalu : 0;
  const netDeltaM3 = m3Akhir !== null && m3DesLalu !== null ? Math.round((m3Akhir - m3DesLalu) * 100) / 100 : 0;

  return {
    baris,
    ringkasan: {
      totalHari,
      rataRataSl,
      totalM3: Math.round(totalM3 * 100) / 100,
      m3PerSlTertimbang,
      rataM3PerSlPerHari,
      netDeltaSl,
      netDeltaM3,
    },
  };
}

/**
 * Membangun data Tabel 2: Target dan Realisasi Capaian
 */
export function bangunTabelTargetRealisasi(
  targetList: TargetBulananItem[],
  realisasiList: RealisasiBulananItem[],
  pengaturan: PengaturanCapaian
): { baris: BarisTargetRealisasi[]; ringkasan: RingkasanTargetRealisasi } {
  const mapTarget = new Map<number, TargetBulananItem>();
  for (const t of targetList) {
    mapTarget.set(t.bulan, t);
  }

  const mapRealisasi = new Map<number, RealisasiBulananItem>();
  for (const r of realisasiList) {
    mapRealisasi.set(r.bulan, r);
  }

  const baris: BarisTargetRealisasi[] = [];

  for (let bulan = 1; bulan <= 12; bulan++) {
    const t = mapTarget.get(bulan);
    const r = mapRealisasi.get(bulan);

    const targetSl = t ? t.targetSl : 0;
    const targetM3 = t ? Number(t.targetM3) : 0;

    const hasRealisasi = r && (r.realisasiSl > 0 || Number(r.realisasiM3) > 0);
    const realisasiSl = hasRealisasi ? r.realisasiSl : null;
    const realisasiM3 = hasRealisasi ? Number(r.realisasiM3) : null;

    let status: StatusBulan = 'BELUM';
    if (realisasiM3 !== null && realisasiSl !== null) {
      status = 'SELESAI';
    }

    const capaianSlPersen =
      realisasiSl !== null && targetSl > 0
        ? bagiAman(realisasiSl * 100, targetSl, 2)
        : null;

    const capaianM3Persen =
      realisasiM3 !== null && targetM3 > 0
        ? bagiAman(realisasiM3 * 100, targetM3, 2)
        : null;

    const lps = hitungLps(realisasiM3, pengaturan.hariAcuanLps, 2);

    // Selisih M3: Jika bulan belum berjalan, null (Bukan minus target penuh!)
    const selisihM3 =
      realisasiM3 !== null ? Math.round((realisasiM3 - targetM3) * 100) / 100 : null;

    const selisihLps =
      selisihM3 !== null
        ? bagiAman(selisihM3 * 1000, pengaturan.hariAcuanLps * 86400, 2)
        : null;

    baris.push({
      bulan,
      namaBulan: NAMA_BULAN_INDONESIA[bulan],
      targetSl,
      realisasiSl,
      capaianSlPersen,
      targetM3,
      realisasiM3,
      capaianM3Persen,
      lps,
      selisihM3,
      selisihLps,
      status,
      editable: true,
    });
  }

  // Ringkasan
  const barisAktif = baris.filter((b) => b.realisasiM3 !== null && b.realisasiSl !== null);
  const nAktif = barisAktif.length;

  // Target YTD (bulan 1 s.d nAktif)
  const totalTargetSlYtd = baris.slice(0, nAktif).reduce((acc, b) => acc + b.targetSl, 0);
  const rataRataTargetSlYtd = nAktif > 0 ? Math.round(totalTargetSlYtd / nAktif) : 0;

  const totalTargetSlTahunan = baris.reduce((acc, b) => acc + b.targetSl, 0);
  const rataRataTargetSlTahunan = Math.round(totalTargetSlTahunan / 12);

  const totalRealisasiSlYtd = barisAktif.reduce((acc, b) => acc + (b.realisasiSl || 0), 0);
  const rataRataRealisasiSlYtd = nAktif > 0 ? Math.round(totalRealisasiSlYtd / nAktif) : 0;

  const capaianSlYtdPersen =
    rataRataTargetSlYtd > 0
      ? bagiAman(rataRataRealisasiSlYtd * 100, rataRataTargetSlYtd, 2)
      : null;

  const totalTargetM3Ytd = baris.slice(0, nAktif).reduce((acc, b) => acc + b.targetM3, 0);
  const totalTargetM3Tahunan = baris.reduce((acc, b) => acc + b.targetM3, 0);

  const totalRealisasiM3Ytd = barisAktif.reduce((acc, b) => acc + (b.realisasiM3 || 0), 0);

  // Capaian YTD: Realisasi YTD / Target YTD
  const capaianM3YtdPersen =
    totalTargetM3Ytd > 0
      ? bagiAman(totalRealisasiM3Ytd * 100, totalTargetM3Ytd, 2)
      : null;

  // Capaian Tahunan: Realisasi YTD / Target Tahunan (12 bulan)
  const capaianM3TahunanPersen =
    totalTargetM3Tahunan > 0
      ? bagiAman(totalRealisasiM3Ytd * 100, totalTargetM3Tahunan, 2)
      : null;

  // Rata LPS YTD
  const totalLpsYtd = barisAktif.reduce((acc, b) => acc + (b.lps || 0), 0);
  const rataLpsYtd = nAktif > 0 ? bagiAman(totalLpsYtd, nAktif, 2) : null;

  // Selisih M3 YTD = Realisasi YTD - Target YTD
  const selisihM3Ytd =
    nAktif > 0 ? Math.round((totalRealisasiM3Ytd - totalTargetM3Ytd) * 100) / 100 : null;

  const selisihLpsYtd =
    selisihM3Ytd !== null
      ? bagiAman(selisihM3Ytd * 1000, pengaturan.hariAcuanLps * 86400, 2)
      : null;

  return {
    baris,
    ringkasan: {
      rataRataTargetSlYtd,
      rataRataTargetSlTahunan,
      rataRataRealisasiSlYtd,
      capaianSlYtdPersen,
      totalTargetM3Ytd: Math.round(totalTargetM3Ytd * 100) / 100,
      totalTargetM3Tahunan: Math.round(totalTargetM3Tahunan * 100) / 100,
      totalRealisasiM3Ytd: Math.round(totalRealisasiM3Ytd * 100) / 100,
      capaianM3YtdPersen,
      capaianM3TahunanPersen,
      rataLpsYtd,
      selisihM3Ytd,
      selisihLpsYtd,
    },
  };
}

/**
 * Membangun 5 set data untuk visualisasi grafik.
 */
export function bangunKumpulanGrafik(
  tabelProgres: BarisProgresBulanan[],
  tabelTargetRealisasi: BarisTargetRealisasi[]
): KumpulanSeriGrafik {
  // 1. Target vs Realisasi M³ (Jan s.d Des)
  const targetVsRealisasiM3 = tabelTargetRealisasi.map((tr) => ({
    bulan: NAMA_BULAN_PENDEK[tr.bulan],
    targetM3: tr.targetM3,
    realisasiM3: tr.realisasiM3,
  }));

  // 2. Target vs Realisasi M³/SL
  const targetVsRealisasiM3PerSl = tabelTargetRealisasi.map((tr) => {
    const targetM3PerSl = tr.targetSl > 0 ? bagiAman(tr.targetM3, tr.targetSl, 2) : null;
    const realisasiM3PerSl =
      tr.realisasiSl && tr.realisasiM3 ? bagiAman(tr.realisasiM3, tr.realisasiSl, 2) : null;
    return {
      bulan: NAMA_BULAN_PENDEK[tr.bulan],
      targetM3PerSl,
      realisasiM3PerSl,
    };
  });

  // 3. SL Target vs Realisasi
  const slTargetVsRealisasi = tabelTargetRealisasi.map((tr) => ({
    bulan: NAMA_BULAN_PENDEK[tr.bulan],
    targetSl: tr.targetSl,
    realisasiSl: tr.realisasiSl,
  }));

  // 4. Delta M³ Kenaikan/Penurunan (Jan s.d Des)
  const deltaM3 = tabelProgres
    .filter((tp) => tp.bulan >= 1)
    .map((tp) => {
      let tipe: 'NAIK' | 'TURUN' | 'NETRAL' = 'NETRAL';
      if (tp.deltaM3 !== null) {
        if (tp.deltaM3 > 0) tipe = 'NAIK';
        else if (tp.deltaM3 < 0) tipe = 'TURUN';
      }
      return {
        bulan: NAMA_BULAN_PENDEK[tp.bulan],
        deltaM3: tp.deltaM3,
        tipe,
      };
    });

  // 5. M³/SL/Hari (Des-Lalu s.d Des)
  const m3PerSlPerHari = tabelProgres.map((tp) => ({
    bulan: NAMA_BULAN_PENDEK[tp.bulan],
    m3PerSlPerHari: tp.m3PerSlPerHari,
  }));

  return {
    targetVsRealisasiM3,
    targetVsRealisasiM3PerSl,
    slTargetVsRealisasi,
    deltaM3,
    m3PerSlPerHari,
  };
}

/**
 * Domain Engine Entrypoint:
 * Menghitung keseluruhan data Capaian dari target, realisasi, dan parameter.
 */
export function prosesHitungCapaian(
  wilayahId: string,
  tahun: number,
  targetList: TargetBulananItem[],
  realisasiList: RealisasiBulananItem[],
  pengaturan: PengaturanCapaian = { hariAcuanLps: 30 }
): CapaianPayloadLengkap {
  const tabelProgres = bangunTabelProgres(tahun, realisasiList);
  const tabelTargetRealisasi = bangunTabelTargetRealisasi(
    targetList,
    realisasiList,
    pengaturan
  );
  const grafik = bangunKumpulanGrafik(
    tabelProgres.baris,
    tabelTargetRealisasi.baris
  );

  return {
    wilayahId,
    tahun,
    pengaturan,
    tabelProgres,
    tabelTargetRealisasi,
    grafik,
  };
}
